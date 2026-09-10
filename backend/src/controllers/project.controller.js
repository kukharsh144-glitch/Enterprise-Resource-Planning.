import Project from "../models/Project.model.js";
import ProjectMessage from "../models/ProjectMessage.model.js";
import ProjectActivity from "../models/ProjectActivity.model.js";
import ProjectMember from "../models/ProjectMember.model.js";
import Task from "../models/Task.model.js";
import TaskComment from "../models/TaskComment.model.js";
import Notification from "../models/Notification.model.js";
import Employee from "../models/Employee.model.js";
import { autoArrange } from "../services/scheduler.service.js";
import { generateProjectPlan } from "../services/ai.service.js";

/**
 * UTILITY: Calculate weighted project progress from tasks
 * Formula: Σ(task.progress × task.weight) ÷ Σ(task.weight)
 */
const calculateProjectProgress = (tasks) => {
  if (tasks.length === 0) return 0;

  const weightedSum = tasks.reduce((sum, task) => {
    const isDone = task.isCompleted || task.status === "Completed";
    const progress = isDone ? 100 : (task.progressPercent || 0);
    const weight = task.weight || 1;
    return sum + progress * weight;
  }, 0);

  const totalWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

/**
 * UTILITY: Calculate expected progress based on elapsed time
 * Expected Progress = (elapsed time ÷ total planned duration) × 100
 */
const calculateExpectedProgress = (startDate, deadline) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(deadline);

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDuration = end - start;
  const elapsedTime = now - start;

  return Math.round((elapsedTime / totalDuration) * 100);
};

/**
 * UTILITY: Calculate estimated completion date based on current velocity
 * Extrapolates from actual progress gained per elapsed day
 */
const calculateEstimatedCompletionDate = (
  startDate,
  deadline,
  actualProgress
) => {
  if (actualProgress === 0) return deadline;

  const now = new Date();
  const start = new Date(startDate);
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);

  if (elapsedDays === 0) return deadline;

  const progressPerDay = actualProgress / elapsedDays;
  if (progressPerDay === 0) return deadline;

  const remainingProgress = 100 - actualProgress;
  const remainingDays = remainingProgress / progressPerDay;

  const estimated = new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000);
  return estimated > new Date(deadline) ? estimated : new Date(deadline);
};

/**
 * UTILITY: Detect task-level issues (not-started, overdue, blocked)
 */
const detectTaskIssues = (tasks) => {
  const issues = {
    notStarted: [],
    overdue: [],
    blocked: [],
  };

  const now = new Date();

  tasks.forEach((task) => {
    // Not-Started: Pending at 0% and start date has passed
    if (
      task.status === "Pending" &&
      task.progressPercent === 0 &&
      task.startDate &&
      new Date(task.startDate) < now
    ) {
      issues.notStarted.push(task._id);
    }

    // Overdue: Due date passed but not completed
    if (
      task.dueDate &&
      new Date(task.dueDate) < now &&
      task.status !== "Completed"
    ) {
      issues.overdue.push(task._id);
    }

    // Blocked: Any task with Blocked status
    if (task.status === "Blocked") {
      issues.blocked.push({
        taskId: task._id,
        reason: task.blockedReason || "No reason provided",
      });
    }
  });

  return issues;
};

/**
 * UTILITY: Detect slow areas — groups tasks by assignee and flags lagging groups
 */
const detectSlowAreas = (tasks, projectProgress) => {
  const assigneeGroups = {};

  tasks.forEach((task) => {
    const assignee = task.assignedTo?.toString() || "unassigned";
    if (!assigneeGroups[assignee]) {
      assigneeGroups[assignee] = [];
    }
    assigneeGroups[assignee].push(task);
  });

  const slowAreas = [];

  Object.entries(assigneeGroups).forEach(([assignee, assigneeTasks]) => {
    const assigneeProgress = calculateProjectProgress(assigneeTasks);
    const lag = projectProgress - assigneeProgress;

    // Flag if this assignee's tasks lag project average by 10+ points
    if (lag > 10) {
      slowAreas.push({
        assignee,
        taskCount: assigneeTasks.length,
        assigneeProgress,
        projectProgress,
        lag,
      });
    }
  });

  return slowAreas;
};

/**
 * UTILITY: Calculate health status
 * On-Track: within 5 points, no critical blocks
 * At-Risk: 5-15 points behind or isolated issues
 * Likely to Miss: >15 points behind or deadline at risk
 */
