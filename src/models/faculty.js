const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const facultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    facultyId: {
        type: String,
        required: [true, 'Faculty ID is required'],
        unique: true,
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: {
            values: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'General'],
            message: '{VALUE} is not a valid department'
        }
        // REMOVE the default value since it's required
    },
    role: {
        type: String,
        default: 'faculty'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    permissions: {
        canAddQuestions: { type: Boolean, default: true },
        canViewAnalytics: { type: Boolean, default: true },
        canManageStudents: { type: Boolean, default: false }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to hash password with better error handling
facultySchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Faculty', facultySchema);