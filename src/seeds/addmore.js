const mongoose = require('mongoose');
const Question = require('../models/Question');
const Topic = require('../models/Topic');
require('dotenv').config();

const additionalQuestions = [
  // Number System - More Questions
  {
    topicId: null, // Will be set dynamically
    question: "What is the square root of 169?",
    options: ["12", "13", "14", "15"],
    answer: "13",
    explanation: "13 × 13 = 169, so the square root of 169 is 13.",
    difficulty: "easy"
  },
  {
    topicId: null,
    question: "Which of these is a perfect square?",
    options: ["24", "36", "50", "72"],
    answer: "36",
    explanation: "36 is a perfect square because 6 × 6 = 36.",
    difficulty: "easy"
  },
  {
    topicId: null,
    question: "What is the LCM of 12 and 18?",
    options: ["24", "36", "48", "72"],
    answer: "36",
    explanation: "Prime factors: 12 = 2²×3, 18 = 2×3². LCM = 2²×3² = 36",
    difficulty: "medium"
  },

  // Percentages - More Questions
  {
    topicId: null,
    question: "If the price of a product increases from $80 to $100, what is the percentage increase?",
    options: ["20%", "25%", "30%", "35%"],
    answer: "25%",
    explanation: "Increase = $20, Original = $80. Percentage = (20/80)×100 = 25%",
    difficulty: "medium"
  },
  {
    topicId: null,
    question: "A student scores 45 out of 60. What is the percentage?",
    options: ["65%", "70%", "75%", "80%"],
    answer: "75%",
    explanation: "Percentage = (45/60)×100 = 75%",
    difficulty: "easy"
  },

  // Number Series - More Questions
  {
    topicId: null,
    question: "What comes next: 1, 1, 2, 3, 5, 8, ?",
    options: ["11", "12", "13", "14"],
    answer: "13",
    explanation: "Fibonacci sequence: Each number is the sum of the two preceding ones.",
    difficulty: "medium"
  },
  {
    topicId: null,
    question: "What comes next: 2, 6, 18, 54, ?",
    options: ["108", "142", "162", "216"],
    answer: "162",
    explanation: "Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162",
    difficulty: "medium"
  },

  // Reading Comprehension - More Questions
  {
    topicId: null,
    question: "Read: 'The company reported a 15% increase in quarterly profits due to improved operational efficiency and new product launches.' What contributed to the profit increase?",
    options: [
      "Only operational efficiency",
      "Only new product launches", 
      "Both operational efficiency and new product launches",
      "Market expansion"
    ],
    answer: "Both operational efficiency and new product launches",
    explanation: "The passage explicitly mentions both 'improved operational efficiency and new product launches' as reasons for the profit increase.",
    difficulty: "easy"
  },

  // Para Jumbles - More Questions
  {
    topicId: null,
    question: "Arrange: 1. Then she prepared breakfast. 2. First, she went for a morning walk. 3. After that, she took a shower. 4. Finally, she left for work.",
    options: ["2-3-1-4", "1-2-3-4", "3-2-1-4", "4-3-2-1"],
    answer: "2-3-1-4",
    explanation: "Logical sequence: Morning walk → Shower → Breakfast → Work",
    difficulty: "easy"
  }
];

async function addMoreQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/WorkWaveDB');
    console.log('✅ Connected to MongoDB');

    // Get topic IDs
    const numberSystem = await Topic.findOne({ slug: 'number-system' });
    const percentages = await Topic.findOne({ slug: 'percentages' });
    const numberSeries = await Topic.findOne({ slug: 'number-series' });
    const readingComprehension = await Topic.findOne({ slug: 'reading-comprehension' });
    const paraJumbles = await Topic.findOne({ slug: 'para-jumbles' });

    // Assign topic IDs to questions
    const questionsWithTopicIds = additionalQuestions.map(q => {
      let topicId;
      if (q.question.includes('square') || q.question.includes('LCM')) {
        topicId = numberSystem._id;
      } else if (q.question.includes('percentage') || q.question.includes('price')) {
        topicId = percentages._id;
      } else if (q.question.includes('comes next') || q.question.includes('Fibonacci')) {
        topicId = numberSeries._id;
      } else if (q.question.includes('Read:')) {
        topicId = readingComprehension._id;
      } else if (q.question.includes('Arrange:')) {
        topicId = paraJumbles._id;
      }
      return { ...q, topicId };
    });

    // Insert questions
    const result = await Question.insertMany(questionsWithTopicIds);
    console.log(`✅ Added ${result.length} more questions to database`);

    // Show summary
    const summary = await Question.aggregate([
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$topic.name', 0] },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Updated Question Summary:');
    summary.forEach(item => {
      console.log(`   ${item._id}: ${item.count} questions`);
    });

    await mongoose.disconnect();
    console.log('✅ Additional questions added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addMoreQuestions();