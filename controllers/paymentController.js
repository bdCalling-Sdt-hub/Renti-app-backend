const stripe = require('stripe')(process.env.STRIPE_SECRET_TEST_KEY);
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Rent = require('../models/Rent');
const Car = require('../models/Car');
const User = require('../models/User');


const payment = async (req, res, next) => {
    try {
        const { product, token } = req.body;
        const { requestId } = req.params;

        const user = await User.findById(req.body.userId)

        const rentRequest = await Rent.findById(requestId);

        if (!rentRequest) {
            return res.status(404).json({ message: 'Request is not found for payment' });
        }

        if (req.body.userId !== rentRequest.userId.toString() && rentRequest.requestStatus !== "Accepted") {
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
        const createdPayment = await Payment.create({
            paymentData,
            userId: user._id,
            carId: rentRequest.carId,
            rentId: rentRequest,
            hostId: rentRequest.hostId,
        });

        // Update the Car model with the paymentId
        const carToUpdate = await Car.findById(rentRequest.carId);
        carToUpdate.paymentId = createdPayment._id; // Store the payment ID
        await carToUpdate.save();

        rentRequest.payment = 'Completed';
        await rentRequest.save();

        res.status(200).json({ message: 'Payment success', paymentData });
    } catch (error) {
        next(error)
    }
};



module.exports = { payment };