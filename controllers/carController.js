const Car = require("../models/Car");
const jwt = require('jsonwebtoken');
const { createCarService, getCarsService, getById, update, remove, getsSearchByName } = require("../services/CarService");
const User = require("../models/User");
const Rent = require("../models/Rent");
const { addNotification, getAllNotification } = require("./notificationController");


//Add car
const createCar = async (req, res, next) => {
    try {
        const { carModelName, hourlyRate, offerHourlyRate, image, year, carType, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType, registrationDate, specialCharacteristics } = req.body;

        // // Find the user
        const user = await User.findById(req.body.userId);


        const kycFileNames = [];

        if (req.files && req.files.KYC) {
            req.files.KYC.forEach((file) => {
                const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/kyc/${file.filename}`;
                kycFileNames.push(publicFileUrl);
            });
        }

        const publicImageUrl = [];

        if (req.files && req.files.image) {
            req.files.image.forEach((file) => {
                const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${file.filename}`;
                publicImageUrl.push(publicFileUrl);
            });
        }

        if (!user) {
            res.status(404).json({ message: "User not found" });
        } else if (user.role === 'host') {
            // Create the user in the database

            // const publicImageUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${req.files.image[0].filename}`;

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
                specialCharacteristics,
                totalRun,
                hourlyRate,
                offerHourlyRate,
                gearType,
                carType,
                registrationDate,
                carOwner: user,
            });


            const message = user.fullName + ' Create ' + carModelName
            const newNotification = {
                message: message,
                image: user.image,
                linkId: car._id,
                type: 'admin'
            }
            await addNotification(newNotification)
            const adminNotification = await getAllNotification('admin')
            io.emit('admin-notification', adminNotification);
            // io.emit('create', newNotification);

            res.status(201).json({ message: 'Car created successfully', car });
        } else {
            res.status(401).json({ message: "You are not authorized" });
        }

    } catch (error) {
        next(error)
        // console.log(error.message)
    }
};

//All cars seen by user and admin
const allCars = async (req, res, next) => {
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

        // const reservedCar = await Rent.countDocuments({ tripStatus: "Completed" });
        const reservedCar = await Car.countDocuments({ tripStatus: "Start" });

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
        next(error)
    }
};

