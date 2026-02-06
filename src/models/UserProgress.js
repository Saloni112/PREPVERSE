// models/UserProgress.js
const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: String, // static for now (you can make dynamic when login system is added)
  solvedProblems: [
    {
      problemId: Number,
      difficulty: String,
      dateSolved: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('UserProgress', userProgressSchema, 'user_progress');
