// routes/auth.js
const express = require('express');
const router = express.Router();
const { totalIncome, rentsStatus, allEarnings, aboutUs } = require('../controllers/dashboardController');
const { isValidUser } = require('../middleWares/auth');

router.get('/income', isValidUser, totalIncome);
router.get('/rent-status', isValidUser, rentsStatus);
router.get('/earnings/:all', isValidUser, allEarnings);

module.exports = router;