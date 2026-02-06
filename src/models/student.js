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
        // Remove required: true to allow Google OAuth users
        minlength: 6
    },
    googleId: {
        type: String,
        sparse: true // Allows multiple null values
    },
    avatar: {
        type: String
    },
    role: {
        type: String,
        default: 'student'
    },
    isVerified: {
        type: Boolean,
        default: false
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

// Modify pre-save hook to only hash password if it exists
studentSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Add method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false; // For Google OAuth users without password
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);