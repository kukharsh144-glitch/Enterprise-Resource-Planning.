import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/**
 * PROJECT TYPE CLASSIFIER
 * Defines project categories and their characteristic keywords
 */
const PROJECT_TYPES = {
  ECOMMERCE: {
    keywords: ["ecommerce", "e-commerce", "shop", "store", "shopping", "marketplace", "cart", "payment", "checkout"],
    taskTemplate: "ecommerce"
  },
  MOBILE: {
    keywords: ["mobile", "app", "android", "ios", "native", "react native", "flutter", "cross-platform"],
    taskTemplate: "mobile"
  },
  CRM: {
    keywords: ["crm", "sales", "customer", "client", "lead", "prospect", "pipeline", "deal", "contact"],
    taskTemplate: "crm"
  },
  SAAS: {
    keywords: ["saas", "software", "platform", "service", "subscription", "multi-tenant", "dashboard"],
    taskTemplate: "saas"
  },
  API: {
    keywords: ["api", "backend", "microservice", "service", "endpoint", "rest", "graphql", "integration"],
    taskTemplate: "api"
  },
  WEBSITE: {
    keywords: ["website", "web app", "web application", "landing page", "blog", "cms", "website"],
    taskTemplate: "website"
  },
  ANALYTICS: {
    keywords: ["analytics", "dashboard", "reporting", "metrics", "data", "visualization", "intelligence"],
    taskTemplate: "analytics"
  },
  GENERAL: {
    keywords: [],
    taskTemplate: "general"
  }
};

/**
 * TASK TEMPLATES FOR DIFFERENT PROJECT TYPES
 */
