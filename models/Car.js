const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    carModelName: { type: String, required: [true, 'Car Model is must be given'] },
    image: { type: String, required: [true, 'Image is must be given'] },
    year: { type: String, required: [true, 'Year is must be given'] },
    carLicenseNumber: { type: String, required: [true, 'Car License Number is must be given'] },
    carDescription: { type: String, required: [true, 'Car Description is must be given'] },
    insuranceStartDate: { type: String, required: [true, 'Insurance Start Date is must be given'] },
    insuranceEndDate: { type: String, required: [true, 'Insurance End Date is must be given'] },
    carLicenseImage: { type: String, required: [true, 'Car License Image is must be given'] },
    carColor: { type: String, required: false },
    carDoors: { type: String, required: false },
    carSeats: { type: String, required: false },
    totalRun: { type: String, required: false },
    gearType: { type: String, enum: ['Baby Car Seat', 'Sunroof', 'Bluetooth', 'GPS'], default: 'Baby Car Seat' },
}, { timestamps: true },

);

module.exports = mongoose.model('Car', carSchema);