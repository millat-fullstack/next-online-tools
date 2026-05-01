// src/lib/tracking.js
export function getToolUsage() {
  try {
    const usage = localStorage.getItem('toolUsage');
    return usage ? JSON.parse(usage) : {};
  } catch (error) {
    console.warn('Failed to read tool usage from localStorage:', error);
    return {};
  }
}

export function setToolUsage(usage) {
  try {
    localStorage.setItem('toolUsage', JSON.stringify(usage));
  } catch (error) {
    console.warn('Failed to save tool usage to localStorage:', error);
  }
}

export function incrementToolUsage(toolId) {
  const usage = getToolUsage();
  usage[toolId] = (usage[toolId] || 0) + 1;
  setToolUsage(usage);
}

export function getTrendingTools(tools, limit = 5) {
  const usage = getToolUsage();
  return tools
    .map(tool => ({
      ...tool,
      usage: usage[tool.id] || 0
    }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, limit);
}