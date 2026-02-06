const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const bcrypt = require('bcrypt');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

// Import models
const Student = require('./models/student');
const Faculty = require('./models/faculty');
const User = require('./models/user');
const Topic = require('./models/Topic');
const Video = require('./models/Video');
const interviewQue = require('./models/interviewQue');

// Import routes
const topicRoutes = require('./routes/topicRoutes');
const videoRoutes = require('./routes/videoRoutes');
const questionRoutes = require('./routes/questionRoutes');
const practiceRouter = require('./routes/practice');
const progressroutes = require('./routes/progressroutes');
const dsaRoutes = require('./routes/dsa');

const app = express();
const PORT = process.env.PORT || 3000;

const static_path = path.join(__dirname, '../public');
const template_path = path.join(__dirname, '../templates/views');

// ==================== AI API CONFIGURATION ====================
const AI_CONFIG = {
  groq: {
    apiKey: process.env.GROQ_API_KEY || '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',
    baseURL: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant' 
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models"
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan("dev"));
app.use(express.static(static_path));
app.use(session({
    secret: process.env.SESSION_SECRET || 'workwave-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Make user available to all templates
app.use(function(req, res, next) {
    res.locals.user = req.session.user || null;
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', template_path);

// ==================== DATABASE CONNECTIONS ====================

// User Database (for authentication)
const USER_DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/WorkWaveDB";
const CODING_DB_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/workwavecodingDB";

// Main connection for users
mongoose.connect(USER_DB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => {
    console.log("✅ MongoDB connected to User Database:", USER_DB_URI);
})
.catch(err => { 
    console.error("User DB connection error:", err.message); 
    process.exit(1);
});

// Create separate connection for coding problems
const codingDB = mongoose.createConnection(CODING_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

codingDB.on('connected', () => {
    console.log("✅ MongoDB connected to Coding Problems Database:", CODING_DB_URI);
});

codingDB.on('error', (err) => {
    console.error("❌ Coding DB connection error:", err.message);
});

// Export codingDB for use in models
app.locals.codingDB = codingDB;

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

const requireFaculty = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'faculty') {
        next();
    } else {
        res.status(403).json({ error: 'Faculty access required' });
    }
};

const requireStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ error: 'Student access required' });
    }
};

// roleContent data
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

// Use routes
app.use("/api/topics", topicRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/questions", questionRoutes);
app.use("/progress", progressroutes);
app.use('/practice', practiceRouter);
app.use('/', dsaRoutes);

// ==================== CODING PROBLEMS ROUTES ====================

// Import ArrayProblem model with codingDB connection
// const ArrayProblem = codingDB.model('ArrayProblem', require('./models/ArrayProblem').schema, 'arrays_easy');

// Debug route to check database contents
app.get('/debug/problems', async (req, res) => {
  try {
    // Check all problems in database
    const allProblems = await ArrayProblem.find({});
    const easyProblems = await ArrayProblem.find({ difficulty: 'Easy' });
    const mediumProblems = await ArrayProblem.find({ difficulty: 'Medium' });
    const hardProblems = await ArrayProblem.find({ difficulty: 'Hard' });
    
    console.log('📊 Database Debug Info:');
    console.log('Total problems:', allProblems.length);
    console.log('Easy problems:', easyProblems.length);
    console.log('Medium problems:', mediumProblems.length);
    console.log('Hard problems:', hardProblems.length);
    console.log('All problem IDs:', allProblems.map(p => p.id));
    
    res.json({
      total: allProblems.length,
      easy: easyProblems.length,
      medium: mediumProblems.length,
      hard: hardProblems.length,
      allProblems: allProblems.map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize sample problems in database
app.get('/init-sample-problems', async (req, res) => {
  try {
    // Clear existing
    await ArrayProblem.deleteMany({});
    
    // Sample problems
    const sampleProblems = [
      {
        id: 1,
        title: "Reverse an Array",
        difficulty: "Easy",
        tags: ["Array", "Two Pointers"],
        description: "Given an integer array arr of size n, implement an efficient algorithm to reverse the array in-place.",
        input: "First line contains n, the size of array. Second line contains n space-separated integers.",
        output: "Print the reversed array with space-separated integers.",
        constraints: ["1 <= n <= 1000", "-10⁶ ≤ arr[i] ≤ 10⁶"],
        exampleInput: "5\n1 2 3 4 5",
        exampleOutput: "5 4 3 2 1",
        testCases: [
          { input: "5\n1 2 3 4 5", output: "5 4 3 2 1" },
          { input: "3\n10 20 30", output: "30 20 10" }
        ],
        solvedCount: 0
      },
      {
        id: 2,
        title: "Find Maximum Element", 
        difficulty: "Easy",
        tags: ["Array"],
        description: "Given an array of integers, find the maximum element.",
        input: "First line contains n, size of array. Second line contains n space-separated integers.",
        output: "Print the maximum element.",
        constraints: ["1 <= n <= 1000", "-10⁶ ≤ arr[i] ≤ 10⁶"],
        exampleInput: "5\n3 1 4 1 5", 
        exampleOutput: "5",
        testCases: [
          { input: "5\n3 1 4 1 5", output: "5" }
        ],
        solvedCount: 0
      },
      {
        id: 3,
        title: "Remove Duplicates from Sorted Array",
        difficulty: "Easy", 
        tags: ["Array", "Two Pointers"],
        description: "Remove duplicates from sorted array in-place.",
        input: "First line contains n, size of array. Second line contains sorted integers.",
        output: "Print new length after removing duplicates.",
        constraints: ["1 <= n <= 30000", "-100 ≤ nums[i] ≤ 100"],
        exampleInput: "6\n1 1 2 2 3 3",
        exampleOutput: "3",
        testCases: [
          { input: "6\n1 1 2 2 3 3", output: "3" }
        ],
        solvedCount: 0
      }
    ];
    
    await ArrayProblem.insertMany(sampleProblems);
    
    res.json({ 
      message: 'Sample problems added successfully!',
      problems: sampleProblems.map(p => ({ id: p.id, title: p.title }))
    });
    
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get problem by ID - UPDATED VERSION
app.get('/dsa/arrays/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    console.log(`🔍 Loading problem with ID parameter: ${problemId}`);
    
    // First, try to find in any difficulty
    let problem = await ArrayProblem.findOne({ id: problemId });
    
    if (!problem) {
      console.log(`❌ Problem not found with ID: ${problemId} in coding database`);
      
      // Check what problems exist in the database
      const allProblems = await ArrayProblem.find({});
      console.log('Available problems in database:', allProblems.map(p => p.id));
      
      // Provide a fallback problem if database is empty
      if (allProblems.length === 0) {
        console.log('📝 Database is empty, creating fallback problem...');
        problem = {
          id: 1,
          title: "Reverse an Array",
          difficulty: "Easy",
          tags: ["Array", "Two Pointers"],
          description: "Given an integer array arr of size n, implement an efficient algorithm to reverse the array in-place.",
          input: "First line contains n, the size of array. Second line contains n space-separated integers.",
          output: "Print the reversed array with space-separated integers.",
          constraints: ["1 <= n <= 1000", "-10⁶ ≤ arr[i] ≤ 10⁶"],
          exampleInput: "5\n1 2 3 4 5",
          exampleOutput: "5 4 3 2 1",
          testCases: [
            { input: "5\n1 2 3 4 5", output: "5 4 3 2 1" }
          ],
          solvedCount: 0
        };
      } else {
        return res.status(404).render('error', { 
          message: `Problem with ID ${problemId} not found. Available IDs: ${allProblems.map(p => p.id).join(', ')}` 
        });
      }
    } else {
      console.log(`✅ Found problem: ${problem.title} (${problem.difficulty})`);
    }
    
    // Get user progress for this problem
    const solvedIds = [1, 2]; // Mock - replace with real user data
    
    res.render('dsa_cpp/array_problem', { 
      problem,
      code: '',
      output: '',
      testResults: [],
      solvedIds: solvedIds
    });
    
  } catch (error) {
    console.error('❌ Error in problem route:', error);
    res.status(500).render('error', { 
      message: 'Internal server error loading problem' 
    });
  }
});

// Get problems by difficulty
app.get('/dsa/arrays/:difficulty', async (req, res) => {
  try {
    const difficulty = req.params.difficulty.toLowerCase();
    console.log(`📚 Loading ${difficulty} problems from coding database`);
    
    let problems = [];
    
    if (difficulty === 'easy') {
      problems = await ArrayProblem.find({ difficulty: 'Easy' }).sort({ id: 1 });
    } 
    else if (difficulty === 'medium') {
      problems = await ArrayProblem.find({ difficulty: 'Medium' }).sort({ id: 1 });
    }
    else if (difficulty === 'hard') {
      problems = await ArrayProblem.find({ difficulty: 'Hard' }).sort({ id: 1 });
    }
    
    console.log(`✅ Found ${problems.length} ${difficulty} problems`);
    
    // If no problems found, provide sample data
    if (problems.length === 0) {
      console.log('📝 No problems found, using sample data');
      problems = getSampleProblemsByDifficulty(difficulty);
    }
    
    res.render(`dsa_cpp/arrays_${difficulty}`, { 
      problems,
      user: req.user || {}
    });
  } catch (error) {
    console.error('Error loading problems:', error);
    res.status(500).render('error', { message: 'Error loading problems' });
  }
});

// Helper function for sample problems
function getSampleProblemsByDifficulty(difficulty) {
  const sampleProblems = {
    easy: [
      {
        id: 1,
        title: "Reverse an Array",
        difficulty: "Easy",
        tags: ["Array", "Two Pointers"],
        description: "Reverse the given array in-place."
      },
      {
        id: 2,
        title: "Find Maximum Element",
        difficulty: "Easy", 
        tags: ["Array"],
        description: "Find the maximum element in the array."
      },
      {
        id: 3,
        title: "Remove Duplicates from Sorted Array",
        difficulty: "Easy",
        tags: ["Array", "Two Pointers"],
        description: "Remove duplicates from sorted array in-place."
      }
    ],
    medium: [
      {
        id: 11,
        title: "Two Sum",
        difficulty: "Medium",
        tags: ["Array", "Hash Table"],
        description: "Find two numbers that add up to target."
      }
    ],
    hard: [
      {
        id: 21,
        title: "Median of Two Sorted Arrays", 
        difficulty: "Hard",
        tags: ["Array", "Binary Search"],
        description: "Find median of two sorted arrays."
      }
    ]
  };
  
  return sampleProblems[difficulty] || [];
}

// Run code submission
app.post('/run', async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    console.log(`🏃 Running code for problem ${problemId}`);
    
    // Find the problem
    const problem = await ArrayProblem.findOne({ id: parseInt(problemId) });
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Simple code execution simulation
    const testResults = [];
    
    if (problem.testCases && problem.testCases.length > 0) {
      problem.testCases.forEach((testCase, index) => {
        // Simulate test execution
        const passed = Math.random() > 0.3; // 70% pass rate for simulation
        testResults.push({
          input: testCase.input,
          expected: testCase.output,
          got: passed ? testCase.output : 'Wrong output',
          status: passed ? 'Passed ✅' : 'Failed ❌',
          runtime: `${(Math.random() * 100 + 50).toFixed(2)} ms`
        });
      });
    }
    
    const allPassed = testResults.every(t => t.status.includes('Passed'));
    const output = allPassed 
      ? '✅ All test cases passed! Great job! 🎉'
      : '⚠️ Some test cases failed. Check your solution.';
    
    res.render('dsa_cpp/array_problem', {
      problem,
      code,
      output,
      testResults
    });
    
  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).render('dsa_cpp/array_problem', {
      problem: {},
      code: req.body.code,
      output: '❌ Error executing code',
      testResults: []
    });
  }
});

// Progress APIs
app.get('/api/user/progress/arrays', async (req, res) => {
  try {
    // Mock progress data - replace with real user data
    const totalProblems = await ArrayProblem.countDocuments({ difficulty: 'Easy' });
    const solved = Math.min(2, totalProblems); // Mock: user solved 2 problems
    
    res.json({
      solved,
      total: totalProblems,
      percentage: Math.round((solved / totalProblems) * 100),
      solvedIds: [1, 2] // Mock solved problem IDs
    });
  } catch (error) {
    res.json({ solved: 0, total: 10, percentage: 0, solvedIds: [] });
  }
});

app.get('/api/user/progress/arrays-medium', async (req, res) => {
  try {
    const totalProblems = await ArrayProblem.countDocuments({ difficulty: 'Medium' });
    const solved = Math.min(1, totalProblems); // Mock data
    
    res.json({
      solved,
      total: totalProblems,
      percentage: Math.round((solved / totalProblems) * 100),
      solvedIds: [11] // Mock solved medium problem IDs
    });
  } catch (error) {
    res.json({ solved: 0, total: 4, percentage: 0, solvedIds: [] });
  }
});

app.get('/api/user/progress/arrays-hard', async (req, res) => {
  try {
    const totalProblems = await ArrayProblem.countDocuments({ difficulty: 'Hard' });
    const solved = 0; // Mock data
    
    res.json({
      solved,
      total: totalProblems,
      percentage: 0,
      solvedIds: []
    });
  } catch (error) {
    res.json({ solved: 0, total: 3, percentage: 0, solvedIds: [] });
  }
});

// ==================== AI API ROUTES ====================
// ... (Keep all your existing AI routes and functions as they are)
// Generate interview question using AI
app.post('/api/generate-question', async (req, res) => {
  try {
    const { role, interviewType, apiProvider = 'groq' } = req.body;
    
    if (!role || !interviewType) {
      return res.json({ 
        success: false, 
        question: "Tell me about yourself and your experience."
      });
    }

    let question;
    let usedProvider = apiProvider;
    
    try {
      if (apiProvider === 'groq') {
        question = await generateWithGroq(role, interviewType);
      } else {
        question = await generateWithGemini(role, interviewType);
      }
    } catch (primaryError) {
      console.log(`Primary provider ${apiProvider} failed, trying fallback...`);
      
      // Try the other provider as fallback
      try {
        if (apiProvider === 'groq') {
          question = await generateWithGemini(role, interviewType);
          usedProvider = 'gemini (fallback)';
        } else {
          question = await generateWithGroq(role, interviewType);
          usedProvider = 'groq (fallback)';
        }
      } catch (fallbackError) {
        console.log('Both providers failed, using enhanced fallback');
        question = getEnhancedFallbackQuestion(role, interviewType);
        usedProvider = 'fallback';
      }
    }
    
    res.json({ 
      success: true, 
      question,
      provider: usedProvider
    });
  } catch (error) {
    console.error('Error generating question:', error);
    res.json({ 
      success: false, 
      question: getEnhancedFallbackQuestion(req.body.role, req.body.interviewType),
      provider: 'fallback'
    });
  }
});

// Evaluate answer using AI
app.post('/api/evaluate-answer', async (req, res) => {
  try {
    const { question, answer, role, interviewType, apiProvider = 'groq' } = req.body;
    
    if (!question || !answer) {
      return res.json({ 
        success: false, 
        feedback: "Thank you for your answer. Let's continue with the next question."
      });
    }

    let feedback;
    let usedProvider = apiProvider;
    
    try {
      if (apiProvider === 'groq') {
        feedback = await evaluateWithGroq(question, answer, role, interviewType);
      } else {
        feedback = await evaluateWithGemini(question, answer, role, interviewType);
      }
    } catch (primaryError) {
      console.log(`Primary provider ${apiProvider} failed, trying fallback...`);
      
      // Try the other provider as fallback
      try {
        if (apiProvider === 'groq') {
          feedback = await evaluateWithGemini(question, answer, role, interviewType);
          usedProvider = 'gemini (fallback)';
        } else {
          feedback = await evaluateWithGroq(question, answer, role, interviewType);
          usedProvider = 'groq (fallback)';
        }
      } catch (fallbackError) {
        console.log('Both providers failed, using fallback feedback');
        feedback = getFallbackFeedback();
        usedProvider = 'fallback';
      }
    }
    
    res.json({ 
      success: true, 
      feedback,
      provider: usedProvider
    });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.json({ 
      success: false, 
      feedback: getFallbackFeedback(),
      provider: 'fallback'
    });
  }
});

// ==================== AI API FUNCTIONS ====================

// Groq API integration with proper interview type differentiation
async function generateWithGroq(role, interviewType) {
  try {
    const questionTypes = {
      warmup: `Generate a warm-up, non-technical interview question for a ${role} position.
      Focus on personal motivation, career goals, work preferences, or general professional background.
      Make it conversational and engaging, but not technical.
      Examples: "What attracted you to this role?", "How do you stay motivated?", "What's your ideal work environment?"
      Return only the question, no additional text.`,
      
      technical: `Generate a technical interview question for a ${role} position.
      Focus on specific technical skills, problem-solving, tools, or technologies relevant to ${role}.
      Make it challenging but fair, testing practical knowledge.
      Examples: "Explain [concept]", "How would you solve [technical problem]", "Compare [technologies]"
      Return only the question, no additional text.`,
      
      behavioral: `Generate a behavioral interview question for a ${role} position.
      Focus on past experiences, teamwork, challenges, leadership, or workplace scenarios.
      Make it situational to understand soft skills and professional behavior.
      Examples: "Tell me about a time when...", "Describe a situation where...", "How do you handle..."
      Return only the question, no additional text.`
    };

    const prompt = questionTypes[interviewType] || questionTypes.warmup;
    
    console.log('Generating', interviewType, 'question for', role);

    const response = await axios.post(AI_CONFIG.groq.baseURL, {
      messages: [{ role: 'user', content: prompt }],
      model: AI_CONFIG.groq.model,
      temperature: 0.7,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.groq.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    throw error;
  }
}

async function evaluateWithGroq(question, answer, role, interviewType) {
  try {
    const prompt = `Evaluate this interview answer for a ${role} position.
    
    Question: "${question}"
    Answer: "${answer}"
    Question Type: ${interviewType}
    
    Provide constructive feedback in 2-3 sentences. Focus on:
    1. What was good about the answer
    2. What could be improved
    3. Any missing elements
    
    IMPORTANT: Use plain text only - NO markdown, NO *bold*, NO formatting.
    Keep it professional, helpful, and encouraging.`;

    const response = await axios.post(AI_CONFIG.groq.baseURL, {
      messages: [{ role: 'user', content: prompt }],
      model: AI_CONFIG.groq.model,
      temperature: 0.7,
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.groq.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq evaluation error:', error.response?.data || error.message);
    throw error;
  }
}

// CORRECTED Gemini function with proper error handling
async function generateWithGemini(role, interviewType) {
  try {
    // Use the most reliable Gemini model
    const model = 'gemini-2.0-flash';
    const url = `${AI_CONFIG.gemini.baseURL}/${model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`;

    console.log(`🔄 Generating ${interviewType} question for ${role} using Gemini ${model}`);

    const prompt = `Generate an interview question for ${role} position (${interviewType} type). 
    Return only the question without any formatting.`;

    const response = await axios.post(url, {
      contents: [{ 
        parts: [{ 
          text: prompt 
        }] 
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150
      }
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Debug: log the full response to see the structure
    console.log('🔍 Gemini full response:', JSON.stringify(response.data).substring(0, 500));

    // Handle different possible response structures
    let questionText;
    
    if (response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      questionText = response.data.candidates[0].content.parts[0].text;
    
    } else if (response.data.contents && 
               response.data.contents.length > 0 && 
               response.data.contents[0].parts && 
               response.data.contents[0].parts.length > 0) {
      
      questionText = response.data.contents[0].parts[0].text;
    
    } else {
      console.error('❌ Unexpected Gemini response structure:', response.data);
      throw new Error('Unexpected response structure from Gemini API');
    }

    if (!questionText || questionText.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    const cleanedQuestion = questionText.trim();
    console.log(`✅ Gemini success: ${cleanedQuestion.substring(0, 100)}...`);
    
    return cleanedQuestion;

  } catch (error) {
    console.error('❌ Gemini API error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

async function evaluateWithGemini(question, answer, role, interviewType) {
  try {
    const model = 'gemini-2.0-flash';
    const url = `${AI_CONFIG.gemini.baseURL}/${model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`;

    console.log(`🔄 Evaluating answer using Gemini ${model}`);

    const prompt = `Evaluate this interview answer for a ${role} position:

Question: "${question}"
Answer: "${answer}"
Question Type: ${interviewType}

Provide constructive feedback in 2-3 sentences. Focus on:
1. What was good about the answer
2. What could be improved  
3. Any missing elements

Return only the feedback text without any formatting.`;

    const response = await axios.post(url, {
      contents: [{ 
        parts: [{ 
          text: prompt 
        }] 
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200
      }
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Handle response structure
    let feedbackText;
    
    if (response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      feedbackText = response.data.candidates[0].content.parts[0].text;
    
    } else if (response.data.contents && 
               response.data.contents.length > 0 && 
               response.data.contents[0].parts && 
               response.data.contents[0].parts.length > 0) {
      
      feedbackText = response.data.contents[0].parts[0].text;
    
    } else {
      console.error('❌ Unexpected Gemini evaluation response structure:', response.data);
      throw new Error('Unexpected response structure from Gemini API');
    }

    if (!feedbackText || feedbackText.trim().length === 0) {
      throw new Error('Empty feedback from Gemini API');
    }

    const cleanedFeedback = feedbackText.trim();
    console.log(`✅ Gemini evaluation success: ${cleanedFeedback.substring(0, 100)}...`);
    
    return cleanedFeedback;

  } catch (error) {
    console.error('❌ Gemini evaluation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

// Fallback functions
function getEnhancedFallbackQuestion(role, interviewType) {
  const fallbacks = {
    warmup: [
      "What attracted you to this role and our company?",
      "How do you stay updated with industry trends?",
      "What's your ideal work environment?",
      "Where do you see yourself in 5 years?"
    ],
    technical: [
      `What are the key technical skills needed for a ${role}?`,
      `Describe a challenging technical problem you solved.`,
      `How do you ensure code quality in your projects?`,
      `What tools and technologies are essential for ${role}?`
    ],
    behavioral: [
      "Tell me about a time you faced a difficult challenge at work.",
      "Describe a situation where you had to work in a team.",
      "How do you handle tight deadlines and pressure?",
      "Tell me about a time you made a mistake and how you handled it."
    ]
  };
  
  const questions = fallbacks[interviewType] || fallbacks.warmup;
  return questions[Math.floor(Math.random() * questions.length)];
}

function getFallbackFeedback() {
  const feedbacks = [
    "Thank you for your answer. That gives me good insight into your experience.",
    "Good response. Let me ask you a follow-up question to learn more.",
    "I appreciate your perspective on this. Could you elaborate a bit more?",
    "That's a solid answer. Let's continue with the next question."
  ];
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}

// Simple Gemini test function for API testing
async function testGeminiSimple() {
  try {
    const model = 'gemini-2.0-flash';
    const url = `${AI_CONFIG.gemini.baseURL}/${model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`;

    console.log('🧪 Testing Gemini API with simple request...');

    const response = await axios.post(url, {
      contents: [{ 
        parts: [{ 
          text: 'Say only the word "OK" without any additional text or formatting.' 
        }] 
      }],
      generationConfig: {
        maxOutputTokens: 5,
        temperature: 0.1
      }
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 Gemini test response received');

    // Multiple ways to handle response structure
    let responseText;
    
    // Method 1: Standard structure
    if (response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts[0]) {
      
      responseText = response.data.candidates[0].content.parts[0].text;
    
    // Method 2: Alternative structure  
    } else if (response.data.contents && 
               response.data.contents[0] && 
               response.data.contents[0].parts && 
               response.data.contents[0].parts[0]) {
      
      responseText = response.data.contents[0].parts[0].text;
    
    } else {
      // Log the actual structure for debugging
      console.error('❌ Unexpected Gemini response structure:', JSON.stringify(response.data).substring(0, 500));
      throw new Error(`Unexpected response structure: ${JSON.stringify(response.data).substring(0, 200)}`);
    }

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }

    const cleaned = responseText.trim();
    console.log(`✅ Gemini test success: "${cleaned}"`);
    
    return cleaned;

  } catch (error) {
    console.error('❌ Gemini test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

// ==================== TEST ROUTES ====================

// Test Groq API
app.get('/test-groq', async (req, res) => {
  try {
    const response = await axios.post(AI_CONFIG.groq.baseURL, {
      messages: [{ role: 'user', content: 'Say "Hello from Groq"' }],
      model: AI_CONFIG.groq.model,
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.groq.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    res.json({ 
      status: 'success', 
      provider: 'Groq',
      model: AI_CONFIG.groq.model,
      response: response.data.choices[0].message.content
    });
  } catch (error) {
    res.json({ 
      status: 'error', 
      provider: 'Groq',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Test Gemini API with better debugging
app.get('/test-gemini', async (req, res) => {
  try {
    const model = 'gemini-2.0-flash';
    const url = `${AI_CONFIG.gemini.baseURL}/${model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`;

    console.log('🔧 Testing Gemini API with model:', model);

    const response = await axios.post(url, {
      contents: [{ 
        parts: [{ 
          text: 'Say "OK" without any formatting. Return only this word.' 
        }] 
      }],
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.1
      }
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Log the full response for debugging
    console.log('🔍 Full Gemini test response:', JSON.stringify(response.data, null, 2));

    let responseText;
    
    if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
      responseText = response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected response structure: ' + JSON.stringify(response.data));
    }

    res.json({
      status: 'success',
      provider: 'Gemini',
      model: model,
      response: responseText.trim(),
      fullResponse: response.data // Include for debugging
    });

  } catch (err) {
    console.error('❌ Gemini test failed:', err.response?.data || err.message);
    res.json({ 
      status: 'error',
      error: err.response?.data || err.message,
      stack: err.stack
    });
  }
});

// API Status Endpoint
app.get('/api-status', async (req, res) => {
  const status = {
    groq: 'checking...',
    gemini: 'checking...',
    timestamp: new Date().toISOString()
  };

  try {
    // Test Groq
    await axios.post(AI_CONFIG.groq.baseURL, {
      messages: [{ role: 'user', content: 'Say "OK"' }],
      model: AI_CONFIG.groq.model,
      max_tokens: 2
    }, {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.groq.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    status.groq = 'Online ✅';
  } catch (error) {
    status.groq = 'Offline ❌';
  }

  try {
    // Test Gemini
    await axios.post(
      `${AI_CONFIG.gemini.baseURL}/gemini-2.0-flash:generateContent?key=${AI_CONFIG.gemini.apiKey}`,
      {
        contents: [{ parts: [{ text: 'Say "OK"' }] }]
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    status.gemini = 'Online ✅';
  } catch (error) {
    status.gemini = 'Offline ❌';
  }

  res.json(status);
});

// Test both APIs
app.get('/test-all-apis', async (req, res) => {
  try {
    const [groqResult, geminiResult] = await Promise.allSettled([
      // Test Groq (same as before)
      axios.post(AI_CONFIG.groq.baseURL, {
        messages: [{ role: 'user', content: 'Say "OK"' }],
        model: AI_CONFIG.groq.model,
        max_tokens: 2
      }, {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.groq.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }),
      
      // Use the simple test function instead
      testGeminiSimple()
    ]);

    const results = {
      groq: groqResult.status === 'fulfilled' ? {
        status: 'success',
        response: groqResult.value.data.choices[0].message.content,
        provider: 'Groq',
        model: AI_CONFIG.groq.model
      } : {
        status: 'error',
        error: groqResult.reason.message,
        provider: 'Groq'
      },
      gemini: geminiResult.status === 'fulfilled' ? {
        status: 'success', 
        response: geminiResult.value,
        provider: 'Gemini',
        model: 'gemini-2.0-flash'
      } : {
        status: 'error',
        error: geminiResult.reason.message,
        provider: 'Gemini'
      },
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Final Test Results:', JSON.stringify(results, null, 2));

    res.json(results);
  } catch (error) {
    console.error('❌ Test All APIs failed:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== EXISTING ROUTES ====================

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Page rendering routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get("/register", (req, res) => { 
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render("login", { success: null, error: null });
});

// Student Dashboard (protected)
app.get("/sdashboard", requireStudent, (req, res) => { 
    res.render('sdashboard', { user: req.session.user });
});

// Faculty Dashboard (protected)
app.get("/fdashboard", requireFaculty, (req, res) => { 
    res.render('fdashboard', { user: req.session.user });
});

app.get("/about", (req, res) => { 
    res.render('about');
});

app.get("/aptitude", (req, res) => { 
    res.render('aptitude');
});

app.get("/quant", (req, res) => { 
    res.render('quant');
});

app.get("/reasoning", (req, res) => { 
    res.render('reasoning');
});

app.get("/verbal", (req, res) => { 
    res.render('verbal');
});

app.get("/topic", (req, res) => { 
    res.render('topic');
});

app.get("/apti", (req, res) => { 
    res.render('apti');
});

app.get("/interview", (req, res) => { 
    res.render('interview');
});

app.get("/coding", (req, res) => { 
    res.render('coding');
});

// ✅ FIXED: Added missing practice-session route
app.get("/practice-session", (req, res) => { 
    const role = req.query.role;
    if (!role || !roleContent[role]) {
        return res.redirect('/');
    }
    res.render('practice-session', {
        selectedRole: role,
        content: roleContent[role]
    });
});

app.get("/topic-practice", (req, res) => { 
    res.render('topic-practice');
});

// Faculty-only routes
app.get("/faculty/questions", requireFaculty, (req, res) => {
    res.render('faculty-questions', { user: req.session.user });
});

app.get("/faculty/analytics", requireFaculty, (req, res) => {
    res.render('faculty-analytics', { user: req.session.user });
});
app.get('/interview', (req, res) => {
  const role = req.query.role;
  if (!role || !roleContent[role]) {
    return res.redirect('/');
  }
  res.render('interview-session', {
    selectedRole: role,  // Changed from 'role' to 'selectedRole'
    content: roleContent[role]
  });
});

app.get('/interview-session', (req, res) => {
  const role = req.query.role;
  if (!role || !roleContent[role]) {
    return res.redirect('/');
  }
  res.render('interview-session', {
    selectedRole: role,  // Changed from 'role' to 'selectedRole'
    content: roleContent[role]
  });
});
// ✅ CORRECTED: Route Ato get sample answer for a question using interviewQue model
app.get('/api/questions/:id/answer', async (req, res) => {
  try {
    const questionId = req.params.id;
    console.log('Fetching sample answer for question ID:', questionId);
    
    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    // Find the question in your database using interviewQue model
    const question = await interviewQue.findById(questionId);
    
    if (!question) {
      console.log('Question not found for ID:', questionId);
      return res.status(404).json({ error: 'Question not found' });
    }
    
    console.log('Found question:', question.questionText);
    console.log('Sample answer available:', !!question.answer);
    
    res.json({
      success: true,
      sampleAnswer: question.answer || "No sample answer available for this question.",
      keywords: question.keywords || []
    });
    
  } catch (error) {
    console.error('Error fetching sample answer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ✅ ADDED: Route to check user's answer against sample answer
app.post('/api/questions/:id/check', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userAnswer } = req.body;
    
    console.log('Checking answer for question ID:', questionId);
    console.log('User answer:', userAnswer);

    if (!userAnswer) {
      return res.status(400).json({ 
        success: false, 
        error: 'User answer is required' 
      });
    }

    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid question ID' 
      });
    }

    // Find the question in your database
    const question = await interviewQue.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    // Simple keyword-based evaluation
    const evaluation = evaluateAnswer(userAnswer, question);
    
    res.json({
      success: true,
      ...evaluation
    });
    
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ✅ ADDED: Answer evaluation function
function evaluateAnswer(userAnswer, question) {
  const sampleAnswer = question.answer || '';
  const keywords = question.keywords || [];
  
  // Convert to lowercase for case-insensitive matching
  const userAnswerLower = userAnswer.toLowerCase();
  const sampleAnswerLower = sampleAnswer.toLowerCase();
  
  // Find matched keywords
  const matchedKeywords = keywords.filter(keyword => 
    userAnswerLower.includes(keyword.toLowerCase())
  );
  
  // Calculate percentage based on keyword matching
  const keywordsMatched = matchedKeywords.length;
  const totalKeywords = keywords.length;
  const percent = totalKeywords > 0 
    ? Math.round((keywordsMatched / totalKeywords) * 100) 
    : 0;
  
  // Generate feedback based on percentage
  let feedback = '';
  if (percent >= 80) {
    feedback = 'Excellent! Your answer covers most key concepts.';
  } else if (percent >= 60) {
    feedback = 'Good attempt! You covered several important points.';
  } else if (percent >= 40) {
    feedback = 'Fair answer. Try to include more key concepts.';
  } else {
    feedback = 'Your answer is missing many key concepts. Review the sample answer.';
  }
  
  // Find missing keywords
  const missingKeywords = keywords.filter(keyword => 
    !userAnswerLower.includes(keyword.toLowerCase())
  );
  
  // Generate detailed feedback points
  const detailedFeedback = [];
  
  if (matchedKeywords.length > 0) {
    detailedFeedback.push(`✅ You covered: ${matchedKeywords.join(', ')}`);
  }
  
  if (missingKeywords.length > 0) {
    detailedFeedback.push(`❌ Missing: ${missingKeywords.join(', ')}`);
  }
  
  // Additional feedback based on answer length
  const userAnswerWords = userAnswer.split(/\s+/).length;
  const sampleAnswerWords = sampleAnswer.split(/\s+/).length;
  
  if (userAnswerWords < sampleAnswerWords * 0.3) {
    detailedFeedback.push('💡 Tip: Try to provide more detailed explanations.');
  } else if (userAnswerWords > sampleAnswerWords * 1.5) {
    detailedFeedback.push('💡 Tip: Your answer is quite lengthy. Focus on key points.');
  }
  
  return {
    percent,
    feedback,
    keywordsMatched,
    totalKeywords,
    matchedKeywords,
    missingKeywords,
    detailedFeedback
  };
}

// ✅ ADDED: Debug route to list all questions (for testing)
app.get('/api/questions/debug/all', async (req, res) => {
  try {
    const questions = await interviewQue.find({}).select('questionText answer _id').limit(10);
    res.json({
      success: true,
      count: questions.length,
      questions: questions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Authentication Routes

// Student Registration route
app.post("/register/student", async(req, res) => { 
    try {
        console.log("Student registration attempt:", req.body);
        
        const { name, email, password, confirmPassword } = req.body;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ 
                success: false,
                error: "All fields are required" 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: "Password must be at least 6 characters long" 
            });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false,
                error: "Passwords do not match" 
            });
        }

        // Check if email already exists
        const existingStudent = await Student.findOne({ email });
        const existingFaculty = await Faculty.findOne({ email });
        
        if (existingStudent || existingFaculty) {
            return res.status(400).json({ 
                success: false,
                error: "Email already registered" 
            });
        }

        const newStudent = new Student({
            name,
            email,
            password,
            role: 'student'
        });
        
        await newStudent.save();
        console.log("Student registration successful for:", email);
        
        // Auto-login after registration
        req.session.user = {
            id: newStudent._id,
            name: newStudent.name,
            email: newStudent.email,
            role: 'student'
        };
        
        return res.status(201).json({ 
            success: true,
            message: "Registration successful!",
            redirectUrl: '/sdashboard'
        });
        
    } catch (error) {
        console.error("Student registration error:", error);
        
        let errorMessage = "Registration failed";
        if (error.name === 'ValidationError') {
            errorMessage = "Validation error: " + Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.code === 11000) {
            errorMessage = "Email already registered";
        }
        
        return res.status(500).json({ 
            success: false,
            error: errorMessage 
        });
    }
});

// Faculty Registration route
app.post("/register/faculty", async(req, res) => { 
    try {
        console.log("Faculty registration attempt:", req.body);
        
        const { name, email, password, confirmPassword, facultyId, department } = req.body;
        
        // Basic validation
        if (!name || !email || !password || !confirmPassword || !facultyId || !department) {
            console.log("Missing fields:", { name, email, password, confirmPassword, facultyId, department });
            return res.status(400).json({ 
                success: false,
                error: "All fields are required including Faculty ID and Department" 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: "Password must be at least 6 characters long" 
            });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false,
                error: "Passwords do not match" 
            });
        }

        // Validate department
        const validDepartments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'General'];
        if (!validDepartments.includes(department)) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid department selected" 
            });
        }

        // Check if email already exists
        const existingStudent = await Student.findOne({ email });
        const existingFaculty = await Faculty.findOne({ email });
        
        if (existingStudent || existingFaculty) {
            console.log("Email already exists:", email);
            return res.status(400).json({ 
                success: false,
                error: "Email already registered" 
            });
        }

        // Check if faculty ID is unique
        const existingFacultyId = await Faculty.findOne({ facultyId });
        if (existingFacultyId) {
            console.log("Faculty ID already exists:", facultyId);
            return res.status(400).json({ 
                success: false,
                error: "Faculty ID already exists" 
            });
        }

        console.log("Creating new faculty user...");
        const newFaculty = new Faculty({
            name,
            email,
            password,
            facultyId,
            department: department,
            role: 'faculty'
        });
        
        await newFaculty.save();
        console.log("Faculty registration successful for:", email);
        
        // Auto-login after registration
        req.session.user = {
            id: newFaculty._id,
            name: newFaculty.name,
            email: newFaculty.email,
            role: 'faculty',
            facultyId: newFaculty.facultyId,
            department: newFaculty.department
        };
        
        return res.status(201).json({ 
            success: true,
            message: "Registration successful!",
            redirectUrl: '/fdashboard'
        });
        
    } catch (error) {
        console.error("Faculty registration error details:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Full error:", error);
        
        // Handle different types of errors
        let errorMessage = "Registration failed";
        
        if (error.name === 'ValidationError') {
            errorMessage = "Validation error: " + Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.code === 11000) {
            errorMessage = "Duplicate entry - email or faculty ID already exists";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return res.status(500).json({ 
            success: false,
            error: errorMessage 
        });
    }
});

// Login route for both students and faculty
app.post("/login", async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        if (!email || !password || !userType) {
            return res.status(400).json({ 
                success: false,
                error: "Please provide email, password and user type" 
            });
        }

        let user;
        let redirectUrl;

        if (userType === 'student') {
            user = await Student.findOne({ email });
            redirectUrl = '/sdashboard';
        } else if (userType === 'faculty') {
            user = await Faculty.findOne({ email });
            redirectUrl = '/fdashboard';
        } else {
            return res.status(400).json({ 
                success: false,
                error: "Invalid user type" 
            });
        }

        if (!user) {
            return res.status(400).json({ 
                success: false,
                error: "Email not registered" 
            });
        }

        // Compare provided password with hashed password in database
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                error: "Incorrect password" 
            });
        }
        
        // Create session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            facultyId: user.facultyId || null,
            department: user.department || null
        };
        
        return res.status(200).json({
            success: true,
            message: "Login successful!",
            redirectUrl: redirectUrl,
            user: req.session.user
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Get current user info
app.get("/api/user", (req, res) => {
    if (req.session.user) {
        res.json({ 
            success: true,
            user: req.session.user 
        });
    } else {
        res.status(401).json({ 
            success: false,
            error: "Not authenticated" 
        });
    }
});

// Keep old registration route for backward compatibility (redirects to student registration)
app.post("/register", async(req, res) => { 
    try {
        const { name, email, password, confirmPassword } = req.body;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ 
                success: false,
                error: "All fields are required" 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: "Password must be at least 6 characters long" 
            });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false,
                error: "Passwords do not match" 
            });
        }

        // Check if email already exists using new models
        const existingStudent = await Student.findOne({ email });
        const existingFaculty = await Faculty.findOne({ email });
        
        if (existingStudent || existingFaculty) {
            return res.status(400).json({ 
                success: false,
                error: "Email already registered" 
            });
        }

        // Use Student model for backward compatibility
        const newStudent = new Student({
            name,
            email,
            password,
            role: 'student'
        });
        
        await newStudent.save();
        console.log("Registration successful");
        
        // Auto-login after registration
        req.session.user = {
            id: newStudent._id,
            name: newStudent.name,
            email: newStudent.email,
            role: 'student'
        };
        
        return res.status(201).json({ 
            success: true,
            message: "Registration successful!",
            redirectUrl: '/sdashboard'
        });
        
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🤖 AI APIs Status:`);
    console.log(`   Groq: ${AI_CONFIG.groq.apiKey ? '✅ Configured' : '❌ Missing API Key'}`);
    console.log(`   Gemini: ${AI_CONFIG.gemini.apiKey ? '✅ Configured' : '❌ Missing API Key'}`);
    console.log(`🗄️  Database Connections:`);
    console.log(`   User DB: ${USER_DB_URI}`);
    console.log(`   Coding DB: ${CODING_DB_URI}`);
    console.log(`🔧 Debug URLs:`);
    console.log(`   Database Debug: http://localhost:${PORT}/debug/problems`);
    console.log(`   Init Problems: http://localhost:${PORT}/init-sample-problems`);
    console.log(`   API Status: http://localhost:${PORT}/api-status`);
});

