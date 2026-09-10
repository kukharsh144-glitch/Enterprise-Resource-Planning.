import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import Employee from "../models/Employee.model.js";
import ProjectMember from "../models/ProjectMember.model.js";
import AIProjectAnalysis from "../models/AIProjectAnalysis.model.js";
import aiProjectService from "../services/aiProject.service.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { recalculateProject } from "../utils/recalculateProject.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Perform AI Project Evaluation and generate recommended task plans.
 * POST /api/projects/:id/ai/analyze
 */
export const analyzeProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json(new apiResponse(400, "Invalid project ID format"));
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json(new apiResponse(404, "Project not found"));
  }

  const existingTasks = await Task.find({ project: id }).lean();
  const projectMembers = await ProjectMember.find({ project: id }).lean();
  const employees = await Employee.find({ status: "Active" })
    .populate({ path: "user", select: "fullname email" })
    .lean();

  try {
    const analysisReport = await aiProjectService.analyzeProject({
      projectName: project.name,
      description: project.description || "General platform project requirements analysis.",
      startDate: project.startDate,
      deadline: project.deadline,
      existingTasks,
      projectMembers,
      employees,
    });

    let analysisDoc = await AIProjectAnalysis.findOne({ project: id });
    const updatePayload = {
      projectOverview: analysisReport.projectOverview,
      modules: analysisReport.modules,
      modulesDetail: analysisReport.modulesDetail || [],
      technologies: analysisReport.technologies,
      technologiesDetail: analysisReport.technologiesDetail || [],
      recommendedTasks: analysisReport.recommendedTasks,
      dependencies: analysisReport.dependencies,
      risks: analysisReport.risks,
      skillGaps: analysisReport.skillGaps,
      skillGapAnalysis: analysisReport.skillGapAnalysis || {},
      teamRecommendations: analysisReport.teamRecommendations,
      estimatedEffort: analysisReport.estimatedEffort,
      missingRequirements: analysisReport.missingRequirements,
      currentProjectHealth: analysisReport.currentProjectHealth,
    };

    if (analysisDoc) {
      Object.assign(analysisDoc, updatePayload);
      await analysisDoc.save();
    } else {
      analysisDoc = new AIProjectAnalysis({
        project: id,
        ...updatePayload,
      });
      await analysisDoc.save();
    }

    res.status(200).json(
      new apiResponse(200, "AI analysis generated successfully", analysisDoc)
    );
  } catch (error) {
    console.error("Project Analysis controller error:", error);
    res.status(500).json(
      new apiResponse(500, "Failed to analyze project", { error: error.message })
    );
  }
});

/**
 * Retrieve saved analysis reports.
 * GET /api/projects/:id/ai/analysis
 */
export const getAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json(new apiResponse(400, "Invalid project ID format"));
  }

  const analysis = await AIProjectAnalysis.findOne({ project: id })
    .populate({
      path: "teamRecommendations.recommendedEmployee",
      populate: { path: "user", select: "fullname" }
    });

  if (!analysis) {
    return res.status(404).json(
      new apiResponse(404, "No analysis reports found for this project. Trigger analysis first.")
    );
  }

  res.status(200).json(
    new apiResponse(200, "AI Analysis report retrieved successfully", analysis)
  );
});

/**
 * AI Recommended Next Task Analyzer.
 * GET /api/projects/:id/ai/next-task
 */
export const recommendNextTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json(new apiResponse(400, "Invalid project ID format"));
  }

  const existingTasks = await Task.find({ project: id }).lean();
  
  if (existingTasks.length === 0) {
    return res.status(200).json(
      new apiResponse(200, "Recommendation generated", {
        nextTask: "Scaffold Base Infrastructure",
        reason: "There are no tasks currently defined for this project board."
      })
    );
  }

  const incomplete = existingTasks.find(t => t.status !== "Completed" && t.status !== "Blocked");
  const blocked = existingTasks.find(t => t.status === "Blocked");

  let nextTask = incomplete ? incomplete.title : "All defined tasks completed!";
  let reason = "This task has high priority and holds no dependency blockages.";

  if (blocked) {
    nextTask = `Resolve Blocked Task: ${blocked.title}`;
    reason = `Task is currently blocked by reason: "${blocked.blockedReason || "No reason specified"}". Clean this block to prevent timeline delays.`;
  }

  res.status(200).json(
    new apiResponse(200, "Next recommended action determined", {
      nextTask,
      reason,
    })
  );
});

/**
 * Approve AI recommended project plan and provision tasks in DB.
 * POST /api/projects/:id/ai/approve
 */
export const approvePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, startDate, deadline, tasks = [] } = req.body;
  console.log(`[approvePlan] Project: ${id}, Tasks received: ${tasks?.length}`);

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json(new apiResponse(400, "Invalid project ID format"));
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json(new apiResponse(404, "Project not found"));
  }

  let employee = await Employee.findOne({ user: req.user.id });
  if (!employee) {
    employee = await Employee.findOne();
  }

  if (name) project.name = name;
  if (description) project.description = description;
  if (startDate) project.startDate = startDate;
  if (deadline) project.deadline = deadline;
  await project.save();

  await ActivityLog.logActivity({
    actor: req.user.id,
    action: "update_project",
    entityType: "Project",
    entityId: id
  });

  if (tasks.length > 0) {
    const createdTasks = [];
    const titleToIdMap = {};

    for (const taskData of tasks) {
      const duplicate = await Task.findOne({ project: id, title: taskData.title });
      if (duplicate) {
        titleToIdMap[taskData.title] = duplicate._id;
        continue;
      }

      const task = new Task({
        project: id,
        assignedTo: taskData.assignedTo || employee?._id,
        title: taskData.title,
        description: taskData.description || "",
        status: "Pending",
        progressPercent: 0,
        weight: taskData.weight || 5,
        priority: taskData.priority || "Medium",
        estimatedHours: taskData.estimatedHours || 16,
        actualHours: 0,
        startDate: taskData.startDate || project.startDate,
        dueDate: taskData.dueDate || project.deadline,
        phase: taskData.phase || "Planning",
        category: taskData.category || "backend",
        dependencies: [],
      });

      await task.save();
      createdTasks.push(task);
      titleToIdMap[taskData.title] = task._id;
    }

    for (let i = 0; i < tasks.length; i++) {
      const taskData = tasks[i];
      const createdTask = createdTasks.find(t => t.title === taskData.title);

      if (createdTask && taskData.parentTaskTitle) {
        const parentId = titleToIdMap[taskData.parentTaskTitle];
        if (parentId) {
          createdTask.parentTask = parentId;
          await createdTask.save();
        }
      }
      
      if (createdTask && taskData.dependencies && taskData.dependencies.length > 0) {
        const resolvedIds = taskData.dependencies
          .map(depTitle => titleToIdMap[depTitle])
          .filter(id => id !== undefined);

        if (resolvedIds.length > 0) {
          createdTask.dependencies = resolvedIds;
          await createdTask.save();
        }
      }

      if (createdTask) {
        await ActivityLog.logActivity({
          actor: req.user.id,
          action: "create_task",
          entityType: "Task",
          entityId: createdTask._id
        });
      }
    }
  }

  const result = await recalculateProject(id);

  res.status(200).json(
    new apiResponse(200, "Project plan approved and tasks provisioned successfully", result.project)
  );
});
