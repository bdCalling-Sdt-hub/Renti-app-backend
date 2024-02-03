require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Rent = require('../models/Rent');
const Car = require('../models/Car');
const User = require('../models/User');
const Percentage = require('../models/Percentage');
const { addNotification, getAllNotification } = require('./notificationController');


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

        console.log("requestId", requestId)

        const rentRequest = await Rent.findById(requestId);
        // const rentRequest = await Rent.findById(requestId);

        console.log("Rent", rentRequest.rentTripNumber)


        const user = await User.findById(req.body.userId);
        console.log("User", user);

        const stripeConnectAccount = await Rent.findById(requestId).populate('hostId');
        console.log("Rent in Host", stripeConnectAccount)

        const stripeConnectAccountID = stripeConnectAccount.hostId.stripeConnectAccountId;
        console.log("Destination ID", stripeConnectAccountID);

        if (!stripeConnectAccountID) {
            return res.status(404).json({ message: 'Destination ID is not found for payment' });
        }

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
            currency: 'mxn', // Change this to 'eur' if you prefer Euros
            transfer_group: rentRequest.rentTripNumber,
            customer: customer.id,
            receipt_email: token.email,
            description: `Purchase product ${product.name}`,
            shipping: {
                name: user.fullName, // Replace with the actual name
                address: {
                    country: "MX", // Mx er somoy MX hobe
                },
            },
        });

        console.log("paymentData", paymentData)

        // -----------------------------------------------------
        const percentages = await Percentage.find({});
        const contentNumbers = percentages.map(item => item.content);
        const numberPercentages = Number(contentNumbers);
        // -----------------------------------------------------

        const transferAmount = (product.price * 100 * ((100 - numberPercentages) / 100));

        const transfer = await stripe.transfers.create({
            amount: transferAmount,
            currency: 'mxn', //Mx er somoy mxn hobe
            source_transaction: paymentData.id,
            destination: stripeConnectAccountID, //stripeConnectAccountID
            transfer_group: rentRequest.rentTripNumber,
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

        console.log("createdPayment", createdPayment)

        // Update the Car model with the paymentId
        const carToUpdate = await Car.findById(rentRequest.carId);
        carToUpdate.paymentId = createdPayment._id; // Store the payment ID
        await carToUpdate.save();

        rentRequest.payment = 'Completed';
        await rentRequest.save();


        // Notification Start 
        const message = user.fullName + ' Sent Success Payment'
        const newNotification = {
            message: message,
            receiverId: rentRequest.hostId,
            image: user.image,
            linkId: createdPayment._id,
            type: 'host'
        }
        const notification = await addNotification(newNotification)
        // const notification = await getAllNotification('host', 6, 1, rentRequest.hostId)
        console.log('notification ', notification)
        const roomId = rentRequest.hostId.toString()
        console.log('room', roomId)
        io.to('room' + roomId).emit('host-notification', notification);
        // Notification End

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