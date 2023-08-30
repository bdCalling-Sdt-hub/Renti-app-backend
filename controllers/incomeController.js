const Payment = require("../models/Payment");

const income = async (req, res) => {
    try {
        const paymentList = await Payment.find({})
        const paymentAmounts = await Payment.find({ payout: false }).select('paymentData.amount');  //Total Pending
        const payoutAmounts = await Payment.find({ payout: true }).select('paymentData.amount');   //Total Payment

        const totalPayoutAmounts = payoutAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0);
        const totalPaymentAmounts = paymentAmounts.reduce((acc, payment) => acc + payment.paymentData.amount, 0);

        const rentiTotal = (totalPayoutAmounts / 100) * 25;
        const hostPayment = totalPayoutAmounts - rentiTotal;

        res.status(200).json({
            message: "Payment Retrieve Successfully",
            totalPending: totalPaymentAmounts,
            totalPayment: hostPayment,
            paymentList
        })



    } catch (error) {
        res.status(500).json({
            message: "Payment Retrieve Failure"
        })
        console.log(error)
    }
};

module.exports = { income };