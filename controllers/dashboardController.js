const About = require('../models/About');
const Car = require('../models/Car');
const Payment = require('../models/Payment');
const Rent = require('../models/Rent');
const User = require('../models/User');

const totalIncome = async (req, res) => {
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

        const todayPayments = await Payment.find({ createdAt: { $gte: today } });

        const todayIncome = todayPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);

        // Weekly income
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const weeklyPayments = await Payment.find({
            createdAt: { $gte: oneWeekAgo, $lte: today }
        });

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
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const rentsStatus = async (req, res) => {
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
        console.error('Error fetching rents:', error);
        res.status(500).json({ error: 'An error occurred while fetching rents.' });
    }
}

const allEarnings = async (req, res) => {
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
        console.error('Error fetching rents:', error);
        res.status(500).json({ error: 'An error occurred while fetching rents.' });
    }
}





module.exports = { totalIncome, rentsStatus, allEarnings };