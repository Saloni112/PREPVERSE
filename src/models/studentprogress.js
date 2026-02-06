const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  studentEmail: { 
    type: String, 
    required: true, 
    index: true 
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  topicId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Topic", 
    required: true 
  },
  topicSlug: {
    type: String,
    required: true
  },
  topicName: {
    type: String,
    required: true
  },
  totalQuestions: { 
    type: Number, 
    default: 0 
  },
  attemptedQuestions: { 
    type: Number, 
    default: 0 
  },
  correctAnswers: { 
    type: Number, 
    default: 0 
  },
  score: { 
    type: Number, 
    default: 0 
  },
  completionPercentage: { 
    type: Number, 
    default: 0 
  },
  lastAttempted: { 
    type: Date, 
    default: Date.now 
  },
  timeSpent: { 
    type: Number, 
    default: 0 
  }, // in seconds
  streak: {
    type: Number,
    default: 0
  }, // consecutive correct answers
  averageTimePerQuestion: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index for unique student-topic combination
studentProgressSchema.index({ studentEmail: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model("StudentProgress", studentProgressSchema);