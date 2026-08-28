'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  IndianRupee, 
  Percent, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { calculateEmi, formatIndianCurrency, formatIndianNumber } from '@/lib/formatters';

interface EmiCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrincipal?: number;
}

export function EmiCalculatorModal({
  isOpen,
  onClose,
  initialPrincipal = 5000000,
}: EmiCalculatorModalProps) {
  const [principal, setPrincipal] = useState<number>(initialPrincipal);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [appliedBank, setAppliedBank] = useState<string | null>(null);

  if (!isOpen) return null;

  const result = calculateEmi(principal, interestRate, tenureYears);

  const BANK_RATES = [
    { name: 'State Bank of India (SBI)', rate: 8.40, processingFee: 'Zero (Festive Offer)', maxTenure: '30 Years', logo: 'SBI' },
    { name: 'HDFC Bank Home Loans', rate: 8.50, processingFee: '₹3,000 + GST', maxTenure: '30 Years', logo: 'HDFC' },
    { name: 'ICICI Bank Home Finance', rate: 8.60, processingFee: '0.25% of loan', maxTenure: '30 Years', logo: 'ICICI' },
    { name: 'Bank of Baroda', rate: 8.45, processingFee: 'Nil for Gen. Category', maxTenure: '30 Years', logo: 'BOB' },
    { name: 'Axis Bank', rate: 8.65, processingFee: 'Up to ₹5,000', maxTenure: '30 Years', logo: 'AXIS' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-neutral-200">
        
        {/* Header */}
        <div className="bg-[#0F2A43] text-white px-6 py-4 flex items-center justify-between border-b border-[#163b5c] shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-[#18A67D] text-white text-xs font-black px-2 py-0.5 rounded-xs">
              Rabnix Estate
            </div>
            <h2 className="text-sm font-bold flex items-center gap-1.5 text-white">
              <Calculator className="w-4 h-4 text-[#22C39A]" />
              <span>Interactive Home Loan & Monthly EMI Calculator</span>
            </h2>
          </div>
          <button
            id="emi-calc-close-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Top Sliders + Calculation Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Input Sliders */}
            <div className="lg:col-span-7 space-y-5 bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0]">
              
              {/* Slider 1: Loan Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#64748B] uppercase tracking-wider">Loan Amount</span>
                  <span className="text-[#172033] bg-white px-3 py-1 rounded-lg border border-[#CBD5E1] font-black text-sm">
                    {formatIndianCurrency(principal)}
                  </span>
                </div>
                <input
                  id="emi-slider-principal"
                  type="range"
                  min={500000}
                  max={50000000}
                  step={100000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#18A67D]"
                />
                <div className="flex justify-between text-[10px] font-semibold text-[#64748B]">
                  <span>₹5 Lakh</span>
                  <span>₹2.5 Cr</span>
                  <span>₹5 Cr+</span>
                </div>
              </div>

              {/* Slider 2: Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#64748B] uppercase tracking-wider">Interest Rate (p.a.)</span>
                  <span className="text-[#172033] bg-white px-3 py-1 rounded-lg border border-[#CBD5E1] font-black text-sm">
                    {interestRate}%
                  </span>
                </div>
                <input
                  id="emi-slider-rate"
                  type="range"
                  min={6.5}
                  max={14.0}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#18A67D]"
                />
                <div className="flex justify-between text-[10px] font-semibold text-[#64748B]">
                  <span>6.5%</span>
                  <span>10.0%</span>
                  <span>14.0%</span>
                </div>
              </div>

              {/* Slider 3: Loan Tenure */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#64748B] uppercase tracking-wider">Loan Tenure</span>
                  <span className="text-[#172033] bg-white px-3 py-1 rounded-lg border border-[#CBD5E1] font-black text-sm">
                    {tenureYears} Years ({tenureYears * 12} Months)
                  </span>
                </div>
                <input
                  id="emi-slider-tenure"
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#18A67D]"
                />
                <div className="flex justify-between text-[10px] font-semibold text-[#64748B]">
                  <span>5 Yrs</span>
                  <span>15 Yrs</span>
                  <span>30 Yrs</span>
                </div>
              </div>

            </div>

            {/* Right: EMI Output Breakdown */}
            <div className="lg:col-span-5 bg-[#0F2A43] text-white p-5 rounded-2xl flex flex-col justify-between space-y-4 border border-[#163b5c]">
              
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                  Monthly EMI Payable
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                  ₹{formatIndianNumber(result.monthlyEmi)}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  per month for {tenureYears} years
                </div>
              </div>

              {/* Visual Breakdown Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#22C39A]">Principal: {result.principalPct}%</span>
                  <span className="text-amber-400">Interest: {result.interestPct}%</span>
                </div>
                <div className="h-3 w-full bg-[#163b5c] rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-[#18A67D] transition-all duration-300"
                    style={{ width: `${result.principalPct}%` }}
                  />
                  <div 
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${result.interestPct}%` }}
                  />
                </div>
              </div>

              {/* Stats Table */}
              <div className="space-y-2 border-t border-[#163b5c] pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Principal Amount:</span>
                  <span className="font-bold text-white">{formatIndianCurrency(principal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Interest:</span>
                  <span className="font-bold text-amber-400">{formatIndianCurrency(result.totalInterest)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#163b5c]">
                  <span className="text-slate-300">Total Amount:</span>
                  <span className="text-white">{formatIndianCurrency(result.totalPayment)}</span>
                </div>
              </div>

              {/* Tax Benefit Info */}
              <div className="bg-[#163b5c]/60 p-2.5 rounded-lg text-[11px] text-slate-200 space-y-0.5 border border-white/10">
                <div className="font-bold text-[#22C39A]">Tax Savings under Sec 80C & 24(b):</div>
                <div>Save up to ₹1.5 Lac on Principal and up to ₹2.0 Lac on Interest deductions annually.</div>
              </div>

            </div>

          </div>

          {/* Top Indian Banks Home Loan Comparison Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#0F2A43] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#18A67D]" />
              <span>Compare Live Interest Rates from Top Indian Banks</span>
            </h3>

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3">Lending Bank</th>
                    <th className="p-3">Interest Rate</th>
                    <th className="p-3">Estimated EMI</th>
                    <th className="p-3">Processing Fee</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {BANK_RATES.map((bank) => {
                    const bankEmi = calculateEmi(principal, bank.rate, tenureYears);
                    const isApplied = appliedBank === bank.name;
                    return (
                      <tr key={bank.name} className="hover:bg-[#F8FAFC] font-medium text-[#172033]">
                        <td className="p-3 font-bold text-[#172033]">
                          {bank.name}
                        </td>
                        <td className="p-3 text-[#0E7C5D] font-bold">
                          {bank.rate}% p.a.
                        </td>
                        <td className="p-3 font-black text-[#172033]">
                          ₹{formatIndianNumber(bankEmi.monthlyEmi)}/mo
                        </td>
                        <td className="p-3 text-[#64748B]">
                          {bank.processingFee}
                        </td>
                        <td className="p-3 text-right">
                          {isApplied ? (
                            <span className="text-[#0E7C5D] font-bold inline-flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Applied</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setAppliedBank(bank.name);
                                setInterestRate(bank.rate);
                              }}
                              className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Apply Now
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
