// routes/auth.js
const express = require('express');
const { signUp, verifyEmail, signIn } = require('../controllers/userController');
const router = express.Router();

// Sign-up
router.post('/signup', signUp);
router.post('/verify', verifyEmail);
router.post('/sign-in', signIn);

module.exports = router;
