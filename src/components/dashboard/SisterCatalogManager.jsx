import React, { useState } from 'react';
import { useSisterDashboard } from '../../context/SisterDashboardContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ShoppingBag, 
  Sparkles, 
  Tag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Image as ImageIcon, 
  Zap, 
  Search, 
  Layers, 
  AlertCircle,
  X
} from 'lucide-react';

export default function SisterCatalogManager({ onOpenUpgrade }) {
  const { 
    catalogItems, 
    catalogLoading, 
    catalogFilter, 
    setCatalogFilter,
    createListing, 
    updateListing, 
    toggleListingAvailability, 
    deleteListing 
  } = useSisterDashboard();

  const { currentUser } = useAuth();
  const isPro = currentUser?.subscription === 'pro';

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [itemType, setItemType] = useState('product'); // 'product' | 'service'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('craft');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [duration, setDuration] = useState('60 mins');
  const [stockStatus, setStockStatus] = useState('In Stock');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listing Limit
  const totalListings = catalogItems.length;
  const isLimitReached = !isPro && totalListings >= 3;

  const resetForm = () => {
    setTitle('');
    setCategory('craft');
    setPrice('');
    setOriginalPrice('');
    setDescription('');
    setImage('');
    setDuration('60 mins');
    setStockStatus(itemType === 'service' ? 'Available for Booking' : 'In Stock');
    setEditingItem(null);
  };

  const openAddModal = (type = 'product') => {
    if (isLimitReached) {
      alert("⚠️ Free Starter Limit Reached: You can list up to 3 services/products in total. Upgrade to Udaan Pro for unlimited catalog listings!");
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }
    resetForm();
    setItemType(type);
    setStockStatus(type === 'service' ? 'Available for Booking' : 'In Stock');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemType(item.itemType || 'product');
    setTitle(item.title || item.name || '');
    setCategory(item.category || 'craft');
    setPrice(item.price || '');
    setOriginalPrice(item.originalPrice || '');
    setDescription(item.description || '');
    setImage(item.image || '');
    setDuration(item.duration || '60 mins');
    setStockStatus(item.stockStatus || (item.inStock ? 'In Stock' : 'Out of Stock'));
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      name: title.trim(),
      category: category || 'craft',
      itemType: itemType || 'product',
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : null,
      description: description.trim(),
      image: image.trim() || (itemType === 'service' 
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80" 
        : "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80"),
      duration: itemType === 'service' ? (duration || '60 mins') : undefined,
      stockStatus: stockStatus || (itemType === 'service' ? 'Available for Booking' : 'In Stock'),
      sellerId: currentUser?.id || currentUser?._id || currentUser?.sisterId || 'sister-1',
      userId: currentUser?.id || currentUser?._id,
      artisan: currentUser?.name || 'Skilled Sister'
    };

    if (editingItem) {
      await updateListing(editingItem.id || editingItem._id, payload);
    } else {
      await createListing(payload);
    }

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from your catalog?`)) {
      await deleteListing(id);
    }
  };

  // Filter & Search listings
  const filteredListings = catalogItems.filter(item => {
    if (catalogFilter === 'product' && item.itemType === 'service') return false;
    if (catalogFilter === 'service' && item.itemType !== 'service') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (item.title || item.name || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      return matchName || matchCat || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-warm-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-150">
          <div>
            <h2 className="text-xl font-bold font-serif text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#d81b60]" />
              Products & Services Catalog
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage your craft inventory and doorstep service packages visible to local clients.
            </p>
          </div>

          {/* Add Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openAddModal('product')}
              className="px-4 py-2 bg-[#d81b60] hover:bg-[#c2185b] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Craft Product</span>
            </button>
            <button
              onClick={() => openAddModal('service')}
              className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-[#d81b60] border border-pink-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Add Service Package</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {[
              { key: 'all', label: 'All Listings', count: catalogItems.length },
              { key: 'product', label: 'Craft Products', count: catalogItems.filter(i => i.itemType !== 'service').length },
              { key: 'service', label: 'Service Packages', count: catalogItems.filter(i => i.itemType === 'service').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCatalogFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  catalogFilter === tab.key
                    ? 'bg-[#d81b60] text-white shadow-sm'
                    : 'bg-warm-50 text-gray-600 hover:bg-warm-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  catalogFilter === tab.key ? 'bg-white/20 text-white' : 'bg-warm-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-warm-50 border border-warm-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
            />
          </div>
        </div>

        {/* Free Tier Notice */}
        {!isPro && (
          <div className="mt-4 pt-3 border-t border-warm-150 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
            <span>
              Listings used: <strong className="text-gray-900 font-bold">{totalListings} / 3 Free Limit</strong>
            </span>
            <button
              onClick={onOpenUpgrade}
              className="text-[#d81b60] font-bold hover:underline flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Unlock Unlimited Listings with Pro</span>
            </button>
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      {catalogLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-warm-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#d81b60] mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading catalog items...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-warm-200 space-y-3">
          <Layers className="w-12 h-12 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-800 font-serif">No Listings Found</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery 
              ? `No items matching "${searchQuery}".`
              : "Get started by adding your first handmade craft product or doorstep service package!"}
          </p>
          <button
            onClick={() => openAddModal('product')}
            className="px-5 py-2.5 bg-[#d81b60] hover:bg-[#c2185b] text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Listing</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map(item => {
            const isService = item.itemType === 'service';
            const isOutOfStock = item.stockStatus === 'Out of Stock';
            const id = item.id || item._id;

            return (
              <div
                key={id}
                className="bg-white rounded-3xl overflow-hidden border border-warm-200 shadow-sm hover:border-pink-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Image & Type Header */}
                <div className="relative h-44 bg-warm-100 overflow-hidden">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80"}
                    alt={item.title || item.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                      isOutOfStock ? 'grayscale opacity-75' : ''
                    }`}
                  />
                  
                  {/* Item Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                      isService ? 'bg-purple-600 text-white' : 'bg-pink-700 text-white'
                    }`}>
                      {isService ? '🛠️ Doorstep Service' : '🏺 Physical Craft'}
                    </span>
                  </div>

                  {/* Stock Status Pill Button (Quick Toggle) */}
                  <button
                    onClick={() => toggleListingAvailability(id, item.stockStatus, item.itemType)}
                    title="Click to toggle availability"
                    className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                      isOutOfStock 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {isOutOfStock ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    <span>{item.stockStatus || (isService ? 'Available for Booking' : 'In Stock')}</span>
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {item.category || 'Handcrafted'}
                      </span>
                      {isService && item.duration && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium bg-warm-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          {item.duration}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 font-serif text-base line-clamp-1">
                      {item.title || item.name}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description || "Crafted with love and precision."}
                    </p>
                  </div>

                  {/* Price & Actions Row */}
                  <div className="pt-3 border-t border-warm-150 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold font-serif text-pink-700">
                          {formatCurrency(item.price)}
                        </span>
                        {item.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatCurrency(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-gray-500 hover:text-pink-700 hover:bg-pink-50 rounded-xl transition-colors"
                        title="Edit Listing Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(id, item.title || item.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD / EDIT PRODUCT/SERVICE MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-warm-200 animate-fade-in relative my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-warm-150 mb-5">
              <div>
                <h3 className="text-lg font-bold font-serif text-gray-900">
                  {editingItem ? 'Edit Listing Details' : `Add New ${itemType === 'service' ? 'Service Package' : 'Craft Product'}`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Save listing to update your dynamic storefront instantly.
                </p>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-warm-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Switcher (only when adding new) */}
              {!editingItem && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Listing Category Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setItemType('product');
                        setStockStatus('In Stock');
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        itemType === 'product'
                          ? 'bg-pink-50 border-[#d81b60] text-[#d81b60]'
                          : 'bg-white border-warm-300 text-gray-600 hover:bg-warm-50'
                      }`}
                    >
                      <span>🏺 Craft Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemType('service');
                        setStockStatus('Available for Booking');
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        itemType === 'service'
                          ? 'bg-pink-50 border-[#d81b60] text-[#d81b60]'
                          : 'bg-white border-warm-300 text-gray-600 hover:bg-warm-50'
                      }`}
                    >
                      <span>🛠️ Doorstep Service</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {itemType === 'service' ? 'Service Title *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={itemType === 'service' ? 'e.g. Designer Blouse Stitching' : 'e.g. Handcrafted Ceramic Vase'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
                />
              </div>

              {/* Category & Pricing Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Craft / Skill Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white"
                  >
                    <option value="craft">Handmade Crafts & Art</option>
                    <option value="tailoring">Boutique Tailoring</option>
                    <option value="pottery">Clay & Terracotta Pottery</option>
                    <option value="textile">Handloom & Kantha Textiles</option>
                    <option value="mehendi">Henna & Mehendi Art</option>
                    <option value="cooking">Homemade Food & Pickles</option>
                    <option value="beauty">Organic Skincare & Herbal</option>
                    <option value="jewelry">Tribal Handcrafted Jewelry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Duration (for service) or Original Price (for product) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {itemType === 'service' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Visit Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white"
                    >
                      <option value="30 mins">30 mins</option>
                      <option value="45 mins">45 mins</option>
                      <option value="60 mins">60 mins</option>
                      <option value="75 mins">75 mins</option>
                      <option value="90 mins">90 mins</option>
                      <option value="120 mins">120 mins</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Original Price (₹ - Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 600"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock / Availability Status</label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white font-medium"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Available for Booking">Available for Booking</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Image URL with Preview */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL / Asset Link</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-warm-300"
                  />
                  {image && (
                    <img src={image} alt="preview" className="w-10 h-10 rounded-xl object-cover border border-warm-300" />
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Detail the materials used, unique artisanal aspects, or service deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-warm-300 resize-none focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-150">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-warm-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#d81b60] hover:bg-[#c2185b] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
