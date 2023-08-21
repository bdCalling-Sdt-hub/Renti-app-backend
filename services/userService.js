const User = require("../models/User");

const signUpService = async (data) => {
    let newUser = new User(data);
    return await newUser.save();
};

module.exports = signUpService;