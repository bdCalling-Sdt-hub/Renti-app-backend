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
const Card = require("../models/Card");
const Review = require("../models/Review");
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');


// Define a map to store user timers for sign up requests
const userTimers = new Map();


const userSignUp = async (req, res, next) => {
    try {
        const { fullName, email, phoneNumber, gender, address, dateOfBirth, password, KYC, RFC, creaditCardNumber, ine, image, role } = req.body;

        console.log(req.body);

        // Check if the user already exists
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(409).json({ message: 'User already exists! Please login' });
        }

        // Generate OTC (One-Time Code)
        const oneTimeCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        const kycFileNames = [];
        console.log(req.files.KYC)

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
            console.log(emailData)
            return res.status(201).json({ message: 'Thanks! Please check your E-mail to verify.' });
        } catch (emailError) {
            console.error('Failed to send verification email', emailError);
        }
    } catch (error) {
        next(error);
        // return res.status(500).json({ message: 'Error creating user', error });
    }
};



const signUp = async (req, res, next) => {
    const bankInfo = JSON.parse(req.body.bankInfo)
    const address = JSON.parse(req.body.address)

    console.log("BA", bankInfo)
    console.log("ADD", address)
    try {
        const {
            fullName,
            email,
            phoneNumber, // Add phoneNumber to the request body
            gender,
            address,
            dateOfBirth,
            password,
            KYC,
            RFC,
            creditCardNumber, // Correct the variable name to creditCardNumber
            ine,
            image,
            bankInfo,
            role,
        } = req.body;

        console.log("BOdy", req.body)

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

        console.log("Kyc", req.files.KYC[0].path);

        // Check if req.files.image exists and is an array
        if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
            // Add public/uploads link to the image file
            imageFileName = `${req.protocol}://${req.get('host')}/public/uploads/image/${req.files.image[0].filename}`;
        }
        // console.log(imageFileName)
        // Create the user in the database
        const user = await User.create({
            fullName,
            email,
            phoneNumber, // Include phoneNumber
            gender,
            address,
            dateOfBirth,
            password,
            image: imageFileName,
            KYC: kycFileNames,
            RFC,
            creditCardNumber, // Corrected variable name
            ine,
            oneTimeCode,
            role,
            bankInfo
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
          `,
        };


        const dateComponents = dateOfBirth.split("/");

        const day = parseInt(dateComponents[0]);
        const month = parseInt(dateComponents[1]);
        const year = parseInt(dateComponents[2]);

        const fileUpload = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: fs.readFileSync(req.files.KYC[0].path),
                name: req.files.KYC[0].filename, // Replace with the actual file name
                type: req.files.KYC[0].mimetype, // Replace with the actual file type
            },
        });

        const backFileUpload = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: fs.readFileSync(req.files.KYC[0].path),
                name: req.files.KYC[0].filename, // Replace with the actual file name
                type: req.files.KYC[0].mimetype, // Replace with the actual file type
            },
        });

        // Get the file IDs from the uploads
        const frontFileId = fileUpload.id;
        const backFileId = backFileUpload.id;


        console.log("fb", frontFileId, backFileId)


        const account = await stripe.accounts.create({
            country: 'MX',
            type: 'custom',
            business_type: 'individual',
            email: email,
            // external_account: 'btok_1O4dT0Jb9nyriLWow9TwyDTZ',
            tos_acceptance: {
                service_agreement: 'recipient',
                ip: req.ip,
                date: Math.floor(new Date().getTime() / 1000)
            },
            business_profile: {
                mcc: '7512',
                name: fullName,
                product_description: 'Your business description',
                support_address: {
                    city: 'Mexico City',
                    country: 'MX',
                    line1: 'Mexico',
                    line2: 'Mexico',
                    postal_code: '22056',
                    state: 'Aguascalientes',
                },
            },
            company: {
                address: {
                    city: 'Mexico',
                    country: 'MX',
                    line1: 'Mexico',
                    line2: 'Mexico',
                    postal_code: '22056',
                    state: 'Aguascalientes',
                },
            },
            individual: {
                dob: {
                    day: day,
                    month: month,
                    year: year,
                },
                email: email,
                first_name: fullName,
                last_name: ' ',
                id_number: ine,
                phone: phoneNumber,
                address: {
                    city: req.body.address.city,
                    country: req.body.address.country,
                    line1: req.body.address.line1,
                    postal_code: req.body.address.postal_code,
                    state: req.body.address.state,
                },
                verification: {
                    document: {
                        front: frontFileId, // Replace with the actual file path
                        back: backFileId, // Replace with the actual file path
                    },
                },
            },
            // settings: {
            //     branding: {
            //         primary_color: '#000000',
            //         secondary_color: '#ffffff',
            //         logo: frontFileId, // Replace with the URL to your business logo
            //         icon: frontFileId, // Replace with the URL to your business icon
            //     },
            // },
            capabilities: {
                transfers: {
                    requested: true,
                },
            },
            external_account: {
                object: 'bank_account',
                country: 'MX',
                currency: 'mxn',
                account_holder_name: req.body.bankInfo.account_holder_name,
                account_holder_type: req.body.bankInfo.account_holder_type,
                account_number: req.body.bankInfo.account_number,
            },
        });


        console.log('stripeConnectAccount', account);
        user.stripeConnectAccountId = account.id;
        await user.save();

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: 'https://example.com/reauth',
            return_url: 'https://example.com/return',
            type: 'account_onboarding',
            collect: 'eventually_due'
        });


        console.log('accountLink', accountLink);



        try {
            emailWithNodemailer(emailData);
            console.log(emailData);
            return res.status(201).json({ message: 'Thanks! Please check your E-mail to verify.' });
        } catch (emailError) {
            console.error('Failed to send verification email', emailError);
        }
    } catch (error) {
        next(error);
        // return res.status(500).json({ message: 'Error creating user', error });
    }
};

// Verify email
const verifyEmail = async (req, res, next) => {
    try {
        const { oneTimeCode, email } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            res.status(404).json({ message: 'User Not Found' });
        } else if (user.oneTimeCode === oneTimeCode) {
            user.emailVerified = true;
            if (user.role === 'host') {
                user.role = 'host';
            }

            if (user.role === 'user') {
                user.role = 'user';
            }
            // user.role = 'user';
            await user.save();
            res.status(200).json({ message: 'Email veriified successfully' });
        } else {
            res.status(401).json({ message: 'Failed to verify' });
        };
    } catch (error) {
        next(error)
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


const signIn = async (req, res, next) => {
    try {
        // Get email and password from req.body
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

        // Checking banned user
        if (user.isBanned === "true") {
            return res.status(403).json({ message: 'User is banned! Please contact the authority' });
        }



        let activityId = null
        if (user.role === 'admin') {
            function extractDeviceModel(userAgent) {
                const regex = /\(([^)]+)\)/;
                const matches = userAgent.match(regex);

                if (matches && matches.length >= 2) {
                    return matches[1];
                } else {
                    return 'Unknown';
                }
            }

            const userA = req.headers['user-agent'];

            const deviceModel = extractDeviceModel(userA);


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
                    return 'Unknown';
                }
            }
            // const deviceNameOrModel = req.headers['user-agent'];
            const userAgent = req.get('user-agent');
            const browser = getBrowserInfo(userAgent);
            const activity = await Activity.create({
                operatingSystem: deviceModel,
                browser,
                userId: user._id
            });
            console.log(activity)
            activityId = activity._id
        }

        //Token, set the Cokkie
        const accessToken = jwt.sign({ _id: user._id, email: user.email, role: user.role, activityId: activityId }, process.env.JWT_SECRET_KEY, { expiresIn: '12h' });


        //Success response
        res.status(200).json({ message: 'Successfully Signed In', user, accessToken });



    } catch (error) {
        next(error)
    }
};


// const userActivity = async (req, res, next) => {
//     try {
//         const activity = await Activity.find({});
//         const user = User.findById(req.body.userId);
//         if (user.role !== 'admin') {
//             res.status(200).json({ message: 'Activity of all users', activity });
//         } else {
//             res.status(401).json({ message: 'You are not authorized' });
//         }

//     } catch (error) {
//         next(error)
//     }
// }


//All users
const allUsers = async (req, res, next) => {
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
            res.status(404).json({ message: 'User Not Found' });
        } else {
            res.status(501).json({
                message: 'You are not authorized to access the resources',
            });
        }
    } catch (error) {
        next(error)
    }
};

// All Trush Users
const allTrushUsers = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        // Calculate the skip value based on the page number and limit
        // const skip = (page - 1) * limit;

        const trashUsers = await User.find({ isBanned: "trash" })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await User.countDocuments(User.find({ isBanned: "trash" }));
        console.log(count)
        console.log(trashUsers.length)

        res.status(200).json({
            message: 'Trash User Retrieve Successfully',
            trashUsers,
            pagination: {
                totalDocuments: count,
                totalPage: Math.ceil(count / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
                // totalDocuments: count,
                // currentPage: page,
                // totalPages: Math.ceil(count / limit), // Calculate total pages based on the result count and limit
                // totalUsers: trashUsers.length,
                // limit: limit
            }

        });
    } catch (error) {
        next(error);
    }
}

const getUserById = async (req, res, next) => {
    try {

        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User retrieved successfully', user })
    } catch (err) {
        next(error)
    }
};

// All Host
const allHosts = async (req, res, next) => {
    try {

        const admin = await User.findOne({ _id: req.body.userId });

        if (!admin) {
            return res.status(404).json({ message: 'You are not an authorized person' });
        }

        if (admin.role !== 'admin') {
            return res.status(404).json({ message: 'You are not an admin' });
        }

        const allHostsQuery = User.find({ role: "host" });


        let searchFilter;
        const search = req.query.search || '';
        if (search) {
            console.log(search)
            searchFilter = {
                $or: [
                    { fullName: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                    { email: { $regex: new RegExp('.*' + search + '.*', 'i') } },
                    { phoneNumber: { $regex: new RegExp('.*' + search + '.*', 'i') } }
                ]
            };

            allHostsQuery.and([searchFilter]);
        }

        const approve = req.query.approve
        const isBanned = req.query.isBanned

        let allHosts = await allHostsQuery;

        if (approve === "true" && isBanned === "false") {
            allHosts = await User.find({ role: "host", approved: true, ...searchFilter, isBanned: false });
            const carCount = await User.countDocuments({ approved: true, ...searchFilter })

            // return res.status(200).json({ message: 'Apoprove user retrived successfully', hostData })
        }
        if (approve === "false") {
            allHosts = await User.find({ role: "host", approved: false, ...searchFilter });
            const carCount = await User.countDocuments({ approved: true, ...searchFilter })

            // return res.status(200).json({ message: 'Apoprove user retrived successfully', hostData })
        }


        const rentList = await Rent.find({});
        console.log(rentList)

        const cardList = await Card.find({});
        const hostCardData = {};

        // Iterate through the cardList and associate cards with their hosts
        for (const card of cardList) {
            const hostId = card.addedBy; // Adjust this to match your Card schema
            if (!hostCardData[hostId]) {
                hostCardData[hostId] = [];
            }
            hostCardData[hostId].push(card);
        }


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

        let hostData;
        hostData = paginatedHosts.map(host => ({
            carCount: hostCarCounts[host._id] || 0,
            host,
        }));

        hostData = paginatedHosts.map(host => ({
            carCount: hostCarCounts[host._id] || 0,
            host,
            cards: hostCardData[host._id] || [], // Attach card data to the host
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
        next(error)
    }
};

// Admin info
const adminInfo = async (req, res, next) => {
    try {
        const host = await User.findOne({ _id: req.body.userId });

        if (!host) {
            return res.status(404).json({ message: 'You are not an authorized person' });
        }

        if (host.role !== 'host') {
            return res.status(404).json({ message: 'You are not a host' });
        }

        // Find admin users and select specific fields
        const adminData = await User.find({ role: 'admin' }).select('fullName address email phoneNumber');

        // Now you have an array of objects with the selected fields for each admin user

        // Example: Return admin data in the response
        return res.status(200).json({ message: 'Admin data retrieved successfully', adminData });

    } catch (error) {
        next(error);
    }
};



// Host User List
const hostUserList = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.userId);
        console.log("object found", user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'host') {
            return res.status(403).json({ message: 'You are not authorized' });
        }

        const review = await Review.find({ hostId: user._id });
        console.log("review", review)

        // Find cars owned by the host user
        const ownedCars = await Car.find({ carOwner: user._id });

        // Find cars rented by the host user
        const rentedCars = await Rent.find({ hostId: user._id }).populate('userId').populate('carId');

        // console.log(rentedCars)

        return res.status(200).json({
            message: 'Host user car and rented car lists retrieved successfully',
            // ownedCars,
            userList: rentedCars,

        });
    } catch (error) {
        next(error)
    }
};

// Single Host User
const getHostUserById = async (req, res, next) => {
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
    catch (error) {
        next(error)
    }
};


const allUserInfo = async (req, res, next) => {
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
        next(error)
    }
};

// All User With Trip Amount
const allUsersWithTripAmount = async (req, res, next) => {
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
        next(error)
    }
};

//Banned users
const bannedUsers = async (req, res, next) => {
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
            user.approved = true;
            await user.save();
        }
        else if (isApprove === "cancel" && isApprove === "approve") {
            user.isBanned = 'false';
            await user.save();
        }

        // Step 5: Ban the user




        // Step 6: Respond with success message
        res.status(200).json({ message: `User ${isApprove} Successfully` });
    } catch (error) {
        // Step 7: Handle errors
        next(error)
    }
};

// All Banned Users
const allBannedUsers = async (req, res, next) => {
    try {
        const bannedUsers = await User.find({ isBanned: "true" });

        res.status(200).json({ message: 'Banned User Retrieve Successfully', bannedUsers });
    } catch (error) {
        next(error)
    }
}

//Update user
// const updateUser = async (req, res, next) => {

//     try {
//         const { fullName, email, phoneNumber, gender, address, dateOfBirth, password, RFC, creaditCardNumber, ine } = req.body;

//         const kycFileNames = [];



//         if (req.files && req.files.KYC) {
//             req.files.KYC.forEach((file) => {
//                 const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/kyc/${file.filename}`;
//                 kycFileNames.push(publicFileUrl);
//             });
//         }

//         // const publicImageUrl = '';

//         // if (req.files && req.files.image) {
//         //     req.files.image.forEach((file) => {
//         //         const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${file.filename}`;
//         //         publicImageUrl.push(publicFileUrl);
//         //     });
//         // }

//         let publicFileUrl = ''; // Initialize the publicFileUrl variable

//         if (req.files && req.files.image) {
//             req.files.image.forEach((file) => {
//                 publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${file.filename}`;
//             });
//         }

//         const id = req.params.id;
//         const user = await User.findById(id);


//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Check if the user already exists
//         const userExist = await User.findOne({ email });
//         if (userExist && userExist._id.toString() !== id) {
//             return res.status(409).json({ message: 'User already exists! Please login' });
//         }

//         if (publicFileUrl) {
//             user.image = publicFileUrl;
//         }

//         if (kycFileNames) {
//             user.image = kycFileNames;
//         }

//         if (user._id.toString() === req.body.userId) {
//             user.fullName = fullName;
//             user.email = email;
//             user.phoneNumber = phoneNumber;
//             user.gender = gender;
//             user.address = address;
//             // user.password = user.password;
//             user.dateOfBirth = dateOfBirth;
//             user.KYC = kycFileNames;
//             user.RFC = RFC;
//             user.ine = ine;
//             user.creaditCardNumber = creaditCardNumber;
//             // user.image = publicFileUrl;
//             await user.save();
//             return res.status(200).json({ message: 'User updated successfully', user });
//         } else {
//             return res.status(403).json({ message: 'You do not have permission to update' });
//         }
//     } catch (error) {
//         // console.log(error.message);
//         next(error)
//     }
// };

const updateUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user already exists
        const { email } = req.body;
        const userExist = await User.findOne({ email });

        if (userExist && userExist._id.toString() !== id) {
            return res.status(409).json({ message: 'User already exists! Please login' });
        }

        // Create an object to store the updated user properties
        const updatedUser = {};

        // List of fields that can be updated
        const allowedFields = [
            'fullName',
            'email',
            'phoneNumber',
            'gender',
            'address',
            'dateOfBirth',
            'RFC',
            'bankAccountId',
            'creaditCardNumber',
            'ine',
        ];

        // Iterate through the allowed fields and update the user object
        for (const field of allowedFields) {
            if (req.body[field]) {
                updatedUser[field] = req.body[field];
            }
        }

        // Handle updating image and KYC separately
        if (req.files && req.files.image) {
            const publicFileUrl = `${req.protocol}://${req.get('host')}/public/uploads/image/${req.files.image[0].filename}`;
            updatedUser.image = publicFileUrl;
        }

        if (req.files && req.files.KYC) {
            const kycFileNames = req.files.KYC.map(file => `${req.protocol}://${req.get('host')}/public/uploads/kyc/${file.filename}`);
            updatedUser.KYC = kycFileNames;
        }

        // Update the user object
        Object.assign(user, updatedUser);

        await user.save();

        return res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        next(error);
    }
};


const allBlockedUsers = async (req, res, next) => {
    try {
        const blockedUsers = await User.find({ isBlock: true });

        res.status(200).json({ message: 'Blocked User Retrieve Successfully', blockedUsers });
    } catch (error) {
        next(error)
    }
}

const blockedUsers = async (req, res, next) => {
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
        next(error)
    }
};

