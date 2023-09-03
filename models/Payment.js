const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentData: { type: Object },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    rentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rent' },
    payout: { type: Boolean, default: false },

},
    { timestamps: true },

);

module.exports = mongoose.model('Payment', paymentSchema);