const TASK_TEMPLATES = {
  ecommerce: [
    {
      title: "Database Schema & Authentication Setup",
      description: "Design database models for Products, Orders, Users, Cart items; implement JWT authentication",
      priority: "High",
      estimatedHours: 40,
      weight: 9,
      category: "backend"
    },
    {
      title: "Product Catalog & Search Implementation",
      description: "Build product listing pages with filtering, sorting, search, and pagination",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Shopping Cart System",
      description: "Implement cart management with add/remove items, quantity updates, and session persistence",
      priority: "High",
      estimatedHours: 24,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Payment Gateway Integration",
      description: "Integrate Stripe/PayPal for secure payment processing with PCI compliance",
      priority: "High",
      estimatedHours: 32,
      weight: 9,
      category: "backend"
    },
    {
      title: "Order Management System",
      description: "Create order tracking, status updates, order history, and invoice generation",
      priority: "High",
      estimatedHours: 28,
      weight: 8,
      category: "backend"
    },
    {
      title: "User Profile & Account Management",
      description: "Build user dashboard with profile settings, address management, and order history",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "frontend"
    },
    {
      title: "Admin Dashboard for Inventory",
      description: "Create admin panel for product management, inventory tracking, and stock updates",
      priority: "Medium",
      estimatedHours: 24,
      weight: 7,
      category: "backend"
    },
    {
      title: "Email Notifications System",
      description: "Set up automated order confirmation, shipping, and promotional emails",
      priority: "Medium",
      estimatedHours: 16,
      weight: 5,
      category: "backend"
    },
    {
      title: "Security & Payment PCI Compliance",
      description: "Implement SSL/TLS, secure payment handling, and data encryption",
      priority: "High",
      estimatedHours: 24,
      weight: 9,
      category: "backend"
    },
    {
      title: "Responsive UI Design & Styling",
      description: "Implement responsive design for mobile, tablet, and desktop viewports",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "frontend"
    },
    {
      title: "Testing & QA (Checkout Flow)",
      description: "End-to-end testing of entire purchase flow, payment processing, and edge cases",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "qa"
    },
    {
      title: "Production Deployment & Launch",
      description: "Deploy to production, configure CDN, set up monitoring and analytics",
      priority: "High",
      estimatedHours: 16,
      weight: 7,
      category: "devops"
    }
  ],
  
  mobile: [
    {
      title: "UI/UX Design & Wireframes",
      description: "Create wireframes, mockups, and design system for mobile app",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "design"
    },
    {
      title: "Project Setup & Navigation Architecture",
      description: "Initialize React Native/Flutter project with navigation framework and folder structure",
      priority: "High",
      estimatedHours: 20,
      weight: 8,
      category: "backend"
    },
    {
      title: "Authentication System",
      description: "Implement user login, signup, password reset, and session management",
      priority: "High",
      estimatedHours: 28,
      weight: 8,
      category: "backend"
    },
    {
      title: "Core Feature Development",
      description: "Build main application features as per requirements specification",
      priority: "High",
      estimatedHours: 60,
      weight: 9,
      category: "frontend"
    },
    {
      title: "API Integration & Data Fetching",
      description: "Integrate with backend APIs, handle data binding and state management",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Offline Storage & Caching",
      description: "Implement local storage for offline functionality and data synchronization",
      priority: "Medium",
      estimatedHours: 24,
      weight: 7,
      category: "backend"
    },
    {
      title: "Push Notifications Setup",
      description: "Configure Firebase Cloud Messaging and Apple Push Notifications",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "backend"
    },
    {
      title: "Image Optimization & Asset Management",
      description: "Optimize images, handle responsive assets for different device sizes",
      priority: "Medium",
      estimatedHours: 12,
      weight: 5,
      category: "frontend"
    },
    {
      title: "Performance Optimization",
      description: "Optimize app performance, reduce bundle size, improve load times",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "backend"
    },
    {
      title: "Testing & QA (iOS & Android)",
      description: "Execute comprehensive testing on iOS Simulator and Android Emulator",
      priority: "High",
      estimatedHours: 40,
      weight: 8,
      category: "qa"
    },
    {
      title: "App Store & Play Store Submission",
      description: "Prepare store listings, screenshots, release notes, and submit for review",
      priority: "High",
      estimatedHours: 16,
      weight: 7,
      category: "devops"
    }
  ],
  
  crm: [
    {
      title: "Database Design & Schema Creation",
      description: "Design database models for Leads, Contacts, Deals, Activities, and Accounts",
      priority: "High",
      estimatedHours: 28,
      weight: 9,
      category: "backend"
    },
    {
      title: "User Authentication & Role-Based Access Control",
      description: "Implement user management with role-based permissions (Admin, Manager, Rep)",
      priority: "High",
      estimatedHours: 24,
      weight: 8,
      category: "backend"
    },
    {
      title: "Contact & Lead Management Module",
      description: "Build contact database with lead scoring, tagging, and segmentation",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Deal Pipeline & Kanban Board",
      description: "Create interactive deal pipeline with drag-and-drop Kanban board",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Activity Tracking & Timeline",
      description: "Implement activity logs for calls, emails, meetings, and notes",
      priority: "Medium",
      estimatedHours: 24,
      weight: 7,
      category: "frontend"
    },
    {
      title: "Sales Analytics & Reporting",
      description: "Build sales dashboards with charts for pipeline, forecasting, and metrics",
      priority: "Medium",
      estimatedHours: 28,
      weight: 7,
      category: "frontend"
    },
    {
      title: "Email & Calendar Integration",
      description: "Integrate with email providers and calendar systems for activity sync",
      priority: "Medium",
      estimatedHours: 24,
      weight: 6,
      category: "backend"
    },
    {
      title: "Bulk Operations & Data Import",
      description: "Implement CSV import, bulk actions, and data synchronization features",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "backend"
    },
    {
      title: "Export & Report Generation",
      description: "Create PDF/Excel export functionality and scheduled report generation",
      priority: "Low",
      estimatedHours: 16,
      weight: 5,
      category: "backend"
    },
    {
      title: "Testing & Validation",
      description: "QA testing for permissions, data integrity, and workflow automation",
      priority: "High",
      estimatedHours: 32,
      weight: 7,
      category: "qa"
    },
    {
      title: "Deployment & Training",
      description: "Deploy to production and conduct user training sessions",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "devops"
    }
  ],
  
  saas: [
    {
      title: "System Architecture & Infrastructure",
      description: "Design scalable architecture with microservices, containerization, and cloud setup",
      priority: "High",
      estimatedHours: 40,
      weight: 9,
      category: "backend"
    },
    {
      title: "User Authentication & Multi-Tenancy",
      description: "Implement OAuth/SSO, user management, and multi-tenant data isolation",
      priority: "High",
      estimatedHours: 32,
      weight: 9,
      category: "backend"
    },
    {
      title: "Core API Development",
      description: "Build RESTful/GraphQL APIs with proper validation, error handling, and documentation",
      priority: "High",
      estimatedHours: 48,
      weight: 9,
      category: "backend"
    },
    {
      title: "Dashboard & UI Components",
      description: "Create reusable UI component library and main dashboard interface",
      priority: "High",
      estimatedHours: 40,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Database Optimization & Scaling",
      description: "Optimize queries, implement caching, and plan for data scaling",
      priority: "Medium",
      estimatedHours: 28,
      weight: 7,
      category: "backend"
    },
    {
      title: "Billing & Subscription Management",
      description: "Implement subscription tiers, payment processing, and usage-based billing",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "backend"
    },
    {
      title: "Admin Control Panel",
      description: "Build admin interface for user management, analytics, and system configuration",
      priority: "Medium",
      estimatedHours: 24,
      weight: 7,
      category: "frontend"
    },
    {
      title: "Monitoring & Analytics",
      description: "Set up application monitoring, error tracking, and usage analytics",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "devops"
    },
    {
      title: "Security & Compliance",
      description: "Implement security measures (encryption, HTTPS, CORS) and compliance standards (GDPR, SOC2)",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "backend"
    },
    {
      title: "API Documentation & SDK",
      description: "Create comprehensive API documentation and client SDKs for integrations",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "devops"
    },
    {
      title: "Load Testing & Performance Tuning",
      description: "Conduct load testing and optimize performance for concurrent users",
      priority: "High",
      estimatedHours: 24,
      weight: 7,
      category: "qa"
    },
    {
      title: "Production Deployment & Launch",
      description: "Deploy to production, set up CI/CD, monitoring, and launch strategy",
      priority: "High",
      estimatedHours: 20,
      weight: 7,
      category: "devops"
    }
  ],
  
  api: [
    {
      title: "API Design & Specification",
      description: "Design API endpoints, define request/response schemas, and document specifications",
      priority: "High",
      estimatedHours: 24,
      weight: 9,
      category: "backend"
    },
    {
      title: "Core API Implementation",
      description: "Build API endpoints with proper routing, middleware, and error handling",
      priority: "High",
      estimatedHours: 40,
      weight: 9,
      category: "backend"
    },
    {
      title: "Authentication & Authorization",
      description: "Implement API key, OAuth2, JWT, and role-based access control",
      priority: "High",
      estimatedHours: 28,
      weight: 8,
      category: "backend"
    },
    {
      title: "Database Integration",
      description: "Set up database connections, ORM/ODM, migrations, and seed data",
      priority: "High",
      estimatedHours: 24,
      weight: 8,
      category: "backend"
    },
    {
      title: "Rate Limiting & Throttling",
      description: "Implement rate limiting, request throttling, and quota management",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "backend"
    },
    {
      title: "Caching Strategy & Implementation",
      description: "Implement caching layers (Redis) for performance optimization",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "backend"
    },
    {
      title: "Error Handling & Logging",
      description: "Implement comprehensive error handling, logging, and monitoring",
      priority: "High",
      estimatedHours: 16,
      weight: 7,
      category: "backend"
    },
    {
      title: "API Documentation",
      description: "Create Swagger/OpenAPI documentation with examples and SDKs",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "backend"
    },
    {
      title: "Testing & Test Coverage",
      description: "Write unit tests, integration tests, and achieve 80%+ code coverage",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "qa"
    },
    {
      title: "Performance Optimization",
      description: "Optimize queries, reduce payload size, and improve response times",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "backend"
    },
    {
      title: "Versioning & Backward Compatibility",
      description: "Implement API versioning strategy and maintain backward compatibility",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "backend"
    },
    {
      title: "Deployment & DevOps",
      description: "Set up CI/CD pipelines, containerization, and production deployment",
      priority: "High",
      estimatedHours: 20,
      weight: 7,
      category: "devops"
    }
  ],
  
  website: [
    {
      title: "UI/UX Design & Wireframes",
      description: "Create responsive design mockups and wireframes for all pages",
      priority: "High",
      estimatedHours: 28,
      weight: 8,
      category: "design"
    },
    {
      title: "Frontend Framework Setup",
      description: "Set up React/Vue/Angular with routing, state management, and build tools",
      priority: "High",
      estimatedHours: 20,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Responsive Layout & Components",
      description: "Build reusable components with responsive CSS for mobile-first design",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Backend API Development",
      description: "Build backend APIs for dynamic content and data management",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "backend"
    },
    {
      title: "Content Management System",
      description: "Implement CMS for dynamic content updates and media management",
      priority: "Medium",
      estimatedHours: 24,
      weight: 6,
      category: "backend"
    },
    {
      title: "SEO Optimization",
      description: "Implement meta tags, structured data, sitemap, and SEO best practices",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "frontend"
    },
    {
      title: "Analytics & Tracking",
      description: "Integrate Google Analytics, event tracking, and conversion monitoring",
      priority: "Medium",
      estimatedHours: 12,
      weight: 5,
      category: "frontend"
    },
    {
      title: "Form Handling & Validation",
      description: "Implement contact forms, feedback forms with validation and submission handling",
      priority: "Medium",
      estimatedHours: 12,
      weight: 5,
      category: "frontend"
    },
    {
      title: "Performance Optimization",
      description: "Optimize images, lazy loading, code splitting, and improve Core Web Vitals",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "frontend"
    },
    {
      title: "Security & HTTPS",
      description: "Implement SSL/TLS, secure headers, and protect against common vulnerabilities",
      priority: "High",
      estimatedHours: 16,
      weight: 7,
      category: "backend"
    },
    {
      title: "Testing & Cross-browser Compatibility",
      description: "Test on multiple browsers and devices, fix compatibility issues",
      priority: "High",
      estimatedHours: 24,
      weight: 7,
      category: "qa"
    },
    {
      title: "Deployment & Hosting Setup",
      description: "Deploy to hosting provider, configure domain, SSL, and CI/CD pipeline",
      priority: "High",
      estimatedHours: 16,
      weight: 7,
      category: "devops"
    }
  ],
  
  analytics: [
    {
      title: "Data Schema & ETL Pipeline",
      description: "Design data models and build ETL processes for data ingestion",
      priority: "High",
      estimatedHours: 40,
      weight: 9,
      category: "backend"
    },
    {
      title: "Data Warehouse Setup",
      description: "Set up data warehouse (Snowflake, BigQuery) with proper indexing",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "backend"
    },
    {
      title: "Dashboard Design & Layout",
      description: "Design interactive dashboards with key metrics and visualizations",
      priority: "High",
      estimatedHours: 28,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Data Visualization & Charts",
      description: "Implement interactive charts, graphs, and visual representations",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Real-time Data Processing",
      description: "Implement streaming data processing and real-time updates",
      priority: "Medium",
      estimatedHours: 36,
      weight: 7,
      category: "backend"
    },
    {
      title: "Filtering & Drill-down Features",
      description: "Build interactive filters, drill-down capabilities, and data exploration",
      priority: "Medium",
      estimatedHours: 24,
      weight: 6,
      category: "frontend"
    },
    {
      title: "Report Generation & Scheduling",
      description: "Create scheduled report generation and email delivery system",
      priority: "Medium",
      estimatedHours: 20,
      weight: 6,
      category: "backend"
    },
    {
      title: "Data Export Functionality",
      description: "Implement PDF, Excel, and CSV export with formatting options",
      priority: "Medium",
      estimatedHours: 16,
      weight: 5,
      category: "backend"
    },
    {
      title: "Performance Tuning & Optimization",
      description: "Optimize query performance, caching, and dashboard load times",
      priority: "High",
      estimatedHours: 28,
      weight: 7,
      category: "backend"
    },
    {
      title: "Data Security & Privacy",
      description: "Implement row-level security, encryption, and data privacy measures",
      priority: "High",
      estimatedHours: 20,
      weight: 8,
      category: "backend"
    },
    {
      title: "Testing & Validation",
      description: "Validate data accuracy, test visualizations, and verify metrics",
      priority: "High",
      estimatedHours: 28,
      weight: 7,
      category: "qa"
    },
    {
      title: "Deployment & Launch",
      description: "Deploy to production and provide user training",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "devops"
    }
  ],
  
  general: [
    {
      title: "Project Planning & Requirements",
      description: "Define detailed project requirements, scope, and success criteria",
      priority: "High",
      estimatedHours: 24,
      weight: 8,
      category: "planning"
    },
    {
      title: "Architecture & Technical Design",
      description: "Design system architecture and technical solution approach",
      priority: "High",
      estimatedHours: 28,
      weight: 8,
      category: "backend"
    },
    {
      title: "Core Feature Implementation",
      description: "Implement core functionality and primary features",
      priority: "High",
      estimatedHours: 48,
      weight: 9,
      category: "backend"
    },
    {
      title: "Frontend Development",
      description: "Build user interface and frontend application",
      priority: "High",
      estimatedHours: 40,
      weight: 8,
      category: "frontend"
    },
    {
      title: "Database Design & Setup",
      description: "Design and implement database schema",
      priority: "High",
      estimatedHours: 24,
      weight: 8,
      category: "backend"
    },
    {
      title: "API & Integration Layer",
      description: "Build APIs and integrate frontend with backend",
      priority: "High",
      estimatedHours: 32,
      weight: 8,
      category: "backend"
    },
    {
      title: "Testing & Quality Assurance",
      description: "Conduct comprehensive testing and quality assurance",
      priority: "High",
      estimatedHours: 32,
      weight: 7,
      category: "qa"
    },
    {
      title: "Documentation & Handover",
      description: "Create technical documentation and prepare for handover",
      priority: "Medium",
      estimatedHours: 16,
      weight: 6,
      category: "planning"
    },
    {
      title: "Deployment & Launch",
      description: "Deploy to production and monitor application",
      priority: "High",
      estimatedHours: 16,
      weight: 7,
      category: "devops"
    }
  ]
};

