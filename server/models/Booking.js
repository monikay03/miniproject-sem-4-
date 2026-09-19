import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed },
  bookingRef: String,
  sisterId: String, // String representation of sister profile ID
  sisterName: String,
  sisterAvatar: String,
  specialty: String,
  serviceName: String,
  amount: Number,
  visitFee: Number,
  totalAmount: Number,
  date: String,
  timeSlot: String,
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  specialNotes: String,
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'], 
    default: 'Pending' 
  },
  orderType: { type: String, enum: ['service', 'product'], default: 'service' },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    image: String
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Booking', bookingSchema);
