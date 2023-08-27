const Payment = require('../models/Payment');
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
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const monthlyPayments = await Payment.find({
            createdAt: { $gte: firstDayOfMonth, $lte: today }
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








module.exports = { totalIncome };