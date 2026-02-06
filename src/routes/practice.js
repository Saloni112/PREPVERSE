const express = require('express');
const router = express.Router();
const interviewQue = require('../models/interviewQue');

// roleContent data (same as in app.js)
const roleContent = {
  "Frontend Developer": {
    desc: "Focus on React, JavaScript, and UI/UX principles.",
    question: "Explain the Virtual DOM in React and its performance benefits.",
    topics: [
      { title: "React Core", desc: "Components, Hooks, Performance", q: 8 },
      { title: "Advanced CSS", desc: "Flexbox, Grid, Animations", q: 6 },
      { title: "State Management", desc: "Redux, Context API", q: 5 },
      { title: "Web Performance", desc: "Lazy loading, Code splitting", q: 5 }
    ]
  },
  "Backend Developer": {
    desc: "Focus on APIs, Databases, and System Architecture.",
    question: "How would you design a rate-limited API for high traffic?",
    topics: [
      { title: "API Design", desc: "REST, GraphQL, gRPC", q: 7 },
      { title: "Database Optimization", desc: "Indexing, Query tuning", q: 8 },
      { title: "Microservices", desc: "Communication patterns, Service mesh", q: 6 },
      { title: "Authentication", desc: "JWT, OAuth, Sessions", q: 5 }
    ]
  },
  "Data Analyst": {
    desc: "Focus on data processing and visualization techniques.",
    question: "How would you clean and prepare a messy dataset for analysis?",
    topics: [
      { title: "Data Cleaning", desc: "Handling missing values, outliers", q: 7 },
      { title: "SQL Queries", desc: "Joins, subqueries, optimization", q: 8 },
      { title: "Visualization", desc: "Charts, dashboards, storytelling", q: 6 },
      { title: "Statistical Analysis", desc: "Distributions, hypothesis testing", q: 5 }
    ]
  },
  "UI/UX Designer": {
    desc: "Focus on user experience and interface design principles.",
    question: "Walk us through your design process from research to final product.",
    topics: [
      { title: "User Research", desc: "Interviews, surveys, personas", q: 7 },
      { title: "Wireframing", desc: "Low-fidelity prototypes", q: 6 },
      { title: "Visual Design", desc: "Typography, color theory", q: 6 },
      { title: "Usability Testing", desc: "A/B testing, feedback loops", q: 5 }
    ]
  },
  "AI Engineer": {
    desc: "Focus on machine learning and artificial intelligence systems",
    question: "Explain the transformer architecture in NLP models",
    topics: [
      { title: "Machine Learning", desc: "Supervised/unsupervised learning", q: 8 },
      { title: "Deep Learning", desc: "Neural networks, architectures", q: 7 },
      { title: "Model Deployment", desc: "Serving ML models", q: 5 }
    ]
  },
  "Software Engineer": {
    desc: "Focus on software development and system design",
    question: "Explain the SOLID principles with examples",
    topics: [
      { title: "System Design", desc: "Architecture patterns", q: 8 },
      { title: "Algorithms", desc: "Data structures, complexity", q: 7 },
      { title: "Testing", desc: "Unit, integration tests", q: 5 }
    ]
  },
  "Machine Learning Engineer": {
    desc: "Focus on building and deploying ML models",
    question: "How would you handle class imbalance in a dataset?",
    topics: [
      { title: "Feature Engineering", desc: "Data preprocessing", q: 8 },
      { title: "Model Training", desc: "Hyperparameter tuning", q: 7 },
      { title: "MLOps", desc: "Model deployment pipelines", q: 5 }
    ]
  },
  "Cybersecurity Analyst": {
    desc: "Focus on security protocols and threat analysis",
    question: "How would you respond to a ransomware attack?",
    topics: [
      { title: "Network Security", desc: "Firewalls, IDS/IPS", q: 8 },
      { title: "Threat Analysis", desc: "Vulnerability assessment", q: 7 },
      { title: "Cryptography", desc: "Encryption methods", q: 5 }
    ]
  }
};

