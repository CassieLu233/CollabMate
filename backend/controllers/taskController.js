/**
 * @fileoverview Task controller - handles creation, update, assignment, and status change for tasks.
 * @module controllers/taskController
 * @version 1.0.0
 * @date 2025-06-29
 */

const { v4: uuidv4 } = require("uuid");
const { loadTasks, saveTasks, findTaskById } = require("../models/taskStore");
const { loadTeams } = require("../models/teamStore");
const { loadUsers, saveUsers } = require("../models/userStore");

/**
 * Create a new task.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createTask = (req, res) => {
  const {
    title,
    description,
    deadline,
    status = "To Do",
    userIds,
    userId,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Missing required title" });
  }
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: "'userIds' must be an array" });
  }
  const now = new Date().toISOString();
  const newTask = {
    taskId: uuidv4(),
    title,
    description,
    status,
    deadline,
    userIds,
    gitlabIssueId: null,
    createdAt: now,
    updatedAt: now,
    creator: userId,
  };

  const tasks = loadTasks();
  tasks.push(newTask);
  saveTasks(tasks);

  res.status(201).json({ message: "Task created", task: newTask });
};

/**
 * Update an existing task by ID.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateTask = (req, res) => {
  const { taskId } = req.params;
  const updatedData = req.body;

  const tasks = loadTasks();
  const taskIndex = tasks.findIndex((t) => t.taskId === taskId);
  if (taskIndex === -1)
    return res.status(404).json({ error: "Task not found" });

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updatedData,
    updatedAt: new Date().toISOString(),
  };
  saveTasks(tasks);

  res.json({ message: "Task updated", task: tasks[taskIndex] });
};

/**
 * Assign a task to a user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const assignTask = (req, res) => {
  const { taskId } = req.params;
  const { userId } = req.body;

  const tasks = loadTasks();
  const task = tasks.find((t) => t.taskId === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  if (!task.userIds.includes(userId)) {
    task.userIds.push(userId);
  }
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  res.json({ message: "User assigned to task", task });
};

/**
 * Change the status of a task.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const changeStatus = (req, res) => {
  const { taskId } = req.params;
  const { newStatus } = req.body;

  const task = findTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = newStatus;
  task.updatedAt = new Date().toISOString();
  saveTasks(loadTasks().map((t) => (t.taskId === taskId ? task : t)));

  res.json({ message: "Task status updated", task });
};

/**
 * Filter tasks
 * @param {Array} tasks - All tasks
 * @param {Array} teams - All teams
 * @param {Object} options - Filter options
 * @param {string} [options.status] 
 * @param {string} [options.teamId]
 * @param {string} [options.userId]
 * @param {boolean|string} [options.union=false] - Whether to use OR union instead of AND intersection
 * @returns {Array} Filtered tasks
 */
