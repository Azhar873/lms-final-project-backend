const express = require('express');
const router = express.Router();
const {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    uploadVideo: uploadVideoController,
    uploadImage: uploadImageController
} = require('../controllers/courseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { uploadVideo, uploadImage } = require('../middleware/upload');

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);
router.post('/:id/lessons', protect, authorize('instructor', 'admin'), addLesson);
router.post('/upload-video', protect, authorize('instructor', 'admin'), uploadVideo.single('video'), uploadVideoController);
router.post('/upload-image', protect, authorize('instructor', 'admin'), uploadImage.single('image'), uploadImageController);

module.exports = router;
