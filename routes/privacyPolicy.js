const express = require('express');
const router = express.Router();
const { isValidUser } = require('../middleWares/auth');
const { getAll, createOrUpdate } = require('../controllers/privacyPolicy');


router.post('/create', isValidUser, createOrUpdate);
router.get('/all', isValidUser, getAll);

module.exports = router;