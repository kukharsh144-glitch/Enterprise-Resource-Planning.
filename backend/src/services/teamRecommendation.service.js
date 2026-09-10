/**
 * Team Recommendation & Skill Gap Analysis Service
 *
 * Compares task requirements and project technology stacks with available
 * employee profiles in the database.
 */
export const matchTasks = async (recommendedTasks = [], employees = []) => {
  const recommendations = [];

  for (const task of recommendedTasks) {
    const required = task.requiredSkills || [];
    let bestMatch = null;
    let maxPercent = 0;
    let reason = "No available team members match the required skills.";

    if (employees.length > 0) {
      employees.forEach(emp => {
        const empSkills = (emp.skills || []).map(s => s.toLowerCase());
        let matchesCount = 0;

        required.forEach(reqSkill => {
          if (empSkills.includes(reqSkill.toLowerCase())) {
            matchesCount++;
          }
        });

        const percent = required.length > 0 ? Math.round((matchesCount / required.length) * 100) : 100;
        
        if (percent > maxPercent || (bestMatch === null && percent >= 0)) {
          maxPercent = percent;
          bestMatch = emp;
          reason = `Strong alignment with the required skills pool: ${required.join(", ")}.`;
        }
      });
    }

    recommendations.push({
      taskTitle: task.title,
      recommendedEmployee: bestMatch ? bestMatch._id : null,
      recommendedEmployeeName: bestMatch ? (bestMatch.user?.fullname || bestMatch.designation) : "Unassigned",
      skillMatchPercent: maxPercent,
      reason
    });
  }

  return recommendations;
};

export const calculateSkillGaps = async (technologies = [], employees = []) => {
  const gaps = [];
  
  // Aggregate all employee skills
  const availableSkillsMap = new Map(); // skillLower -> count
  employees.forEach(emp => {
    (emp.skills || []).forEach(s => {
      const lower = s.trim().toLowerCase();
      availableSkillsMap.set(lower, (availableSkillsMap.get(lower) || 0) + 1);
    });
  });

  let coveredCount = 0;

  technologies.forEach(tech => {
    const techLower = tech.toLowerCase();
    
    let matchCount = 0;
    availableSkillsMap.forEach((count, skill) => {
      if (skill.includes(techLower) || techLower.includes(skill)) {
        matchCount += count;
      }
    });

    if (matchCount > 0) {
      coveredCount++;
    } else {
      // Determine gap severity and actionable mitigation
      let severity = "Medium";
      let actionType = "Upskill";
      let recommendation = `Schedule a targeted workshop for engineers to gain ${tech} proficiency before production release.`;

      if (techLower.includes("vault") || techLower.includes("security") || techLower.includes("rbac") || techLower.includes("cve") || techLower.includes("pci") || techLower.includes("kms")) {
        severity = "Critical";
        actionType = "Hire / Consult";
        recommendation = `Critical security boundary: No team member has ${tech} expertise. Allocate specialized security training or consult a certified security architect.`;
      } else if (techLower.includes("docker") || techLower.includes("kubernetes") || techLower.includes("aws") || techLower.includes("ci/cd")) {
        severity = "High";
        actionType = "Upskill";
        recommendation = `DevOps infrastructure gap: Enroll 2 senior developers in a fast-track ${tech} containerization sprint and pair with project lead.`;
      } else if (techLower.includes("node") || techLower.includes("express") || techLower.includes("react") || techLower.includes("mongo")) {
        severity = "High";
        actionType = "Pair Program";
        recommendation = `Core stack requirement: Transition an adjacent fullstack developer to ${tech} with 1-on-1 code review mentorship.`;
      } else if (techLower.includes("vector") || techLower.includes("langchain") || techLower.includes("pinecone")) {
        severity = "High";
        actionType = "Upskill";
        recommendation = `AI engineering requirement: Sponsor ${tech} vector database training for data and backend engineers.`;
      } else if (techLower.includes("cypress") || techLower.includes("jest") || techLower.includes("supertest")) {
        severity = "Medium";
        actionType = "Upskill";
        recommendation = `Automated testing coverage gap: Introduce ${tech} template scripts into the current CI/CD pipeline.`;
      } else if (techLower.includes("stripe") || techLower.includes("payment")) {
        severity = "High";
        actionType = "Upskill";
        recommendation = `Payment processing requirement: Review Stripe API webhooks and idempotent transaction specs with senior developer.`;
      }

      gaps.push({
        requiredSkill: tech,
        category: techLower.includes("react") || techLower.includes("css") ? "Frontend" :
                  techLower.includes("node") || techLower.includes("express") ? "Backend" :
                  techLower.includes("mongo") || techLower.includes("redis") ? "Database" :
                  techLower.includes("security") || techLower.includes("vault") || techLower.includes("jwt") ? "Security" :
                  techLower.includes("docker") || techLower.includes("aws") ? "DevOps" : "Engineering",
        severity,
        availableEmployeesCount: 0,
        recommendation,
        actionType
      });
    }
  });

  const totalRequired = technologies.length || 1;
  const coverageScore = Math.round((coveredCount / totalRequired) * 100);

  return {
    gaps,
    analysis: {
      coverageScore,
      totalSkillsRequired: totalRequired,
      coveredSkillsCount: coveredCount,
      missingSkillsCount: gaps.length
    }
  };
};

export default {
  matchTasks,
  calculateSkillGaps,
};

