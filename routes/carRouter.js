// routes/auth.js
const express = require('express');
const { createCar, getCars, getCarsById, updateById, deleteById, searchByName, allCars, } = require('../controllers/carController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();

// Sign-up
router.post('/add', isValidUser, createCar);

//All cars
router.get('/all', isValidUser, allCars);

//Get single car
router.get('/:id', getCarsById);
//Update single car
router.put('/update/:id', isValidUser, updateById);

//Delete car
router.delete('/delete/:id', isValidUser, deleteById);

module.exports = router;