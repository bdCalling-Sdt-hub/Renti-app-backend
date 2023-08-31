const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const incomeSchema = new mongoose.Schema({
    hostTotalPending: { type: String },
    hostTotalPayment: { type: String },
    paymentList: { type: String },
    hostId: { type: mongoose.Schema.Types.ObjectId },

}, { timestamps: true },

);

module.exports = mongoose.model('Income', incomeSchema);