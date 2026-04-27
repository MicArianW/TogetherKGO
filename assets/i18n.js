(function(){
  const dict = {
    en: {
      title: "TogetherKGO – Food Resources",
      share: "Share",
      help: "Help",
      search_filters: "Search & Filters",
      search_label: "Search by name, keywords",
      type_label: "Type",
      diet_label: "Dietary/Cultural",
      day_label: "Day",
      radius_label: "Radius",
      any: "Any",
      food_bank: "Food bank",
      community_meal: "Community meal",
      pantry: "Pantry",
      market: "Market",
      delivery: "Delivery",
      halal:"Halal", vegetarian:"Vegetarian", vegan:"Vegan", kosher:"Kosher",
      south_asian:"South Asian", east_african:"East African",
      apply:"Apply", reset:"Reset",
      community_board:"Community Board",
      announce:"Share a note or announcement",
      post:"Post", clear:"Clear",
      results:"Results"
    },
    fr: {
      title: "TogetherKGO – Ressources alimentaires",
      share: "Partager",
      help: "Aide",
      search_filters: "Recherche & filtres",
      search_label: "Rechercher par nom, mots-clés",
      type_label: "Type",
      diet_label: "Alimentation/Culture",
      day_label: "Jour",
      radius_label: "Rayon",
      any: "Tous",
      food_bank: "Banque alimentaire",
      community_meal: "Repas communautaire",
      pantry: "Garde-manger",
      market: "Marché",
      delivery: "Livraison",
      halal:"Halal", vegetarian:"Végétarien", vegan:"Végétalien", kosher:"Casher",
      south_asian:"Asie du Sud", east_african:"Afrique de l'Est",
      apply:"Appliquer", reset:"Réinitialiser",
      community_board:"Tableau communautaire",
      announce:"Publier une note ou annonce",
      post:"Publier", clear:"Effacer",
      results:"Résultats"
    },
    ur: {
      title: "ٹوگیدر کے جی او – غذائی وسائل",
      share: "شیئر کریں",
      help: "مدد",
      search_filters: "تلاش اور فلٹرز",
      search_label: "نام یا کلیدی الفاظ سے تلاش کریں",
      type_label: "قسم",
      diet_label: "خوراک/ثقافت",
      day_label: "دن",
      radius_label: "رداس",
      any: "کوئی بھی",
      food_bank: "فوڈ بینک",
      community_meal: "کمیونٹی کھانا",
      pantry: "پینٹری",
      market: "مارکیٹ",
      delivery: "ڈیلیوری",
      halal:"حلال", vegetarian:"شاکاہاری", vegan:"ویگن", kosher:"کشروت",
      south_asian:"جنوبی ایشیائی", east_african:"مشرقی افریقی",
      apply:"لاگو کریں", reset:"ری سیٹ",
      community_board:"کمیونٹی بورڈ",
      announce:"اعلان یا نوٹ شیئر کریں",
      post:"پوسٹ", clear:"صاف کریں",
      results:"نتائج"
    }
  };
  function setLang(lang){
    const strings = dict[lang] || dict.en;
    for(const el of document.querySelectorAll("[data-i18n]")){
      const key = el.getAttribute("data-i18n");
      if(strings[key]) el.textContent = strings[key];
    }
    document.documentElement.lang = lang;
  }
  window.__I18N__ = { setLang };
  window.addEventListener("DOMContentLoaded", () => {
    const langEn = document.getElementById("lang-en");
    const langFr = document.getElementById("lang-fr");
    const langUr = document.getElementById("lang-ur");

    if (langEn) langEn.onclick = ()=>setLang("en");
    if (langFr) langFr.onclick = ()=>setLang("fr");
    if (langUr) langUr.onclick = ()=>setLang("ur");
  });
  setLang("en");
})();
