/**
 * @fileoverview Routes for task-related operations: create, update, assign, and status change.
 * @module routes/task
 * @version 1.2.0
 * @date 2025-07-16
 * @update 2025-07-19
 */

const express = require("express");
const router = express.Router();
const {
  createTask,
  updateTask,
  assignTask,
  changeStatus,
  getTasks,
  getGroupedTasks,
  deleteTask,
  deleteAllTasks,
} = require("../controllers/taskController");
const { verifyToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /task:
 *   post:
 *     summary: Create a new task
 *     tags: [Task]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ title, userId ]
 *             properties:
 *               title:
 *                 type: string
 *               userId:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Missing title or userId
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
/**
 * @route POST /task
 * @group Task - Operations for creating tasks
 * @param {string} title.body.required - Title of the task
 * @param {string} userId.body.required - User ID
 * @returns {object} 201 - Created task object
 */
router.post("/", verifyToken, createTask);

/**
 * @swagger
 * /task/{taskId}:
 *   put:
 *     summary: Update a task by ID
 *     tags: [Task]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task updated
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
/**
 * @route PUT /task/:taskId
 * @group Task - Update task details
 * @param {string} taskId.path.required - Task ID
 * @returns {object} 200 - Updated task
 */
router.put("/:taskId", verifyToken, updateTask);

/**
 * @swagger
 * /task/{taskId}/assign:
 *   patch:
 *     summary: Assign a user to a task
 *     tags: [Task]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User assigned to task
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
/**
 * @route PATCH /task/:taskId/assign
 * @group Task - Assign user
 * @param {string} taskId.path.required - Task ID
 * @param {string} userId.body.required - User ID to assign
 * @returns {object} 200 - Task with updated user assignment
 */
router.patch("/:taskId/assign", verifyToken, assignTask);

/**
 * @swagger
 * /task/{taskId}/status:
 *   patch:
 *     summary: Change task status
 *     tags: [Task]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newStatus]
 *             properties:
 *               newStatus:
 *                 type: string
 *                 enum: [To Do, In Progress, Done]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task status updated
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
/**
 * @route PATCH /task/:taskId/status
 * @group Task - Update task status
 * @param {string} taskId.path.required - Task ID
 * @param {string} newStatus.body.required - New status: 'To Do', 'In Progress', or 'Done'
 * @returns {object} 200 - Task with updated status
 */
router.patch("/:taskId/status", verifyToken, changeStatus);

/**
 * @swagger
 * /task:
 *   get:
 *     summary: Get tasks
 *     description: >
 *       Retrieve tasks with flexible filtering.  
 *       - By default, filters are applied in **intersection (AND)** mode.  
 *       - If `union=true`, filters are combined in **union (OR)** mode.  
 *       - If no filter parameters are provided, all tasks are returned.
 *     tags: [Task]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by task status
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Filter by teamId (based on team membership)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by assigned userId
 *       - in: query
 *         name: union
 *         schema:
 *           type: boolean
 *         description: >
 *           If true, results are combined using OR (union)  
 *           instead of the default AND (intersection).
 *     responses:
 *       200:
 *         description: Task list (filtered or all)
 */

/**
 * Get all tasks with optional filters.
 * - Default behavior applies filters in intersection (AND) mode.
 * - If `union=true`, filters are applied in union (OR) mode.
 * - If no filters are provided, all tasks are returned.
 *
 * @route GET /task
 * @group Task - Query tasks
 * @param {string} [status.query] - Filter by task status
 * @param {string} [teamId.query] - Filter by teamId
 * @param {string} [userId.query] - Filter by assigned userId
 * @param {boolean} [union.query] - Use union (OR) mode instead of intersection (AND)
 * @returns {Array<object>} 200 - Filtered task list
 */
router.get("/", verifyToken, getTasks);

/**
 * @swagger
 * /task/grouped:
 *   get:
 *     summary: Get tasks grouped by status or team
 *     tags: [Task]
 *     parameters:
 *       - in: query
 *         name: by
 *         required: true
 *         schema:
 *           type: string
 *           enum: [status, team]
 *     responses:
 *       200:
 *         description: Grouped tasks object
 *       400:
 *         description: Invalid grouping method
 */
/**
 * Get tasks grouped by status or by team.
 * @route GET /task/grouped
 * @group Task - Grouped task queries
 * @param {string} by.query.required - Grouping method ("status" or "team")
 * @returns {object} 200 - Grouped tasks object
 */
router.get("/grouped", verifyToken, getGroupedTasks);

/**
 * @swagger
 * /task/all:
 *   delete:
 *     summary: Delete all tasks (cascade update user.taskId/tasks)
 *     description: |
 *       Deletes all tasks in the system.
 *       Also clears all users' `taskId` and `tasks` fields.
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All tasks deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
/**
 * Delete all tasks
 *
 * @route DELETE /task/all
 * @group Task - Task management
 * @returns {object} 200 - { message }
 */
router.delete("/all", verifyToken, deleteAllTasks);

/**
 * @swagger
 * /task/{taskId}:
 *   delete:
 *     summary: Delete a task by ID (with cascade update user references)
 *     tags: [Task]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   type: object
 *       404:
 *         description: Task not found
 */
/**
 * Delete a task by ID (cascade update user.taskId/tasks).
 * @route DELETE /task/{taskId}
 * @group Task - Delete a single task
 * @param {string} taskId.path.required - Task ID
 * @returns {object} 200 - { message, task }
 * @returns {Error} 404 - Task not found
 */
router.delete("/:taskId", verifyToken, deleteTask);

module.exports = router;
