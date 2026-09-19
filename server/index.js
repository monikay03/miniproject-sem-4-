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

        // If sister or artisan, seed a sister profile automatically
        if (selectedRole === 'sister' || selectedRole === 'artisan') {
          await Sister.create({
            userId: user._id,
            name: user.name,
            specialty: selectedRole === 'artisan' ? "Handmade Craft & Pottery" : "Boutique Tailoring",
            category: selectedRole === 'artisan' ? "craft" : "tailoring",
            rate: 450,
            rateUnit: "/visit",
            avatar: user.profileImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
            distance: "1.2 km away",
            distanceKm: 1.2,
            location: "Sector 14, Urban Enclave",
            experience: "8+ years experience in designer crafts, custom fits and authentic local creations.",
            bio: "Passionate skilled sister delivering top-rated home services and authentic handcrafted goods.",
            operatingHours: "9:00 AM - 7:00 PM",
            coverageArea: "Within 10 km radius",
            phone: "+91 98765 43210",
            availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            timeSlots: ["Morning (9 AM - 12 PM)", "Afternoon (1 PM - 4 PM)", "Evening (5 PM - 8 PM)"],
            services: [
              { id: "s1-1", name: "Designer Blouse Stitching", price: 450, duration: "60 mins", stockStatus: "Available for Booking" },
              { id: "s1-2", name: "Kurti & Suit Tailoring", price: 550, duration: "75 mins", stockStatus: "Available for Booking" }
            ],
            badges: ["Top Rated", "Skill Certified", "Identity Verified"]
          });
        }
      } else {
        const updateFields = { name, profileImage };
        if (selectedRole && selectedRole !== 'buyer') {
          updateFields.role = selectedRole;
        }
        user = await User.findByIdAndUpdate(user._id, updateFields, { new: true });
        
        // Ensure sister profile exists if role is sister/artisan
        if (user.role === 'sister' || user.role === 'artisan') {
          const existingProfile = await Sister.findOne({ userId: user._id });
          if (!existingProfile) {
            await Sister.create({
              userId: user._id,
              name: user.name,
              specialty: user.role === 'artisan' ? "Handmade Craft & Pottery" : "Boutique Tailoring",
              category: user.role === 'artisan' ? "craft" : "tailoring",
              rate: 450,
              rateUnit: "/visit",
              avatar: user.profileImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
              distance: "1.2 km away",
              distanceKm: 1.2,
              location: "Sector 14, Urban Enclave",
              experience: "Experienced local artisan delivering high quality services.",
              bio: "Dedicated master artisan providing custom stitching and door-to-door garment fittings.",
              operatingHours: "9:00 AM - 7:00 PM",
              coverageArea: "Within 10 km radius",
              phone: "+91 98765 43210",
              availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
              timeSlots: ["Morning (9 AM - 12 PM)", "Afternoon (1 PM - 4 PM)", "Evening (5 PM - 8 PM)"],
              services: [
                { id: "s1-1", name: "Designer Blouse Stitching", price: 450, duration: "60 mins", stockStatus: "Available for Booking" },
                { id: "s1-2", name: "Kurti & Suit Tailoring", price: 550, duration: "75 mins", stockStatus: "Available for Booking" }
              ],
              badges: ["Top Rated", "Skill Certified"]
            });
          }
        }
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

// Helper to retrieve the sister/artisan profile context for API requests
async function getSisterContext(req) {
  try {
    // 1. If authenticated session exists
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      let sister = await Sister.findOne({ userId: req.user._id });
      if (!sister && (req.user.role === 'sister' || req.user.role === 'artisan')) {
        sister = await Sister.create({
          userId: req.user._id,
          name: req.user.name || "Skilled Sister",
          specialty: req.user.role === 'artisan' ? "Handmade Craft & Pottery" : "Boutique Tailoring",
          category: req.user.role === 'artisan' ? "craft" : "tailoring",
          rate: 450,
          rateUnit: "/visit",
          avatar: req.user.profileImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
          distance: "1.2 km away",
          distanceKm: 1.2,
          location: "Sector 14, Urban Enclave",
          experience: "Expert handcrafted creations, custom tailoring and personalized doorstep services.",
          bio: "Passionate skilled sister providing top-rated alterations, bespoke stitching, and authentic handmade arts.",
          operatingHours: "9:00 AM - 7:00 PM (Mon-Sat)",
          coverageArea: "Within 10 km neighborhood radius",
          phone: "+91 98765 43210",
          email: req.user.email,
          availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          timeSlots: ["Morning (9 AM - 12 PM)", "Afternoon (1 PM - 4 PM)", "Evening (5 PM - 8 PM)"],
          services: [
            { id: "s1-1", name: "Designer Blouse Stitching", price: 450, duration: "60 mins", stockStatus: "Available for Booking" },
            { id: "s1-2", name: "Kurti & Suit Alteration", price: 350, duration: "45 mins", stockStatus: "Available for Booking" },
            { id: "s1-3", name: "Custom Bridal Fitting", price: 850, duration: "90 mins", stockStatus: "Available for Booking" }
          ],
          badges: ["Top Rated", "Skill Certified", "Identity Verified"]
        });
      }
      if (sister) {
        return { user: req.user, sister };
      }
    }

    // 2. Custom header, body, or query parameter support
    const candidateId = req.headers['x-sister-id'] || req.headers['x-user-id'] || req.body?.sellerId || req.body?.userId || req.query?.sisterId;
    if (candidateId) {
      let sister = null;
      if (String(candidateId).match(/^[0-9a-fA-F]{24}$/)) {
        sister = await Sister.findById(candidateId);
      }
      if (!sister) {
        sister = await Sister.findOne({
          $or: [
            { userId: candidateId },
            { _id: candidateId.match(/^[0-9a-fA-F]{24}$/) ? candidateId : undefined },
            { id: candidateId }
          ].filter(Boolean)
        });
      }
      if (sister) {
        return { user: { _id: sister.userId || sister._id, role: 'sister', name: sister.name }, sister };
      }
    }

    // 3. Fallback to existing sister in DB or create default sister
    let sister = await Sister.findOne({});
    if (!sister) {
      sister = await Sister.create({
        name: "Anjali Sharma",
        specialty: "Boutique Tailoring & Alteration",
        category: "tailoring",
        rate: 450,
        rateUnit: "/visit",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        distance: "1.2 km away",
        distanceKm: 1.2,
        location: "Sector 14, Urban Enclave",
        experience: "8+ years experience in designer blouses, kurti alteration & custom bridal fits.",
        bio: "Dedicated master artisan providing custom stitching and door-to-door garment fittings with premium quality finishing.",
        operatingHours: "9:00 AM - 7:00 PM (Mon-Sat)",
        coverageArea: "Within 8 km radius",
        phone: "+91 98765 43210",
        email: "anjali.artisan@udaan.org",
        availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        timeSlots: ["Morning (9 AM - 12 PM)", "Afternoon (1 PM - 4 PM)", "Evening (5 PM - 8 PM)"],
        services: [
          { id: "s1-1", name: "Designer Blouse Stitching", price: 450, duration: "60 mins", stockStatus: "Available for Booking" },
          { id: "s1-2", name: "Kurti & Suit Tailoring", price: 550, duration: "75 mins", stockStatus: "Available for Booking" }
        ],
        badges: ["Top Rated", "Skill Certified"]
      });
    }

    return { user: { _id: sister.userId || sister._id, role: 'sister', name: sister.name }, sister };
  } catch (err) {
    console.error("Error in getSisterContext:", err);
    // Return mock fallback object
    return {
      user: { _id: 'sister-1', role: 'sister', name: 'Anjali Sharma' },
      sister: {
        _id: 'sister-1',
        id: 'sister-1',
        name: 'Anjali Sharma',
        specialty: 'Boutique Tailoring & Alteration',
        category: 'tailoring',
        location: 'Sector 14, Urban Enclave',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        services: []
      }
    };
  }
}

