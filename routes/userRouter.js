// routes/auth.js
const express = require('express');
const { signUp, verifyEmail } = require('../controllers/userController');
const router = express.Router();

// Sign-up
router.post('/signup', signUp);
router.post('/verify', verifyEmail);

module.exports = router;
