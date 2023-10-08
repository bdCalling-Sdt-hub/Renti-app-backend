const express = require('express');
const { allNotifications, getNotificationDetails } = require('../controllers/notificationController');
const { isValidUser } = require('../middleWares/auth');
const router = express.Router();


//Add notification
router.get('/', isValidUser, allNotifications);
router.patch('/:id', isValidUser, getNotificationDetails);


module.exports = router;