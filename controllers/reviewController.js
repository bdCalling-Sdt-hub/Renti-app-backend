const About = require("../models/About");
const Car = require("../models/Car");
const Rent = require("../models/Rent");
const Review = require("../models/Review");
const User = require("../models/User");

const createOrUpdate = async (req, res, next) => {
    try {

        // const user = req.body.userId;
        const { rating, comment } = req.body;
        const rent = await Rent.findById(req.params.requestId);
        console.log("a", rent.carId)



        if (Number(rating) > 5) {
            return res.status(201).json({ message: 'Review Rating Must be 5*' });
        }

        if (comment.length >= 20) {
            return res.status(201).json({ message: 'Review Comment Must be 20 Char' });
        }

        // User to car rating
        if (rent.userId.toString() === req.body.userId.toString()) {
            console.log(rent.requestStatus === "Completed")
            if (rent.requestStatus === "Completed") {
                const review = await Review.create({
                    userId: req.body.userId,
                    // hostId: rent.hostId,
                    reviewer: 'user',
                    carId: rent.carId,
                    rating: Number(rating),
                    comment: comment
                })

                const countRatings = await Review.countDocuments();

                const carRatings = await Review.find({ userId: req.body.userId, reviewer: 'user' });
                const ratings = carRatings.map(review => review.rating);
                const totalRating = ratings.reduce((total, rating) => total + rating, 0);
                const averageRatings = totalRating / countRatings;



                // console.log(countRatings);
                const car = await Car.findById(rent.carId);
                console.log(' ', car);
                car.averageRatings = averageRatings;
                await car.save();

                return res.status(201).json({ message: 'Review created successfully', review: review });
            }
        }

        // Host
        else if (rent.hostId.toString() === req.body.userId.toString()) {
            if (rent.requestStatus === "Completed") {
                const review = await Review.create({
                    hostId: req.body.userId,
                    userId: rent.userId,
                    carId: rent.carId,
                    reviewer: 'host',
                    rating: Number(rating),
                    comment: comment
                })

                const countRatings = await Review.countDocuments();

                const carRatings = await Review.find({ hostId: req.body.userId, reviewer: 'host' });
                console.log("car rating", carRatings)
                const ratings = carRatings.map(review => review.rating);
                const totalRating = ratings.reduce((total, rating) => total + rating, 0);
                const averageRatings = totalRating / countRatings;



                console.log(averageRatings);
                const user = await User.findById(rent.userId);
                // console.log('meowwwwwwwwwwwwwwwwwwwwww', user);
                user.averageRatings = averageRatings;
                await user.save();

                return res.status(201).json({ message: 'Review created successfully', review: review });
            }
        }
        else {
            return res.status(401).json({ message: "You can not review this car" });
        }



    } catch (error) {
        console.log(error.message)
        // next(error)
    }
};

const getHostReview = async (req, res, next) => {

    try {
        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'host') {
            return res.status(404).json({ message: 'You are not Authorization' });
        }


        const review = await Review.find({ reviewer: 'host' }).populate('hostId', '').populate('userId', '').populate('carId', '')
        return res.status(200).json({ message: 'Review retrieved successfully', review });



    } catch (error) {
        next(error)
    }
};


const getUserReview = async (req, res, next) => {

    try {
        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'user') {
            return res.status(404).json({ message: 'You are not Authorization' });
        }


        const review = await Review.find({ reviewer: 'user' }).populate('hostId', '').populate('userId', '').populate('carId', '')
        return res.status(200).json({ message: 'Review retrieved successfully', review });



    } catch (error) {
        next(error)
    }
};



module.exports = { createOrUpdate, getHostReview, getUserReview };