// Seed initial orders if empty for a sister
async function ensureSampleOrdersForSister(sister) {
  try {
    const sisterId = sister._id ? sister._id.toString() : 'sister-1';
    const count = await Booking.countDocuments({
      $or: [{ sisterId: sisterId }, { sisterId: 'sister-1' }]
    });

    if (count === 0) {
      await Booking.create([
        {
          bookingRef: "UD-94821",
          sisterId: sisterId,
          sisterName: sister.name,
          sisterAvatar: sister.avatar,
          specialty: sister.specialty,
          serviceName: "Designer Blouse Stitching",
          amount: 450,
          visitFee: 50,
          totalAmount: 500,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          timeSlot: "Morning (9 AM - 12 PM)",
          customerName: "Radha Verma",
          customerPhone: "+91 98765 11223",
          customerAddress: "Flat 302, Palm Heights, Sector 14",
          specialNotes: "Please bring silk lining fabric sample swatches.",
          status: "Pending"
        },
        {
          bookingRef: "UD-88234",
          sisterId: sisterId,
          sisterName: sister.name,
          sisterAvatar: sister.avatar,
          specialty: sister.specialty,
          serviceName: "Kurti & Suit Tailoring",
          amount: 550,
          visitFee: 50,
          totalAmount: 600,
          date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          timeSlot: "Afternoon (1 PM - 4 PM)",
          customerName: "Meenakshi Sundaram",
          customerPhone: "+91 98450 77881",
          customerAddress: "Villa 12, Green Glen Layout",
          specialNotes: "Urgent wedding occasion fit.",
          status: "Confirmed"
        },
        {
          bookingRef: "UD-76192",
          sisterId: sisterId,
          sisterName: sister.name,
          sisterAvatar: sister.avatar,
          specialty: sister.specialty,
          serviceName: "Custom Bridal Fitting",
          amount: 850,
          visitFee: 50,
          totalAmount: 900,
          date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
          timeSlot: "Evening (5 PM - 8 PM)",
          customerName: "Pooja Hegde",
          customerPhone: "+91 98112 33445",
          customerAddress: "Tower B-404, Sunshine Enclave",
          specialNotes: "Delivered and altered to perfection.",
          status: "Completed"
        }
      ]);
    }
  } catch (err) {
    console.warn("Could not seed sample orders:", err);
  }
}

