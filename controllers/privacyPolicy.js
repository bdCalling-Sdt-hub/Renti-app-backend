const PrivacyPolicy = require("../models/PrivacyPolicy");
const User = require("../models/User");

const createOrUpdate = async (req, res, next) => {
    const { content } = req.body;

    try {

        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(404).json({ message: 'You are not Authorization' });
        }

        // Check if an Privacy Policy entry already exists
        let privacyPolicy = await PrivacyPolicy.findOne();

        if (!privacyPolicy) {
            // If no entry exists, create a new one
            privacyPolicy = new PrivacyPolicy({ content });
            await privacyPolicy.save();
            return res.status(201).json({ message: 'Privacy Policy content created successfully', privacyPolicy });
        }

        // If an entry exists, update its content
        privacyPolicy.content = content;
        await privacyPolicy.save();

        return res.status(200).json({ message: 'Privacy Policy content updated successfully', privacyPolicy });
    } catch (error) {
        next(error)
    }
};

const getAll = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // if (user.role !== 'admin') {
        //     return res.status(404).json({ message: 'You are not Authorization' });
        // }

        // Find the Privacy Policy entry (assuming there's only one)
        const privacyPolicy = await PrivacyPolicy.findOne();

        if (!privacyPolicy) {
            return res.status(404).json({ message: 'Privacy Policy content not found' });
        }

        // Remove HTML tags from the "about" content
        const privacyPolicyContentWithoutTags = privacyPolicy.content.replace(/<\/?[^>]+(>|$)/g, "");

        return res.status(200).json({ message: 'Privacy Policy content retrieved successfully', privacyPolicy: { ...privacyPolicy.toObject(), content: privacyPolicyContentWithoutTags } });
        // return res.status(200).json({ message: 'Privacy Policy content retrieved successfully', about });
    } catch (error) {
        next(error)
    }
};

module.exports = { createOrUpdate, getAll };