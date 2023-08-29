const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentData: { type: Object },
    carId: { type: mongoose.Schema.Types.ObjectId }

},
    { timestamps: true },

);

module.exports = mongoose.model('Payment', paymentSchema);