const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const User = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Helper function to sanitize filename for S3
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
        .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

// Configure AWS S3 (v3)
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true); // Accept file
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
        }
    },
});

// **Route to Upload Profile Picture to S3**
router.post('/upload', authenticate, upload.single('profilePicture'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const fileExtension = path.extname(req.file.originalname);
    const originalName = path.basename(req.file.originalname, fileExtension); // Get filename without extension
    const sanitizedName = sanitizeFilename(originalName); // Sanitize filename for S3
    
    // Get user to access username
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const sanitizedUsername = sanitizeFilename(user.username); // Sanitize username for S3
    const fileName = `profileimages/${sanitizedUsername}-${sanitizedName}${fileExtension}`;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
    };

    try {
        // Delete old profile picture from S3 if it exists
        if (user.profilePicture && user.profilePicture.includes(process.env.S3_BUCKET_NAME)) {
            const oldImageKey = user.profilePicture.split('/').slice(-2).join('/'); // Get 'profileimages/filename'
            
            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: oldImageKey,
            };

            try {
                await s3.send(new DeleteObjectCommand(deleteParams));
            } catch (deleteError) {
                console.error('Error deleting old profile picture from S3:', deleteError.message);
                // Continue with upload even if delete fails
            }
        }

        // Upload new profile picture
        const uploadCommand = new PutObjectCommand(params);
        await s3.send(uploadCommand);
        
        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        
        // Update user's profile picture URL in database
        user.profilePicture = imageUrl;
        await user.save();

        res.status(200).json({ 
            imageUrl, 
            message: 'Profile picture uploaded successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Failed to upload profile picture to S3' });
    }
});

// **Route to Delete Profile Picture from S3**
router.delete('/delete', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.profilePicture || !user.profilePicture.includes(process.env.S3_BUCKET_NAME)) {
            return res.status(400).json({ error: 'No profile picture to delete' });
        }

        // Extract the S3 key from the URL
        const imageKey = user.profilePicture.split('/').slice(-2).join('/'); // Get 'profileimages/filename'
        
        const deleteParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: imageKey,
        };

        // Delete from S3
        await s3.send(new DeleteObjectCommand(deleteParams));
        
        // Remove profile picture URL from database
        user.profilePicture = '';
        await user.save();

        res.status(200).json({ 
            message: 'Profile picture deleted successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        res.status(500).json({ error: 'Failed to delete profile picture' });
    }
});

module.exports = router;
