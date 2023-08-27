const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema({
    totalAmount: { type: String, required: [true, 'Total Ammount is Required'] },
    requestStatus: { type: String, enum: ['Accepted', 'Rejected', 'Pending'], default: 'Pending' },
    startDate: { type: Date, required: [true, 'From Date is Required'] },
    endDate: { type: Date, required: [true, 'To Date is Required'] },
    payment: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    userId: { type: mongoose.Schema.Types.ObjectId },
    carId: { type: mongoose.Schema.Types.ObjectId },
    hostId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true },

);

module.exports = mongoose.model('Rent', rentSchema);