const passport = require('passport');

const GoogleStrategy = require('passport-google-oauth20').Strategy;


const GOOGLE_CLIENT_ID = '951297472152-cbivanca4mborr64lig95tj4s1o7j0bg.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = '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'

// passport.use(new GoogleStrategy({
//     clientID: GOOGLE_CLIENT_ID,
//     clientSecret: GOOGLE_CLIENT_SECRET,
//     callbackURL: "/auth/google/callback"
// },
//     function (accessToken, refreshToken, profile, cb) {
//         // User.findOrCreate({ googleId: profile.id }, function (err, user) {
//         //     return cb(err, user);
//         // });
//         done(null, profile);
//         // const user = {
//         //     username: profile.displayName,
//         //     avatar: profile.photos[0]
//         // }

//         // user.save()
//     }
// ));

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        function (accessToken, refreshToken, profile, done) {
            done(null, profile);
        },

    )
);

passport.serializeUser((user, done) => {
    done(null, user);
})

passport.deserializeUser((user, done) => {
    done(null, user);
})