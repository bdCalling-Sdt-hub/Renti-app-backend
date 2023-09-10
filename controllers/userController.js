const emailWithNodemailer = require("../helpers/email");
const User = require("../models/User");
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const signUpService = require("../services/userService");
const { createJSONWebToken } = require("../helpers/jsonWebToken");
const Car = require("../models/Car");
const Payment = require("../models/Payment");
const Activity = require("../models/Activity");
const Rent = require("../models/Rent");


// Define a map to store user timers for sign up requests
const userTimers = new Map();


const signUp = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, gender, address, dateOfBirth, password, KYC, RFC, creaditCardNumber, ine, image, role } = req.body;

        // Check if the user already exists
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(409).json({ message: 'User already exists! Please login' });
        }

        // Generate OTC (One-Time Code)
        const oneTimeCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        const kycFileNames = [];

        if (req.files && req.files.KYC) {
            req.files.KYC.forEach((file) => {
                // Add public/uploads link to each KYC file
                const kycLink = `${req.protocol}://${req.get('host')}/public/uploads/kyc/${file.filename}`;
                kycFileNames.push(kycLink);
            });
        }

        let imageFileName = '';

        // Check if req.files.image exists and is an array
        if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
            // Add public/uploads link to the image file
            imageFileName = `${req.protocol}://${req.get('host')}/public/uploads/image/${req.files.image[0].filename}`;
        }

        // Create the user in the database
        const user = await User.create({
            fullName,
            email,
            phoneNumber,
            gender,
            address,
            dateOfBirth,
            password,
            image: imageFileName,
            KYC: kycFileNames,
            RFC,
            creaditCardNumber,
            ine,
            oneTimeCode,
            role
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
// const signIn = async (req, res) => {
//     try {
//         //Get email password from req.body
//         const { email, password } = req.body;

//         // Find the user by email
//         const user = await User.findOne({ email });
//         console.log("user", user)

//         if (!user) {
//             return res.status(401).json({ message: 'Authentication failed' });
//         }

//         // Compare the provided password with the stored hashed password
//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         console.log("object", isPasswordValid)

//         if (!isPasswordValid) {
//             return res.status(401).json({ message: 'Authentication failed' });
//         }

//         //Checking banned user
//         if (user.isBanned) {
//             return res.status(403).json({ message: 'User is banned! Please Contract authority' });
//         }

//         //Token, set the Cokkie
//         //   const accessToken = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '12h' });
//         const accessToken = createJSONWebToken({ _id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, '12h')
//         // res.cookie('accessToken', accessToken, { maxAge: 60 * 60 * 1000, });
//         // console.log('Controller Cookie:', req.cookies.accessToken);

//         //Success response
//         res.status(200).json({ message: 'Successfully Signed In', user, accessToken });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error signing in', error });
//     }
// };
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
        if (user.isBanned === "true") {
            return res.status(403).json({ message: 'User is banned! Please Contract authority' });
        }


        function getBrowserInfo(userAgent) {
            const ua = userAgent.toLowerCase();

            if (ua.includes('firefox')) {
                return 'Firefox';
            } else if (ua.includes('edg')) {
                return 'Edge';
            } else if (ua.includes('safari') && !ua.includes('chrome')) {
                return 'Safari';
            } else if (ua.includes('opr') || ua.includes('opera')) {
                return 'Opera';
            } else if (ua.includes('chrome')) {
                return 'Chrome';
            } else {
                return 'Unknown'; // Default to 'Unknown' if the browser is not recognized
            }
        }


        //Get OS and device name or model from request headers
        const os = req.headers['user-agent'];
        const deviceNameOrModel = req.headers['user-agent'];
        const userAgent = req.get('user-agent');
        const browser = getBrowserInfo(userAgent);

        //Token, set the Cokkie
        //   const accessToken = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '12h' });
        const accessToken = createJSONWebToken({ _id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, '12h')
        // res.cookie('accessToken', accessToken, { maxAge: 60  60  1000, });
        // console.log('Controller Cookie:', req.cookies.accessToken);

        const activity = await Activity.create({
            operatingSystem: os,
            browser,
            deviceModel: deviceNameOrModel,
            userId: user._id
        });

        //Success response
        res.status(200).json({ message: 'Successfully Signed In', user, accessToken });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error signing in', error });
    }
};


const userActivity = async (req, res) => {
    try {
        const activity = await Activity.find({});
        const user = User.findById(req.body.userId);
        if (user.role !== 'admin') {
            res.status(200).json({ message: 'Activity of all users', activity });
        } else {
            res.status(401).json({ message: 'You are not authorized' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error retriving activity' })
    }
}


//All users
const allUsers = async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.body.userId });
        // const users = await User.find();

        const userTypes = req.params.filter;
        const search = req.query.search || '';
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchRegExp = new RegExp('.*' + search + '.*', 'i');
        const filter = {
            $or: [
                { fullName: { $regex: searchRegExp } },
                { email: { $regex: searchRegExp } },
                { phoneNumber: { $regex: searchRegExp } },
                { address: { $regex: searchRegExp } },
            ]
        }

        const users = await User.find(filter).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 });
        const count = await User.countDocuments(filter);

        if (!admin) {
            return res.status(404).json({ message: 'You are not authorized person' });
        } else if (admin.role === 'admin') {
            return res.status(200).json({
                message: 'User Found Successfylly',
                users,
                pagination: {
                    totalDocuments: count,
                    totalPage: Math.ceil(count / limit),
                    currentPage: page,
                    previousPage: page - 1 > 0 ? page - 1 : null,
                    nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
                }
            })
        } else if (!users) {
            return res.status(404).json({ message: 'User Not Found' });
        } else {
            res.status(501).json({
                message: 'You are not authorized to access the resources',
            });
        }
    } catch (error) {
        res.status(500).json({ message: "User Retrieved Error" })
    }
};

