// app.js
const express = require('express');
const mongoose = require('mongoose');
const userRouter = require('./routes/userRouter');
const cors = require('cors');
const cookieSession = require('cookie-session');
const session = require('express-session');
require('dotenv').config();
const app = express();
const passport = require('passport');
const passportSetup = require('./passport');
const authRoutes = require('./routes/auth')

const port = 5000

app.use(
  cookieSession({ name: "session", keys: ["lama"], maxAge: 24 * 60 * 60 * 100 })
);

app.use(passport.initialize());
app.use(passport.session());




// Connect to the MongoDB database
mongoose.connect(process.env.MONGODB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors({
//   origin: ['http://localhost:5173/', process.env.ALLOWED_CLIENT_URLS_2],
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }));


// Routes
app.use('/api/user', userRouter);


// Start the server
// app.listen(3001, '103.161.9.106', () => {
//   console.log('Server started on port 3001');
// });

app.use(passport.session({
  secret: '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',
  resave: true,
  saveUninitialized: true
}));

app.use(
  cors({
    origin: "http://localhost:5000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

module.exports = app;