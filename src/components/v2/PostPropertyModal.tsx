'use client';

import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Home, 
  MapPin, 
  IndianRupee, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle, 
  Check, 
  Camera, 
  Phone,
  Building,
  Key,
  Layers,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Property, ListingType, PropertyCategory, FurnishingStatus, FacingDirection, ConstructionStatus, PostPropertyFormState } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';
import { formatIndianCurrency } from '@/lib/formatters';
import { formToListingInput } from '@/lib/property-adapter';

interface PostPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: (newProperty: Property) => void;
}

export function PostPropertyModal({
  isOpen,
  onClose,
  onPropertyAdded,
}: PostPropertyModalProps) {
  const [step, setStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  // Form Fields
  const [listingType, setListingType] = useState<ListingType>('buy');
  const [category, setCategory] = useState<PropertyCategory>('Apartment');
  const [city, setCity] = useState<string>('Bangalore');
  const [locality, setLocality] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [bhk, setBhk] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<number>(1150);
  const [price, setPrice] = useState<number>(8500000);
  const [maintenance, setMaintenance] = useState<number>(3500);
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('Semi-Furnished');
  const [floor, setFloor] = useState<number>(4);
  const [totalFloors, setTotalFloors] = useState<number>(14);
  const [facing, setFacing] = useState<FacingDirection>('East');
  const [constructionStatus, setConstructionStatus] = useState<ConstructionStatus>('Ready to Move');
  const [reraId, setReraId] = useState<string>('PRM/KA/RERA/2026/0019');
  const [description, setDescription] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Clubhouse (40,000 sq.ft)',
    'Temperature Controlled Infinity Pool',
    'Fully Equipped Gymnasium',
    '24/7 Power Backup',
    'Children Play Area with Splash Pool'
  ]);
  const [ownerName, setOwnerName] = useState<string>('Amit Sharma');
  const [ownerPhone, setOwnerPhone] = useState<string>('+91 98765 43210');
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  );

  if (!isOpen) return null;

  const AMENITIES_LIST = [
    'Clubhouse (40,000 sq.ft)',
    'Temperature Controlled Infinity Pool',
    'Fully Equipped Gymnasium',
    'Squash & Badminton Courts',
    '24/7 Power Backup',
    'EV Charging Stations',
    'Multipurpose Hall',
    'Children Play Area with Splash Pool',
    'Jogging & Cycling Track',
    'Private Lift Foyer',
    '100% DG Power Backup',
    'CCTV Survaillance with Smart App access'
  ];

  const handleAmenityToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  // Assemble the v1 form state, then persist through the real backend: create a draft
  // (POST /api/listings, which find-or-creates the city/locality and maps enums via the adapter),
  // then submit it (auto-live in dev, pending in prod). See docs/frontend-port-v1.md §5 Phase 3.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNeedLogin(false);

    const form: PostPropertyFormState = {
      listingType,
      category,
      city,
      locality,
      title,
      bhk,
      bathrooms,
      carpetAreaSqFt,
      superBuiltUpAreaSqFt: Math.round(carpetAreaSqFt * 1.3),
      price,
      maintenance,
      furnishing,
      floor,
      totalFloors,
      facing,
      constructionStatus,
      possessionDate: 'Immediate',
      reraId,
      amenities: selectedAmenities,
      description,
      ownerName,
      ownerPhone,
      ownerEmail: '',
      imageUrls: photoUrl ? [photoUrl] : [],
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...formToListingInput(form), city, locality }),
      });

      if (res.status === 401) {
        setNeedLogin(true);
        setError('Sign in to post your property.');
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(err?.error?.message ?? 'Could not create listing.');
        setBusy(false);
        return;
      }

      const { listing } = (await res.json()) as { listing: { id: string } };
      const pub = await fetch(`/api/listings/${listing.id}/submit`, { method: 'POST' });
      if (!pub.ok) {
        setError('Draft saved, but submitting for review failed. Try again from your dashboard.');
        setBusy(false);
        return;
      }

      onPropertyAdded(buildOptimisticProperty(listing.id));
      setIsSubmitted(true);
    } catch {
      setError('Network error — check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  // Optimistic card so the user sees their listing immediately (v1 UX). The canonical row lives in
  // the DB and re-hydrates on the next server render via the adapter.
  const buildOptimisticProperty = (id: string): Property => {
    const formattedPrice = listingType === 'rent' || listingType === 'pg'
      ? `₹${price.toLocaleString('en-IN')} / mo`
      : formatIndianCurrency(price);

    return {
      id,
      title: title || `${bhk} BHK ${category} in ${locality || 'Prime Locality'}, ${city}`,
      listingType,
      category,
      city,
      locality: locality || 'Central Hub',
      price,
      priceFormatted: formattedPrice,
      pricePerSqFt: Math.round(price / (carpetAreaSqFt || 1000)),
      maintenance,
      bhk,
      bathrooms,
      carpetAreaSqFt,
      superBuiltUpAreaSqFt: Math.round(carpetAreaSqFt * 1.3),
      furnishing,
      floor,
      totalFloors,
      facing,
      constructionStatus,
      possessionDate: 'Immediate',
      reraId,
      reraApproved: !!reraId,
      isVerified: true,
      isFeatured: true,
      isExclusiveOwner: true,
      images: [
        photoUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80'
      ],
      description: description || `Direct owner listing for ${bhk} BHK in ${locality}, ${city}. Prime location, well-ventilated, 24/7 security and full power backup. Zero brokerage for buyers.`,
      amenities: selectedAmenities,
      postedBy: {
        name: `${ownerName} (Owner)`,
        type: 'Owner',
        phone: ownerPhone,
        responseTime: 'Zero Brokerage - Direct Owner',
        rating: 5.0
      },
      createdAt: new Date().toISOString().split('T')[0]
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-neutral-200">
        
        {/* Header */}
        <div className="bg-[#0F2A43] text-white px-6 py-4 flex items-center justify-between border-b border-[#163b5c]">
          <div className="flex items-center gap-2">
            <div className="bg-[#18A67D] text-white text-xs font-black px-2 py-0.5 rounded-xs">
              Rabnix Estate
            </div>
            <h2 className="text-sm font-bold">Post Property for Sale or Rent - 100% FREE</h2>
          </div>
          <button
            id="post-property-close-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-[#F8FAFC] px-6 py-3 border-b border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#64748B]">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#18A67D]' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">1</span>
            <span>Type & City</span>
          </div>
          <div className="w-12 h-0.5 bg-[#CBD5E1]" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#18A67D]' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">2</span>
            <span>Area & Price</span>
          </div>
          <div className="w-12 h-0.5 bg-[#CBD5E1]" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#18A67D]' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">3</span>
            <span>Photos & Publish</span>
          </div>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-[#E7F6F1] text-[#0E7C5D] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#0F2A43]">Property Published Successfully!</h3>
            <p className="text-sm text-[#64748B] max-w-md mx-auto">
              Your property has been listed on Rabnix Estate with verified status and zero brokerage. You will start receiving direct buyer enquiries.
            </p>
            <button
              onClick={onClose}
              className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            >
              View My Live Listing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Intent: Sell or Rent */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    I want to:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'buy', label: 'Sell Property' },
                      { id: 'rent', label: 'Rent Out' },
                      { id: 'pg', label: 'PG / Co-Living' },
                      { id: 'commercial', label: 'Commercial' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setListingType(item.id as ListingType)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          listingType === item.id
                            ? 'border-[#18A67D] bg-[#E7F6F1] text-[#0E7C5D] shadow-xs'
                            : 'border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Property Category:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Residential Plot', 'Commercial Office'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat as PropertyCategory)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          category === cat
                            ? 'border-[#0F2A43] bg-[#0F2A43] text-white'
                            : 'border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City & Locality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      {CITIES_DATA.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Locality / Neighborhood</label>
                    <input
                      type="text"
                      required
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Indiranagar, Bandra West, Whitefield"
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172033]">Project / Listing Headline</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 3 BHK Luxury Gated Highrise Apartment with Sea View"
                    className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Next: Area & Pricing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Configuration: BHK & Bathrooms */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">BHK</label>
                    <select
                      value={bhk}
                      onChange={(e) => setBhk(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      <option value={1}>1 BHK</option>
                      <option value={2}>2 BHK</option>
                      <option value={3}>3 BHK</option>
                      <option value={4}>4 BHK</option>
                      <option value={5}>5+ BHK</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Bathrooms</label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      <option value={1}>1 Bath</option>
                      <option value={2}>2 Baths</option>
                      <option value={3}>3 Baths</option>
                      <option value={4}>4 Baths</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Carpet Area (sq.ft)</label>
                    <input
                      type="number"
                      required
                      value={carpetAreaSqFt}
                      onChange={(e) => setCarpetAreaSqFt(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Furnishing</label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as FurnishingStatus)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      <option value="Furnished">Furnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                {/* Price & Maintenance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">
                      {listingType === 'rent' || listingType === 'pg' ? 'Expected Monthly Rent (₹)' : 'Expected Total Price (₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                    <span className="text-[11px] font-bold text-[#64748B]">
                      Formatted: {formatIndianCurrency(price)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Monthly Maintenance (₹)</label>
                    <input
                      type="number"
                      value={maintenance}
                      onChange={(e) => setMaintenance(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>
                </div>

                {/* Floor & Facing */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Floor</label>
                    <input
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Total Floors</label>
                    <input
                      type="number"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Facing</label>
                    <select
                      value={facing}
                      onChange={(e) => setFacing(e.target.value as FacingDirection)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      <option value="East">East</option>
                      <option value="North">North</option>
                      <option value="North-East">North-East</option>
                      <option value="West">West</option>
                      <option value="South">South</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#E2E8F0] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Next: Amenities & Photos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Amenities Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Select Amenities:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                    {AMENITIES_LIST.map((am) => {
                      const isSel = selectedAmenities.includes(am);
                      return (
                        <div
                          key={am}
                          onClick={() => handleAmenityToggle(am)}
                          className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                            isSel
                              ? 'bg-[#E7F6F1] border-[#18A67D] text-[#0E7C5D] font-bold'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${isSel ? 'bg-[#18A67D] border-[#18A67D] text-white' : 'border-[#CBD5E1]'}`}>
                            {isSel && <Check className="w-3 h-3" />}
                          </div>
                          <span className="truncate">{am}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Photo URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172033]">Photo URL (Unsplash or Image Link)</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                  />
                </div>

                {/* Owner Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Your Full Name (Owner)</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Mobile Number (+91)</label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>
                </div>

                {/* RERA and Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172033]">Property Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe unique features, view, sunlight, nearby schools, road connectivity..."
                    className="w-full text-xs font-medium bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 space-y-1">
                    <p>{error}</p>
                    {needLogin && (
                      <Link
                        href="/login?redirect=/&mode=register"
                        className="inline-flex items-center gap-1 text-[#0E7C5D] underline"
                      >
                        Sign in to continue
                      </Link>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={busy}
                    className="bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#E2E8F0] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{busy ? 'Publishing…' : 'Publish Listing 100% FREE'}</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
