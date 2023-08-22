const emailWithNodemailer = require("../helper/email");
const User = require("../models/User");
const signUpService = require("../services/userService");


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

      // Send email
      try {
        emailWithNodemailer(emailData);
        res.status(201).json({ message: 'Thanks! Please check your E-mail to verify.' });
      } catch (emailError) {
        console.error('Failed to send verifiaction email', emailError);
      }

      // Set a timeout to update the oneTimeCode to null after 1 minute
      setTimeout(async () => {
        try {
          user.oneTimeCode = null;
          await user.save();
          console.log('oneTimeCode reset to null after 3 minute');
        } catch (error) {
          console.error('Error updating oneTimeCode:', error);
        }
      }, 180000); // 3 minute in milliseconds

    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error });
    }
  };


module.exports = { signUp }