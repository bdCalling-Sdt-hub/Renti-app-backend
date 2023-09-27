const TermsCondition = require("../models/TermsCondition");
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

        // Check if an About Us entry already exists
        let termsCondition = await TermsCondition.findOne();

        if (!termsCondition) {
            // If no entry exists, create a new one
            termsCondition = new TermsCondition({ content });
            await termsCondition.save();
            return res.status(201).json({ message: 'Terms Condition content created successfully', termsCondition });
        }

        // If an entry exists, update its content
        termsCondition.content = content;
        await termsCondition.save();

        return res.status(200).json({ message: 'Terms Condition content updated successfully', termsCondition });
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

        // Find the About Us entry (assuming there's only one)
        const termsCondition = await TermsCondition.findOne();

        if (!termsCondition) {
            return res.status(404).json({ message: 'Terms Condition content not found' });
        }

        // Remove HTML tags from the "about" content
        // const termsConditionContentWithoutTags = termsCondition.content.replace(/<\/?[^>]+(>|$)/g, "");

        // return res.status(200).json({ message: 'Terms Condition content retrieved successfully', termsCondition: { ...termsCondition.toObject(), content: termsConditionContentWithoutTags } });
        return res.status(200).json({ message: 'Terms Condition content retrieved successfully', termsCondition });
    } catch (error) {
        next(error)
    }
};

module.exports = { createOrUpdate, getAll };