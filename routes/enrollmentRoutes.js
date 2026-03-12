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
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, authorize('student'), enrollInCourse);
router.get('/my-courses', protect, authorize('student'), getMyCourses);
router.get('/pending', protect, authorize('instructor', 'admin'), getPendingRequests);
router.get('/instructor', protect, authorize('instructor', 'admin'), getInstructorEnrollments);
router.put('/:id/status', protect, authorize('instructor', 'admin'), handleRequest);
router.put('/:enrollmentId/progress', protect, authorize('student'), updateProgress);
router.get('/all', protect, authorize('admin'), getAllEnrollments);

module.exports = router;
