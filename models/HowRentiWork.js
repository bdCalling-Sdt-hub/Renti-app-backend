const mongoose = require('mongoose');

const howRentiWorkSchema = new mongoose.Schema({
    content: { type: String, required: [true, 'Content is must be Required'] },
},
    { timestamps: true },

);

module.exports = mongoose.model('About', howRentiWorkSchema);