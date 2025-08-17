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
const upload = multer({ storage: storage });

// **Route to Upload Image to S3**
router.post('/upload', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { year, make, model } = req.body;
    
    // Validate required car information
    if (!year || !make || !model) {
        return res.status(400).json({ error: 'Year, make, and model are required for car image upload' });
    }

    const fileExtension = path.extname(req.file.originalname);
    
    // Sanitize car information for S3 filename
    const sanitizedYear = sanitizeFilename(year.toString());
    const sanitizedMake = sanitizeFilename(make);
    const sanitizedModel = sanitizeFilename(model);
    
    const fileName = `images/${sanitizedYear}${sanitizedMake}${sanitizedModel}${fileExtension}`;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
    };

    try {
        const uploadCommand = new PutObjectCommand(params);
        await s3.send(uploadCommand);
        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        res.status(200).json({ imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload image to S3' });
    }
});

// **Route to Delete an Image from S3**
router.delete('/delete', async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required.' });
    }

    // Extract the S3 object key from the image URL
    const imageKey = decodeURIComponent(imageUrl.split(`${process.env.S3_BUCKET_NAME}/`)[1]);

    if (!imageKey) {
        return res.status(400).json({ error: 'Invalid S3 image URL format' });
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageKey,
    };

    try {
        const deleteCommand = new DeleteObjectCommand(params);
        await s3.send(deleteCommand);
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete image from S3' });
    }
});

module.exports = router;