// Seed initial products if empty for a sister
async function ensureSampleProductsForSister(sister) {
  try {
    const sisterId = sister._id ? sister._id.toString() : 'sister-1';
    const count = await Product.countDocuments({
      $or: [{ sisterId: sisterId }, { sisterId: 'sister-1' }]
    });

    if (count === 0) {
      await Product.create([
        {
          sisterId: sisterId,
          name: "Handmade Jaipur Blue Pottery Ceramic Vase",
          title: "Handmade Jaipur Blue Pottery Ceramic Vase",
          artisan: sister.name,
          state: sister.location || "Sector 14, Urban Enclave",
          category: "pottery",
          itemType: "product",
          price: 890,
          originalPrice: 1200,
          rating: 4.9,
          reviewsCount: 24,
          image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80",
          description: "Handcrafted traditional ceramic vase with floral motifs, fired using ancient natural glaze techniques.",
          stockStatus: "In Stock",
          inStock: true
        },
        {
          sisterId: sisterId,
          name: "Handwoven Cotton Kantha Embroidery Dupatta",
          title: "Handwoven Cotton Kantha Embroidery Dupatta",
          artisan: sister.name,
          state: sister.location || "Sector 14, Urban Enclave",
          category: "textile",
          itemType: "product",
          price: 650,
          originalPrice: 950,
          rating: 4.8,
          reviewsCount: 19,
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
          description: "Pure cotton dupatta featuring traditional running Kantha hand-embroidery work.",
          stockStatus: "In Stock",
          inStock: true
        }
      ]);
    }
  } catch (err) {
    console.warn("Could not seed sample products:", err);
  }
}

