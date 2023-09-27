
const HostPaymentTme = require("../models/HostPaymentTme");
const User = require("../models/User");

const createOrUpdate = async (req, res, next) => {
    const { label } = req.body;

    try {

        const user = await User.findById(req.body.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(404).json({ message: 'You are not Authorization' });
        }

        // Check if an About Us entry already exists
        let labelData = await HostPaymentTme.findOne();
        console.log(labelData)

        if (!labelData) {
            // If no entry exists, create a new one
            labelData = new HostPaymentTme({ label });
            await labelData.save();
            return res.status(201).json({ message: 'Host Payment Time created successfully', labelData });
        }

        // If an entry exists, update its label
        labelData.label = label;
        await labelData.save();

        return res.status(200).json({ message: 'Host Payment Time updated successfully', labelData });
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
        const labelData = await HostPaymentTme.findOne();

        if (!labelData) {
            return res.status(404).json({ message: 'Host Payment Time content not found' });
        }


        return res.status(200).json({ message: 'About Us content retrieved successfully', labelData });
    } catch (error) {
        next(error)
    }
};

module.exports = { createOrUpdate, getAll };