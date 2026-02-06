// questionController.js
const Question = require("../models/Question.js");
const Topic = require("../models/Topic.js");

const createQuestion = async (req, res) => {
  try { 
    const question = await Question.create(req.body); 
    res.status(201).json(question); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

const getQuestionsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const questions = await Question.find({ topicId }).sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

// NEW: Get questions by topic slug
const getQuestionsByTopicSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // First find the topic by slug
    const topic = await Topic.findOne({ slug });
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }
    
    // Then find questions for this topic
    const questions = await Question.find({ topicId: topic._id })
      .sort({ difficulty: 1, createdAt: 1 });
    
    res.json({
      success: true,
      topic: {
        _id: topic._id,
        name: topic.name,
        slug: topic.slug,
        description: topic.description
      },
      questions: questions
    });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

module.exports = {
  createQuestion,
  getQuestionsByTopic,
  getQuestionsByTopicSlug
};