const luxuryCars = async (req, res, next) => {
    try {
        //Search the users
        const userTypes = req.params.filter;
        const search = req.query.search || '';
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchRegExp = new RegExp('.*' + search + '.*', 'i');
        const filter = {
            $and: [ // Use $and to combine multiple conditions
                {
                    $or: [
                        { carModelName: { $regex: searchRegExp } },
                        { carDescription: { $regex: searchRegExp } },
                        { carColor: { $regex: searchRegExp } },
                        { gearType: { $regex: searchRegExp } },
                    ]
                },
                { carType: "Luxury" } // Filter luxury cars
            ]
        };
        const perMittedUser = await User.findById(req.body.userId);
        const luxuryCars = await Car.find(filter).limit(limit).skip((page - 1) * limit).populate('carOwner', '').sort({ popularity: -1 });
        const count = await Car.countDocuments(filter);


        const user = await User.findById(req.body.userId);
        if (!luxuryCars) {
            res.status(404).json({ message: 'Car not found' });
        }

        if (!user) {
            res.status(404).json({ message: 'User not found' });
        } else if (perMittedUser.role === 'admin' || perMittedUser.role === 'user') {
            res.status(200).json({
                message: "Luxury Car Retrieved Successfully",
                luxuryCars,
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
        next(error)
    }
};


// Offer car
const offerCars = async (req, res, next) => {
    try {
        //Search the users
        const userTypes = req.params.filter;
        const search = req.query.search || '';
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchRegExp = new RegExp('.*' + search + '.*', 'i');

        // Define the filter for searching cars
        const filter = {
            $and: [ // Use $and to combine multiple conditions
                {
                    $or: [
                        { carModelName: { $regex: searchRegExp } },
                        { carDescription: { $regex: searchRegExp } },
                        { carColor: { $regex: searchRegExp } },
                        { gearType: { $regex: searchRegExp } },
                    ],
                },
                {
                    offerHourlyRate: { $lte: "hourlyRate" } // Compare offerHourlyRate to hourlyRate
                }
            ]
        };
        const perMittedUser = await User.findById(req.body.userId);
        const offerCars = await Car.find(filter).limit(limit).skip((page - 1) * limit).populate('carOwner', '');

        const count = await Car.countDocuments(filter);


        const user = await User.findById(req.body.userId);
        if (!offerCars) {
            res.status(404).json({ message: 'Offer Car not found' });
        }

        if (!user) {
            res.status(404).json({ message: 'User not found' });
        } else if (perMittedUser.role === 'admin' || perMittedUser.role === 'user') {
            res.status(200).json({
                message: "Offer Car Retrieved Successfully",
                offerCars,
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
        // next(error)
        console.log(error.message);
    }
};

//Single cars
const getCarsById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const car = await Car.findById(id).populate('carOwner', '');
        if (!car) {
            res.status(404).json({ message: 'Car not found', error });
        }

        res.status(200).json({
            message: "Car retrieved successfully",
            cars: car
        })

    }
    catch (error) {
        next(error)
    }
};

//All hoist car

// const allHostCars = async (req, res, next) => {
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

const allHostCars = async (req, res, next) => {
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
            .limit(limit)
            // .populate('paymentId');
            .populate({ path: 'paymentId', populate: { path: 'rentId userId' } });

        console.log("Hello Car", cars)




        // Count total matching cars for pagination
        const totalCars = await Car.countDocuments(carQuery);

        const totalCar = totalCars;

        // const reservedCar = cars.tripStatus === "Start";
        const reservedCar = cars.filter(car => car.tripStatus === "Start").length;

        // const reservedCar = await Rent.countDocuments({
        //     carId: { $in: cars.map(car => car._id) }, // Filter by the cars retrieved for the host
        //     payment: 'Completed', // Adjust this condition based on your reservation status criteria
        // });

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
        next(error)
    }
};

//Update car
// const updateById = async (req, res, next) => {
//     try {
//         const { carModelName, year, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType } = req.body;

//         const kycFileNames = [];

//         if (req.files && req.files.KYC) {
//             req.files.KYC.forEach((file) => {
//                 const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/kyc/${file.filename}`;
//                 kycFileNames.push(publicFileUrl);
//             });
//         }

//         const publicImageUrl = [];

//         if (req.files && req.files.image) {
//             req.files.image.forEach((file) => {
//                 const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${file.filename}`;
//                 publicImageUrl.push(publicFileUrl);
//             });
//         }

//         const car = await Car.findById(req.params.id);
//         const user = await User.findById(req.body.userId);

//         if (!user) {
//             res.status(404).json({ message: "User not found" });
//         }

//         if (!car) {
//             res.status(404).json({ message: "Car not found" });
//         } else if (user._id.equals(car.carOwner)) {
//             car.carModelName = carModelName;
//             car.image = publicImageUrl;
//             car.year = year;
//             car.carLicenseNumber = carLicenseNumber
//             car.carDescription = carDescription
//             car.insuranceStartDate = insuranceStartDate
//             car.insuranceEndDate = insuranceEndDate
//             car.carLicenseImage = carLicenseImage;
//             car.carColor = carColor;
//             car.carDoors = carDoors
//             car.carSeats = carSeats
//             car.totalRun = totalRun;
//             car.gearType = gearType;
//             car.KYC = kycFileNames;

//             await car.save();
//             res.status(200).json({ message: 'Car updated successfully' });
//         } else {
//             res.status(401).json({ message: 'You are not authorize to update' })
//         }

//     } catch (err) {
//         next(error)
//     }
// };

const updateById = async (req, res, next) => {
    try {
        const { carModelName, year, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType } = req.body;

        const kycFileNames = [];
        const publicImageUrl = [];

        if (req.files) {
            if (req.files.KYC) {
                req.files.KYC.forEach((file) => {
                    const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/kyc/${file.filename}`;
                    kycFileNames.push(publicFileUrl);
                });
            }

            if (req.files.image) {
                req.files.image.forEach((file) => {
                    const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${file.filename}`;
                    publicImageUrl.push(publicFileUrl);
                });
            }
        }

        const car = await Car.findById(req.params.id);
        const user = await User.findById(req.body.userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
        }

        if (!car) {
            res.status(404).json({ message: "Car not found" });
        } else if (user._id.equals(car.carOwner)) {
            if (carModelName) car.carModelName = carModelName;
            if (publicImageUrl.length > 0) car.image = publicImageUrl;
            if (year) car.year = year;
            if (carLicenseNumber) car.carLicenseNumber = carLicenseNumber;
            if (carDescription) car.carDescription = carDescription;
            if (insuranceStartDate) car.insuranceStartDate = insuranceStartDate;
            if (insuranceEndDate) car.insuranceEndDate = insuranceEndDate;
            if (carLicenseImage) car.carLicenseImage = carLicenseImage;
            if (carColor) car.carColor = carColor;
            if (carDoors) car.carDoors = carDoors;
            if (carSeats) car.carSeats = carSeats;
            if (totalRun) car.totalRun = totalRun;
            if (gearType) car.gearType = gearType;
            if (kycFileNames.length > 0) car.KYC = kycFileNames;

            await car.save();
            res.status(200).json({ message: 'Car updated successfully' });
        } else {
            res.status(401).json({ message: 'You are not authorized to update' });
        }
    } catch (error) {
        next(error);
    }
};



// Delete car by owner
const deleteById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userAdmin = await User.findById(req.body.userId);
        console.log(userAdmin)
        const car = await Car.findById(id);

        if (!userAdmin) {
            return res.status(404).json({ message: 'Your are not authorized' });
        }

        if (userAdmin === 'admin' || userAdmin === 'host') {
            return res.status(404).json({ message: 'Your are not authorized' });
        }

        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        } else {
            await car.deleteOne(); // No need to call save after deleteOne
            res.status(200).json({ message: 'CAr deleted successfully' });
        }
    } catch (err) {
        next(error)
    }
};



module.exports = { createCar, allCars, getCarsById, updateById, deleteById, allHostCars, offerCars, luxuryCars }
