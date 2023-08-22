// routes/auth.js
const express = require('express');
const { signUp, verifyEmail, signIn, allUsers } = require('../controllers/userController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();

// Sign-up
router.post('/signup', signUp);

// verify Email
router.post('/verify', verifyEmail);

//Sign in
router.post('/sign-in', signIn);

//All users
router.get('/all', isValidUser, allUsers);

module.exports = router;
