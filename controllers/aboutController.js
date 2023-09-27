const About = require("../models/About");
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
        let about = await About.findOne();

        if (!about) {
            // If no entry exists, create a new one
            about = new About({ content });
            await about.save();
            return res.status(201).json({ message: 'About Us content created successfully', about });
        }

        about.content = content;
        await about.save();


        return res.status(200).json({ message: 'About Us content updated successfully', about });

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
        const about = await About.findOne();

        if (!about) {
            return res.status(404).json({ message: 'About Us content not found' });
        }

        // Remove HTML tags from the "about" content
        const aboutContentWithoutTags = about.content.replace(/<\/?[^>]+(>|$)/g, "");

        return res.status(200).json({ message: 'About Us content retrieved successfully', about: { ...about.toObject(), content: aboutContentWithoutTags } });
        // return res.status(200).json({ message: 'About Us content retrieved successfully', about });
    } catch (error) {
        next(error)
    }
};

module.exports = { createOrUpdate, getAll };