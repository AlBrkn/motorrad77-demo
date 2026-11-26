"use strict";
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}
function money(value){
  if(value === null || value === undefined || value === "") return "Цена по запросу";
  return Number(value).toLocaleString("ru-RU") + " ₽";
}
function categoryName(key){ return categories[key] || "Каталог"; }
function subcategoryName(key){ return subcategories[key] || ""; }
function genderName(key){ return genders[key] || ""; }
function productImages(product){
  const original = productOriginalImages(product);
  const manufacturer = productManufacturer(product);
  const official = manufacturer?.images || [];
  return [...new Set(manufacturer?.cover === false ? [...original,...official] : [...official,...original])].filter(safeImageSource);
}
function productOriginalImages(product){ return Array.isArray(product.images) && product.images.length ? product.images : product.photo ? [product.photo] : []; }
function productManufacturer(product){ return window.M77_MANUFACTURER_DATA?.[String(product.id)] || null; }
function isManufacturerPhoto(product,src){ return Boolean(productManufacturer(product)?.images.includes(src)); }
function manufacturerSourceUrl(manufacturer){
  try{
    const url = new URL(manufacturer?.sourceUrl || "");
    return url.protocol === "https:" && /(^|\.)(alpinestars\.com|dainese\.com|dainesejapan\.com|bmw-motorrad\.co\.uk|revitsport\.com|furygan\.com)$/.test(url.hostname) ? url.href : "";
  }catch{return "";}
}
function safeImageSource(src){
  return typeof src === "string" && (/^data:image\//i.test(src) || /^https?:\/\//i.test(src) || /^assets\/products\/(?:telegram\/[a-f0-9]+\.jpg|(?:official|partner)\/[a-f0-9]+\.(?:jpg|png|webp|avif))$/i.test(src)) ? src : "";
}
function productPrice(product){return (product.priceFrom && product.price != null ? "от " : "") + money(product.price);}
function productSourceUrl(product){return /^https:\/\/t\.me\/motorrad_77\/\d+$/.test(product.sourceUrl || "") ? product.sourceUrl : "";}
function productContactUrl(product){return product.contactUrl === "https://t.me/msknnnnnn" ? product.contactUrl : "https://t.me/motorrad_77";}
function productSourceDate(product){const date = new Date(product.sourceDate);return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric"}).format(date) : "";}
function statusClass(status){
  if(status === "В наличии") return "available";
  if(status === "В пути") return "transit";
  if(status === "Под заказ") return "order";
  return "demo";
}
function statusLabel(product){
  return product.isDemo ? "Пример" : (product.status || "Уточнить");
}
function makePlaceholder(){
  return `<div class="product-placeholder">
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="34" rx="4"/><circle cx="17" cy="18" r="3"/><path d="m8 36 11-11 7 7 5-5 9 9"/></svg>
    <span>Фото не добавлено</span>
  </div>`;
}
