const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentData: { type: Object },
    
},
    { timestamps: true },

);

module.exports = mongoose.model('Payment', paymentSchema);