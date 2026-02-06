require('dotenv').config();
const mongoose = require('mongoose');
const ArrayProblem = require('./models/ArrayProblem');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB\n");

    const p = await ArrayProblem.findOne({ id: 1 });
    if (!p) {
      console.log("❌ No problem found with id=1");
    } else {
      console.log("🧩 Problem Title:", p.title);
      console.log("\n🧠 Test Cases:\n", p.testCases);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    mongoose.connection.close();
  }
})();
