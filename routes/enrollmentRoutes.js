const express = require('express');
const router = express.Router();
const {
    enrollInCourse,
    getMyCourses,
    getPendingRequests,
    handleRequest,
    updateProgress,
    getAllEnrollments,
    getInstructorEnrollments,
    getEnrollmentById,
    completeLesson,
    getInstructorAnalytics,
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, authorize('student'), enrollInCourse);
router.get('/my-courses', protect, authorize('student'), getMyCourses);
router.get('/pending', protect, authorize('instructor', 'admin'), getPendingRequests);
router.get('/instructor', protect, authorize('instructor', 'admin'), getInstructorEnrollments);
router.get('/instructor-analytics', protect, authorize('instructor', 'admin'), getInstructorAnalytics);
router.put('/:id/status', protect, authorize('instructor', 'admin'), handleRequest);
router.put('/:enrollmentId/progress', protect, authorize('student'), updateProgress);
router.get('/all', protect, authorize('admin'), getAllEnrollments);
router.get('/:id', protect, getEnrollmentById);
router.post('/:id/lesson-complete', protect, authorize('student'), completeLesson);

module.exports = router;

