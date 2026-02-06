const express = require('express');
const router = express.Router();

// Mock video data - replace with actual controller
const videos = {
    '1': [ // number-system videos
        {
            id: 1,
            title: 'Introduction to Number System',
            url: 'https://www.youtube.com/embed/wqKpV2edSdE',
            description: 'Learn the basics of number system'
        }
    ],
    '2': [ // percentages videos
        {
            id: 1,
            title: 'Percentage Basics',
            url: 'https://www.youtube.com/embed/7kHE1q-TVEc',
            description: 'Understanding percentage concepts'
        }
    ]
};

// Get videos by topic ID
router.get("/:topicId", (req, res) => {
    const { topicId } = req.params;
    const topicVideos = videos[topicId] || [];
    
    res.json({ success: true, videos: topicVideos });
});

// Create new video
router.post("/", (req, res) => {
    const { title, url, description, topicId } = req.body;
    
    if (!title || !url || !topicId) {
        return res.status(400).json({ error: 'Title, URL and topicId are required' });
    }
    
    const newVideo = {
        id: videos[topicId] ? videos[topicId].length + 1 : 1,
        title,
        url,
        description: description || ''
    };
    
    if (!videos[topicId]) {
        videos[topicId] = [];
    }
    
    videos[topicId].push(newVideo);
    res.status(201).json(newVideo);
});

module.exports = router;