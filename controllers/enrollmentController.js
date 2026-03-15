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

        if (req.body.progress !== undefined) {
            enrollment.progress = req.body.progress;
        }

        if (enrollment.progress === 100 && !enrollment.completedAt) {
            enrollment.completedAt = new Date();
        }

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

// @desc    Get enrollment by ID
// @route   GET /api/enroll/:id
// @access  Private
const getEnrollmentById = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('student', 'name email')
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name email title' } // instructor details
            });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Allow access to student, Course Instructor, or Admin
        const isStudent = enrollment.student._id.toString() === req.user._id.toString();
        const isInstructor = enrollment.course.instructor._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isStudent && !isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this enrollment' });
        }

        res.json(enrollment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a lesson as complete and update progress
// @route   POST /api/enroll/:id/lesson-complete
// @access  Private (Student)
const completeLesson = async (req, res) => {
    try {
        const { lessonIndex } = req.body;
        const enrollment = await Enrollment.findById(req.params.id).populate('student').populate({
            path: 'course',
            populate: { path: 'instructor' }
        });

        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        if (enrollment.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Add lesson index to completedLessons if not already present
        if (!enrollment.completedLessons.includes(lessonIndex)) {
            enrollment.completedLessons.push(lessonIndex);
        }

        // Calculate progress
        const totalLessons = enrollment.course.lessons.length;
        const completedCount = enrollment.completedLessons.length;
        const progressPercentage = Math.round((completedCount / totalLessons) * 100);

        const wasAlreadyCompleted = enrollment.progress === 100;
        enrollment.progress = progressPercentage;

        if (enrollment.progress === 100 && !wasAlreadyCompleted && !enrollment.completedAt) {
            enrollment.completedAt = new Date();

            // Send email to instructor
            try {
                const instructorEmail = enrollment.course.instructor.email;
                const message = `
                    Hello ${enrollment.course.instructor.name},

                    Great news! A student has just completed your course.

                    Student: ${enrollment.student.name} (${enrollment.student.email})
                    Course: ${enrollment.course.title}
                    Completed On: ${enrollment.completedAt.toLocaleDateString()}

                    They have been issued their completion certificate. You can view all completed student certificates in your LearnHub Instructor Dashboard under the "Certificates" tab.

                    Regards,
                    LearnHub Team
                `;

                await sendEmail({
                    email: instructorEmail,
                    subject: '🎉 A student completed your course!',
                    message,
                });
            } catch (err) {
                console.error('Failed to send course completion email to instructor:', err);
            }
        }

        await enrollment.save();
        res.json(enrollment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get instructor analytics
// @route   GET /api/enroll/instructor-analytics
// @access  Private (Instructor)
const getInstructorAnalytics = async (req, res) => {
    try {
        // Get all courses by this instructor
        const courses = await Course.find({ instructor: req.user._id }).select('_id title');
        const courseIds = courses.map(c => c._id);
        const totalCourses = courses.length;

        // All enrollments for instructor's courses
        const allEnrollments = await Enrollment.find({ course: { $in: courseIds } })
            .populate('student', 'name email')
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        const totalStudents = new Set(
            allEnrollments.filter(e => e.status === 'approved').map(e => e.student?._id?.toString())
        ).size;

        const pendingRequests = allEnrollments.filter(e => e.status === 'pending').length;
        const approvedCount = allEnrollments.filter(e => e.status === 'approved').length;
        const rejectedCount = allEnrollments.filter(e => e.status === 'rejected').length;
        const completedEnrollments = allEnrollments.filter(e => e.progress === 100).length;

        // Monthly enrollments for last 6 months
        const now = new Date();
        const monthlyEnrollments = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = allEnrollments.filter(e => {
                const d = new Date(e.createdAt);
                return d >= date && d < nextDate;
            }).length;
            monthlyEnrollments.push({
                month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
                enrollments: count,
            });
        }

        // Recent 6 enrollments
        const recentActivity = allEnrollments.slice(0, 6).map(e => ({
            _id: e._id,
            studentName: e.student?.name || 'Unknown',
            studentEmail: e.student?.email || '',
            courseTitle: e.course?.title || 'Unknown',
            status: e.status,
            date: e.createdAt,
        }));

        res.json({
            totalCourses,
            totalStudents,
            pendingRequests,
            completedEnrollments,
            approvedCount,
            rejectedCount,
            monthlyEnrollments,
            recentActivity,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { enrollInCourse, getMyCourses, getPendingRequests, handleRequest, updateProgress, getAllEnrollments, getInstructorEnrollments, getEnrollmentById, completeLesson, getInstructorAnalytics };

