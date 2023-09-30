const express = require('express');
const router = express.Router();


router.post('/create', isValidUser, createOrUpdate);
router.get('/all', isValidUser, getAll);

module.exports = router;