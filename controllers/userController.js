const emailWithNodemailer = require("../helper/email");
const User = require("../models/User");
const signUpService = require("../services/userService");


// Define a map to store user timers for sign up requests
const userTimers = new Map();

const signUp = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, gender, address, dateOfBirth, password, KYC, RFC, creaditCardNumber, imag, role } = req.body;


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
        imag, 
        role,
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
    res.status(500).json({ message: 'Error creating user', error });
  }
};



module.exports = { signUp }