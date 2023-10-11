const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');

const isValidUser = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        console.log(authorization);
        let token;
        let activity;
        let decodedData;
        if (authorization && authorization.startsWith("Bearer")) {
            token = authorization.split(" ")[1];
            console.log(token);
            decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
            console.log(decodedData);
            if (decodedData.role === 'admin' && decodedData.activityId !== null) {
                activity = await Activity.findById(decodedData.activityId)
            }
        }
        if (decodedData.role === 'admin' && activity === null) {
            return res.status(401).json({ status: 'Unauthorised', statusCode: '401', type: 'auth', message: 'You are not authorised to sign in now' });
        }
        else if (!authorization) {
            return res.status(403).json({ error: 'Unauthorized' });
        } else if (!decodedData) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        req.body.userId = decodedData._id;
        next();
    } catch (error) {
        console.log("Middleware Error", error.message)
        return res.status(500).json({ message: "Invalid User" });

    }
};


module.exports = { isValidUser };