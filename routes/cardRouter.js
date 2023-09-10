// routes/auth.js
const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { createCard, allCard } = require('../controllers/cardController');
const router = express.Router();


// Sign-up
router.post('/', isValidUser, createCard);

//All cars
router.get('/', isValidUser, allCard);

module.exports = router;