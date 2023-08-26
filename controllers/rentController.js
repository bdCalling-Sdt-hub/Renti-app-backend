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

        if (!user) {
            res.status(404).json({ message: 'You do not have permission to' });
        }

        if (user.role !== "user") {
            res.status(401).json({ message: "Invalid role" });
        }

        const rents = await Rent.create({
            totalAmount,
            startDate,
            endDate,
            userId: user._id,
            carId
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
        res.status(500).json({ message: 'Error accepting rent request', error: error });
    }
};

const allRentRequest = async (req, res) => {
    try {

        const searchTerm = req.params.filter;
        const search = req.query.search || '';
        console.log(search)
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const searchRegExp = new RegExp('.*' + search, 'i');

        const filter = {
            $or: [
                { requestStatus: { $regex: searchRegExp } },
                { totalAmount: { $regex: searchRegExp } },
            ],
        };

        const rents = await Rent.find(filter).limit(limit).skip((page - 1) * limit);
        console.log("rents", rents)
        const count = await Rent.countDocuments(filter)

        if (!rents) {
            res.status(404).json({ message: 'Rent Request is not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            res.status(404).json({ message: 'User is not found' });
        }

        if (user.role === 'host') {
            res.status(404).json({
                message: "You do not have permission to"
            })
        }

        if (user.role === 'admin') {
            res.status(200).json({
                rents,
                pagination: {
                    totalDocuments: count,
                    totalPage: Math.ceil(count / limit),
                    currentPage: page,
                    previousPage: page - 1 > 0 ? page - 1 : null,
                    nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null
                }
            })
        }

        if (user.role === 'user') {
            const userWiseRent = await Rent.find({ userId: user._id, ...filter }).limit(limit).skip((page - 1) * limit)
            const count = await Rent.countDocuments({
                userId: user._id,
                ...filter
            })
            res.status(200).json({
                userWiseRent,
                pagination: {
                    totalDocuments: count,
                    totalPage: Math.ceil(count / limit),
                    currentPage: page,
                    previousPage: page - 1 > 0 ? page - 1 : null,
                    nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null
                }
            });
        }
        else {
            res.status(501).json({ message: 'You are not authorized' });
        }

    }
    catch (err) {
        res.status(500).json({
            message: err.message
        }
        )
    }
}

const getRentById = async (req, res) => {
    try {
        const id = req.params.id;
        const rents = await Rent.findById(id);
        console.log(rents)
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



module.exports = { createRentRequest, acceptRentRequest, allRentRequest, getRentById };