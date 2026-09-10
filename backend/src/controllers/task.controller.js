import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import Employee from "../models/Employee.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { recalculateProject } from "../utils/recalculateProject.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

/**
 * Task Controller
 * Manages task CRUD and the task status/progress/block workflow.
 * After any mutation that affects progress or status, recalculateProject()
 * is called so the parent Project's actualProgress/healthStatus/
 * estimatedCompletionDate stay in sync.
 *
 * NOTE: authorization.middleware.js's checkPermission() has no "tasks"
 * module (it only has "projects", with an "assignTask" action restricted
 * to Super Admin/Admin/Manager). This controller defines its own local
 * permission table, same pattern as employee/leave/department controllers.
 *
 * Role-based Access:
 * - Super Admin, Admin, Manager: Full task management (Manager limited to
 *   projects they manage — see canManageProjectTasks)
 * - Super Admin, Admin, Manager, HR, Accountant: Read (list/report)
 * - Employee: Read own project's tasks they're assigned to (via /my), and
 *   can change status/progress/block-unblock ONLY on tasks assigned to them
 */

// ===== UTILITY FUNCTIONS =====

const checkTaskPermission = (userRole, operation) => {
  const permissions = {
    create: ["Super Admin", "Admin", "Manager"],
    read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
    update: ["Super Admin", "Admin", "Manager"],
    delete: ["Super Admin", "Admin", "Manager"],
  };

  return permissions[operation]?.includes(userRole) || false;
};

const getOwnEmployeeRecord = async (userId) => {
  return await Employee.findOne({ user: userId });
};

/**
 * Super Admin / Admin can manage any task.
 * Manager can only manage tasks belonging to projects they manage.
 */
const canManageProjectTasks = async (user, project) => {
  if (["Super Admin", "Admin"].includes(user.role)) return true;

  if (user.role === "Manager") {
    const ownEmployee = await getOwnEmployeeRecord(user.id);
    if (!ownEmployee) return false;
    return project.manager.toString() === ownEmployee._id.toString();
  }

  return false;
};

const buildTaskFilterQuery = (filters = {}) => {
  const query = {};

  if (filters.project) query.project = filters.project;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;

  if (filters.search) {
    query.title = { $regex: filters.search, $options: "i" };
  }

  if (filters.dueBefore || filters.dueAfter) {
    query.dueDate = {};
    if (filters.dueAfter) query.dueDate.$gte = new Date(filters.dueAfter);
    if (filters.dueBefore) query.dueDate.$lte = new Date(filters.dueBefore);
  }

  return query;
};

const validateDependencies = async (dependencyIds, projectId) => {
  if (!dependencyIds || dependencyIds.length === 0) return [];

  for (const depId of dependencyIds) {
    if (!depId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new apiError(400, `Invalid dependency task ID: ${depId}`);
    }
  }

  const dependencyTasks = await Task.find({ _id: { $in: dependencyIds } });

  if (dependencyTasks.length !== dependencyIds.length) {
    throw new apiError(404, "One or more dependency tasks were not found");
  }

  const outsideProject = dependencyTasks.some(
    (t) => t.project.toString() !== projectId.toString()
  );
  if (outsideProject) {
    throw new apiError(400, "Dependencies must belong to the same project");
  }

  return dependencyIds;
};

const wouldCreateCircularReference = async (taskId, newParentId) => {
  if (taskId.toString() === newParentId.toString()) {
    return true;
  }
  let currentParentId = newParentId;
  while (currentParentId) {
    const parentTask = await Task.findById(currentParentId).select("parentTask");
    if (!parentTask) {
      break;
    }
    if (parentTask.parentTask && parentTask.parentTask.toString() === taskId.toString()) {
      return true;
    }
    currentParentId = parentTask.parentTask;
  }
  return false;
};

// ===== PUBLIC CONTROLLER METHODS =====

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Super Admin, Admin, Manager (Manager limited to own projects)
 */
