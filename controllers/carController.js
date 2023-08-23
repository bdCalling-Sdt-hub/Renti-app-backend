const Car = require("../models/Car");
const jwt = require('jsonwebtoken');
const { createCarService, getCarsService, getById, update, remove, getsSearchByName } = require("../services/CarService");
const User = require("../models/User");


//Add car
const createCar = async (req, res) => {
    try {
        const { carModelName, image, year, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType } = req.body;

        // // Find the user
        const user = await User.findById(req.body.userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
        } else if (user.role === 'host') {
            // Create the user in the database
            const car = await Car.create({
                carModelName,
                image,
                year,
                carLicenseNumber,
                carDescription,
                insuranceStartDate,
                insuranceEndDate,
                carLicenseImage,
                carColor,
                carDoors,
                carSeats,
                totalRun,
                gearType,
                carOwner: user._id,
            });
            res.status(201).json({ message: 'Car created successfully', car });
        } else {
            res.status(501).json({ message: "You are not authorized" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user', error });
    }
};


const allCars = async (req, res) => {
    try {
        //Search the users
        const userTypes = req.params.filter;
        const search = req.query.search || '';
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchRegExp = new RegExp('.*' + search + '.*', 'i');
        const filter = {
            $or: [
                { carModelName: { $regex: searchRegExp } },
                { carDescription: { $regex: searchRegExp } },
                { carColor: { $regex: searchRegExp } },
                { gearType: { $regex: searchRegExp } },
            ]
        }
        const perMittedUser = await User.findById(req.body.userId);
        const cars = await Car.find(filter).limit(limit).skip((page - 1) * limit);
        const count = await Car.countDocuments(filter);

        const user = await User.findById(req.body.userId);
        if (!cars) {
            res.status(404).json({ message: 'Car not found' });
        }

        if (!user) {
            res.status(404).json({ message: 'User not found' });
        } else if (perMittedUser.role === 'admin' || perMittedUser.role === 'user') {
            res.status(200).json({
                cars,
                pagination: {
                  totalDocuments: count,
                  totalPage: Math.ceil(count / limit),
                  currentPage: page,
                  previousPage: page - 1 > 0 ? page - 1 : null,
                  nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
                }
              });
        } else {
            res.status(501).json({ message: 'You are not authorized' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error getting  cars', error });
    }
};

//All cars
const getCarsById = async (req, res) => {
    try {
        const id = req.params.id;
        const car = await getById(id);
        res.status(200).json({
            message: "Car retrieved successfully",
            cars: car
        })
    }
    catch (err) {
        // console.log(err);
        res.status(500).json({
            message: err.message
        })
    }
}

//Update car
const updateById = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("id:", id);

        const car = await Car.findById(id);

        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user._id === req.body.userId) {
            return res.status(403).json({ message: 'Unauthorized to update this car' });
        }

        // Update car data
        car.set(req.body);

        await car.save();

        res.status(200).json({ message: 'Car updated successfully', car });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error updating car' });
    }
};



const deleteById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(req.body.userId);
        const car = await Car.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        } else if (user._id.toString() === req.body.userId) {
            await car.deleteOne(); // No need to call save after deleteOne
            res.status(200).json({ message: 'Car deleted successfully' });
        } else {
            res.status(403).json({ message: 'You are not authorized to delete this car' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting car' });
    }
};



module.exports = { createCar, allCars, getCarsById, updateById, deleteById }
