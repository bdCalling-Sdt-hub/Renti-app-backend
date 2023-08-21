const signUpService = require("../services/userService");

const signUp = async (req, res) => {
    try{
        const newUser = await signUpService(req.body);
        console.log(newUser);
        return res.status(200).json({ "message": "User Created Successfully", newUser }); // wrap data in object to avoid confusion
    }
    catch(error){
        return res.status(500).json({"message": "Failed to create user", error: error});
    }
};

module.exports = { signUp }