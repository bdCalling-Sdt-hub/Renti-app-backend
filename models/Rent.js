const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema({
    rentTripNumber: { type: String, required: false },
    totalAmount: { type: String, required: [true, 'Total Ammount is Required'] },
    totalHours: { type: String, required: [true, 'Total Hour is Required'] },
    requestStatus: { type: String, enum: ['Accepted', 'Rejected', 'Pending', 'Completed'], default: 'Pending' },
    sentRequest: { type: String, enum: ['Active', 'Cancel'], default: 'Active' },
    startDate: { type: Date, required: [true, 'From Date is Required'] },
    endDate: { type: Date, required: [true, 'To Date is Required'] },
    payment: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true },

);

module.exports = mongoose.model('Rent', rentSchema);