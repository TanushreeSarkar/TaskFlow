const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    // Get all projects user belongs to
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email');

    const projectIds = projects.map(p => p._id);

    // Get all tasks for those projects
    const tasks = await Task.find({ projectId: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    const totalTasks = tasks.length;
    const tasksPerStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      DONE: tasks.filter(t => t.status === 'DONE').length
    };

    const now = new Date();
    const overdueTasks = tasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    // Per-project breakdown
    const projectStats = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId.toString() === project._id.toString());
      const total = projectTasks.length;
      const done = projectTasks.filter(t => t.status === 'DONE').length;
      return {
        _id: project._id,
        name: project.name,
        totalTasks: total,
        completedTasks: done,
        progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
        myRole: project.getMember(req.user._id)?.role || 'MEMBER'
      };
    });

    // My tasks (tasks assigned to current user)
    const myTasks = tasks
      .filter(t => t.assignedTo && t.assignedTo._id.toString() === req.user._id.toString())
      .slice(0, 10);

    res.json({
      totalTasks,
      tasksPerStatus,
      overdueTasks: overdueTasks.map(t => ({
        _id: t._id,
        title: t.title,
        dueDate: t.dueDate,
        status: t.status,
        projectId: t.projectId,
        assignedTo: t.assignedTo
      })),
      overdueCount: overdueTasks.length,
      projectStats,
      myTasks,
      totalProjects: projects.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
