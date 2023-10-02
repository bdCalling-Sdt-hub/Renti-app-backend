const express = require('express');
const router = express.Router();
const { isValidUser } = require('../middleWares/auth');
const { createOrUpdate, getHostReview, getUserReview } = require('../controllers/reviewController');


router.post('/:requestId', isValidUser, createOrUpdate);
router.get('/hostReview', isValidUser, getHostReview);
router.get('/userReview', isValidUser, getUserReview);

module.exports = router;