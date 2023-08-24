const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    carModelName: { type: String, required: [true, 'Name is must be Required'] },
    image: { type: String, required: [true, 'Image is must be Required'] },
    year: { type: Number, required: [true, 'Year is must be Required'] },
    carLicenseNumber: { type: String, required: [true, 'Car License Number is must be Required'] },
    carDescription: { type: String, required: [true, 'Car Description is must be Required'] },
    insuranceStartDate: { type: String, required: [true, 'Start Date is must be Required'] },
    insuranceEndDate: { type: String, required: [true, 'End Date is must be Required'] },
    // carLicenseImage: { type: Object, required: [true, 'Car License Image is must be Required'] },
    carLicenseImage: { type: String, required: [true, 'Car License Image is must be Required'] },
    carColor: { type: String, required: false },
    carDoors: { type: String, required: false },
    carSeats: { type: String, required: false },
    totalRun: { type: String, required: false },
    hourlyRate: { type: String, required: true },
    gearType: { type: String, enum: ['Baby Car Seat', 'Sunroof', 'Bluetooth', 'GPS'], default: 'Baby Car Seat' },
    activeReserve: { type: Boolean, required: false, default: 'false'},
    carOwner: { type: mongoose.Schema.Types.ObjectId },
},
    { timestamps: true },

);

module.exports = mongoose.model('Car', carSchema);