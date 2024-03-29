const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Name is must be given'] },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    unique: [true, 'Email should be unique'],
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);
      },
      message: 'Please enter a valid Email'
    }
  },
  phoneNumber: { type: String, required: false },
  gender: { type: String },
  address: { type: Object, required: false },
  dateOfBirth: { type: String, required: false },
  password: { type: String, required: [true, 'Password must be given'], set: (v) => bcrypt.hashSync(v, bcrypt.genSaltSync(10)) },
  KYC: { type: Object, required: false },
  RFC: { type: String, required: false },
  creaditCardNumber: { type: String, required: false },
  expireDate: { type: String, required: false },
  cvv: { type: String, required: false },
  stripeConnectAccountId: { type: String, required: false },
  ine: { type: String, required: false },
  image: { type: Object, required: false },
  bankInfo: { type: Object, required: false },
  role: { type: String, enum: ['user', 'admin', 'unknown', 'host'], default: 'unknown' },
  emailVerified: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  // isBanned: { type: Boolean, default: false },
  isBanned: { type: String, enum: ['true', 'false', 'trash'], default: 'false' },
  // isBlock: { type: Boolean, default: false },
  oneTimeCode: { type: String, required: false },
  averageRatings: { type: Number, required: false },
  tripCompleted: { type: String, required: false }
}, { timestamps: true }, {
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
    },
  },
},

);

module.exports = mongoose.model('User', userSchema);