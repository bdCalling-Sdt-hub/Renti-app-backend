const Car = require("../models/Car");
const jwt = require('jsonwebtoken');
const User = require("../models/User");
const Rent = require("../models/Rent");
const Card = require("../models/Card");


//Add car
const createCard = async (req, res, next) => {
    try {
        const { accountHolderName, phoneNumber, email, bankAccountNumber } = req.body;

        // // Find the user
        const user = await User.findById(req.body.userId);
        console.log(user)


        if (!user) {
            res.status(404).json({ message: "User not found" });
        } else if (user.role === 'host' || user.role === 'admin') {
            const card = await Card.create({
                accountHolderName,
                phoneNumber,
                email,
                bankAccountNumber,
                addedBy: user._id
            });
            res.status(201).json({ message: 'Card created successfully', card });
        } else {
            res.status(501).json({ message: "You are not authorized" });
        }

    } catch (error) {
        next(error)
    }
};

//All cars seen by user and admin
const allCard = async (req, res, next) => {
    try {

        const user = await User.findById(req.body.userId);

        const card = await Card.find({ addedBy: user._id });
        if (!card) {
            res.status(404).json({ message: 'Card not found' });
        }

        if (!user) {
            res.status(404).json({ message: 'User not found' });
        } else if (user.role === 'host' || user.role === 'admin') {
            res.status(200).json({
                message: "Card Retrived Successfull",
                card,
            });
        } else {
            res.status(501).json({ message: 'You are not authorized' });
        }

    } catch (error) {
        next(error)
    }
};

module.exports = { createCard, allCard }