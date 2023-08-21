// routes/auth.js
const express = require('express');
const { signUp } = require('../controllers/userController');
const router = express.Router();

// Sign-up
router.post('/signup', signUp);

module.exports = router;
