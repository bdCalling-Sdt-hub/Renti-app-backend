// routes/auth.js
const express = require('express');
const { signUp, verifyEmail, signIn, allUsers, bannedUsers, updateUser, approveHost, changePassword, forgetPassword, verifyOneTimeCode, updatePassword, allBannedUsers, allHosts, allUsersWithTripAmount } = require('../controllers/userController');
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

router.get('/all-host', isValidUser, allHosts);

router.get('/all-user', isValidUser, allUsersWithTripAmount);

//Banned users
router.post('/banned/:id', isValidUser, bannedUsers);

//All Banned users
router.get('/banned/all', allBannedUsers);

//Update user
router.post('/update/:id', isValidUser, updateUser);

//Approve host
router.post('/approve/:id', isValidUser, approveHost);

// change password
router.post('/change-password', changePassword);

// Forget password
router.post('/forget-password', forgetPassword);

// Verify otp
router.post('/verify-code', verifyOneTimeCode);

// Verify otp
router.post('/update-password', updatePassword);


module.exports = router;