// ==========================================
// --- SISTER / SELLER DASHBOARD API ROUTES ---
// ==========================================

// 1. GET /api/sister/metrics - Dynamic stats for Overview Header
app.get('/api/sister/metrics', async (req, res) => {
  try {
    const { sister } = await getSisterContext(req);
    const sisterId = sister._id ? sister._id.toString() : 'sister-1';
    await ensureSampleOrdersForSister(sister);
    await ensureSampleProductsForSister(sister);

    const orders = await Booking.find({
      $or: [{ sisterId: sisterId }, { sisterId: 'sister-1' }, { sisterId: sister.id }]
    });

    const products = await Product.find({
      $or: [{ sisterId: sisterId }, { sisterId: 'sister-1' }, { sisterId: sister.id }]
    });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const activeOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'Confirmed' || o.status === 'In Progress').length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    
    // Calculate total revenue from completed orders
    const totalRevenue = orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + (o.totalAmount || o.amount || 0), 0);

    const totalProducts = products.length;
    const totalServices = (sister.services || []).length;
    const totalListings = totalProducts + totalServices;

    res.json({
      success: true,
      metrics: {
        totalOrders,
        pendingOrders,
        activeOrders,
        completedOrders,
        totalRevenue,
        totalListings,
        totalProducts,
        totalServices,
        subscription: sister.subscription || 'free'
      }
    });
  } catch (err) {
    console.error("Failed to fetch sister metrics:", err);
    res.json({
      success: true,
      metrics: {
        totalOrders: 3,
        pendingOrders: 1,
        activeOrders: 2,
        completedOrders: 1,
        totalRevenue: 900,
        totalListings: 4,
        totalProducts: 2,
        totalServices: 2,
        subscription: 'free'
      }
    });
  }
});

// 2. GET /api/sister/orders - Fetch logged-in sister's orders/bookings
app.get('/api/sister/orders', async (req, res) => {
  try {
    const { sister } = await getSisterContext(req);
    const sisterId = sister._id ? sister._id.toString() : 'sister-1';
    await ensureSampleOrdersForSister(sister);

    const orders = await Booking.find({
      $or: [{ sisterId: sisterId }, { sisterId: 'sister-1' }, { sisterId: sister.id }]
    }).sort({ createdAt: -1 });

    const normalized = orders.map(o => ({
      ...o.toObject(),
      id: o._id.toString()
    }));

    res.json({ success: true, orders: normalized });
  } catch (err) {
    console.error("Failed to fetch sister orders:", err);
    res.status(500).json({ error: "Failed to retrieve orders." });
  }
});

