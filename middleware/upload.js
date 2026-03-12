const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use /tmp for serverless environments (like Vercel)
const uploadDir = process.env.NODE_ENV === 'production' 
    ? path.join(os.tmpdir(), 'uploads') 
    : path.join(__dirname, '../uploads');

// Create uploads folder safely
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.log('Upload directory creation skipped or failed:', err.message);
}

// User memory storage for images
const imageStorage = multer.memoryStorage();

// Use disk storage for videos to handle large files and Cloudinary chunked upload
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filters
const videoFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mkv', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid video type. Only MP4, MKV, WEBM, and MOV are allowed.'), false);
    }
};

const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image type. Only JPG, PNG, WEBP, and GIF are allowed.'), false);
    }
};

const uploadVideo = multer({
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = { uploadVideo, uploadImage };
