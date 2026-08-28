'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, CheckCircle2, Crown, Sparkles, IndianRupee } from 'lucide-react';
import { SearchFilters } from '@/lib/types';

interface CuratedCollectionsProps {
  cityName: string;
  onApplyPreset: (filters: Partial<SearchFilters>) => void;
}

export function CuratedCollectionsSection({ cityName, onApplyPreset }: CuratedCollectionsProps) {
  const collections = [
    {
      id: 'coll-zero-brokerage',
      title: 'Zero Brokerage Direct Homes',
      subtitle: 'Verified listings posted directly by property owners. Save 100% on brokerage fees.',
      tag: '0% Brokerage',
      tagColor: 'bg-[#18A67D]',
      icon: CheckCircle2,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      actionText: 'View Owner Properties',
      filters: { isOwnerOnly: true, isVerifiedOnly: false }
    },
    {
      id: 'coll-ready-move',
      title: 'Ready-to-Move Residences',
      subtitle: 'Immediate possession apartments with occupancy certificates (OC) and clear titles.',
      tag: 'Immediate Possession',
      tagColor: 'bg-[#0F2A43]',
      icon: ShieldCheck,
      imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
      actionText: 'Explore Ready Homes',
      filters: { constructionStatus: 'Ready to Move' as const }
    },
    {
      id: 'coll-luxury',
      title: 'Ultra Luxury & Penthouses',
      subtitle: 'Bespoke high-rises with private sky decks, infinity pools, and panoramic city vistas.',
      tag: 'Signature Living',
      tagColor: 'bg-amber-600',
      icon: Crown,
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      actionText: 'View Luxury Portfolios',
      filters: { minPrice: 25000000 }
    },
    {
      id: 'coll-budget',
      title: 'Budget Homes under ₹50 Lac',
      subtitle: 'Pocket-friendly 1 & 2 BHK flats in high-growth corridors with excellent connectivity.',
      tag: 'High Value',
      tagColor: 'bg-[#0E7C5D]',
      icon: IndianRupee,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      actionText: 'Browse Affordable Homes',
      filters: { maxPrice: 5000000 }
    }
  ];

  return (
    <section className="w-full bg-[#F8FAFC] py-12 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A67D] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked by Rabnix Estate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-1">
              Curated Property Collections in {cityName}
            </h2>
          </div>
          <div className="text-xs font-semibold text-[#64748B]">
            Custom tailored portfolios designed for every lifestyle & investment goal
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onApplyPreset(item.filters)}
                className="group relative bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Visual Image Header */}
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A43]/90 via-[#0F2A43]/30 to-transparent" />
                  
                  {/* Floating Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`${item.tagColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm`}>
                      <Icon className="w-3 h-3" />
                      <span>{item.tag}</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-[#0F2A43] group-hover:text-[#18A67D] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#18A67D]">
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
