// routes/topicRoutes.js
const express = require('express');
const { 
  createTopic, 
  getTopics, 
  getTopicBySlug 
} = require('../controllers/topicController.js');

const router = express.Router();

// Get all topics
router.get("/", getTopics);

// Get specific topic by slug
router.get("/:slug", getTopicBySlug);

// Create new topic
router.post("/", createTopic);

module.exports = router;