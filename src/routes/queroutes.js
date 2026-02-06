const express = require('express');
const router = express.Router();
const interviewQue = require('../models/interviewQue'); // Corrected import
const stringSimilarity = require('string-similarity');

// ✅ Get interviewQues (by role/topic)
router.get('/', async (req, res) => {
  try {
    const { role, topic } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (topic) filter.topic = topic;

    const interviewQues = await interviewQue.find(filter).sort({ createdAt: 1 }).lean();
    res.json(interviewQues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get single interviewQue by ID
router.get('/:id', async (req, res) => {
  try {
    const q = await interviewQue.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Create interviewQue (Admin)
router.post('/', async (req, res) => {
  try {
    const newQ = await interviewQue.create(req.body);
    res.status(201).json(newQ);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Update interviewQue
router.put('/:id', async (req, res) => {
  try {
    const updated = await interviewQue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete interviewQue
router.delete('/:id', async (req, res) => {
  try {
    await interviewQue.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Enhanced Check user answer (Try Yourself) - FIXED VERSION
router.post('/:id/check', async (req, res) => {
  try {
    console.log('🔍 Check answer request received');
    console.log('Request body:', req.body);
    console.log('interviewQue ID:', req.params.id);

    // ✅ FIX: Better error handling for missing body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Request body is missing or invalid' 
      });
    }

    const { userAnswer } = req.body;

    // ✅ FIX: Better validation
    if (!userAnswer && userAnswer !== '') {
      return res.status(400).json({ 
        success: false, 
        error: 'userAnswer is required in request body' 
      });
    }

    const q = await interviewQue.findById(req.params.id);

    if (!q) {
      return res.status(404).json({ 
        success: false, 
        error: 'interviewQue not found' 
      });
    }

    console.log('✅ interviewQue found:', q.interviewQueText);
    console.log('✅ User answer:', userAnswer);

    const user = userAnswer.toLowerCase().trim();
    const sample = (q.answer || '').toLowerCase();
    const keywords = q.keywords || [];

    console.log('✅ Keywords to check:', keywords);

    // Enhanced keyword matching
    const matchedKeywords = keywords.filter(k => user.includes(k.toLowerCase()));
    const missingKeywords = keywords.filter(k => !user.includes(k.toLowerCase()));
    const matched = matchedKeywords.length;
    
    const keywordScore = keywords.length ? matched / keywords.length : 0;
    const simScore = sample ? stringSimilarity.compareTwoStrings(user, sample) : 0;

    const finalScore = 0.5 * keywordScore + 0.5 * simScore;
    const percent = Math.round(finalScore * 100);

    console.log('✅ Analysis completed - Score:', percent);

    // Enhanced feedback generation
    let feedback = '';
    let detailedFeedback = [];

    if (percent >= 90) {
      feedback = `High Accuracy (${percent}%): Excellent — you covered all key points!`;
      detailedFeedback.push('✅ Excellent coverage of all major concepts');
      detailedFeedback.push('✅ Clear and well-structured explanation');
    } else if (percent >= 60) {
      feedback = `Medium Accuracy (${percent}%): You captured the main idea but missed some key terms.`;
      detailedFeedback.push('✅ Good understanding of core concepts');
      if (missingKeywords.length > 0) {
        detailedFeedback.push(`📝 Consider mentioning: ${missingKeywords.slice(0, 3).join(', ')}`);
      }
    } else {
      feedback = `Low Accuracy (${percent}%): Important concepts missing. Review the sample answer below.`;
      detailedFeedback.push('📚 Review the fundamental concepts');
      if (matchedKeywords.length > 0) {
        detailedFeedback.push(`✅ Good start with: ${matchedKeywords.join(', ')}`);
      }
      if (missingKeywords.length > 0) {
        detailedFeedback.push(`📝 Focus on: ${missingKeywords.slice(0, 5).join(', ')}`);
      }
    }

    // Add structure feedback
    const userLength = user.split(/\s+/).length;
    if (userLength < 20) {
      detailedFeedback.push('💡 Try to provide more detailed explanations');
    }

    const response = {
      success: true,
      percent,
      feedback,
      keywordsMatched: matched,
      totalKeywords: keywords.length,
      matchedKeywords: matchedKeywords,
      missingKeywords: missingKeywords,
      detailedFeedback: detailedFeedback,
      confidence: percent >= 70 ? 'high' : percent >= 40 ? 'medium' : 'low'
    };

    console.log('✅ Sending response:', response);
    res.json(response);

  } catch (err) {
    console.error('❌ Answer checking error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ✅ Enhanced Get sample answer
router.get('/:id/answer', async (req, res) => {
  try {
    const q = await interviewQue.findById(req.params.id).select('answer keywords');
    if (!q) return res.status(404).json({ error: 'interviewQue not found' });
    res.json({ 
      sampleAnswer: q.answer || 'No sample answer available',
      keywords: q.keywords || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;