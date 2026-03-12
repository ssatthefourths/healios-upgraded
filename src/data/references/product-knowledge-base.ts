/**
 * Healios Product Knowledge Base
 * Version: 2025-12
 * Use: Reference dataset for AI assistants and app content
 * Markets: United Kingdom (UK-compliant wording)
 * Brand: Healios
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  keyFeatures: string[];
  ingredients: string[];
  allergens: {
    contains: string[];
    freeFrom: string[];
  };
}

export interface UsageGuide {
  productId: string;
  instructions: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  icon: string;
  items: FAQItem[];
}

export interface TroubleshootingItem {
  issue: string;
  solutions: string[];
}

// ============================================
// 1. PRODUCT CATALOGUE
// ============================================

export const PRODUCT_CATALOGUE: ProductInfo[] = [
  {
    id: "collagen-powder",
    name: "Healios Collagen Powder",
    description: "A daily collagen peptide blend designed to support skin appearance, hair strength, nail health, and overall wellness.",
    keyFeatures: [
      "Hydrolysed collagen peptides for improved absorption",
      "Neutral taste, mixes smoothly in hot or cold drinks",
      "Formulated for daily use",
      "No artificial colours or preservatives"
    ],
    ingredients: [
      "Hydrolysed Collagen (Type I & III)",
      "Natural flavouring (if flavoured variant)",
      "No added sugar"
    ],
    allergens: {
      contains: ["Protein derived from animal sources"],
      freeFrom: ["Gluten", "Dairy", "Soy", "Nuts"]
    }
  },
  {
    id: "halo-glow",
    name: "Healios Halo Glow",
    description: "A skin-focused supplement blend formulated to support radiance, hydration, and elasticity from within.",
    keyFeatures: [
      "Hyaluronic acid for hydration",
      "Vitamin C to support normal collagen formation",
      "Antioxidants to reduce oxidative stress",
      "Designed to complement Healios Collagen Powder"
    ],
    ingredients: [
      "Hyaluronic Acid",
      "Vitamin C (L-Ascorbic Acid)",
      "Vitamin E",
      "Zinc",
      "Botanical extracts (e.g., grape seed or equivalent antioxidant complexes depending on batch)"
    ],
    allergens: {
      contains: [],
      freeFrom: ["Common allergens", "Vegan-friendly", "Gluten-free"]
    }
  }
];

// ============================================
// 2. PRODUCT USAGE
// ============================================

export const USAGE_GUIDES: UsageGuide[] = [
  {
    productId: "collagen-powder",
    instructions: [
      "Add one scoop to water, coffee, tea, juice, or smoothies",
      "Mix well until fully dissolved",
      "Can be taken at any time of day",
      "Consistency is key; results typically appear after 4-8 weeks of daily use"
    ]
  },
  {
    productId: "halo-glow",
    instructions: [
      "Take one daily serving with food",
      "Hydration enhances absorption and efficacy",
      "Can be paired with Collagen Powder for a combined routine"
    ]
  }
];

export const PRODUCT_PAIRING_INFO = {
  question: "Can I take both products together?",
  answer: "Yes. They are designed to work synergistically. Follow daily serving recommendations for each product."
};

// ============================================
// 3. SAFETY & COMPLIANCE (UK)
// ============================================

export const SAFETY_COMPLIANCE = {
  general: {
    question: "Are the products safe?",
    answer: "Yes. All Healios products are produced in facilities that follow UK Food Safety and Hygiene standards."
  },
  pregnancy: {
    question: "Are they suitable for pregnancy or breastfeeding?",
    answer: "Consult a healthcare professional before using any supplement when pregnant, planning a pregnancy, or breastfeeding."
  },
  ageRestrictions: {
    question: "Are there age restrictions?",
    answer: "Products are intended for adults aged 18 and over."
  },
  notMedicine: {
    question: "Are these supplements medicines?",
    answer: "No. Healios products are food supplements and not intended to diagnose, treat, cure, or prevent any disease."
  },
  ukApproval: {
    question: "Are they approved by the UK government?",
    answer: "Food supplements do not require specific 'approval' by UK authorities, but Healios products comply with UK food law, labelling rules, and safety standards."
  }
};

// ============================================
// 4. BENEFITS & RESULTS
// ============================================

export const BENEFITS_RESULTS = {
  collagenPowder: {
    question: "What results can I expect from Collagen Powder?",
    benefits: [
      "Smoother-looking skin",
      "Increased hydration",
      "Stronger hair and nails",
      "Improved joint comfort (varies individually)"
    ],
    timeline: "Results typically begin within 4-8 weeks of daily use."
  },
  haloGlow: {
    question: "What results can I expect from Halo Glow?",
    benefits: [
      "Brighter skin appearance",
      "Improved hydration levels",
      "Reduced appearance of dullness and uneven tone",
      "Support for collagen formation"
    ]
  },
  generalTimeline: {
    question: "How long until I notice changes?",
    answer: "Most users notice improvements between weeks 4-12, depending on lifestyle, hydration, and consistent intake."
  }
};

// ============================================
// 5. INGREDIENTS, ALLERGENS & DIETARY
// ============================================

export const DIETARY_INFO = {
  vegan: {
    question: "Are your products vegan?",
    answer: "Collagen Powder: not vegan (animal-derived). Halo Glow: typically vegan-friendly (check batch label for confirmation)."
  },
  glutenFree: {
    question: "Are the products gluten-free?",
    answer: "Yes."
  },
  sugar: {
    question: "Do the products contain sugar?",
    answer: "No added sugar. Some variants use natural sweeteners."
  },
  additives: {
    question: "Are artificial additives used?",
    answer: "No artificial colours or preservatives."
  },
  keto: {
    question: "Are your products keto-friendly?",
    answer: "Yes. They are low in carbohydrates."
  }
};

// ============================================
// 6. PACKAGING & STORAGE
// ============================================

export const STORAGE_INFO = {
  storage: {
    question: "How should I store the products?",
    instructions: [
      "Keep in a cool, dry place away from direct sunlight",
      "Reseal after use",
      "Do not refrigerate unless stated on packaging"
    ]
  },
  shelfLife: {
    question: "What is the shelf life?",
    answer: "Refer to the 'Best Before' date on the packaging. Typical shelf life is 18-24 months."
  },
  recyclable: {
    question: "Is the packaging recyclable?",
    answer: "Yes. Packaging is designed with recyclability in mind; check local recycling guidelines."
  }
};

// ============================================
// 7. ORDERING & LOGISTICS
// ============================================

export const ORDERING_LOGISTICS = {
  whereToBuy: {
    question: "Where can I buy Healios products?",
    answer: "Through the official Healios website and authorised retail partners."
  },
  delivery: {
    question: "What are the delivery times?",
    answer: "UK standard shipping: typically 2-4 business days. Express options may be available depending on location."
  },
  international: {
    question: "Do you offer international shipping?",
    answer: "Available to selected regions. Duties may apply."
  },
  returns: {
    question: "What is your returns policy?",
    answer: "Unused and unopened items may be returned within the specified return window. Contact support for instructions."
  }
};

// ============================================
// 8. TROUBLESHOOTING
// ============================================

export const TROUBLESHOOTING: TroubleshootingItem[] = [
  {
    issue: "My collagen won't dissolve properly",
    solutions: [
      "Mix with warmer water",
      "Stir or shake for 10-20 seconds",
      "Add powder after the liquid, not before"
    ]
  },
  {
    issue: "I forgot to take my daily serving",
    solutions: [
      "Resume as normal the next day",
      "Do not double dose"
    ]
  },
  {
    issue: "I experienced minor digestive discomfort",
    solutions: [
      "This is rare",
      "Reduce the dose for several days before returning to normal intake",
      "If symptoms persist, discontinue and consult a healthcare professional"
    ]
  }
];

// ============================================
// 9. LEGAL & REGULATORY NOTES
// ============================================

export const LEGAL_NOTES = [
  "All statements relate to general wellbeing.",
  "Products do not replace a varied, balanced diet and healthy lifestyle.",
  "Always check packaging for the most current ingredients.",
  "UK Food Supplement regulations apply (FSA guidance)."
];

export const STANDARD_DISCLAIMER = "Food supplements should not be used as a substitute for a varied and balanced diet and a healthy lifestyle. Do not exceed the recommended daily dose. Keep out of reach of children. If you are pregnant, breastfeeding, taking medication, or have a medical condition, consult your healthcare professional before use.";

// ============================================
// 10. COMPILED FAQ CATEGORIES
// ============================================

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "ordering-shipping",
    name: "Ordering & Shipping",
    icon: "Package",
    items: [
      {
        question: "How long does delivery take?",
        answer: "UK standard shipping typically takes 2-4 business days. Express options may be available depending on your location. You'll receive tracking information once your order is dispatched."
      },
      {
        question: "Do you ship internationally?",
        answer: "Yes, we ship to selected international regions. Please note that customs duties and taxes may apply for orders outside the UK. Delivery times vary by destination."
      },
      {
        question: "How can I track my order?",
        answer: "Once your order is dispatched, you'll receive an email with tracking information. You can also view your order status by logging into your account and visiting the Order History section."
      },
      {
        question: "Can I change or cancel my order?",
        answer: "If you need to modify or cancel your order, please contact us at support@thehealios.com as soon as possible. We process orders quickly, so changes may not be possible once the order has been dispatched."
      },
      {
        question: "Where can I buy Healios products?",
        answer: "Healios products are available through our official website and authorised retail partners. For the best experience and access to our full range, we recommend ordering directly from us."
      }
    ]
  },
  {
    id: "returns-refunds",
    name: "Returns & Refunds",
    icon: "RotateCcw",
    items: [
      {
        question: "What is your returns policy?",
        answer: "Unused and unopened items may be returned within 30 days of delivery. Items must be in their original packaging. Contact support@thehealios.com to initiate a return."
      },
      {
        question: "How do I return a product?",
        answer: "Email support@thehealios.com with your order number and reason for return. We'll provide you with return instructions and a prepaid shipping label where applicable."
      },
      {
        question: "When will I receive my refund?",
        answer: "Once we receive and inspect your return, refunds are typically processed within 5-7 business days. The refund will be credited to your original payment method."
      },
      {
        question: "Can I exchange a product?",
        answer: "Yes, we offer exchanges for unopened products. Contact our support team to arrange an exchange for a different product or variant."
      }
    ]
  },
  {
    id: "products-ingredients",
    name: "Products & Ingredients",
    icon: "Leaf",
    items: [
      {
        question: "Are your products vegan?",
        answer: "It varies by product. Collagen Powder is not vegan as it contains animal-derived collagen. Halo Glow is typically vegan-friendly. Please check individual product pages or batch labels for confirmation."
      },
      {
        question: "Are the products gluten-free?",
        answer: "Yes, all Healios products are gluten-free and suitable for those with gluten sensitivities or coeliac disease."
      },
      {
        question: "Do your products contain sugar?",
        answer: "No added sugar. Some gummy variants use natural sweeteners to enhance taste while keeping sugar content minimal."
      },
      {
        question: "Are artificial additives used?",
        answer: "No. We do not use artificial colours, flavours, or preservatives in any of our products. We believe in clean, transparent formulations."
      },
      {
        question: "Are your products keto-friendly?",
        answer: "Yes. Our products are low in carbohydrates and suitable for those following a ketogenic diet."
      },
      {
        question: "What allergens do your products contain?",
        answer: "Allergen information varies by product. Collagen Powder contains protein derived from animal sources but is free from gluten, dairy, soy, and nuts. Always check individual product labels for specific allergen information."
      }
    ]
  },
  {
    id: "usage-dosage",
    name: "Usage & Dosage",
    icon: "Clock",
    items: [
      {
        question: "How do I take Healios supplements?",
        answer: "Each product has specific usage instructions. Generally, gummies should be chewed, and powders should be mixed with water or your favourite beverage. Always follow the recommended dosage on the product label."
      },
      {
        question: "When is the best time to take supplements?",
        answer: "Most of our supplements can be taken at any time of day. Some products work best with food for optimal absorption. Check individual product pages for specific timing recommendations."
      },
      {
        question: "Can I take multiple Healios products together?",
        answer: "Yes, many of our products are designed to work synergistically. For example, Collagen Powder and Halo Glow complement each other well. Follow the daily serving recommendations for each product."
      },
      {
        question: "What if I miss a dose?",
        answer: "Simply resume your normal routine the next day. Do not double dose to make up for a missed serving."
      },
      {
        question: "How long until I see results?",
        answer: "Most users notice improvements between 4-12 weeks of consistent daily use, depending on the product and individual factors like lifestyle and hydration."
      }
    ]
  },
  {
    id: "storage-shelf-life",
    name: "Storage & Shelf Life",
    icon: "Thermometer",
    items: [
      {
        question: "How should I store my supplements?",
        answer: "Keep in a cool, dry place away from direct sunlight. Reseal after each use. Do not refrigerate unless specifically stated on the packaging."
      },
      {
        question: "What is the shelf life of your products?",
        answer: "Typical shelf life is 18-24 months from manufacture. Always refer to the 'Best Before' date printed on your product packaging."
      },
      {
        question: "Is the packaging recyclable?",
        answer: "Yes. Our packaging is designed with recyclability in mind. Please check your local recycling guidelines for proper disposal."
      },
      {
        question: "Can I travel with supplements?",
        answer: "Yes, our products are travel-friendly. Keep them in their original packaging and store in a cool place. For air travel, supplements are generally permitted in carry-on luggage."
      }
    ]
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "RefreshCw",
    items: [
      {
        question: "How do subscriptions work?",
        answer: "Subscribe to your favourite products and receive automatic deliveries at your chosen frequency (monthly, bi-monthly, or quarterly). Enjoy savings on every order and never run out of your essentials."
      },
      {
        question: "Can I modify my subscription?",
        answer: "Yes, you have full control over your subscription. Log into your account to change products, adjust frequency, skip a delivery, or update your payment and shipping information."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "You can cancel your subscription at any time by logging into your account or contacting our support team at support@thehealios.com. There are no cancellation fees."
      },
      {
        question: "What are the subscription benefits?",
        answer: "Subscribers enjoy exclusive discounts on every order, priority access to new products, free shipping on qualifying orders, and the convenience of automatic deliveries."
      }
    ]
  },
  {
    id: "safety-health",
    name: "Safety & Health",
    icon: "Shield",
    items: [
      {
        question: "Are Healios products safe?",
        answer: "Yes. All Healios products are produced in facilities that follow UK Food Safety and Hygiene standards. We use high-quality ingredients and conduct rigorous testing."
      },
      {
        question: "Are supplements suitable during pregnancy or breastfeeding?",
        answer: "We recommend consulting a healthcare professional before using any supplement when pregnant, planning a pregnancy, or breastfeeding."
      },
      {
        question: "Are there age restrictions?",
        answer: "Our standard products are intended for adults aged 18 and over. We offer specific formulations designed for children, clearly labelled as such."
      },
      {
        question: "Can I take supplements with medication?",
        answer: "If you are taking any medication or have a medical condition, please consult your healthcare professional before starting any new supplement regimen."
      },
      {
        question: "Are these supplements medicines?",
        answer: "No. Healios products are food supplements and are not intended to diagnose, treat, cure, or prevent any disease. They should complement, not replace, a balanced diet."
      },
      {
        question: "Are your products approved by UK authorities?",
        answer: "Food supplements do not require specific 'approval' by UK authorities, but all Healios products comply with UK food law, labelling rules, and safety standards."
      }
    ]
  },
  {
    id: "wholesale",
    name: "Wholesale & Trade",
    icon: "Building2",
    items: [
      {
        question: "Do you offer wholesale pricing?",
        answer: "Yes, we have a dedicated wholesale programme for retailers, gyms, health professionals, and other trade partners. Visit our Wholesale Partners page or contact hello@thehealios.com for more information."
      },
      {
        question: "What are the minimum order requirements?",
        answer: "Minimum order quantities vary by product and partnership tier. Contact our wholesale team for specific requirements and pricing."
      },
      {
        question: "How do I become a stockist?",
        answer: "We'd love to hear from you. Apply through our Wholesale Partners page or email hello@thehealios.com with details about your business."
      },
      {
        question: "Do you provide marketing materials for retailers?",
        answer: "Yes, approved wholesale partners receive access to product imagery, descriptions, and promotional materials to support sales."
      }
    ]
  }
];

// ============================================
// 11. KNOWLEDGE BASE METADATA
// ============================================

export const KB_METADATA = {
  version: "2025-12",
  lastUpdated: "2025-12-08",
  markets: ["United Kingdom"],
  brand: "Healios",
  changelog: [
    {
      version: "2025-12",
      date: "2025-12-08",
      notes: "Initial comprehensive KB creation for AI prompt reference and app content."
    }
  ]
};