/**
 * ANALYZE PROJECT
 * Extracts project name, type, and key characteristics
 */
const analyzeProject = (description, projectName = "") => {
  const combinedText = `${projectName} ${description}`.toLowerCase();
  
  let detectedType = "GENERAL";
  let confidence = 0;

  // Find matching project type based on keywords
  for (const [type, config] of Object.entries(PROJECT_TYPES)) {
    const matchCount = config.keywords.filter(keyword => combinedText.includes(keyword)).length;
    const matchConfidence = matchCount / Math.max(config.keywords.length, 1);
    
    if (matchConfidence > confidence && matchCount > 0) {
      confidence = matchConfidence;
      detectedType = type;
    }
  }

  return {
    name: projectName || "Unnamed Project",
    description: description,
    detectedType: detectedType,
    confidence: Math.round(confidence * 100),
    template: PROJECT_TYPES[detectedType].taskTemplate
  };
};

/**
 * GENERATE PROJECT PLAN WITH CLAUDE
 * Uses Claude AI to generate optimized tasks based on project analysis
 */
export const generateProjectPlan = async (input) => {
  try {
    const { description, projectName = "", startDate, deadline } = input;

    // Step 1: Analyze project
    const projectAnalysis = analyzeProject(description, projectName);
    console.log(`📊 Project Analysis: ${projectAnalysis.detectedType} (${projectAnalysis.confidence}% confidence)`);

    // Calculate project duration
    const start = new Date(startDate);
    const end = new Date(deadline);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const durationWeeks = Math.ceil(durationDays / 7);

    // Step 2: Build Claude prompt with project context
    const prompt = `You are an expert project manager specializing in ${projectAnalysis.detectedType} projects.

PROJECT DETAILS:
Name: ${projectAnalysis.name}
Type: ${projectAnalysis.detectedType}
Description: ${projectAnalysis.description}
Start Date: ${startDate}
Deadline: ${deadline}
Duration: ${durationDays} days (${durationWeeks} weeks)

TASK: Generate a detailed, actionable task breakdown specifically tailored to this ${projectAnalysis.detectedType} project.

For each task, provide:
1. Clear, specific title (max 60 chars)
2. Brief description (1-2 sentences)
3. Priority (Low, Medium, or High)
4. Estimated hours (be realistic)
5. Weight/Story Points (1-10, for importance)
6. Category (backend, frontend, qa, devops, design, planning)
7. Task dependencies (list task titles that must complete first)

IMPORTANT GUIDELINES:
- Create 9-12 tasks (not too many, not too few)
- Tasks should be ATOMIC (completable by one person independently)
- Spread tasks evenly across ${durationWeeks} weeks
- High priority tasks = should start early
- Higher weight = more critical to success
- Consider all phases: planning → design → development → testing → deployment
- Be specific to ${projectAnalysis.detectedType} projects
- Tasks should be ordered logically by dependency

RESPONSE FORMAT (ONLY VALID JSON):
{
  "reasoning": "2-3 sentences explaining the strategy",
  "projectAnalysis": {
    "type": "${projectAnalysis.detectedType}",
    "keyFocus": ["focus area 1", "focus area 2", "focus area 3"]
  },
  "tasks": [
    {
      "title": "Task name",
      "description": "What this involves",
      "priority": "High|Medium|Low",
      "estimatedHours": 24,
      "weight": 6,
      "category": "backend|frontend|qa|devops|design|planning",
      "dependencies": ["Previous task title"]
    }
  ]
}

Respond with ONLY the JSON object, no additional text.`;

    // Step 3: Call Claude API
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Step 4: Parse response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let plan;
    try {
      plan = JSON.parse(content.text);
    } catch (parseError) {
      console.error("Failed to parse Claude response, using fallback template");
      return generatePlanFromTemplate(projectAnalysis, input);
    }

    // Step 5: Validate and enrich tasks
    if (!plan.tasks || !Array.isArray(plan.tasks)) {
      throw new Error("Invalid task array from AI service");
    }

    const enrichedTasks = enrichTasksWithDates(plan.tasks, start, end, durationWeeks);

    return {
      reasoning: plan.reasoning || "Generated by AI task planner",
      projectAnalysis: plan.projectAnalysis || projectAnalysis,
      tasks: enrichedTasks,
    };
  } catch (error) {
    console.warn(`⚠️  AI Plan generation failed: ${error.message}`);
    const projectAnalysis = analyzeProject(input.description, input.projectName || "");
    return generatePlanFromTemplate(projectAnalysis, input);
  }
};

