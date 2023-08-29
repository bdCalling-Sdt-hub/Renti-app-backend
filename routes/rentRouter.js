const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { createRentRequest, acceptRentRequest, allRentRequest, getRentById, updateRentById, deleteRentById, startTrip } = require('../controllers/rentController');
const router = express.Router();

// Sign-up
router.post('/request/:carId', isValidUser, createRentRequest);
router.post('/accept/request/:requestId', isValidUser, acceptRentRequest);
router.get('/all', isValidUser, allRentRequest);
router.get('/:id', isValidUser, getRentById);
router.patch('/:id', isValidUser, updateRentById);
router.delete('/:id', isValidUser, deleteRentById);
router.post('/trip/:requestId', isValidUser, startTrip);

module.exports = router;