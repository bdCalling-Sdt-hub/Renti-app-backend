// app.js
const express = require('express');
const mongoose = require('mongoose');
const carRouter = require('./routes/carRouter');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Connect to the MongoDB database
mongoose.connect(process.env.MONGODB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [process.env.ALLOWED_CLIENT_URLS, process.env.ALLOWED_CLIENT_URLS_2],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));


// Routes
app.use('/api/car', carRouter);


// Start the server
app.listen(3001, '103.161.9.106', () => {
  console.log('Server started on port 3001');
});

module.exports = app;