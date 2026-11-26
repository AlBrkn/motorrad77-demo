"use strict";
function toggleMobileNav(force){
  const nav = document.getElementById("mobileNav");
  const button = document.querySelector(".mobile-menu-button");
  const open = force === undefined ? !nav.classList.contains("open") : force;
  const wasOpen = nav.classList.contains("open");
  nav.classList.toggle("open",open);
  button.setAttribute("aria-expanded",String(open));
  button.setAttribute("aria-label",open ? "Закрыть меню" : "Открыть меню");
  if(open !== wasOpen){
    document.querySelectorAll("body > main, body > footer").forEach(el => el.inert = open);
    document.body.style.overflow = open || document.querySelector(".overlay.open") ? "hidden" : "";
    if(open) nav.querySelector("a")?.focus();
    else if(nav.contains(document.activeElement)) button.focus();
  }
}

window.addEventListener("resize", () => {if(matchMedia("(min-width:1101px)").matches) toggleMobileNav(false);});
document.addEventListener("keydown",event => {if(event.key === "Escape") toggleMobileNav(false);});

// Reusable modal lifecycle: keyboard focus, focus return and scroll locking.
const dialogTriggers = new Map();
function openDialog(id, trigger = document.activeElement){
  const dialog = document.getElementById(id);
  dialogTriggers.set(id, trigger);
  dialog.classList.add("open");
  document.body.style.overflow = "hidden";
  document.querySelectorAll("body > header, body > main, body > footer").forEach(el => el.inert = true);
  dialog.querySelector("button, input, a[href]")?.focus();
}
function closeDialog(id){
  const dialog = document.getElementById(id);
  if(!dialog?.classList.contains("open")) return;
  dialog.classList.remove("open");
  document.body.style.overflow = document.querySelector(".overlay.open") ? "hidden" : "";
  if(!document.querySelector(".overlay.open")) document.querySelectorAll("body > header, body > main, body > footer").forEach(el => el.inert = false);
  const trigger = dialogTriggers.get(id);
  if(trigger?.isConnected && trigger.getClientRects().length) trigger.focus();
  else {const fallback = [...document.querySelectorAll(".mobile-menu-button,.header-admin")].find(el => el.getClientRects().length);fallback?.focus();}
  dialogTriggers.delete(id);
}
document.addEventListener("keydown", event => {
  if(event.key !== "Tab") return;
  const menu = document.querySelector(".mobile-nav.open");
  if(menu){
    const toggle = document.querySelector(".mobile-menu-button");
    const items = [toggle,...menu.querySelectorAll("a[href],button")];
    if(event.shiftKey && document.activeElement === items[0]){event.preventDefault();items.at(-1)?.focus();}
    if(!event.shiftKey && document.activeElement === items.at(-1)){event.preventDefault();toggle.focus();}
    return;
  }
  const dialog = document.querySelector(".overlay.open");
  if(!dialog) return;
  const focusable = [...dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]')]
    .filter(el => !el.disabled && el.getClientRects().length);
  const first = focusable[0], last = focusable.at(-1);
  if(event.shiftKey && document.activeElement === first){event.preventDefault();last?.focus();}
  if(!event.shiftKey && document.activeElement === last){event.preventDefault();first?.focus();}
});
