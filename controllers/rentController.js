const Rent = require("../models/Rent");
const User = require("../models/User");
const Car = require("../models/Car");
const { updateById } = require("./carController");
const Payment = require("../models/Payment");
const { payment } = require("./paymentController");

const createRentRequest = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.body;
        console.log(startDate, endDate);

        const { carId } = req.params;

        const user = await User.findById(req.body.userId);
        const car = await Car.findById(req.params.carId);
        console.log("Car", car);
        console.log("User", user);

        const hourlyRate = car.hourlyRate;

        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);

        const timeDiff = toDate - fromDate;

        const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
        const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`Total hours: ${totalHours} hours and ${totalMinutes} minutes`);

        const totalAmount = Number(hourlyRate) * totalHours
        // console.log(totalAmount);

        if (!user) {
            return res.status(404).json({ message: 'You do not have permission to' });
        }

        if (user.role !== "user") {
            return res.status(401).json({ message: "Invalid role" });
        }

        function generateUniqueFourDigitNumber() {
            const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

            // Shuffle the digits randomly
            for (let i = digits.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [digits[i], digits[j]] = [digits[j], digits[i]];
            }

            // Take the first 4 digits and join them
            const uniqueNumber = digits.slice(0, 4).join('');

            return uniqueNumber;
        }

        // Generate a unique 4-digit number
        const randomFourDigitNumber = generateUniqueFourDigitNumber();

        // Combine the random number with the "RENT-" prefix
        const rentTripNumber = `RENT-${randomFourDigitNumber}`;

        const rents = await Rent.create({
            rentTripNumber,
            totalAmount,
            totalHours,
            startDate,
            endDate,
            userId: user,
            carId: car,
            hostId: car.carOwner,
        })

        car.popularity += 1;
        await car.save();

        res.status(200).json({ message: 'Rent request successful', rents });
    } catch (error) {
        // next(error)
        console.log(error.message);
    }
};

const userCancelRentRequest = async (req, res, next) => {
    try {
        const rentRequest = await Rent.findOne({ _id: req.params.requestId });

        const car = await Car.findOne({ _id: rentRequest.carId });

        if (!rentRequest) {
            res.status(404).json({ message: 'Request not found' })
        }

        if (!car) {
            res.status(404).json({ message: 'Car not found' });
        }


        rentRequest.sentRequest = 'Cancel';
        await rentRequest.save();
        return res.status(200).json({ message: 'Request Cancel' });



    } catch (error) {
        next(error)
    }
}

const acceptRentRequest = async (req, res, next) => {
    try {
        const rentRequest = await Rent.findOne({ _id: req.params.requestId });

        const { request } = req.body;

        if (!request) {
            res.status(404).json({ message: 'Please send rent request status Ex: Accepted or Rejected' })
        }

        const car = await Car.findOne({ _id: rentRequest.carId });

        if (!rentRequest) {
            res.status(404).json({ message: 'Request not found' })
        }

        if (!car) {
            res.status(404).json({ message: 'Car not found' });
        }

        if (car.carOwner.toString() !== req.body.userId) {
            res.status(401).json({ message: 'You do not have permission' })
        }

        if (request === 'Accepted') {
            rentRequest.requestStatus = 'Accepted';
            await rentRequest.save();
            return res.status(200).json({ message: 'Request Accepted' });
        }

        if (request === 'Rejected') {
            rentRequest.requestStatus = 'Rejected';
            await rentRequest.save();
            return res.status(200).json({ message: 'Request Rejected' });
        }



    } catch (error) {
        next(error)
    }
};

