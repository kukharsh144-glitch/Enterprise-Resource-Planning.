import Anthropic from "@anthropic-ai/sdk";
import projectAnalysisService from "./projectAnalysis.service.js";
import taskRecommendationService from "./taskRecommendation.service.js";
import dependencyAnalysisService from "./dependencyAnalysis.service.js";
import riskAnalysisService from "./riskAnalysis.service.js";
import teamRecommendationService from "./teamRecommendation.service.js";

/**
 * AI Project Planning Service Abstraction
 *
 * Coordinates AI project evaluation or delegates to localized analytical
 * engines for offline/fallback execution.
 */
export const analyzeProject = async (input) => {
  const {
    projectName = "",
    description = "",
    startDate,
    deadline,
    existingTasks = [],
    projectMembers = [],
    employees = [],
  } = input;

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  if (hasApiKey) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const prompt = `You are a professional AI Project Manager and Planning Agent. Analyze the following project parameters and generate a highly detailed and structured project planning response in valid JSON.

Project Name: ${projectName}
Project Description/Overview: ${description}
Start Date: ${startDate}
Deadline: ${deadline}
Number of Team Members Available: ${employees.length}
Employee Skills Pool: ${JSON.stringify(employees.map(e => ({ name: e.user?.fullname || e.designation, skills: e.skills })))}
Existing Tasks in Project: ${JSON.stringify(existingTasks.map(t => ({ title: t.title, status: t.status })))}

You must evaluate dependencies, outline logical phases, predict security/timeline risks, run skill gap reviews, and suggest task-employee matches.

IMPORTANT: Your response MUST be valid JSON matching exactly this schema:
{
  "projectOverview": {
    "projectType": "Project domain type (e.g. Web App, Mobile App, etc.)",
    "projectPurpose": "Overview of project purpose",
    "mainObjective": "Main objective statement",
    "complexityLevel": "Low|Medium|High",
    "estimatedProjectScope": "Short summary of project boundaries"
  },
  "modules": ["Module Name 1", "Module Name 2"],
  "technologies": ["Tech 1", "Tech 2"],
  "requirements": ["Requirement 1", "Requirement 2"],
  "recommendedTasks": [
    {
      "title": "Task title",
      "description": "Task description details",
      "phase": "Planning|Database|Backend|Frontend|Integration|Testing|Deployment",
      "priority": "Critical|High|Medium|Low",
      "complexity": "Low|Medium|High",
      "estimatedHours": 16,
      "requiredSkills": ["Skill 1", "Skill 2"],
      "dependencies": ["Task title dependency"],
      "recommendedRole": "Recommended developer role",
      "acceptanceCriteria": ["Criteria 1"],
      "potentialRisks": ["Risk description"]
    }
  ],
  "dependencies": [
    {
      "taskTitle": "Task title",
      "dependsOnTitle": "Task title dependency",
      "explanation": "Explanation statement"
    }
  ],
  "risks": [
    {
      "risk": "Risk name",
      "severity": "Low|Medium|High",
      "reason": "Why this is a risk",
      "solution": "Solution/mitigation statement"
    }
  ],
  "skillGaps": [
    {
      "requiredSkill": "Skill name",
      "availableEmployeesCount": 0,
      "recommendation": "Training/hiring suggestion"
    }
  ],
  "teamRecommendations": [
    {
      "taskTitle": "Task title",
      "recommendedEmployeeName": "Full Name of Employee matching available pool",
      "skillMatchPercent": 92,
      "reason": "Reason details"
    }
  ],
  "estimatedEffort": {
    "minHours": 120,
    "maxHours": 150
  },
  "missingRequirements": ["Missing Requirement Alert 1"],
  "currentProjectHealth": {
    "overallProgress": 0,
    "scheduleStatus": "On-Track",
    "riskLevel": "Low",
    "blockedTasksCount": 0,
    "delayedTasksCount": 0,
    "recommendedNextTask": "First task in recommended list"
  }
}

Respond with ONLY the JSON object, no conversational intro/outro text.`;

      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].text;
      const parsedPlan = JSON.parse(text);

      const nameToEmpMap = {};
      employees.forEach(emp => {
        const fullName = emp.user?.fullname || emp.designation;
        nameToEmpMap[fullName.toLowerCase()] = emp._id;
      });

      parsedPlan.teamRecommendations = (parsedPlan.teamRecommendations || []).map(rec => {
        const empNameLower = (rec.recommendedEmployeeName || "").toLowerCase();
        const matchedEmpId = nameToEmpMap[empNameLower] || null;
        return {
          taskTitle: rec.taskTitle,
          recommendedEmployee: matchedEmpId,
          skillMatchPercent: rec.skillMatchPercent || 0,
          reason: rec.reason || "Matched by skills alignment analysis."
        };
      });

      return parsedPlan;
    } catch (err) {
      console.warn("Claude planner generation failed, running local backup engines:", err.message || err);
    }
  }

  return executeLocalPlanner(input);
};

