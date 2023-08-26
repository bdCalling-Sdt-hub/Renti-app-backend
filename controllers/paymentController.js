const stripe = require('stripe')('sk_test_51NiWAKHloEqm4Hcr2bW9Od8OZL1ySHO48NmyqgylSNkvRfp3GRAtAPcgr0EldrlZQ5QbnrdPDOTlI8UmIGxv11di00HWChl1wB');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Rent = require('../models/Rent');

const payment = async (req, res) => {
    try {
        const { product, token } = req.body;
        const { requestId } = req.params;
        
        const rentRequest = await Rent.findById(requestId);

        if (!rentRequest) {
            return res.status(404).json({ message: 'Request is not found for payment' });
        }

        if (req.body.userId !== rentRequest.userId || rentRequest.requestStatus !== "Accepted") {
            return res.status(401).json({ message: 'You cannot make a payment on this car' });
        }

        const customer = await stripe.customers.create({
            email: token.email,
            source: token.id,
        });

        const paymentData = await stripe.charges.create({
            amount: product.price * 100,
            currency: 'usd',
            customer: customer.id,
            receipt_email: token.email,
            description: `Purchase product ${product.name}`,
            shipping: {
                name: "John Doe", // Replace with actual name
                address: {
                    country: "US", // Replace with actual country code
                },
            },
        });

        // Save payment data to the MongoDB collection 'paymentData'
        await Payment.create({
            paymentData
        });

        res.status(200).json({ message: 'Payment success', paymentData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while processing the payment.', error: error.message });
    }
};


module.exports = { payment };