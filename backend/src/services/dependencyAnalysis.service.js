/**
 * Dependency Analysis Service
 *
 * Explains and charts dependency paths among project tasks.
 */
export const calculateDependencies = async (tasks = []) => {
  const result = [];
  
  tasks.forEach(task => {
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach(depTitle => {
        result.push({
          taskTitle: task.title,
          dependsOnTitle: depTitle,
          explanation: `'${task.title}' relies on '${depTitle}' to establish core structures, services, or design assets before it can be implemented.`
        });
      });
    }
  });

  return result;
};

export default {
  calculateDependencies,
};
