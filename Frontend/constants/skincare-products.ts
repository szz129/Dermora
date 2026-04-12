export interface SkincareProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  rating: number;
  reviews: number;
  description: string;
  ingredients: string[];
  skinTypes: string[];
  concerns: string[];
  availability: string;
  imageUrl: string;
}

export const skincareProducts: SkincareProduct[] = [
  {
    id: "1",
    name: "Gentle Foaming Cleanser",
    brand: "The Ordinary",
    category: "Cleanser",
    price: "Rs. 1,200",
    rating: 4.5,
    reviews: 234,
    description: "A gentle, non-stripping cleanser suitable for all skin types.",
    ingredients: ["Salicylic Acid", "Niacinamide", "Hyaluronic Acid"],
    skinTypes: ["Normal", "Oily", "Combination"],
    concerns: ["Acne", "Blackheads", "Large Pores"],
    availability: "In Stock",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
  },
  {
    id: "2",
    name: "Vitamin C Serum",
    brand: "Glow Recipe",
    category: "Serum",
    price: "Rs. 2,800",
    rating: 4.7,
    reviews: 189,
    description: "Brightening serum with 15% Vitamin C for radiant skin.",
    ingredients: ["Vitamin C", "Vitamin E", "Ferulic Acid"],
    skinTypes: ["Normal", "Dry", "Combination"],
    concerns: ["Dark Spots", "Dullness", "Uneven Tone"],
    availability: "In Stock",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
  },
  {
    id: "3",
    name: "Hydrating Moisturizer",
    brand: "CeraVe",
    category: "Moisturizer",
    price: "Rs. 1,800",
    rating: 4.6,
    reviews: 312,
    description: "24-hour hydrating moisturizer with ceramides and hyaluronic acid.",
    ingredients: ["Ceramides", "Hyaluronic Acid", "MVE Technology"],
    skinTypes: ["Dry", "Normal", "Sensitive"],
    concerns: ["Dryness", "Dehydration", "Sensitivity"],
    availability: "In Stock",
    imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
  },
  {
    id: "4",
    name: "Niacinamide Serum",
    brand: "The INKEY List",
    category: "Serum",
    price: "Rs. 1,500",
    rating: 4.4,
    reviews: 156,
    description: "10% Niacinamide serum to minimize pores and control oil.",
    ingredients: ["Niacinamide", "Zinc PCA", "Hyaluronic Acid"],
    skinTypes: ["Oily", "Combination", "Acne-Prone"],
    concerns: ["Large Pores", "Oiliness", "Acne"],
    availability: "Low Stock",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
  },
  {
    id: "5",
    name: "Sunscreen SPF 50",
    brand: "La Roche-Posay",
    category: "Sunscreen",
    price: "Rs. 2,200",
    rating: 4.8,
    reviews: 278,
    description: "Broad-spectrum sunscreen with antioxidants for daily protection.",
    ingredients: ["Zinc Oxide", "Titanium Dioxide", "Antioxidants"],
    skinTypes: ["All Skin Types"],
    concerns: ["Sun Protection", "Anti-Aging", "Prevention"],
    availability: "In Stock",
    imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400",
  },
];

export const skinConcerns = [
  "Acne",
  "Dark Spots",
  "Wrinkles",
  "Large Pores",
  "Dryness",
  "Oiliness",
  "Sensitivity",
  "Dullness",
  "Uneven Tone",
  "Blackheads",
  "Dehydration",
  "Sun Damage",
];

export const skinTypes = [
  "Normal",
  "Dry",
  "Oily",
  "Combination",
  "Sensitive",
  "Acne-Prone",
];