const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, deleteUser, getAnalytics } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
