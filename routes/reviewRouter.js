const express = require('express');
const router = express.Router();
const { isValidUser } = require('../middleWares/auth');
const { createOrUpdate, getAll } = require('../controllers/reviewController');


router.post('/:requestId', isValidUser, createOrUpdate);
router.get('/all', isValidUser, getAll);

module.exports = router;