// All Host
const allHosts = async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.body.userId });
        console.log(admin);

        if (!admin) {
            return res.status(404).json({ message: 'You are not an authorized person' });
        }

        if (admin.role !== 'admin') {
            return res.status(404).json({ message: 'You are not an admin' });
        }

        const allHostsQuery = User.find({ role: "host" });

        const search = req.query.search || '';
        if (search) {
            allHostsQuery.or([
                { fullName: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                { email: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                { phoneNumber: { $regex: new RegExp('.*' + search + '.*', 'i') } }
            ]);
        }

        const allHosts = await allHostsQuery;

        const carList = await Car.find({}); // Fetch all cars

        const hostCarCounts = {}; // Create an object to store host car counts

        for (const car of carList) {
            if (hostCarCounts[car.carOwner]) {
                hostCarCounts[car.carOwner]++;
            } else {
                hostCarCounts[car.carOwner] = 1;
            }
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedHosts = allHosts.slice(startIndex, endIndex);
        const hostData = paginatedHosts.map(host => ({
            carCount: hostCarCounts[host._id] || 0,
            host,
        }));

        res.status(200).json({
            message: "Host Data Retrieved Successfully",
            hostData,
            pagination: {
                totalHosts: allHosts.length,
                totalPage: Math.ceil(allHosts.length / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(allHosts.length / limit) ? page + 1 : null,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "All Hosts Retrieving Failed" });
    }
};

// Host User List
const hostUserList = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'host') {
            return res.status(403).json({ message: 'You are not authorized' });
        }

        // Find cars owned by the host user
        const ownedCars = await Car.find({ carOwner: user._id });

        // Find cars rented by the host user
        const rentedCars = await Rent.find({ hostId: user._id }).populate('userId');

        return res.status(200).json({
            message: 'Host user car and rented car lists retrieved successfully',
            // ownedCars,
            userList: rentedCars,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve host user's cars" });
    }
};

// Single Host User
const getHostUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const host = await Rent.findById(id);
        if (!host) {
            res.status(404).json({ message: 'User not found', error });
        }
        console.log("ggg", host);
        console.log(req.body.userId);

        const rent = await Rent.findOne({ _id: host._id }).populate('userId');
        console.log("gfyhusedgiyh", rent.userId)

        if (!rent) {
            res.status(404).json({ message: 'User Not Found' })
        }
        res.status(200).json({
            message: "User retrieved successfully",
            userDetails: rent.userId
        })
    }
    catch (err) {
        // console.log(err);
        res.status(500).json({
            message: err.message
        })
    }
};


