// routes/auth.js
const express = require('express');

const { isValidUser } = require('../middleWares/auth');
const { hostPayment, hostPaymentList, userPaymentList, rentiPaymentList, userHourlyPaymentList, userHourlyRentiPaymentList } = require('../controllers/incomeController');
const router = express.Router();

// Sign-up
router.get('/host-payment', isValidUser, hostPayment);
router.get('/host-payment-list', isValidUser, hostPaymentList);
router.get('/user-payment-list', isValidUser, userPaymentList);
router.get('/user-hourly-payment-list', isValidUser, userHourlyPaymentList);
router.get('/renti-payment-list', isValidUser, rentiPaymentList);
router.get('/hourly-renti-payment', isValidUser, userHourlyRentiPaymentList);




module.exports = router;
