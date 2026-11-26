"use strict";

let editingId = null;
let currentImages = [];
let detailImageIndex = 0;
let detailProductId = null;
let showAllCatalog = false;
let productFormDirty = false;
let imageUploadPending = false;


function renderProductCard(product){
  const images = productImages(product);
  const image = images.length ? safeImageSource(images[0]) : "";
  const meta = [];
  if(product.cat === "equipment" && product.gender) meta.push(genderName(product.gender));
  if(product.size) meta.push("Размер " + product.size);
  if(product.article) meta.push("Арт. " + product.article);
  return `<article class="product-card">
    <button class="product-media ${isManufacturerPhoto(product,image) ? 'manufacturer-photo' : ''}" type="button" aria-label="Открыть ${escapeHtml(product.name)}" onclick="openProductDetail(${escapeHtml(JSON.stringify(String(product.id)))})">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" width="720" height="540">` : makePlaceholder()}
      <span class="product-status ${statusClass(product.isDemo ? "Демо" : product.status)}">${escapeHtml(statusLabel(product))}</span>
    </button>
    <div class="product-info">
      <div class="product-brand">${escapeHtml(product.brand || categoryName(product.cat))}</div>
      <h3 class="product-name">${escapeHtml(product.name)}</h3>
      <div class="product-meta">${meta.map((item,i) => `${i ? '<span class="meta-dot"></span>' : ''}<span>${escapeHtml(item)}</span>`).join("")}</div>
      <div class="product-price">${productPrice(product)}</div>
      ${productSourceUrl(product) ? `<a class="product-source" href="${escapeHtml(productSourceUrl(product))}" target="_blank" rel="noopener">Объявление от ${escapeHtml(productSourceDate(product))}<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6h12v12"/></svg></a>` : ""}
      <div class="product-actions">
        <button class="button button-primary" type="button" onclick="openProductDetail(${escapeHtml(JSON.stringify(String(product.id)))})">Подробнее</button>
        <a class="button button-secondary" href="${escapeHtml(productContactUrl(product))}" target="_blank" rel="noopener">Задать вопрос</a>
      </div>
    </div>
  </article>`;
}
function renderCatalog(){
  updateFilterVisibility();
  updateDynamicOptions();
  const list = getFilteredProducts();
  const grid = document.getElementById("productGrid");
  const hasActiveCriteria =
    document.getElementById("categoryFilter").value !== "all" ||
    document.getElementById("subcategoryFilter").value !== "all" ||
    document.getElementById("brandFilter").value !== "all" ||
    document.getElementById("genderFilter").value !== "all" ||
    document.getElementById("sizeFilter").value !== "all" ||
    document.getElementById("statusFilter").value !== "all" ||
    document.getElementById("searchInput").value.trim() !== "";
  const usePreview = !showAllCatalog && !hasActiveCriteria && list.length > 3;
  const visibleProducts = usePreview ? list.slice(0,3) : list;
  grid.innerHTML = visibleProducts.length ? visibleProducts.map(renderProductCard).join("") :
    `<div class="empty-state" style="grid-column:1/-1">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
      <h3>${products.length ? "По вашему запросу ничего не найдено" : "Подберём то, что нужно именно вам"}</h3><p>${products.length ? "Попробуйте изменить запрос или сбросить фильтры." : "Каталог наполняется. Напишите нам — уточним наличие, размер и условия заказа."}</p>
      <div class="empty-actions">${products.length ? '<button class="button button-secondary" type="button" onclick="clearFilters()">Сбросить фильтры</button>' : ''}<a class="button button-primary" href="https://t.me/motorrad_77" target="_blank" rel="noopener">Написать в Telegram</a></div>
    </div>`;
  grid.setAttribute("aria-busy","false");
  const more = document.getElementById("catalogMore");
  const moreButton = document.getElementById("catalogMoreButton");
  more.hidden = !(!hasActiveCriteria && list.length > 3);
  moreButton.textContent = showAllCatalog ? "Свернуть список" : "Показать все товары";
  document.getElementById("catalogStatus").textContent = usePreview ? `Показано ${visibleProducts.length} из ${list.length}` : products.length ? `Найдено: ${list.length} ${pluralProducts(list.length)}` : "Товаров пока нет";
  document.getElementById("sortFilter").disabled = list.length < 2;
  const category = document.getElementById("categoryFilter").value;
  const subcategory = document.getElementById("subcategoryFilter").value;
  document.getElementById("catalogTitle").textContent = category === "equipment" && subcategory !== "all"
    ? subcategoryName(subcategory) : category === "all" ? "Каталог товаров" : categoryName(category);
  document.getElementById("catalogSubtitle").textContent = document.getElementById("categoryFilter").value === "equipment"
    ? "Подбери тип экипировки, бренд, пол и размер."
    : document.getElementById("categoryFilter").value === "honda"
      ? "Рычаги, ручки с подогревом, крышки двигателя и пластик. Подбор по модели, году и VIN."
      : document.getElementById("categoryFilter").value === "tuning"
        ? "Компоненты и аксессуары для доработки мотоцикла."
        : "Найди нужную экипировку, запчасть или аксессуар.";
  const hasDemo = products.some(p => p.isDemo);
  document.getElementById("demoNote").hidden = !hasDemo;
  renderActiveFilters();
  syncFiltersToUrl();
  renderEquipmentTypes();
  document.querySelectorAll("[data-section]").forEach(link => {
    if(link.dataset.section === document.getElementById("categoryFilter").value) link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  });
}
function toggleCatalogPreview(){
  showAllCatalog = !showAllCatalog;
  renderCatalog();
}
function pluralProducts(n){
  const n10 = n % 10, n100 = n % 100;
  if(n10 === 1 && n100 !== 11) return "товар";
  if(n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "товара";
  return "товаров";
}
function showToast(message){
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function openProductDetail(id){
  const product = products.find(p => String(p.id) === String(id));
  if(!product) return;
  detailProductId = product.id;
  detailImageIndex = 0;
  renderProductDetail(product);
  openDialog("productOverlay");
}
function renderProductDetail(product){
  const images = productImages(product).map(safeImageSource).filter(Boolean);
  const activeImage = images[detailImageIndex] || "";
  const manufacturer = productManufacturer(product);
  const officialPhoto = isManufacturerPhoto(product,activeImage);
  const details = [];
  details.push(["Раздел", categoryName(product.cat)]);
  if(product.cat === "equipment" && product.subcategory) details.push(["Категория", subcategoryName(product.subcategory)]);
  if(product.cat === "equipment" && product.gender) details.push(["Пол",genderName(product.gender)]);
  if(product.size) details.push(["Размер",product.size]);
  if(product.article) details.push(["Артикул",product.article]);
  if(product.compatibility) details.push(["Совместимость",product.compatibility]);
  details.push(["Наличие",product.isDemo ? "Демонстрационный пример" : (product.status || "Уточнить")]);
  document.getElementById("productDetail").innerHTML = `
    <div class="product-detail">
      <div class="detail-gallery">
        ${manufacturer ? `<div class="detail-photo-origin" aria-live="polite"><span>${officialPhoto ? 'Фото производителя' : 'Фото продавца'}</span><span>${detailImageIndex+1} / ${images.length}</span></div>` : ''}
        <div class="detail-main-image ${officialPhoto ? 'manufacturer-photo' : ''}">${activeImage ? `<img src="${escapeHtml(activeImage)}" alt="${escapeHtml(product.name)}${officialPhoto ? ' — фото производителя' : ''}" width="720" height="540">` : makePlaceholder()}</div>
        ${images.length > 1 ? `<div class="detail-thumbs">${images.map((src,i) => `<button type="button" class="detail-thumb ${i===detailImageIndex?'active':''}" aria-pressed="${i===detailImageIndex}" onclick="setDetailImage(${i})" aria-label="Фотография ${i+1}"><img src="${escapeHtml(src)}" alt="" width="62" height="54"></button>`).join("")}</div>` : ""}
      </div>
      <div class="detail-copy">
        <div class="detail-brand">${escapeHtml(product.brand || categoryName(product.cat))}</div>
        <h2 id="detailTitle">${escapeHtml(product.name)}</h2>
        <div class="detail-price">${productPrice(product)}</div>
        <span class="detail-status">${escapeHtml(statusLabel(product))}</span>
        <dl class="detail-table">${details.map(([k,v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>
        ${productSourceUrl(product) ? `<p class="detail-source">Цена и статус — по объявлению от ${escapeHtml(productSourceDate(product))}. Актуальное наличие уточняйте перед заказом.<br><a href="${escapeHtml(productSourceUrl(product))}" target="_blank" rel="noopener">Открыть исходное объявление в Telegram</a></p>` : ""}
        ${product.importNote ? `<p class="detail-note">${escapeHtml(product.importNote)}</p>` : ""}
        ${renderManufacturerDetails(manufacturer)}
        ${product.description ? manufacturer ? `<details class="detail-seller"><summary>Описание и условия продавца</summary><p class="detail-description">${escapeHtml(product.description)}</p></details>` : `<p class="detail-description">${escapeHtml(product.description)}</p>` : ""}
        ${product.measure ? `<div class="detail-note"><strong>Параметры размера:</strong><br>${escapeHtml(product.measure)}</div>` : ""}
        <a class="button button-primary" href="${escapeHtml(productContactUrl(product))}" target="_blank" rel="noopener">Уточнить в Telegram</a>
      </div>
    </div>`;
}
function setDetailImage(index){
  const product = products.find(p => String(p.id) === String(detailProductId));
  if(!product) return;
  detailImageIndex = index;
  renderProductDetail(product);
  document.querySelectorAll(".detail-thumb")[index]?.focus({preventScroll:true});
}
function renderManufacturerDetails(manufacturer){
  const source = manufacturerSourceUrl(manufacturer);
  if(!manufacturer || !source) return '';
  return `<section class="detail-manufacturer" aria-label="Описание модели по данным производителя">
    <h3>О модели</h3>
    <p>${escapeHtml(manufacturer.description)}</p>
    ${manufacturer.features?.length ? `<ul>${manufacturer.features.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>` : ''}
    ${manufacturer.note ? `<p class="manufacturer-note">${escapeHtml(manufacturer.note)}</p>` : ''}
    <a class="manufacturer-source" href="${escapeHtml(source)}" target="_blank" rel="noopener">По данным ${escapeHtml(manufacturer.brand)} ↗</a>
  </section>`;
}
function closeProductDetail(){
  detailProductId = null;
  closeDialog("productOverlay");
}
function overlayClose(event,id){
  if(event.target.id === id){
    if(id === "productOverlay") closeProductDetail();
    if(id === "adminOverlay") closeAdmin();
  }
}
function openAdmin(){
  const trigger = matchMedia("(max-width:760px)").matches ? document.querySelector(".mobile-menu-button") : document.activeElement;
  openDialog("adminOverlay",trigger);
  renderAdminList();
  updateAdminFields();
}
function closeAdmin(){
  closeDialog("adminOverlay");
}
function updateAdminFields(){
  const cat = document.getElementById("fcat").value;
  const equipment = cat === "equipment";
  document.getElementById("fsubcategoryWrap").hidden = !equipment;
  document.getElementById("fgenderWrap").hidden = !equipment;
  document.getElementById("fsizeWrap").hidden = !equipment;
  document.getElementById("fmeasureWrap").hidden = !equipment;
  document.getElementById("fcompatWrap").hidden = equipment;
}
function resetProductForm(force = false){
  if(imageUploadPending) return;
  if(!force && productFormDirty && !confirm("Очистить форму? Несохранённые изменения будут удалены.")) return;
  document.getElementById("productForm").reset();
  productFormDirty = false;
  document.getElementById("fnameError").hidden = true;
  document.getElementById("fname").removeAttribute("aria-invalid");
  editingId = null;
  currentImages = [];
  document.getElementById("formTitle").textContent = "Новая карточка товара";
  document.getElementById("saveProductButton").textContent = "Сохранить товар";
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("fimages").value = "";
  updateAdminFields();
}
async function compressImage(file){
  try{
    const bitmap = await createImageBitmap(file);
    const max = 1500;
    const scale = Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width*scale);
    canvas.height = Math.round(bitmap.height*scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg",0.78);
  }catch(error){
    return await new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
async function handleImageFiles(event){
  if(imageUploadPending) return;
  const files = [...(event.target.files || [])].filter(file => file.type.startsWith("image/")).slice(0,6-currentImages.length);
  if(!files.length) return;
  imageUploadPending = true;
  document.getElementById("saveProductButton").disabled = true;
  document.getElementById("clearProductFormButton").disabled = true;
  document.getElementById("imageProcessingStatus").hidden = false;
  document.getElementById("productForm").setAttribute("aria-busy","true");
  event.target.disabled = true;
  try{
    for(const file of files){
      try{currentImages.push(await compressImage(file));productFormDirty = true;}
      catch(error){showToast("Не удалось обработать одну из фотографий. Выберите другой файл.");}
    }
  }finally{
    imageUploadPending = false;
    event.target.value = "";event.target.disabled = false;
    document.getElementById("saveProductButton").disabled = false;
    document.getElementById("clearProductFormButton").disabled = false;
    document.getElementById("imageProcessingStatus").hidden = true;
    document.getElementById("productForm").removeAttribute("aria-busy");
    renderImagePreview();
  }
}
function renderImagePreview(){
  document.getElementById("imagePreview").innerHTML = currentImages.map((src,index) =>
    `<div class="image-preview-item"><img src="${escapeHtml(src)}" alt="Фото ${index+1}" width="62" height="56"><button type="button" aria-label="Удалить фото ${index+1}" onclick="removeImage(${index})"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>`
  ).join("");
}
function removeImage(index){
  currentImages.splice(index,1);
  productFormDirty = true;
  renderImagePreview();
}
function saveProduct(event){
  event.preventDefault();
  if(imageUploadPending) return;
  const name = document.getElementById("fname").value.trim();
  if(!name){document.getElementById("fnameError").hidden = false;document.getElementById("fname").setAttribute("aria-invalid","true");document.getElementById("fname").focus();return;}
  const cat = document.getElementById("fcat").value;
  const product = {
    ...(editingId !== null ? products.find(p => String(p.id) === String(editingId)) || {} : {}),
    id: editingId ?? Date.now(),
    cat,
    subcategory: cat === "equipment" ? document.getElementById("fsubcategory").value : "",
    brand: document.getElementById("fbrand").value.trim(),
    name,
    gender: cat === "equipment" ? document.getElementById("fgender").value : "",
    size: cat === "equipment" ? document.getElementById("fsize").value.trim() : "",
    article: document.getElementById("farticle").value.trim(),
    price: document.getElementById("fprice").value === "" ? null : Number(document.getElementById("fprice").value),
    status: document.getElementById("fstatus").value,
    compatibility: cat === "equipment" ? "" : document.getElementById("fcompat").value.trim(),
    description: document.getElementById("fdescription").value.trim(),
    measure: cat === "equipment" ? document.getElementById("fmeasure").value.trim() : "",
    images: currentImages,
    isDemo: false,
    createdAt: editingId ? (products.find(p => String(p.id) === String(editingId))?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };
  const wasEditing = editingId !== null;
  const previousProducts = [...products];
  if(wasEditing){
    const index = products.findIndex(p => String(p.id) === String(editingId));
    if(index >= 0) products[index] = product;
  }else{
    products.unshift(product);
  }
  if(!persistProducts()){
    products = previousProducts;
    return;
  }
  resetProductForm(true);
  renderCatalog();
  renderAdminList();
  showToast(wasEditing ? "Карточка обновлена." : "Товар добавлен в каталог.");
}
function editProduct(id){
  if(imageUploadPending){showToast("Дождитесь обработки фотографий.");return;}
  if(productFormDirty && !confirm("Открыть другой товар? Несохранённые изменения формы будут удалены.")) return;
  const product = products.find(p => String(p.id) === String(id));
  if(!product) return;
  editingId = product.id;
  document.getElementById("fcat").value = product.cat || "equipment";
  updateAdminFields();
  document.getElementById("fsubcategory").value = product.subcategory || "jackets";
  document.getElementById("fbrand").value = product.brand || "";
  document.getElementById("fname").value = product.name || "";
  document.getElementById("fgender").value = product.gender || "";
  document.getElementById("fsize").value = product.size || "";
  document.getElementById("farticle").value = product.article || "";
  document.getElementById("fprice").value = product.price ?? "";
  document.getElementById("fstatus").value = product.status || "Под заказ";
  document.getElementById("fcompat").value = product.compatibility || "";
  document.getElementById("fdescription").value = product.description || product.desc || "";
  document.getElementById("fmeasure").value = product.measure || "";
  currentImages = [...productOriginalImages(product)];
  renderImagePreview();
  document.getElementById("formTitle").textContent = "Редактирование товара";
  document.getElementById("saveProductButton").textContent = "Сохранить изменения";
  productFormDirty = false;
  document.getElementById("fname").focus();
  document.getElementById("fname").scrollIntoView({behavior:"instant",block:"center"});
}
function deleteProduct(id){
  const product = products.find(p => String(p.id) === String(id));
  if(!product) return;
  if(!confirm(`Удалить «${product.name}» из каталога?`)) return;
  const previousProducts = [...products];
  products = products.filter(p => String(p.id) !== String(id));
  if(!persistProducts()){
    products = previousProducts;
    return;
  }
  if(String(editingId) === String(id)) resetProductForm(true);
  renderCatalog();
  renderAdminList();
  showToast("Товар удалён.");
}
function renderAdminList(){
  const query = (document.getElementById("adminSearch")?.value || "").trim().toLocaleLowerCase("ru");
  const list = products.filter(p => [p.name,p.brand,p.article,p.compatibility].join(" ").toLocaleLowerCase("ru").includes(query));
  document.getElementById("adminProductCount").textContent = `(${products.length})`;
  document.getElementById("adminList").innerHTML = list.length ? list.map(p => {
    const image = safeImageSource(productImages(p)[0] || "");
    return `<div class="admin-product">
      <div class="admin-product-thumb">${image ? `<img src="${escapeHtml(image)}" alt="" width="50" height="46">` : "—"}</div>
      <div class="admin-product-main"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.brand || categoryName(p.cat))} · ${escapeHtml(p.isDemo ? "Пример" : p.status || "Статус не указан")} · ${money(p.price)}</span></div>
      <div class="admin-product-actions">
        <button class="mini-button" type="button" title="Редактировать" aria-label="Редактировать ${escapeHtml(p.name)}" onclick="editProduct(${escapeHtml(JSON.stringify(String(p.id)))})"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z M13.5 6.5l4 4"/></svg></button>
        <button class="mini-button" type="button" title="Удалить" aria-label="Удалить ${escapeHtml(p.name)}" onclick="deleteProduct(${escapeHtml(JSON.stringify(String(p.id)))})"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg></button>
      </div>
    </div>`;
  }).join("") : `<div class="empty-state"><h3>${products.length ? "Товары не найдены" : "Товаров пока нет"}</h3><p>${products.length ? "Попробуйте изменить поисковый запрос." : "Добавьте первый товар в форме."}</p><button class="button button-secondary" type="button" onclick="${products.length ? "clearAdminSearch()" : "focusProductForm()"}">${products.length ? "Сбросить поиск" : "Добавить товар"}</button></div>`;
}
function parseProductText(){
  const text = document.getElementById("aiText").value.trim();
  if(!text){showToast("Вставь текст объявления.");return;}
  const lower = text.toLocaleLowerCase("ru");
  const brand = /dainese/i.test(text) ? "Dainese" :
    /alpinestars|a[\s-]*star/i.test(text) ? "Alpinestars" :
    /bmw/i.test(text) ? "BMW Motorrad" :
    /rizoma/i.test(text) ? "Rizoma" :
    /akrapovic|акрап/i.test(text) ? "Akrapovič" :
    /ohlins|öhlins/i.test(text) ? "Öhlins" :
    /honda/i.test(text) ? "Honda Genuine" : "";
  if(brand) document.getElementById("fbrand").value = brand;
  const price = text.match(/([\d\s]{3,})\s*(?:₽|руб(?:лей)?)/i);
  if(price) document.getElementById("fprice").value = price[1].replace(/\s/g,"");
  const size = text.match(/(?:размер|size|码)\s*[:№#-]?\s*([0-9]{2}|XS|S|M|L|XL|2XL|3XL)/i);
  if(size) document.getElementById("fsize").value = size[1].toUpperCase();
  document.getElementById("fname").value = text.split(/[\n,;]/)[0].trim().slice(0,120);
  const isHonda = /honda|артикул|запчаст|радиатор|подножк|крышк|рычаг/i.test(lower);
  const isTuning = /rizoma|akrap|ohlins|карбон|выхлоп|тюнинг|демпфер/i.test(lower);
  const cat = isTuning ? "tuning" : isHonda ? "honda" : "equipment";
  document.getElementById("fcat").value = cat;
  updateAdminFields();
  if(cat === "equipment"){
    const sub = /штаны|брюк|pants/i.test(lower) ? "pants" :
      /комбинез|комбез|suit/i.test(lower) ? "suits" :
      /ботин|мотобот|boots/i.test(lower) ? "boots" :
      /перчат|glove/i.test(lower) ? "gloves" :
      /шлем|helmet/i.test(lower) ? "helmets" :
      /защит|черепах|спин/i.test(lower) ? "protection" :
      /термо|базов/i.test(lower) ? "base" :
      /дождев/i.test(lower) ? "rain" :
      /сумк|рюкзак/i.test(lower) ? "bags" : "jackets";
    document.getElementById("fsubcategory").value = sub;
    document.getElementById("fgender").value = /жен|lady|woman/i.test(lower) ? "female" : /унисекс|unisex/i.test(lower) ? "unisex" : /муж|men/i.test(lower) ? "male" : "";
  }else{
    document.getElementById("fcompat").value = "";
  }
  productFormDirty = true;
  showToast("Поля заполнены по ключевым словам. Проверь их перед сохранением.");
}
function init(){
  products = products.map(normalizeProduct);
  restoreFiltersFromUrl();
  updateAdminFields();
  renderCatalog();
}
window.addEventListener("popstate", () => {restoreFiltersFromUrl();renderCatalog();});
document.addEventListener("keydown",event => {
  if(event.key === "Escape"){
    closeProductDetail();
    closeAdmin();
    toggleMobileNav(false);
  }
});
init();

function focusProductForm(){document.getElementById("fname").focus();}
function clearAdminSearch(){document.getElementById("adminSearch").value = "";renderAdminList();document.getElementById("adminSearch").focus();}
document.getElementById("productForm").addEventListener("input", () => {productFormDirty = true;});
document.getElementById("productForm").addEventListener("change", () => {productFormDirty = true;});
document.getElementById("fname").addEventListener("input", () => {if(document.getElementById("fname").value.trim()){document.getElementById("fnameError").hidden = true;document.getElementById("fname").removeAttribute("aria-invalid");}});
window.addEventListener("beforeunload", event => {if(productFormDirty || imageUploadPending){event.preventDefault();event.returnValue = "";}});
