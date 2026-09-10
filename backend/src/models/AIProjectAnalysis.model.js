import mongoose from "mongoose";

const aiProjectAnalysisSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Analysis must belong to a project"],
      unique: true,
      index: true,
    },
    projectOverview: {
      projectType: { type: String, default: "General Platform" },
      projectPurpose: { type: String, default: "" },
      mainObjective: { type: String, default: "" },
      complexityLevel: { type: String, default: "Medium" },
      estimatedProjectScope: { type: String, default: "" },
      architectureStyle: { type: String, default: "Modular Microservices Architecture" },
      targetDeployment: { type: String, default: "Cloud-Native Infrastructure" },
      complianceStandards: [{ type: String, trim: true }],
      keyMilestones: [{ type: String, trim: true }],
    },
    modules: [{ type: String, trim: true }],
    modulesDetail: [
      {
        name: { type: String, required: true },
        category: { type: String, default: "Core Feature" },
        status: { type: String, default: "Core" },
        description: { type: String, default: "" },
        icon: { type: String, default: "Layers" },
      }
    ],
    technologies: [{ type: String, trim: true }],
    technologiesDetail: [
      {
        name: { type: String, required: true },
        category: { type: String, default: "Backend" },
        role: { type: String, default: "" },
        version: { type: String, default: "Latest" },
        badgeColor: { type: String, default: "#6366f1" },
      }
    ],
    recommendedTasks: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        phase: { 
          type: String, 
          default: "Planning",
          trim: true
        },
        priority: { 
          type: String, 
          enum: ["Critical", "High", "Medium", "Low"], 
          default: "Medium" 
        },
        complexity: { 
          type: String, 
          enum: ["Low", "Medium", "High"], 
          default: "Medium" 
        },
        estimatedHours: { type: Number, default: 8 },
        requiredSkills: [{ type: String, trim: true }],
        dependencies: [{ type: String, trim: true }],
        recommendedRole: { type: String, default: "Software Engineer" },
        acceptanceCriteria: [{ type: String, trim: true }],
        potentialRisks: [{ type: String, trim: true }],
      }
    ],
    dependencies: [
      {
        taskTitle: { type: String, required: true },
        dependsOnTitle: { type: String, required: true },
        explanation: { type: String, default: "" },
      }
    ],
    risks: [
      {
        risk: { type: String, required: true },
        severity: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
        reason: { type: String, default: "" },
        solution: { type: String, default: "" },
      }
    ],
    skillGaps: [
      {
        requiredSkill: { type: String, required: true },
        category: { type: String, default: "Core Stack" },
        severity: { type: String, enum: ["Critical", "High", "Medium", "Low"], default: "Medium" },
        availableEmployeesCount: { type: Number, default: 0 },
        recommendation: { type: String, default: "" },
        actionType: { type: String, default: "Upskill" },
      }
    ],
    skillGapAnalysis: {
      coverageScore: { type: Number, default: 0 },
      totalSkillsRequired: { type: Number, default: 0 },
      coveredSkillsCount: { type: Number, default: 0 },
      missingSkillsCount: { type: Number, default: 0 },
    },
    teamRecommendations: [
      {
        taskTitle: { type: String, required: true },
        recommendedEmployee: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Employee",
          default: null
        },
        skillMatchPercent: { type: Number, default: 0 },
        reason: { type: String, default: "" },
      }
    ],
    estimatedEffort: {
      minHours: { type: Number, default: 0 },
      maxHours: { type: Number, default: 0 },
    },
    missingRequirements: [{ type: String, trim: true }],
    currentProjectHealth: {
      overallProgress: { type: Number, default: 0 },
      scheduleStatus: { type: String, enum: ["On-Track", "At-Risk", "Delayed"], default: "On-Track" },
      riskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
      blockedTasksCount: { type: Number, default: 0 },
      delayedTasksCount: { type: Number, default: 0 },
      recommendedNextTask: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AIProjectAnalysis", aiProjectAnalysisSchema);
