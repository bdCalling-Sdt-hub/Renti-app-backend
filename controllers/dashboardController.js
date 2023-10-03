const About = require('../models/About');
const Car = require('../models/Car');
const Payment = require('../models/Payment');
const Percentage = require('../models/Percentage');
const Rent = require('../models/Rent');
const User = require('../models/User');

const totalIncome = async (req, res, next) => {
    try {
        // Total Income
        const payments = await Payment.find({})

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

        const totalIncome = payments.reduce((total, payment) => total + payment.paymentData.amount, 0);

        // Today Income
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log(today)

        const todayPayments = await Payment.find({ createdAt: { $gte: today } });

        const todayIncome = todayPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);

        // Weekly income
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const weeklyPayments = await Payment.find({
            createdAt: { $gte: oneWeekAgo, $lte: today.setDate(today.getDate() + 1) }
        });

        console.log(weeklyPayments)

        const weeklyIncome = weeklyPayments.reduce(
            (total, payment) => total + payment.paymentData.amount,
            0
        );


        // Monthly Income
        function formatDate(date) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Intl.DateTimeFormat('en-US', options).format(date);
        }

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        firstDayOfMonth.setHours(0, 0, 0, 0);

        // Find payments created within the current month
        const monthlyPayments = await Payment.find({
            createdAt: { $gte: formatDate(firstDayOfMonth), $lte: formatDate(today) }
        });

        const totalMonthlyIncome = monthlyPayments.reduce(
            (total, payment) => total + payment.paymentData.amount,
            0
        );

        res.status(200).json({
            TotalIncome_message: "Total Income",
            totalIncome,

            TodayIncome_message: "Today's Income",
            todayIncome,

            WeeklyIncome_message: "Recent Weekly Income",
            weeklyIncome,

            Monthly_message: "Monthly Income",
            totalMonthlyIncome
        });
    } catch (error) {
        next(error)
    }
}

const hostTotalIncome = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'host') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        // Total Income for the host user
        const totalPayments = await Payment.find({ hostId: user._id });

        if (!totalPayments || totalPayments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const totalIncome = totalPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);
        console.log(totalIncome)

        const percentages = await Percentage.find({})
        const contentNumbers = percentages.map(item => item.content);
        const numberPercentages = Number(contentNumbers)

        const rentiFee = (totalIncome / 100) * numberPercentages;

        const hostTotalPayment = totalIncome - rentiFee;

        // Today Income
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayPayments = totalPayments.filter(payment => payment.createdAt >= today);

        const todayIncome = todayPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);

        // Weekly income
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const weeklyPayments = totalPayments.filter(payment => payment.createdAt >= oneWeekAgo && payment.createdAt <= today);

        const weeklyIncome = weeklyPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);

        // Monthly Income
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const monthlyPayments = totalPayments.filter(payment => payment.createdAt >= firstDayOfMonth && payment.createdAt <= today);

        const totalMonthlyIncome = monthlyPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);

        res.status(200).json({
            totalIncome_message: "Total Income",
            totalIncome: hostTotalPayment,
            // rentiFee,

            // TodayIncome_message: "Today's Income",
            // todayIncome: todayPayments,

            // WeeklyIncome_message: "Recent Weekly Income",
            // weeklyIncome,
            weeklyIncomeList: weeklyPayments,

            // Monthly_message: "Monthly Income",
            // totalMonthlyIncome
        });
    } catch (error) {
        next(error)
    }
};

