const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  members: [memberSchema]
}, { timestamps: true });

// Helper: check if a user is a member (works both before and after populate)
projectSchema.methods.getMember = function (userId) {
  const uid = userId.toString();
  return this.members.find(m => {
    const mid = m.user._id ? m.user._id.toString() : m.user.toString();
    return mid === uid;
  });
};

module.exports = mongoose.model('Project', projectSchema);
