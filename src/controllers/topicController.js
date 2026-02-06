// topicController.js
const Topic = require("../models/Topic.js");

const createTopic = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const existing = await Topic.findOne({ $or: [{ name }, { slug }] });
    if (existing) return res.status(409).json({ error: "Topic with same name or slug already exists" });
    const topic = await Topic.create({ name, slug, description });
    res.status(201).json(topic);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

const getTopics = async (req, res) => {
  try { 
    const topics = await Topic.find().sort({ name: 1 }); 
    res.json(topics); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

const getTopicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const topic = await Topic.findOne({ slug });
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json(topic);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

module.exports = {
  createTopic,
  getTopics,
  getTopicBySlug
};