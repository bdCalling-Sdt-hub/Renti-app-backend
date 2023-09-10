const { default: mongoose } = require("mongoose");
const Car = require("../models/Car");
const Payment = require("../models/Payment");
const Income = require("../models/Income");
const User = require("../models/User");
const Rent = require("../models/Rent");
const Percentage = require("../models/Percentage");

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

        const totalPaymentUser = await Payment.find({}).select('paymentData.amount');
        const paymentAmounts = await Payment.find({ payout: false }).select('paymentData.amount');  //Total Pending
        const payoutAmounts = await Payment.find({ payout: true }).select('paymentData.amount');   //Total Payment


        const totalPayment = totalPaymentUser.reduce((acc, payment) => acc + payment.paymentData.amount, 0); //Total
        const totalPaymentAmounts = paymentAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0); //Total Pending
        const totalPayoutAmounts = payoutAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0); //Total Payment
        console.log(totalPayment)
        console.log(totalPaymentAmounts)
        console.log(totalPayoutAmounts)

        const percentages = await Percentage.find({})
        const contentNumbers = percentages.map(item => item.content);
        const numberPercentages = Number(contentNumbers)

        const rentiTotal = (totalPayoutAmounts / 100) * numberPercentages;
        console.log(rentiTotal)
        const hostPayment = totalPayoutAmounts - rentiTotal;
        console.log("ggg", hostPayment)

        let hostTotalPercentage = (totalPayoutAmounts / totalPayment) * 100;
        console.log("hostTotalPercentage", hostTotalPercentage)

        let hostPendingPercentage = (totalPaymentAmounts / totalPayment) * 100;
        console.log("hostPendingPercentage", hostPendingPercentage)

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

// const hostPaymentList = async (req, res) => {
//     try {
//         const payments = await Payment.find({}); // Fetch all payments
//         if (!payments || payments.length === 0) {
//             return res.status(404).json({ message: 'Payment not found' });
//         }