/**
 * GENERATE PLAN FROM TEMPLATE
 * Uses pre-defined templates when AI fails
 */
const generatePlanFromTemplate = (projectAnalysis, input) => {
  const template = TASK_TEMPLATES[projectAnalysis.template] || TASK_TEMPLATES.general;
  const { startDate, deadline } = input;
  const start = new Date(startDate);
  const end = new Date(deadline);
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const durationWeeks = Math.ceil(durationDays / 7);

  console.log(`📋 Using ${projectAnalysis.detectedType} template with ${template.length} tasks`);

  // Scale tasks to fit timeline
  const selectedTasks = scaleTasksToTimeline(template, durationWeeks);
  const enrichedTasks = enrichTasksWithDates(selectedTasks, start, end, durationWeeks);

  return {
    reasoning: `Optimized task breakdown for ${projectAnalysis.detectedType} project using industry best practices.`,
    projectAnalysis: projectAnalysis,
    tasks: enrichedTasks,
  };
};

/**
 * SCALE TASKS TO TIMELINE
 * Selects and prioritizes tasks based on project duration
 */
const scaleTasksToTimeline = (tasks, durationWeeks) => {
  if (durationWeeks <= 2) {
    // Short sprints: only high priority
    return tasks.filter(t => t.priority === "High").slice(0, 6);
  } else if (durationWeeks <= 4) {
    // Medium: high + some medium
    const high = tasks.filter(t => t.priority === "High");
    const medium = tasks.filter(t => t.priority === "Medium").slice(0, 2);
    return [...high, ...medium].slice(0, 8);
  } else {
    // Full scope: all tasks
    return tasks;
  }
};

