const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { requireProjectRole, requireProjectMember } = require('../middleware/rbac');

// GET /api/tasks?projectId= — get tasks for a project (any member)
router.get('/', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: 'projectId is required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.getMember(req.user._id);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks — Admin only: create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;
    if (!title || !projectId) return res.status(400).json({ message: 'Title and projectId are required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.getMember(req.user._id);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });
    if (member.role !== 'ADMIN') return res.status(403).json({ message: 'Only admins can create tasks' });

    // Validate assignedTo is a project member
    if (assignedTo) {
      const assigneeMember = project.getMember(assignedTo);
      if (!assigneeMember) return res.status(400).json({ message: 'Assigned user is not a member of this project' });
    }

    const task = new Task({
      title: title.trim(),
      description: description || '',
      projectId,
      assignedTo: assignedTo || null,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dueDate: dueDate || null,
      createdBy: req.user._id
    });
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // Emit real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('task:created', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/tasks/:id — update task
// Admin: can update anything. Member: can only change status of tasks assigned to them.
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.getMember(req.user._id);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    if (member.role === 'ADMIN') {
      // Admin can update everything
      // But validate assignedTo if being changed
      if (req.body.assignedTo) {
        const assigneeMember = project.getMember(req.body.assignedTo);
        if (!assigneeMember) return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }

      const allowedFields = ['title', 'description', 'assignedTo', 'status', 'priority', 'dueDate'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          task[field] = req.body[field];
        }
      });
      // Allow setting assignedTo to null (unassign)
      if (req.body.assignedTo === null || req.body.assignedTo === '') {
        task.assignedTo = null;
      }
    } else {
      // Member can only change status of tasks assigned to them
      if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }
      if (!req.body.status) {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
      // Only allow status change
      const allowedStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      task.status = req.body.status;
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:updated', populated);
    }

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id — Admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.getMember(req.user._id);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });
    if (member.role !== 'ADMIN') return res.status(403).json({ message: 'Only admins can delete tasks' });

    await Task.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:deleted', {
        taskId: req.params.id,
        projectId: task.projectId.toString()
      });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
