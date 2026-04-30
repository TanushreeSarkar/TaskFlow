const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireProjectRole, requireProjectMember } = require('../middleware/rbac');

// GET /api/projects — all projects user belongs to
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email');

    // Add task stats for each project
    const result = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ projectId: project._id });
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'DONE').length;
      const myRole = project.getMember(req.user._id)?.role || 'MEMBER';
      return {
        ...project.toObject(),
        taskCount: total,
        completedCount: done,
        progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
        myRole
      };
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:projectId — single project detail
router.get('/:projectId', auth, requireProjectMember(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const myRole = project.getMember(req.user._id)?.role || 'MEMBER';
    res.json({ ...project.toObject(), myRole });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects — create project (any authenticated user; they become ADMIN)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Project name is required' });

    const project = new Project({
      name: name.trim(),
      description: description || '',
      members: [{ user: req.user._id, role: 'ADMIN' }]
    });
    await project.save();

    const populated = await Project.findById(project._id).populate('members.user', 'name email');
    
    res.status(201).json({ ...populated.toObject(), myRole: 'ADMIN', taskCount: 0, completedCount: 0, progressPercent: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:projectId/members — Admin: add member by email
router.post('/:projectId/members', auth, requireProjectRole(['ADMIN']), async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) return res.status(404).json({ message: 'No user found with that email' });

    const project = req.project;
    const existing = project.getMember(userToAdd._id);
    if (existing) return res.status(400).json({ message: 'User is already a member of this project' });

    const memberRole = (role === 'ADMIN') ? 'ADMIN' : 'MEMBER';
    project.members.push({ user: userToAdd._id, role: memberRole });
    await project.save();

    const updated = await Project.findById(project._id).populate('members.user', 'name email');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project._id}`).emit('member:added', {
        projectId: project._id.toString(),
        member: { user: { _id: userToAdd._id, name: userToAdd.name, email: userToAdd.email }, role: memberRole }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/projects/:projectId/members/:userId — Admin: change member role
router.patch('/:projectId/members/:userId', auth, requireProjectRole(['ADMIN']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'MEMBER'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const project = req.project;
    const member = project.getMember(req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found in this project' });

    // Prevent removing the last admin
    if (member.role === 'ADMIN' && role === 'MEMBER') {
      const adminCount = project.members.filter(m => m.role === 'ADMIN').length;
      if (adminCount <= 1) return res.status(400).json({ message: 'Cannot remove the last admin' });
    }

    member.role = role;
    await project.save();

    const updated = await Project.findById(project._id).populate('members.user', 'name email');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:projectId/members/:userId — Admin: remove member
router.delete('/:projectId/members/:userId', auth, requireProjectRole(['ADMIN']), async (req, res) => {
  try {
    const project = req.project;

    // Cannot remove yourself if you're the last admin
    if (req.params.userId === req.user._id.toString()) {
      const adminCount = project.members.filter(m => m.role === 'ADMIN').length;
      if (adminCount <= 1) return res.status(400).json({ message: 'Cannot remove the last admin' });
    }

    const memberIndex = project.members.findIndex(m => m.user.toString() === req.params.userId);
    if (memberIndex === -1) return res.status(404).json({ message: 'Member not found' });

    project.members.splice(memberIndex, 1);
    await project.save();

    // Unassign tasks that were assigned to this user
    await Task.updateMany(
      { projectId: project._id, assignedTo: req.params.userId },
      { $set: { assignedTo: null } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project._id}`).emit('member:removed', {
        projectId: project._id.toString(),
        userId: req.params.userId
      });
    }

    const updated = await Project.findById(project._id).populate('members.user', 'name email');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:projectId — Admin: delete project and all tasks
router.delete('/:projectId', auth, requireProjectRole(['ADMIN']), async (req, res) => {
  try {
    await Task.deleteMany({ projectId: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.projectId}`).emit('project:deleted', {
        projectId: req.params.projectId
      });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
