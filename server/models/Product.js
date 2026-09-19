import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.Mixed },
  sisterId: String,
  name: { type: String, default: 'Untitled Listing' },
  title: { type: String, default: 'Untitled Listing' },
  artisan: String,
  state: String,
  category: { type: String, default: 'craft' },
  itemType: { type: String, enum: ['product', 'service'], default: 'product' },
  price: { type: Number, required: true, default: 0 },
  originalPrice: Number,
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 0 },
  image: { type: String, default: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80' },
  images: [String],
  description: { type: String, default: '' },
  materials: String,
  dimensions: String,
  duration: String,
  stockStatus: { 
    type: String, 
    enum: ['In Stock', 'Out of Stock', 'Available for Booking'], 
    default: 'In Stock' 
  },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);
