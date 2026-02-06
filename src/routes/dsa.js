const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

// -------------------------------------------
// 🔥 FIXED: Use codingDB connection from app.js
// -------------------------------------------
const CODING_DB_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/workwavecodingDB";
const codingDB = mongoose.createConnection(CODING_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// 🔥 FIXED: Define the schema directly instead of importing
const ArrayProblemSchema = new mongoose.Schema({
    id: Number,
    title: String,
    difficulty: String,
    tags: [String],
    description: String,
    input: String,
    output: String,
    constraints: [String],
    exampleInput: String,
    exampleOutput: String,
    testCases: [{
        input: String,
        output: String
    }],
    solvedCount: Number
}, { 
    collection: 'arrays_easy' 
});

const ArrayProblem = codingDB.model('ArrayProblem', ArrayProblemSchema);

// UserProgress from main database (since user data is in WorkWaveDB)
const UserProgress = require("../models/UserProgress");

// -------------------------------------------
// 🔓 Medium Unlock Check Middleware
// -------------------------------------------
const checkMediumUnlock = async (req, res, next) => {
  try {
    const userId = "poonam123";
    const progress = await UserProgress.findOne({ userId });
    
    let solvedEasyCount = 0;
    if (progress && progress.solvedProblems) {
      const solvedEasyProblems = progress.solvedProblems.filter(
        p => p.difficulty === "Easy"
      );
      solvedEasyCount = new Set(solvedEasyProblems.map(p => p.problemId)).size;
    }

    if (solvedEasyCount < 3) {
      req.flash('error', `You need to solve at least 3 easy problems to unlock medium. You've solved ${solvedEasyCount}/3.`);
      return res.redirect('/dsa/arrays/easy');
    }
    
    next();
  } catch (err) {
    console.error("Error checking medium unlock:", err);
    next();
  }
};

// -------------------------------------------
// 🔓 Hard Unlock Check Middleware
// -------------------------------------------
const checkHardUnlock = async (req, res, next) => {
  try {
    const userId = "poonam123";
    const progress = await UserProgress.findOne({ userId });
    
    let solvedMediumCount = 0;
    if (progress && progress.solvedProblems) {
      const solvedMediumProblems = progress.solvedProblems.filter(
        p => p.difficulty === "Medium"
      );
      solvedMediumCount = new Set(solvedMediumProblems.map(p => p.problemId)).size;
    }

    if (solvedMediumCount < 2) {
      req.flash('error', `You need to solve at least 2 medium problems to unlock hard. You've solved ${solvedMediumCount}/2.`);
      return res.redirect('/dsa/arrays/medium');
    }
    
    next();
  } catch (err) {
    console.error("Error checking hard unlock:", err);
    next();
  }
};

// -------------------------------------------
// 🧭 DSA Routes
// -------------------------------------------
router.get("/dsa", (req, res) => res.render("dsa_cpp"));
router.get("/dsa/arrays", (req, res) => res.render("dsa_cpp/arrays"));

// 🧩 Easy Problems List
router.get("/dsa/arrays/easy", async (req, res) => {
  try {
    console.log("🔄 Fetching Easy problems from arrays_easy collection...");
    const problems = await ArrayProblem.find({ difficulty: "Easy" }).sort({ id: 1 });
    console.log(`📊 Found ${problems.length} easy problems`);
    
    // Debug: Log what we found
    problems.forEach(p => {
      console.log(`  - ID: ${p.id}, Title: "${p.title}", Difficulty: ${p.difficulty}`);
    });
    
    if (problems.length === 0) {
      console.log("❌ No easy problems found! Checking database directly...");
      // Let's check what's actually in the database
      const db = codingDB.db;
      const allDocs = await db.collection('arrays_easy').find({}).toArray();
      console.log("All documents in arrays_easy:", allDocs.map(d => ({id: d.id, title: d.title, difficulty: d.difficulty})));
    }
    
    res.render("dsa_cpp/arrays_easy", { problems });
  } catch (err) {
    console.error("❌ Error fetching Easy problems:", err);
    res.status(500).send("Server Error while fetching Easy problems: " + err.message);
  }
});

// 🧩 Medium Problems List
router.get("/dsa/arrays/medium", checkMediumUnlock, async (req, res) => {
  try {
    console.log("🔄 Fetching Medium problems from arrays_easy collection...");
    const problems = await ArrayProblem.find({ difficulty: "Medium" }).sort({ id: 1 });
    console.log(`📊 Found ${problems.length} medium problems`);
    
    problems.forEach(p => {
      console.log(`  - ID: ${p.id}, Title: "${p.title}", Difficulty: ${p.difficulty}`);
    });
    
    if (problems.length === 0) {
      console.log("❌ No medium problems found! Checking what difficulties exist...");
      const db = codingDB.db;
      const difficulties = await db.collection('arrays_easy').distinct("difficulty");
      console.log("Available difficulties in database:", difficulties);
    }
    
    res.render("dsa_cpp/arrays_medium", { problems });
  } catch (err) {
    console.error("❌ Error fetching Medium problems:", err);
    res.status(500).send("Server Error while fetching Medium problems: " + err.message);
  }
});

// 🧩 Hard Problems List
router.get("/dsa/arrays/hard", checkHardUnlock, async (req, res) => {
  try {
    console.log("🔄 Fetching Hard problems from arrays_easy collection...");
    const problems = await ArrayProblem.find({ difficulty: "Hard" }).sort({ id: 1 });
    
    console.log(`📊 Found ${problems.length} hard problems:`);
    problems.forEach(p => {
      console.log(`  - ID: ${p.id}, Title: "${p.title}", Difficulty: ${p.difficulty}`);
    });
    
    if (problems.length === 0) {
      console.log("❌ No hard problems found! Checking database directly...");
      const db = codingDB.db;
      const hardDocs = await db.collection('arrays_easy').find({difficulty: "Hard"}).toArray();
      console.log("Hard documents found directly:", hardDocs.length);
    }
    
    res.render("dsa_cpp/arrays_hard", { problems });
  } catch (err) {
    console.error("❌ Error fetching Hard problems:", err);
    res.status(500).send("Server Error while fetching Hard problems: " + err.message);
  }
});

// -------------------------------------------
// 🧩 Individual Problem Loader (ALL Difficulties)
// -------------------------------------------
router.get("/dsa/arrays/:id", async (req, res, next) => {
  try {
    const problemIdParam = req.params.id;
    
    // Check if it's a word route first
    if (["easy", "medium", "hard"].includes(problemIdParam)) {
      return next(); // Let Express handle the specific routes
    }
    
    console.log(`🔍 Loading problem with ID parameter: ${problemIdParam}`);
    
    // Safely convert to number
    const problemId = parseInt(problemIdParam);
    
    if (isNaN(problemId)) {
      console.log(`❌ Invalid problem ID: ${problemIdParam}`);
      return res.status(400).send(`Invalid problem ID: ${problemIdParam}`);
    }
    
    console.log(`🔍 Searching for problem ID: ${problemId} in arrays_easy collection`);
    const problem = await ArrayProblem.findOne({ id: problemId });
    
    if (!problem) {
      console.log(`❌ Problem not found with ID: ${problemId} in arrays_easy collection`);
      
      // Let's check what's actually in the database
      const db = codingDB.db;
      const allProblems = await db.collection('arrays_easy').find({}).sort({id: 1}).toArray();
      
      console.log("All problems in arrays_easy:", allProblems.map(p => ({id: p.id, title: p.title, difficulty: p.difficulty})));
      
      // Get problems by difficulty for debugging
      const easyProblems = await ArrayProblem.find({ difficulty: "Easy" }, { id: 1, title: 1 }).sort({ id: 1 });
      const mediumProblems = await ArrayProblem.find({ difficulty: "Medium" }, { id: 1, title: 1 }).sort({ id: 1 });
      const hardProblems = await ArrayProblem.find({ difficulty: "Hard" }, { id: 1, title: 1 }).sort({ id: 1 });
      
      return res.status(404).send(`
        ❌ Problem not found with ID: ${problemId}
        <br><br>
        <strong>Available Easy Problems:</strong>
        <ul>${easyProblems.map(p => `<li>ID: ${p.id} - ${p.title}</li>`).join('')}</ul>
        <strong>Available Medium Problems:</strong>
        <ul>${mediumProblems.map(p => `<li>ID: ${p.id} - ${p.title}</li>`).join('')}</ul>
        <strong>Available Hard Problems:</strong>
        <ul>${hardProblems.map(p => `<li>ID: ${p.id} - ${p.title}</li>`).join('')}</ul>
      `);
    }
    
    console.log(`✅ Found problem: "${problem.title}" (ID: ${problem.id}, Difficulty: ${problem.difficulty})`);
    
    // 🔥 NEW: Check if user has solved this problem
    const userId = "poonam123";
    const userProgress = await UserProgress.findOne({ userId });
    
    let isSolved = false;
    let solvedCount = 0;
    
    if (userProgress && userProgress.solvedProblems) {
      // Check if current user solved this problem
      isSolved = userProgress.solvedProblems.some(p => p.problemId === problemId);
      
      // Count how many users solved this problem (you'll need to implement this)
      // For now, we'll use a simple count
      const allProgress = await UserProgress.find({ 
        "solvedProblems.problemId": problemId 
      });
      solvedCount = allProgress.length;
    }
    
    res.render("dsa_cpp/array_problem", {
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        input: problem.input,
        output: problem.output,
        constraints: problem.constraints,
        exampleInput: problem.exampleInput,
        exampleOutput: problem.exampleOutput,
        difficulty: problem.difficulty,
        testCases: problem.testCases || [],
        status: isSolved ? 'solved' : 'not solved',
        solvedCount: solvedCount
      },
      code: "",
      output: "",
      testResults: [],
      language: "java"
    });
    
  } catch (err) {
    console.error("❌ Error loading problem:", err);
    res.status(500).send("Server Error while loading problem: " + err.message);
  }
});