export const createTask = asyncHandler(async (req, res) => {
  if (!checkTaskPermission(req.user.role, "create")) {
    throw new apiError(403, "Not authorized to create tasks");
  }

  const {
    project,
    assignedTo,
    title,
    description,
    priority,
    estimatedHours,
    startDate,
    dueDate,
    weight,
    dependencies,
    tags,
    parentTask,
  } = req.body;

  if (!project || !assignedTo || !title) {
    throw new apiError(400, "project, assignedTo, and title are required");
  }

  if (!project.match(/^[0-9a-fA-F]{24}$/) || !assignedTo.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid project or assignedTo ID format");
  }

  try {
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      throw new apiError(404, "Project not found");
    }

    if (!(await canManageProjectTasks(req.user, projectDoc))) {
      throw new apiError(403, "You do not manage this project");
    }

    const assignee = await Employee.findById(assignedTo);
    if (!assignee) {
      throw new apiError(404, "Assigned employee not found");
    }

    const validDependencies = await validateDependencies(dependencies, project);

    let validatedParentTask = null;
    if (parentTask) {
      if (!parentTask.match(/^[0-9a-fA-F]{24}$/)) {
        throw new apiError(400, "Invalid parentTask ID format");
      }
      const parentTaskDoc = await Task.findById(parentTask);
      if (!parentTaskDoc) {
        throw new apiError(404, "Parent task not found");
      }
      if (parentTaskDoc.project.toString() !== project.toString()) {
        throw new apiError(400, "Parent task must belong to the same project");
      }
      validatedParentTask = parentTaskDoc._id;
    }

    const newTask = await Task.create({
      project,
      assignedTo,
      title: title.trim(),
      description: description?.trim() || "",
      priority: priority || "Medium",
      estimatedHours: estimatedHours ?? 1,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      weight: weight || 1,
      dependencies: validDependencies,
      tags: tags || [],
      parentTask: validatedParentTask,
    });

    await recalculateProject(project);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "create_task",
      entityType: "Task",
      entityId: newTask._id,
      details: { taskTitle: newTask.title, project },
    });

    await newTask.populate([
      { path: "project", select: "name status" },
      {
        path: "assignedTo",
        select: "designation user",
        populate: { path: "user", select: "fullname email" },
      },
    ]);

    res.status(201).json(
      new apiResponse(201, "Task created successfully", newTask)
    );

    logger.info(`User ${req.user.id} created task: ${newTask._id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error creating task:", error);
    throw new apiError(500, "Error creating task");
  }
});

/**
 * @desc    Get all tasks with filtering, pagination, and sorting
 * @route   GET /api/tasks
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getAllTasks = asyncHandler(async (req, res) => {
  if (!checkTaskPermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view tasks");
  }

  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    project,
    assignedTo,
    status,
    priority,
    search,
    dueBefore,
    dueAfter,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filterQuery = buildTaskFilterQuery({
    project,
    assignedTo,
    status,
    priority,
    search,
    dueBefore,
    dueAfter,
  });

  try {
    const [tasks, totalCount] = await Promise.all([
      Task.find(filterQuery)
        .populate("project", "name status")
        .populate({
          path: "assignedTo",
          select: "designation user",
          populate: { path: "user", select: "fullname email" },
        })
        .populate("parentTask", "title status")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filterQuery),
    ]);

    res.status(200).json(
      new apiResponse(200, "Tasks retrieved successfully", {
        tasks,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
          limit: limitNum,
        },
      })
    );

    logger.info(`${req.user.role} fetched tasks - page: ${pageNum}, limit: ${limitNum}`);
  } catch (error) {
    logger.error("Error fetching tasks:", error);
    throw new apiError(500, "Error fetching tasks");
  }
});

/**
 * @desc    Get logged-in user's own assigned tasks
 * @route   GET /api/tasks/my
 * @access  All authenticated users
 */
export const getMyTasks = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  try {
    const ownEmployee = await getOwnEmployeeRecord(req.user.id);
    if (!ownEmployee) {
      throw new apiError(404, "Employee profile not found for this user");
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filterQuery = { assignedTo: ownEmployee._id };
    if (status) filterQuery.status = status;

    const [tasks, totalCount] = await Promise.all([
      Task.find(filterQuery)
        .populate("project", "name status deadline")
        .populate("parentTask", "title status")
        .sort("-dueDate")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filterQuery),
    ]);

    res.status(200).json(
      new apiResponse(200, "My tasks retrieved successfully", {
        tasks,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
        },
      })
    );

    logger.info(`Employee ${req.user.id} fetched their tasks`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching own tasks:", error);
    throw new apiError(500, "Error fetching your tasks");
  }
});

/**
 * @desc    Get all tasks for a given project
 * @route   GET /api/tasks/project/:projectId
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid project ID format");
  }

  if (!checkTaskPermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view this project's tasks");
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new apiError(404, "Project not found");
    }

    const tasks = await Task.find({ project: projectId })
      .populate({
        path: "assignedTo",
        select: "designation user",
        populate: { path: "user", select: "fullname email" },
      })
      .populate("parentTask", "title status")
      .sort("dueDate")
      .lean();

    res.status(200).json(
      new apiResponse(200, "Project tasks retrieved successfully", {
        project: { id: project._id, name: project.name, status: project.status },
        tasks,
      })
    );

    logger.info(`User ${req.user.id} fetched tasks for project ${projectId}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching project tasks:", error);
    throw new apiError(500, "Error fetching project tasks");
  }
});

