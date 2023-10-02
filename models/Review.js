// review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    hostId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'User' },
    carId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Car' },
    reviewer: { type: String, enum: ['user', 'host'] },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
