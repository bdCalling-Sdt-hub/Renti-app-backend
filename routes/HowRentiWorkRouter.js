const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { createOrUpdate, getAll } = require('../controllers/HowRentiWork');
const router = express.Router();


router.post('/create', isValidUser, createOrUpdate);
router.get('/', isValidUser, getAll);

module.exports = router;