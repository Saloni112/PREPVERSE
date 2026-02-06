const mongoose = require('mongoose');

const arrayProblemSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  tags: [String],
  description: String,
  input: String,
  output: String,
  constraints: [String],
  exampleInput: String,
  exampleOutput: String,
  testCases: [
    {
      input: String,
      output: String
    }
  ]
}, {
  timestamps: true
});

// Create index for better query performance
arrayProblemSchema.index({ id: 1 });
arrayProblemSchema.index({ difficulty: 1 });

module.exports = mongoose.model('ArrayProblem', arrayProblemSchema, 'arrays_easy');