const Car = require("../models/Car");
const jwt = require('jsonwebtoken');
const { createCarService, getCarsService, getById, update, remove, getsSearchByName } = require("../services/CarService");
const User = require("../models/User");
const Rent = require("../models/Rent");


//Add car
const createCar = async (req, res) => {
    try {
        const { carModelName, hourlyRate, image, year, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType } = req.body;

        // // Find the user
        const user = await User.findById(req.body.userId);

        const kycFileNames = [];

        if (req.files && req.files.KYC) {
            req.files.KYC.forEach((file) => {
                kycFileNames.push(file.originalname);
            });
        }

        if (!user) {
            res.status(404).json({ message: "User not found" });
        } else if (user.role === 'host') {
            // Create the user in the database
            const car = await Car.create({
                carModelName,
                image: req.files.image[0].originalname,
                year,
                carLicenseNumber,
                carDescription,
                insuranceStartDate,
                insuranceEndDate,
                KYC: kycFileNames,
                carColor,
                carDoors,
                carSeats,
                totalRun,
                hourlyRate,
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

//All cars seen by user and admin
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
        const cars = await Car.find(filter).limit(limit).skip((page - 1) * limit).populate('carOwner', '').sort({ createdAt: -1 });
        const count = await Car.countDocuments(filter);


        const totalCar = count;

        const reservedCar = await Rent.countDocuments({ payment: "Completed" });

        const activeCar = totalCar - reservedCar

        const user = await User.findById(req.body.userId);
        if (!cars) {
            res.status(404).json({ message: 'Car not found' });
        }

        if (!user) {
            res.status(404).json({ message: 'User not found' });
        } else if (perMittedUser.role === 'admin' || perMittedUser.role === 'user') {
            res.status(200).json({
                totalCar,
                activeCar,
                reservedCar,
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

//Single cars
const getCarsById = async (req, res) => {
    try {
        const id = req.params.id;
        const car = await Car.findById(id);
        if (!car) {
            res.status(404).json({ message: 'Car not found', error });
        }
        console.log(car.carOwner);
        if (req.body.userId === car.carOwner.toString()) {
            res.status(200).json({
                message: "Car retrieved successfully",
                cars: car
            })
        } else {
            res.status(401).json({ message: 'You are not authorized' });
        }
    }
    catch (err) {
        // console.log(err);
        res.status(500).json({
            message: err.message
        })
    }
};

//Update car
const updateById = async (req, res) => {
    try {
        const { carModelName, image, year, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType } = req.body;
        // const id = req.params.id;
        // console.log("id:", id);

        const car = await Car.findById(req.params.id);
        const user = await User.findById(req.body.userId);
        console.log("meow/meow", car.carOwner)
        console.log("meow/meow", user._id);
        console.log("meow/meow", req.body.userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
        }

        if (!car) {
            res.status(404).json({ message: "Car not found" });
        } else if (user._id.equals(car.carOwner)) {
            car.carModelName = carModelName;
            car.image = image;
            car.year = year;
            car.carLicenseNumber = carLicenseNumber
            car.carDescription = carDescription
            car.insuranceStartDate = insuranceStartDate
            car.insuranceEndDate = insuranceStartDate
            car.carLicenseImage = carLicenseImage;
            car.carColor = carColor;
            car.carDoors = carDoors
            car.carSeats = carSeats
            car.totalRun = totalRun;
            car.gearType = gearType;

            await car.save();
            res.status(200).json({ message: 'Car updated successfully' });
        } else {
            res.status(401).json({ message: 'You are not authorize to update' })
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error updating car' });
    }
};

// Delete car by owner
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
        } else if (user._id.equals(car.carOwner)) {
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
