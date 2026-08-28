'use client';

import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { CITIES_DATA } from '@/lib/realEstateData';
import { CityInfo } from '@/lib/types';

interface FooterProps {
  onSelectCity: (city: CityInfo) => void;
  onOpenEmiCalculator: () => void;
  onOpenAiValuation: () => void;
  onOpenPostProperty: () => void;
}

export function Footer({
  onSelectCity,
  onOpenEmiCalculator,
  onOpenAiValuation,
  onOpenPostProperty,
}: FooterProps) {
  return (
    <footer className="bg-[#0F2A43] text-slate-300 text-xs border-t border-[#163b5c]">
      
      {/* Top Banner with Key Metrics */}
      <div className="border-b border-[#163b5c] py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          
          <div className="space-y-1">
            <div className="text-xl font-bold text-white tracking-tight">2 Million+</div>
            <div className="text-slate-300 text-xs">Active Real Estate Listings</div>
          </div>

          <div className="space-y-1">
            <div className="text-xl font-bold text-white tracking-tight">500+ Cities</div>
            <div className="text-slate-300 text-xs">Pan-India Real Estate Coverage</div>
          </div>

          <div className="space-y-1">
            <div className="text-xl font-bold text-white tracking-tight">15 Million+</div>
            <div className="text-slate-300 text-xs">Monthly Home Buyers & Renters</div>
          </div>

          <div className="space-y-1">
            <div className="text-xl font-bold text-white tracking-tight">100% RERA</div>
            <div className="text-slate-300 text-xs">Strict Legal & Title Verification</div>
          </div>

        </div>
      </div>

      {/* Main Links Grid */}
      <div className="py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Col 1: Brand & About */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#18A67D] rounded transform rotate-45 flex items-center justify-center shadow-sm">
                <div className="w-2.5 h-2.5 bg-white rounded-xs transform -rotate-45" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white uppercase">
                Rabnix <span className="text-[#22C39A]">Estate</span>
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed max-w-sm text-xs">
              India&apos;s trusted property portal for buying, selling, and renting residential flats, luxury villas, commercial office spaces, and land plots with zero brokerage.
            </p>
            <div className="pt-2 text-slate-400 space-y-1 text-xs">
              <div>Customer Care: 1800-41-99099 (Toll Free)</div>
              <div>Email: support@rabnix.com</div>
            </div>
          </div>

          {/* Col 2: Top Real Estate Cities */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Explore Top Cities
            </div>
            <ul className="space-y-1.5 text-slate-300">
              {CITIES_DATA.slice(0, 6).map((c) => (
                <li key={c.name}>
                  <button
                    onClick={() => onSelectCity(c)}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Properties in {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Services & AI Tools */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Tools & Valuation
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                <button onClick={onOpenAiValuation} className="hover:text-white transition-colors cursor-pointer">
                  AI Property Valuation
                </button>
              </li>
              <li>
                <button onClick={onOpenEmiCalculator} className="hover:text-white transition-colors cursor-pointer">
                  Home Loan EMI Calculator
                </button>
              </li>
              <li>
                <button onClick={onOpenPostProperty} className="hover:text-white transition-colors text-[#22C39A] font-semibold cursor-pointer">
                  Post Property FREE
                </button>
              </li>
              <li>
                <span className="text-slate-400">Rent Agreement Generator</span>
              </li>
              <li>
                <span className="text-slate-400">RERA Registration Search</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Property Types */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Popular Searches
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>Flats in Whitefield Bangalore</li>
              <li>Apartments in Bandra Mumbai</li>
              <li>Godrej Woods Sector 62 Noida</li>
              <li>Office Spaces in Hinjawadi Pune</li>
              <li>Gated Villas in ECR Chennai</li>
              <li>PGs in Cyber City Gurgaon</li>
            </ul>
          </div>

        </div>
      </div>

      {/* RERA & Disclaimer Bottom Bar */}
      <div className="bg-[#091a2a] py-5 px-4 sm:px-8 border-t border-[#163b5c] text-[11px] text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} Rabnix Estate Realty Services Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Terms & Conditions</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">RERA Compliance</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
