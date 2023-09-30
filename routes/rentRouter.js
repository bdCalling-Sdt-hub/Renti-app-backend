const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { createRentRequest, acceptRentRequest, allRentRequest, getRentById, updateRentById, deleteRentById, startTrip, hostRentList, gethostRentById, userCancelRentRequest } = require('../controllers/rentController');
const router = express.Router();

const configureFileUpload = require('../middleWares/rentCarImageUploads');

const upload = configureFileUpload();

// Sign-up
router.post('/request/:carId', isValidUser, createRentRequest);
router.post('/cancel/request/:requestId', isValidUser, userCancelRentRequest);
router.post('/accept/request/:requestId', isValidUser, acceptRentRequest);
router.get('/all', isValidUser, allRentRequest);
router.get('/host-rent-list', isValidUser, hostRentList);
router.get('/host-rent/:id', isValidUser, gethostRentById);
router.get('/:id', isValidUser, getRentById);
router.patch('/:id', isValidUser, updateRentById);
router.delete('/:id', isValidUser, deleteRentById);
router.post('/trip/:requestId', upload, isValidUser, startTrip);

module.exports = router;