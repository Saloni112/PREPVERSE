// models/Video.js
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Video", videoSchema);