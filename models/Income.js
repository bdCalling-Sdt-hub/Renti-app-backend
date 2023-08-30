const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    rentiIncome: { type: String },
    hostIncome: { type: String },
    hostId: { type: mongoose.Schema.Types.ObjectId },

}, { timestamps: true },

);

module.exports = mongoose.model('User', userSchema);