const hostPaymentList = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'host') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        const carInfo = await Car.find({});
        const paymentList = await Payment.find({ hostId: user._id });

        console.log(paymentList)

        if (!paymentList || paymentList.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }


        // const payoutAmounts = await Payment.find({ payout: true }).select('paymentData.amount'); // Total Payment
        const totalPayoutAmounts = paymentList.reduce((acc, payment) => acc + payment.paymentData.amount, 0);
        console.log(totalPayoutAmounts)

        const percentages = await Percentage.find({});
        const contentNumbers = percentages.map(item => item.content);
        const numberPercentages = Number(contentNumbers);

        const hostTotalIncome = (totalPayoutAmounts / 100) * numberPercentages;
        const hostPayment = totalPayoutAmounts - hostTotalIncome;
        console.log(hostPayment)

        const userPaymentList = [];

        for (const payment of paymentList) {
            const rentId = payment.rentId; // Assuming rentId is a field in Payment
            const rent = await Rent.findOne({ _id: rentId });

            if (rent) {
                const hostId = rent.hostId;
                const user = await User.findOne({ _id: hostId });
                // Assuming your User collection has _id field and Car has carOwner field
                if (user) {
                    userPaymentList.push({
                        income: payment,
                        status: payment.payout,
                        carOwner: user.fullName,
                        totalAmount: payment.paymentData.amount,
                        myPayment: payment.paymentData.amount - (payment.paymentData.amount / 100 * numberPercentages),
                        stripeFee: 0,
                        rentiFee: payment.paymentData.amount / 100 * numberPercentages,
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
            1.0
        }
        else {
            startIndex = (page - 1) * limit;
            endIndex = page * limit;
            totalDocuments = userPaymentList.length;
            slicedUserPaymentList = userPaymentList.slice(startIndex, endIndex);
        }

        res.status(200).json({
            message: 'Payment Retrieve Successfully',
            myPayment: hostPayment,
            rentiFee: hostTotalIncome,
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
        next(error)
    }
};


// const hostTotalIncome = async (req, res, next) => {
//     try {
//         const user = await User.findById(req.body.userId);
//         console.log(user._id)

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (user.role !== 'host') {
//             return res.status(401).json({ message: 'You are not Authorized' });
//         }

//         // Total Income for the host user
//         // const payments = await Payment.find({ rentId: user._id });
//         const payments = await Payment.find({ hostId: user._id });
//         console.log(payments)



//         if (!payments || payments.length === 0) {
//             return res.status(404).json({ message: 'Payment not found' });
//         }

//         const totalIncome = payments.reduce((total, payment) => total + payment.paymentData.amount, 0);

//         // Rest of your income calculations (Today, Weekly, Monthly) can remain the same

//         res.status(200).json({
//             TotalIncome_message: "Total Income",
//             totalIncome,

//             // TodayIncome_message: "Today's Income",
//             // todayIncome,

//             // WeeklyIncome_message: "Recent Weekly Income",
//             // weeklyIncome,

//             // Monthly_message: "Monthly Income",
//             // totalMonthlyIncome
//         });
//     } catch (error) {
//         console.error("Error fetching payments:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };


const rentsStatus = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const rents = await Rent.find({})
        if (!rents || rents.length === 0) {
            return res.status(404).json({ message: 'Rent not found' });
        }

        const user = await User.findById(req.body.userId)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(401).json({ message: 'You are not Authorized' });
        }

        const todayRents = await Rent.find({
            startDate: { $gte: today }
        });

        const pendingRents = rents.filter(rent =>
            rent.requestStatus === 'Pending'
        );

        if (!pendingRents || pendingRents.length === 0) {
            return res.status(404).json({ message: 'Today Rent not found' });
        }

        if (rents.requestStatus === 'Pending') {
            return res.status(404).json({ message: 'Pending Rent not found' });
        }

        const totalOnGoing = rents.filter(rent =>
            rent.payment === 'Completed'
        )

        const tripCompleted = await Car.find({ tripStatus: "End" })
        // console.log("tripCompleted", tripCompleted)

        res.status(200).json({
            todayRents,
            pendingRents,
            totalOnGoing,
            tripCompleted
        });
    } catch (error) {
        next(error)
    }
}

const allEarnings = async (req, res, next) => {
    try {
        const rentType = req.params.all;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;


        if (rentType === 'all') {
            const permittedUser = await User.findById(req.body.userId);

            const allEarning = await Payment.find({})
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 })
                .populate('userId', '')
                .populate('carId', '')
                .populate('hostId', '')
                .populate('rentId', '');
            const count = await Payment.countDocuments({});

            const user = await User.findById(req.body.userId);

            if (!allEarning && count) {
                return res.status(404).json('Payments Not Found')
            }

            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else if (permittedUser.role === 'admin') {
                res.status(200).json({
                    message: "Recently Earnings Retrieved Successfully",
                    allEarning,
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
        } else if (rentType === 'today-income') {
            const permittedUser = await User.findById(req.body.userId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayIncome = await Payment.find({
                createdAt: { $gte: today }
            })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 })
                .populate('userId', '')
                .populate('carId', '')
                .populate('hostId', '')
                .populate('rentId', '');

            const count = await Payment.countDocuments({
                createdAt: { $gte: today }
            });

            const user = await User.findById(req.body.userId);

            if (!todayIncome && count) {
                return res.status(404).json('Today Income Not Found')
            }

            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else if (permittedUser.role === 'admin') {
                res.status(200).json({
                    message: "Today Earnings Retrieved Successfully",
                    todayIncome,
                    pagination: {
                        totalDocuments: count,
                        totalPage: Math.ceil(count / limit),
                        currentPage: page,
                        previousPage: page - 1 > 0 ? page - 1 : null,
                        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
                    }
                });
            } else {
                res.status(400).json({ message: 'Invalid rent type' });
            }

        } else if (rentType === 'weekly-income') {
            const permittedUser = await User.findById(req.body.userId);
            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const weeklyIncome = await Payment.find({
                createdAt: { $gte: sevenDaysAgo, $lte: today }
            })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 })
                .populate('userId', '')
                .populate('carId', '')
                .populate('hostId', '')
                .populate('rentId', '');

            const count = await Payment.countDocuments({
                createdAt: { $gte: sevenDaysAgo, $lte: today }
            });

            const user = await User.findById(req.body.userId);

            if (!weeklyIncome && count) {
                return res.status(404).json('Weekly Income Not Found')
            }

            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else if (permittedUser.role === 'admin') {
                res.status(200).json({
                    message: "Weekly Earnings Retrieved Successfully",
                    weeklyIncome,
                    pagination: {
                        totalDocuments: count,
                        totalPage: Math.ceil(count / limit),
                        currentPage: page,
                        previousPage: page - 1 > 0 ? page - 1 : null,
                        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
                    }
                });
            } else {
                res.status(400).json({ message: 'Invalid rent type' });
            }

        } else if (rentType === 'monthly-income') {
            const permittedUser = await User.findById(req.body.userId);
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            firstDayOfMonth.setHours(0, 0, 0, 0);
            lastDayOfMonth.setHours(23, 59, 59, 999);

            const monthlyIncome = await Payment.find({
                createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
            })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 })
                .populate('userId', '')
                .populate('carId', '')
                .populate('hostId', '')
                .populate('rentId', '');

            const count = await Payment.countDocuments({
                createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
            });

            const user = await User.findById(req.body.userId);

            if (!monthlyIncome && count) {
                return res.status(404).json('Monthly Income Not Found')
            }

            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else if (permittedUser.role === 'admin') {
                res.status(200).json({
                    message: "Monthly Earnings Retrieved Successfully",
                    monthlyIncome,
                    pagination: {
                        totalDocuments: count,
                        totalPage: Math.ceil(count / limit),
                        currentPage: page,
                        previousPage: page - 1 > 0 ? page - 1 : null,
                        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
                    }
                });
            } else {
                res.status(400).json({ message: 'Invalid rent type' });
            }
        } else {
            res.status(400).json({ message: 'Invalid rent type' });
        }


    } catch (error) {
        next(error)
    }
}





module.exports = { totalIncome, rentsStatus, allEarnings, hostTotalIncome, hostPaymentList };