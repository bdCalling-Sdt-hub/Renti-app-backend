const Rent = require("../models/Rent");
const User = require("../models/User");
const Car = require("../models/Car");

const createRentRequest = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        console.log(startDate, endDate);

        const { carId } = req.params;

        const user = await User.findById(req.body.userId);
        const car = await Car.findById(req.params.carId);
        console.log(user);
        const hourlyRate = car.hourlyRate;

        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);

        // Calculate the time difference in milliseconds
        const timeDiff = toDate - fromDate;

        // Calculate hours and minutes
        const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
        const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`Total hours: ${totalHours} hours and ${totalMinutes} minutes`);

        const totalAmount = Number(hourlyRate) * totalHours
        console.log(totalAmount);

        if(!user) {
            res.status(404).json({ message: 'You do not have permission to'});
        }

        if(user.role !== "user"){
            res.status(401).json({message: "Invalid role"});
        }

        const rents = await Rent.create({
            totalAmount,
            startDate,
            endDate,
            userId: user._id,
            carId
        })
        
        res.status(200).json({message: 'Rent request successful', rents});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Error creating car", error: error})
    }
};

const acceptRentRequest = async (req, res) => {
    try {
        const rentRequest = await Rent.findOne({_id: req.params.requestId});
        const car = await Car.findOne({_id: rentRequest.carId});
        
        if(!rentRequest){
            res.status(404).json({message: 'Request not found'})
        }

        if(!car){
            res.status(404).json({message: 'Car not found'});
        }

        if(car.carOwner !== req.body.userId){
            res.status(401).json({message: 'You do not have permission'})
        }

        rentRequest.requestStatus = 'Accepted';
        await rentRequest.save();
        res.status(200).json({message: 'Request accepted'});

    } catch (error) {
        res.status(500).json({message: 'Error accepting rent request', error: error});
    }
};



module.exports = {createRentRequest, acceptRentRequest};