const allUserInfo = async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.body.userId });
        console.log(admin);

        if (!admin) {
            return res.status(404).json({ message: 'You are not an authorized person' });
        }

        if (admin.role !== 'admin') {
            return res.status(404).json({ message: 'You are not an admin' });
        }

        const allUsersQuery = User.find({ role: "user" });

        const search = req.query.search || '';
        if (search) {
            allUsersQuery.where('fullName').regex(new RegExp('.*' + search + '.*', 'i'));
        }

        const allUsers = await allUsersQuery;

        const carList = await Car.find({}); // Fetch all cars

        const hostCarCounts = {}; // Create an object to store host car counts

        for (const car of carList) {
            if (hostCarCounts[car.carOwner]) {
                hostCarCounts[car.carOwner]++;
            } else {
                hostCarCounts[car.carOwner] = 1;
            }
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedHosts = allUsers.slice(startIndex, endIndex);
        const userData = paginatedHosts.map(user => ({
            user,
        }));

        res.status(200).json({
            message: "User Data Retrieved Successfully",
            userData,
            pagination: {
                totalUsers: allUsers.length,
                totalPage: Math.ceil(allUsers.length / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(allUsers.length / limit) ? page + 1 : null,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "All Hosts Retrieving Failed" });
    }
};

// All User With Trip Amount
const allUsersWithTripAmount = async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.body.userId });

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to access this data' });
        }

        const search = req.query.search || '';
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const filter = {
            role: "user",
            // fullName: { $regex: new RegExp('.*' + search + '.*', 'i') },
            // email: { $regex: new RegExp('.*' + search + '.*', 'i') }
            $or: [
                { fullName: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                { email: { $regex: new RegExp('.*' + search + '.*', 'i') } },
            ],
        };

        const totalCount = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const allUsers = await User.find(filter).skip(startIndex).limit(limit).sort({ createdAt: -1 });
        console.log("object", allUsers);

        const usersWithTripAmount = await Promise.all(allUsers.map(async user => {
            const payments = await Payment.find({ userId: user._id });
            const totalTripAmount = payments.reduce((total, payment) => total + payment.paymentData.amount, 0);
            return {
                totalTripAmount: totalTripAmount,
                user
            };
        }));

        res.status(200).json({
            message: "User Data Retrieved Successfully",
            usersWithTripAmount,
            pagination: {
                totalUsers: totalCount,
                totalPages: totalPages,
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= totalPages ? page + 1 : null,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "User Data Retrieving Failed" });
    }
};

//Banned users
const bannedUsers = async (req, res) => {
    try {
        // Step 1: Fetch the admin and user information
        const { isApprove } = req.body;
        const adminId = req.body.userId;
        const admin = await User.findOne({ _id: adminId });
        const userId = req.params.id;
        const user = await User.findById(userId);

        // Step 2: Check if admin and user exist
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Step 3: Check if user is already banned
        // if (user.isBanned === true) {
        //     return res.status(403).json({ message: 'User is already banned' });
        // }

        // Step 4: Check if the requester is an admin
        if (admin.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized' });
        }

        if (isApprove === "approve") {
            user.isBanned = "false";
            await user.save();
        } else if (isApprove === "cancel") {
            user.isBanned = 'true';
            await user.save();
        }
        else if (isApprove === "trash") {
            user.isBanned = 'trash';
            await user.save();
        }

        // Step 5: Ban the user




        // Step 6: Respond with success message
        res.status(200).json({ message: `User ${isApprove} Successfully` });
    } catch (error) {
        // Step 7: Handle errors
        res.status(500).json({ message: 'Error while banning user', error });
    }
};

// All Banned Users
const allBannedUsers = async (req, res) => {
    try {
        const bannedUsers = await User.find({ isBanned: "true" });

        res.status(200).json({ message: 'Banned User Retrieve Successfully', bannedUsers });
    } catch (error) {
        res.status(500).json({ message: 'Error while fetching banned users', error });
    }
}

//Update user
const updateUser = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, gender, address, dateOfBirth, password, KYC, RFC, creaditCardNumber, image } = req.body;
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user already exists
        const userExist = await User.findOne({ email });
        if (userExist && userExist._id.toString() !== id) {
            return res.status(409).json({ message: 'User already exists! Please login' });
        }

        if (user._id.toString() === req.body.userId) {
            user.fullName = fullName;
            user.email = email;
            user.phoneNumber = phoneNumber;
            user.gender = gender;
            user.address = address;
            // user.password = user.password;
            user.dateOfBirth = dateOfBirth;
            user.KYC = KYC;
            user.RFC = RFC;
            user.creaditCardNumber = creaditCardNumber;
            user.image = image;
            await user.save();
            return res.status(200).json({ message: 'User updated successfully', user });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating user' });
    }
};