/**
 * ENRICH TASKS WITH DATES
 * Calculates start and due dates based on timeline and dependencies
 */
const enrichTasksWithDates = (tasks, start, end, durationWeeks) => {
  const tasksPerWeek = Math.max(1, Math.ceil(tasks.length / durationWeeks));
  
  return tasks.map((task, index) => {
    // Calculate task week based on priority and index
    let taskWeek = 0;
    if (task.priority === "High") {
      taskWeek = Math.floor(index / tasksPerWeek * 0.4); // High priority in first 40%
    } else if (task.priority === "Medium") {
      taskWeek = Math.floor((index + Math.ceil(tasks.length / 3)) / tasksPerWeek * 0.6);
    } else {
      taskWeek = Math.floor((index + Math.ceil(tasks.length / 2)) / tasksPerWeek);
    }

    const taskStartDate = new Date(start);
    taskStartDate.setDate(taskStartDate.getDate() + taskWeek * 7);

    const daysNeeded = Math.max(1, Math.ceil(task.estimatedHours / 8));
    const taskEndDate = new Date(taskStartDate);
    taskEndDate.setDate(taskEndDate.getDate() + daysNeeded);

    // Ensure end date doesn't exceed project deadline
    const finalEndDate = taskEndDate > end ? end : taskEndDate;

    return {
      ...task,
      startDate: taskStartDate.toISOString().split("T")[0],
      dueDate: finalEndDate.toISOString().split("T")[0],
      dependencies: task.dependencies || [],
      durationDays: daysNeeded,
    };
  });
};

/**
 * QUICK PLAN (Offline/Testing)
 * Generates plan using templates without AI
 */
export const generateQuickPlan = (input) => {
  const projectAnalysis = analyzeProject(input.description, input.projectName || "");
  return generatePlanFromTemplate(projectAnalysis, input);
};

/**
 * ANALYZE ONLY
 * Returns project analysis without generating tasks
 */
export const analyzeProjectOnly = (description, projectName = "") => {
  return analyzeProject(description, projectName);
};

export default {
  generateProjectPlan,
  generateQuickPlan,
  analyzeProjectOnly,
};