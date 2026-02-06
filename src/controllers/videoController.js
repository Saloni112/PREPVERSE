// videoController.js
const Video = require("../models/Video.js");

const createVideo = async (req, res) => {
  try { 
    const video = await Video.create(req.body); 
    res.status(201).json(video); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

const getVideosByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const videos = await Video.find({ topicId }).sort({ order: 1, createdAt: 1 });
    res.json(videos);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

module.exports = {
  createVideo,
  getVideosByTopic
};