/**
 * @desc    Get a single task by ID
 * @route   GET /api/tasks/:id
 * @access  Super Admin, Admin, Manager, HR, Accountant, Employee (own task)
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid task ID format");
  }

  try {
    const task = await Task.findById(id)
      .populate("project", "name status deadline")
      .populate({
        path: "assignedTo",
        select: "designation user",
        populate: { path: "user", select: "fullname email" },
      })
      .populate("dependencies", "title status")
      .populate("parentTask", "title status");

    if (!task) {
      throw new apiError(404, "Task not found");
    }

    const isOwner = task.assignedTo?.user?._id?.toString() === req.user.id;

    if (!checkTaskPermission(req.user.role, "read") && !isOwner) {
      throw new apiError(403, "Not authorized to view this task");
    }

    res.status(200).json(
      new apiResponse(200, "Task retrieved successfully", task)
    );

    logger.info(`User ${req.user.id} viewed task ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching task:", error);
    throw new apiError(500, "Error fetching task");
  }
});

/**
 * @desc    Update task details
 * @route   PUT /api/tasks/:id
 * @access  Super Admin, Admin, Manager (limited to own projects)
 */
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid task ID format");
  }

  if (!checkTaskPermission(req.user.role, "update")) {
    throw new apiError(403, "Not authorized to update tasks");
  }

  const updateData = req.body;
  const protectedFields = ["_id", "project", "createdAt"];
  protectedFields.forEach((field) => delete updateData[field]);

  try {
    const task = await Task.findById(id).populate("project");
    if (!task) {
      throw new apiError(404, "Task not found");
    }

    if (!(await canManageProjectTasks(req.user, task.project))) {
      throw new apiError(403, "You do not manage this task's project");
    }

    if (updateData.assignedTo) {
      if (!updateData.assignedTo.match(/^[0-9a-fA-F]{24}$/)) {
        throw new apiError(400, "Invalid assignedTo ID format");
      }
      const assignee = await Employee.findById(updateData.assignedTo);
      if (!assignee) {
        throw new apiError(404, "Assigned employee not found");
      }
    }

    if (updateData.dependencies) {
      updateData.dependencies = await validateDependencies(
        updateData.dependencies,
        task.project._id
      );
    }

    if (updateData.parentTask !== undefined) {
      if (updateData.parentTask === null || updateData.parentTask === "") {
        updateData.parentTask = null;
      } else {
        if (!updateData.parentTask.match(/^[0-9a-fA-F]{24}$/)) {
          throw new apiError(400, "Invalid parentTask ID format");
        }
        const parentTaskDoc = await Task.findById(updateData.parentTask);
        if (!parentTaskDoc) {
          throw new apiError(404, "Parent task not found");
        }
        if (parentTaskDoc.project.toString() !== task.project._id.toString()) {
          throw new apiError(400, "Parent task must belong to the same project");
        }
        if (await wouldCreateCircularReference(task._id, parentTaskDoc._id)) {
          throw new apiError(400, "Setting this parent task would create a circular dependency");
        }
        updateData.parentTask = parentTaskDoc._id;
      }
    }

    if (typeof updateData.title === "string") updateData.title = updateData.title.trim();
    if (typeof updateData.description === "string") {
      updateData.description = updateData.description.trim();
    }

    Object.assign(task, updateData);
    await task.save();

    await recalculateProject(task.project._id);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "update_task",
      entityType: "Task",
      entityId: task._id,
    });

    await task.populate({
      path: "assignedTo",
      select: "designation user",
      populate: { path: "user", select: "fullname email" },
    });

    res.status(200).json(
      new apiResponse(200, "Task updated successfully", task)
    );

    logger.info(`User ${req.user.id} updated task: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error updating task:", error);
    throw new apiError(500, "Error updating task");
  }
});

/**
 * @desc    Change task status (Pending / In Progress / Completed / Blocked)
 * @route   PUT /api/tasks/:id/status
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 * @note    Uses document.save() (not findByIdAndUpdate) so the model's
 *          pre-save hook — which forces progressPercent to 100 on
 *          Completed and clears blockedReason off Blocked — actually runs.
 */
export const changeTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid task ID format");
  }

  const validStatuses = ["Pending", "In Progress", "Completed", "Blocked"];
  if (!status || !validStatuses.includes(status)) {
    throw new apiError(400, `Status must be one of: ${validStatuses.join(", ")}`);
  }

  try {
    const task = await Task.findById(id).populate({
      path: "assignedTo",
      select: "user",
    });
    if (!task) {
      throw new apiError(404, "Task not found");
    }

    const isOwner = task.assignedTo?.user?.toString() === req.user.id;
    const canManage = await canManageProjectTasks(
      req.user,
      await Project.findById(task.project)
    );

    if (!isOwner && !canManage) {
      throw new apiError(403, "Not authorized to change this task's status");
    }

    task.status = status;
    await task.save();

    await recalculateProject(task.project);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "change_task_status",
      entityType: "Task",
      entityId: task._id,
      details: { newStatus: status },
    });

    res.status(200).json(
      new apiResponse(200, `Task status updated to ${status}`, task)
    );

    logger.info(`User ${req.user.id} changed task ${id} status to ${status}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error changing task status:", error);
    throw new apiError(500, "Error changing task status");
  }
});

