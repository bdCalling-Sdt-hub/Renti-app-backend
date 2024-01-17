const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const cardSchema = new mongoose.Schema({
    creaditCardNumber: { type: String, required: false },
    expireDate: { type: String, required: false },
    cvv: { type: String, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true },

);

module.exports = mongoose.model('Card', cardSchema);