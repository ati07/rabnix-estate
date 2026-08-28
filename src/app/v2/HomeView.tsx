'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Filter, 
  Sparkles, 
  CheckCircle, 
  ShieldCheck, 
  Award, 
  ArrowUpDown, 
  RotateCcw, 
  SlidersHorizontal,
  Home,
  Bot,
  MapPin,
  ChevronDown,
  Layers,
  Search
} from 'lucide-react';
import { Property, SearchFilters, CityInfo, ListingType, PropertyCategory, ConstructionStatus } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';
import { Navbar } from '@/components/v2/Navbar';
import { HeroSearch } from '@/components/v2/HeroSearch';
import { PropertyCard } from '@/components/v2/PropertyCard';
import { PropertyDetailModal } from '@/components/v2/PropertyDetailModal';
import { PostPropertyModal } from '@/components/v2/PostPropertyModal';
import { EmiCalculatorModal } from '@/components/v2/EmiCalculatorModal';
import { AiValuationModal } from '@/components/v2/AiValuationModal';
import { AiGenieChatDrawer } from '@/components/v2/AiGenieChatDrawer';
import { ShortlistDrawer } from '@/components/v2/ShortlistDrawer';
import { CitySelectorModal } from '@/components/v2/CitySelectorModal';
import { LocalityTrendsSection } from '@/components/v2/LocalityTrendsSection';
import { ExploreCategoriesSection } from '@/components/v2/ExploreCategoriesSection';
import { CuratedCollectionsSection } from '@/components/v2/CuratedCollectionsSection';
import { TopBuildersSection } from '@/components/v2/TopBuildersSection';
import { Footer } from '@/components/v2/Footer';

// Default the active city to where the real inventory actually is (most-listed city among the
// server-fetched set), instead of v1's hardcoded Bangalore — otherwise the client-side city
// filter would hide all seed listings. Falls back to Bangalore when there's no inventory.
function pickInitialCity(properties: Property[]): CityInfo {
  const counts = new Map<string, number>();
  for (const p of properties) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return CITIES_DATA.find((c) => c.name === top) ?? CITIES_DATA[1];
}

