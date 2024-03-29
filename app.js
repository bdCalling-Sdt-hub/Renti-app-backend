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
const notificationRouter = require('./routes/notificationRouter');
const activityRouter = require('./routes/activityRouter');
const cors = require('cors');
require('dotenv').config();
const app = express();
const useragent = require('express-useragent');
const HowRentiWork = require('./routes/HowRentiWorkRouter');
const Support = require('./routes/supportRouter');
app.use(useragent.express());

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


//initilizing socketIO
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*"
  }
});

const socketIO = require("./helpers/socketIO");
socketIO(io);

global.io = io

const socketIOPort = process.env.SOCKET_IO_PORT
server.listen(socketIOPort, () => {
  console.log(`Server is listening on port: ${socketIOPort}`);
});


// Routes
app.use('/api/car', carRouter);
app.use('/api/user', userRouter);
app.use('/api/rent', rentRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/dashboard', dashBoardRouter);
app.use('/api/income', incomeRouter);
app.use('/api/about', aboutRouter);
app.use('/api/howRentiWork', HowRentiWork);
app.use('/api/support', Support);
app.use('/api/privacyPolicy', privacyPolicy);
app.use('/api/termsConditionRouter', termsConditionRouter);
app.use('/api/percentage', percentageRouter);
app.use('/api/host-payment-time', hostPaymentTime);
app.use('/api/review', reviewRouter);
app.use('/api/card', cardRouter);
app.use('/api/notifications', notificationRouter)
app.use('/api/activities', activityRouter)

app.use(express.static('public'));
// app.use('/public/uploads/kyc', express.static(__dirname + '/public/uploads/kyc/'))
// app.use('/public/uploads/image', express.static(__dirname + '/public/uploads/image/'));



app.use((error, req, res, next) => {

  if (res.headersSent) {
    next('Something a problem');
  } else if (error.message) {
    console.error("Error", error.message);
    return res.status(500).send(error.message)
  } else {
    return res.send('There was an error!')
  }


  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error"
  res.status(error.statusCode).json({
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

app.listen(3001, '192.168.10.14', () => {
  console.log(`Server started on port 3001`);
});

module.exports = app;