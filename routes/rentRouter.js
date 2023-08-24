const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const {createRentRequest,acceptRentRequest} = require('../controllers/rentController');
const router = express.Router();

// Sign-up
router.post('/request/:carId', isValidUser, createRentRequest);
router.post('/accept/request/:requestId', isValidUser, acceptRentRequest);

module.exports = router;