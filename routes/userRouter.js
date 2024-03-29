// routes/auth.js
const express = require('express');
const { signUp, verifyEmail, signIn, allUsers, bannedUsers, updateUser, approveHost, changePassword, forgetPassword, verifyOneTimeCode, updatePassword, allBannedUsers, allHosts, allUsersWithTripAmount, hostKyc, allUserInfo, allBlockedUsers, blockedUsers, userActivity, hostUserList, getHostUserById, getUserById, allApprovedHosts, deleteById, logOut, adminInfo, allTrushUsers, carSoftDeleteById, userSignUp, approveUser, hostSignIn, userSignIn, userForgetPassword, hostForgetPassword } = require('../controllers/userController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();

const configureFileUpload = require('../middleWares/fileUploads');

const upload = configureFileUpload();

// User-Sign-up
router.post('/usersignup', upload, userSignUp);

// Sign-up
router.post('/signup', upload, signUp);

// verify Email
router.post('/verify', verifyEmail);

//Sign in
router.post('/sign-in', signIn);

//User Sign in
router.post('/user/sign-in', userSignIn);
//Host Sign in
router.post('/host/sign-in', hostSignIn);

// router.get('/activity', isValidUser, userActivity);

//All users
router.get('/all', isValidUser, allUsers);

router.get('/all-host', isValidUser, allHosts);

router.get('/admin-info', isValidUser, adminInfo);

// router.get('/all-approve-host', isValidUser, allApprovedHosts);

router.get('/host-user-list', isValidUser, hostUserList);

router.get('/host-user/:id', isValidUser, getHostUserById);

router.get('/user-info', isValidUser, getUserById)

router.get('/all-user-info', isValidUser, allUserInfo);

router.get('/all-user', isValidUser, allUsersWithTripAmount);

//Trash users
router.get('/trash', isValidUser, allTrushUsers);

//Banned users
router.post('/banned/:id', isValidUser, bannedUsers);

//All Banned users
router.get('/banned/all', allBannedUsers);

router.get('/blocked/all', allBlockedUsers);

router.post('/blocked/:id', isValidUser, blockedUsers);

//Update user
router.post('/update/:id', upload, isValidUser, updateUser);

//Approve host
router.post('/approve/:id', isValidUser, approveHost);

//Approve user
router.post('/approve-user/:id', isValidUser, approveUser);

// change password
router.post('/change-password', changePassword);

// Forget password
router.post('/forget-password', forgetPassword);

//User Forget password
router.post('/user/forget-password', userForgetPassword);
//User Forget password
router.post('/host/forget-password', hostForgetPassword);

// Verify otp
router.post('/verify-code', verifyOneTimeCode);

// Verify otp
router.post('/update-password', updatePassword);

router.get('/host-kyc', hostKyc)

router.delete('/delete-user/:id', isValidUser, deleteById)

router.delete('/delete-car/:id', isValidUser, carSoftDeleteById)

router.post('/logout', isValidUser, logOut)

module.exports = router;
