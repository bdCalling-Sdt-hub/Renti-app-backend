const About = require("../models/About");

const createOrUpdateAboutUs = async (req, res) => {
    const { content } = req.body;

    try {
        // Check if an About Us entry already exists
        let about = await About.findOne();

        if (!about) {
            // If no entry exists, create a new one
            about = new About({ content });
            await about.save();
            return res.status(201).json({ message: 'About Us content created successfully', about });
        }

        // If an entry exists, update its content
        about.content = content;
        await about.save();

        return res.status(200).json({ message: 'About Us content updated successfully', about });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getAboutUs = async (req, res) => {
    try {
        // Find the About Us entry (assuming there's only one)
        const about = await About.findOne();

        if (!about) {
            return res.status(404).json({ message: 'About Us content not found' });
        }

        return res.status(200).json({ message: 'About Us content retrieved successfully', about });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createOrUpdateAboutUs, getAboutUs };