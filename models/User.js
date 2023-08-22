const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: [true, 'Name is must be given'] },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);
        },
        message: 'Please enter a valid Email'
      }
    },
    phoneNumber: { type: String, required: false},
    gender: { type: String, required: [true, 'Password is must be given']},
    address: { type: String, required: false},
    dateOfBirth: { type: String, required: false},
    password: { type: String, required: true},
    KYC: { type: Object, required: false},
    RFC: { type: String, required: false},
    creaditCardNumber: { type: String, required: false},
    image: { type: Object, required: false},
    role: { type: String, enum: ['user', 'admin', 'unknown', 'host'], default: 'unknown' },
    emailVerified: { type: Boolean, default: false },
    oneTimeCode: { type: String, required: false } 
  },{
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
      },
    },
  }, { timestamps: true },
    
  );
  
  module.exports = mongoose.model('User', userSchema);