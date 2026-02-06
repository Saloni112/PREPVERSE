const StudentProgress = require("../models/studentprogress");
const Question = require("../models/Question");
const Topic = require("../models/Topic");
const Student = require("../models/student");

// Update student progress after answering a question
const updateProgress = async (req, res) => {
  try {
    const { studentEmail, topicSlug, isCorrect, timeSpent } = req.body;

    if (!studentEmail || !topicSlug) {
      return res.status(400).json({ error: "Student email and topic slug are required" });
    }

    // Find the student
    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Find the topic
    const topic = await Topic.findOne({ slug: topicSlug });
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Get total questions for this topic
    const totalQuestions = await Question.countDocuments({ topicId: topic._id });

    // Find or create progress record
    let progress = await StudentProgress.findOne({
      studentEmail,
      topicId: topic._id
    });

    if (!progress) {
      progress = new StudentProgress({
        studentEmail,
        studentId: student._id,
        topicId: topic._id,
        topicSlug: topic.slug,
        topicName: topic.name,
        totalQuestions
      });
    }

    // Update progress statistics
    progress.attemptedQuestions += 1;
    if (isCorrect) {
      progress.correctAnswers += 1;
      progress.streak += 1;
    } else {
      progress.streak = 0;
    }

    // Calculate scores and percentages
    progress.score = totalQuestions > 0 ? (progress.correctAnswers / totalQuestions) * 100 : 0;
    progress.completionPercentage = totalQuestions > 0 ? (progress.attemptedQuestions / totalQuestions) * 100 : 0;
    progress.timeSpent += timeSpent || 0;
    progress.averageTimePerQuestion = progress.attemptedQuestions > 0 
      ? progress.timeSpent / progress.attemptedQuestions 
      : 0;
    progress.lastAttempted = new Date();

    await progress.save();

    res.json({
      success: true,
      progress: {
        attempted: progress.attemptedQuestions,
        total: progress.totalQuestions,
        correct: progress.correctAnswers,
        score: Math.round(progress.score),
        completion: Math.round(progress.completionPercentage),
        streak: progress.streak,
        timeSpent: progress.timeSpent
      }
    });

  } catch (error) {
    console.error("Progress update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get student progress for all topics
const getStudentProgress = async (req, res) => {
  try {
    const { studentEmail } = req.params;

    if (!studentEmail) {
      return res.status(400).json({ error: "Student email is required" });
    }

    const progress = await StudentProgress.find({ studentEmail })
      .populate('topicId', 'name slug description')
      .sort({ updatedAt: -1 });

    // Calculate overall statistics
    const overallStats = {
      totalTopics: progress.length,
      totalAttempted: progress.reduce((sum, p) => sum + p.attemptedQuestions, 0),
      totalCorrect: progress.reduce((sum, p) => sum + p.correctAnswers, 0),
      totalQuestions: progress.reduce((sum, p) => sum + p.totalQuestions, 0),
      averageScore: progress.length > 0 
        ? progress.reduce((sum, p) => sum + p.score, 0) / progress.length 
        : 0,
      totalTimeSpent: progress.reduce((sum, p) => sum + p.timeSpent, 0),
      completedTopics: progress.filter(p => p.completionPercentage >= 100).length
    };

    res.json({
      success: true,
      progress,
      overallStats: {
        ...overallStats,
        averageScore: Math.round(overallStats.averageScore),
        completionRate: overallStats.totalQuestions > 0 
          ? Math.round((overallStats.totalAttempted / overallStats.totalQuestions) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get progress for a specific topic
const getTopicProgress = async (req, res) => {
  try {
    const { studentEmail, topicSlug } = req.params;

    const topic = await Topic.findOne({ slug: topicSlug });
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    const progress = await StudentProgress.findOne({
      studentEmail,
      topicId: topic._id
    }).populate('topicId', 'name slug description');

    // If no progress record exists, return basic topic info
    if (!progress) {
      const totalQuestions = await Question.countDocuments({ topicId: topic._id });
      return res.json({
        success: true,
        progress: null,
        topic: topic,
        totalQuestions: totalQuestions
      });
    }

    res.json({
      success: true,
      progress,
      topic: topic
    });

  } catch (error) {
    console.error("Get topic progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get leaderboard for a topic
const getTopicLeaderboard = async (req, res) => {
  try {
    const { topicSlug } = req.params;

    const topic = await Topic.findOne({ slug: topicSlug });
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    const leaderboard = await StudentProgress.find({ topicId: topic._id })
      .sort({ score: -1, correctAnswers: -1 })
      .limit(10)
      .select('studentEmail correctAnswers attemptedQuestions score timeSpent');

    res.json({
      success: true,
      leaderboard,
      topic: topic.name
    });

  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get student's overall ranking
const getStudentRanking = async (req, res) => {
  try {
    const { studentEmail } = req.params;

    // Get all students' progress for ranking
    const allProgress = await StudentProgress.aggregate([
      {
        $group: {
          _id: "$studentEmail",
          totalScore: { $avg: "$score" },
          totalCorrect: { $sum: "$correctAnswers" },
          totalAttempted: { $sum: "$attemptedQuestions" }
        }
      },
      {
        $sort: { totalScore: -1, totalCorrect: -1 }
      }
    ]);

    // Find current student's rank
    const studentRank = allProgress.findIndex(progress => progress._id === studentEmail) + 1;
    const totalStudents = allProgress.length;

    res.json({
      success: true,
      ranking: {
        rank: studentRank,
        totalStudents: totalStudents,
        percentile: totalStudents > 0 ? Math.round(((totalStudents - studentRank) / totalStudents) * 100) : 0
      }
    });

  } catch (error) {
    console.error("Ranking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  updateProgress,
  getStudentProgress,
  getTopicProgress,
  getTopicLeaderboard,
  getStudentRanking
};