const allBlockedUsers = async (req, res) => {
    try {
        const blockedUsers = await User.find({ isBlock: true });

        res.status(200).json({ message: 'Blocked User Retrieve Successfully', blockedUsers });
    } catch (error) {
        res.status(500).json({ message: 'Error while fetching blocked users', error });
    }
}

const blockedUsers = async (req, res) => {
    try {
        // Step 1: Fetch the admin and user information
        const { isBlocked } = req.body;
        const adminId = req.body.userId;
        const admin = await User.findOne({ _id: adminId });
        const userId = req.params.id;
        const user = await User.findById(userId);

        // Step 2: Check if admin and user exist
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Step 3: Check if user is already banned
        // if (user.isBanned === true) {
        //     return res.status(403).json({ message: 'User is already banned' });
        // }

        // Step 4: Check if the requester is an admin
        if (admin.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized' });
        }

        if (isBlocked === "approve") {
            user.isBlock = "false";
            await user.save();
        } else if (isBlocked === "cancel") {
            user.isBlock = 'true';
            await user.save();
        }

        // Step 5: Ban the user




        // Step 6: Respond with success message
        res.status(200).json({ message: `User ${isApprove} Successfully` });
    } catch (error) {
        // Step 7: Handle errors
        res.status(500).json({ message: 'Error while banning user', error });
    }
};

//Approve host
const approveHost = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({ _id: id, role: 'host' });
        const admin = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'Host not found' });
        }

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        } else if (admin.role === 'admin') {
            user.approved = true;
            await user.save();
            return res.status(200).json({ message: 'Host approved successfully' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to approve Host' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating user' });
    }
};

// Change Password
const changePassword = async (req, res) => {
    const { email, currentPassword, newPassword, reTypedPassword } = req.body;
    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        if (newPassword !== reTypedPassword) {
            return res.status(400).json({ message: 'New password and re-typed password do not match' });
        }

        user.password = newPassword;
        await user.save()

        console.log(user)

        res.status(200).json({
            message: 'Password changed successfully',
            user
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'An error occurred' });
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        console.log(email)

        // Check if the user already exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Generate OTC (One-Time Code)
        const oneTimeCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        // Store the OTC and its expiration time in the database
        user.oneTimeCode = oneTimeCode;
        await user.save();

        // Prepare email for password reset
        const emailData = {
            email,
            subject: 'Password Reset Email',
            html: `
        <h1>Hello, ${user.fullName}</h1>
        <p>Your One Time Code is <h3>${oneTimeCode}</h3> to reset your password</p>
        <small>This Code is valid for 3 minutes</small>
      `
        }

        // Send email
        try {
            await emailWithNodemailer(emailData);
        } catch (emailError) {
            console.error('Failed to send verification email', emailError);
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

        res.status(201).json({ message: 'Sent One Time Code successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending mail', error });
    }
};

//Verify one time code
const verifyOneTimeCode = async (req, res) => {
    try {
        const { email } = req.headers;
        const { oneTimeCode } = req.body;
        console.log(req.body.oneTimeCode);
        console.log(email);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(40).json({ message: 'User not found' });
        } else if (user.oneTimeCode === oneTimeCode) {
            res.status(200).json({ success: true, message: 'User verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to verify user' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifiying mail', error });
    }
};

//Update password without login
const updatePassword = async (req, res) => {
    try {
        const { email } = req.headers;
        console.log(req.body.password);
        console.log(email);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        } else {
            user.password = req.body.password;
            await user.save();
            res.status(200).json({ message: 'Password updated successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error });
    }
};

const hostKyc = async (req, res) => {
    try {

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Error ' })
    }
}

const deleteById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(req.body.userId);
        const rent = await Rent.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        } else if (user._id.equals(rent.userId)) {
            await rent.deleteOne();
            res.status(200).json({ message: 'Rent deleted successfully' });
        } else {
            res.status(403).json({ message: 'You are not authorized to delete this Rent' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting Rent' });
    }
};

module.exports = { signUp, verifyEmail, signIn, allUsers, bannedUsers, allBannedUsers, updateUser, approveHost, changePassword, forgetPassword, verifyOneTimeCode, updatePassword, allHosts, allUsersWithTripAmount, hostKyc, allUserInfo, allBlockedUsers, blockedUsers, userActivity, hostUserList, getHostUserById, deleteById };