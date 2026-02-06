const express = require('express');
const {
  updateProgress,
  getStudentProgress,
  getTopicProgress,
  getTopicLeaderboard,
  getStudentRanking
} = require('../controllers/progresscontroller');

const router = express.Router();

// Update student progress
router.post("/update", updateProgress);

// Get student's overall progress
router.get("/student/:studentEmail", getStudentProgress);

// Get student's progress for a specific topic
router.get("/student/:studentEmail/topic/:topicSlug", getTopicProgress);

// Get leaderboard for a topic
router.get("/leaderboard/:topicSlug", getTopicLeaderboard);

// Get student's overall ranking
router.get("/ranking/:studentEmail", getStudentRanking);

module.exports = router;