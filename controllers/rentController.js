const Rent = require("../models/Rent");
const User = require("../models/User");
const Car = require("../models/Car");
const { updateById } = require("./carController");
const Payment = require("../models/Payment");
const { payment } = require("./paymentController");

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

        const timeDiff = toDate - fromDate;

        const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
        const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`Total hours: ${totalHours} hours and ${totalMinutes} minutes`);

        const totalAmount = Number(hourlyRate) * totalHours
        console.log(totalAmount);

        if (!user) {
            res.status(404).json({ message: 'You do not have permission to' });
        }

        if (user.role !== "user") {
            res.status(401).json({ message: "Invalid role" });
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
            startDate,
            endDate,
            userId: user._id,
            carId,
            hostId: car.carOwner
        })

        res.status(200).json({ message: 'Rent request successful', rents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating car", error: error })
    }
};

const acceptRentRequest = async (req, res) => {
    try {
        const rentRequest = await Rent.findOne({ _id: req.params.requestId });
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

        rentRequest.requestStatus = 'Accepted';
        await rentRequest.save();
        res.status(200).json({ message: 'Request accepted' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error accepting rent request', error: error });
    }
};

const allRentRequest = async (req, res) => {
    try {
        const searchTerm = req.params.filter;
        const search = req.query.search || '';
        console.log(search);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchRegExp = new RegExp('.*' + search, 'i');
        const filter = {
            $or: [
                { requestStatus: { $regex: searchRegExp } },
                { totalAmount: { $regex: searchRegExp } },
            ],
        };

        const rents = await Rent.find(filter)
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('carId', '')
            .populate('userId', '')
            .sort({ createdAt: -1 });
        const count = await Rent.countDocuments(filter);

        const user = await User.findById(req.body.userId);

        // Today Rent
        const today = new Date();
        const todayRents = rents.filter(rents => {
            // Assuming the rent object has a date field like 'rentDate'
            const rentDate = new Date(rents.createdAt);
            // Check if the rent date matches the current date
            return (
                rentDate.getDate() === today.getDate() &&
                rentDate.getMonth() === today.getMonth() &&
                rentDate.getFullYear() === today.getFullYear()
            );
        });

        const rentsByHour = {};

        todayRents.forEach(rent => {
            const rentDate = new Date(rent.createdAt);
            const hour = rentDate.getHours();
            if (!rentsByHour[hour]) {
                rentsByHour[hour] = 1;
            } else {
                rentsByHour[hour]++;
            }
        });

        console.log(rentsByHour)


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
            const rentRequest = await Rent.find({ hostId: req.body.userId });
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
            const userWiseRent = await Rent.find({ userId: user._id, ...filter }).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 });
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

const getRentById = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id);

        const rents = await Rent.findById(id);

        if (!rents) {
            res.status(404).json({ message: 'Rent Request is not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            res.status(404).json({ message: 'User is not found' });
        }

        if (rents.userId.toString() !== req.body.userId) {
            res.status(404).json({ message: "User Not Matching" })
        }

        if (user.role === 'host') {
            res.status(404).json({
                message: "You do not have permission to"
            })
        }

        res.status(200).json({
            message: "Rent retrieved successfully",
            rents: rents
        })
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        })
        console.log(err)
    }
}

const updateRentById = async (req, res) => {
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
        res.status(500).json({
            message: err.message
        })
    }
}

const deleteRentById = async (req, res) => {
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
        console.error(err);
        res.status(500).json({ message: 'Error deleting Rent' });
    }
};

// const startTrip = async (req, res) => {
//     try {
//         const { startDate, endDate, tripStatus } = req.body;
//         console.log(startDate, endDate);

//         const { carId } = req.params;

//         const user = await User.findById(req.body.userId);
//         const car = await Car.findById(req.params.carId);

//         const hourlyRate = car.hourlyRate;

//         const fromDate = new Date(startDate);
//         const toDate = new Date(endDate);

//         const timeDiff = toDate - fromDate;

//         const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
//         const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));


//         const totalAmount = Number(hourlyRate) * totalHours

//         if (!user) {
//             res.status(404).json({ message: 'You do not have permission to' });
//         }

//         if (user.role !== "user") {
//             res.status(401).json({ message: "Invalid role" });
//         }

//         const rentRequest = await Rent.findOne({ userId: user._id });
//         console.log("rentRequest", rentRequest);

//         if (!rentRequest) {
//             return res.status(404).json({ message: 'Request is not found for Start Trip' });
//         }

//         if (req.body.userId !== rentRequest.userId.toString() && rentRequest.requestStatus !== "Accepted") {
//             return res.status(401).json({ message: 'You cannot start trip on this car' });
//         }

//         if (rentRequest.payment !== "Completed") {
//             return res.status(401).json({ message: 'Your payment is not Completed' });
//         }

//         car.tripStatus = tripStatus;

//         await car.save()

//         res.status(200).json({ message: `Trip ${tripStatus}`, car });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Error creating car", error: error })
//     }
// };

const startTrip = async (req, res) => {
    const requestId = req.params.requestId;
    try {

        const { tripStatus } = req.body;

        const user = await User.findById(req.body.userId);
        const rent = await Rent.findOne({ _id: requestId });

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
        await car.save();

        res.status(200).json({ message: `Trip ${tripStatus} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error starting trip' });
    }
};




module.exports = { createRentRequest, acceptRentRequest, allRentRequest, getRentById, updateRentById, deleteRentById, startTrip };