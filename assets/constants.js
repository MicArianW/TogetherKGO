window.CONSTANTS = {

  /* 
     SERVICE TAGS – used by find-services.html filters
     Keys must match tags[] in data/services.json
   */
  TAG_LABELS: {
    food_bank: "Food Bank",
    hot_meals: "Hot Meals",
    community_support: "Community Support",
    youth_programs: "Youth Programs",
    family_support: "Family Support",
    health_services: "Health Services",
    social_services: "Social Services",
    housing_support: "Housing Support"
  },

  /* 
     HOME TAGS – displayed on the homepage hero
     key = URL param passed to find-services.html
     label = display text
  */
  HOME_TAGS: {
    food_support: "Food Support",
    community_pantry: "Community Pantry",
    meal_program: "Meal Program",
    community_market: "Community Market",
    employment: "Employment",
    housing: "Housing",
    community_health: "Community Health",
    youth: "Youth",
    newcomer: "Newcomer"
  },

  RESOURCE_TYPES: {
    grant: "Grant / Funding",
    microgrant: "Microgrant",
    directory: "Directory / Resource List",
    toolkit: "Toolkit / Guide",
    certification_support: "Certification / Subsidy Support",
    training: "Training / Workshop",
    program: "Community Program",
    greening: "Greening / Environmental Support",
    general: "General Resource",
    education_library: "Education & Library",
    tax_finance: "Tax & Finance",
    other: "Other"
  },

  RESOURCE_REGIONS: {
    toronto: "Toronto",
    other: "Other"
  },

  /* 
     LANGUAGES – displayed on the homepage
     key = Google Translate language code
     label = display text
   */
  LANGUAGES: {
    en: "English",
    ta: "தமிழ் (Tamil)",
    bn: "বাংলা (Bengali)",
    tl: "Tagalog",
    gu: "ગુજરાતી (Gujarati)",
    ur: "اردو (Urdu)",
    fa: "فارسی (Farsi)",
    es: "Español",
    fr: "Français",
    hi: "हिन्दी (Hindi)",
    ar: "العربية (Arabic)",
    "zh-CN": "中文 (Chinese)"
  },

  ORGANIZATION_TYPES: {
    community_org: "Community Organization",
    grassroots_org: "Grassroots Organization",
    city_of_toronto: "City of Toronto",
    community_inst: "Community Institution",
    individual: "Individual"
  },

  UPDATE_TYPES: {
    update: "General Update",
    urgent: "Urgent Notice",
    event: "Special Event",
    recurring_event: "Recurring Event",
    food_available: "Food Available Today"
  },

  DAYS: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],

  MAP: {
    DEFAULT_CENTER: { lat: 43.744, lng: -79.197 },
    DEFAULT_ZOOM: 13
  },

  SEARCH: {
    MAX_RADIUS: 99999
  }

};
