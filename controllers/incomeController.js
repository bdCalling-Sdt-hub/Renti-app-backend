const { default: mongoose } = require("mongoose");
const Car = require("../models/Car");
const Payment = require("../models/Payment");
const Income = require("../models/Income");
const User = require("../models/User");
const Rent = require("../models/Rent");

const hostPayment = async (req, res) => {
    try {

        const carInfo = await Car.find({});

        const paymentList = await Payment.find({})

        if (!paymentList || paymentList.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        const paymentAmounts = await Payment.find({ payout: false }).select('paymentData.amount');  //Total Pending
        const payoutAmounts = await Payment.find({ payout: true }).select('paymentData.amount');   //Total Payment

        const totalPayoutAmounts = payoutAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0);
        const totalPaymentAmounts = paymentAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0);

        const rentiTotal = (totalPayoutAmounts / 100) * 25;
        const hostPayment = totalPayoutAmounts - rentiTotal;

        let hostTotalPercentage = (hostPayment / totalPaymentAmounts) * 100;

        let hostPendingPercentage = (hostPayment / totalPayoutAmounts) * 100;

        const income = await Income.create({
            hostTotalPending: totalPaymentAmounts,
            hostTotalPayment: hostPayment,
            hostTotalPercentage,
            hostPendingPercentage
        })

        res.status(200).json({
            message: "Payment Retrieve Successfully",
            income
        })



    } catch (error) {
        res.status(500).json({

            message: "Payment Retrieve Failure"
        })
        console.log(error)
    }
};

const hostPaymentList = async (req, res) => {
    try {
        const payments = await Payment.find({}); // Fetch all payments
        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }
        // Calculate the total sum of all payment amounts
        const totalPayment = payments.reduce((sum, payment) => sum + payment.paymentData.amount, 0);

        // Calculate 25% of the totalPayment
        const twentyFivePercent = totalPayment * 0.25;

        const hostPaymentList = [];

        // Fetch carOwner information for each payment
        for (const payment of payments) {
            const carId = payment.carId;
            const car = await Car.findOne({ _id: carId }); // Assuming your Car collection has _id field
            if (car) {
                const user = await User.findOne({ _id: car.carOwner, role: 'host' });
                // Assuming your User collection has _id field and Car has carOwner field
                if (user) {
                    const modifiedAmount = payment.paymentData.amount - (payment.paymentData.amount * 0.25);
                    hostPaymentList.push({
                        status: payment.payout,
                        carOwner: user.fullName,
                        originalAmount: payment.paymentData.amount,
                        modifiedAmount: modifiedAmount
                    });
                }
            }
        }

        res.status(200).json({
            message: "Payment Retrieved Successfully",
            hostPaymentList
        })

    } catch (error) {
        console.error(error);
    }
};


const userPaymentList = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const payments = await Payment.find({}) // Fetch all payments
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const count = await Payment.countDocuments();

        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        const userPaymentList = [];

        for (const payment of payments) {
            const rentId = payment.rentId; // Assuming rentId is a field in Payment
            const rent = await Rent.findOne({ _id: rentId });

            if (rent) {
                const userId = rent.userId;
                const user = await User.findOne({ _id: userId });
                // Assuming your User collection has _id field and Car has carOwner field
                if (user) {
                    userPaymentList.push({
                        status: payment.payout,
                        carOwner: user.fullName,
                        amount: payment.paymentData.amount,
                        time: payment.createdAt,
                        method: payment.paymentData.source.brand,
                        rentTripNumbers: rent.rentTripNumber // Assuming tripNumber is a field in Rent
                    });
                }
            }
        }


        res.status(200).json({
            message: "Payment Retrieved Successfully",
            userPaymentList,
            pagination: {
                totalDocuments: count,
                totalPage: Math.ceil(count / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
            }
        })

    } catch (error) {
        console.error(error);
    }
};



const rentiPaymentList = async (req, res) => {
    try {

        const carInfo = await Car.find({});

        const paymentList = await Payment.find({})

        if (!paymentList || paymentList.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        // const paymentAmounts = await Payment.find({ payout: false }).select('paymentData.amount');  //Total Pending
        const payoutAmounts = await Payment.find({ payout: true }).select('paymentData.amount');   //Total Payment

        const totalPayoutAmounts = payoutAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0);
        // const totalPaymentAmounts = paymentAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0);

        const rentiTotalPayment = (totalPayoutAmounts / 100) * 25;
        const hostPayment = totalPayoutAmounts - rentiTotalPayment;

        res.status(200).json({
            message: "Payment Retrieve Successfully",
            hostTotalPayment: hostPayment,
            rentiTotalPayment
        })



    } catch (error) {
        res.status(500).json({
            message: "Payment Retrieve Failure"
        })
        console.log(error)
    }
};



module.exports = { hostPayment, hostPaymentList, userPaymentList, rentiPaymentList };