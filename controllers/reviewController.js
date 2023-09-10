const About = require("../models/About");
const Rent = require("../models/Rent");
const Review = require("../models/Review");
const User = require("../models/User");

const createOrUpdate = async (req, res) => {
    try {
        // const user = req.body.userId;
        const { rating, comment } = req.body;
        const rent = await Rent.findById(req.params.requestId);

        if (Number(rating) > 5) {
            return res.status(201).json({ message: 'Review Rating Must be 5*' });
        }

        if (comment.length >= 20) {
            return res.status(201).json({ message: 'Review Comment Must be 20 Char' });
        }

        if (rent.userId.toString() === req.body.userId.toString()) {
            if (rent.requestStatus === "Completed") {
                const review = await Review.create({
                    userId: req.body.userId,
                    hostId: rent.hostId,
                    rating: Number(rating),
                    comment: comment
                })

                return res.status(201).json({ message: 'Review created successfully', review: review });
            }
        }

        else if (rent.hostId.toString() === req.body.userId.toString()) {
            if (rent.requestStatus === "Completed") {
                const review = await Review.create({
                    hostId: req.body.userId,
                    userId: rent.userId,
                    rating: rating,
                    comment: comment
                })

                return res.status(201).json({ message: 'Review created successfully', review: review });
            }
        }
        else {
            return res.status(401).json({ message: "You can not review this car" });
        }


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating review' });
    }
};

const getAll = async (req, res) => {

    try {
        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'host') {
            return res.status(404).json({ message: 'You are not Authorization' });
        }


        const review = await Review.find({ hostId: user._id }).populate('hostId', '').populate('userId', '')
        return res.status(200).json({ message: 'Review retrieved successfully', review });



    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: 'Server error' });
    }
};



module.exports = { createOrUpdate, getAll };