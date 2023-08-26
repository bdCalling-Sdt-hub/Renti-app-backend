const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { createRentRequest, acceptRentRequest, allRentRequest, getRentById } = require('../controllers/rentController');
const router = express.Router();

// Sign-up
router.post('/request/:carId', isValidUser, createRentRequest);
router.post('/accept/request/:requestId', isValidUser, acceptRentRequest);
router.get('/all', isValidUser, allRentRequest);
router.get('/:id', getRentById);

module.exports = router;