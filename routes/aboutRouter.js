const express = require('express');
const router = express.Router();
const { createOrUpdateAboutUs, getAboutUs } = require("../controllers/aboutController");


router.post('/create', createOrUpdateAboutUs);
router.get('/about-us', getAboutUs);

module.exports = router;