"use strict";
const STORAGE_KEY = "m77products";
const categories = {
  equipment: "Экипировка",
  honda: "Запчасти Honda",
  tuning: "Тюнинг"
};
const subcategories = {
  jackets: "Куртки", pants: "Штаны", suits: "Комбинезоны",
  boots: "Мотоботы", gloves: "Перчатки", helmets: "Шлемы",
  protection: "Защита спины и груди", base: "Термобельё и базовые слои",
  rain: "Дождевики", bags: "Сумки и рюкзаки", accessories: "Аксессуары"
};
const genders = { male: "Мужское", female: "Женское", unisex: "Унисекс" };
const importedProducts = [
  ...(Array.isArray(window.M77_IMPORTED_CATALOG) ? window.M77_IMPORTED_CATALOG : []),
  ...(Array.isArray(window.M77_PARTNER_CATALOG) ? window.M77_PARTNER_CATALOG : [])
];
const IMPORTED_IDS_KEY = "m77importedProductIds";

let products = loadProducts();
function loadProducts(){
  let localProducts = [];
  try{
    const stored = localStorage.getItem(STORAGE_KEY);
    if(stored){
      const parsed = JSON.parse(stored);
      if(!Array.isArray(parsed)) return importedProducts.map(normalizeProduct);
      localProducts = parsed.filter(p => p && typeof p === "object" && !Array.isArray(p)).map(normalizeProduct);
    }
    let known = [];
    try{const saved = JSON.parse(localStorage.getItem(IMPORTED_IDS_KEY) || "[]");known = Array.isArray(saved) ? saved : [];}catch{}
    const seen = new Set(known.map(String));
    const localIds = new Set(localProducts.map(p => String(p.id)));
    const added = importedProducts.filter(p => !seen.has(String(p.id)) && !localIds.has(String(p.id))).map(normalizeProduct);
    const merged = [...added,...localProducts];
    if(added.length){
      // Preserve local edits; remember imported IDs so deleted products stay deleted.
      localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
    }
    localStorage.setItem(IMPORTED_IDS_KEY,JSON.stringify([...new Set([...known,...importedProducts.map(p=>String(p.id))])]));
    return merged;
  }catch(error){
    const localIds = new Set(localProducts.map(p => String(p.id)));
    return [...importedProducts.filter(p => !localIds.has(String(p.id))).map(normalizeProduct),...localProducts];
  }
}
function normalizeProduct(p){
  return {
    ...p,
    id: p.id ?? Date.now() + Math.random(),
    cat: p.cat || "equipment",
    images: Array.isArray(p.images) ? p.images : (p.photo ? [p.photo] : []),
    description: p.description || p.desc || "",
    article: p.article || "",
    compatibility: p.compatibility || "",
    measure: p.measure || "",
    createdAt: p.createdAt || String(p.id || Date.now())
  };
}
function persistProducts(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  }catch(error){
    showToast("Не удалось сохранить данные. Уменьши количество или размер фотографий.");
    return false;
  }
}
