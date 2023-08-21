const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Name is must be given'] },
    email: { type: String, required: [true, 'Email is must be given'] },
    phone: { type: String, required: false},
    phone: { type: String, required: [true, 'Password is must be given']},
    address: { type: String, required: false},
  },{
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
      },
    },
  }, { timestamps: true },
    
  );
  
  module.exports = mongoose.model('User', userSchema);