"use strict";
function updateFilterVisibility(){
  document.documentElement.dataset.catalogSection = document.getElementById("categoryFilter").value;
  const equipment = document.getElementById("categoryFilter").value === "equipment";
  document.getElementById("subcategoryField").hidden = !equipment;
  document.getElementById("genderField").hidden = !equipment;
  document.getElementById("sizeField").hidden = !equipment;
  if(!equipment){
    document.getElementById("subcategoryFilter").value = "all";
    document.getElementById("genderFilter").value = "all";
    document.getElementById("sizeFilter").value = "all";
  }
}
function updateDynamicOptions(){
  const cat = document.getElementById("categoryFilter").value;
  const brandSelect = document.getElementById("brandFilter");
  const currentBrand = brandSelect.value;
  const relevant = products.filter(p => cat === "all" || p.cat === cat);
  const brands = [...new Set(relevant.map(p => (p.brand || "").trim()).filter(Boolean))]
    .sort((a,b) => a.localeCompare(b,"ru"));
  brandSelect.innerHTML = `<option value="all">Все бренды</option>` +
    brands.map(brand => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join("");
  brandSelect.value = brands.includes(currentBrand) ? currentBrand : "all";

  const sizeSelect = document.getElementById("sizeFilter");
  const currentSize = sizeSelect.value;
  const sizes = [...new Set(products.filter(p => p.cat === "equipment")
    .flatMap(p => String(p.size || "").split(/[,;/|]+/).map(x => x.trim()).filter(Boolean)))]
    .sort((a,b) => a.localeCompare(b,"ru", {numeric:true}));
  sizeSelect.innerHTML = `<option value="all">Любой размер</option>` +
    sizes.map(size => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`).join("");
  sizeSelect.value = sizes.includes(currentSize) ? currentSize : "all";
}
function toggleFilters(force){
  const panel = document.getElementById("filterPanel");
  const button = document.getElementById("filterToggle");
  const open = force === undefined ? panel.hidden : Boolean(force);
  panel.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
  button.classList.toggle("is-open", open);
}
function onCategoryFilterChange(){
  renderCatalog();
}
function selectedFilters(){
  const result = [];
  const val = id => document.getElementById(id).value;
  const add = (key,label,value) => { if(value && value !== "all") result.push({key,label,value}); };
  add("categoryFilter","Раздел",val("categoryFilter") === "all" ? "all" : categoryName(val("categoryFilter")));
  add("subcategoryFilter","Категория",val("subcategoryFilter") === "all" ? "all" : subcategoryName(val("subcategoryFilter")));
  add("brandFilter","Бренд",val("brandFilter"));
  add("genderFilter","Пол",val("genderFilter") === "all" ? "all" : genderName(val("genderFilter")));
  add("sizeFilter","Размер",val("sizeFilter"));
  add("statusFilter","Наличие",val("statusFilter"));
  const query = val("searchInput").trim();
  if(query) result.push({key:"searchInput",label:"Поиск",value:query});
  return result;
}
function renderActiveFilters(){
  const filters = selectedFilters();
  document.getElementById("activeFilters").innerHTML = filters.map(f =>
    `<span class="filter-chip">${escapeHtml(f.label)}: ${escapeHtml(f.value)} <button type="button" aria-label="Убрать фильтр ${escapeHtml(f.label)}" onclick="removeFilter('${f.key}')"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></span>`
  ).join("");
  document.getElementById("activeFilters").hidden = filters.length === 0;
}
function removeFilter(key){
  const element = document.getElementById(key);
  if(element){ element.value = "all"; if(key === "searchInput") element.value = ""; }
  if(key === "categoryFilter") updateFilterVisibility();
  updateDynamicOptions();
  renderCatalog();
  (document.querySelector("#activeFilters button") || document.getElementById("searchInput")).focus();
}
function clearFilters(){
  showAllCatalog = false;
  ["categoryFilter","subcategoryFilter","brandFilter","genderFilter","sizeFilter","statusFilter"].forEach(id => {
    document.getElementById(id).value = "all";
  });
  document.getElementById("searchInput").value = "";
  document.getElementById("sortFilter").value = "available";
  renderCatalog();
  document.getElementById("searchInput").focus();
}
function matchesSize(product, selected){
  const values = String(product.size || "").split(/[,;/|]+/).map(x => x.trim());
  return values.includes(selected);
}
function getFilteredProducts(){
  const category = document.getElementById("categoryFilter").value;
  const subcategory = document.getElementById("subcategoryFilter").value;
  const brand = document.getElementById("brandFilter").value;
  const gender = document.getElementById("genderFilter").value;
  const size = document.getElementById("sizeFilter").value;
  const status = document.getElementById("statusFilter").value;
  const query = document.getElementById("searchInput").value.trim().toLocaleLowerCase("ru");
  const queryFields = p => [
    p.name,p.brand,p.article,p.size,p.description,p.compatibility,
    p.cat === "equipment" ? genderName(p.gender) : "",
    p.cat === "equipment" ? subcategoryName(p.subcategory) : ""
  ].join(" ").toLocaleLowerCase("ru");
  let result = products.filter(p =>
    (category === "all" || p.cat === category) &&
    (category !== "equipment" || subcategory === "all" || p.subcategory === subcategory) &&
    (brand === "all" || (p.brand || "") === brand) &&
    (p.cat !== "equipment" || gender === "all" || (p.gender || "") === gender) &&
    (p.cat !== "equipment" || size === "all" || matchesSize(p,size)) &&
    (status === "all" || p.status === status) &&
    (!query || queryFields(p).includes(query))
  );
  const sort = document.getElementById("sortFilter").value;
  result = [...result];
  if(sort === "available") result.sort((a,b) => Number(b.status === "В наличии") - Number(a.status === "В наличии"));
  if(sort === "priceAsc") result.sort((a,b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if(sort === "priceDesc") result.sort((a,b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  if(sort === "name") result.sort((a,b) => (a.name || "").localeCompare(b.name || "", "ru"));
  if(sort === "newest") result.sort((a,b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)));
  return result;
}

const FILTER_PARAMS = {
  categoryFilter:"section", subcategoryFilter:"type", brandFilter:"brand",
  genderFilter:"gender", sizeFilter:"size", statusFilter:"status", searchInput:"q", sortFilter:"sort"
};
function restoreFiltersFromUrl(){
  const params = new URLSearchParams(location.search);
  for(const [id,param] of Object.entries(FILTER_PARAMS)){
    const control = document.getElementById(id);
    const value = params.get(param) || (id === "searchInput" ? "" : id === "sortFilter" ? "available" : "all");
    if(id === "categoryFilter"){
      control.value = [...control.options].some(option => option.value === value) ? value : "all";
      updateFilterVisibility();
      updateDynamicOptions();
    }else if(id === "searchInput") control.value = value;
    else control.value = [...control.options].some(option => option.value === value) ? value : id === "sortFilter" ? "available" : "all";
  }
}
function syncFiltersToUrl(){
  const url = new URL(location.href);
  for(const [id,param] of Object.entries(FILTER_PARAMS)){
    const value = document.getElementById(id).value;
    if(!value || value === "all" || (id === "sortFilter" && value === "available")) url.searchParams.delete(param);
    else url.searchParams.set(param,value);
  }
  if(url.href !== location.href && /^https?:$/.test(location.protocol)) history.replaceState(null,"",url);
}

let equipmentDirectoryType = null;
// Visible subdirectories and the detailed filter share one source of truth.
function renderEquipmentTypes(){
  const visible = document.getElementById("categoryFilter").value === "equipment";
  const directory = document.getElementById("equipmentDirectory");
  directory.hidden = !visible;
  if(!visible){equipmentDirectoryType = null;return;}
  const selected = document.getElementById("subcategoryFilter").value;
  const labels = {protection:"Защита",base:"Термобельё"};
  const mobile = matchMedia("(max-width:760px)").matches;
  if(equipmentDirectoryType !== selected){directory.open = !mobile || selected === "all";equipmentDirectoryType = selected;}
  if(mobile && document.getElementById("searchInput").value.trim()) directory.open = false;
  document.getElementById("equipmentCurrent").textContent = selected === "all" ? "Вся экипировка" : (labels[selected] || subcategories[selected]);
  const iconIndexes = {all:0,jackets:1,pants:2,suits:3,boots:4,gloves:5,helmets:6,protection:7,base:8,rain:9,bags:10,accessories:11};
  const items = [["all","Вся экипировка"], ...Object.entries(subcategories)];
  document.getElementById("equipmentTypes").innerHTML = items.map(([key,label]) => {
    const index = iconIndexes[key] ?? iconIndexes.accessories;
    const params = new URLSearchParams(location.search);
    params.set("section","equipment");
    if(key === "all") params.delete("type");
    else params.set("type",key);
    return `<a href="catalog.html?${escapeHtml(params.toString())}" data-equipment-type="${key}"${key === selected ? ' aria-current="page"' : ''} onclick="chooseEquipmentType(event,'${key}')"><span class="equipment-type-art" aria-hidden="true" style="background-position:${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 50}%"></span><span class="equipment-type-label">${escapeHtml(labels[key] || label)}</span></a>`;
  }).join("");
}
function chooseEquipmentType(event, type){
  // Keep native new-tab and modified-click behaviour for direct category links.
  if(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if(type !== "all" && !Object.prototype.hasOwnProperty.call(subcategories,type)) return;
  event.preventDefault();
  const href = event.currentTarget.href;
  if(/^https?:$/.test(location.protocol) && href !== location.href) history.pushState(null,"",href);
  document.getElementById("categoryFilter").value = "equipment";
  document.getElementById("subcategoryFilter").value = type;
  renderCatalog();
  // Re-rendering the links must not discard the keyboard user's focus.
  if(document.getElementById("equipmentDirectory").open) document.querySelector(`[data-equipment-type="${type}"]`)?.focus({preventScroll:true});
  else {const status = document.getElementById("catalogStatus");status.focus({preventScroll:true});status.scrollIntoView({block:"start",behavior:"instant"});}
}
