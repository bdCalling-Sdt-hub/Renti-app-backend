const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const cardSchema = new mongoose.Schema({
    accountHolderName: { type: String, required: [true, "Account Holder Name is required"] },
    phoneNumber: { type: String, required: [true, "Phone Number is required"] },
    email: { type: String, required: [true, "Email is required"] },
    bankAccountNumber: { type: String, required: [true, "Bank Account Number is required"] },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true },

);

module.exports = mongoose.model('Card', cardSchema);