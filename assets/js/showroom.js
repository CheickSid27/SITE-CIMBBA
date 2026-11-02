/**
 * CIMBBA Showroom — catalogue filtrable (animé avec GSAP Flip) et panier de demande de devis.
 * Pour ajouter un produit : compléter PRODUCTS (id unique, cat = clé de CATEGORIES).
 * Le devis part soit par WhatsApp, soit par e-mail via Web3Forms.
 */
(function () {
  "use strict";

  var WHATSAPP = "2250708983813";
  var STORAGE_KEY = "cimbba-devis";
  var gsap = window.gsap;
  var Flip = window.Flip;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CATEGORIES = {
    materiel: "Matériel médical",
    hospitalier: "Équipements hospitaliers",
    mobilite: "Aides à la mobilité",
    mobilier: "Mobilier médical",
    consommables: "Consommables & accessoires"
  };

  var PRODUCTS = [
    { id: "tensio-elec", cat: "materiel", name: "Tensiomètre électronique au bras", desc: "Mesure automatique, grand écran, mémoire des mesures. Idéal pour le suivi à domicile.", img: "assets/img/stock/bp1.jpg", badge: "Populaire" },
    { id: "tensio-manuel", cat: "materiel", name: "Tensiomètre manopoire + stéthoscope", desc: "Kit de prise de tension manuel pour professionnels de santé et étudiants.", img: "assets/img/stock/bp3.jpg" },
    { id: "stetho", cat: "materiel", name: "Stéthoscope double pavillon", desc: "Acoustique précise, tubulure souple, adapté adulte et pédiatrie.", img: "assets/img/stock/steth2.jpg" },
    { id: "oxymetre", cat: "materiel", name: "Oxymètre de pouls", desc: "Saturation en oxygène et fréquence cardiaque en quelques secondes.", img: "assets/img/stock/oxi.jpg", badge: "Nouveau", green: true },
    { id: "diag-mural", cat: "materiel", name: "Ensemble de diagnostic mural", desc: "Otoscope et ophtalmoscope muraux pour cabinets de consultation.", img: "assets/img/stock/wall.jpg" },
    { id: "kit-diag", cat: "materiel", name: "Kit diagnostic de base", desc: "Stéthoscope, thermomètre et accessoires essentiels réunis.", img: "assets/img/stock/kit.jpg" },

    { id: "moniteur", cat: "hospitalier", name: "Moniteur multiparamétrique", desc: "Surveillance ECG, SpO2, tension et température en continu.", img: "assets/img/stock/monitor.jpg", badge: "Pro" },
    { id: "echographe", cat: "hospitalier", name: "Échographe sur chariot", desc: "Pour cabinets et cliniques : sondes multiples, installation et formation incluses.", img: "assets/img/stock/echo2.jpg", badge: "Pro" },
    { id: "perfusion", cat: "hospitalier", name: "Pied à perfusion inox", desc: "Hauteur réglable, base 5 roulettes, 2 ou 4 crochets.", img: "assets/img/stock/iv.jpg" },

    { id: "fauteuil-pliant", cat: "mobilite", name: "Fauteuil roulant pliant", desc: "Léger et robuste, repose-pieds amovibles, se range facilement.", img: "assets/img/stock/wc1.jpg", badge: "Populaire" },
    { id: "fauteuil-standard", cat: "mobilite", name: "Fauteuil roulant standard", desc: "Châssis acier, accoudoirs fixes, pour un usage quotidien.", img: "assets/img/stock/wc2.jpg" },

    { id: "lit-elec", cat: "mobilier", name: "Lit médicalisé électrique", desc: "Relève-buste et relève-jambes motorisés, barrières latérales.", img: "assets/img/stock/bed3.jpg" },
    { id: "lit-manivelle", cat: "mobilier", name: "Lit d'hospitalisation à manivelle", desc: "Réglages manuels fiables, matelas et roulettes à frein.", img: "assets/img/stock/bed2.jpg" },
    { id: "salle-examen", cat: "mobilier", name: "Équipement de salle d'examen", desc: "Table d'examen, scialytique et mobilier pour cabinets et cliniques.", img: "assets/img/stock/or2.jpg" },

    { id: "gants", cat: "consommables", name: "Gants d'examen nitrile", desc: "Boîtes de 100, sans poudre, tailles S à XL.", img: "assets/img/stock/gloves.jpg" },
    { id: "injection", cat: "consommables", name: "Seringues & matériel d'injection", desc: "Seringues stériles à usage unique, aiguilles, garrots.", img: "assets/img/stock/supplies.jpg" },
    { id: "pansements", cat: "consommables", name: "Compresses & pansements stériles", desc: "Compresses, bandes, sparadraps pour soins et cabinets.", img: "assets/img/stock/tray.jpg" },
    { id: "trousse", cat: "consommables", name: "Trousse de premiers secours", desc: "Complète, pour entreprises, écoles, véhicules et domicile.", img: "assets/img/stock/firstaid.jpg" }
  ];

  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  /* ---------- État du devis (persisté localement) ---------- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach(function (id) { if (!byId[id]) delete cart[id]; });
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {} }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Catalogue : toutes les cartes sont rendues une fois, puis filtrées ---------- */
  var grid = document.getElementById("products");
  var chipsWrap = document.getElementById("chips");
  var search = document.getElementById("search");
  var currentCat = "all";

  grid.innerHTML = PRODUCTS.map(function (p) {
    return '<article class="product" data-tilt data-id="' + p.id + '" data-cat="' + p.cat + '">' +
      '<div class="product__img"><img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy">' +
      (p.badge ? '<span class="product__badge' + (p.green ? " product__badge--green" : "") + '">' + esc(p.badge) + "</span>" : "") +
      "</div>" +
      '<div class="product__body">' +
      '<span class="product__cat">' + esc(CATEGORIES[p.cat]) + "</span>" +
      "<h3>" + esc(p.name) + "</h3>" +
      "<p>" + esc(p.desc) + "</p>" +
      '<div class="product__foot">' +
      '<span class="product__price">Prix sur devis</span>' +
      '<button class="add" type="button" data-add="' + p.id + '"></button>' +
      "</div></div></article>";
  }).join("") + '<div class="empty" hidden>Aucun produit ne correspond à votre recherche.<br>Contactez-nous : nous pouvons sûrement le commander pour vous.</div>';

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".product"));
  var empty = grid.querySelector(".empty");
  if (window.CIMBBA && window.CIMBBA.tilt) window.CIMBBA.tilt(grid);

  function renderButtons() {
    grid.querySelectorAll("[data-add]").forEach(function (b) {
      var inCart = !!cart[b.getAttribute("data-add")];
      b.classList.toggle("is-added", inCart);
      b.innerHTML = inCart ? "✓ Ajouté" : '<svg><use href="#i-plus"/></svg> Devis';
    });
  }

  function renderChips() {
    var counts = { all: PRODUCTS.length };
    PRODUCTS.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
    chipsWrap.innerHTML = ["all"].concat(Object.keys(CATEGORIES)).map(function (k) {
      var label = k === "all" ? "Tout" : CATEGORIES[k];
      return '<button class="chip" type="button" data-cat="' + k + '" aria-pressed="' + (k === currentCat) + '">' + esc(label) + " <em>" + counts[k] + "</em></button>";
    }).join("");
  }

  function matches(card) {
    var p = byId[card.getAttribute("data-id")];
    if (currentCat !== "all" && p.cat !== currentCat) return false;
    var q = (search.value || "").trim().toLowerCase();
    return !q || (p.name + " " + p.desc + " " + CATEGORIES[p.cat]).toLowerCase().indexOf(q) !== -1;
  }

  function applyFilter(animate) {
    var state = animate && Flip && gsap && !reduce ? Flip.getState(cards) : null;
    var shown = 0;
    cards.forEach(function (c) {
      var ok = matches(c);
      c.style.display = ok ? "" : "none";
      if (ok) shown++;
    });
    empty.hidden = shown > 0;
    if (state) {
      Flip.from(state, {
        duration: 0.8, ease: "expo.inOut", scale: true, absolute: true, nested: true,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.2 }); },
        onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }); },
        onComplete: function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
      });
    } else if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }

  function selectCategory(cat) {
    currentCat = cat;
    renderChips();
    applyFilter(true);
    document.querySelectorAll(".aisle").forEach(function (a) {
      a.classList.toggle("is-on", a.getAttribute("data-goto-cat") === cat);
    });
  }

  chipsWrap.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (chip) selectCategory(chip.getAttribute("data-cat"));
  });

  // Les rayons et les liens du pied de page filtrent le catalogue
  document.querySelectorAll("[data-goto-cat]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var target = document.getElementById("catalogue");
      var lenis = window.CIMBBA && window.CIMBBA.lenis;
      if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth" });
      setTimeout(function () { selectCategory(el.getAttribute("data-goto-cat")); }, lenis ? 700 : 0);
    });
  });

  var searchTimer;
  search.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { applyFilter(true); }, 160);
  });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add]");
    if (!btn) return;
    var id = btn.getAttribute("data-add");
    cart[id] = (cart[id] || 0) + 1;
    save();
    renderButtons();
    renderCart();
    flyToCart(btn.closest(".product").querySelector("img"));
  });

  // Petite vignette qui « vole » de la carte jusqu'au bouton devis
  function flyToCart(img) {
    if (!gsap || reduce || !img) return;
    var from = img.getBoundingClientRect();
    var to = fab.getBoundingClientRect();
    var ghost = img.cloneNode();
    ghost.style.cssText = "position:fixed;z-index:120;pointer-events:none;object-fit:cover;border-radius:14px;left:" + from.left + "px;top:" + from.top + "px;width:" + from.width + "px;height:" + from.height + "px";
    document.body.appendChild(ghost);
    gsap.to(ghost, {
      left: to.left + to.width - 40, top: to.top + 8, width: 40, height: 40, borderRadius: 40, opacity: 0.4,
      duration: 0.9, ease: "power3.inOut",
      onComplete: function () { ghost.remove(); gsap.fromTo(fab, { scale: 1.15 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, .4)" }); }
    });
  }

  /* ---------- Tiroir devis ---------- */
  var root = document.documentElement;
  var fab = document.getElementById("cart-fab");
  var fabCount = fab.querySelector(".cart-fab__n");
  var body = document.getElementById("drawer-body");
  var form = document.getElementById("devis-form");

  function openDrawer() {
    root.classList.remove("menu-open");
    root.classList.add("drawer-open");
    var lenis = window.CIMBBA && window.CIMBBA.lenis;
    if (lenis) lenis.stop();
    if (gsap && !reduce) gsap.fromTo(body.children, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.05, delay: 0.25 });
  }
  function closeDrawer() {
    root.classList.remove("drawer-open");
    var lenis = window.CIMBBA && window.CIMBBA.lenis;
    if (lenis) lenis.start();
  }
  fab.addEventListener("click", openDrawer);
  document.querySelectorAll("[data-open-devis]").forEach(function (el) { el.addEventListener("click", openDrawer); });
  document.querySelectorAll("[data-close-drawer]").forEach(function (el) { el.addEventListener("click", closeDrawer); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  function totalItems() {
    return Object.keys(cart).reduce(function (n, id) { return n + cart[id]; }, 0);
  }

  function renderCart() {
    var ids = Object.keys(cart);
    fabCount.textContent = totalItems();
    if (!ids.length) {
      body.innerHTML = '<div class="drawer__empty">Votre demande de devis est vide.<br>Ajoutez des produits depuis le catalogue, ou décrivez directement votre besoin ci-dessous.</div>';
      return;
    }
    body.innerHTML = ids.map(function (id) {
      var p = byId[id];
      return '<div class="line"><img src="' + p.img + '" alt="">' +
        "<div><h4>" + esc(p.name) + "</h4><small>" + esc(CATEGORIES[p.cat]) + '</small><br><button class="line__rm" type="button" data-rm="' + id + '">Retirer</button></div>' +
        '<div class="qty"><button type="button" data-dec="' + id + '" aria-label="Diminuer">−</button><span>' + cart[id] + '</span><button type="button" data-inc="' + id + '" aria-label="Augmenter">+</button></div></div>';
    }).join("");
  }

  body.addEventListener("click", function (e) {
    var t = e.target;
    var id = t.getAttribute("data-inc") || t.getAttribute("data-dec") || t.getAttribute("data-rm");
    if (!id) return;
    if (t.hasAttribute("data-inc")) cart[id]++;
    else if (t.hasAttribute("data-dec")) cart[id]--;
    else cart[id] = 0;
    if (cart[id] <= 0) delete cart[id];
    save();
    renderCart();
    renderButtons();
  });

  function summary() {
    var ids = Object.keys(cart);
    if (!ids.length) return "(aucun produit sélectionné)";
    return ids.map(function (id) { return "- " + byId[id].name + " x " + cart[id]; }).join("\n");
  }

  // Envoi par WhatsApp : message pré-rempli, aucun champ obligatoire
  document.getElementById("devis-wa").addEventListener("click", function () {
    var fd = new FormData(form);
    var lines = ["Bonjour CIMBBA, je souhaite un devis pour :", summary()];
    if (fd.get("name")) lines.push("", "Nom : " + fd.get("name"));
    if (fd.get("profile")) lines.push("Profil : " + fd.get("profile"));
    if (fd.get("message")) lines.push("Précisions : " + fd.get("message"));
    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  });

  // Envoi par e-mail via Web3Forms
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    window.CIMBBA.submitForm(form, { produits: summary() }).then(function () {
      cart = {};
      save();
      renderCart();
      renderButtons();
    }).catch(function () {});
  });

  renderChips();
  renderButtons();
  applyFilter(false);
  renderCart();
})();
