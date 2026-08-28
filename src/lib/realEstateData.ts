import { CityInfo, LocalityTrend } from './types';

// Static presentational data ported from rabnix-estate-v1 for the v1 design shell
// (city selector, hero city stats, locality-trends section). The v1 mock `INITIAL_PROPERTIES`
// was intentionally NOT ported — real listings come from the DB via the adapter
// (docs/frontend-port-v1.md §5 Phase 2). These city/locality figures remain illustrative until
// wired to real aggregates in a later phase.

export const CITIES_DATA: CityInfo[] = [
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    code: 'MUM',
    popularLocalities: ['Andheri West', 'Bandra West', 'Powai', 'Worli', 'Juhu', 'Thane West', 'Kandivali East', 'Borivali West'],
    avgPricePerSqFt: 22400,
    yoyGrowth: 9.4,
    totalListingsCount: 38420,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bangalore',
    state: 'Karnataka',
    code: 'BLR',
    popularLocalities: ['Whitefield', 'Indiranagar', 'HSR Layout', 'Sarjapur Road', 'Electronic City', 'Bellandur', 'Hebbal', 'Koramangala'],
    avgPricePerSqFt: 8650,
    yoyGrowth: 14.8,
    totalListingsCount: 42150,
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Delhi / NCR',
    state: 'Delhi NCR',
    code: 'DEL',
    popularLocalities: ['Golf Course Extension Gurgaon', 'Sector 62 Noida', 'Dwarka Expressway', 'Vasant Kunj', 'Greater Noida West', 'Cyber City Gurgaon', 'South Extension'],
    avgPricePerSqFt: 11200,
    yoyGrowth: 12.1,
    totalListingsCount: 46200,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    code: 'HYD',
    popularLocalities: ['Gachibowli', 'Hitec City', 'Kondapur', 'Kokapet', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Financial District'],
    avgPricePerSqFt: 7800,
    yoyGrowth: 15.6,
    totalListingsCount: 29800,
    image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Pune',
    state: 'Maharashtra',
    code: 'PUN',
    popularLocalities: ['Hinjawadi', 'Kharadi', 'Baner', 'Wakad', 'Viman Nagar', 'Koregaon Park', 'Hadapsar', 'Bavdhan'],
    avgPricePerSqFt: 7200,
    yoyGrowth: 10.3,
    totalListingsCount: 31400,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Chennai',
    state: 'Tamil Nadu',
    code: 'CHE',
    popularLocalities: ['OMR', 'Anna Nagar', 'Velachery', 'Adyar', 'Porur', 'Sholinganallur', 'ECR', 'Guindy'],
    avgPricePerSqFt: 7900,
    yoyGrowth: 8.7,
    totalListingsCount: 21500,
    image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kolkata',
    state: 'West Bengal',
    code: 'KOL',
    popularLocalities: ['New Town', 'Salt Lake', 'Rajarhat', 'EM Bypass', 'Ballygunge', 'Alipore', 'Behala', 'Garia'],
    avgPricePerSqFt: 6100,
    yoyGrowth: 7.2,
    totalListingsCount: 18900,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ahmedabad',
    state: 'Gujarat',
    code: 'AMD',
    popularLocalities: ['SG Highway', 'Bopal', 'Satellite', 'Prahlad Nagar', 'Gota', 'Shela', 'Thaltej', 'GIFT City'],
    avgPricePerSqFt: 5400,
    yoyGrowth: 11.5,
    totalListingsCount: 16800,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    code: 'LKO',
    popularLocalities: ['Gomti Nagar', 'Amar Shaheed Path', 'Sushant Golf City', 'Hazratganj', 'Indira Nagar', 'Vibhuti Khand', 'Aliganj', 'Faizabad Road'],
    avgPricePerSqFt: 5250,
    yoyGrowth: 13.2,
    totalListingsCount: 14200,
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
  }
];

export const LOCALITY_TRENDS_DATA: LocalityTrend[] = [
  {
    locality: 'Gomti Nagar',
    city: 'Lucknow',
    avgPricePerSqFt: 6800,
    rentalYield: '4.9% p.a.',
    yoyGrowth: 14.1,
    livabilityScore: 9.3,
    topProjects: ['Omaxe Grand', 'Rishita Manhattan', 'Eldeco Greens'],
    overview: 'Lucknow’s most prime planned residential and commercial neighborhood. Known for luxury residences, sprawling parks, top universities, and world-class retail malls.'
  },
  {
    locality: 'Whitefield',
    city: 'Bangalore',
    avgPricePerSqFt: 8950,
    rentalYield: '4.8% p.a.',
    yoyGrowth: 15.2,
    livabilityScore: 9.2,
    topProjects: ['Prestige Lakeside', 'Godrej Splendour', 'Brigade Woods'],
    overview: 'Major IT hub connected with the Purple Metro Line. Huge demand from tech professionals with top international schools and lifestyle malls.'
  },
  {
    locality: 'Bandra West',
    city: 'Mumbai',
    avgPricePerSqFt: 46200,
    rentalYield: '2.9% p.a.',
    yoyGrowth: 8.9,
    livabilityScore: 9.6,
    topProjects: ['Rustomjee Paramount', 'Supreme Bori', 'Kalpataru Magnificence'],
    overview: 'The Queen of Suburbs. Iconic celebrity neighborhoods, world-class nightlife, historic promenades, and unmatched status symbol.'
  },
  {
    locality: 'Sector 62 Noida',
    city: 'Delhi / NCR',
    avgPricePerSqFt: 9800,
    rentalYield: '4.4% p.a.',
    yoyGrowth: 13.8,
    livabilityScore: 8.9,
    topProjects: ['Godrej Woods', 'ATS One Hamlet', 'Mahagun Mezzaria'],
    overview: 'Established institutional and corporate hub with direct Blue Line Metro connectivity and excellent road infrastructure to Delhi.'
  },
  {
    locality: 'Gachibowli',
    city: 'Hyderabad',
    avgPricePerSqFt: 8400,
    rentalYield: '5.2% p.a.',
    yoyGrowth: 16.5,
    livabilityScore: 9.4,
    topProjects: ['My Home Bhooja', 'Prestige High Fields', 'Aparna Sarovar'],
    overview: 'The epicenter of Hyderabad Silicon Valley. Proximity to Amazon, Google, Microsoft, and the Outer Ring Road.'
  },
  {
    locality: 'Hinjawadi',
    city: 'Pune',
    avgPricePerSqFt: 6900,
    rentalYield: '5.0% p.a.',
    yoyGrowth: 11.2,
    livabilityScore: 8.7,
    topProjects: ['Godrej 24', 'Kolte Patil Life Republic', 'VTP Blue Waters'],
    overview: 'Hub of over 400 IT companies employing 400,000+ tech professionals. Metro Line 3 nearing completion will boost capital appreciation.'
  }
];
