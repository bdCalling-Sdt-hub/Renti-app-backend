const express = require('express');
const { isValidUser } = require('../middleWares/auth');
const { allActivity, deleteActivity } = require('../controllers/activityContoller');
const router = express.Router();


router.get('/', isValidUser, allActivity);
router.delete('/:id', isValidUser, deleteActivity);


module.exports = router;