//Approve host
const approveHost = async (req, res, next) => {
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
        next(error)
    }
};

// Change Password
const changePassword = async (req, res, next) => {
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
        next(error)
    }
}

const forgetPassword = async (req, res, next) => {
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
        next(error)
    }
};

//Verify one time code
const verifyOneTimeCode = async (req, res, next) => {
    try {
        const { email } = req.body;
        const { oneTimeCode } = req.body;
        console.log(req.body.oneTimeCode);
        console.log(email);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(40).json({ message: 'User not found' });
        } else if (user.oneTimeCode === oneTimeCode) {
            user.emailVerified = true;
            await user.save();
            res.status(200).json({ success: true, message: 'User verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to verify user' });
        }
    } catch (error) {
        next(error)
    }
};

//Update password without login
const updatePassword = async (req, res, next) => {
    try {
        const { email } = req.body;
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
        next(error)
    }
};

const hostKyc = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}

const deleteById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        console.log(user)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const rentsToDelete = await Rent.find({ userId: id });
        const paymentsToDelete = await Payment.find({ userId: id });

        if (!rentsToDelete || rentsToDelete.length === 0) {
            // If there are no associated rents, delete the user directly

            await user.deleteOne();
            res.status(200).json({ message: 'User deleted successfully' });
        } else if (!paymentsToDelete || paymentsToDelete.length === 0) {

            await user.deleteOne();
            res.status(200).json({ message: 'User deleted successfully' });
        }
        else {
            // If there are associated rents, delete the rents first

            await Rent.deleteMany({ userId: id });
            await Payment.deleteMany({ userId: id });

            // After deleting rents, delete the user
            await user.deleteOne();

            res.status(200).json({ message: 'User and associated rents deleted successfully' });
        }
    } catch (err) {
        next(error)
    }
};

