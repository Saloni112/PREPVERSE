// routes/questionRoutes.js
const express = require('express');
const { 
  createQuestion, 
  getQuestionsByTopic, 
  getQuestionsByTopicSlug 
} = require('../controllers/questionController.js');

const router = express.Router();

// Get questions by topic slug
router.get("/topic/:slug", getQuestionsByTopicSlug);

// Get questions by topic ID
router.get("/:topicId", getQuestionsByTopic);

// Create new question
router.post("/", createQuestion);

module.exports = router;