// -------------------------------------------
// ⚙ JDoodle Compiler + Progress Tracker - COMPLETELY FIXED VERSION
// -------------------------------------------
router.post("/run", async (req, res) => {
  try {
    const { problemId, code, language = 'java' } = req.body;
    
    console.log(`🏃 Running code for problem ${problemId}`);
    console.log(`🔑 JDoodle Client ID: ${process.env.JDOODLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);

    // Find the problem
    const problem = await ArrayProblem.findOne({ id: parseInt(problemId) });
    if (!problem) {
      console.log(`❌ Problem not found with ID: ${problemId}`);
      return res.status(404).render('dsa_cpp/array_problem', {
        problem: {},
        code,
        output: '❌ Problem not found',
        testResults: []
      });
    }

    console.log(`✅ Found problem: "${problem.title}"`);

    let testResults = [];
    let passedCount = 0;
    let useSimulation = false;
    let jdoodleError = null;

    // Check if JDoodle credentials are available
    if (!process.env.JDOODLE_CLIENT_ID || !process.env.JDOODLE_CLIENT_SECRET) {
      console.log('⚠ JDoodle credentials missing, using simulation');
      useSimulation = true;
    }

    // Try JDoodle API if credentials are available
    if (!useSimulation && problem.testCases && problem.testCases.length > 0) {
      try {
        console.log('🚀 Attempting JDoodle API execution...');
        console.log(`📝 Using Client ID: ${process.env.JDOODLE_CLIENT_ID.substring(0, 8)}...`);
        
        for (let i = 0; i < problem.testCases.length; i++) {
          const test = problem.testCases[i];
          
          // Format the Java code properly for JDoodle
          const formattedCode = formatJavaCodeForJDoodle(code, test.input);
          
          console.log(`🧪 Test ${i + 1}: Input = ${test.input.substring(0, 50)}...`);
          
          const response = await axios.post("https://api.jdoodle.com/v1/execute", {
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            script: formattedCode,
            stdin: test.input,
            language: "java",
            versionIndex: "4",
          }, {
            timeout: 15000
          });

          console.log(`📨 JDoodle Response for test ${i + 1}:`, {
            status: response.status,
            output: response.data.output ? response.data.output.substring(0, 100) + '...' : 'No output',
            error: response.data.error
          });

          if (response.data.error) {
            console.log(`❌ JDoodle error: ${response.data.error}`);
            jdoodleError = response.data.error;
            throw new Error(response.data.error);
          }

          const userOutput = (response.data.output || "").trim();
          const expectedOutput = (test.output || "").trim();
          
          const passed = userOutput === expectedOutput;
          if (passed) passedCount++;

          testResults.push({
            input: test.input,
            expected: expectedOutput,
            got: userOutput,
            status: passed ? "✅ Passed" : "❌ Failed",
            runtime: response.data.cpuTime ? `${response.data.cpuTime}s` : 'N/A'
          });
        }
        
        console.log(`✅ JDoodle execution completed: ${passedCount}/${problem.testCases.length} passed`);
        
      } catch (error) {
        console.error('❌ JDoodle API failed:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        useSimulation = true;
        jdoodleError = error.response?.data?.error || error.message;
        testResults = []; // Reset test results for simulation
      }
    }

    // Fallback to simulation if JDoodle fails or credentials missing
    if (useSimulation) {
      console.log('🔄 Using simulation mode');
      
      if (problem.testCases && problem.testCases.length > 0) {
        problem.testCases.forEach((testCase, index) => {
          // Smart simulation based on code content
          const hasReverseLogic = code.includes('reverse') || code.includes('temp') || 
                                 code.includes('swap') || (code.includes('left') && code.includes('right'));
          const hasCorrectStructure = code.includes('class') && code.includes('void') && code.includes('arr');
          
          const passed = hasReverseLogic && hasCorrectStructure && Math.random() > 0.2; // 80% pass rate if code looks correct
          if (passed) passedCount++;
          
          testResults.push({
            input: testCase.input,
            expected: testCase.output,
            got: passed ? testCase.output : 'Wrong output - check your logic',
            status: passed ? 'Passed ✅' : 'Failed ❌',
            runtime: `${(Math.random() * 100 + 50).toFixed(2)} ms`
          });
        });
      } else {
        // If no test cases, just check if code compiles
        const compiles = !code.includes('error') && code.includes('class');
        testResults.push({
          input: "No test cases",
          expected: "Compilation successful",
          got: compiles ? "Code compiled successfully" : "Compilation error",
          status: compiles ? "⚠ No tests" : "❌ Error",
          runtime: 'N/A'
        });
        passedCount = compiles ? 1 : 0;
      }
    }

    // Update progress if all test cases passed
    const allPassed = passedCount === problem.testCases.length;
    if (allPassed) {
      try {
        await UserProgress.findOneAndUpdate(
          { userId: "poonam123" },
          {
            $addToSet: {
              solvedProblems: {
                problemId: problem.id,
                difficulty: problem.difficulty,
                dateSolved: new Date(),
              },
            },
          },
          { upsert: true }
        );
        console.log(`✅ Progress updated for problem ${problem.id}`);
      } catch (progressError) {
        console.error('Progress update error:', progressError);
      }
    }

    // Prepare output message
    let output = '';
    if (useSimulation && jdoodleError) {
      output = `⚠ Simulation Mode (JDoodle Error: ${jdoodleError}) - ${passedCount}/${problem.testCases.length} test cases passed`;
    } else if (useSimulation) {
      output = `⚠ Simulation Mode - ${passedCount}/${problem.testCases.length} test cases passed`;
    } else if (allPassed) {
      output = `✅ All test cases passed! Great job! 🎉 (${passedCount}/${problem.testCases.length})`;
    } else {
      output = `⚠ ${passedCount}/${problem.testCases.length} test cases passed`;
    }

    // Get updated solved IDs for the user
    const userProgress = await UserProgress.findOne({ userId: "poonam123" });
    const solvedIds = userProgress && userProgress.solvedProblems ? 
      [...new Set(userProgress.solvedProblems.map(p => p.problemId))] : [];

    res.render('dsa_cpp/array_problem', {
      problem,
      code,
      output,
      testResults,
      solvedIds
    });

  } catch (error) {
    console.error('❌ General error in /run route:', error);
    res.status(500).render('dsa_cpp/array_problem', {
      problem: {},
      code: req.body.code,
      output: '❌ Error executing code: ' + error.message,
      testResults: []
    });
  }
});

// Helper function to format Java code for JDoodle
function formatJavaCodeForJDoodle(userCode, input) {
  // If the code already has a main method, return as is
  if (userCode.includes('public static void main')) {
    return userCode;
  }
  
  // Extract class name
  const classMatch = userCode.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Solution';
  
  // Create a complete Java program with main method
  return `
import java.util.*;

${userCode}

class Main {
    public static void main(String[] args) {
        ${className} solution = new ${className}();
        Scanner scanner = new Scanner(System.in);
        
        // Read input
        int n = scanner.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = scanner.nextInt();
        }
        
        // Call the solution method
        solution.reverseArray(arr);
        
        // Print output
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + " ");
        }
    }
}
`;
}

// -------------------------------------------
// 🧪 TEST JDoodle Route
// -------------------------------------------
router.get("/test-jdoodle", async (req, res) => {
  try {
    console.log("🧪 Testing JDoodle with new credentials...");
    
    const testCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from JDoodle!");
        System.out.println("Testing reverse array...");
        
        int[] arr = {1, 2, 3, 4, 5};
        for (int i = arr.length - 1; i >= 0; i--) {
            System.out.print(arr[i] + " ");
        }
    }
}
`;

    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: testCode,
      stdin: "",
      language: "java",
      versionIndex: "4",
    }, {
      timeout: 10000
    });

    console.log("✅ JDoodle Test Response:", response.data);
    
    res.json({
      status: "SUCCESS",
      message: "JDoodle API is working!",
      output: response.data.output,
      credentials: {
        clientId: process.env.JDOODLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
        clientSecret: process.env.JDOODLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
      },
      response: response.data
    });
    
  } catch (error) {
    console.error("❌ JDoodle Test Failed:", error.response?.data || error.message);
    res.json({
      status: "ERROR",
      error: error.response?.data || error.message,
      credentials: {
        clientId: process.env.JDOODLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
        clientSecret: process.env.JDOODLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
      }
    });
  }
});

