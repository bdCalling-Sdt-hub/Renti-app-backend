const Support = require("../models/Support");
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

        let support = await Support.findOne();

        if (!support) {
            support = new Support({ content });
            await support.save();
            return res.status(201).json({ message: 'Support content created successfully', support });
        }

        support.content = content;
        await support.save();
        return res.status(200).json({ message: 'Support content updated successfully', support });

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

        const support = await Support.findOne();

        if (!support) {
            return res.status(404).json({ message: 'support Us content not found' });
        }

        // const supportContentWithoutTags = support.content.replace(/<\/?[^>]+(>|$)/g, "");

        // return res.status(200).json({ message: 'How Renti Work Us content retrieved successfully', support: { ...support.toObject(), content: supportContentWithoutTags } });
        return res.status(200).json({ message: 'Support content retrieved successfully', support });
    } catch (error) {
        next(error)
    }
};

module.exports = { createOrUpdate, getAll };