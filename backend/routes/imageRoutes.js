const express = require('express');
const upload = require('../middleware/multer-s3'); // Path to multer-s3 middleware
const router = express.Router();

// Route to upload an image
router.post('/upload', upload.single('image'), (req, res) => {
    try {
        res.status(200).json({
            message: 'Image uploaded successfully',
            imageUrl: req.file.location, // S3 public URL
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

module.exports = router;