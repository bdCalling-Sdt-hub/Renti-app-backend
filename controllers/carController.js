const Car = require("../models/Car");
const jwt = require('jsonwebtoken');
const { createCarService, getCarsService, getById, update, remove, getsSearchByName } = require("../services/CarService");
const User = require("../models/User");
const Rent = require("../models/Rent");


//Add car
const createCar = async (req, res) => {
    try {
        const { carModelName, hourlyRate, image, year, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType, registrationDate } = req.body;

        // // Find the user
        const user = await User.findById(req.body.userId);

        const kycFileNames = [];

        if (req.files && req.files.KYC) {
            req.files.KYC.forEach((file) => {
                const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/kyc/${file.filename}`;
                kycFileNames.push(publicFileUrl);
            });
        }

        if (!user) {
            res.status(404).json({ message: "User not found" });
        } else if (user.role === 'host') {
            // Create the user in the database

            const publicImageUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${req.files.image[0].filename}`;

            const car = await Car.create({
                carModelName,
                image: publicImageUrl,
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
                registrationDate,
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

//All hoist car

// const allHostCars = async (req, res) => {
//     try {
//         const host = await User.findById(req.body.userId);

//         if (!host) {
//             return res.status(404).json({ message: 'Host not found' });
//         }

//         if (host.role !== 'host') {
//             return res.status(401).json({ message: 'You are not authorized' });
//         }

//         const carsInfo = await Car.find({ carOwner: host._id });
//         console.log(carsInfo)

//         // Define pagination parameters
//         const page = Number(req.query.page) || 1;
//         const limit = Number(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         // Define search query parameters
//         const search = req.query.search || ''; // Search term


//         const searchRegExp = new RegExp('.*' + search + '.*', 'i');
//         const carQuery = {
//             $or: [
//                 { carModelName: { $regex: searchRegExp } },
//                 { carDescription: { $regex: searchRegExp } },
//                 { carColor: { $regex: searchRegExp } },
//                 { gearType: { $regex: searchRegExp } },
//             ]
//         };

//         // Find cars that match the search and pagination criteria
//         const cars = await Car.find({ carOwner: host._id })
//             .skip(skip)
//             .limit(limit);

//         // Count total matching cars for pagination
//         const totalCars = await Car.countDocuments({ carOwner: host._id });


//         const totalCar = totalCars;

//         // const reservedCar = await Rent.countDocuments({ payment: "Completed" });
//         const reservedCar = await Rent.countDocuments({
//             carId: { $in: cars.map(car => car._id) }, // Filter by the cars retrieved for the host
//             payment: 'Completed', // Adjust this condition based on your reservation status criteria
//         });


//         const activeCar = totalCar - reservedCar

//         return res.status(200).json({
//             message: 'Host Cars retrieved successfully',
//             totalCar,
//             activeCar,
//             reservedCar,
//             cars,
//             pagination: {
//                 totalDocuments: totalCars,
//                 totalPage: Math.ceil(totalCars / limit),
//                 currentPage: page,
//                 previousPage: page > 1 ? page - 1 : null,
//                 nextPage: page < Math.ceil(totalCars / limit) ? page + 1 : null,
//             },
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Error retrieving host cars' });
//     }
// };

const allHostCars = async (req, res) => {
    try {
        const host = await User.findById(req.body.userId);

        if (!host) {
            return res.status(404).json({ message: 'Host not found' });
        }

        if (host.role !== 'host') {
            return res.status(401).json({ message: 'You are not authorized' });
        }

        // Define pagination parameters
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Define search query parameters
        const search = req.query.search || ''; // Search term
        const makeFilter = req.query.make || ''; // Make filter
        const modelFilter = req.query.model || ''; // Model filter

        const searchRegExp = new RegExp('.*' + search + '.*', 'i');
        const carQuery = {
            carOwner: host._id, // Filter by the host user's ID
            $or: [
                { carModelName: { $regex: searchRegExp } },
                { carDescription: { $regex: searchRegExp } },
                { carColor: { $regex: searchRegExp } },
                { gearType: { $regex: searchRegExp } },
            ]
        };

        // Apply additional filters if provided
        if (makeFilter) {
            carQuery.carMake = makeFilter;
        }

        if (modelFilter) {
            carQuery.carModel = modelFilter;
        }

        // Find cars that match the search and pagination criteria
        const cars = await Car.find(carQuery)
            .skip(skip)
            .limit(limit);

        // Count total matching cars for pagination
        const totalCars = await Car.countDocuments(carQuery);

        const totalCar = totalCars;

        // const reservedCar = await Rent.countDocuments({ payment: "Completed" });
        const reservedCar = await Rent.countDocuments({
            carId: { $in: cars.map(car => car._id) }, // Filter by the cars retrieved for the host
            payment: 'Completed', // Adjust this condition based on your reservation status criteria
        });

        const activeCar = totalCar - reservedCar;

        return res.status(200).json({
            message: 'Host Cars retrieved successfully',
            totalCar,
            activeCar,
            reservedCar,
            cars,
            pagination: {
                totalDocuments: totalCars,
                totalPage: Math.ceil(totalCars / limit),
                currentPage: page,
                previousPage: page > 1 ? page - 1 : null,
                nextPage: page < Math.ceil(totalCars / limit) ? page + 1 : null,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error retrieving host cars' });
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
        const userAdmin = await User.findById(req.body.userId);
        console.log(userAdmin)
        const user = await User.findById(id);

        if (!userAdmin) {
            return res.status(404).json({ message: 'Your are not authorized' });
        }

        if (userAdmin === 'admin' || userAdmin === 'host') {
            return res.status(404).json({ message: 'Your are not authorized' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else {
            await user.deleteOne(); // No need to call save after deleteOne
            res.status(200).json({ message: 'User deleted successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting car' });
    }
};



module.exports = { createCar, allCars, getCarsById, updateById, deleteById, allHostCars }