/**
 * @desc    Update task progress percentage
 * @route   PUT /api/tasks/:id/progress
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 */
export const updateTaskProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { progressPercent } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid task ID format");
  }

  if (progressPercent === undefined || progressPercent < 0 || progressPercent > 100) {
    throw new apiError(400, "progressPercent is required and must be between 0 and 100");
  }

  try {
    const task = await Task.findById(id).populate({
      path: "assignedTo",
      select: "user",
    });
    if (!task) {
      throw new apiError(404, "Task not found");
    }

    const isOwner = task.assignedTo?.user?.toString() === req.user.id;
    const canManage = await canManageProjectTasks(
      req.user,
      await Project.findById(task.project)
    );

    if (!isOwner && !canManage) {
      throw new apiError(403, "Not authorized to update this task's progress");
    }

    task.progressPercent = progressPercent;
    // Bring a fully-progressed task out of Pending automatically; the
    // pre-save hook will force progressPercent back to 100 if status is
    // already Completed.
    if (progressPercent > 0 && task.status === "Pending") {
      task.status = "In Progress";
    }
    await task.save();

    await recalculateProject(task.project);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "update_task_progress",
      entityType: "Task",
      entityId: task._id,
      details: { progressPercent: task.progressPercent },
    });

    res.status(200).json(
      new apiResponse(200, "Task progress updated successfully", task)
    );

    logger.info(`User ${req.user.id} updated progress on task ${id} to ${task.progressPercent}%`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error updating task progress:", error);
    throw new apiError(500, "Error updating task progress");
  }
});

