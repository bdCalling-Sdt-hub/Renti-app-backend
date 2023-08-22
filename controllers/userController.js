const emailWithNodemailer = require("../helpers/email");
const User = require("../models/User");
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const signUpService = require("../services/userService");
const { createJSONWebToken } = require("../helpers/jsonWebToken");


// Define a map to store user timers for sign up requests
const userTimers = new Map();

const signUp = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, gender, address, dateOfBirth, password, KYC, RFC, creaditCardNumber, image, } = req.body;


        // Check if the user already exists
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(409).json({ message: 'User already exists! Please login' });
        }

        // Generate OTC (One-Time Code)
        const oneTimeCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        // Create the user in the database
        const user = await User.create({
            fullName,
            email,
            phoneNumber,
            gender,
            address,
            dateOfBirth,
            password,
            KYC,
            RFC,
            creaditCardNumber,
            image,
            oneTimeCode
        });

        // Clear any previous timer for the user (if exists)
        if (userTimers.has(user._id)) {
            clearTimeout(userTimers.get(user._id));
        }

        // Set a new timer for the user to reset oneTimeCode after 3 minutes
        const userTimer = setTimeout(async () => {
            try {
                user.oneTimeCode = null;
                await user.save();
                console.log(`oneTimeCode for user ${user._id} reset to null after 3 minutes`);
                // Remove the timer reference from the map
                userTimers.delete(user._id);
            } catch (error) {
                console.error(`Error updating oneTimeCode for user ${user._id}:`, error);
            }
        }, 180000); // 3 minutes in milliseconds

        // Store the timer reference in the map
        userTimers.set(user._id, userTimer);

        // Prepare email for activate user
        const emailData = {
            email,
            subject: 'Account Activation Email',
            html: `
          <h1>Hello, ${user.fullName}</h1>
          <p>Your One Time Code is <h3>${oneTimeCode}</h3> to reset your password</p>
          <small>This Code is valid for 3 minutes</small>
          `
        }

        try {
            emailWithNodemailer(emailData);
            res.status(201).json({ message: 'Thanks! Please check your E-mail to verify.' });
        } catch (emailError) {
            console.error('Failed to send verification email', emailError);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user', error });
    }
};

//Verify email
const verifyEmail = async (req, res) => {
    try {
        const { oneTimeCode, email } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            res.status(404).json({ message: 'User Not Found' });
        } else if (user.oneTimeCode === oneTimeCode) {
            user.emailVerified = true;
            user.role = 'user';
            await user.save();
            res.status(200).json({ message: 'Email veriified successfully' });
        } else {
            res.status(401).json({ message: 'Failed to verify' });
        };
    } catch (error) {
        res.status(500).json({ message: 'Error finding when verify email' });
    }
};

//Sign in user
const signIn = async (req, res) => {
    try {
        //Get email password from req.body
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        //Checking banned user
        if (user.isBanned) {
            return res.status(403).json({ message: 'User is banned! Please Contract authority' });
        }

        //Token, set the Cokkie
        //   const accessToken = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '12h' });
        const accessToken = createJSONWebToken({ _id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, '12h')
        // res.cookie('accessToken', accessToken, { maxAge: 60 * 60 * 1000, });
        // console.log('Controller Cookie:', req.cookies.accessToken);

        //Success response
        res.status(200).json({ message: 'Successfully Signed In', user, accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error signing in', error });
    }
};

//All users
const allUsers = async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.body.userId });
        const users = await User.find();
        
        if (!admin){
            res.status(404).json({ message: 'You are not authorized person' });
        }else if(admin.role === 'admin'){
            res.status(200).json({message: 'User Found Successfylly', users})
        }else if(!users ){
            res.status(404).json({message: 'User Not Found'});
        }else{
            res.status(501).json({message: 'You are not authorized to access the resources'});
        }
    } catch (error) {
        
    }
};

//Banned users
const bannedUsers = async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.body.userId });
        const user = await User.findById(req.params.id);
        if(!admin){
            res.status(404).json({ message: 'Admin not found'})
        }else if(!user){
            res.status(404).json({ message: 'User not found'});
        }else if(user.isBanned === true){
            res.status(403).json({ message: 'User is already banned'})
        }else if(admin.role === 'admin'){
            user.isBanned = true;
            await user.save();
            res.status(200).json({ message: 'User successfully banned' });
        }else{
            res.status(404).json({ message: 'You are not authorized' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error while banned user', error});
    }
};

module.exports = { signUp, verifyEmail, signIn, allUsers, bannedUsers }