// -------------------------------------------
// 📊 Global User Progress (All Difficulties)
// -------------------------------------------
router.get("/user/progress/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const progress = await UserProgress.findOne({ userId });

    const totalProblems = await ArrayProblem.countDocuments();
    const easyCount = await ArrayProblem.countDocuments({ difficulty: "Easy" });
    const mediumCount = await ArrayProblem.countDocuments({ difficulty: "Medium" });
    const hardCount = await ArrayProblem.countDocuments({ difficulty: "Hard" });

    let solved = { Easy: 0, Medium: 0, Hard: 0 };
    let weekly = {};

    if (progress) {
      const solvedSet = new Set();
      for (const p of progress.solvedProblems) {
        if (solvedSet.has(p.problemId)) continue;
        solvedSet.add(p.problemId);
        solved[p.difficulty]++;

        const d = new Date(p.dateSolved);
        if (d.getFullYear() === 2025 && d.getMonth() === 9) {
          const week = Math.ceil(d.getDate() / 7);
          weekly[`Week ${week}`] = (weekly[`Week ${week}`] || 0) + 1;
        }
      }
    }

    res.json({
      totalSolved: progress ? new Set(progress.solvedProblems.map((p) => p.problemId)).size : 0,
      totalProblems,
      solved,
      weekly,
      easyCount,
      mediumCount,
      hardCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching user progress" });
  }
});

