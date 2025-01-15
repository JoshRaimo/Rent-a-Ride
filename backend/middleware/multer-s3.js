const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3');

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        acl: 'public-read', // Ensure the file is publicly accessible
        contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically detect and set the correct Content-Type
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname }); // Optionally customize metadata
        },
        key: (req, file, cb) => {
            cb(null, `images/${Date.now().toString()}-${file.originalname}`); // Create unique file keys
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // Optional: Limit file size to 5MB
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

module.exports = upload