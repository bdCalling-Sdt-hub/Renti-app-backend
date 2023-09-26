// app.js
const express = require('express');
const mongoose = require('mongoose');
const carRouter = require('./routes/carRouter');
const userRouter = require('./routes/userRouter');
const rentRouter = require('./routes/rentRouter');
const paymentRouter = require('./routes/paymentRouter');
const dashBoardRouter = require('./routes/dashboardRouter');
const incomeRouter = require('./routes/incomeRouter');
const aboutRouter = require('./routes/aboutRouter');
const privacyPolicy = require('./routes/privacyPolicy');
const termsConditionRouter = require('./routes/termsConditionRouter');
const percentageRouter = require('./routes/percentageRouter');
const hostPaymentTime = require('./routes/hostPaymentTime');
const reviewRouter = require('./routes/reviewRouter');
const cardRouter = require('./routes/cardRouter');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Connect to the MongoDB database
mongoose.connect(process.env.MONGODB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: false,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(
  // {
  //   origin: [process.env.ALLOWED_CLIENT_URLS, process.env.ALLOWED_CLIENT_URLS_2],
  //   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  // }
));

// Routes
app.use('/api/car', carRouter);
app.use('/api/user', userRouter);
app.use('/api/rent', rentRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/dashboard', dashBoardRouter);
app.use('/api/income', incomeRouter);
app.use('/api/about', aboutRouter);
app.use('/api/privacyPolicy', privacyPolicy);
app.use('/api/termsConditionRouter', termsConditionRouter);
app.use('/api/percentage', percentageRouter);
app.use('/api/host-payment-time', hostPaymentTime);
app.use('/api/review', reviewRouter);
app.use('/api/card', cardRouter);

app.use(express.static('public'));
app.use('/public/uploads/kyc', express.static(__dirname + '/public/uploads/kyc/'))
app.use('/public/uploads/image', express.static(__dirname + '/public/uploads/image/'));



app.use((error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error"
  res.ststus(error.statusCode).json({
    status: error.statusCode,
    message: error.message
  });
})

// function callEveryFiveSeconds(callback) {
//   setInterval(callback, 5000);
// }

// function myFunction() {
//   console.log(global);
// }

// callEveryFiveSeconds(myFunction);


// Start the server

app.listen(3000, '192.168.10.14', () => {
  console.log('Server started on port 3000');
});

module.exports = app;