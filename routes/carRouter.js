// routes/auth.js
const express = require('express');
const { createCar, getCars, getCarsById, updateById, deleteById, searchByName, allCars, allHostCars, } = require('../controllers/carController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();

const configureFileUpload = require('../middleWares/fileUploads');

const upload = configureFileUpload();

// Sign-up
router.post('/add', upload, isValidUser, createCar);

//All cars
router.get('/all', isValidUser, allCars);

router.get('/host', isValidUser, allHostCars);

//Get single car
router.get('/:id', isValidUser, getCarsById);

//Update single car
router.post('/update/:id', isValidUser, updateById);

//Delete car
router.delete('/delete/:id', isValidUser, deleteById);

module.exports = router;