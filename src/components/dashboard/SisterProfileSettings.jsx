import React, { useState, useEffect } from 'react';
import { useSisterDashboard } from '../../context/SisterDashboardContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { 
  Edit3, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Store, 
  Save, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

export default function SisterProfileSettings() {
  const { profile, updateShopProfile } = useSisterDashboard();
  const { currentUser } = useAuth();

  const [specialty, setSpecialty] = useState(profile?.specialty || '');
  const [rate, setRate] = useState(profile?.rate !== undefined ? profile.rate : '');
  const [rateUnit, setRateUnit] = useState(profile?.rateUnit || '/visit');
  const [location, setLocation] = useState(profile?.location || '');
  const [category, setCategory] = useState(profile?.category || 'tailoring');
  const [bio, setBio] = useState(profile?.bio !== undefined ? profile.bio : (profile?.experience !== undefined ? profile.experience : ''));
  const [operatingHours, setOperatingHours] = useState(profile?.operatingHours || '9:00 AM - 7:00 PM');
  const [coverageArea, setCoverageArea] = useState(profile?.coverageArea || 'Within 10 km radius');
  const [phone, setPhone] = useState(profile?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(profile?.email || currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.specialty !== undefined) setSpecialty(profile.specialty);
      if (profile.rate !== undefined) setRate(profile.rate);
      if (profile.rateUnit !== undefined) setRateUnit(profile.rateUnit);
      if (profile.location !== undefined) setLocation(profile.location);
      if (profile.category !== undefined) setCategory(profile.category);
      if (profile.bio !== undefined) setBio(profile.bio);
      else if (profile.experience !== undefined) setBio(profile.experience);
      if (profile.operatingHours !== undefined) setOperatingHours(profile.operatingHours);
      if (profile.coverageArea !== undefined) setCoverageArea(profile.coverageArea);
      if (profile.phone !== undefined) setPhone(profile.phone);
      if (profile.email !== undefined) setEmail(profile.email);
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    await updateShopProfile({
      specialty,
      rate: Number(rate),
      rateUnit,
      location,
      category,
      bio,
      experience: bio,
      operatingHours,
      coverageArea,
      phone,
      email
    });

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-warm-200">
        <h2 className="text-xl font-bold font-serif text-gray-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-[#d81b60]" />
          Seller Studio & Shopfront Settings
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Customize how your profile, contact details, operating hours, and service radius appear to local buyers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Column (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-warm-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Specialty & Skill Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Studio Specialty Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boutique Tailoring & Custom Bridal Stitching"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Skill Domain</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white font-medium"
                >
                  <option value="tailoring">Boutique Tailoring & Stitching</option>
                  <option value="pottery">Clay & Terracotta Pottery</option>
                  <option value="craft">Handmade Crafts & Folk Arts</option>
                  <option value="textile">Kantha & Handloom Textiles</option>
                  <option value="mehendi">Bridal & Arabic Mehendi Artist</option>
                  <option value="cooking">Home Cook & Tiffin Service</option>
                  <option value="beauty">Beauty & Herbal Skincare</option>
                </select>
              </div>
            </div>

            {/* Base Pricing & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Base Visit Fee (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 450"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 font-bold text-pink-700 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pricing Unit / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. /visit or /item"
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300"
                />
              </div>
            </div>

            {/* Operating Hours & Local Area Coverage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-pink-700" />
                  <span>Operating Hours *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9:00 AM - 7:00 PM (Mon-Sat)"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-700" />
                  <span>Local Area Coverage *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Within 8 km radius of Sector 14"
                  value={coverageArea}
                  onChange={(e) => setCoverageArea(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
                />
              </div>
            </div>

            {/* Location & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Studio Location Hub</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 14, Urban Enclave"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-pink-700" />
                  <span>Contact Phone</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-pink-700" />
                  <span>Studio Email</span>
                </label>
                <input
                  type="email"
                  placeholder="artisan@udaan.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300"
                />
              </div>
            </div>

            {/* Shop Bio / Experience */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Studio Bio & Artisanal Story
              </label>
              <textarea
                rows={4}
                placeholder="Share your experience, technique highlights, custom tailoring options, and work philosophy..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-warm-300 resize-none focus:outline-none focus:ring-1 focus:ring-pink-500 leading-relaxed font-light"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-[#d81b60] hover:bg-[#c2185b] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving to Database...' : 'Save Studio Profile Settings'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right Preview Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-warm-200">
            <span className="text-[10px] uppercase font-bold tracking-wider text-pink-900 bg-pink-50 px-2.5 py-1 rounded-full block w-fit mb-3">
              Live Customer Preview
            </span>
            <h4 className="font-bold text-xs text-gray-500 mb-3">How buyers see your card:</h4>

            {/* Card Preview */}
            <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={profile?.avatar || currentUser?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"}
                  alt={profile?.name || currentUser?.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-pink-300"
                />
                <div>
                  <h5 className="font-bold text-sm text-gray-900 font-serif">
                    {profile?.name || currentUser?.name}
                  </h5>
                  <p className="text-[11px] text-gray-500">{specialty || 'Boutique Tailoring'}</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-warm-150 space-y-1.5 font-light">
                <p className="text-[11px] line-clamp-3 text-gray-700 italic">
                  "{bio || "Expert handcrafted creations and personalized services."}"
                </p>
                <div className="pt-2 border-t border-warm-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span>🕒 {operatingHours}</span>
                  <span className="text-pink-700 font-bold">📍 {coverageArea}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-extrabold text-pink-700 font-serif">
                  {formatCurrency(Number(rate) || 450)} <span className="text-[10px] font-normal text-gray-400">{rateUnit}</span>
                </span>
                <span className="text-[10px] font-bold bg-[#d81b60] text-white px-3 py-1 rounded-lg">
                  Book Doorstep Visit
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
