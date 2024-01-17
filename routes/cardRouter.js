// routes/auth.js
const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { createCard, allCard, singleCard } = require('../controllers/cardController');
const router = express.Router();


// Sign-up
router.post('/', isValidUser, createCard);

//All cars
router.get('/hhh', isValidUser, allCard);

router.get('/', isValidUser, singleCard);

module.exports = router;