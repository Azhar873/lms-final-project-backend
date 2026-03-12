const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc    Request enrollment in a course (status: pending)
// @route   POST /api/enroll
// @access  Private (Student)
const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const existing = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
        });

        if (existing) {
            return res.status(400).json({ message: 'You have already sent a request for this course', status: existing.status });
        }

        const enrollment = await Enrollment.create({
            student: req.user._id,
            course: courseId,
            status: 'pending',
            progress: 0,
        });

        await enrollment.populate('course');
        res.status(201).json({ message: 'Enrollment request sent successfully', enrollment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's enrolled courses (all statuses)
// @route   GET /api/enroll/my-courses
// @access  Private (Student)
const getMyCourses = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user._id })
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name email' },
            })
            .sort({ createdAt: -1 });

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending enrollment requests for instructor's courses
// @route   GET /api/enroll/pending
// @access  Private (Instructor)
const getPendingRequests = async (req, res) => {
    try {
        // Get all courses by this instructor
        const courses = await Course.find({ instructor: req.user._id }).select('_id');
        const courseIds = courses.map(c => c._id);

        const enrollments = await Enrollment.find({
            course: { $in: courseIds },
            status: 'pending',
        })
            .populate('student', 'name email')
            .populate('course', 'title thumbnail category')
            .sort({ createdAt: -1 });

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject an enrollment request
// @route   PUT /api/enroll/:id/status
// @access  Private (Instructor)
const handleRequest = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected' });
        }

        const enrollment = await Enrollment.findById(req.params.id).populate({
            path: 'course',
            select: 'instructor',
        });

        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        // Only the course instructor can approve/reject
        if (enrollment.course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        enrollment.status = status;
        await enrollment.save();

        res.json({ message: `Request ${status} successfully`, enrollment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update course progress
// @route   PUT /api/enroll/:enrollmentId/progress
// @access  Private (Student)
const updateProgress = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.enrollmentId);
        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        if (enrollment.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        enrollment.progress = req.body.progress || enrollment.progress;
        await enrollment.save();
        res.json(enrollment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all enrollments (Admin)
// @route   GET /api/enroll/all
// @access  Private (Admin)
const getAllEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find()
            .populate('student', 'name email')
            .populate('course', 'title')
            .sort({ createdAt: -1 });
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all enrollments for instructor's courses (all statuses)
// @route   GET /api/enroll/instructor
// @access  Private (Instructor)
const getInstructorEnrollments = async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id }).select('_id');
        const courseIds = courses.map(c => c._id);

        const enrollments = await Enrollment.find({
            course: { $in: courseIds },
        })
            .populate('student', 'name email')
            .populate('course', 'title thumbnail category')
            .sort({ createdAt: -1 });

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { enrollInCourse, getMyCourses, getPendingRequests, handleRequest, updateProgress, getAllEnrollments, getInstructorEnrollments };