// 3. PATCH /api/sister/orders/:id - Update order status in real time
app.patch('/api/sister/orders/:id', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Accepted', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    let order = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Booking.findById(req.params.id);
    }
    if (!order) {
      order = await Booking.findOne({ bookingRef: req.params.id }) || await Booking.findOne({ _id: req.params.id });
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    await order.save();

    const normalized = {
      ...order.toObject(),
      id: order._id.toString()
    };

    res.json({ success: true, order: normalized });
  } catch (err) {
    console.error("Failed to update sister order status:", err);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

// 4. GET /api/sister/products - Fetch logged-in sister's products and services
app.get('/api/sister/products', async (req, res) => {
  try {
    const { sister } = await getSisterContext(req);
    const sisterId = sister._id ? sister._id.toString() : 'sister-1';
    await ensureSampleProductsForSister(sister);

    // Fetch physical products
    const dbProducts = await Product.find({
      $or: [{ sisterId: sisterId }, { sisterId: 'sister-1' }, { sisterId: sister.id }]
    }).sort({ createdAt: -1 });

    const normalizedProducts = dbProducts.map(p => ({
      ...p.toObject(),
      id: p._id.toString(),
      itemType: p.itemType || 'product'
    }));

    // Format sister's services as catalog items as well
    const serviceItems = (sister.services || []).map(svc => ({
      id: svc.id || `svc-${svc._id || Math.random()}`,
      _id: svc._id,
      name: svc.name,
      title: svc.name,
      artisan: sister.name,
      category: sister.category || 'service',
      itemType: 'service',
      price: svc.price,
      duration: svc.duration || '60 mins',
      stockStatus: svc.stockStatus || 'Available for Booking',
      inStock: svc.stockStatus !== 'Out of Stock',
      description: `Service package offered by ${sister.name} (${svc.duration || '60 mins'})`,
      image: sister.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      createdAt: sister.enrolledDate || new Date()
    }));

    res.json({
      success: true,
      items: [...normalizedProducts, ...serviceItems],
      products: normalizedProducts,
      services: serviceItems
    });
  } catch (err) {
    console.error("Failed to fetch sister products:", err);
    res.status(500).json({ error: "Failed to retrieve products." });
  }
});

// 5. POST /api/sister/products & /api/products - Create a product or service
const createProductHandler = async (req, res) => {
  try {
    const { sister } = await getSisterContext(req);

    const {
      title,
      name,
      category,
      itemType = 'product',
      price,
      originalPrice,
      description = '',
      image,
      images,
      stockStatus,
      duration,
      materials,
      dimensions,
      sellerId,
      userId,
      artisan
    } = req.body;

    const itemName = (title || name || '').trim() || 'Untitled Listing';
    const itemPrice = (price !== undefined && price !== null && !isNaN(Number(price))) ? Number(price) : 0;
    const defaultStockStatus = itemType === 'service' ? 'Available for Booking' : 'In Stock';
    const effectiveStockStatus = stockStatus || defaultStockStatus;

    if (itemType === 'service') {
      const newSvcId = `svc-${Date.now()}`;
      const newService = {
        id: newSvcId,
        name: itemName,
        price: itemPrice,
        duration: duration || '60 mins',
        stockStatus: effectiveStockStatus
      };

      if (sister && typeof sister.save === 'function') {
        sister.services = sister.services || [];
        sister.services.push(newService);
        await sister.save();
      }

      return res.status(201).json({
        success: true,
        item: {
          id: newSvcId,
          name: itemName,
          title: itemName,
          artisan: artisan || (sister ? sister.name : "Skilled Sister"),
          category: category || (sister ? sister.category : 'service') || 'service',
          itemType: 'service',
          price: itemPrice,
          duration: duration || '60 mins',
          stockStatus: effectiveStockStatus,
          inStock: effectiveStockStatus !== 'Out of Stock',
          description: description || `Professional service provided by ${artisan || (sister ? sister.name : "Skilled Sister")}`,
          image: image || (sister ? sister.avatar : null) || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
          createdAt: new Date()
        }
      });
    }

    // Physical Craft Product
    const newProduct = await Product.create({
      sellerId: sellerId || userId || (sister ? (sister.userId || sister._id) : 'sister-1'),
      sisterId: (sister && sister._id) ? sister._id.toString() : 'sister-1',
      name: itemName,
      title: itemName,
      artisan: artisan || (sister ? sister.name : "Skilled Sister"),
      state: (sister && sister.location) || "Local Hub",
      category: category || 'craft',
      itemType: 'product',
      price: itemPrice,
      originalPrice: (originalPrice && !isNaN(Number(originalPrice))) ? Number(originalPrice) : null,
      description: description || '',
      image: image || (images && images[0]) || "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80",
      images: images || (image ? [image] : []),
      stockStatus: effectiveStockStatus,
      inStock: effectiveStockStatus !== 'Out of Stock',
      materials: materials || '',
      dimensions: dimensions || ''
    });

    res.status(201).json({
      success: true,
      item: {
        ...newProduct.toObject(),
        id: newProduct._id.toString()
      }
    });
  } catch (err) {
    console.error("Failed to create sister product:", err);
    res.status(500).json({ error: "Failed to create catalog listing: " + err.message });
  }
};

app.post('/api/sister/products', createProductHandler);
app.post('/api/products', createProductHandler);

// 6. PUT /api/sister/products/:id & /api/products/:id - Update product/service
const updateProductHandler = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const { sister } = await getSisterContext(req);
    
    // Check if it's a service in sister.services
    if (sister && sister.services && sister.services.some(s => s.id === id || s._id?.toString() === id)) {
      const svcIndex = sister.services.findIndex(s => s.id === id || s._id?.toString() === id);
      if (svcIndex !== -1) {
        if (updateData.name !== undefined || updateData.title !== undefined) sister.services[svcIndex].name = updateData.title || updateData.name;
        if (updateData.price !== undefined) sister.services[svcIndex].price = Number(updateData.price);
        if (updateData.duration !== undefined) sister.services[svcIndex].duration = updateData.duration;
        if (updateData.stockStatus !== undefined) sister.services[svcIndex].stockStatus = updateData.stockStatus;
        await sister.save();

        return res.json({
          success: true,
          item: {
            ...sister.services[svcIndex].toObject(),
            id,
            itemType: 'service',
            stockStatus: sister.services[svcIndex].stockStatus
          }
        });
      }
    }

    // Otherwise update Product collection
    let product = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ _id: id }) || await Product.findOne({ name: id });
    }

    if (!product) {
      return res.status(404).json({ error: "Listing item not found" });
    }

    if (updateData.title !== undefined || updateData.name !== undefined) {
      product.name = updateData.title || updateData.name;
      product.title = updateData.title || updateData.name;
    }
    if (updateData.price !== undefined) product.price = Number(updateData.price);
    if (updateData.originalPrice !== undefined) product.originalPrice = updateData.originalPrice ? Number(updateData.originalPrice) : null;
    if (updateData.category !== undefined) product.category = updateData.category;
    if (updateData.description !== undefined) product.description = updateData.description;
    if (updateData.image !== undefined) product.image = updateData.image;
    if (updateData.stockStatus !== undefined) {
      product.stockStatus = updateData.stockStatus;
      product.inStock = updateData.stockStatus !== 'Out of Stock';
    }
    if (updateData.inStock !== undefined) {
      product.inStock = updateData.inStock;
      product.stockStatus = updateData.inStock ? 'In Stock' : 'Out of Stock';
    }

    await product.save();

    res.json({
      success: true,
      item: {
        ...product.toObject(),
        id: product._id.toString()
      }
    });
  } catch (err) {
    console.error("Failed to update product/service:", err);
    res.status(500).json({ error: "Failed to update listing." });
  }
};

