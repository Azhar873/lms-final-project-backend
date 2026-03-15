const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Please provide a rating'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: [true, 'Please provide a comment'],
            trim: true,
        },
    },
    { timestamps: true }
);

// Prevent user from submitting more than one review per course
reviewSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