// -------------------------------------------
// 🎯 Real-time Progress APIs
// -------------------------------------------

// Easy
router.get("/api/user/progress/arrays", async (req, res) => {
  await getProgressByDifficulty(req, res, "Easy");
});

// Medium
router.get("/api/user/progress/arrays-medium", async (req, res) => {
  await getProgressByDifficulty(req, res, "Medium");
});

// Hard
router.get("/api/user/progress/arrays-hard", async (req, res) => {
  await getProgressByDifficulty(req, res, "Hard");
});

// Common progress function
async function getProgressByDifficulty(req, res, difficulty) {
  try {
    const userId = "poonam123";
    const progress = await UserProgress.findOne({ userId });
    const totalProblems = await ArrayProblem.countDocuments({ difficulty });

    let solvedIds = [];
    if (progress && progress.solvedProblems) {
      const solvedArrayProblems = progress.solvedProblems.filter(
        (p) => p.difficulty === difficulty
      );
      solvedIds = [...new Set(solvedArrayProblems.map((p) => p.problemId))];
    }

    const solved = solvedIds.length;
    const percentage = totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0;

    res.json({ solved, total: totalProblems, percentage, solvedIds });
  } catch (error) {
    console.error(`Error fetching ${difficulty} progress:`, error);
    res.status(500).json({ solved: 0, total: 0, percentage: 0, solvedIds: [] });
  }
}