//         const user = await User.findById(req.body.userId)
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (user.role !== 'admin') {
//             return res.status(401).json({ message: 'You are not Authorized' });
//         }
//         // Calculate the total sum of all payment amounts
//         const totalPayment = payments.reduce((sum, payment) => sum + payment.paymentData.amount, 0);

//         // Calculate 25% of the totalPayment
//         const twentyFivePercent = totalPayment * 0.25;

//         const hostPaymentList = [];

//         // Fetch carOwner information for each payment
//         for (const payment of payments) {

//             const carId = payment.carId;
//             const car = await Car.findOne({ _id: carId }); // Assuming your Car collection has _id field


//             if (car) {
//                 const user = await User.findOne({ _id: car.carOwner, role: 'host' });
//                 // Assuming your User collection has _id field and Car has carOwner field
//                 if (user) {
//                     const modifiedAmount = payment.paymentData.amount - (payment.paymentData.amount * 0.25);
//                     hostPaymentList.push({
//                         status: payment.payout,
//                         carOwner: user.fullName,
//                         originalAmount: payment.paymentData.amount,
//                         paidAmount: modifiedAmount,
//                     });
//                 }
//             }
//         }

//         res.status(200).json({
//             message: "Payment Retrieved Successfully",
//             hostPaymentList
//         })

//     } catch (error) {
//         console.error(error);
//     }
// };


const hostPaymentList = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;

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

        const percentages = await Percentage.find({});
        const contentNumbers = percentages.map(item => item.content);
        const numberPercentages = Number(contentNumbers);
        console.log(numberPercentages)

        // Calculate 25% of the totalPayment
        const twentyFivePercent = totalPayment * numberPercentages;

        const hostPaymentList = [];

        for (const payment of payments) {
            const carId = payment.carId;
            const car = await Car.findOne({ _id: carId }); // Assuming your Car collection has _id field
            const rent = await Rent.findOne({ _id: payment.rentId }); // Assuming 'rentId' is a field in the Payment model

            if (car) {
                const user = await User.findOne({ _id: car.carOwner, role: 'host' });
                if (user) {
                    if (rent) {
                        hostPaymentList.push({
                            status: payment.payout,
                            carOwner: user,
                            time: payment.createdAt,
                            originalAmount: payment.paymentData.amount,
                            paidAmount: payment.paymentData.amount - ((payment.paymentData.amount / 100 * numberPercentages)),
                            rentTripNumber: rent.rentTripNumber,
                            time: payment.createdAt,
                            method: payment.paymentData.source.brand,
                            _id: payment._id,
                        });
                    }
                }
            }
        }

        const filteredUserPaymentList = hostPaymentList.filter(payment => payment.rentTripNumber == req.query.search || payment.carOwner == req.query.search || payment.email == req.query.search || payment.phoneNumber == req.query.search);
        console.log(filteredUserPaymentList)


        let startIndex;
        let endIndex;
        let totalDocuments;
        let slicedUserPaymentList;

        if (filteredUserPaymentList.length > 0) {
            startIndex = (page - 1) * limit;
            endIndex = page * limit;
            totalDocuments = filteredUserPaymentList.length;
            slicedUserPaymentList = filteredUserPaymentList.slice(startIndex, endIndex);
        }
        else {
            startIndex = (page - 1) * limit;
            endIndex = page * limit;
            totalDocuments = hostPaymentList.length;
            slicedUserPaymentList = hostPaymentList.slice(startIndex, endIndex);
        }


        res.status(200).json({
            message: "Payment Retrieved Successfully",
            hostPaymentList: slicedUserPaymentList,
            pagination: {
                totalDocuments,
                totalPage: Math.ceil(totalDocuments / limit),
                currentPage: page,
                previousPage: page > 1 ? page - 1 : null,
                nextPage: page < Math.ceil(totalDocuments / limit) ? page + 1 : null,
            },
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const userPaymentList = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 3;

        const payments = await Payment.find({}) // Fetch all payments
            // .limit(limit)
            // .skip((page - 1) * limit)
            .populate("carId", "")
            .sort({ createdAt: -1 })

        const count = await Payment.countDocuments();

        console.log("fff", payments.length)

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

            const carId = payment.carId;
            const car = await Car.findOne({ _id: carId });

            if (rent) {
                const userId = rent.userId;
                const user = await User.findOne({ _id: userId });
                // Assuming your User collection has _id field and Car has carOwner field
                if (user) {
                    userPaymentList.push({
                        status: payment.payout,
                        carOwner: user,
                        car,
                        amount: payment.paymentData.amount,
                        time: payment.createdAt,
                        method: payment.paymentData.source.brand,
                        rentTripNumbers: rent.rentTripNumber // Assuming tripNumber is a field in Rent
                    });
                }
            }
        }

        console.log(userPaymentList.length)


        res.status(200).json({
            message: "Payment Retrieved Successfully",
            userPaymentList,
            pagination: {
                totalDocuments: userPaymentList.length,
                totalPage: Math.ceil(userPaymentList.length / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
            }
        })

    } catch (error) {
        console.error(error);
    }
};



const userHourlyPaymentList = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999); // Set to end of the current day

        const hourlyPaymentCounts = new Array(24).fill({}); // Initialize an array to store hourly counts

        for (let i = 0; i < 24; i++) {
            const startHour = new Date(endOfDay);
            startHour.setHours(i);
            const endHour = new Date(startHour);
            endHour.setHours(startHour.getHours() + 1);

            // Fetch payments made within the current hour
            const payments = await Payment.find({
                createdAt: { $gte: startHour, $lt: endHour },
            });

            // Create a map to store user payment counts for the current hour
            const userPaymentCounts = new Map();

            // Count user payments for the current hour
            payments.forEach(payment => {
                const userId = payment.userId;
                if (!userPaymentCounts.has(userId)) {
                    userPaymentCounts.set(userId, 0);
                }
                userPaymentCounts.set(userId, userPaymentCounts.get(userId) + 1);
            });

            // Store user payment counts for the current hour in the array
            hourlyPaymentCounts[i] = {
                hour: i + 1, // Hourly index starts from 0, so add 1 to get the hour number
                userPaymentCounts: Array.from(userPaymentCounts),
            };
        }

        res.status(200).json({
            message: 'Hourly User Payment Counts for the Last 24 Hours Retrieved Successfully',
            hourlyPaymentCounts: hourlyPaymentCounts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};




const rentiPaymentList = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const carInfo = await Car.find({});
        const paymentList = await Payment.find({});

        if (!paymentList || paymentList.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        const payoutAmounts = await Payment.find({ payout: true }).select('paymentData.amount'); // Total Payment
        const totalPayoutAmounts = payoutAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0);

        const percentages = await Percentage.find({});
        const contentNumbers = percentages.map(item => item.content);
        const numberPercentages = Number(contentNumbers);

        const rentiTotalIncome = (totalPayoutAmounts / 100) * numberPercentages;
        const hostPayment = totalPayoutAmounts - rentiTotalIncome;

        const userPaymentList = [];

        for (const payment of paymentList) {
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
                        totalAmount: payment.paymentData.amount,
                        hostPayment: payment.paymentData.amount - (payment.paymentData.amount / 100 * numberPercentages),
                        stripeFee: 0,
                        rentiIncome: payment.paymentData.amount / 100 * numberPercentages,
                        time: payment.createdAt,
                        method: payment.paymentData.source.brand,
                        rentTripNumbers: rent.rentTripNumber, // Assuming tripNumber is a field in Rent
                    });
                }
            }
        }

        const filteredUserPaymentList = userPaymentList.filter(payment => payment.rentTripNumbers == req.query.rentTripNumber);


        let startIndex;
        let endIndex;
        let totalDocuments;
        let slicedUserPaymentList;

        if (filteredUserPaymentList.length > 0) {
            startIndex = (page - 1) * limit;
            endIndex = page * limit;
            totalDocuments = filteredUserPaymentList.length;
            slicedUserPaymentList = filteredUserPaymentList.slice(startIndex, endIndex);
        }
        else {
            startIndex = (page - 1) * limit;
            endIndex = page * limit;
            totalDocuments = userPaymentList.length;
            slicedUserPaymentList = userPaymentList.slice(startIndex, endIndex);
        }

        res.status(200).json({
            message: 'Payment Retrieve Successfully',
            totalPaid: hostPayment,
            rentiTotalIncome,
            userPaymentList: slicedUserPaymentList, // Use the filtered and paginated list
            pagination: {
                totalDocuments,
                totalPage: Math.ceil(totalDocuments / limit),
                currentPage: page,
                previousPage: page > 1 ? page - 1 : null,
                nextPage: page < Math.ceil(totalDocuments / limit) ? page + 1 : null,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: 'Payment Retrieve Failure',
        });
        console.log(error);
    }
};