/**
 * @desc    Mark a task as Blocked with a reason
 * @route   PUT /api/tasks/:id/block
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 */
export const blockTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid task ID format");
  }

  if (!reason || !reason.trim()) {
    throw new apiError(400, "A reason is required to block a task");
  }

  try {
    const task = await Task.findById(id).populate({
      path: "assignedTo",
      select: "user",
    });
    if (!task) {
      throw new apiError(404, "Task not found");
    }

    const isOwner = task.assignedTo?.user?.toString() === req.user.id;
    const canManage = await canManageProjectTasks(
      req.user,
      await Project.findById(task.project)
    );

    if (!isOwner && !canManage) {
      throw new apiError(403, "Not authorized to block this task");
    }

    task.status = "Blocked";
    task.blockedReason = reason.trim();
    await task.save();

    await recalculateProject(task.project);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "block_task",
      entityType: "Task",
      entityId: task._id,
      details: { reason: task.blockedReason },
    });

    res.status(200).json(
      new apiResponse(200, "Task marked as blocked", task)
    );

    logger.info(`User ${req.user.id} blocked task ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error blocking task:", error);
    throw new apiError(500, "Error blocking task");
  }
});

/**
 * @desc    Unblock a task, returning it to "In Progress"
 * @route   PUT /api/tasks/:id/unblock
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 * @note    The model doesn't track the task's pre-Blocked status, so
 *          unblocking assumes "In Progress". Use updateTask/changeTaskStatus
 *          afterward if a different target status is needed.
 */
export const unblockTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid task ID format");
  }

  try {
    const task = await Task.findById(id).populate({
      path: "assignedTo",
      select: "user",
    });
    if (!task) {
      throw new apiError(404, "Task not found");
    }

    if (task.status !== "Blocked") {
      throw new apiError(400, "Task is not currently blocked");
    }

    const isOwner = task.assignedTo?.user?.toString() === req.user.id;
    const canManage = await canManageProjectTasks(
      req.user,
      await Project.findById(task.project)
    );

    if (!isOwner && !canManage) {
      throw new apiError(403, "Not authorized to unblock this task");
    }

    task.status = "In Progress";
    // blockedReason is cleared automatically by the model's pre-save hook
    await task.save();

    await recalculateProject(task.project);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "unblock_task",
      entityType: "Task",
      entityId: task._id,
    });

    res.status(200).json(
      new apiResponse(200, "Task unblocked successfully", task)
    );

    logger.info(`User ${req.user.id} unblocked task ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error unblocking task:", error);
    throw new apiError(500, "Error unblocking task");
  }
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Super Admin, Admin, Manager (limited to own projects)
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid task ID format");
  }

  if (!checkTaskPermission(req.user.role, "delete")) {
    throw new apiError(403, "Not authorized to delete tasks");
  }

  try {
    const task = await Task.findById(id).populate("project");
    if (!task) {
      throw new apiError(404, "Task not found");
    }

    if (!(await canManageProjectTasks(req.user, task.project))) {
      throw new apiError(403, "You do not manage this task's project");
    }

    const dependentCount = await Task.countDocuments({ dependencies: id });
    if (dependentCount > 0) {
      throw new apiError(
        400,
        `Cannot delete task — ${dependentCount} other task(s) depend on it. Remove those dependency links first.`
      );
    }

    const projectId = task.project._id;
    await Task.findByIdAndDelete(id);

    await recalculateProject(projectId);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "delete_task",
      entityType: "Task",
      entityId: id,
    });

    res.status(200).json(
      new apiResponse(200, "Task deleted successfully", { id })
    );

    logger.info(`User ${req.user.id} deleted task: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error deleting task:", error);
    throw new apiError(500, "Error deleting task");
  }
});

export default {
  createTask,
  getAllTasks,
  getMyTasks,
  getTasksByProject,
  getTaskById,
  updateTask,
  changeTaskStatus,
  updateTaskProgress,
  blockTask,
  unblockTask,
  deleteTask,
};