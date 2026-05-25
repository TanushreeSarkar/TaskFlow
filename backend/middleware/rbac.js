const Project = require('../models/Project');

// Middleware: require user to be a member of the project with one of the specified roles
// projectId is read from req.params.projectId OR req.body.projectId OR req.query.projectId
const requireProjectRole = (roles) => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    if (!projectId) return res.status(400).json({ message: 'projectId is required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.getMember(req.user._id);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    if (!roles.includes(member.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges in this project' });
    }

    req.project = project;
    req.projectRole = member.role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware: require user to be any member of the project
const requireProjectMember = () => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    if (!projectId) return res.status(400).json({ message: 'projectId is required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.getMember(req.user._id);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    req.project = project;
    req.projectRole = member.role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requireProjectRole, requireProjectMember };