const allRentRequest = async (req, res, next) => {
    try {
        const searchTerm = req.params.filter;
        const search = req.query.search || '';
        console.log(search);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchRegExp = new RegExp('.*' + search, 'i');
        const filter = {
            $or: [
                { rentTripNumber: { $regex: searchRegExp } },
                { totalAmount: { $regex: searchRegExp } },
            ],
        };

        const rents = await Rent.find(filter)
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('carId', '')
            .populate('userId', '')
            .populate('hostId', '')
            .sort({ createdAt: -1 });
        const count = await Rent.countDocuments(filter);

        const user = await User.findById(req.body.userId);

        // Today Rent
        // const today = new Date();
        // const todayRents = rents.filter(rents => {
        //     // Assuming the rent object has a date field like 'rentDate'
        //     const rentDate = new Date(rents.createdAt);
        //     // Check if the rent date matches the current date
        //     return (
        //         rentDate.getDate() === today.getDate() &&
        //         rentDate.getMonth() === today.getMonth() &&
        //         rentDate.getFullYear() === today.getFullYear()
        //     );
        // });

        // const rentsByHour = {};

        // todayRents.forEach(rent => {
        //     const rentDate = new Date(rent.createdAt);
        //     const hour = rentDate.getHours();
        //     if (!rentsByHour[hour]) {
        //         rentsByHour[hour] = 1;
        //     } else {
        //         rentsByHour[hour]++;
        //     }
        // });

        // console.log("rentsByHour",rentsByHour)


        const today = new Date();
        const todayRents = rents.filter(rent => {
            const rentDate = new Date(rent.createdAt);
            return (
                rentDate.getDate() === today.getDate() &&
                rentDate.getMonth() === today.getMonth() &&
                rentDate.getFullYear() === today.getFullYear()
            );
        });

        const rentsByHour = Array(24).fill(0); // Initialize an array to count rents for each hour

        todayRents.forEach(rent => {
            const rentDate = new Date(rent.createdAt);
            const hour = rentDate.getHours();
            rentsByHour[hour]++; // Increment the count for the corresponding hour
        });

        console.log("rentsByHour", rentsByHour);

        // Renti Information
        const rentRejected = await Rent.find({ requestStatus: "Rejected" })
        if (!rentRejected) {
            return res.status(400).json({ message: "Renti Canceled not found" })
        }

        const totalRejectedAmount = rentRejected.reduce((total, rent) => total + Number(rent.totalAmount), 0);

        // Rent Reserved ----Start
        const reservedCars = await Car.find({ tripStatus: "Start" })

        if (!reservedCars) {
            return res.status(401).json({ message: "Rents Reserved Amount is not found" })
        }
        const carPaymentIds = reservedCars.map(car => car.paymentId);

        const paymentData = await Payment.find({ _id: { $in: carPaymentIds } });

        const rentReservedTotalAmount = paymentData.reduce((total, payment) => total + payment.paymentData.amount, 0);


        // Rent Complete
        const completedCars = await Car.find({ tripStatus: "End" })

        if (!completedCars) {
            return res.status(401).json({ message: "Rents Completed Amount is not found" })
        }
        const carCompletedPaymentIds = completedCars.map(car => car.paymentId);

        const completedPaymentData = await Payment.find({ _id: { $in: carCompletedPaymentIds } });

        const rentCompletedTotalAmount = completedPaymentData.reduce((total, payment) => total + payment.paymentData.amount, 0);


        if (!user) {
            return res.status(404).json({ message: 'User is not found' });
        }
        console.log(req.body.userId);
        if (user.role === 'host') {
            const rentRequest = await Rent.find({ hostId: req.body.userId }).populate('carId').populate('userId').populate('hostId').sort({ createdAt: -1 });
            // console.log(rentRequest);
            return res.status(200).json({
                message: "Your rent request", rentRequest
            });
        }

        if (user.role === 'admin') {
            return res.status(200).json({
                rentsByHour,
                rentCompletedTotalAmount,
                rentReservedTotalAmount,
                totalRejectedAmount,
                // todayRents,
                rents,
                pagination: {
                    totalDocuments: count,
                    totalPage: Math.ceil(count / limit),
                    currentPage: page,
                    previousPage: page - 1 > 0 ? page - 1 : null,
                    nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null
                }
            });
        }

        if (user.role === 'user') {
            const userWiseRent = await Rent.find({ userId: user._id, ...filter }).limit(limit).skip((page - 1) * limit).populate('carId').populate('userId').populate('hostId').sort({ createdAt: -1 });
            const userCount = await Rent.countDocuments({ userId: user._id, ...filter });
            return res.status(200).json({
                userWiseRent,
                pagination: {
                    totalDocuments: userCount,
                    totalPage: Math.ceil(userCount / limit),
                    currentPage: page,
                    previousPage: page - 1 > 0 ? page - 1 : null,
                    nextPage: page + 1 <= Math.ceil(userCount / limit) ? page + 1 : null
                }
            });
        }

        return res.status(501).json({ message: 'You are not authorized' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: err.message
        });
    }
};

