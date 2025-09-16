/**
 * @fileoverview Routes for dashboard data: calendar, task summary, and task-specific progress.
 * @module routes/dashboard
 * @version 1.2.0
 * @date 2025-07-16
 */

const express = require("express");
const router = express.Router();
const {
  getCalendarData,
  getTaskSummary,
  getTaskProgress,
} = require("../controllers/dashboardController");

const { verifyToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /dashboard/calendar:
 *   get:
 *     summary: Get all task deadlines for calendar
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter tasks assigned to this user or created by this user
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter tasks belonging to this team
 *       - in: query
 *         name: union
 *         schema:
 *           type: boolean
 *           default: false
 *         required: false
 *         description: Whether to union the filters
 *     responses:
 *       200:
 *         description: List of task deadlines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   taskId:
 *                     type: string
 *                   title:
 *                     type: string
 *                   deadline:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Team not found
 */
/**
 * @route GET /dashboard/calendar
 * @group Dashboard - View task deadlines for calendar
 * @returns {Array<object>} 200 - List of task deadlines
 */
router.get("/calendar", verifyToken, getCalendarData);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get task completion summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter tasks assigned to this user or created by this user
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter tasks belonging to this team
 *       - in: query
 *         name: union
 *         schema:
 *           type: boolean
 *           default: false
 *         required: false
 *         description: Whether to union the filters
 *     responses:
 *       200:
 *         description: Summary with total, completed, remaining
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 remaining:
 *                   type: integer
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Team not found
 */
/**
 * @route GET /dashboard/summary
 * @group Dashboard - View overall task statistics
 * @returns {object} 200 - { total, completed, remaining }
 */
router.get("/summary", verifyToken, getTaskSummary);

/**
 * @swagger
 * /dashboard/taskProgress/{taskId}:
 *   get:
 *     summary: Get progress percentage of a specific task
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task progress info
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
/**
 * @route GET /dashboard/taskProgress/:taskId
 * @group Dashboard - View a task's completion percentage
 * @param {string} taskId.path.required - Task ID
 * @returns {object} 200 - Task title, status, and progress percent
 */
router.get("/task-progress/:taskId", verifyToken, getTaskProgress);

module.exports = router;
