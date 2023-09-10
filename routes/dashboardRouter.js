// routes/auth.js
const express = require('express');
const router = express.Router();
const { totalIncome, rentsStatus, allEarnings, aboutUs, hostTotalIncome, hostPaymentList } = require('../controllers/dashboardController');
const { isValidUser } = require('../middleWares/auth');

router.get('/income', isValidUser, totalIncome);
router.get('/host-income', isValidUser, hostTotalIncome);
router.get('/host-payment-list', isValidUser, hostPaymentList);
router.get('/rent-status', isValidUser, rentsStatus);
router.get('/earnings/:all', isValidUser, allEarnings);

module.exports = router;