const carSoftDeleteById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const car = await Car.findById(id);
        // console.log(car)

        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const rentsToDelete = await Rent.find({ carId: id });

        const paymentsToDelete = await Payment.find({ carId: id });

        if (!rentsToDelete || rentsToDelete.length === 0) {
            // console.log("In")
            // If there are no associated rents, delete the user directly

            await car.deleteOne();
            return res.status(200).json({ message: 'Car deleted successfully' });
        } else if (!paymentsToDelete || paymentsToDelete.length === "0") {
            // console.log("In")
            await car.deleteOne();
            return res.status(200).json({ message: 'Car deleted successfully' });
        }
        else {
            // If there are associated rents, delete the rents first

            // await Rent.deleteMany({ userId: id });
            // await Payment.deleteMany({ userId: id });

            // // After deleting rents, delete the user
            // await car.deleteOne();

            res.status(409).json({ message: 'You Can not delete this Car' });
        }
    } catch (err) {
        next(err)
    }
};

const logOut = async (req, res, next) => {
    try {
        const token = req.header('Authorization')

        if (token) {
            return res.status(200).json({ message: 'Logout successful' });
        } else {
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        next(error)
    }
}


module.exports = {
    signUp, userSignUp, verifyEmail, signIn, allUsers, allTrushUsers, bannedUsers, allBannedUsers, updateUser, approveHost, changePassword, forgetPassword, verifyOneTimeCode, updatePassword, allHosts, adminInfo, allUsersWithTripAmount, hostKyc, allUserInfo, allBlockedUsers, blockedUsers, hostUserList, getHostUserById, deleteById, getUserById, logOut, carSoftDeleteById
};