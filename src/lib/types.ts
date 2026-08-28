// UI-layer property types, ported from rabnix-estate-v1 so the v1 design components drop in
// unchanged. The Prisma `Listing` model is translated to/from `Property` by
// `src/lib/property-adapter.ts` — no UI component talks to Prisma directly. See
// docs/frontend-port-v1.md §3.

export type ListingType = 'buy' | 'rent' | 'pg' | 'plot' | 'commercial';

export type PropertyCategory =
  | 'Apartment'
  | 'Villa'
  | 'Builder Floor'
  | 'Penthouse'
  | 'Studio'
  | 'Commercial Office'
  | 'Retail Shop'
  | 'Residential Plot'
  | 'PG / Co-Living';

export type ConstructionStatus = 'Ready to Move' | 'Under Construction' | 'New Launch';
export type FurnishingStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
export type PostedByType = 'Owner' | 'Builder' | 'Verified Agent';
export type FacingDirection = 'East' | 'North' | 'North-East' | 'West' | 'South';

export interface Property {
  id: string;
  title: string;
  tagline?: string;
  listingType: ListingType;
  category: PropertyCategory;
  city: string;
  locality: string;
  subLocality?: string;
  price: number; // in INR (total for buy, monthly for rent/pg)
  priceFormatted: string; // e.g. "₹1.45 Cr" or "₹45,000 / mo"
  pricePerSqFt?: number;
  maintenance?: number;
  bhk?: number; // 1, 2, 3, 4, 5
  bathrooms: number;
  balconies?: number;
  carpetAreaSqFt: number;
  superBuiltUpAreaSqFt?: number;
  furnishing: FurnishingStatus;
  floor?: number;
  totalFloors?: number;
  facing?: FacingDirection;
  constructionStatus: ConstructionStatus;
  possessionDate?: string;
  ageOfProperty?: string;
  reraId?: string;
  reraApproved: boolean;
  isVerified: boolean;
  isFeatured?: boolean;
  isExclusiveOwner?: boolean;
  priceDrop?: boolean;
  images: string[];
  floorPlanImage?: string;
  description: string;
  amenities: string[];
  postedBy: {
    name: string;
    type: PostedByType;
    phone: string;
    companyName?: string;
    responseTime?: string;
    rating?: number;
    avatar?: string;
  };
  nearbyLandmarks?: {
    name: string;
    distance: string;
    type: 'metro' | 'airport' | 'school' | 'hospital' | 'tech_park' | 'mall';
  }[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface CityInfo {
  name: string;
  state: string;
  code: string;
  popularLocalities: string[];
  avgPricePerSqFt: number;
  yoyGrowth: number;
  totalListingsCount: number;
  image: string;
}

export interface SearchFilters {
  city?: string;
  listingType: ListingType;
  locality?: string;
  localities?: string[];
  category?: PropertyCategory;
  categories?: PropertyCategory[];
  minPrice?: number;
  maxPrice?: number;
  bhk?: number[];
  constructionStatus?: ConstructionStatus | ConstructionStatus[];
  furnishing?: FurnishingStatus | FurnishingStatus[];
  postedBy?: PostedByType[];
  isVerifiedOnly?: boolean;
  verifiedOnly?: boolean;
  isReraApprovedOnly?: boolean;
  reraOnly?: boolean;
  isOwnerOnly?: boolean;
  ownerOnly?: boolean;
  isFeaturedOnly?: boolean;
  amenities?: string[];
  sortBy?: 'recommended' | 'relevance' | 'price_asc' | 'price_desc' | 'area_desc' | 'newest';
}

export interface PostPropertyFormState {
  listingType: ListingType;
  category: PropertyCategory;
  city: string;
  locality: string;
  title: string;
  bhk: number;
  bathrooms: number;
  carpetAreaSqFt: number;
  superBuiltUpAreaSqFt: number;
  price: number;
  maintenance: number;
  furnishing: FurnishingStatus;
  floor: number;
  totalFloors: number;
  facing: FacingDirection;
  constructionStatus: ConstructionStatus;
  possessionDate: string;
  reraId: string;
  amenities: string[];
  description: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  imageUrls: string[];
}

export interface LocalityTrend {
  locality: string;
  city: string;
  avgPricePerSqFt: number;
  rentalYield: string;
  yoyGrowth: number;
  livabilityScore: number;
  topProjects: string[];
  overview: string;
}

export interface AiValuationResult {
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  fairValueEstimate: number;
  confidenceScore: number;
  fairPriceSqFt: number;
  estimatedRentalMin: number;
  estimatedRentalMax: number;
  rentalYield: number;
  fiveYearAppreciationForecast: number;
  localityGrade: string;
  keyDrivers: string[];
  marketPros: string[];
  marketCons: string[];
  comparableLocalityAverages: { name: string; avgRate: number }[];
  summary: string;
}
