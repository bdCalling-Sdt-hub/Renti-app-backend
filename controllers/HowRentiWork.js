
const HowRentiWork = require("../models/HowRentiWork");
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

        let howRentiWork = await HowRentiWork.findOne();

        if (!howRentiWork) {
            howRentiWork = new HowRentiWork({ content });
            await howRentiWork.save();
            return res.status(201).json({ message: 'How RentiWork content created successfully', howRentiWork });
        }

        howRentiWork.content = content;
        await howRentiWork.save();
        return res.status(200).json({ message: 'How Renti Work content updated successfully', howRentiWork });

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

        const howRentiWork = await HowRentiWork.findOne();

        if (!howRentiWork) {
            return res.status(404).json({ message: 'howRentiWork Us content not found' });
        }

        // const howRentiWorkContentWithoutTags = howRentiWork.content.replace(/<\/?[^>]+(>|$)/g, "");

        // return res.status(200).json({ message: 'How Renti Work Us content retrieved successfully', howRentiWork: { ...howRentiWork.toObject(), content: howRentiWorkContentWithoutTags } });
        return res.status(200).json({ message: 'How Renti Work content retrieved successfully', howRentiWork });
    } catch (error) {
        next(error)
    }
};

module.exports = { createOrUpdate, getAll };