const passport = require('passport');
const User = require('../model/User'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;

function setupPassport() {

  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) return done(null, existingUser);

        const newUser = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          givenName: profile.name.givenName,
          email: profile.emails?.[0]?.value,
          photo: profile.photos?.[0]?.value,
        });

        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
}

module.exports = setupPassport;
