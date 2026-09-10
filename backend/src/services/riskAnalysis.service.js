/**
 * Risk Analysis Service
 *
 * Scans project descriptions and technologies to forecast timeline, security, and scalability issues.
 */
export const analyzeRisks = async (input) => {
  const { description = "", technologies = [], recommendedTasks = [] } = input;
  const descLower = description.toLowerCase();
  
  const risks = [];

  if (descLower.includes("document") || descLower.includes("file") || descLower.includes("upload") || descLower.includes("avatar")) {
    risks.push({
      risk: "Document / Profile Image Security Leak",
      severity: "High",
      reason: "Uploaded documents contain sensitive employee personal details (phone, certificates, salaries).",
      solution: "Enforce JWT authentication gatekeepers, validate MIME file types, and restrict Cloudinary read links behind secure tokens."
    });
  }

  if (technologies.includes("Stripe API") || descLower.includes("payment") || descLower.includes("stripe")) {
    risks.push({
      risk: "Transaction Compliance & Security Vulnerability",
      severity: "High",
      reason: "Processing customer checkout payments requires rigid PCI-DSS compliance.",
      solution: "Avoid storing plaintext card numbers on backend databases; fully delegate checkout verification to Stripe Hosted Checkout Sessions."
    });
  }

  if (technologies.includes("MongoDB") || descLower.includes("database")) {
    risks.push({
      risk: "Mongoose Query Latency Bottlenecks",
      severity: "Medium",
      reason: "Increasing database documents count without indexes will trigger heavy collection scans.",
      solution: "Inject compound schema indexes on frequently queried fields like project, status, and assignedTo."
    });
  }

  if (recommendedTasks.length > 6) {
    risks.push({
      risk: "Timeline Delivery Slip",
      severity: "Medium",
      reason: "Large numbers of deliverables with linear dependency chains are highly susceptible to schedule slips.",
      solution: "Optimize scheduling by parallelizing UI wireframe designs and Backend database schema creations in separate sprints."
    });
  }

  if (risks.length === 0) {
    risks.push({
      risk: "Requirements Scope Creep",
      severity: "Low",
      reason: "Unstructured project descriptions can result in additional out-of-scope feature requests.",
      solution: "Review and freeze developer milestone specifications before beginning database designs."
    });
  }

  return risks;
};

export default {
  analyzeRisks,
};