const filterTasks = (tasks, teams, { status, teamId, userId, union = false }) => {
  // No filters, return all
  if (!status && !teamId && !userId) return tasks;

  if (union === true || union === "true") {
    const resultSet = new Set();

    // By status
    if (status) {
      tasks
        .filter((t) => t.status === status)
        .forEach((t) => resultSet.add(t));
    }

    // By teamId
    if (teamId) {
      const team = teams.find((t) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");
      const memberSet = new Set(team.members);
      tasks
        .filter(
          (t) =>
            Array.isArray(t.userIds) &&
            t.userIds.some((uid) => memberSet.has(uid)) || t.creator && memberSet.has(t.creator)
        )
        .forEach((t) => resultSet.add(t));
    }

    // By userId
    if (userId) {
      tasks
        .filter(
          (t) => Array.isArray(t.userIds) && t.userIds.includes(userId) || t.creator === userId
        )
        .forEach((t) => resultSet.add(t));
    }

    return Array.from(resultSet);
  } else {
    // Default intersection (AND) mode
    let filtered = [...tasks];

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (teamId) {
      const team = teams.find((t) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");
      const memberSet = new Set(team.members);
      filtered = filtered.filter(
        (t) =>
          Array.isArray(t.userIds) &&
          t.userIds.some((uid) => memberSet.has(uid))
      );
    }

    if (userId) {
      filtered = filtered.filter(
        (t) => Array.isArray(t.userIds) && t.userIds.includes(userId)
      );
    }

    return filtered;
  }
}

/**
 * Get all tasks, optionally filtered by status, teamId, or userId.
 * @param {string} [status.query] - Filter by task status
 * @param {string} [teamId.query] - Filter by teamId（Based on member attribution）
 * @param {string} [userId.query] - Filter by assigned userId
 * @param {boolean} [union.query] - Whether to use OR union instead of default AND intersection
 */
const getTasks = (req, res) => {
  try {
    const tasks = loadTasks();
    const teams = loadTeams();
    const { status, teamId, userId, union } = req.query;

    let filteredTasks;
    try {
      filteredTasks = filterTasks(tasks, teams, { status, teamId, userId, union });
    } catch (err) {
      if (err.message === "Team not found") {
        return res.status(404).json({ error: "Team not found" });
      }
      throw err;
    }

    const mode = union === "true" || union === true ? "union" : "intersection";

    return res.status(200).json({
      message: `Tasks retrieved (${mode} mode)`,
      tasks: filteredTasks,
    });
  } catch (err) {
    console.error("[getTasks] error:", err);
    return res.status(500).json({ error: "Failed to retrieve tasks" });
  }
};


/**
 * Get tasks grouped by status or by team.
 * @param {string} by.query.required - Grouping method ("status" or "team")
 */
const getGroupedTasks = (req, res) => {
  const { by } = req.query;
  const tasks = loadTasks();

  if (by === "status") {
    const groups = {};
    tasks.forEach((task) => {
      const key = task.status || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return res.json({ groups });
  } else if (by === "team") {
    const teams = loadTeams();
    const groups = {};
    teams.forEach((team) => {
      const memberSet = new Set(team.members);
      // As long as there are assigned members of this team, they will be assigned to this team.
      const teamTasks = tasks.filter(
        (task) =>
          Array.isArray(task.userIds) &&
          task.userIds.some((uid) => memberSet.has(uid))
      );
      groups[team.teamId] = teamTasks;
    });
    return res.json({ groups });
  } else {
    return res
      .status(400)
      .json({ error: 'Invalid grouping method. Use "status" or "team".' });
  }
};

/**
 * Delete a task by ID. Also removes all references to this task.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteTask = (req, res) => {
  const { taskId } = req.params;
  let tasks = loadTasks();
  const taskIndex = tasks.findIndex((t) => t.taskId === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  const deletedTask = tasks.splice(taskIndex, 1)[0];
  saveTasks(tasks);

  // Remove task reference from all users
  let users = loadUsers();
  let changed = false;
  users = users.map((user) => {
    if (user.taskId === taskId) {
      user.taskId = null;
      changed = true;
    }
    if (Array.isArray(user.tasks)) {
      const oldLen = user.tasks.length;
      user.tasks = user.tasks.filter((tid) => tid !== taskId);
      if (user.tasks.length !== oldLen) changed = true;
    }
    return user;
  });
  if (changed) saveUsers(users);

  return res.status(200).json({ message: "Task deleted", task: deletedTask });
};

/**
 * Delete all tasks. Also clears all references in users' taskId and tasks fields.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteAllTasks = (req, res) => {
  const tasks = loadTasks();
  if (!tasks.length) {
    return res.status(200).json({ message: "No tasks to delete" });
  }
  saveTasks([]);
  // Cascade: clear all user taskId and tasks
  let users = loadUsers();
  let changed = false;
  users = users.map((user) => {
    if (user.taskId) {
      user.taskId = null;
      changed = true;
    }
    if (Array.isArray(user.tasks) && user.tasks.length > 0) {
      user.tasks = [];
      changed = true;
    }
    return user;
  });
  if (changed) saveUsers(users);

  return res.status(200).json({ message: "All tasks deleted" });
};

module.exports = {
  createTask,
  changeStatus,
  assignTask,
  updateTask,
  getTasks,
  getGroupedTasks,
  deleteTask,
  deleteAllTasks,
  filterTasks
};