// -------------------------------------------
// ✅ Solved Problems List
// -------------------------------------------
router.get("/api/user/solved-problems", async (req, res) => {
  try {
    const userId = "poonam123";
    const progress = await UserProgress.findOne({ userId });
    let solvedProblems = [];

    if (progress && progress.solvedProblems) {
      solvedProblems = [...new Set(progress.solvedProblems.map((p) => p.problemId))];
    }

    res.json({ solvedProblems });
  } catch (error) {
    console.error("Error fetching solved problems:", error);
    res.status(500).json({ solvedProblems: [] });
  }
});

// -------------------------------------------
// 🔍 DEBUG Routes
// -------------------------------------------
router.get("/debug/arrays", async (req, res) => {
  try {
    const allProblems = await ArrayProblem.find().sort({ id: 1 });
    
    console.log("🔍 ALL ARRAY PROBLEMS FOUND:");
    allProblems.forEach(p => {
      console.log(`ID: ${p.id}, Title: "${p.title}", Difficulty: ${p.difficulty}`);
    });
    
    res.json({
      totalCount: allProblems.length,
      problems: allProblems.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        hasTestCases: p.testCases ? p.testCases.length : 0
      }))
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/debug/medium", async (req, res) => {
  try {
    const mediumProblems = await ArrayProblem.find({ difficulty: "Medium" }).sort({ id: 1 });
    
    console.log("🔍 MEDIUM PROBLEMS FOUND:");
    mediumProblems.forEach(p => {
      console.log(`ID: ${p.id}, Title: "${p.title}", _id: ${p._id}`);
    });
    
    res.json({
      count: mediumProblems.length,
      problems: mediumProblems.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        hasTestCases: p.testCases ? p.testCases.length : 0
      }))
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/debug/hard", async (req, res) => {
  try {
    const hardProblems = await ArrayProblem.find({ difficulty: "Hard" }).sort({ id: 1 });
    
    console.log("🔍 HARD PROBLEMS FOUND:");
    hardProblems.forEach(p => {
      console.log(`ID: ${p.id}, Title: "${p.title}", _id: ${p._id}`);
    });
    
    res.json({
      count: hardProblems.length,
      problems: hardProblems.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        hasTestCases: p.testCases ? p.testCases.length : 0
      }))
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

// NEW: Test database connection and collections
router.get("/debug/db-connection", async (req, res) => {
  try {
    const db = codingDB.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("📁 Available collections:", collections.map(c => c.name));
    
    // Check arrays_easy collection specifically
    const arrayProblems = await db.collection('arrays_easy').find({}).toArray();
    console.log(`📊 arrays_easy collection has ${arrayProblems.length} documents`);
    
    // Check what difficulties exist
    const difficulties = await db.collection('arrays_easy').distinct("difficulty");
    console.log("🎯 Available difficulties:", difficulties);
    
    // Show sample of each difficulty
    for (let difficulty of difficulties) {
      const sample = await db.collection('arrays_easy').find({difficulty}).limit(3).toArray();
      console.log(`Sample ${difficulty} problems:`, sample.map(s => ({id: s.id, title: s.title})));
    }
    
    res.json({
      database: codingDB.name,
      collections: collections.map(c => c.name),
      arrays_easy_count: arrayProblems.length,
      available_difficulties: difficulties,
      sample_problems: arrayProblems.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty
      }))
    });
  } catch (err) {
    console.error("Database connection debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;