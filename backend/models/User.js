const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profilePicture: { 
        type: String, 
        default: '' // S3 URL for the profile picture
    },
    // Chat-related fields
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
});

// Virtual field to map profilePicture to profileImage for chat compatibility
userSchema.virtual('profileImage').get(function() {
    return this.profilePicture;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);