// GET /practice route - FIXED: Changed 'role' to 'selectedRole'
router.get('/', (req, res) => {
  const role = req.query.role;
  if (!role || !roleContent[role]) {
    return res.redirect('/');
  }
  res.render('practice-session', {
    selectedRole: role,  // ✅ CHANGED: role -> selectedRole
    content: roleContent[role]
  });
});

// POST /practice route - FIXED: Changed 'role' to 'selectedRole'
router.post('/', (req, res) => {
  const role = req.body.jobRole;
  if (!role || !roleContent[role]) {
    return res.redirect('/');
  }
  res.render('practice-session', {
    selectedRole: role,  // ✅ CHANGED: role -> selectedRole
    content: roleContent[role]
  });
});

// GET /practice/topic route - FIXED: Changed 'role' to 'selectedRole'
router.get('/topic', async (req, res) => {
  try {
    const { role, topic } = req.query;
    
    console.log(`🔍 Loading topic: ${topic} for role: ${role}`);
    
    if (!role || !roleContent[role]) {
      return res.redirect('/practice');
    }

    // Get the full role content
    const selectedRole = roleContent[role];
    const selectedTopic = selectedRole.topics.find(t => t.title === topic);
    
    if (!selectedTopic) {
      return res.redirect(`/practice?role=${role}`);
    }

    // ✅ FIXED: Use selectedRole instead of role
    const templateData = {
      selectedRole: role, // ✅ CHANGED: role -> selectedRole
      content: selectedRole,
      topic: selectedTopic,
      questions: []
    };

    // Check the correct model name - interviewQue, not Question
    console.log('🔍 interviewQue model:', typeof interviewQue);
    console.log('🔍 interviewQue.find function:', typeof interviewQue.find);

    // If interviewQue model is not working, use fallback data
    if (typeof interviewQue.find !== 'function') {
      console.log('❌ interviewQue.find is not a function, using fallback data');
      templateData.questions = getFallbackQuestions(role, topic);
      return res.render('topic-practice', templateData);
    }

    // Try to find questions in the database
    try {
      const questions = await interviewQue.find({ 
        role: role, 
        topic: topic 
      }).sort({ createdAt: 1 }).lean();

      console.log(`✅ Loaded ${questions.length} questions for ${role} - ${topic}`);
      templateData.questions = questions;

      // If no questions found, use fallback
      if (questions.length === 0) {
        console.log('📝 No questions found in database, using fallback');
        templateData.questions = getFallbackQuestions(role, topic);
      }

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      templateData.questions = getFallbackQuestions(role, topic);
    }

    res.render('topic-practice', templateData);

  } catch (err) {
    console.error('❌ Error loading topic questions:', err);
    console.error('❌ Error details:', err.message);
    
    // Fallback to sample questions with proper data structure
    const fallbackData = {
      selectedRole: req.query.role || 'Unknown Role', // ✅ CHANGED: role -> selectedRole
      content: roleContent[req.query.role] || {
        desc: 'Error loading role details',
        question: 'Sample question not available',
        topics: []
      },
      topic: { 
        title: req.query.topic || 'Unknown Topic', 
        desc: '' 
      },
      questions: getFallbackQuestions(req.query.role, req.query.topic)
    };
    
    res.render('topic-practice', fallbackData);
  }
});

// Helper function for fallback questions
function getFallbackQuestions(role, topic) {
  return [
    {
      questionText: `Sample question about ${topic} for ${role}`,
      answer: "This is a sample answer. Add questions to the database to see real content.",
      difficulty: "Medium",
      estimatedTime: 5,
      keywords: ["sample", "placeholder"]
    },
    {
      questionText: `Another sample question about ${topic}`,
      answer: "This is another sample answer for demonstration purposes.",
      difficulty: "Easy",
      estimatedTime: 3,
      keywords: ["sample", "demo"]
    },
    {
      questionText: `Advanced scenario for ${topic}`,
      answer: "This demonstrates how real questions would appear from the database.",
      difficulty: "Hard",
      estimatedTime: 8,
      keywords: ["advanced", "scenario"]
    }
  ];
}

module.exports = router;