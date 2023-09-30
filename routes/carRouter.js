// routes/auth.js
const express = require('express');
const { createCar, getCars, getCarsById, updateById, deleteById, searchByName, allCars, allHostCars, offerCars, luxuryCars, } = require('../controllers/carController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();

const configureFileUpload = require('../middleWares/fileUploads');

const upload = configureFileUpload();

// Sign-up
router.post('/add', upload, isValidUser, createCar);

//All cars
router.get('/all', isValidUser, allCars);

//luxury Cars
router.get('/luxury', isValidUser, luxuryCars);

// Offer car
router.get('/offer', isValidUser, offerCars);

router.get('/host', isValidUser, allHostCars);

//Get single car
router.get('/:id', isValidUser, getCarsById);

//Update single car
router.post('/update/:id', upload, isValidUser, updateById);

//Delete car
router.delete('/delete/:id', isValidUser, deleteById);




module.exports = router;