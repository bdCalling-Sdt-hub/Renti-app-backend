// routes/auth.js
const express = require('express');

const { isValidUser } = require('../middleWares/auth');
const { income } = require('../controllers/incomeController');
const router = express.Router();

// Sign-up
router.get('/', income);




module.exports = router;
