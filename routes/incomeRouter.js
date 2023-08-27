// routes/auth.js
const express = require('express');
const router = express.Router();
const { totalIncome } = require('../controllers/incomeController');
const { isValidUser } = require('../middleWares/auth');

router.get('/', isValidUser, totalIncome);

module.exports = router;