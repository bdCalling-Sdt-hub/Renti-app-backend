require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Rent = require('../models/Rent');
const Car = require('../models/Car');
const User = require('../models/User');


// const payment = async (req, res, next) => {
//     try {
//         const { product, token } = req.body;
//         const { requestId } = req.params;

//         const user = await User.findById(req.body.userId);

//         const rentRequest = await Rent.findById(requestId);

//         if (!rentRequest) {
//             return res.status(404).json({ message: 'Request is not found for payment' });
//         }

//         if (req.body.userId !== rentRequest.userId.toString() && rentRequest.requestStatus !== 'Accepted') {
//             return res.status(401).json({ message: 'You cannot make a payment on this car' });
//         }

//         const customer = await stripe.customers.create({
//             email: token.email,
//             source: token.id,
//         });

//         const connectedAccount = 'acct_1O1ovBQqI9t8Xsnj'; // Replace with the actual connected account ID

//         // Retrieve the connected account to check and enable "transfers" capability
//         let connectedAccountInfo = await stripe.accounts.retrieve(connectedAccount);

//         // Check if "transfers" capability is not enabled
//         if (!connectedAccountInfo.capabilities.transfers || connectedAccountInfo.capabilities.transfers === 'inactive') {
//             // Enable the "transfers" capability
//             connectedAccountInfo = await stripe.accounts.update(connectedAccount, {
//                 capabilities: {
//                     transfers: { requested: true },
//                 },
//             });
//         }

//         // Create a payment intent
//         const paymentData = await stripe.paymentIntents.create({
//             amount: product.price * 100,
//             currency: 'usd',
//             // currency: 'usd',
//             // customer: customer.id,
//             // receipt_email: token.email,
//             // description: `Purchase product ${product.name}`,
//             // shipping: {
//             //     name: "John Doe", // Replace with actual name
//             //     address: {
//             //         country: "US", // Replace with actual country code
//             //     },
//             // },
//             payment_method_types: ['card'], // Specify the payment method type you are using
//             confirmation_method: 'manual',
//             confirm: true,
//             payment_method: token.id, // Use the token for the payment method
//             confirmation_method: 'manual',
//             confirm: true,
//             application_fee_amount: 123,
//             transfer_data: {
//                 destination: connectedAccount,
//             },
//         });

//         // Save payment data to the MongoDB collection 'paymentData'
//         const createdPayment = await Payment.create({
//             paymentData,
//             userId: user._id,
//             carId: rentRequest.carId,
//             rentId: rentRequest,
//             hostId: rentRequest.hostId,
//         });

//         // Update the Car model with the paymentId
//         const carToUpdate = await Car.findById(rentRequest.carId);
//         carToUpdate.paymentId = createdPayment._id; // Store the payment ID
//         await carToUpdate.save();

//         rentRequest.payment = 'Completed';
//         await rentRequest.save();

//         res.status(200).json({ message: 'Payment success', paymentData });
//     } catch (error) {
//         next(error);
//     }
// };


const payment = async (req, res, next) => {
    try {
        const { product, token } = req.body;
        const { requestId } = req.params;

        console.log("product", token)

        const user = await User.findById(req.body.userId);

        const rentRequest = await Rent.findById(requestId);

        const stripeConnectAccount = await Rent.findById(requestId).populate('hostId');
        const stripeConnectAccountID = stripeConnectAccount.hostId.stripeConnectAccountId;
        console.log("Host Info", stripeConnectAccountID);

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
            currency: 'usd', // Change this to 'eur' if you prefer Euros
            transfer_group: 'ORDER10',
            customer: customer.id,
            receipt_email: token.email,
            description: `Purchase product ${product.name}`,
            shipping: {
                name: "John Doe", // Replace with the actual name
                address: {
                    country: "US", // Replace with the actual country code
                },
            },
        });

        console.log("paymentData", paymentData)

        const transferAmount = (product.price * 100 * 0.75);

        const transfer = await stripe.transfers.create({
            amount: transferAmount,
            currency: 'usd',
            source_transaction: paymentData.id,
            destination: stripeConnectAccountID,
            transfer_group: 'ORDER10',
        });

        console.log(transfer)



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
        next(error);
    }
};





// const payment = async (req, res, next) => {
//     try {
//         const { product, token } = req.body;
//         const { requestId } = req.params;

//         const user = await User.findById(req.body.userId)

//         const rentRequest = await Rent.findById(requestId);

//         if (!rentRequest) {
//             return res.status(404).json({ message: 'Request is not found for payment' });
//         }

//         if (req.body.userId !== rentRequest.userId.toString() && rentRequest.requestStatus !== "Accepted") {
//             return res.status(401).json({ message: 'You cannot make a payment on this car' });
//         }

//         const customer = await stripe.customers.create({
//             email: token.email,
//             source: token.id,
//         });

//         const paymentData = await stripe.charges.create({
//             amount: product.price * 100,
//             currency: 'usd',
//             customer: customer.id,
//             receipt_email: token.email,
//             description: `Purchase product ${product.name}`,
//             shipping: {
//                 name: "John Doe", // Replace with actual name
//                 address: {
//                     country: "US", // Replace with actual country code
//                 },
//             },
//         });

//         // Save payment data to the MongoDB collection 'paymentData'
//         const createdPayment = await Payment.create({
//             paymentData,
//             userId: user._id,
//             carId: rentRequest.carId,
//             rentId: rentRequest,
//             hostId: rentRequest.hostId,
//         });

//         // Update the Car model with the paymentId
//         const carToUpdate = await Car.findById(rentRequest.carId);
//         carToUpdate.paymentId = createdPayment._id; // Store the payment ID
//         await carToUpdate.save();

//         rentRequest.payment = 'Completed';
//         await rentRequest.save();

//         res.status(200).json({ message: 'Payment success', paymentData });
//     } catch (error) {
//         next(error)
//     }
// };



module.exports = { payment };