const executeLocalPlanner = async (input) => {
  const { projectName, description, startDate, deadline, existingTasks, employees } = input;

  const overview = await projectAnalysisService.analyzeOverview(projectName, description);
  const modules = await projectAnalysisService.extractModules(description, projectName);
  const modulesDetail = await projectAnalysisService.extractModulesDetail(description, projectName);
  const technologies = await projectAnalysisService.extractTechnologies(description, projectName);
  const technologiesDetail = await projectAnalysisService.extractTechnologiesDetail(description, projectName);
  const missingRequirements = await projectAnalysisService.detectMissingRequirements(description, projectName);

  const recommendedTasks = await taskRecommendationService.generateTasks({
    projectName,
    description,
    startDate,
    deadline,
    existingTasks
  });

  const dependencies = await dependencyAnalysisService.calculateDependencies(recommendedTasks);
  const risks = await riskAnalysisService.analyzeRisks({ description, recommendedTasks, technologies });
  
  const skillGapResult = await teamRecommendationService.calculateSkillGaps(technologies, employees);
  const skillGaps = skillGapResult.gaps || skillGapResult;
  const skillGapAnalysis = skillGapResult.analysis || {
    coverageScore: 80,
    totalSkillsRequired: technologies.length,
    coveredSkillsCount: Math.max(0, technologies.length - (skillGaps.length || 0)),
    missingSkillsCount: skillGaps.length || 0
  };

  const teamRecommendations = await teamRecommendationService.matchTasks(recommendedTasks, employees);

  const totalHours = recommendedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const estimatedEffort = {
    minHours: Math.round(totalHours * 0.9),
    maxHours: Math.round(totalHours * 1.2)
  };

  const subtasks = existingTasks.filter(t => t.parentTask);
  let overallProgress = 0;
  if (subtasks.length > 0) {
    const completedSub = subtasks.filter(t => t.isCompleted).length;
    overallProgress = Math.round((completedSub / subtasks.length) * 100);
  } else {
    const totalExisting = existingTasks.length;
    const completed = existingTasks.filter(t => t.status === "Completed").length;
    overallProgress = totalExisting > 0 ? Math.round((completed / totalExisting) * 100) : 0;
  }

  const blockedCount = existingTasks.filter(t => t.status === "Blocked").length;
  const riskLevel = blockedCount > 0 ? "High" : "Low";
  const scheduleStatus = blockedCount > 0 ? "At-Risk" : "On-Track";

  let nextTask = "Project Setup";
  if (subtasks.length > 0) {
    const firstIncompleteSub = subtasks.find(t => !t.isCompleted);
    if (firstIncompleteSub) {
      nextTask = firstIncompleteSub.title;
    }
  } else {
    const firstIncompleteParent = existingTasks.find(t => t.status !== "Completed");
    if (firstIncompleteParent) {
      nextTask = firstIncompleteParent.title;
    }
  }

  const currentProjectHealth = {
    overallProgress,
    scheduleStatus,
    riskLevel,
    blockedTasksCount: blockedCount,
    delayedTasksCount: 0,
    recommendedNextTask: nextTask
  };

  return {
    projectOverview: overview,
    modules,
    modulesDetail,
    technologies,
    technologiesDetail,
    requirements: [
      "JWT authorization middleware controls",
      "Form validation safeguards on mobile layouts",
      "Persistent state handlers on checklist updates"
    ],
    recommendedTasks,
    dependencies,
    risks,
    skillGaps,
    skillGapAnalysis,
    teamRecommendations,
    estimatedEffort,
    missingRequirements,
    currentProjectHealth
  };
};

export default {
  analyzeProject,
};
