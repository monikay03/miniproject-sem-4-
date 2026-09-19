import mongoose from 'mongoose';

const sisterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed },
  name: String,
  specialty: String,
  category: String,
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 0 },
  rate: Number,
  rateUnit: String,
  likes: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  subscription: { type: String, default: 'free' },
  avatar: String,
  distance: String,
  distanceKm: Number,
  location: String,
  experience: String,
  bio: String,
  operatingHours: { type: String, default: '9:00 AM - 7:00 PM' },
  coverageArea: { type: String, default: 'Within 5 km radius' },
  phone: String,
  email: String,
  availableDays: [String],
  timeSlots: [String],
  services: [{
    id: String,
    name: String,
    price: Number,
    duration: String,
    stockStatus: { type: String, default: 'Available for Booking' }
  }],
  badges: [String],
  enrolledDate: { type: Date, default: Date.now }
});

export default mongoose.model('Sister', sisterSchema);
