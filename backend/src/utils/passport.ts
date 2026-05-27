import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {pool} from "../config/db";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const googleId = profile.id;
        const name = profile.displayName;
        const picture = profile.photos?.[0].value;

        if (!email) return done(new Error("No email from Google"), undefined);

        let userResult = await pool.query(
          "SELECT * FROM users WHERE email=$1",
          [email]
        );

        let user = userResult.rows[0];

        if (!user) {
          const newUser = await pool.query(
            `INSERT INTO users 
            (google_id, name, email, profile_pic, auth_provider)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [googleId, name, email, picture, "google"]
          );

          user = newUser.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);

export default passport;