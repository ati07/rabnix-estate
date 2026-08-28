'use client';

import React from 'react';
import { TrendingUp, MapPin, Sparkles, Building, ArrowUpRight } from 'lucide-react';
import { LOCALITY_TRENDS_DATA } from '@/lib/realEstateData';
import { CityInfo } from '@/lib/types';
import { formatIndianNumber } from '@/lib/formatters';

interface LocalityTrendsSectionProps {
  selectedCity: CityInfo;
  onSelectLocality: (locality: string) => void;
  onOpenAiValuation: () => void;
}

export function LocalityTrendsSection({
  selectedCity,
  onSelectLocality,
  onOpenAiValuation,
}: LocalityTrendsSectionProps) {
  const cityTrends = LOCALITY_TRENDS_DATA.filter(
    (t) => t.city.toLowerCase() === selectedCity.name.toLowerCase()
  );

  const displayTrends = cityTrends.length > 0 ? cityTrends : LOCALITY_TRENDS_DATA.slice(0, 3);

  return (
    <section className="bg-white py-10 px-4 sm:px-8 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#18A67D] uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Rabnix Estate Market Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-0.5">
              Price Trends & Rental Yields in {selectedCity.name}
            </h2>
          </div>

          <button
            onClick={onOpenAiValuation}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold text-[#18A67D] hover:text-[#0E7C5D] bg-[#E7F6F1] hover:bg-[#d5f0e7] border border-[#18A67D]/30 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Check Any Locality Valuation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trend Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayTrends.map((trend) => (
            <div
              key={trend.locality}
              onClick={() => onSelectLocality(trend.locality)}
              className="bg-[#F8FAFC] hover:bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1 text-sm font-bold text-[#172033] group-hover:text-[#18A67D] transition-colors">
                    <MapPin className="w-4 h-4 text-[#18A67D]" />
                    <span>{trend.locality}</span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">{trend.city}</span>
                </div>

                <span className="text-xs font-bold text-[#0E7C5D] bg-[#E7F6F1] border border-[#18A67D]/30 px-2 py-0.5 rounded">
                  +{trend.yoyGrowth}% YoY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Avg Rate</span>
                  <span className="font-bold text-[#172033]">₹{formatIndianNumber(trend.avgPricePerSqFt)}/sq.ft</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Rental Yield</span>
                  <span className="font-bold text-[#0E7C5D]">{trend.rentalYield}</span>
                </div>
              </div>

              <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                {trend.overview}
              </p>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-bold text-[#18A67D] group-hover:text-[#0E7C5D]">
                <span>View properties in {trend.locality}</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
