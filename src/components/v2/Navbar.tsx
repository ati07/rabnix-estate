'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Heart, 
  Sparkles, 
  PlusCircle, 
  Calculator, 
  TrendingUp, 
  ChevronDown, 
  Search, 
  Phone, 
  User, 
  Users,
  Menu, 
  X, 
  ShieldCheck,
  Home,
  Building,
  Key,
  BadgePercent
} from 'lucide-react';
import { CityInfo, ListingType } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';

interface NavbarProps {
  isAuthenticated: boolean;
  selectedCity: CityInfo;
  onOpenCitySelector: () => void;
  onSelectListingType: (type: ListingType) => void;
  currentListingType: ListingType;
  shortlistCount: number;
  onOpenShortlist: () => void;
  onOpenPostProperty: () => void;
  onOpenEmiCalculator: () => void;
  onOpenAiValuation: () => void;
  onOpenAiGenie: () => void;
}

export function Navbar({
  isAuthenticated,
  selectedCity,
  onOpenCitySelector,
  onSelectListingType,
  currentListingType,
  shortlistCount,
  onOpenShortlist,
  onOpenPostProperty,
  onOpenEmiCalculator,
  onOpenAiValuation,
  onOpenAiGenie
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleNavClick = (type: ListingType) => {
    onSelectListingType(type);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs border-b border-[#E2E8F0]">
      {/* Top Mini Bar */}
      <div className="bg-[#0F2A43] text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-[#163b5c]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-slate-300 font-medium">
              India&apos;s No. 1 Property Portal
            </span>
            <div className="flex items-center gap-1.5 bg-[#163b5c]/80 px-2 py-0.5 rounded text-white text-[11px] font-medium border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C39A]" />
              <span>100% Verified Listings & RERA Registered Projects</span>
            </div>
          </div>

          <div className="flex items-center space-x-5 text-slate-200 text-xs font-medium">
            <button 
              id="nav-mb-advice-btn"
              onClick={onOpenAiValuation}
              className="hover:text-[#22C39A] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#22C39A]" />
              <span>AI Property Valuation</span>
            </button>
            <button 
              id="nav-emi-calc-top-btn"
              onClick={onOpenEmiCalculator}
              className="hover:text-[#22C39A] flex items-center gap-1 transition-colors cursor-pointer hidden sm:flex"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>EMI Calculator</span>
            </button>
            <div className="flex items-center gap-1.5 text-slate-400 border-l border-[#163b5c] pl-4 hidden md:flex">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Toll Free: 1800-41-99099</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          
          {/* Brand Logo & City Selector */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div 
              id="nav-brand-logo"
              onClick={() => handleNavClick('buy')}
              className="cursor-pointer flex items-center gap-2 group select-none shrink-0"
            >
              {/* Geometric Brand Logo */}
              <div className="w-8 h-8 bg-[#0F2A43] rounded-md flex items-center justify-center shadow-sm shrink-0 group-hover:bg-[#163b5c] transition-colors">
                <div className="w-3.5 h-3.5 border-2 border-[#18A67D] rotate-45 transition-transform group-hover:rotate-90 duration-300"></div>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F2A43] whitespace-nowrap">
                Rabnix <span className="text-[#18A67D]">Estate</span>
              </span>
            </div>

            {/* City Selector Pill */}
            <button
              id="nav-city-selector-btn"
              onClick={onOpenCitySelector}
              className="flex items-center gap-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#172033] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-[#CBD5E1] shrink-0 whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
              <span>{selectedCity.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 text-xs xl:text-sm font-semibold text-[#172033]">
            <button
              id="nav-link-buy"
              onClick={() => handleNavClick('buy')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'buy'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Buy
            </button>

            <button
              id="nav-link-rent"
              onClick={() => handleNavClick('rent')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'rent'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Rent
            </button>

            <button
              id="nav-link-commercial"
              onClick={() => handleNavClick('commercial')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'commercial'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Commercial
            </button>

            <button
              id="nav-link-plot"
              onClick={() => handleNavClick('plot')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'plot'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Plots / Land
            </button>

            <button
              id="nav-link-pg"
              onClick={() => handleNavClick('pg')}
              className={`hidden xl:inline-block px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'pg'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              PG / Co-Living
            </button>

            <button
              id="nav-link-valuation"
              onClick={onOpenAiValuation}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap hover:text-[#18A67D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
              <span>Price Trends</span>
            </button>

            {/* More Menu for screens between lg and 2xl */}
            <div className="relative inline-block 2xl:hidden">
              <button
                id="nav-more-dropdown-trigger"
                onClick={() => setActiveDropdown(activeDropdown === 'more' ? null : 'more')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[#172033] hover:text-[#18A67D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {activeDropdown === 'more' && (
                <div 
                  className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-1.5 z-50 animate-in fade-in space-y-0.5"
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    onClick={() => {
                      handleNavClick('pg');
                      setActiveDropdown(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-[#E7F6F1] hover:text-[#0E7C5D] rounded-lg transition-colors cursor-pointer xl:hidden"
                  >
                    <Users className="w-4 h-4 text-[#18A67D]" />
                    <span>PG & Co-Living</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenEmiCalculator();
                      setActiveDropdown(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] hover:text-[#18A67D] rounded-lg transition-colors cursor-pointer"
                  >
                    <BadgePercent className="w-4 h-4 text-amber-500" />
                    <span>EMI Calculator</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenAiValuation();
                      setActiveDropdown(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] hover:text-[#18A67D] rounded-lg transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-[#18A67D]" />
                    <span>AI Price Trends</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Shortlist Heart Button */}
            <button
              id="nav-shortlist-btn"
              onClick={onOpenShortlist}
              className="relative p-2 text-[#172033] hover:text-[#18A67D] hover:bg-[#F8FAFC] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F0] cursor-pointer shrink-0"
              title="View Shortlisted Properties"
            >
              <Heart className="w-5 h-5" />
              {shortlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#18A67D] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {shortlistCount}
                </span>
              )}
            </button>

            {/* Sign In / Account — links into the (site) auth pages (full load across route groups) */}
            {isAuthenticated ? (
              <a
                id="nav-account-btn"
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 border border-[#E2E8F0] text-[#172033] hover:text-[#18A67D] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title="My account"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Account</span>
              </a>
            ) : (
              <a
                id="nav-signin-btn"
                href="/login"
                className="hidden sm:flex items-center gap-1.5 border border-[#E2E8F0] text-[#172033] hover:text-[#18A67D] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title="Sign in to your account"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Sign In</span>
              </a>
            )}

            {/* Post Property FREE Button */}
            <button
              id="nav-post-property-btn"
              onClick={onOpenPostProperty}
              className="flex items-center gap-1.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Post Property</span>
              <span className="bg-[#0E7C5D] text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider ml-0.5 text-white shrink-0">
                FREE
              </span>
            </button>

            {/* Mobile Menu Button */}
            <button
              id="nav-mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#172033] hover:text-[#0F2A43] rounded-lg hover:bg-[#F1F5F9] shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E2E8F0] px-4 py-4 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNavClick('buy')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'buy' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Buy Properties
            </button>
            <button
              onClick={() => handleNavClick('rent')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'rent' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Rent Homes
            </button>
            <button
              onClick={() => handleNavClick('commercial')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'commercial' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Commercial
            </button>
            <button
              onClick={() => handleNavClick('pg')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'pg' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              PG / Co-Living
            </button>
            <button
              onClick={() => handleNavClick('plot')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'plot' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Plots & Lands
            </button>
            <button
              onClick={() => {
                onOpenEmiCalculator();
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] flex items-center justify-between"
            >
              <span>EMI Calculator</span>
              <Calculator className="w-4 h-4 text-amber-500" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenAiValuation();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 bg-[#E7F6F1] text-[#0E7C5D] rounded-lg font-bold text-xs uppercase tracking-wider border border-[#18A67D]/20"
            >
              <span>AI Property Valuation & Trends</span>
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onOpenAiGenie();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 bg-[#0F2A43] text-white rounded-lg font-bold text-xs uppercase tracking-wider"
            >
              <span>Ask Rabnix Genie AI Assistant</span>
              <Sparkles className="w-4 h-4 text-[#22C39A]" />
            </button>
            <a
              href={isAuthenticated ? '/dashboard' : '/login'}
              className="w-full flex items-center justify-between p-2.5 bg-[#F8FAFC] text-[#172033] rounded-lg font-bold text-xs uppercase tracking-wider border border-[#E2E8F0]"
            >
              <span>{isAuthenticated ? 'My Account' : 'Sign In'}</span>
              <User className="w-4 h-4 text-[#18A67D]" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
