export interface Dermatologist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: string;
  address: string;
  phone: string;
  availability: string;
  experience: string;
  consultationFee: string;
  education: string[];
  languages: string[];
  services: string[];
  imageUrl: string;
}

export const dermatologists: Dermatologist[] = [
  {
    id: "1",
    name: "Dr. Ayesha Khan",
    specialty: "Dermatologist & Cosmetologist",
    rating: 4.8,
    reviews: 156,
    distance: "2.3 km",
    address: "Gulberg III, Lahore",
    phone: "+92 300 1234567",
    availability: "Available Today",
    experience: "12 years",
    consultationFee: "Rs. 2,500",
    education: ["MBBS - King Edward Medical University", "MD Dermatology - FCPS"],
    languages: ["English", "Urdu", "Punjabi"],
    services: ["Acne Treatment", "Anti-Aging", "Laser Therapy", "Chemical Peels"],
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
  },
  {
    id: "2",
    name: "Dr. Muhammad Ali",
    specialty: "Dermatologist",
    rating: 4.6,
    reviews: 89,
    distance: "3.1 km",
    address: "DHA Phase 5, Lahore",
    phone: "+92 301 2345678",
    availability: "Next Available: Tomorrow",
    experience: "8 years",
    consultationFee: "Rs. 2,000",
    education: ["MBBS - Allama Iqbal Medical College", "FCPS Dermatology"],
    languages: ["English", "Urdu"],
    services: ["Skin Cancer Screening", "Psoriasis Treatment", "Eczema Care"],
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
  },
  {
    id: "3",
    name: "Dr. Fatima Sheikh",
    specialty: "Dermatologist & Aesthetic Medicine",
    rating: 4.9,
    reviews: 203,
    distance: "4.2 km",
    address: "Johar Town, Lahore",
    phone: "+92 302 3456789",
    availability: "Available Today",
    experience: "15 years",
    consultationFee: "Rs. 3,000",
    education: ["MBBS - Dow Medical College", "MD Dermatology - Fellowship in Aesthetics"],
    languages: ["English", "Urdu", "Sindhi"],
    services: ["Botox", "Fillers", "Skin Rejuvenation", "Scar Treatment"],
    imageUrl: "https://images.unsplash.com/photo-1594824475317-8b7b0c8b8b8b?w=400",
  },
  {
    id: "4",
    name: "Dr. Hassan Ahmed",
    specialty: "Pediatric Dermatologist",
    rating: 4.7,
    reviews: 124,
    distance: "5.8 km",
    address: "Model Town, Lahore",
    phone: "+92 303 4567890",
    availability: "Next Available: 2 days",
    experience: "10 years",
    consultationFee: "Rs. 2,200",
    education: ["MBBS - CMH Medical College", "FCPS Dermatology - Pediatric Fellowship"],
    languages: ["English", "Urdu"],
    services: ["Pediatric Skin Conditions", "Birthmark Treatment", "Allergy Testing"],
    imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400",
  },
  {
    id: "5",
    name: "Dr. Zara Malik",
    specialty: "Dermatologist & Hair Specialist",
    rating: 4.5,
    reviews: 167,
    distance: "6.2 km",
    address: "Cantt, Lahore",
    phone: "+92 304 5678901",
    availability: "Available Today",
    experience: "9 years",
    consultationFee: "Rs. 2,300",
    education: ["MBBS - Fatima Jinnah Medical College", "FCPS Dermatology"],
    languages: ["English", "Urdu"],
    services: ["Hair Loss Treatment", "Scalp Conditions", "Nail Disorders"],
    imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
  },
];

export const specialties = [
  "General Dermatology",
  "Cosmetic Dermatology",
  "Pediatric Dermatology",
  "Dermatopathology",
  "Mohs Surgery",
  "Aesthetic Medicine",
  "Hair & Scalp Disorders",
  "Skin Cancer Treatment",
];

export const services = [
  "Acne Treatment",
  "Anti-Aging Treatments",
  "Botox & Fillers",
  "Chemical Peels",
  "Laser Therapy",
  "Skin Cancer Screening",
  "Psoriasis Treatment",
  "Eczema Care",
  "Hair Loss Treatment",
  "Scar Treatment",
  "Mole Removal",
  "Skin Rejuvenation",
];