const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Course description is required'],
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['Web Development', 'Mobile Development', 'Data Science', 'UI/UX Design', 'DevOps', 'Other'],
            default: 'Web Development',
        },
        thumbnail: {
            type: String,
            default: '',
        },
        lessons: [
            {
                title: { type: String, required: true },
                content: { type: String, default: '' },
                videoUrl: { type: String, default: '' },
                duration: { type: String, default: '' },
            },
        ],
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
