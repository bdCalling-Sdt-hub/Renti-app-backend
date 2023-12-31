const Percentage = require("../models/Percentage");
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
        let about = await Percentage.findOne();

        if (!about) {
            // If no entry exists, create a new one
            about = new Percentage({ content });
            await about.save();
            return res.status(201).json({ message: 'Percentage created successfully', about });
        }

        // If an entry exists, update its content
        about.content = content;
        await about.save();

        return res.status(200).json({ message: 'Percentage updated successfully', about });
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

        if (user.role !== 'admin') {
            return res.status(404).json({ message: 'You are not Authorization' });
        }

        // Find the About Us entry (assuming there's only one)
        const percentage = await Percentage.findOne();

        if (!percentage) {
            return res.status(404).json({ message: 'Percentage not found' });
        }

        return res.status(200).json({ message: 'Percentage retrieved successfully', percentage });
    } catch (error) {
        next(error)
    }
};


module.exports = { createOrUpdate, getAll };