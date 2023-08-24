// routes/auth.js
const express = require('express');
const router = express.Router();
const { isValidUser } = require('../middleWares/auth');
const { payment, payPage } = require('../controllers/paymentController');

// Sign-up
router.post('/', payment);

module.exports = router;