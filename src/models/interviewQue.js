// models/Question.js
const mongoose = require('mongoose');

const interviewQueSchema = new mongoose.Schema({
  role: { type: String, required: true },
  topic: { type: String, required: true },
  questionText: { type: String, required: true },
  type: { type: String, enum: ['open', 'mcq'], default: 'open' },
  options: [String],
  answer: { type: String },
  keywords: [{ type: String }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  estimatedTime: { type: Number },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
});

interviewQueSchema.index({ role: 1, topic: 1 });
module.exports = mongoose.model('interviewQue', interviewQueSchema);