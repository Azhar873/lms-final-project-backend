const Course = require('../models/Course');
const { uploadFromBuffer, uploadLargeFile } = require('../utils/cloudinaryUtils');
const fs = require('fs');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category) query.category = category;
        if (search) query.title = { $regex: search, $options: 'i' };

        const courses = await Course.find(query)
            .populate('instructor', 'name email')
            .sort({ createdAt: -1 });

        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate(
            'instructor',
            'name email'
        );
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private (Instructor, Admin)
const createCourse = async (req, res) => {
    try {
        const { title, description, category, thumbnail } = req.body;

        const course = await Course.create({
            title,
            description,
            category,
            thumbnail: thumbnail || '',
            instructor: req.user._id,
        });

        const populated = await course.populate('instructor', 'name email');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Instructor who owns it, Admin)
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Only owner instructor or admin can update
        if (
            course.instructor.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('instructor', 'name email');

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor who owns it, Admin)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (
            course.instructor.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }

        await course.deleteOne();
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add lesson to a course
// @route   POST /api/courses/:id/lessons
// @access  Private (Instructor who owns it)
const addLesson = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (
            course.instructor.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, content, videoUrl, duration } = req.body;
        course.lessons.push({ title, content, videoUrl, duration });
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        console.log('Uploading large video to Cloudinary via chunked upload...');
        const result = await uploadLargeFile(req.file.path, 'videos', 'video');
        console.log('Video upload successful:', result.secure_url);
        
        // Delete local temporary file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(200).json({
            success: true,
            videoUrl: result.secure_url,
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Cloudinary Video Upload Error:', error);
        
        // Ensure local file is deleted even if upload fails
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload an image
// @route   POST /api/courses/upload-image
// @access  Private (Instructor, Admin)
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        console.log('Uploading image to Cloudinary...');
        const result = await uploadFromBuffer(req.file.buffer, 'images', 'image');
        console.log('Image upload successful:', result.secure_url);

        res.status(200).json({
            success: true,
            imageUrl: result.secure_url,
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Cloudinary Image Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, addLesson, uploadVideo, uploadImage };
