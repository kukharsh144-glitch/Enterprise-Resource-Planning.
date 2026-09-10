/**
 * Task Recommendation & Decomposition Service
 *
 * Breaks down high-level project targets into atomic task deliverables
 * categorized by project phases (Planning -> DB -> Backend -> Frontend -> Integration -> QA -> Deploy).
 */

const employeeHubTasks = [
  // Phase 1 — Planning
  { title: "Define EmployeeHub requirements", description: "Collect, detail, and write specifications document for the EmployeeHub project.", phase: "Planning", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["Project Management"], recommendedRole: "Project Manager", dependencies: [] },
  { title: "Define user roles and permissions", description: "Specify authorization matrices for Admin, HR, Manager, and Employee.", phase: "Planning", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Security Specs"], recommendedRole: "Security Analyst", dependencies: ["Define EmployeeHub requirements"] },
  { title: "Design application architecture", description: "Map out the MERN stack layout, data flows, and routing guidelines.", phase: "Planning", priority: "High", complexity: "High", estimatedHours: 12, requiredSkills: ["Architecture Design"], recommendedRole: "Software Architect", dependencies: ["Define user roles and permissions"] },
  { title: "Create frontend React project", description: "Setup Vite React template, Tailwind styling, and standard folder structures.", phase: "Planning", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "Vite"], recommendedRole: "Frontend Developer", dependencies: ["Design application architecture"] },
  { title: "Create Node.js + Express backend", description: "Initialize backend packages, nodemon configurations, and base app files.", phase: "Planning", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Design application architecture"] },
  { title: "Configure MongoDB database", description: "Setup MongoDB local instances or Atlas cluster schemas links.", phase: "Planning", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["MongoDB"], recommendedRole: "Database Administrator", dependencies: ["Design application architecture"] },
  { title: "Configure environment variables", description: "Provision security .env configurations for CORS ports and database keys.", phase: "Planning", priority: "Medium", complexity: "Low", estimatedHours: 2, requiredSkills: ["DevOps"], recommendedRole: "Backend Developer", dependencies: ["Create Node.js + Express backend"] },
  { title: "Setup Git repository and project structure", description: "Configure github branches, pull request rules, and readme docs.", phase: "Planning", priority: "Medium", complexity: "Low", estimatedHours: 3, requiredSkills: ["Git"], recommendedRole: "Fullstack Developer", dependencies: ["Define EmployeeHub requirements"] },

  // Phase 2 — Database Design
  { title: "Create User schema", description: "Design MongoDB user schema for password hashes, emails, active tokens, and roles.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["MongoDB", "Mongoose"], recommendedRole: "Database Administrator", dependencies: ["Configure MongoDB database"] },
  { title: "Create Employee schema", description: "Design schema for personal metadata, contact phone, addresses, and salaries.", phase: "Database", priority: "High", complexity: "High", estimatedHours: 8, requiredSkills: ["MongoDB", "Mongoose"], recommendedRole: "Database Administrator", dependencies: ["Configure MongoDB database"] },
  { title: "Create Department schema", description: "Design schema tracking department head, names, and description fields.", phase: "Database", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["MongoDB", "Mongoose"], recommendedRole: "Database Administrator", dependencies: ["Configure MongoDB database"] },
  { title: "Create Skill schema", description: "Design global schema list of unique searchable employee skills.", phase: "Database", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["MongoDB", "Mongoose"], recommendedRole: "Database Administrator", dependencies: ["Configure MongoDB database"] },
  { title: "Create Employee Document schema", description: "Design references schema linking uploaded certificates with employees.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["MongoDB", "Mongoose"], recommendedRole: "Database Administrator", dependencies: ["Create Employee schema"] },
  { title: "Define relationships between schemas", description: "Inject Mongoose ObjectIds refs linking employees to departments and users.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["MongoDB", "Mongoose"], recommendedRole: "Database Administrator", dependencies: ["Create Employee schema", "Create User schema"] },
  { title: "Add validation rules", description: "Configure field validators matching phone numbers formats and birth dates.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["MongoDB", "Mongoose"], recommendedRole: "Database Administrator", dependencies: ["Define relationships between schemas"] },
  { title: "Add database indexes", description: "Apply compound indexes on unique fields like employeeId and user references.", phase: "Database", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["MongoDB"], recommendedRole: "Database Administrator", dependencies: ["Define relationships between schemas"] },

  // Phase 3 — Authentication & Authorization (Backend & Database)
  { title: "Create user registration", description: "Develop register controller hashing password via bcrypt on database save.", phase: "Backend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Node.js", "Express", "bcrypt"], recommendedRole: "Backend Developer", dependencies: ["Create User schema"] },
  { title: "Create login system", description: "Develop sign-in endpoints issuing JWT accessToken and validation structures.", phase: "Backend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Node.js", "Express", "JWT"], recommendedRole: "Backend Developer", dependencies: ["Create User schema"] },
  { title: "Implement authentication", description: "Write express validation middleware parsing bearer tokens from headers.", phase: "Backend", priority: "High", complexity: "Medium", estimatedHours: 4, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Create login system"] },
  { title: "Implement logout", description: "Provide endpoints clearing authorization cookies and session tokens.", phase: "Backend", priority: "High", complexity: "Low", estimatedHours: 2, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Create login system"] },
  { title: "Create protected routes", description: "Gate client-side React routes using context authentication states.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "React Router"], recommendedRole: "Frontend Developer", dependencies: ["Implement authentication"] },
  { title: "Implement role-based access control", description: "Develop gates authorising requests based on Admin vs Employee roles.", phase: "Backend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Implement authentication"] },
  { title: "Add admin permissions", description: "Configure special schema fields allowing override privileges on reports.", phase: "Backend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Implement role-based access control"] },

  // Phase 4 — Employee Management (Frontend & Backend Core)
  { title: "Create Employee Registration form", description: "Construct React registration page tracking multiple inputs states.", phase: "Frontend", priority: "Critical", complexity: "High", estimatedHours: 12, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Create protected routes"] },
  { title: "Add employee profile photo upload", description: "Assemble Cloudinary upload buttons and profile photo cropper boxes.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add personal information fields", description: "Incorporate phone, alternate contact, birth dates, and gender options.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add employment information", description: "Incorporate designation tags, salary band fields, and joining dates.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add department selection", description: "Integrate select dropdowns querying departments list from DB.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add designation/position", description: "Construct text fields validating standard job descriptions templates.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 2, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add joining date", description: "Inject calendar date pickers restricting range within current year limits.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 2, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add skills multi-select", description: "Assemble multi-select viewports displaying selected tags as removable pills.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add employee address information", description: "Build matching form sections replicating current to permanent address details.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add emergency contact information", description: "Include guardian name, relationship type, and emergency phones.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 3, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add employee document upload", description: "Construct files array list checking documents before database writes.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Add employee form validation", description: "Write client validator layers flagging incorrect email and phone formats.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Create employee API", description: "Develop Express controllers executing database CRUD on employee collection.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 10, requiredSkills: ["Node.js", "Express", "MongoDB"], recommendedRole: "Backend Developer", dependencies: ["Create Employee schema", "Implement authentication"] },
  { title: "Create employee list", description: "Build data grids displaying registered employee profiles summaries.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Create employee API"] },
  { title: "Create employee details page", description: "Assemble tabs viewing full contact metadata, documents, and department histories.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },
  { title: "Edit employee information", description: "Develop updates forms prepopulated with active employee profiles attributes.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee details page"] },
  { title: "Delete/deactivate employee", description: "Write archive logic transitioning employee status to Terminated status.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Create employee details page"] },

  // Phase 5 — Employee Documents (Integration)
  { title: "Design document upload UI", description: "Construct clean drag and drop area with custom loading indicators.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Create Employee Registration form"] },
  { title: "Upload 10th certificate", description: "Implement specific validation and secure cloud upload pathways for secondary certificates.", phase: "Integration", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Upload 12th certificate", description: "Implement specific validation and secure cloud upload pathways for higher certificates.", phase: "Integration", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Upload graduation certificate", description: "Implement specific validation and secure cloud upload pathways for degrees.", phase: "Integration", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Upload identity proof", description: "Enforce secure pathways verifying government credentials.", phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Upload address proof", description: "Enforce secure pathways verifying residency certificates.", phase: "Integration", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Upload experience certificate", description: "Add options uploading background references letters.", phase: "Integration", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Upload resume/CV", description: "Inject validations ensuring CVs compile in standard PDF/Word formats.", phase: "Integration", priority: "High", complexity: "Low", estimatedHours: 3, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Upload passport-size photo", description: "Apply aspect ratios checking for image formats.", phase: "Integration", priority: "Medium", complexity: "Low", estimatedHours: 3, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Add other document upload", description: "Support general attachments lists with customized file name keys.", phase: "Integration", priority: "Medium", complexity: "Low", estimatedHours: 3, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Design document upload UI"] },
  { title: "Validate file type and size", description: "Restrict files extension to PDF, PNG, JPG, and cap size at 5MB limits.", phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 4, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Design document upload UI"] },
  { title: "Store documents securely", description: "Configure Cloudinary API storage options with folders structures.", phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Node.js", "Cloudinary"], recommendedRole: "Backend Developer", dependencies: ["Validate file type and size"] },
  { title: "Preview/download documents", description: "Inject safe preview routes allowing PDF files rendering inside viewports.", phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Store documents securely"] },
  { title: "Delete/replace documents", description: "Develop handlers destroying files on Cloudinary matching employee updates.", phase: "Integration", priority: "Medium", complexity: "Medium", estimatedHours: 4, requiredSkills: ["Node.js", "Cloudinary"], recommendedRole: "Backend Developer", dependencies: ["Store documents securely"] },

  // Phase 6 — Department & Skills (Frontend & Backend)
  { title: "Create department", description: "Develop backend routes and simple forms to create department records.", phase: "Backend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Create Department schema"] },
  { title: "Edit department", description: "Allow changing department metadata details and head allocations.", phase: "Backend", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Create department"] },
  { title: "Delete/deactivate department", description: "Develop safety check ensuring no active employees are linked before delete.", phase: "Backend", priority: "Medium", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Create department"] },
  { title: "View department employees", description: "Construct viewports listing employees active in selected departments.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create department", "Create employee list"] },
  { title: "Assign employee to department", description: "Construct updates endpoints transitioning employees departments refs.", phase: "Backend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Create department", "Create employee API"] },
  { title: "Create skill", description: "Construct simple text inputs appending new searchable skills in DB.", phase: "Backend", priority: "Medium", complexity: "Low", estimatedHours: 3, requiredSkills: ["Node.js", "Express"], recommendedRole: "Backend Developer", dependencies: ["Create Skill schema"] },
  { title: "Display available skills", description: "Render multi-select skill check boxes inside registration pages.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create skill"] },
  { title: "Implement searchable skill selection", description: "Construct input filters matches query strings to available skills lists.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Display available skills"] },
  { title: "Implement multi-select skills", description: "Develop UI managers tracking arrays of active checked skills.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Display available skills"] },
  { title: "Display selected skills as removable tags", description: "Style visual capsules with X buttons to clear skills tags.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Implement multi-select skills"] },
  { title: "Edit employee skills", description: "Permit admins to append or clear skills on profiles update pages.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Display selected skills as removable tags"] },

  // Phase 7 — Search & Employee Management Tools
  { title: "Employee search", description: "Develop index filters mapping employee names to search box inputs.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },
  { title: "Filter by department", description: "Filter employees list by department dropdown selections.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },
  { title: "Filter by designation", description: "Filter employees list by designation keyword matches.", phase: "Frontend", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },
  { title: "Filter by skills", description: "Filter employees list by multi-select selected skills parameters.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },
  { title: "Filter by joining date", description: "Filter employees list by range calendar dates.", phase: "Frontend", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },
  { title: "Sort employees", description: "Incorporate headers sort sorting alphabetically by names or departments.", phase: "Frontend", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },
  { title: "Add pagination", description: "Develop server-side offset counts splitting results to page limits.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Create employee list"] },
  { title: "Employee status filter", description: "Filter employees lists checking Active vs On Leave categories.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 3, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Create employee list"] },

  // Phase 8 — Admin Dashboard
  { title: "Dashboard layout", description: "Style grid containers showing stat summary cards and charts.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Create protected routes"] },
  { title: "Employee statistics", description: "Summarize total active staff counts and gender distribution metrics.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Dashboard layout"] },
  { title: "Department statistics", description: "Develop chart widgets tracing employee distributions by department.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "Chart.js"], recommendedRole: "Frontend Developer", dependencies: ["Dashboard layout"] },
  { title: "Recent employees", description: "Render summary table showing details of last 5 joined staff members.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Dashboard layout"] },
  { title: "New employee count", description: "Track numbers of employee registrations within current month boundaries.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Dashboard layout"] },
  { title: "Active/inactive employee count", description: "Contrast Active vs Terminated database profile totals in charts.", phase: "Frontend", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React"], recommendedRole: "Frontend Developer", dependencies: ["Dashboard layout"] },
  { title: "Employee growth chart", description: "Build line graphs plotting cumulative staff counts over months.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "Chart.js"], recommendedRole: "Frontend Developer", dependencies: ["Dashboard layout"] },
  { title: "Department distribution chart", description: "Build pie graphs showing percentages of staff working in HR, IT, sales.", phase: "Frontend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["React", "Chart.js"], recommendedRole: "Frontend Developer", dependencies: ["Dashboard layout"] },

  // Phase 9 — Notifications
  { title: "Employee registration notification", description: "Publish system socket alerts when new profiles are seeded.", phase: "Backend", priority: "Medium", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Node.js", "Socket.io"], recommendedRole: "Backend Developer", dependencies: ["Create employee API"] },
  { title: "Document upload notification", description: "Publish alerts when profile documents files are uploaded.", phase: "Backend", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Socket.io"], recommendedRole: "Backend Developer", dependencies: ["Store documents securely"] },
  { title: "Missing document notification", description: "Flag alerts when crucial degree certificates are absent from profiles.", phase: "Backend", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Node.js", "Socket.io"], recommendedRole: "Backend Developer", dependencies: ["Store documents securely"] },
  { title: "Employee update notification", description: "Broadcast notifications on profiles updates checks.", phase: "Backend", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Socket.io"], recommendedRole: "Backend Developer", dependencies: ["Edit employee information"] },
  { title: "System notifications", description: "Inject warnings on network delay issues or maintenance windows.", phase: "Backend", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["Node.js", "Socket.io"], recommendedRole: "Backend Developer", dependencies: ["Dashboard layout"] },

  // Phase 10 — Testing
  { title: "Test authentication", description: "Write Jest tests verifying JWT credentials and login validations.", phase: "Testing", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["Jest", "Supertest"], recommendedRole: "QA Engineer", dependencies: ["Create login system"] },
  { title: "Test employee registration", description: "Execute automated scripts testing inputs boundaries and payload constraints.", phase: "Testing", priority: "Critical", complexity: "High", estimatedHours: 10, requiredSkills: ["Jest", "Supertest"], recommendedRole: "QA Engineer", dependencies: ["Create Employee Registration form"] },
  { title: "Test employee update", description: "Verify update controllers successfully modify employee schema attributes.", phase: "Testing", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Jest", "Supertest"], recommendedRole: "QA Engineer", dependencies: ["Edit employee information"] },
  { title: "Test employee deletion", description: "Confirm deactivated profiles transition to Terminated state successfully.", phase: "Testing", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Jest", "Supertest"], recommendedRole: "QA Engineer", dependencies: ["Delete/deactivate employee"] },
  { title: "Test document upload", description: "Verify mock file uploads correctly post to Cloudinary mock handlers.", phase: "Testing", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["Jest", "Supertest"], recommendedRole: "QA Engineer", dependencies: ["Store documents securely"] },
  { title: "Test file validation", description: "Assert uploads with invalid file types or excessive sizes are rejected.", phase: "Testing", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Jest", "Supertest"], recommendedRole: "QA Engineer", dependencies: ["Validate file type and size"] },
  { title: "Test skills selection", description: "Validate custom multi-select checkbox hooks and tags removal actions.", phase: "Testing", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["React Testing Library"], recommendedRole: "QA Engineer", dependencies: ["Display selected skills as removable tags"] },
  { title: "Test search/filter", description: "Write queries tests matching designation names and skills criteria.", phase: "Testing", priority: "Medium", complexity: "Medium", estimatedHours: 6, requiredSkills: ["Jest"], recommendedRole: "QA Engineer", dependencies: ["Employee search"] },
  { title: "Test API errors", description: "Verify backend routes safely catch CastError and 500 exceptions.", phase: "Testing", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Jest"], recommendedRole: "QA Engineer", dependencies: ["Test authentication"] },
  { title: "Test frontend validation", description: "Verify validation toast messages pop up on incorrect phone numbers.", phase: "Testing", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["React Testing Library"], recommendedRole: "QA Engineer", dependencies: ["Add employee form validation"] },
  { title: "Test responsive design", description: "Verify dashboard components adapt correctly across mobile viewports.", phase: "Testing", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["Cypress"], recommendedRole: "QA Engineer", dependencies: ["Dashboard layout"] },

  // Phase 11 — Deployment
  { title: "Configure production environment", description: "Setup cloud config values tracking ports, CORS links and secret keys.", phase: "Deployment", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["DevOps", "AWS"], recommendedRole: "DevOps Engineer", dependencies: ["Configure environment variables"] },
  { title: "Configure production database", description: "Establish MongoDB Atlas cloud backup schemas and replica sets.", phase: "Deployment", priority: "High", complexity: "Medium", estimatedHours: 6, requiredSkills: ["MongoDB", "DevOps"], recommendedRole: "Database Administrator", dependencies: ["Configure MongoDB database"] },
  { title: "Configure file storage", description: "Link Cloudinary API production credential variables.", phase: "Deployment", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Cloudinary", "DevOps"], recommendedRole: "DevOps Engineer", dependencies: ["Store documents securely"] },
  { title: "Build React application", description: "Execute build bundlers outputting minified index static assets.", phase: "Deployment", priority: "High", complexity: "Low", estimatedHours: 4, requiredSkills: ["Vite", "Node.js"], recommendedRole: "DevOps Engineer", dependencies: ["Create frontend React project"] },
  { title: "Deploy backend", description: "Publish Express API codebases onto cloud hosting platforms like AWS/Heroku.", phase: "Deployment", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["AWS", "DevOps"], recommendedRole: "DevOps Engineer", dependencies: ["Configure production environment", "Create Node.js + Express backend"] },
  { title: "Deploy frontend", description: "Deploy static files bundles onto secure edge caches like Vercel/Netlify.", phase: "Deployment", priority: "High", complexity: "Medium", estimatedHours: 8, requiredSkills: ["Vercel", "DevOps"], recommendedRole: "DevOps Engineer", dependencies: ["Build React application", "Deploy backend"] },
  { title: "Configure domain", description: "Link custom DNS name servers to deployed endpoints with SSL certifications.", phase: "Deployment", priority: "Medium", complexity: "Low", estimatedHours: 4, requiredSkills: ["DNS"], recommendedRole: "DevOps Engineer", dependencies: ["Deploy frontend"] },
  { title: "Configure CORS", description: "Whitelist production client URLs inside backend CORS configuration.", phase: "Deployment", priority: "High", complexity: "Low", estimatedHours: 2, requiredSkills: ["Node.js", "Express"], recommendedRole: "DevOps Engineer", dependencies: ["Deploy backend"] },
  { title: "Test production application", description: "Execute full smoke tests verifying end-to-end user registrations on cloud endpoints.", phase: "Deployment", priority: "Critical", complexity: "High", estimatedHours: 8, requiredSkills: ["QA Testing"], recommendedRole: "QA Engineer", dependencies: ["Deploy frontend", "Deploy backend"] }
];

const structureParentAndSubtasks = (list, startDate, deadline) => {
  const PHASE_PARENTS = {
    Planning: { title: "📋 Project Setup & Specifications", description: "Project setup, requirements analysis, Git repository, and system architecture specification deliverables." },
    Architecture: { title: "📐 System Architecture & Threat Modeling", description: "System component diagrams, data flow boundaries, threat models, and interface contract definitions." },
    Database: { title: "🗄️ Database Schemas & Data Modeling", description: "Mongoose database schemas configuration, relationships mappings, field validation, and database indexing." },
    Backend: { title: "⚙️ Core REST API Backend Development", description: "Node/Express backend routers implementation, authorization controls, and server endpoints." },
    Frontend: { title: "🎨 Responsive UI Frontend Components", description: "Responsive layouts design, forms creation, state hooks, and client-side page views." },
    Integration: { title: "🔌 Third-Party APIs & Services Integration", description: "Third-party gateways integration, file uploads storage, and socket links." },
    Security: { title: "🛡️ Security Hardening & Compliance Auditing", description: "Vulnerability remediation, access control audits, data encryption, and compliance controls." },
    Testing: { title: "🧪 Quality Assurance & End-to-End Testing", description: "Unit scripts executions, validation logic testing, and integration audits." },
    DevOps: { title: "🚀 DevOps, CI/CD & Cloud Infrastructure", description: "Docker images provisioning, environment configurations, and deployment pipelines." },
    Deployment: { title: "🌐 Production Build & Cloud Release", description: "Production asset minification, edge cache invalidation, and domain DNS SSL configurations." },
    Monitoring: { title: "📈 Telemetry Monitoring, Operations & SLA", description: "Real-time metrics, error alerting, uptime monitoring, and SLA tracking dashboards." }
  };

  const activePhases = [...new Set(list.map(t => t.phase))];
  
  const parentTasks = activePhases.map(phaseKey => {
    const parentDef = PHASE_PARENTS[phaseKey] || { title: `📂 ${phaseKey} Phase Overview`, description: `Management overview for ${phaseKey} tasks.` };
    return {
      title: parentDef.title,
      description: parentDef.description,
      phase: phaseKey,
      priority: "High",
      complexity: "Medium",
      estimatedHours: 8,
      requiredSkills: ["Project Management"],
      recommendedRole: "Project Manager",
      dependencies: [],
      startDate: startDate,
      dueDate: deadline,
      isParent: true,
      progressPercent: 0,
      status: "Pending"
    };
  });

  const subtasks = list.map(task => {
    const parentDef = PHASE_PARENTS[task.phase] || { title: `📂 ${task.phase} Phase Overview` };
    return {
      ...task,
      parentTaskTitle: parentDef.title,
      isCompleted: false,
      progressPercent: 0,
      status: "Pending"
    };
  });

  return [...parentTasks, ...subtasks];
};

export const generateTasks = async (input, maybeDesc, maybeStart, maybeDeadline) => {
  let projectName = "";
  let description = "";
  let startDate = null;
  let deadline = null;

  if (typeof input === "object" && input !== null) {
    projectName = input.projectName || "";
    description = input.description || "";
    startDate = input.startDate;
    deadline = input.deadline;
  } else if (typeof input === "string") {
    projectName = input;
    description = maybeDesc || "";
    startDate = maybeStart;
    deadline = maybeDeadline;
  }

  const start = (startDate && !isNaN(new Date(startDate).getTime())) 
    ? new Date(startDate) 
    : new Date();
  const end = (deadline && !isNaN(new Date(deadline).getTime())) 
    ? new Date(deadline) 
    : new Date(Date.now() + 30 * 86400000);
  
  const descLower = description.toLowerCase();
  const nameLower = projectName.toLowerCase();

  const isEmployeeHub = nameLower.includes("employeehub") || descLower.includes("employee management") || descLower.includes("employeehub") || nameLower.includes("employee management");

  if (isEmployeeHub) {
    const tasksPerWeek = Math.ceil(employeeHubTasks.length / 10) || 10;
    
    const mappedSubtasks = employeeHubTasks.map((task, index) => {
      const taskWeekStart = Math.floor(index / tasksPerWeek);
      const taskStartDate = new Date(start);
      taskStartDate.setDate(taskStartDate.getDate() + taskWeekStart * 7);

      const taskEndDate = new Date(taskStartDate);
      taskEndDate.setDate(taskEndDate.getDate() + 5);

      const requiredSkills = task.requiredSkills.length > 0 ? task.requiredSkills : ["JavaScript"];
      if (task.phase === "Database" && !requiredSkills.includes("MongoDB")) requiredSkills.push("MongoDB", "Mongoose");
      if (task.phase === "Backend" && !requiredSkills.includes("Node.js")) requiredSkills.push("Node.js", "Express");
      if (task.phase === "Frontend" && !requiredSkills.includes("React")) requiredSkills.push("React", "CSS");
      if (task.phase === "Integration" && !requiredSkills.includes("Cloudinary")) requiredSkills.push("REST API", "Axios");
      if (task.phase === "Testing" && !requiredSkills.includes("Jest")) requiredSkills.push("Jest", "Supertest");
      if (task.phase === "Deployment" && !requiredSkills.includes("Docker")) requiredSkills.push("Docker", "AWS");

      return {
        title: task.title,
        description: task.description,
        phase: task.phase,
        priority: task.priority,
        complexity: task.complexity,
        estimatedHours: task.estimatedHours,
        requiredSkills,
        dependencies: task.dependencies,
        recommendedRole: task.recommendedRole,
        acceptanceCriteria: [
          `Deliverable '${task.title}' passes standard compiler code validations.`,
          "Unit test scripts execute without functional errors.",
          "Matches aesthetic UI style constraints."
        ],
        potentialRisks: [
          "Unclear third-party API configurations causing timeouts.",
          "Timeline slips due to complex schema index additions."
        ],
        startDate: taskStartDate.toISOString().split("T")[0],
        dueDate: taskEndDate > end ? end.toISOString().split("T")[0] : taskEndDate.toISOString().split("T")[0],
      };
    });

    return structureParentAndSubtasks(mappedSubtasks, startDate, deadline);
  }
  
  let suggested = [];

  const cleanDesc = description.replace(/[\r\n]+/g, " ");
  const parts = cleanDesc.split(/[.,;:]|\band\b|\bthen\b|\bshould\b|\bneed to\b/i);
  const verbs = [
    "build", "create", "implement", "integrate", "design", "setup", "develop", 
    "test", "configure", "make", "add", "run", "verify", "deploy", "audit", 
    "write", "prepare", "analyze", "review", "refactor"
  ];

  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.length < 8) return;

    const words = trimmed.split(/\s+/);
    const verbIndex = words.findIndex(w => verbs.includes(w.toLowerCase()));

    if (verbIndex !== -1) {
      const phrase = words.slice(verbIndex).join(" ");
      const title = phrase.charAt(0).toUpperCase() + phrase.slice(1);
      if (title.length > 8 && title.length < 80) {
        let phase = "Backend";
        const titleLower = title.toLowerCase();
        if (titleLower.includes("design") || titleLower.includes("spec") || titleLower.includes("planning")) phase = "Planning";
        else if (titleLower.includes("database") || titleLower.includes("schema") || titleLower.includes("mongodb") || titleLower.includes("model")) phase = "Database";
        else if (titleLower.includes("ui") || titleLower.includes("screen") || titleLower.includes("frontend") || titleLower.includes("page")) phase = "Frontend";
        else if (titleLower.includes("test") || titleLower.includes("qa") || titleLower.includes("audit")) phase = "Testing";
        else if (titleLower.includes("deploy") || titleLower.includes("host") || titleLower.includes("launch")) phase = "Deployment";
        else if (titleLower.includes("integrate") || titleLower.includes("stripe") || titleLower.includes("connect")) phase = "Integration";

        suggested.push({
          title,
          description: `Analyze requirements and implement task: "${trimmed}".`,
          phase
        });
      }
    }
  });

  const expandedList = [];
  const addExpandedTask = (task) => {
    const titleLower = task.title.toLowerCase();
    if (titleLower.includes("employee management") || titleLower.includes("register employee")) {
      expandedList.push(
        { title: "Design Employee Schema Collections", description: "Setup Mongoose constraints for personal metadata, contact phone, and salaries.", phase: "Database" },
        { title: "Develop Employee Profile API CRUD Router", description: "Write endpoints to retrieve, insert, and update employee documents.", phase: "Backend" },
        { title: "Build Employee Form Registration UI screen", description: "Construct React input validation fields matching required documents uploads.", phase: "Frontend" },
        { title: "Assemble Employees List & Search Filters viewport", description: "Add table queries matching designation tags and status filters.", phase: "Frontend" }
      );
    } else if (titleLower.includes("e-commerce") || titleLower.includes("shop") || titleLower.includes("store")) {
      expandedList.push(
        { title: "Provision Products Catalog & Filter UI", description: "Build grid display components with search bars and category tags.", phase: "Frontend" },
        { title: "Assemble Shopping Cart state store", description: "Implement React context store tracking selected products quantities.", phase: "Frontend" },
        { title: "Integrate Stripe Payment secure Gateway", description: "Implement secure card checkouts on client routes connected to backend charges.", phase: "Integration" }
      );
    } else {
      expandedList.push(task);
    }
  };

  suggested.forEach(t => addExpandedTask(t));

  // Domain-specific task generation
  const cleanName = projectName.replace(/ \d+$/, '').trim();
  const domainLower = `${projectName} ${description}`.toLowerCase();
  let domainTasks = [];

  if (domainLower.includes("erp") || domainLower.includes("enterprise resource planning") || domainLower.includes("centralized platform") || domainLower.includes("daily operations of organizations")) {
    domainTasks = [
      { title: "Define ERP Nexus Architecture & Multi-Department Scope", description: "Collect and detail technical specifications for HR, Finance, Projects, Attendance, and Payroll modules.", phase: "Planning", priority: "Critical", complexity: "High", estimatedHours: 12, requiredSkills: ["Project Management", "ERP Architecture"], recommendedRole: "Enterprise Architect", dependencies: [] },
      { title: "Architect Modular ERP Microservices & Real-Time Sync Pipeline", description: "Design modular service boundaries, WebSocket event channels, and shared database models.", phase: "Architecture", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["System Architecture", "Microservices"], recommendedRole: "Software Architect", dependencies: ["Define ERP Nexus Architecture & Multi-Department Scope"] },
      { title: "Design Schemas for Users, Roles, Employees & Departments", description: "Create Mongoose collections with foreign key references, compound indexes, and validation rules.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["MongoDB", "Mongoose", "Database Indexing"], recommendedRole: "Database Administrator", dependencies: ["Architect Modular ERP Microservices & Real-Time Sync Pipeline"] },
      { title: "Design Schemas for Payroll, Attendance, Projects & Tasks", description: "Provision models for salary bands, daily time logs, leave requests, projects, and Kanban deliverables.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["MongoDB", "Mongoose", "Data Modeling"], recommendedRole: "Database Administrator", dependencies: ["Design Schemas for Users, Roles, Employees & Departments"] },
      { title: "Implement Role-Based Access Control (RBAC) & Auth Gateways", description: "Build JWT authentication middleware enforcing Admin, Manager, HR, Finance, and Employee permissions.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "Express", "JWT"], recommendedRole: "Backend Developer", dependencies: ["Design Schemas for Users, Roles, Employees & Departments"] },
      { title: "Build Centralized Resource Allocation & Project Task APIs", description: "Develop REST endpoints for creating projects, allocating staff, tracking milestones, and updating Kanban status.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "Express", "REST APIs"], recommendedRole: "Backend Developer", dependencies: ["Implement Role-Based Access Control (RBAC) & Auth Gateways"] },
      { title: "Build Attendance Tracking & Automated Payroll Engine", description: "Implement controllers for daily punch-in/out, leave approvals, salary calculations, and payslips.", phase: "Backend", priority: "High", complexity: "High", estimatedHours: 16, requiredSkills: ["Node.js", "Express", "REST APIs"], recommendedRole: "Backend Developer", dependencies: ["Implement Role-Based Access Control (RBAC) & Auth Gateways"] },
      { title: "Develop Unified Executive ERP Dashboard & Department Switcher", description: "Build responsive React overview hub displaying live operational indicators, department cards, and KPI charts.", phase: "Frontend", priority: "Critical", complexity: "High", estimatedHours: 20, requiredSkills: ["React", "TailwindCSS", "JavaScript"], recommendedRole: "Frontend Developer", dependencies: ["Build Centralized Resource Allocation & Project Task APIs"] },
      { title: "Build Employee Directory, Attendance & Payroll Management UI", description: "Construct interactive data grids for staff profiles, document uploads, shift calendars, and payroll tables.", phase: "Frontend", priority: "High", complexity: "High", estimatedHours: 18, requiredSkills: ["React", "CSS", "JavaScript"], recommendedRole: "Frontend Developer", dependencies: ["Develop Unified Executive ERP Dashboard & Department Switcher"] },
      { title: "Integrate WebSockets Real-Time Sync & Invoicing Notification Engine", description: "Connect Socket.io for instant cross-tab live data synchronization, alert badges, and PDF invoice generation.", phase: "Integration", priority: "Critical", complexity: "Medium", estimatedHours: 16, requiredSkills: ["Socket.io", "PDFKit", "Node.js"], recommendedRole: "Fullstack Developer", dependencies: ["Build Attendance Tracking & Automated Payroll Engine"] },
      { title: "Enforce PII Data Encryption, Field Masking & OWASP Top 10 Auditing", description: "Apply AES-256 field encryption on salaries and personal IDs, helmet headers, and CORS security constraints.", phase: "Security", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["OWASP", "Security", "Encryption"], recommendedRole: "Security Engineer", dependencies: ["Integrate WebSockets Real-Time Sync & Invoicing Notification Engine"] },
      { title: "Automated Multi-Tenant Workflow QA & Edge-Case Stress Testing", description: "Run automated test suites validating concurrent user operations, role privilege checks, and payroll math.", phase: "Testing", priority: "High", complexity: "High", estimatedHours: 16, requiredSkills: ["Jest", "Supertest", "QA Testing"], recommendedRole: "QA Engineer", dependencies: ["Enforce PII Data Encryption, Field Masking & OWASP Top 10 Auditing"] },
      { title: "Configure Dockerized ERP Services, Redis Caching & CI/CD Pipelines", description: "Provision multi-container Docker Compose environments with Redis caching and GitHub Actions automated tests.", phase: "DevOps", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["Docker", "Redis", "GitHub Actions"], recommendedRole: "DevOps Engineer", dependencies: ["Automated Multi-Tenant Workflow QA & Edge-Case Stress Testing"] },
      { title: "Production High-Availability Cloud Deployment with SSL & CDN", description: "Deploy ERP platform onto scalable multi-region cloud cluster with SSL termination and CDN asset delivery.", phase: "Deployment", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["AWS / Cloud", "DevOps", "Nginx"], recommendedRole: "DevOps Engineer", dependencies: ["Configure Dockerized ERP Services, Redis Caching & CI/CD Pipelines"] },
      { title: "Real-Time Telemetry: User Concurrency, System Health & Error Alarms", description: "Setup Prometheus metrics, server error logging, and real-time operational notifications.", phase: "Monitoring", priority: "Medium", complexity: "Low", estimatedHours: 8, requiredSkills: ["Prometheus", "Telemetry", "Logging"], recommendedRole: "SRE Engineer", dependencies: ["Production High-Availability Cloud Deployment with SSL & CDN"] }
    ];
  } else if (domainLower.includes("security") || domainLower.includes("compliance") || domainLower.includes("audit") || domainLower.includes("soc2") || domainLower.includes("gdpr")) {
    domainTasks = [
      { title: "Define Security Compliance Scope & Audit Matrix", description: "Document SOC 2 Trust Principles, ISO 27001 Annex A controls, and audit milestone criteria.", phase: "Planning", priority: "Critical", complexity: "High", estimatedHours: 12, requiredSkills: ["Compliance Specs", "Security Architecture"], recommendedRole: "Security Architect", dependencies: [] },
      { title: "Architect Zero-Trust Access & Threat Model Gateway", description: "Design cryptographic authorization boundaries, TLS 1.3 endpoints, and threat vectors mitigation map.", phase: "Architecture", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["System Architecture", "Threat Modeling"], recommendedRole: "Security Architect", dependencies: ["Define Security Compliance Scope & Audit Matrix"] },
      { title: "Design Immutable Audit Trail & Ledger Schemas", description: "Setup Mongoose schemas tracking actor, action, SHA-256 payload hash, timestamp, and entity references.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["MongoDB", "Mongoose", "Database Indexing"], recommendedRole: "Database Administrator", dependencies: ["Architect Zero-Trust Access & Threat Model Gateway"] },
      { title: "Configure Encrypted Data At Rest & PII Masking Rules", description: "Apply AES-256 field-level encryption constraints and dynamic column masking for employee personal records.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["MongoDB", "Encryption"], recommendedRole: "Database Administrator", dependencies: ["Design Immutable Audit Trail & Ledger Schemas"] },
      { title: "Implement RBAC & Fine-Grained Permission Middleware", description: "Build Express gates enforcing granular access permissions and active session token revocations.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "Express", "JWT"], recommendedRole: "Backend Developer", dependencies: ["Design Immutable Audit Trail & Ledger Schemas"] },
      { title: "Build Automated CVE Vulnerability Scanner & Audit APIs", description: "Create endpoints querying dependency registries, detecting vulnerable packages, and indexing security flags.", phase: "Backend", priority: "High", complexity: "Medium", estimatedHours: 16, requiredSkills: ["Node.js", "Express", "REST APIs"], recommendedRole: "Backend Developer", dependencies: ["Implement RBAC & Fine-Grained Permission Middleware"] },
      { title: "Develop Executive Compliance Overview & Security Dashboard", description: "Build responsive React overview cards showing audit health scores, open vulnerabilities, and compliance charts.", phase: "Frontend", priority: "High", complexity: "High", estimatedHours: 20, requiredSkills: ["React", "TailwindCSS", "JavaScript"], recommendedRole: "Frontend Developer", dependencies: ["Implement RBAC & Fine-Grained Permission Middleware"] },
      { title: "Build Vulnerability Remediation Backlog & Audit Viewer", description: "Construct interactive data grid allowing security leads to review CVE findings and assign patches.", phase: "Frontend", priority: "Medium", complexity: "Medium", estimatedHours: 16, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Develop Executive Compliance Overview & Security Dashboard"] },
      { title: "Integrate HashiCorp Vault Secrets & Key Rotation Engine", description: "Connect HashiCorp Vault API for automated cryptographic key rotation and credential storage.", phase: "Integration", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["HashiCorp Vault", "Node.js", "REST APIs"], recommendedRole: "Security Engineer", dependencies: ["Implement RBAC & Fine-Grained Permission Middleware"] },
      { title: "Execute OWASP Top 10 Hardening & Dependency Checks", description: "Inject OWASP Helmet security headers, CORS origin whitelisting, and run Snyk vulnerability tests in CI.", phase: "Security", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["OWASP", "Snyk", "Security Hardening"], recommendedRole: "Security Engineer", dependencies: ["Integrate HashiCorp Vault Secrets & Key Rotation Engine"] },
      { title: "Automated Penetration Testing & Endpoint Fuzzing Suite", description: "Run automated test scripts asserting SQL/NoSQL injection immunity and rate-limiting enforcement.", phase: "Testing", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["Jest", "Supertest", "QA Testing"], recommendedRole: "QA Security Specialist", dependencies: ["Execute OWASP Top 10 Hardening & Dependency Checks"] },
      { title: "Configure Hardened Docker Containers & CI/CD Security Gates", description: "Provision non-root Docker containers, vulnerability image scanning, and automated commit hooks.", phase: "DevOps", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["Docker", "GitHub Actions", "DevOps"], recommendedRole: "DevOps Engineer", dependencies: ["Automated Penetration Testing & Endpoint Fuzzing Suite"] },
      { title: "Production Cloud Deployment with WAF & CloudWatch Metrics", description: "Deploy secured microservices onto AWS cloud infrastructure behind Web Application Firewall (WAF).", phase: "Deployment", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["AWS", "DevOps", "Cloud Infrastructure"], recommendedRole: "DevOps Engineer", dependencies: ["Configure Hardened Docker Containers & CI/CD Security Gates"] },
      { title: "Real-Time Intrusion Alerting & Audit Archival Monitoring", description: "Configure Prometheus telemetry alarms, socket alerts on repeated failed logins, and cold S3 storage backups.", phase: "Monitoring", priority: "High", complexity: "Medium", estimatedHours: 10, requiredSkills: ["Prometheus", "Telemetry", "Socket.io"], recommendedRole: "SRE Engineer", dependencies: ["Production Cloud Deployment with WAF & CloudWatch Metrics"] }
    ];
  } else if (domainLower.includes("knowledge base") || domainLower.includes("ai") || domainLower.includes("machine learning") || domainLower.includes("rag") || domainLower.includes("llm")) {
    domainTasks = [
      { title: "Define Knowledge Taxonomy & RAG Retrieval Specs", description: "Outline document hierarchies, supported file formats, chunking boundaries, and accuracy metrics.", phase: "Planning", priority: "High", complexity: "Medium", estimatedHours: 10, requiredSkills: ["AI Architecture", "Project Management"], recommendedRole: "AI Architect", dependencies: [] },
      { title: "Architect RAG Retrieval Pipeline & Token Routing Model", description: "Design dense vector indexing, hybrid keyword search router, and multi-model fallback mechanics.", phase: "Architecture", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["System Architecture", "AI Engineering"], recommendedRole: "AI Architect", dependencies: ["Define Knowledge Taxonomy & RAG Retrieval Specs"] },
      { title: "Provision Vector Database & Metadata Schema Collections", description: "Setup Pinecone/Chroma collections and MongoDB metadata references with cosine similarity indexing.", phase: "Database", priority: "High", complexity: "High", estimatedHours: 14, requiredSkills: ["MongoDB", "Vector DB", "Database Indexing"], recommendedRole: "Database Administrator", dependencies: ["Architect RAG Retrieval Pipeline & Token Routing Model"] },
      { title: "Build Document Chunking Worker & Embedding Service", description: "Develop Node/Python workers parsing PDF/Markdown files and generating normalized vector embeddings.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "LangChain", "REST APIs"], recommendedRole: "Backend Developer", dependencies: ["Provision Vector Database & Metadata Schema Collections"] },
      { title: "Implement RAG Generation Engine with Source Attribution", description: "Construct query pipelines injecting top-k context passages into LLM prompts with footnote citations.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "Express", "OpenAI / Claude API"], recommendedRole: "AI Backend Developer", dependencies: ["Build Document Chunking Worker & Embedding Service"] },
      { title: "Construct Interactive Prompt Playground & Citation UI", description: "Build conversational chat interface featuring streaming markdown, citation popovers, and model pickers.", phase: "Frontend", priority: "High", complexity: "High", estimatedHours: 20, requiredSkills: ["React", "TailwindCSS", "JavaScript"], recommendedRole: "Frontend Developer", dependencies: ["Implement RAG Generation Engine with Source Attribution"] },
      { title: "Build Document Upload Drawer & Knowledge Hub Screen", description: "Create drag-and-drop document upload interface with live parsing progress and metadata tags.", phase: "Frontend", priority: "Medium", complexity: "Medium", estimatedHours: 14, requiredSkills: ["React", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Construct Interactive Prompt Playground & Citation UI"] },
      { title: "Integrate LLM Provider API Gateways & Token Rate Limiters", description: "Link OpenAI / Anthropic APIs with exponential backoff retries and tenant token usage trackers.", phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["REST APIs", "Node.js", "Axios"], recommendedRole: "Backend Developer", dependencies: ["Implement RAG Generation Engine with Source Attribution"] },
      { title: "Implement Hallucination Guardrails & PII Sanitizer", description: "Deploy automated guardrail filters scanning prompt inputs and generated outputs for sensitive data.", phase: "Security", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["AI Safety", "Regex", "Security"], recommendedRole: "Security Engineer", dependencies: ["Integrate LLM Provider API Gateways & Token Rate Limiters"] },
      { title: "Execute Groundedness Benchmarks & Accuracy Evaluations", description: "Run automated evaluation sets comparing LLM responses against benchmark golden test passages.", phase: "Testing", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["Jest", "QA Testing", "Supertest"], recommendedRole: "QA Engineer", dependencies: ["Implement Hallucination Guardrails & PII Sanitizer"] },
      { title: "Deploy GPU/CPU Inference Workers & Redis Semantic Cache", description: "Setup Docker container clusters with Redis caching to serve frequent query answers sub-50ms.", phase: "DevOps", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["Docker", "Redis", "DevOps"], recommendedRole: "DevOps Engineer", dependencies: ["Execute Groundedness Benchmarks & Accuracy Evaluations"] },
      { title: "Production Cloud Release & Edge Delivery Optimization", description: "Deploy web application and API gateway onto high-availability cloud infrastructure with CDN.", phase: "Deployment", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["Cloud Infrastructure", "DevOps", "AWS"], recommendedRole: "DevOps Engineer", dependencies: ["Deploy GPU/CPU Inference Workers & Redis Semantic Cache"] },
      { title: "Telemetry Dashboard: Token Usage, Latency & Query Misses", description: "Track token consumption billing, query response times, and identify unindexed knowledge gaps.", phase: "Monitoring", priority: "Medium", complexity: "Low", estimatedHours: 8, requiredSkills: ["Telemetry", "Logging", "Chart.js"], recommendedRole: "Fullstack Developer", dependencies: ["Production Cloud Release & Edge Delivery Optimization"] }
    ];
  } else if (domainLower.includes("fleet") || domainLower.includes("vehicle") || domainLower.includes("tracking") || domainLower.includes("gps")) {
    domainTasks = [
      { title: "Define Telemetry Protocols & Fleet Geofence Requirements", description: "Specify GPS coordinate sampling frequencies, device payload structures, and geofence polygons.", phase: "Planning", priority: "High", complexity: "Medium", estimatedHours: 10, requiredSkills: ["Project Management", "IoT Specs"], recommendedRole: "Product Architect", dependencies: [] },
      { title: "Architect High-Frequency Telemetry Ingestion Pipeline", description: "Design WebSockets gateway, Redis message broker, and batch insertion database pipelines.", phase: "Architecture", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["System Architecture", "WebSockets"], recommendedRole: "System Architect", dependencies: ["Define Telemetry Protocols & Fleet Geofence Requirements"] },
      { title: "Design Geospatial Schemas for Vehicles & Geofence Polygons", description: "Setup 2dsphere indexing in MongoDB for coordinates, routes, and geographic geofencing boundaries.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["MongoDB", "Mongoose", "Geospatial Indexing"], recommendedRole: "Database Administrator", dependencies: ["Architect High-Frequency Telemetry Ingestion Pipeline"] },
      { title: "Build Real-Time WebSockets Telemetry Ingestion Gateway", description: "Implement Node.js socket receivers validating incoming hardware coordinates with rate limiting.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "Socket.io", "Express"], recommendedRole: "Backend Developer", dependencies: ["Design Geospatial Schemas for Vehicles & Geofence Polygons"] },
      { title: "Implement Dynamic Geofence Violation Detection Engine", description: "Develop background worker calculating point-in-polygon triggers and generating driver alert events.", phase: "Backend", priority: "High", complexity: "High", estimatedHours: 16, requiredSkills: ["Node.js", "Express", "Turf.js"], recommendedRole: "Backend Developer", dependencies: ["Build Real-Time WebSockets Telemetry Ingestion Gateway"] },
      { title: "Develop 60fps Vector Map Dashboard with Live Markers", description: "Render responsive map displaying animated vehicle icons, route polylines, and speed badges.", phase: "Frontend", priority: "Critical", complexity: "High", estimatedHours: 22, requiredSkills: ["React", "Mapbox GL / Leaflet", "CSS"], recommendedRole: "Frontend Developer", dependencies: ["Build Real-Time WebSockets Telemetry Ingestion Gateway"] },
      { title: "Build Trip Playback Scrubber & Fleet Utilization Screen", description: "Create timeline controls allowing fleet dispatchers to scrub through past driver routes and stops.", phase: "Frontend", priority: "Medium", complexity: "Medium", estimatedHours: 16, requiredSkills: ["React", "TailwindCSS"], recommendedRole: "Frontend Developer", dependencies: ["Develop 60fps Vector Map Dashboard with Live Markers"] },
      { title: "Integrate Mapbox / OpenStreetMap Routing & Geo-APIs", description: "Link external routing providers for turn-by-turn navigation and road speed limit lookups.", phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["REST APIs", "Axios", "Map APIs"], recommendedRole: "Fullstack Developer", dependencies: ["Build Real-Time WebSockets Telemetry Ingestion Gateway"] },
      { title: "Implement Driver Hardware Device Handshake Encryption", description: "Enforce TLS 1.3 mutual authentication for onboard tracking units and encrypt driver location histories.", phase: "Security", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["Security", "Encryption", "TLS"], recommendedRole: "Security Engineer", dependencies: ["Integrate Mapbox / OpenStreetMap Routing & Geo-APIs"] },
      { title: "Execute High-Throughput Load Simulator & Geofence QA", description: "Simulate 5,000 concurrent vehicle GPS coordinate streams to verify socket stability and latency.", phase: "Testing", priority: "High", complexity: "High", estimatedHours: 16, requiredSkills: ["Jest", "Supertest", "Load Testing"], recommendedRole: "QA Engineer", dependencies: ["Implement Driver Hardware Device Handshake Encryption"] },
      { title: "Configure Scalable Redis Pub/Sub & Containerized Workers", description: "Setup clustered Redis brokers and Docker containers with auto-scaling policies.", phase: "DevOps", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["Docker", "Redis", "DevOps"], recommendedRole: "DevOps Engineer", dependencies: ["Execute High-Throughput Load Simulator & Geofence QA"] },
      { title: "Deploy Multi-AZ Production Infrastructure with Edge Routing", description: "Deploy fleet microservices to high-availability multi-region cloud cluster with zero-downtime rolling updates.", phase: "Deployment", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["AWS", "DevOps", "Cloud Infrastructure"], recommendedRole: "DevOps Engineer", dependencies: ["Configure Scalable Redis Pub/Sub & Containerized Workers"] },
      { title: "Configure Live Dispatch Alarms & Vehicle Health Telemetry", description: "Setup real-time alert broadcasts for engine faults, excessive idling, and low battery status.", phase: "Monitoring", priority: "High", complexity: "Medium", estimatedHours: 10, requiredSkills: ["Socket.io", "Telemetry", "Prometheus"], recommendedRole: "SRE Engineer", dependencies: ["Deploy Multi-AZ Production Infrastructure with Edge Routing"] }
    ];
  } else if (domainLower.includes("billing") || domainLower.includes("invoice") || domainLower.includes("payment") || domainLower.includes("stripe")) {
    domainTasks = [
      { title: "Define Double-Entry Accounting Rules & Tax Compliance Matrix", description: "Document VAT/GST regional calculation formulas, dunning cycles, and refund dispute protocols.", phase: "Planning", priority: "High", complexity: "Medium", estimatedHours: 10, requiredSkills: ["FinTech Specs", "Project Management"], recommendedRole: "Financial Analyst", dependencies: [] },
      { title: "Architect Idempotent Payment Flow & Event Webhook Pipeline", description: "Design deduplication safeguards, transaction states, and ledger settlement architecture.", phase: "Architecture", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["System Architecture", "FinTech"], recommendedRole: "Software Architect", dependencies: ["Define Double-Entry Accounting Rules & Tax Compliance Matrix"] },
      { title: "Design Schemas for Invoices, Ledgers, Subscriptions & Charges", description: "Setup Mongoose schemas tracking customer billing profiles, line items, transaction statuses, and ledger balances.", phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["MongoDB", "Mongoose", "Database Indexing"], recommendedRole: "Database Administrator", dependencies: ["Architect Idempotent Payment Flow & Event Webhook Pipeline"] },
      { title: "Build PCI-Compliant Stripe Payment Intent & Charge Handlers", description: "Implement Express controllers executing tokenized payments and handling 3D-Secure challenges.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "Express", "Stripe API"], recommendedRole: "Backend Developer", dependencies: ["Design Schemas for Invoices, Ledgers, Subscriptions & Charges"] },
      { title: "Implement Idempotent Webhook Consumer with Dead-Letter Queues", description: "Develop resilient webhook processor with signature verification and retry backoff queues.", phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["Node.js", "Express", "BullMQ"], recommendedRole: "Backend Developer", dependencies: ["Build PCI-Compliant Stripe Payment Intent & Charge Handlers"] },
      { title: "Develop Customer Billing Portal & Subscription Tier Switcher", description: "Build responsive React portal displaying current plan details, payment methods, and upgrade buttons.", phase: "Frontend", priority: "High", complexity: "High", estimatedHours: 20, requiredSkills: ["React", "TailwindCSS", "JavaScript"], recommendedRole: "Frontend Developer", dependencies: ["Build PCI-Compliant Stripe Payment Intent & Charge Handlers"] },
      { title: "Build Financial Ledger Dashboard & MRR Analytics View", description: "Assemble charts visualizing Monthly Recurring Revenue (MRR), churn rates, and net cash receipts.", phase: "Frontend", priority: "Medium", complexity: "Medium", estimatedHours: 16, requiredSkills: ["React", "Chart.js"], recommendedRole: "Frontend Developer", dependencies: ["Develop Customer Billing Portal & Subscription Tier Switcher"] },
      { title: "Integrate Automated PDF Invoice Generator & Email Dispatch", description: "Generate downloadable PDF invoices on successful transactions and send automated customer receipts.", phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["PDFKit", "Node.js", "SendGrid"], recommendedRole: "Fullstack Developer", dependencies: ["Implement Idempotent Webhook Consumer with Dead-Letter Queues"] },
      { title: "Enforce PCI-DSS Tokenization & Sensitive Financial Data Masking", description: "Verify zero raw credit card data touches servers and mask bank account numbers in database queries.", phase: "Security", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["PCI-DSS", "Security", "Encryption"], recommendedRole: "Security Engineer", dependencies: ["Integrate Automated PDF Invoice Generator & Email Dispatch"] },
      { title: "Execute End-to-End Payment Mock Tests & Dunning Recovery QA", description: "Run automated tests verifying card declines, prorated upgrades, and subscription cancellations.", phase: "Testing", priority: "Critical", complexity: "High", estimatedHours: 16, requiredSkills: ["Jest", "Supertest", "QA Testing"], recommendedRole: "QA Engineer", dependencies: ["Enforce PCI-DSS Tokenization & Sensitive Financial Data Masking"] },
      { title: "Configure BullMQ Dunning Schedulers & Redis Queue Cluster", description: "Setup scheduled workers checking expired credit cards and executing automated payment retries.", phase: "DevOps", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["Docker", "Redis", "BullMQ"], recommendedRole: "DevOps Engineer", dependencies: ["Execute End-to-End Payment Mock Tests & Dunning Recovery QA"] },
      { title: "Deploy Production Billing Microservice with TLS 1.3 & Secrets Vault", description: "Publish payment services onto secure cloud hosting with strict CORS and environment secret keys.", phase: "Deployment", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["AWS", "DevOps", "Cloud Infrastructure"], recommendedRole: "DevOps Engineer", dependencies: ["Configure BullMQ Dunning Schedulers & Redis Queue Cluster"] },
      { title: "Configure Real-Time Payment Failure Alarms & Revenue Reconciliation", description: "Setup automated alerts for spike in charge failures and daily ledger reconciliation reporting.", phase: "Monitoring", priority: "High", complexity: "Medium", estimatedHours: 10, requiredSkills: ["Telemetry", "Logging", "Prometheus"], recommendedRole: "SRE Engineer", dependencies: ["Deploy Production Billing Microservice with TLS 1.3 & Secrets Vault"] }
    ];
  } else {
    // Universal Enterprise Decomposition
    domainTasks = [
      { title: `${cleanName} Specs & Requirements Review`, description: `Document project goals, user journeys, outline key milestones, and define technical architecture for ${cleanName}.`, phase: "Planning", priority: "High", complexity: "Medium", estimatedHours: 10, requiredSkills: ["Project Management", "Requirements Specs"], recommendedRole: "Project Manager", dependencies: [] },
      { title: `${cleanName} System Architecture & Interface Contract`, description: `Architect component layouts, data flows, and secure REST/WebSocket interface contracts for ${cleanName}.`, phase: "Architecture", priority: "Critical", complexity: "High", estimatedHours: 14, requiredSkills: ["System Architecture", "API Design"], recommendedRole: "Software Architect", dependencies: [`${cleanName} Specs & Requirements Review`] },
      { title: `${cleanName} Database & Core Schema Setup`, description: `Design database schemas and provision initial collections/tables with compound indices for ${cleanName}.`, phase: "Database", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["MongoDB", "Mongoose", "Database Indexing"], recommendedRole: "Database Administrator", dependencies: [`${cleanName} System Architecture & Interface Contract`] },
      { title: `${cleanName} Core REST API Endpoints & Logic Controllers`, description: `Build main backend REST routes, authorization gates, and robust validator chains for ${cleanName}.`, phase: "Backend", priority: "Critical", complexity: "High", estimatedHours: 18, requiredSkills: ["Node.js", "Express", "REST APIs"], recommendedRole: "Backend Developer", dependencies: [`${cleanName} Database & Core Schema Setup`] },
      { title: `${cleanName} Responsive Frontend UI & Layout Scaffolding`, description: `Create responsive React components, state hooks, and design system tokens for ${cleanName}.`, phase: "Frontend", priority: "High", complexity: "High", estimatedHours: 20, requiredSkills: ["React", "TailwindCSS", "JavaScript"], recommendedRole: "Frontend Developer", dependencies: [`${cleanName} Core REST API Endpoints & Logic Controllers`] },
      { title: `${cleanName} Frontend-Backend Integration & State Stores`, description: `Bind client components to backend endpoints, checking state flow, error notifications, and loading states.`, phase: "Integration", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["REST APIs", "Axios", "React"], recommendedRole: "Fullstack Developer", dependencies: [`${cleanName} Responsive Frontend UI & Layout Scaffolding`] },
      { title: `${cleanName} Security Review, RBAC & OWASP Hardening`, description: `Enforce role-based access control, input sanitization, and inject security headers for ${cleanName}.`, phase: "Security", priority: "Critical", complexity: "High", estimatedHours: 12, requiredSkills: ["OWASP", "JWT", "Security Hardening"], recommendedRole: "Security Engineer", dependencies: [`${cleanName} Frontend-Backend Integration & State Stores`] },
      { title: `${cleanName} Quality Assurance & End-to-End Testing`, description: `Execute unit tests, validation assertions, edge-case checks, and Cypress integration journeys.`, phase: "Testing", priority: "High", complexity: "Medium", estimatedHours: 14, requiredSkills: ["Jest", "Supertest", "QA Testing"], recommendedRole: "QA Engineer", dependencies: [`${cleanName} Security Review, RBAC & OWASP Hardening`] },
      { title: `${cleanName} CI/CD Build Pipeline & Docker Configurations`, description: `Configure automated GitHub Actions workflows, Docker containers, and environment secrets for ${cleanName}.`, phase: "DevOps", priority: "High", complexity: "Medium", estimatedHours: 12, requiredSkills: ["Docker", "GitHub Actions", "DevOps"], recommendedRole: "DevOps Engineer", dependencies: [`${cleanName} Quality Assurance & End-to-End Testing`] },
      { title: `${cleanName} Production Release Deployment & DNS Link`, description: `Build production assets, run final migration scripts, and push to staging/production cloud with SSL.`, phase: "Deployment", priority: "Critical", complexity: "High", estimatedHours: 12, requiredSkills: ["AWS / Cloud", "DevOps", "Nginx"], recommendedRole: "DevOps Engineer", dependencies: [`${cleanName} CI/CD Build Pipeline & Docker Configurations`] },
      { title: `${cleanName} Operations Monitoring, Health Checks & SLA`, description: `Configure uptime alerts, server performance metrics, error logging, and operational telemetry for ${cleanName}.`, phase: "Monitoring", priority: "Medium", complexity: "Low", estimatedHours: 8, requiredSkills: ["Prometheus", "Logging", "Telemetry"], recommendedRole: "SRE Engineer", dependencies: [`${cleanName} Production Release Deployment & DNS Link`] }
    ];
  }

  // Calculate timeline dates across tasks
  const tasksPerWeek = Math.max(1, Math.ceil(domainTasks.length / 5));
  const listWithMetadata = domainTasks.map((task, index) => {
    const taskWeekStart = Math.floor(index / tasksPerWeek);
    const taskStartDate = new Date(start);
    taskStartDate.setDate(taskStartDate.getDate() + taskWeekStart * 7);

    const taskEndDate = new Date(taskStartDate);
    taskEndDate.setDate(taskEndDate.getDate() + 5);

    return {
      title: task.title,
      description: task.description,
      phase: task.phase,
      priority: task.priority || "Medium",
      complexity: task.complexity || "Medium",
      estimatedHours: task.estimatedHours || 16,
      requiredSkills: task.requiredSkills || ["JavaScript"],
      dependencies: task.dependencies || [],
      recommendedRole: task.recommendedRole || "Software Engineer",
      acceptanceCriteria: [
        `Deliverable '${task.title}' passes standard compiler code validations.`,
        "Unit test scripts execute without functional errors.",
        "Matches architectural and aesthetic design constraints."
      ],
      potentialRisks: [
        "Unclear third-party API configurations causing timeouts.",
        "Timeline slips due to complex schema index additions."
      ],
      startDate: taskStartDate.toISOString().split("T")[0],
      dueDate: taskEndDate > end ? end.toISOString().split("T")[0] : taskEndDate.toISOString().split("T")[0]
    };
  });

  return structureParentAndSubtasks(listWithMetadata, startDate, deadline);
};

export default {
  generateTasks,
};
