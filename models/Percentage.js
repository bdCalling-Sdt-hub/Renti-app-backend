const mongoose = require('mongoose');

const percentageSchema = new mongoose.Schema({
    content: { type: String, required: [true, 'Percentage is must be Required'] },
},
    { timestamps: true },

);

module.exports = mongoose.model('Percentage', percentageSchema);