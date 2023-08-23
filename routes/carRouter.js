// routes/auth.js
const express = require('express');
const { createCar, getCars, getCarsById, updateById, deleteById, searchByName, } = require('../controllers/carController');
const router = express.Router();

// Sign-up
router.post('/', createCar);
router.get('/', getCars);
router.get('/:id', getCarsById);
router.patch('/:id', updateById);
router.delete('/:id', deleteById);
router.get('/filter/car', searchByName);

module.exports = router;