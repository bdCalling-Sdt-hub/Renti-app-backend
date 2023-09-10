const mongoose = require('mongoose');

const hostPaymentTmeSchema = new mongoose.Schema({
    label: { type: String, required: [true, 'Label is must be Required'] },
},
    { timestamps: true },

);

module.exports = mongoose.model('HostPaymentTme', hostPaymentTmeSchema);