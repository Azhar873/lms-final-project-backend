const express = require('express');
const router = express.Router();
const {
    addReview,
    getCourseReviews,
    getInstructorReviews,
    deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, authorize('student'), addReview);
router.get('/course/:courseId', getCourseReviews);
router.get('/instructor', protect, authorize('instructor'), getInstructorReviews);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteReview);

module.exports = router;
