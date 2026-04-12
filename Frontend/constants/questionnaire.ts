export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "scale";
  options?: QuestionOption[];
  category: "basic" | "skin" | "lifestyle" | "concerns" | "products";
}

export const QUESTIONNAIRE: Question[] = [
    {
    id: "q1",
    question: "How old are you?",
    type: "text",
    category: "basic",
  },
  {
    id: "q2",
    question: "What is your skin type?",
    type: "single",
    category: "skin",
    options: [
      { label: "Oily", value: "oily" },
      { label: "Dry", value: "dry" },
      { label: "Combination", value: "combination" },
      { label: "Normal", value: "normal" },
      { label: "Sensitive", value: "sensitive" },
      { label: "Not sure", value: "not_sure" },
    ],
  },
  {
    id: "q3",
    question: "How does your skin feel by midday?",
    type: "single",
    category: "skin",
    options: [
      { label: "Very oily all over", value: "very_oily" },
      { label: "Oily in T-zone only", value: "oily_tzone" },
      { label: "Tight and dry", value: "tight_dry" },
      { label: "Comfortable", value: "comfortable" },
      { label: "Flaky or rough", value: "flaky" },
    ],
  },
  {
    id: "q4",
    question: "What are your main skin concerns? (Select all that apply)",
    type: "multiple",
    category: "concerns",
    options: [
      { label: "Acne/Breakouts", value: "acne" },
      { label: "Dark Spots", value: "dark_spots" },
      { label: "Hyperpigmentation", value: "hyperpigmentation" },
      { label: "Melasma", value: "melasma" },
      { label: "Redness/Irritation", value: "redness" },
      { label: "My skin is normal", value: "normal_skin" },
    ],
  },
  {
    id: "q5",
    question: "How often do you experience breakouts?",
    type: "single",
    category: "concerns",
    options: [
      { label: "Constantly", value: "constantly" },
      { label: "Frequently (weekly)", value: "frequently" },
      { label: "Occasionally (monthly)", value: "occasionally" },
      { label: "Rarely", value: "rarely" },
      { label: "Never", value: "never" },
    ],
  },
  {
    id: "q6",
    question: "Do you have any skin conditions?",
    type: "multiple",
    category: "concerns",
    options: [
      { label: "Melasma", value: "melasma" },
      { label: "Chronic Acne", value: "chronic_acne" },
      { label: "Hyperpigmentation", value: "hyperpigmentation" },
      { label: "None", value: "none" },
    ],
  },
  {
    id: "q7",
    question: "How sensitive is your skin?",
    type: "scale",
    category: "skin",
    options: [
      { label: "Not sensitive", value: "1" },
      { label: "Slightly sensitive", value: "2" },
      { label: "Moderately sensitive", value: "3" },
      { label: "Very sensitive", value: "4" },
      { label: "Extremely sensitive", value: "5" },
    ],
  },
  {
    id: "q8",
    question: "What is your current skincare routine?",
    type: "single",
    category: "products",
    options: [
      { label: "No routine", value: "none" },
      { label: "Basic (cleanser + moisturizer)", value: "basic" },
      { label: "Moderate (3-5 products)", value: "moderate" },
      { label: "Extensive (6+ products)", value: "extensive" },
    ],
  },
  {
    id: "q9",
    question: "Which products do you currently use? (Select all that apply)",
    type: "multiple",
    category: "products",
    options: [
      { label: "Cleanser", value: "cleanser" },
      { label: "Toner", value: "toner" },
      { label: "Serum", value: "serum" },
      { label: "Moisturizer", value: "moisturizer" },
      { label: "Sunscreen", value: "sunscreen" },
      { label: "Eye cream", value: "eye_cream" },
      { label: "Face mask", value: "face_mask" },
      { label: "Exfoliator", value: "exfoliator" },
      { label: "Retinol/Retinoids", value: "retinol" },
      { label: "None", value: "none" },
    ],
  },
  {
    id: "q10",
    question: "How often do you wear sunscreen?",
    type: "single",
    category: "lifestyle",
    options: [
      { label: "Daily", value: "daily" },
      { label: "Only when sunny", value: "sunny_days" },
      { label: "Occasionally", value: "occasionally" },
      { label: "Rarely", value: "rarely" },
      { label: "Never", value: "never" },
    ],
  },
  {
    id: "q11",
    question: "How much time do you spend outdoors daily?",
    type: "single",
    category: "lifestyle",
    options: [
      { label: "Less than 30 minutes", value: "less_30" },
      { label: "30 minutes - 1 hour", value: "30_60" },
      { label: "1-2 hours", value: "60_120" },
      { label: "2-4 hours", value: "120_240" },
      { label: "More than 4 hours", value: "more_240" },
    ],
  },
  {
    id: "q12",
    question: "How would you rate your stress levels?",
    type: "scale",
    category: "lifestyle",
    options: [
      { label: "Very low", value: "1" },
      { label: "Low", value: "2" },
      { label: "Moderate", value: "3" },
      { label: "High", value: "4" },
      { label: "Very high", value: "5" },
    ],
  },
  {
    id: "q13",
    question: "How many hours of sleep do you get per night?",
    type: "single",
    category: "lifestyle",
    options: [
      { label: "Less than 5 hours", value: "less_5" },
      { label: "5-6 hours", value: "5_6" },
      { label: "7-8 hours", value: "7_8" },
      { label: "More than 8 hours", value: "more_8" },
    ],
  },
  {
    id: "q14",
    question: "How much water do you drink daily?",
    type: "single",
    category: "lifestyle",
    options: [
      { label: "Less than 4 glasses", value: "less_4" },
      { label: "4-6 glasses", value: "4_6" },
      { label: "7-8 glasses", value: "7_8" },
      { label: "More than 8 glasses", value: "more_8" },
    ],
  },
  {
    id: "q15",
    question: "Do you smoke or use tobacco products?",
    type: "single",
    category: "lifestyle",
    options: [
      { label: "Yes, regularly", value: "regularly" },
      { label: "Yes, occasionally", value: "occasionally" },
      { label: "No, but I used to", value: "used_to" },
      { label: "Never", value: "never" },
    ],
  },
  {
    id: "q16",
    question: "How often do you exercise?",
    type: "single",
    category: "lifestyle",
    options: [
      { label: "Daily", value: "daily" },
      { label: "3-5 times per week", value: "3_5_week" },
      { label: "1-2 times per week", value: "1_2_week" },
      { label: "Rarely", value: "rarely" },
      { label: "Never", value: "never" },
    ],
  },
  {
    id: "q17",
    question: "Do you wear makeup regularly?",
    type: "single",
    category: "lifestyle",
    options: [
      { label: "Daily", value: "daily" },
      { label: "Several times a week", value: "several_week" },
      { label: "Occasionally", value: "occasionally" },
      { label: "Rarely", value: "rarely" },
      { label: "Never", value: "never" },
    ],
  },
  {
    id: "q18",
    question: "How do you remove makeup?",
    type: "single",
    category: "products",
    options: [
      { label: "Makeup remover/Micellar water", value: "makeup_remover" },
      { label: "Oil cleanser", value: "oil_cleanser" },
      { label: "Regular cleanser only", value: "regular_cleanser" },
      { label: "Wipes", value: "wipes" },
      { label: "I don't wear makeup", value: "no_makeup" },
    ],
  },
  {
    id: "q19",
    question: "What is your budget for skincare products monthly?",
    type: "single",
    category: "products",
    options: [
      { label: "Under PKR 2,000", value: "under_2000" },
      { label: "PKR 2,000 - 5,000", value: "2000_5000" },
      { label: "PKR 5,000 - 10,000", value: "5000_10000" },
      { label: "PKR 10,000 - 20,000", value: "10000_20000" },
      { label: "Over PKR 20,000", value: "over_20000" },
    ],
  },
  {
    id: "q20",
    question: "Do you prefer natural/organic products?",
    type: "single",
    category: "products",
    options: [
      { label: "Yes, exclusively", value: "exclusively" },
      { label: "Yes, when possible", value: "when_possible" },
      { label: "No preference", value: "no_preference" },
      { label: "No, I prefer scientific formulations", value: "scientific" },
    ],
  },
  {
    id: "q21",
    question: "Have you had any allergic reactions to skincare products?",
    type: "single",
    category: "concerns",
    options: [
      { label: "Yes, frequently", value: "frequently" },
      { label: "Yes, occasionally", value: "occasionally" },
      { label: "Once or twice", value: "once_twice" },
      { label: "Never", value: "never" },
      { label: "Not sure", value: "not_sure" },
    ],
  },
  {
    id: "q22",
    question: "Are you currently pregnant or breastfeeding?",
    type: "single",
    category: "basic",
    options: [
      { label: "Yes, pregnant", value: "pregnant" },
      { label: "Yes, breastfeeding", value: "breastfeeding" },
      { label: "No", value: "no" },
      { label: "Prefer not to say", value: "prefer_not_say" },
    ],
  },
  {
    id: "q23",
    question: "What are your skincare goals? (Select all that apply)",
    type: "multiple",
    category: "concerns",
    options: [
      { label: "Clear acne", value: "clear_acne" },
      { label: "Reduce dark spots", value: "reduce_spots" },
      { label: "Anti-aging", value: "anti_aging" },
      { label: "Brighten skin", value: "brighten" },
      { label: "Minimize pores", value: "minimize_pores" },
      { label: "Hydrate skin", value: "hydrate" },
      { label: "Even skin tone", value: "even_tone" },
      { label: "Reduce redness", value: "reduce_redness" },
      { label: "General maintenance", value: "maintenance" },
    ],
  },
  {
    id: "q24",
    question: "How long have you been dealing with your main skin concern?",
    type: "single",
    category: "concerns",
    options: [
      { label: "Less than 3 months", value: "less_3_months" },
      { label: "3-6 months", value: "3_6_months" },
      { label: "6-12 months", value: "6_12_months" },
      { label: "1-2 years", value: "1_2_years" },
      { label: "More than 2 years", value: "more_2_years" },
    ],
  },
  {
    id: "q25",
    question: "Any additional information about your skin or concerns?",
    type: "text",
    category: "concerns",
  },
];

export interface QuestionnaireAnswers {
  [questionId: string]: string | string[];
}