const calculateHealthStatus = (
  actualProgress,
  expectedProgress,
  issues,
  estimatedCompletionDate,
  deadline
) => {
  const progressDiff = expectedProgress - actualProgress;

  // Critical: substantial gap and deadline at risk
  if (progressDiff > 15 || estimatedCompletionDate > new Date(deadline)) {
    return "Likely to Miss Deadline";
  }

  // Warning: moderate gap or active blocking issues
  if (progressDiff > 5 || issues.overdue.length > 0 || issues.blocked.length > 0) {
    return "At-Risk";
  }

  // Healthy: on track
  return "On-Track";
};

/**
 * UTILITY: Create activity log entry
 */
const logActivity = async (projectId, actor, action, entityType, entityId) => {
  try {
    await ProjectActivity.create({
      project: projectId,
      actor,
      action,
      entityType,
      entityId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

/**
 * UTILITY: Send notification for @mentions
 */
const notifyMentions = async (mentions, message, notificationType) => {
  if (!mentions || mentions.length === 0) return;

  try {
    const notifications = mentions.map((employeeId) => ({
      user: employeeId,
      message,
      type: notificationType,
      read: false,
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error sending mention notifications:", error);
  }
};

/**
 * UTILITY: Check if user has required role on project
 */
const checkProjectRole = async (userId, projectId, requiredRoles) => {
  try {
    const employee = await Employee.findOne({ user: userId });
    if (!employee) return false;

    const member = await ProjectMember.findOne({
      project: projectId,
      employee: employee._id,
    });

    if (!member) return false;
    return requiredRoles.includes(member.roleInProject);
  } catch (error) {
    return false;
  }
};

/**
 * UTILITY: Recalculate entire project metrics
 */
const recalculateProjectMetrics = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // Fetch all tasks for this project
    const tasks = await Task.find({ project: projectId }).lean();

    // Calculate progress metrics
    const actualProgress = calculateProjectProgress(tasks);
    const expectedProgress = calculateExpectedProgress(
      project.startDate,
      project.deadline
    );
    const estimatedCompletionDate = calculateEstimatedCompletionDate(
      project.startDate,
      project.deadline,
      actualProgress
    );

    // Detect issues
    const issues = detectTaskIssues(tasks);
    const slowAreas = detectSlowAreas(tasks, actualProgress);

    // Calculate health status
    const healthStatus = calculateHealthStatus(
      actualProgress,
      expectedProgress,
      issues,
      estimatedCompletionDate,
      project.deadline
    );

    // Update project with calculated fields
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        actualProgress,
        expectedProgress,
        estimatedCompletionDate,
        healthStatus,
      },
      { new: true }
    );

    return {
      project: updatedProject,
      metrics: {
        actualProgress,
        expectedProgress,
        estimatedCompletionDate,
        healthStatus,
        issues,
        slowAreas,
      },
    };
  } catch (error) {
    console.error("Error recalculating project metrics:", error);
    return null;
  }
};

// ============================================================================
// CONTROLLER METHODS
// ============================================================================

/**
 * AI Plan: Generate initial project plan with tasks
 * POST /projects/ai-plan
 */
export const aiPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { description, startDate, deadline, projectName } = req.body;

    // Validation
    if (!description || !startDate || !deadline || !projectName) {
      return res.status(400).json({
        message: "projectName, description, startDate and deadline are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(deadline);

    if (start >= end) {
      return res.status(400).json({
        message: "startDate must be before deadline",
      });
    }

    // Generate plan via AI service
    const plan = await generateProjectPlan({
      description,
      startDate,
      deadline,
    });

    if (!plan || !plan.tasks) {
      return res.status(400).json({
        message: "AI planner could not generate a valid plan",
      });
    }

    res.status(200).json({
      approved: false,
      plan: {
        projectName,
        description,
        startDate,
        deadline,
        suggestedTasks: plan.tasks,
        reasoning: plan.reasoning || null,
      },
    });
  } catch (error) {
    console.error("AI Planner error:", error);
    res.status(500).json({
      message: "AI planner failed",
      error: error.message,
    });
  }
};

/**
 * Create Project: Creates a new project and optionally seeds it with AI-generated tasks
 * POST /projects
 */
export const createProject = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const {
      name,
      description,
      startDate,
      deadline,
      priority,
      category,
      architecture,
      targetCloud,
      creatorName: providedCreatorName,
      creatorRole: providedCreatorRole,
      tasks: suggestedTasks,
    } = req.body;

    if (!name || !startDate || !deadline) {
      return res.status(400).json({
        message: "name, startDate and deadline are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Allow 24-hour timezone grace margin to prevent UTC date discrepancy failures
    const minAllowed = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (start < minAllowed) {
      return res.status(400).json({
        message: "startDate cannot be before the present date",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        message: "startDate must be before deadline",
      });
    }

    // Resolve creator details
    const creatorName = providedCreatorName || req.user?.fullname || req.user?.name || "Harsh Saini";
    const creatorRole = providedCreatorRole || req.user?.role || "Super Admin";

    // Get employee record for creator, with fallback to any active employee to prevent admin 404 blockages
    let employee = await Employee.findOne({ user: userId });
    if (!employee) {
      employee = await Employee.findOne({ status: "Active" });
      if (!employee) {
        employee = await Employee.findOne({});
      }
    }

    // Create project with creator tracking & architectural specs
    const project = new Project({
      name,
      description: description || "",
      startDate,
      deadline,
      priority: priority || "High",
      category: category || "General",
      architecture: architecture || "",
      targetCloud: targetCloud || "",
      actualProgress: 0,
      expectedProgress: 0,
      estimatedCompletionDate: deadline,
      healthStatus: "On-Track",
      status: "Active",
      manager: employee ? employee._id : undefined,
      createdBy: userId,
      creatorName,
      creatorRole,
    });

    await project.save();

    // Add creator as Manager member if employee record available
    if (employee) {
      await ProjectMember.create({
        project: project._id,
        employee: employee._id,
        roleInProject: "Manager",
        allocationPercent: 100,
      });

      // Log activity
      await logActivity(project._id, employee._id, "created project", "Project", project._id);
    }

    // Seed with AI-generated tasks if provided
    if (suggestedTasks && Array.isArray(suggestedTasks) && suggestedTasks.length > 0) {
      const createdTasks = [];
      const titleToIdMap = {};
      const indexToIdMap = {};

      // First Pass: Create all tasks
      for (let i = 0; i < suggestedTasks.length; i++) {
        const taskData = suggestedTasks[i];
        const task = new Task({
          project: project._id,
          assignedTo: employee._id, // Set default assignee as creator
          title: taskData.title,
          description: taskData.description || "",
          status: "Pending",
          progressPercent: 0,
          weight: taskData.weight || 1,
          priority: taskData.priority || "Medium",
          estimatedHours: taskData.estimatedHours || 8,
          actualHours: 0,
          startDate: taskData.startDate || startDate,
          dueDate: taskData.dueDate || deadline,
          phase: taskData.phase || "Planning",
          category: taskData.category || "backend",
          dependencies: [],
        });

        await task.save();
        createdTasks.push(task);
        
        if (taskData.title) {
          titleToIdMap[taskData.title.toLowerCase().trim()] = task._id;
        }
        indexToIdMap[String(i + 1)] = task._id;
        if (taskData.id) {
          indexToIdMap[String(taskData.id)] = task._id;
        }

        // Log task creation
        await logActivity(project._id, employee._id, "created task", "Task", task._id);
      }

      // Second Pass: Resolve dependencies & parentTask
      for (let i = 0; i < suggestedTasks.length; i++) {
        const taskData = suggestedTasks[i];
        const createdTask = createdTasks[i];

        if (createdTask && taskData.parentTaskTitle) {
          const parentId = titleToIdMap[taskData.parentTaskTitle.toLowerCase().trim()];
          if (parentId) {
            createdTask.parentTask = parentId;
            await createdTask.save();
          }
        }
        
        let deps = [];
        if (taskData.dependencies) {
          if (Array.isArray(taskData.dependencies)) {
            deps = taskData.dependencies;
          } else if (typeof taskData.dependencies === "string") {
            deps = taskData.dependencies.split(",").map(d => d.trim()).filter(Boolean);
          }
        }

        if (deps.length > 0) {
          const resolvedIds = [];
          deps.forEach(dep => {
            const depStr = String(dep).trim();
            let matchedId = titleToIdMap[depStr.toLowerCase()];
            if (!matchedId) {
              matchedId = indexToIdMap[depStr];
            }
            if (matchedId) {
              resolvedIds.push(matchedId);
            }
          });

          if (resolvedIds.length > 0) {
            createdTask.dependencies = resolvedIds;
            await createdTask.save();
          }
        }
      }
    }

    // Recalculate metrics
    const result = await recalculateProjectMetrics(project._id);

    res.status(201).json({
      message: "Project created successfully",
      project: result.project,
      metrics: result.metrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Progress & Health Metrics
 * GET /projects/:id/progress
 */
export const getProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check project exists first
    const project = await Project.findById(id).lean();
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Direct access scoping: Admins see all, others must be managers or members
    const isAdmin = req.user.role === "Super Admin" || req.user.role === "Admin";
    if (!isAdmin) {
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return res.status(403).json({ message: "Access denied: Employee profile not found" });
      }

      const isManager = project.manager?.toString() === employee._id.toString();
      const isMember = await ProjectMember.findOne({ project: id, employee: employee._id });

      if (!isManager && !isMember) {
        return res.status(403).json({ message: "Access denied: You are not a member of this project" });
      }
    }

    const tasks = await Task.find({ project: id })
      .populate({
        path: "assignedTo",
        select: "designation user",
        populate: { path: "user", select: "fullname email" },
      })
      .lean();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) =>
        t.isCompleted ||
        t.status === "Completed" ||
        (typeof t.progressPercent === "number" && t.progressPercent >= 100)
    ).length;
    const exactProgress =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : (typeof project.actualProgress === "number" && project.actualProgress > 0 && totalTasks === 0 ? project.actualProgress : 0);

    // Keep DB synchronized if progress drifted
    if (project.actualProgress !== exactProgress) {
      Project.findByIdAndUpdate(id, { actualProgress: exactProgress }).catch(() => {});
    }

    const issues = detectTaskIssues(tasks);
    const slowAreas = detectSlowAreas(tasks, exactProgress);

    res.status(200).json({
      success: true,
      message: "Project progress retrieved successfully",
      data: {
        projectId: project._id,
        projectName: project.name,
        status: project.status,
        metrics: {
          actualProgress: exactProgress,
          expectedProgress: project.expectedProgress,
          estimatedCompletionDate: project.estimatedCompletionDate,
          healthStatus: project.healthStatus,
          deadline: project.deadline,
        },
        detection: {
          notStartedTasks: issues.notStarted.length,
          overdueTasks: issues.overdue.length,
          blockedTasks: issues.blocked,
          slowAreas,
        },
        tasks,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Task Status & Trigger Progress Recalculation
 * PUT /tasks/:id/status
 * Body: { status: "Pending|In Progress|Completed|Blocked", blockedReason?: string }
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, blockedReason } = req.body;

    const validStatuses = ["Pending", "In Progress", "Completed", "Blocked"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const role = req.user.role;
    const isAuthorized = role === "Super Admin" || role === "Admin";
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    if (!isAuthorized) {
      if (role === "Manager") {
        if (String(project.manager) !== String(employee._id)) {
          return res.status(403).json({ message: "Only the assigned Manager of this project can update task status" });
        }
      } else {
        return res.status(403).json({ message: "You are not authorized to update tasks for this project" });
      }
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === "Blocked" && blockedReason) {
      task.blockedReason = blockedReason;
    } else if (status !== "Blocked") {
      task.blockedReason = null;
    }

    if (status === "Completed") {
      task.progressPercent = 100;
      task.isCompleted = true;
    } else {
      task.isCompleted = false;
      if (status === "Pending") {
        task.progressPercent = 0;
      }
    }

    await task.save();

    if (task.parentTask) {
      await propagateProgress(task.parentTask);
    }

    // Log activity
    await logActivity(
      task.project,
      employee._id,
      `changed status from ${oldStatus} to ${status}`,
      "Task",
      task._id
    );

    // Recalculate project metrics
    const result = await recalculateProjectMetrics(task.project);

    res.status(200).json({
      message: "Task status updated and project metrics recalculated",
      task,
      projectMetrics: result?.metrics || {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Task Progress Percentage
 * PUT /tasks/:id/progress
 * Body: { progressPercent: 0-100, actualHours?: number }
 */
export const updateTaskProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { progressPercent, actualHours } = req.body;

    if (progressPercent === undefined || progressPercent < 0 || progressPercent > 100) {
      return res.status(400).json({
        message: "progressPercent must be a number between 0 and 100",
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const role = req.user.role;
    const isAuthorized = role === "Super Admin" || role === "Admin";
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    if (!isAuthorized) {
      if (role === "Manager") {
        if (String(project.manager) !== String(employee._id)) {
          return res.status(403).json({ message: "Only the assigned Manager of this project can update task progress" });
        }
      } else {
        return res.status(403).json({ message: "You are not authorized to update tasks for this project" });
      }
    }
    const oldProgress = task.progressPercent;

    task.progressPercent = progressPercent;
    task.isCompleted = (progressPercent === 100);
    task.status = progressPercent === 100 ? "Completed" : (progressPercent === 0 ? "Pending" : "In Progress");
    if (actualHours !== undefined && actualHours >= 0) {
      task.actualHours = actualHours;
    }

    await task.save();

    if (task.parentTask) {
      await propagateProgress(task.parentTask);
    }

    // Log activity
    await logActivity(
      task.project,
      employee._id,
      `updated progress from ${oldProgress}% to ${progressPercent}%`,
      "Task",
      task._id
    );

    // Recalculate project metrics
    const result = await recalculateProjectMetrics(task.project);

    res.status(200).json({
      message: "Task progress updated and project metrics recalculated",
      task,
      projectMetrics: result?.metrics || {},
    });
  } catch (error) {
    next(error);
  }
};

async function propagateProgress(parentTaskId) {
  if (!parentTaskId) return;
  const parent = await Task.findById(parentTaskId);
  if (!parent) return;

  const subtasks = await Task.find({ parentTask: parent._id });
  if (subtasks.length > 0) {
    const completedCount = subtasks.filter(s => s.isCompleted).length;
    const progress = Math.round((completedCount / subtasks.length) * 100);

    parent.progressPercent = progress;
    if (progress === 0) {
      parent.status = "Pending";
    } else if (progress === 100) {
      parent.status = "Completed";
    } else {
      parent.status = "In Progress";
    }

    await parent.save();

    // Recursively propagate parent tasks up the hierarchy
    if (parent.parentTask) {
      await propagateProgress(parent.parentTask);
    }
  }
};

export const updateSubtaskCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { isCompleted } = req.body;

    if (isCompleted === undefined) {
      return res.status(400).json({
        message: "isCompleted is required",
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const role = req.user.role;
    const isAuthorized = role === "Super Admin" || role === "Admin";
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    if (!isAuthorized) {
      if (role === "Manager") {
        if (String(project.manager) !== String(employee._id)) {
          return res.status(403).json({ message: "Only the assigned Manager of this project can update subtask completion" });
        }
      } else {
        return res.status(403).json({ message: "You are not authorized to update tasks for this project" });
      }
    }

    // Toggle subtask completion state
    task.isCompleted = isCompleted;
    if (isCompleted) {
      task.progressPercent = 100;
      task.status = "Completed";
    } else {
      task.progressPercent = 0;
      task.status = "Pending";
    }

    await task.save();

    // Log activity
    await logActivity(
      task.project,
      employee._id,
      `marked subtask '${task.title}' as ${isCompleted ? 'completed' : 'incomplete'}`,
      "Task",
      task._id
    );

    // Propagate up to parents recursively
    if (task.parentTask) {
      await propagateProgress(task.parentTask);
    }

    // Fetch final values
    const updatedSubtask = await Task.findById(id);
    let parentTask = null;
    if (task.parentTask) {
      parentTask = await Task.findById(task.parentTask);
    }

    const result = await recalculateProjectMetrics(task.project);

    res.status(200).json({
      message: "Subtask completion updated successfully",
      task: updatedSubtask,
      parentTask,
      projectMetrics: result?.metrics || {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post Task Comment
 * POST /tasks/:id/comments
 * Body: { message: string, mentions?: [employeeIds] }
 */
export const postTaskComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { message, mentions } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Comment message cannot be empty" });
    }

    const task = await Task.findById(id).populate("project");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    const comment = new TaskComment({
      task: id,
      author: employee._id,
      message: message.trim(),
      mentions: mentions || [],
    });

    await comment.save();

    // Log activity
    await logActivity(
      task.project._id,
      employee._id,
      "posted task comment",
      "Comment",
      comment._id
    );

    // Send notifications for @mentions
    const mentionMessage = `${employee.user} mentioned you in a task comment`;
    await notifyMentions(mentions, mentionMessage, "task_comment_mention");

    // Emit via Socket.io
    const io = req.app.get("io");
    io.to(`task:${id}`).emit("comment:new", {
      ...comment.toObject(),
      author: employee,
    });

    res.status(201).json({
      message: "Comment posted successfully",
      comment: await comment.populate("author mentions"),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post Project Team Chat Message
 * POST /projects/:id/messages
 * Body: { message: string, mentions?: [employeeIds] }
 */
export const postMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { message, mentions } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Check project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    let employee = await Employee.findOne({ user: userId });
    if (!employee) {
      employee = await Employee.findOne();
    }

    if (!employee) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    // Verify user is a project member or admin/manager; auto-join if employee
    const isAdmin = req.user.role === "Super Admin" || req.user.role === "Admin";
    const isManager = project.manager?.toString() === employee._id?.toString();

    if (!isAdmin && !isManager) {
      const isMember = await ProjectMember.findOne({
        project: id,
        employee: employee._id,
      });

      if (!isMember) {
        await ProjectMember.create({ project: id, employee: employee._id, role: "Member" }).catch(() => {});
      }
    }

    const chatMessage = new ProjectMessage({
      project: id,
      sender: employee._id,
      message: message.trim(),
      mentions: mentions || [],
    });

    await chatMessage.save();

    // Log activity
    await logActivity(id, employee._id, "posted team message", "Message", chatMessage._id);

    // Send notifications for @mentions
    const mentionMessage = `${req.user.fullname || 'Team member'} mentioned you in project chat`;
    await notifyMentions(mentions, mentionMessage, "project_message_mention");

    // Emit via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`project:${id}`).emit("message:new", {
        ...chatMessage.toObject(),
        sender: employee,
      });
    }

    res.status(201).json({
      success: true,
      message: "Message posted successfully",
      data: await chatMessage.populate({
        path: "sender",
        select: "designation user",
        populate: { path: "user", select: "fullname email" }
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Team Chat Messages
 * GET /projects/:id/messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 60, skip = 0 } = req.query;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const messages = await ProjectMessage.find({ project: id })
      .populate({
        path: "sender",
        select: "designation user",
        populate: { path: "user", select: "fullname email" },
      })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Activity Feed
 * GET /projects/:id/activity
 * Query: { limit?: number (default 50), skip?: number (default 0) }
 */
export const getActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const activities = await ProjectActivity.find({ project: id })
      .populate({
        path: "actor",
        select: "designation user",
        populate: { path: "user", select: "fullname email" },
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totalCount = await ProjectActivity.countDocuments({ project: id });

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger Auto-Arrange: AI/rule-based task scheduling
 * POST /projects/:id/auto-arrange
 * Body: { useAI?: boolean (default: false) }
 */
export const triggerAutoArrange = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { useAI = false } = req.body;

    // Verify user is project manager
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    const isManager = await checkProjectRole(userId, id, ["Manager"]);
    if (!isManager) {
      return res.status(403).json({
        message: "Only project managers can trigger auto-arrange",
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Fetch all incomplete tasks with dependencies
    const tasks = await Task.find({
      project: id,
      status: { $ne: "Completed" },
    })
      .populate("dependencies")
      .lean();

    // Fetch project members for workload balancing
    const members = await ProjectMember.find({ project: id }).populate("employee").lean();

    // Call scheduler service
    const suggestion = await autoArrange({
      tasks,
      members,
      projectDeadline: project.deadline,
      useAI,
    });

    if (!suggestion) {
      return res.status(400).json({
        message: "Could not generate a valid task schedule",
      });
    }

    // Log the suggestion request (but don't apply yet)
    await logActivity(
      id,
      employee._id,
      `triggered auto-arrange suggestion${useAI ? " (AI-assisted)" : ""}`,
      "Project",
      id
    );

    res.status(200).json({
      message: "Task arrangement suggestion generated",
      suggestion: {
        proposedSchedule: suggestion.schedule,
        rationale: suggestion.rationale || "Dependency-aware topological sort with workload balancing",
        estimatedCompletion: suggestion.estimatedCompletion,
        workloadBalancing: suggestion.workloadBalancing,
        warningsOrConflicts: suggestion.warnings || [],
      },
      note: "This is a suggestion for review. Apply manually by updating task dates.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Members & Resource Allocation
 * GET /projects/:id/members
 */
export const getProjectMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const members = await ProjectMember.find({ project: id })
      .populate({
        path: "employee",
        select: "user email designation department",
        populate: { path: "user", select: "fullname email avatar" },
      })
      .lean();

    res.status(200).json({
      projectId: id,
      projectName: project.name,
      members: members.map((m) => ({
        memberId: m._id,
        employee: m.employee,
        roleInProject: m.roleInProject,
        allocationPercent: m.allocationPercent,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Project Member
 * POST /projects/:id/members
 * Body: { employeeId: string, roleInProject: "Manager|Member", allocationPercent: number }
 */
export const addProjectMember = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { employeeId, roleInProject, allocationPercent } = req.body;

    // Verify user is project manager
    const isManager = await checkProjectRole(userId, id, ["Manager"]);
    if (!isManager) {
      return res.status(403).json({
        message: "Only project managers can add members",
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if already a member
    const existing = await ProjectMember.findOne({
      project: id,
      employee: employeeId,
    });

    if (existing) {
      return res.status(400).json({
        message: "Employee is already a member of this project",
      });
    }

    const member = new ProjectMember({
      project: id,
      employee: employeeId,
      roleInProject: roleInProject || "Member",
      allocationPercent: allocationPercent || 50,
    });

    await member.save();

    // Log activity
    const currentEmployee = await Employee.findOne({ user: userId });
    await logActivity(
      id,
      currentEmployee._id,
      `added ${employee.user} as ${roleInProject || "Member"}`,
      "Member",
      member._id
    );

    res.status(201).json({
      message: "Project member added successfully",
      member: await member.populate("employee"),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Employee's Cross-Project Task List
 * GET /employees/:id/my-tasks
 * Query: { status?: string, projectId?: string }
 */
export const getEmployeeTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, projectId } = req.query;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let query = { assignedTo: id };

    if (status) {
      query.status = status;
    }

    if (projectId) {
      query.project = projectId;
    }

    const tasks = await Task.find(query)
      .populate("project", "name deadline healthStatus")
      .populate("assignedTo", "user email")
      .sort({ dueDate: 1 })
      .lean();

    res.status(200).json({
      employeeId: id,
      employeeName: employee.user,
      taskCount: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project's Task Comments
 * GET /projects/:id/tasks/:taskId/comments
 */
export const getTaskComments = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task || task.project.toString() !== id) {
      return res.status(404).json({ message: "Task not found in this project" });
    }

    const comments = await TaskComment.find({ task: taskId })
      .populate("author", "user email")
      .populate("mentions", "user email")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      taskId,
      commentCount: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

const getScopedProjectQuery = async (req) => {
  const role = req.user.role;
  const isAdmin = role === "Super Admin" || role === "Admin";
  if (isAdmin) {
    return {};
  }

  const employee = await Employee.findOne({ user: req.user.id });
  if (!employee) {
    return null;
  }

  if (role === "Manager") {
    return { manager: employee._id };
  }

  // Employee and other staff roles: see only projects they are members of
  const memberRecords = await ProjectMember.find({ employee: employee._id }).select("project");
  const projectIds = memberRecords.map(m => m.project);

  return { _id: { $in: projectIds } };
};

export const getProjects = async (req, res, next) => {
  try {
    const query = await getScopedProjectQuery(req);
    if (query === null) {
      return res.status(200).json({
        message: "Projects retrieved successfully",
        data: []
      });
    }

    const projects = await Project.find(query)
      .populate({
        path: "manager",
        populate: { path: "user", select: "fullname avatar" }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate exact live task statistics for all queried projects
    const projectIds = projects.map(p => p._id);
    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: "$project",
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "Completed"] },
                    { $eq: ["$isCompleted", true] },
                    { $gte: ["$progressPercent", 100] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const statsMap = new Map();
    taskStats.forEach(s => statsMap.set(String(s._id), s));

    const projectsWithExactProgress = projects.map(p => {
      const stats = statsMap.get(String(p._id));
      const total = stats ? stats.totalTasks : 0;
      const completed = stats ? stats.completedTasks : 0;
      const exactProgress = total > 0
        ? Math.round((completed / total) * 100)
        : (typeof p.actualProgress === 'number' && p.actualProgress > 0 && total === 0 ? p.actualProgress : 0);

      return {
        ...p,
        totalTasks: total,
        completedTasks: completed,
        actualProgress: exactProgress,
        progress: exactProgress
      };
    });

    res.status(200).json({
      message: "Projects retrieved successfully",
      data: projectsWithExactProgress
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectStatistics = async (req, res, next) => {
  try {
    const query = await getScopedProjectQuery(req);
    if (query === null) {
      return res.status(200).json({
        message: "Project statistics retrieved successfully",
        data: {
          total: 0,
          active: 0,
          completed: 0,
          onHold: 0
        }
      });
    }

    const totalProjects = await Project.countDocuments(query);
    const activeProjects = await Project.countDocuments({ ...query, status: "Active" });
    const completedProjects = await Project.countDocuments({ ...query, status: "Completed" });
    const onHoldProjects = await Project.countDocuments({ ...query, status: "On-Hold" });

    res.status(200).json({
      message: "Project statistics retrieved successfully",
      data: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        onHold: onHoldProjects
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Allot an employee to all tasks in a specific project phase
 * PUT /projects/:id/phase/assign
 */
export const allotPhaseEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phase, assignedTo } = req.body;

    if (!phase || !assignedTo) {
      return res.status(400).json({ message: "Phase name and assignedTo employee ID are required" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const employee = await Employee.findById(assignedTo).populate({
      path: "user",
      select: "fullname email"
    });
    if (!employee) {
      return res.status(404).json({ message: "Assigned employee not found" });
    }

    const projectTasks = await Task.find({ project: id });
    const normalizePhase = (str) => (str || "").toLowerCase().trim();
    const targetPhase = normalizePhase(phase);

    const matchesPhase = (t) => {
      const taskPhase = normalizePhase(t.phase);
      if (taskPhase === targetPhase) return true;
      if (taskPhase && taskPhase !== "general" && taskPhase !== "planning") return false;

      const title = (t.title || "").toLowerCase();
      if (targetPhase === "planning" && (title.includes("specification") || title.includes("requirements review") || title.includes("planning") || title.includes("setup"))) return true;
      if (targetPhase === "database" && (title.includes("database") || title.includes("schema") || title.includes("configuration") || title.includes("mongodb"))) return true;
      if (targetPhase === "backend" && (title.includes("backend") || title.includes("api") || title.includes("endpoint") || title.includes("logic"))) return true;
      if (targetPhase === "frontend" && (title.includes("frontend") || title.includes("ui") || title.includes("view") || title.includes("component"))) return true;
      if (targetPhase === "integration" && (title.includes("integration") || title.includes("third-party") || title.includes("cloud"))) return true;
      if (targetPhase === "testing" && (title.includes("testing") || title.includes("qa") || title.includes("validation"))) return true;
      if (targetPhase === "deployment" && (title.includes("deploy") || title.includes("release") || title.includes("launch"))) return true;
      return false;
    };

    const matchingTasks = projectTasks.filter(matchesPhase);

    if (matchingTasks.length > 0) {
      const taskIds = matchingTasks.map(t => t._id);
      await Task.updateMany(
        { _id: { $in: taskIds } },
        { $set: { assignedTo: employee._id, phase: phase } }
      );

      await logActivity(
        id,
        req.user.id,
        `Allotted ${employee.user?.fullname || employee.designation} to ${matchingTasks.length} tasks in ${phase} phase`,
        "Project",
        id
      );
    }

    await recalculateProjectMetrics(id);

    const updatedTasks = await Task.find({ project: id })
      .populate({
        path: "assignedTo",
        select: "designation user",
        populate: { path: "user", select: "fullname email" },
      })
      .lean();

    res.status(200).json({
      success: true,
      message: `Successfully allotted ${matchingTasks.length} task(s) in ${phase} phase to ${employee.user?.fullname || employee.designation}`,
      allottedCount: matchingTasks.length,
      tasks: updatedTasks
    });
  } catch (error) {
    next(error);
  }
};

export default {
  aiPlan,
  createProject,
  getProgress,
  updateTaskStatus,
  updateTaskProgress,
  updateSubtaskCompletion,
  postTaskComment,
  postMessage,
  getActivity,
  triggerAutoArrange,
  getProjectMembers,
  addProjectMember,
  getEmployeeTasks,
  getTaskComments,
  getProjects,
  getProjectStatistics,
  allotPhaseEmployee,
};