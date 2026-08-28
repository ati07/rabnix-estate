'use client';

import React from 'react';
import Image from 'next/image';
import { Award, ShieldCheck, Building2, ExternalLink, ArrowRight } from 'lucide-react';

interface TopBuildersProps {
  cityName: string;
}

export function TopBuildersSection({ cityName }: TopBuildersProps) {
  const builders = [
    {
      name: 'Godrej Properties',
      tagline: '90+ years of trust, eco-friendly luxury townships',
      experience: '34 Years Experience',
      projectsCount: '124 Projects',
      rating: '4.9 ★',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
      badge: 'RERA Certified A+'
    },
    {
      name: 'Prestige Group',
      tagline: 'Leading residential communities, villas & commercial parks',
      experience: '38 Years Experience',
      projectsCount: '205 Projects',
      rating: '4.9 ★',
      logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
      badge: 'Platinum Builder'
    },
    {
      name: 'Sobha Developers',
      tagline: 'German architectural precision & in-house manufacturing',
      experience: '29 Years Experience',
      projectsCount: '118 Projects',
      rating: '4.8 ★',
      logo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
      badge: 'Zero Delay Record'
    },
    {
      name: 'DLF Limited',
      tagline: 'Pioneers of luxury living, golf resorts & cyber cities',
      experience: '75 Years Experience',
      projectsCount: '150+ Projects',
      rating: '4.9 ★',
      logo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
      badge: 'Iconic Legacy'
    }
  ];

  return (
    <section className="w-full bg-white py-12 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A67D] uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Developer Spotlight</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-1">
              Top Reputed Builders & Projects in {cityName}
            </h2>
          </div>
          <div className="text-xs font-semibold text-[#64748B]">
            All projects 100% verified with state RERA authorities
          </div>
        </div>

        {/* Builder Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {builders.map((b) => (
            <div
              key={b.name}
              className="bg-[#F8FAFC] hover:bg-white rounded-xl p-4 border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white">
                    <Image
                      src={b.logo}
                      alt={b.name}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <span className="bg-[#E7F6F1] text-[#0E7C5D] text-[10px] font-bold px-2 py-0.5 rounded-sm">
                    {b.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#0F2A43]">{b.name}</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">{b.tagline}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Track Record</span>
                    <span className="font-bold text-[#172033]">{b.experience}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Delivered</span>
                    <span className="font-bold text-[#18A67D]">{b.projectsCount}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#0F2A43]">
                <span className="text-amber-500 font-bold">{b.rating}</span>
                <span className="text-[#18A67D] font-bold text-xs flex items-center gap-1">
                  View Projects <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