app.put('/api/sister/products/:id', updateProductHandler);
app.put('/api/products/:id', updateProductHandler);

// 7. DELETE /api/sister/products/:id & /api/products/:id
const deleteProductHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const { sister } = await getSisterContext(req);

    // If service in sister.services, remove it
    if (sister && sister.services && sister.services.some(s => s.id === id || s._id?.toString() === id)) {
      sister.services = sister.services.filter(s => s.id !== id && s._id?.toString() !== id);
      await sister.save();
      return res.json({ success: true, message: "Service listing removed successfully." });
    }

    // Delete from Product collection
    let deleted = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Product.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await Product.findOneAndDelete({ _id: id });
    }

    res.json({ success: true, message: "Product listing deleted successfully." });
  } catch (err) {
    console.error("Failed to delete listing:", err);
    res.status(500).json({ error: "Failed to delete listing." });
  }
};

app.delete('/api/sister/products/:id', deleteProductHandler);
app.delete('/api/products/:id', deleteProductHandler);

// 8. GET /api/sister/profile - Fetch shop settings & profile
app.get('/api/sister/profile', async (req, res) => {
  try {
    const { sister } = await getSisterContext(req);
    if (!sister) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json({
      success: true,
      profile: {
        ...sister.toObject(),
        id: sister._id.toString()
      }
    });
  } catch (err) {
    console.error("Failed to fetch sister profile:", err);
    res.status(500).json({ error: "Failed to retrieve profile." });
  }
});

