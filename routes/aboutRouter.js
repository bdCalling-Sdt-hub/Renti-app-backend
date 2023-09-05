const express = require('express');
const router = express.Router();
const { createOrUpdate, getAll } = require("../controllers/aboutController");
const { isValidUser } = require('../middleWares/auth');


router.post('/create', isValidUser, createOrUpdate);
router.get('/all', isValidUser, getAll);

module.exports = router;