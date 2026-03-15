const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private (Student)
const addReview = async (req, res) => {
    try {
        const { courseId, rating, comment } = req.body;

        if (!courseId || !rating || !comment) {
            return res.status(400).json({ message: 'Please provide courseId, rating, and comment' });
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student is enrolled and approved
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
            status: 'approved'
        });

        if (!enrollment) {
            return res.status(403).json({ message: 'You must be an approved student in this course to leave a review' });
        }

        // Create review
        const review = await Review.create({
            student: req.user._id,
            course: courseId,
            rating,
            comment
        });

        const populatedReview = await review.populate('student', 'name email');

        res.status(201).json({
            success: true,
            data: populatedReview
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this course' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get course reviews
// @route   GET /api/reviews/course/:courseId
// @access  Public
const getCourseReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ course: req.params.courseId })
            .populate('student', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for instructor's courses
// @route   GET /api/reviews/instructor
// @access  Private (Instructor)
const getInstructorReviews = async (req, res) => {
    try {
        // Find all courses by this instructor
        const courses = await Course.find({ instructor: req.user._id });
        const courseIds = courses.map(course => course._id);

        // Find reviews for these courses
        const reviews = await Review.find({ course: { $in: courseIds } })
            .populate('student', 'name email')
            .populate('course', 'title thumbnail')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Instructor who owns the course, or Admin)
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id).populate('course');

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Only course instructor or admin can delete
        if (
            review.course.instructor.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        await review.deleteOne();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addReview,
    getCourseReviews,
    getInstructorReviews,
    deleteReview
};
