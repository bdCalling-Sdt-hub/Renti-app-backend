// routes/auth.js
const express = require('express');
const { createCar, getCars, getCarsById, updateById, deleteById, searchByName, allCars, allHostCars, offerCars, luxuryCars, approveCar, activeCar, allReqCars, allCarsKyc, bannedCar, allBannedCars, allTrushCar, } = require('../controllers/carController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();

const configureFileUpload = require('../middleWares/carfileUploads');

const upload = configureFileUpload();

// Sign-up
router.post('/add', upload, isValidUser, createCar);

//Approve Car
router.post('/approve-car/:id', isValidUser, approveCar);

//Active Car
router.post('/active-car/:id', isValidUser, activeCar);

//Trash car
router.get('/trash', isValidUser, allTrushCar);

//All cars
router.get('/all', allCars); //isValidUser

router.get('/all-car-kyc', allCarsKyc); //isValidUser

//All cars
router.get('/all-req', allReqCars);

//luxury Cars
router.get('/luxury', luxuryCars); //isValidUser,

// Offer car
router.get('/offer', offerCars); ///isValidUser,

router.get('/host', isValidUser, allHostCars);

//Get single car
router.get('/:id', getCarsById);//isValidUser,

//Update single car
router.post('/update/:id', upload, isValidUser, updateById);

//Delete car
router.delete('/delete/:id', isValidUser, deleteById);

//Banned Car
router.post('/banned/:id', isValidUser, bannedCar);

//All Banned cars
router.get('/banned/all', allBannedCars);






module.exports = router;