import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import connectDB from './lib/db.js';
import User from './models/User.js';
import Sister from './models/Sister.js';
import Booking from './models/Booking.js';
import Account from './models/Account.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if running on HTTPS/production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Session Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    if (user) {
      // Find associated sister profile if exists
      const sisterProfile = await Sister.findOne({ userId: user._id }).lean();
      user.sisterProfile = sisterProfile;
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    const profileImage = profile.photos?.[0]?.value;
    const selectedRole = req.session.oauthRole || 'buyer';

    if (!email) {
      return done(new Error("No email returned from Google"), null);
    }

    try {
      // Find or create User
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          profileImage,
          role: selectedRole
        });

        // If sister, seed a mock sister profile automatically
        if (selectedRole === 'sister') {
          await Sister.create({
            userId: user._id,
            name: user.name,
            specialty: "Boutique Tailoring",
            category: "tailoring",
            rate: 450,
            rateUnit: "/visit",
            avatar: user.profileImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
            distance: "1.2 km away",
            distanceKm: 1.2,
            location: "Sector 14, Urban Enclave",
            experience: "8+ years experience in designer blouses, kurti alteration & custom bridal fits.",
            phone: "+91 98765 43210",
            availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            timeSlots: ["Morning (9 AM - 12 PM)", "Afternoon (1 PM - 4 PM)", "Evening (5 PM - 8 PM)"],
            services: [
              { id: "s1-1", name: "Designer Blouse Stitching", price: 450, duration: "60 mins" },
              { id: "s1-2", name: "Kurti & Suit Tailoring", price: 550, duration: "75 mins" }
            ],
            badges: ["Top Rated", "Skill Certified"]
          });
        }
      } else {
        // If the user logging in selected a different role, and currently has a buyer role, promote/switch if needed
        // But otherwise keep user's existing database role.
        user = await User.findByIdAndUpdate(user._id, { name, profileImage }, { new: true });
      }

      // Check/Create Account
      const providerAccountId = profile.id;
      let account = await Account.findOne({ provider: 'google', providerAccountId });
      if (!account) {
        await Account.create({
          userId: user._id,
          type: 'oauth',
          provider: 'google',
          providerAccountId
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// OAuth Authorization Route
app.get('/auth/google', (req, res, next) => {
  // Capture selected role in session
  req.session.oauthRole = req.query.role || 'buyer';
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// OAuth Callback Route
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(process.env.NEXTAUTH_URL || 'http://localhost:3000');
  }
);

// Get Session User Route
app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profileImage: req.user.profileImage,
        role: req.user.role,
        sisters: req.user.sisterProfile ? [req.user.sisterProfile] : []
      } 
    });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// Logout Route
app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

// --- BOOKINGS API ENDPOINTS ---

// Create a booking (Buyer makes a booking)
app.post('/api/bookings', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  const {
    sisterId,
    sisterName,
    sisterAvatar,
    specialty,
    serviceName,
    amount,
    visitFee,
    totalAmount,
    date,
    timeSlot,
    customerName,
    customerPhone,
    customerAddress,
    specialNotes
  } = req.body;

  try {
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const booking = await Booking.create({
      userId: req.user._id,
      bookingRef: `UD-${randomCode}`,
      sisterId,
      sisterName,
      sisterAvatar,
      specialty,
      serviceName,
      amount,
      visitFee,
      totalAmount,
      date,
      timeSlot,
      customerName,
      customerPhone,
      customerAddress,
      specialNotes,
      status: 'Pending' // Initial state is Pending
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Failed to create booking:", err);
    res.status(500).json({ error: "Failed to create booking in database." });
  }
});

// Get Bookings
app.get('/api/bookings', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let query = {};
    if (req.user.role === 'sister' && req.user.sisterProfile) {
      // Find bookings belonging to this sister
      query = { sisterId: req.user.sisterProfile.id || req.user.sisterProfile._id.toString() };
    } else {
      // Find bookings made by this buyer
      query = { userId: req.user._id };
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    res.status(500).json({ error: "Failed to retrieve bookings." });
  }
});

// Update Booking Status (Accept / Reject)
app.patch('/api/bookings/:id', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { status } = req.body; // e.g. 'Confirmed', 'Rejected', 'In Progress', 'Completed', 'Cancelled'
  
  if (!['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: "Invalid booking status" });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Authorization: only the buyer who booked or the sister assigned can update it
    const isSister = req.user.role === 'sister' && req.user.sisterProfile && (booking.sisterId === req.user.sisterProfile._id.toString() || booking.sisterId === req.user.sisterProfile.id);
    const isBuyer = booking.userId.toString() === req.user._id.toString();

    if (!isSister && !isBuyer) {
      return res.status(403).json({ error: "Forbidden. You cannot edit this booking." });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error("Failed to update booking status:", err);
    res.status(500).json({ error: "Failed to update status in database." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