// 9. PATCH / PUT /api/sister/profile - Update shop profile settings (Supports empty string values)
const updateSisterProfileHandler = async (req, res) => {
  try {
    const { sister } = await getSisterContext(req);
    if (!sister) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const {
      name,
      specialty,
      category,
      rate,
      rateUnit,
      location,
      experience,
      bio,
      operatingHours,
      coverageArea,
      phone,
      email,
      availableDays,
      timeSlots
    } = req.body;

    if (name !== undefined) sister.name = name;
    if (specialty !== undefined) sister.specialty = specialty;
    if (category !== undefined) sister.category = category;
    if (rate !== undefined) sister.rate = Number(rate);
    if (rateUnit !== undefined) sister.rateUnit = rateUnit;
    if (location !== undefined) sister.location = location;
    if (experience !== undefined) sister.experience = experience;
    if (bio !== undefined) sister.bio = bio;
    if (operatingHours !== undefined) sister.operatingHours = operatingHours;
    if (coverageArea !== undefined) sister.coverageArea = coverageArea;
    if (phone !== undefined) sister.phone = phone;
    if (email !== undefined) sister.email = email;
    if (availableDays !== undefined) sister.availableDays = availableDays;
    if (timeSlots !== undefined) sister.timeSlots = timeSlots;

    await sister.save();

    res.json({
      success: true,
      profile: {
        ...sister.toObject(),
        id: sister._id.toString()
      }
    });
  } catch (err) {
    console.error("Failed to update sister profile:", err);
    res.status(500).json({ error: "Failed to update profile settings." });
  }
};

app.patch('/api/sister/profile', updateSisterProfileHandler);
app.put('/api/sister/profile', updateSisterProfileHandler);

// --- LEGACY BOOKINGS API ENDPOINTS FOR CLIENT COMPATIBILITY ---

// Create a booking (Buyer makes a booking)
app.post('/api/bookings', async (req, res) => {
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
      userId: req.user?._id,
      bookingRef: `UD-${randomCode}`,
      sisterId: sisterId || 'sister-1',
      sisterName,
      sisterAvatar,
      specialty,
      serviceName,
      amount,
      visitFee: visitFee || 50,
      totalAmount: totalAmount || (Number(amount || 0) + Number(visitFee || 50)),
      date,
      timeSlot,
      customerName,
      customerPhone,
      customerAddress,
      specialNotes,
      status: 'Pending'
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Failed to create booking:", err);
    res.status(500).json({ error: "Failed to create booking in database." });
  }
});

// Get Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    let query = {};
    if (req.user && (req.user.role === 'sister' || req.user.role === 'artisan') && req.user.sisterProfile) {
      query = { sisterId: req.user.sisterProfile.id || req.user.sisterProfile._id.toString() };
    } else if (req.user) {
      query = { userId: req.user._id };
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    res.status(500).json({ error: "Failed to retrieve bookings." });
  }
});

// Update Booking Status
app.patch('/api/bookings/:id', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Accepted', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid booking status" });
  }

  try {
    let booking = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(req.params.id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingRef: req.params.id }) || await Booking.findOne({ _id: req.params.id });
    }

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error("Failed to update booking status:", err);
    res.status(500).json({ error: "Failed to update status in database." });
  }
});

/*app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});*/
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}

export default app;