// Real listings are fetched server-side (src/app/v2/page.tsx) and passed in as the initial set,
// through the Prisma→Property adapter. The client keeps v1's instant filter/sort UX over them.
export default function HomeView({ initialProperties }: { initialProperties: Property[] }) {
  // Master Property List (seeded from the DB; new posts are prepended client-side)
  const [properties, setProperties] = useState<Property[]>(initialProperties);

  // Active City — seeded from real inventory (see pickInitialCity)
  const [selectedCity, setSelectedCity] = useState<CityInfo>(() => pickInitialCity(initialProperties));

  // Active Search & Filter State
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    listingType: 'buy',
    city: pickInitialCity(initialProperties).name,
    locality: '',
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    bhk: [],
    furnishing: undefined,
    constructionStatus: undefined,
    isVerifiedOnly: false,
    isOwnerOnly: false,
    isReraApprovedOnly: false,
    sortBy: 'recommended'
  }));

  // Shortlisted IDs — real per-user favorites are wired in Phase 4; start empty for now.
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);

  // Modal & Drawer visibility
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [isPostPropertyOpen, setIsPostPropertyOpen] = useState(false);
  const [isEmiCalculatorOpen, setIsEmiCalculatorOpen] = useState(false);
  const [emiInitialPrice, setEmiInitialPrice] = useState<number>(6500000);
  const [isAiValuationOpen, setIsAiValuationOpen] = useState(false);
  const [isGenieDrawerOpen, setIsGenieDrawerOpen] = useState(false);
  const [genieContextProperty, setGenieContextProperty] = useState<Property | null>(null);
  const [isShortlistDrawerOpen, setIsShortlistDrawerOpen] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null);

  // Sync city selection to filter
  const handleSelectCity = (city: CityInfo) => {
    setSelectedCity(city);
    setFilters((prev) => ({
      ...prev,
      city: city.name,
      locality: '' // reset locality on city change
    }));
  };

  const handleToggleShortlist = (propertyId: string) => {
    setShortlistedIds((prev) => 
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  const handlePropertyAdded = (newProperty: Property) => {
    setProperties((prev) => [newProperty, ...prev]);
    // Switch filter to match the new property so user sees it right away
    setFilters((prev) => ({
      ...prev,
      city: newProperty.city,
      listingType: newProperty.listingType,
      locality: ''
    }));
  };

  const handleOpenEmiForPrice = (price: number) => {
    setEmiInitialPrice(price);
    setIsEmiCalculatorOpen(true);
  };

  const handleOpenGenieWithContext = (property: Property) => {
    setGenieContextProperty(property);
    setIsGenieDrawerOpen(true);
  };

  // Filter & Sort Logic
  const filteredProperties = useMemo(() => {
    return properties.filter((item) => {
      // City matching
      if (filters.city && filters.city !== 'All Cities' && item.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }

      // Listing Type
      if (filters.listingType && item.listingType !== filters.listingType) {
        return false;
      }

      // Locality Search
      if (filters.locality && filters.locality.trim() !== '') {
        const query = filters.locality.toLowerCase().trim();
        const matchesLocality = item.locality.toLowerCase().includes(query);
        const matchesSubLocality = item.subLocality?.toLowerCase().includes(query) || false;
        const matchesTitle = item.title.toLowerCase().includes(query);
        if (!matchesLocality && !matchesSubLocality && !matchesTitle) {
          return false;
        }
      }

      // Category
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      // Budget Range
      if (filters.minPrice !== undefined && item.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && item.price > filters.maxPrice) {
        return false;
      }

      // BHK
      if (filters.bhk && filters.bhk.length > 0) {
        if (!item.bhk || !filters.bhk.includes(item.bhk)) {
          return false;
        }
      }

      // Furnishing
      if (filters.furnishing && item.furnishing !== filters.furnishing) {
        return false;
      }

      // Construction Status
      if (filters.constructionStatus && item.constructionStatus !== filters.constructionStatus) {
        return false;
      }

      // Badges
      if (filters.isVerifiedOnly && !item.isVerified) {
        return false;
      }
      if (filters.isOwnerOnly && !item.isExclusiveOwner) {
        return false;
      }
      if (filters.isReraApprovedOnly && !item.reraApproved) {
        return false;
      }
      if (filters.isFeaturedOnly && !item.isFeatured) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price_asc') return a.price - b.price;
      if (filters.sortBy === 'price_desc') return b.price - a.price;
      if (filters.sortBy === 'area_desc') return b.carpetAreaSqFt - a.carpetAreaSqFt;
      if (filters.sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      // Recommended: featured first, then verified, then price
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [properties, filters]);

  const shortlistedProperties = useMemo(() => {
    return properties.filter((p) => shortlistedIds.includes(p.id));
  }, [properties, shortlistedIds]);

  const resetAllFilters = () => {
    setFilters({
      listingType: filters.listingType,
      city: selectedCity.name,
      locality: '',
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      bhk: [],
      furnishing: undefined,
      constructionStatus: undefined,
      isVerifiedOnly: false,
      isOwnerOnly: false,
      isReraApprovedOnly: false,
      sortBy: 'recommended'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#18A67D] selection:text-white font-sans text-[#172033]">
      
      {/* 1. TOP NAVBAR */}
      <Navbar
        selectedCity={selectedCity}
        onOpenCitySelector={() => setIsCitySelectorOpen(true)}
        onSelectListingType={(type) => setFilters((prev) => ({ ...prev, listingType: type }))}
        currentListingType={filters.listingType}
        shortlistCount={shortlistedIds.length}
        onOpenShortlist={() => setIsShortlistDrawerOpen(true)}
        onOpenPostProperty={() => setIsPostPropertyOpen(true)}
        onOpenEmiCalculator={() => {
          setEmiInitialPrice(5000000);
          setIsEmiCalculatorOpen(true);
        }}
        onOpenAiValuation={() => setIsAiValuationOpen(true)}
        onOpenAiGenie={() => {
          setGenieContextProperty(null);
          setIsGenieDrawerOpen(true);
        }}
      />

      {/* 2. HERO SEARCH MODULE */}
      <HeroSearch
        selectedCity={selectedCity}
        currentListingType={filters.listingType}
        onListingTypeChange={(type) => setFilters((prev) => ({ ...prev, listingType: type }))}
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onExecuteSearch={() => {}}
        matchingCount={filteredProperties.length}
        onOpenPostProperty={() => setIsPostPropertyOpen(true)}
      />

      {/* 2.5 EXPLORE REAL ESTATE CATEGORIES (99acres style visual explorer) */}
      <ExploreCategoriesSection
        cityName={selectedCity.name}
        onSelectCategory={(category, listingType) => {
          setFilters((prev) => ({
            ...prev,
            category,
            categories: [category],
            listingType: listingType || prev.listingType
          }));
        }}
      />

      {/* 3. MAIN PROPERTY LISTINGS & FILTER SECTION */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        
        {/* Results Header Bar & Sort Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#0F2A43] tracking-tight">
                {filteredProperties.length} Properties for {filters.listingType === 'buy' ? 'Sale' : filters.listingType === 'rent' ? 'Rent' : filters.listingType.toUpperCase()} in {filters.locality || selectedCity.name}
              </h1>
              {filteredProperties.length > 0 && (
                <span className="bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Live
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verified flats, luxury villas, builder floors & zero-brokerage direct owner listings
            </p>
          </div>

          {/* Quick filter pills & Sort dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Sort selector */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[#64748B] uppercase tracking-wider text-[10px] font-bold">Sort:</span>
              <select
                id="sort-by-select"
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                className="bg-transparent font-bold text-[#172033] outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="area_desc">Carpet Area: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Reset Filters button */}
            <button
              id="reset-filters-btn"
              onClick={resetAllFilters}
              className="text-xs font-bold text-[#64748B] hover:text-[#18A67D] bg-[#F8FAFC] hover:bg-[#E7F6F1] border border-[#E2E8F0] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Tag Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, isOwnerOnly: !prev.isOwnerOnly }))}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs ${
              filters.isOwnerOnly
                ? 'bg-[#0E7C5D] border-[#0E7C5D] text-white shadow-xs'
                : 'bg-white border-[#E2E8F0] text-[#172033] hover:border-[#CBD5E1]'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>0% Brokerage (Owner)</span>
          </button>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, isVerifiedOnly: !prev.isVerifiedOnly }))}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs ${
              filters.isVerifiedOnly
                ? 'bg-[#0F2A43] border-[#0F2A43] text-white shadow-xs'
                : 'bg-white border-[#E2E8F0] text-[#172033] hover:border-[#CBD5E1]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified on Site</span>
          </button>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, isReraApprovedOnly: !prev.isReraApprovedOnly }))}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs ${
              filters.isReraApprovedOnly
                ? 'bg-[#0F2A43] border-[#0F2A43] text-[#22C39A] shadow-xs'
                : 'bg-white border-[#E2E8F0] text-[#172033] hover:border-[#CBD5E1]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>RERA Registered</span>
          </button>

          {/* Construction Status Buttons */}
          <button
            onClick={() => setFilters((prev) => ({ 
              ...prev, 
              constructionStatus: prev.constructionStatus === 'Ready to Move' ? undefined : 'Ready to Move' 
            }))}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap cursor-pointer text-xs ${
              filters.constructionStatus === 'Ready to Move'
                ? 'bg-[#18A67D] border-[#18A67D] text-white shadow-xs'
                : 'bg-white border-[#E2E8F0] text-[#172033] hover:border-[#CBD5E1]'
            }`}
          >
            Ready to Move
          </button>

          <button
            onClick={() => setFilters((prev) => ({ 
              ...prev, 
              constructionStatus: prev.constructionStatus === 'Under Construction' ? undefined : 'Under Construction' 
            }))}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap cursor-pointer text-xs ${
              filters.constructionStatus === 'Under Construction'
                ? 'bg-[#18A67D] border-[#18A67D] text-white shadow-xs'
                : 'bg-white border-[#E2E8F0] text-[#172033] hover:border-[#CBD5E1]'
            }`}
          >
            Under Construction
          </button>
        </div>

        {/* Property Grid List */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-[#E2E8F0] text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-[#E7F6F1] text-[#18A67D] rounded-full flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#0F2A43]">
              No matching properties found in {filters.locality || selectedCity.name}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              We couldn&apos;t find properties matching your current filter criteria. Try adjusting your budget, removing BHK constraints, or exploring nearby localities.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={resetAllFilters}
                className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => setIsGenieDrawerOpen(true)}
                className="bg-[#0F2A43] hover:bg-[#163b5c] text-[#22C39A] text-xs font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Advisor to Find Homes</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                isShortlisted={shortlistedIds.includes(prop.id)}
                onToggleShortlist={handleToggleShortlist}
                onViewDetails={(p) => setSelectedPropertyForModal(p)}
                onContactAgent={(p) => setSelectedPropertyForModal(p)}
                onOpenEmiForProperty={handleOpenEmiForPrice}
              />
            ))}
          </div>
        )}

      </main>

      {/* 4. CURATED PROPERTY COLLECTIONS (99acres style handpicked portfolios) */}
      <CuratedCollectionsSection
        cityName={selectedCity.name}
        onApplyPreset={(presetFilters) => {
          setFilters((prev) => ({
            ...prev,
            ...presetFilters
          }));
        }}
      />

      {/* 5. TOP REPUTED BUILDERS & DEVELOPER SPOTLIGHT */}
      <TopBuildersSection
        cityName={selectedCity.name}
      />

      {/* 6. LOCALITY TRENDS & PRICE INTELLIGENCE */}
      <LocalityTrendsSection
        selectedCity={selectedCity}
        onSelectLocality={(loc) => setFilters((prev) => ({ ...prev, locality: loc }))}
        onOpenAiValuation={() => setIsAiValuationOpen(true)}
      />

      {/* 5. FOOTER */}
      <Footer
        onSelectCity={handleSelectCity}
        onOpenEmiCalculator={() => {
          setEmiInitialPrice(5000000);
          setIsEmiCalculatorOpen(true);
        }}
        onOpenAiValuation={() => setIsAiValuationOpen(true)}
        onOpenPostProperty={() => setIsPostPropertyOpen(true)}
      />

      {/* 6. FLOATING AI GENIE CHAT BUTTON */}
      <button
        id="floating-genie-btn"
        onClick={() => {
          setGenieContextProperty(null);
          setIsGenieDrawerOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 bg-[#0F2A43] hover:bg-[#163b5c] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border border-[#163b5c] cursor-pointer group"
      >
        <div className="w-7 h-7 rounded-md bg-[#18A67D] flex items-center justify-center text-white shadow-sm transform rotate-45">
          <Sparkles className="w-3.5 h-3.5 transform -rotate-45" />
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold flex items-center gap-1">
            <span>Rabnix Genie AI</span>
            <span className="bg-[#18A67D] text-white text-[9px] font-bold px-1 rounded uppercase">Live</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Real Estate & Price Advisor
          </div>
        </div>
      </button>

      {/* MODALS & DRAWERS */}
      {/* 1. Property Detail Modal */}
      {selectedPropertyForModal && (
        <PropertyDetailModal
          property={selectedPropertyForModal}
          isOpen={!!selectedPropertyForModal}
          onClose={() => setSelectedPropertyForModal(null)}
          isShortlisted={shortlistedIds.includes(selectedPropertyForModal.id)}
          onToggleShortlist={handleToggleShortlist}
          onOpenEmiCalculator={() => {
            setEmiInitialPrice(selectedPropertyForModal.price);
            setIsEmiCalculatorOpen(true);
          }}
          onOpenAiGenieWithContext={(p) => handleOpenGenieWithContext(p)}
        />
      )}

      {/* 2. Post Property Modal */}
      <PostPropertyModal
        isOpen={isPostPropertyOpen}
        onClose={() => setIsPostPropertyOpen(false)}
        onPropertyAdded={handlePropertyAdded}
      />

      {/* 3. EMI Calculator Modal */}
      <EmiCalculatorModal
        isOpen={isEmiCalculatorOpen}
        onClose={() => setIsEmiCalculatorOpen(false)}
        initialPrincipal={emiInitialPrice}
      />

      {/* 4. AI Valuation Modal */}
      <AiValuationModal
        isOpen={isAiValuationOpen}
        onClose={() => setIsAiValuationOpen(false)}
        defaultCity={selectedCity.name}
      />

      {/* 5. Rabnix Genie Chat Drawer */}
      <AiGenieChatDrawer
        isOpen={isGenieDrawerOpen}
        onClose={() => setIsGenieDrawerOpen(false)}
        contextProperty={genieContextProperty}
      />

      {/* 6. Shortlist Drawer */}
      <ShortlistDrawer
        isOpen={isShortlistDrawerOpen}
        onClose={() => setIsShortlistDrawerOpen(false)}
        shortlistedProperties={shortlistedProperties}
        onRemoveFromShortlist={handleToggleShortlist}
        onViewPropertyDetails={(p) => setSelectedPropertyForModal(p)}
        onContactAgent={(p) => setSelectedPropertyForModal(p)}
      />

      {/* 7. City Selector Modal */}
      <CitySelectorModal
        isOpen={isCitySelectorOpen}
        onClose={() => setIsCitySelectorOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
      />

    </div>
  );
}