const getRentById = async (req, res, next) => {
    try {
        const id = req.params.id;
        console.log("Get Rent Id Error", id);

        const rents = await Rent.findById(id).populate("carId").populate("hostId");

        if (!rents) {
            return res.status(404).json({ message: 'Rent Request is not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            return res.status(404).json({ message: 'User is not found' });
        }

        if (rents.userId.toString() !== req.body.userId) {
            return res.status(404).json({ message: "User Not Matching" })
        }

        if (user.role === 'host') {
            return res.status(404).json({
                message: "You do not have permission to"
            })
        }

        res.status(200).json({
            message: "Rent retrieved successfully",
            rents: rents
        })

        throw new Error(`processing error in request `)
    }
    catch (err) {
        next(err)
    }
}

const updateRentById = async (req, res, next) => {
    try {
        const id = req.params.id;

        const rents = await Rent.findById(id);

        const car = await Car.findById(rents.carId);

        const user = await User.findById(req.body.userId)

        const hourlyRate = car.hourlyRate;

        const fromDate = new Date(req.body.startDate);
        const toDate = new Date(req.body.endDate);

        const timeDiff = toDate - fromDate;

        const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
        const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        const updateTotalAmount = Number(hourlyRate) * totalHours


        if (!rents) {
            res.status(404).json({ message: "Rents is not found" })
        }

        if (!user) {
            res.status(404).json({ message: 'User is not found' });
        }

        if (rents.userId.toString() !== req.body.userId) {
            res.status(404).json({ message: "User Not Matching" })
        }

        if (user.role === 'host') {
            res.status(404).json({
                message: "You do not have permission to update this"
            })
        }

        const document = {
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            totalAmount: updateTotalAmount
        };

        const options = { new: true };

        const rent = await Rent.findByIdAndUpdate(id, document, options);
        res.status(200).json({
            message: "Rent Request update successful",
            rent
        })
    }
    catch (err) {
        next(error)
    }
}

const deleteRentById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findById(req.body.userId);
        const rent = await Rent.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        } else if (user._id.equals(rent.userId)) {
            await rent.deleteOne();
            res.status(200).json({ message: 'Rent deleted successfully' });
        } else {
            res.status(403).json({ message: 'You are not authorized to delete this Rent' });
        }
    } catch (err) {
        next(error)
    }
};

const startTrip = async (req, res, next) => {
    const requestId = req.params.requestId;
    try {

        const { tripStatus, carImage } = req.body;

        const kycFileNames = [];

        if (req.files && req.files.carImage) {
            req.files.carImage.forEach((file) => {
                const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${file.filename}`;
                kycFileNames.push(publicFileUrl);
            });
        }

        console.log(kycFileNames)

        const user = await User.findById(req.body.userId);
        const rent = await Rent.findOne({ _id: requestId });
        console.log(rent)

        if (!rent) {
            return res.status(404).json({ message: 'Rent request not found' });
        }

        if (user._id.toString() !== rent.userId.toString()) {
            return res.status(401).json({ message: 'You cannot start a trip for this car' });
        }

        if (rent.requestStatus !== 'Accepted') {
            return res.status(401).json({ message: 'Your rent request is not accepted' });
        }

        if (rent.payment !== 'Completed') {
            return res.status(401).json({ message: 'Your payment is not completed' });
        }

        const car = await Car.findById(rent.carId);

        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }



        car.tripStatus = tripStatus;
        car.carImage = kycFileNames;
        car.userId = user._id;
        await car.save();


        if (tripStatus === "End") {
            rent.requestStatus = 'Completed'; // Use the assignment operator (=) here
            await rent.save();
        }




        res.status(200).json({ message: `Trip ${tripStatus} successfully` });
    } catch (error) {
        next(error)
    }
};

const hostRentList = async (req, res, next) => {

    try {
        const user = await User.findById(req.body.userId);
        console.log(user)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'host') {
            return res.status(403).json({ message: 'You are not authorized' });
        }

        // Find cars owned by the host user
        const ownedCars = await Car.find({ carOwner: user._id });

        // Find cars rented by the host user
        const rentedCars = await Rent.find({ hostId: user._id });
        // console.log(rentedCars)

        return res.status(200).json({
            message: 'Host user car and rented car lists retrieved successfully',
            // ownedCars,
            rentedCars,
        });
    } catch (error) {
        next(error)
    }
};

const gethostRentById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const host = await Rent.findById(id);
        console.log(host)
        if (!host) {
            res.status(404).json({ message: 'User not found', error });
        }
        console.log("ggg", host);
        console.log(req.body.userId);

        const rent = await Rent.findOne({ _id: host._id }).populate('userId').populate('carId');
        console.log("gfyhusedgiyh", rent.userId)

        if (!rent) {
            res.status(404).json({ message: 'User Not Found' })
        }
        res.status(200).json({
            message: "User retrieved successfully",
            userDetails: rent
        })
    } catch (error) {
        next(error)
    }
};




module.exports = { createRentRequest, userCancelRentRequest, acceptRentRequest, allRentRequest, getRentById, updateRentById, deleteRentById, startTrip, hostRentList, gethostRentById };