const userHourlyRentiPaymentList = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999); // Set to end of the current day

        const hourlyPaymentCounts = new Array(24).fill({}); // Initialize an array to store hourly counts

        for (let i = 0; i < 24; i++) {
            const startHour = new Date(endOfDay);
            startHour.setHours(i);
            const endHour = new Date(startHour);
            endHour.setHours(startHour.getHours() + 1);

            // Fetch payments made within the current hour
            const payments = await Payment.find({
                payout: true,
                createdAt: { $gte: startHour, $lt: endHour },
            });

            // Create a map to store user payment counts for the current hour
            const userPaymentCounts = new Map();

            // Count user payments for the current hour
            payments.forEach(payment => {
                const userId = payment.userId;
                if (!userPaymentCounts.has(userId)) {
                    userPaymentCounts.set(userId, 0);
                }
                userPaymentCounts.set(userId, userPaymentCounts.get(userId) + 1);
            });

            // Store user payment counts for the current hour in the array
            hourlyPaymentCounts[i] = {
                hour: i + 1, // Hourly index starts from 0, so add 1 to get the hour number
                userPaymentCounts: Array.from(userPaymentCounts),
            };
        }

        res.status(200).json({
            message: 'Hourly User Payment Counts for the Last 24 Hours Retrieved Successfully',
            hourlyPaymentCounts: hourlyPaymentCounts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};




module.exports = { hostPayment, hostPaymentList, userPaymentList, rentiPaymentList, userHourlyPaymentList, userHourlyRentiPaymentList };