import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";

export async function recalculateProject(projectId) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const tasks = await Task.find({
    project: projectId,
  }).lean();

  // ------------------------------------
  // ACTUAL PROGRESS
  // ------------------------------------

  const totalWeight = tasks.reduce(
    (sum, task) => sum + (task.weight || 1),
    0
  );

  const actualProgress =
    totalWeight === 0
      ? 0
      : Math.round(
          tasks.reduce((sum, task) => {
            const isDone = task.isCompleted || task.status === "Completed";
            const prog = isDone ? 100 : (task.progressPercent || 0);
            return sum + prog * (task.weight || 1);
          }, 0) / totalWeight
        );

  // ------------------------------------
  // EXPECTED PROGRESS
  // ------------------------------------

  const now = Date.now();

  const start = new Date(
    project.startDate
  ).getTime();

  const deadline = new Date(
    project.deadline
  ).getTime();

  const duration = Math.max(
    deadline - start,
    1
  );

  const elapsed = Math.min(
    Math.max(now - start, 0),
    duration
  );

  const expectedProgress =
    (elapsed / duration) * 100;

  // ------------------------------------
  // TASK DETECTION
  // ------------------------------------

  const overdueTasks = tasks.filter(
    (task) =>
      task.status !== "Completed" &&
      task.dueDate &&
      new Date(task.dueDate) < new Date()
  );

  const blockedTasks = tasks.filter(
    (task) => task.status === "Blocked"
  );

  const notStartedTasks = tasks.filter(
    (task) =>
      task.status === "Pending" &&
      task.progressPercent === 0 &&
      task.startDate &&
      new Date(task.startDate) < new Date()
  );

  // ------------------------------------
  // COMPLETION PREDICTION
  // ------------------------------------

  let estimatedCompletionDate = null;

  if (actualProgress > 0) {
    const elapsedDays = Math.max(
      (now - start) /
        (1000 * 60 * 60 * 24),
      0.1
    );

    const velocity =
      actualProgress / elapsedDays;

    const remaining =
      Math.max(100 - actualProgress, 0);

    const remainingDays =
      remaining /
      Math.max(velocity, 0.0001);

    estimatedCompletionDate =
      new Date(
        now +
          remainingDays *
            24 *
            60 *
            60 *
            1000
      );
  }

  // ------------------------------------
  // HEALTH
  // ------------------------------------

  let healthStatus = "On-Track";

  const progressDifference =
    actualProgress - expectedProgress;

  if (
    progressDifference < -15 ||
    (
      estimatedCompletionDate &&
      estimatedCompletionDate >
        new Date(project.deadline)
    )
  ) {
    healthStatus =
      "Likely to Miss Deadline";
  } else if (
    progressDifference < -5 ||
    overdueTasks.length > 0 ||
    blockedTasks.length > 0
  ) {
    healthStatus = "At-Risk";
  }

  // ------------------------------------
  // SAVE
  // ------------------------------------

  project.expectedProgress =
    Math.round(expectedProgress * 100) / 100;

  project.actualProgress =
    Math.round(actualProgress * 100) / 100;

  project.estimatedCompletionDate =
    estimatedCompletionDate;

  project.healthStatus =
    healthStatus;

  const allCompleted =
    tasks.length > 0 &&
    tasks.every(
      (task) => task.status === "Completed"
    );

  if (allCompleted) {
    project.status = "Completed";
  }

  await project.save();

  return {
    project,
    tasks,
    overdueTasks,
    blockedTasks,
    notStartedTasks,
  };
}