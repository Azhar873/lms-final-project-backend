const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard analytics
// @route   GET /api/users/analytics
// @access  Private (Admin only)
const getAnalytics = async (req, res) => {
    try {
        const Enrollment = require('../models/Enrollment');
        const Course = require('../models/Course');

        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalInstructors = await User.countDocuments({ role: 'instructor' });
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Enrollment.countDocuments();

        // User growth last 6 months
        const now = new Date();
        const userGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = await User.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });
            userGrowth.push({
                month: date.toLocaleString('default', { month: 'short' }),
                users: count
            });
        }

        // Course distribution by category
        const categories = await Course.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        const courseDistribution = categories.map(c => ({
            name: c._id || 'Other',
            value: c.count
        }));

        const recentUsers = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalUsers,
            totalStudents,
            totalInstructors,
            totalCourses,
            totalEnrollments,
            userGrowth,
            courseDistribution,
            recentUsers,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllUsers, getUserById, deleteUser, getAnalytics };
