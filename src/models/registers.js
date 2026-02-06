const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        default: 'student'
    },
    progress: {
        quantitative: { type: Number, default: 0 },
        logical: { type: Number, default: 0 },
        verbal: { type: Number, default: 0 },
        overall: { type: Number, default: 0 }
    },
    enrolledCourses: [{
        type: String,
        default: []
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to hash password
studentSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('Student', studentSchema);