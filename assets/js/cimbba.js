/**
 * CIMBBA — moteur d'interactions et d'animations (GSAP + ScrollTrigger + Lenis)
 *
 * Chaque effet s'active par un attribut dans le HTML :
 *   data-split        titre découpé en mots qui montent (data-split="hero" : géré par l'intro)
 *   data-fade         apparition en fondu vers le haut (data-delay="1..6")
 *   data-reveal       image dévoilée par le bas
 *   data-parallax     image en parallaxe (valeur = amplitude en %)
 *   data-count        compteur animé (data-suffix, data-prefix)
 *   data-magnetic     bouton attiré par la souris
 *   data-tilt         carte inclinée en 3D au survol
 *   data-lightbox     ouvre l'image en plein écran
 *   data-web3         formulaire envoyé via Web3Forms
 * Sans GSAP ou avec « réduire les animations », tout reste visible et utilisable.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var motion = !!(gsap && ST) && !reduce;
  var SEEN = "cimbba-seen";
  var PT = "cimbba-pt";

  window.CIMBBA = window.CIMBBA || {};
  window.__cimbbaReady = true;

  if (!motion) {
    root.classList.remove("motion", "pt-in");
    root.classList.add("no-loader");
  } else {
    gsap.registerPlugin(ST);
    if (window.Flip) gsap.registerPlugin(window.Flip);
  }

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function store(fn) { try { return fn(); } catch (e) { return null; } }

  /* ======================================================================
     Scroll fluide (Lenis) synchronisé avec ScrollTrigger
     ====================================================================== */
  var lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  window.CIMBBA.lenis = lenis;

  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollToEl(el);
  });

  /* ======================================================================
     En-tête : pilule flottante au défilement, masqué en descendant
     ====================================================================== */
  var hdr = $(".hdr");
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (hdr) {
      hdr.classList.toggle("is-scrolled", y > 60);
      if (!root.classList.contains("menu-open")) hdr.classList.toggle("is-hidden", y > 700 && y > lastY + 2);
      if (y < lastY - 2) hdr.classList.remove("is-hidden");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ======================================================================
     Menu plein écran
     ====================================================================== */
  var burger = $(".burger");
  function closeMenu() {
    if (!root.classList.contains("menu-open")) return;
    root.classList.remove("menu-open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  if (burger) {
    burger.addEventListener("click", function () {
      var open = !root.classList.contains("menu-open");
      root.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (hdr) hdr.classList.remove("is-hidden");
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open && motion) {
        gsap.fromTo($$(".menu__a, .menu__foot > *"), { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.06, delay: 0.25 });
      }
    });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ======================================================================
     Découpage du texte en mots
     ====================================================================== */
  function splitWords(el, cls) {
    cls = cls || "w";
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var outer = document.createElement("span");
            outer.className = cls;
            if (cls === "w") {
              var inner = document.createElement("span");
              inner.className = "wi";
              inner.textContent = p;
              outer.appendChild(inner);
            } else {
              outer.textContent = p;
            }
            frag.appendChild(outer);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add("is-split");
    return el.querySelectorAll(cls === "w" ? ".wi" : "." + cls);
  }

  function countUp(el, extra) {
    var end = +el.getAttribute("data-count");
    var pre = el.getAttribute("data-prefix") || "";
    var suf = el.getAttribute("data-suffix") || "";
    var o = { v: 0 };
    el.textContent = pre + "0" + suf;
    return gsap.to(o, Object.assign({
      v: end, duration: 2.2, ease: "expo.out",
      onUpdate: function () { el.textContent = pre + Math.round(o.v) + suf; }
    }, extra || {}));
  }

  /* ======================================================================
     Préchargeur + transitions de page
     ====================================================================== */
  var loader = $(".loader");
  var pt = $(".pt");

  function startIntro() {
    root.classList.add("is-ready");
    if (lenis) lenis.start();
    intro();
    setTimeout(function () { if (ST) ST.refresh(); }, 50);
  }

  // Première visite : le logo, une fine barre qui se remplit, puis un fondu
  function runLoader() {
    if (lenis) lenis.stop();
    gsap.timeline({ onComplete: function () { loader.remove(); store(function () { sessionStorage.setItem(SEEN, "1"); }); } })
      .to($(".loader__bar i", loader), { scaleX: 1, duration: 0.9, ease: "power2.inOut" })
      .to(loader, { opacity: 0, duration: 0.5, ease: "power2.out" })
      .add(startIntro, "-=0.35");
  }

  // Changement de page : simple fondu au blanc
  function pageIn() {
    store(function () { sessionStorage.removeItem(PT); });
    gsap.to(pt, {
      opacity: 0, duration: 0.5, ease: "power2.out", delay: 0.05,
      onComplete: function () { root.classList.remove("pt-in"); gsap.set(pt, { clearProps: "opacity" }); }
    });
    startIntro();
  }

  function pageOut(href) {
    store(function () { sessionStorage.setItem(PT, "1"); });
    if (lenis) lenis.stop();
    gsap.to(pt, { opacity: 1, duration: 0.35, ease: "power2.out", onComplete: function () { window.location.href = href; } });
  }

  if (motion && pt) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.hasAttribute("download")) return;
      var url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // ancres internes gérées plus haut
      e.preventDefault();
      closeMenu();
      pageOut(url.href);
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { gsap.set(pt, { opacity: 0 }); if (lenis) lenis.start(); }
    });
  }

  /* ======================================================================
     Intro de la page (après préchargeur / transition)
     ====================================================================== */
  function intro() {
    if (!motion) return;
    var heroCard = $(".hero__card, .phero__card");
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    if (heroCard) {
      var bg = $(".hero__img img, .phero__bg img", heroCard);
      if (bg) tl.fromTo(bg, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0);
    }
    $$('[data-split="hero"]').forEach(function (h) {
      tl.fromTo(splitWords(h), { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.05 }, 0.15);
    });
    var intros = $$("[data-intro]");
    if (intros.length) tl.to(intros, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07 }, 0.4);
    $$(".hero [data-count], .phero [data-count]").forEach(function (el) { tl.add(countUp(el), 0.8); });
    if ($(".hero__card")) heroSweep(tl, 0.8);
  }

  /* ======================================================================
     Hero : loupe rayons X + balayage
     ====================================================================== */
  var xray = $(".hero__xray");
  var heroCard = $(".hero__card");
  var lens = $(".lens");
  var scanline = $(".hero__scanline");

  function setBand(top, h) {
    xray.style.clipPath = "inset(" + top + "% 0% " + Math.max(0, 100 - top - h) + "% 0%)";
  }

  function heroSweep(tl, at) {
    if (!xray || !scanline) return;
    var p = { t: -16 };
    tl.set(scanline, { opacity: 1, top: "0%" }, at)
      .to(p, {
        t: 102, duration: 2.4, ease: "power2.inOut",
        onUpdate: function () { setBand(p.t, 16); scanline.style.top = Math.min(100, Math.max(0, p.t + 16)) + "%"; },
        onComplete: function () { xray.style.clipPath = "circle(0px at 50% 50%)"; gsap.to(scanline, { opacity: 0, duration: 0.4 }); }
      }, at);
  }

  if (motion && xray && heroCard) {
    if (finePointer) {
      var pos = { x: 0, y: 0, r: 0 };
      var target = { x: 0, y: 0, r: 0 };
      var readX = $(".lens__x"), readY = $(".lens__y"), readK = $(".lens__k");
      var active = false;
      heroCard.addEventListener("pointermove", function (e) {
        var b = heroCard.getBoundingClientRect();
        target.x = e.clientX - b.left;
        target.y = e.clientY - b.top;
        var overUi = e.target.closest("a, button, .stats, .team-chip");
        target.r = overUi ? 0 : 130;
        if (!active) { pos.x = target.x; pos.y = target.y; active = true; }
        lens.classList.toggle("is-on", !overUi);
      });
      heroCard.addEventListener("pointerleave", function () { target.r = 0; lens.classList.remove("is-on"); });
      gsap.ticker.add(function () {
        if (!active) return;
        pos.x += (target.x - pos.x) * 0.16;
        pos.y += (target.y - pos.y) * 0.16;
        pos.r += (target.r - pos.r) * 0.14;
        if (pos.r < 0.5 && target.r === 0) { if (!xray.style.clipPath.startsWith("inset")) xray.style.clipPath = "circle(0px at 50% 50%)"; return; }
        xray.style.clipPath = "circle(" + pos.r.toFixed(1) + "px at " + pos.x.toFixed(1) + "px " + pos.y.toFixed(1) + "px)";
        lens.style.transform = "translate(" + pos.x + "px," + pos.y + "px) scale(" + (pos.r / 130) + ")";
        if (readX) {
          readX.textContent = String(Math.round(pos.x)).padStart(4, "0");
          readY.textContent = String(Math.round(pos.y)).padStart(4, "0");
          readK.textContent = 60 + Math.round((pos.y / heroCard.offsetHeight) * 30);
        }
      });
    } else {
      // Écrans tactiles : balayage automatique régulier
      var auto = gsap.timeline({ repeat: -1, repeatDelay: 3.5, delay: 4 });
      heroSweep(auto, 0);
    }
  }

  /* ======================================================================
     Apparitions au défilement
     ====================================================================== */
  if (motion) {
    $$("[data-split]:not([data-split=hero])").forEach(function (el) {
      var words = splitWords(el);
      gsap.fromTo(words, { yPercent: 115 }, {
        yPercent: 0, duration: 1.25, ease: "expo.out", stagger: 0.035,
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });

    $$("[data-fade]").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.2, ease: "expo.out", delay: (+el.getAttribute("data-delay") || 0) * 0.08,
        scrollTrigger: { trigger: el, start: "top 90%" }
      });
    });

    $$("[data-reveal]").forEach(function (el) {
      var img = el.querySelector("img");
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 86%" } });
      tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
      if (img && !el.hasAttribute("data-parallax")) tl.from(img, { scale: 1.4, duration: 2, ease: "expo.out" }, 0.2);
    });

    $$("[data-parallax]").forEach(function (el) {
      var amt = +el.getAttribute("data-parallax") || 10;
      var img = el.querySelector("img") || el;
      gsap.fromTo(img, { yPercent: -amt, scale: 1 + amt / 45 }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    $$("[data-count]").forEach(function (el) {
      // Les compteurs du hero démarrent avec l'intro, pas au chargement
      if (el.closest(".hero, .phero")) return;
      countUp(el, { scrollTrigger: { trigger: el, start: "top 92%" } });
    });
  }

  /* ======================================================================
     Bandeau défilant réactif à la vitesse de scroll
     ====================================================================== */
  $$(".marquee").forEach(function (m) {
    var track = $(".marquee__track", m);
    if (!track || !motion) return;
    track.innerHTML += track.innerHTML;
    var x = 0, vel = 0, dir = -1;
    var skew = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3" });
    ST.create({
      trigger: m, start: "top bottom", end: "bottom top",
      onUpdate: function (self) { vel = self.getVelocity(); dir = self.direction === 1 ? -1 : 1; }
    });
    gsap.ticker.add(function () {
      var half = track.scrollWidth / 2;
      x += dir * (1.1 + Math.min(Math.abs(vel) / 160, 14));
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      gsap.set(track, { x: x });
      skew(Math.max(-10, Math.min(10, vel / -260)));
      vel *= 0.92;
    });
  });

  /* ======================================================================
     Manifeste : les mots s'allument au fil du défilement
     ====================================================================== */
  $$(".manifesto [data-words]").forEach(function (p) {
    var words = splitWords(p, "mw");
    if (!motion) { $$(".mw", p).forEach(function (w) { w.style.opacity = 1; }); return; }
    gsap.to(words, {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: p, start: "top 78%", end: "bottom 42%", scrub: 0.6 }
    });
  });

  /* ======================================================================
     Services : défilement horizontal épinglé (ordinateur)
     ====================================================================== */
  var mm = motion ? gsap.matchMedia() : null;
  if (mm) {
    mm.add("(min-width: 961px)", function () {
      var hs = $(".hs");
      if (!hs) return;
      var track = $(".hs__track", hs);
      var bar = $(".hs__bar i", hs);
      var num = $(".hs__num", hs);
      var cards = $$(".svc:not(.svc--intro)", hs);
      var dist = function () { return track.scrollWidth - window.innerWidth; };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: {
          trigger: hs, pin: ".hs__pin", start: "top top", end: function () { return "+=" + dist(); },
          scrub: 1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (bar) bar.style.transform = "scaleX(" + self.progress + ")";
            if (num) num.textContent = String(Math.min(cards.length, Math.floor(self.progress * cards.length) + 1)).padStart(2, "0");
          }
        }
      });
      cards.forEach(function (c) {
        var img = $(".film img", c);
        if (!img) return;
        gsap.fromTo(img, { xPercent: -7, scale: 1.18 }, {
          xPercent: 7, ease: "none",
          scrollTrigger: { trigger: c, containerAnimation: tween, start: "left right", end: "right left", scrub: true }
        });
      });
    });

  }

  /* ======================================================================
     Galerie zoom : la vue s'enfonce dans l'image centrale
     ====================================================================== */
  var zoom = $(".zoom");
  if (zoom && motion) {
    var center = $(".zoom__item--c", zoom);
    var others = $$(".zoom__item:not(.zoom__item--c)", zoom);
    var ztl = gsap.timeline({ scrollTrigger: { trigger: zoom, start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true } });
    ztl.to(".zoom__intro", { opacity: 0, y: -40, duration: 0.15 }, 0)
      .to(center, {
        scale: function () { return Math.max(window.innerWidth / center.offsetWidth, window.innerHeight / center.offsetHeight) * 1.02; },
        borderRadius: 0, duration: 0.6, ease: "power2.inOut"
      }, 0);
    others.forEach(function (o) {
      ztl.to(o, {
        x: function () { var b = o.getBoundingClientRect(); return (b.left + b.width / 2 - window.innerWidth / 2) * 1.8; },
        y: function () { var b = o.getBoundingClientRect(); return (b.top + b.height / 2 - window.innerHeight / 2) * 1.8; },
        scale: 2.2, opacity: 0, duration: 0.6, ease: "power2.in"
      }, 0);
    });
    ztl.to(center, { "--shade": 1, duration: 0.2 }, 0.55)
      .to(".zoom__title", { opacity: 1, duration: 0.15 }, 0.62)
      .from(".zoom__title .h2", { y: 60, duration: 0.25 }, 0.62)
      .to({}, { duration: 0.2 });
  }

  /* ======================================================================
     Grand mot-signature du pied de page
     ====================================================================== */
  $$(".ftr__word").forEach(function (w) {
    if (!motion) return;
    var letters = w.textContent.split("").map(function (c) { return "<span>" + c + "</span>"; }).join("");
    w.innerHTML = letters;
    gsap.from(w.children, {
      yPercent: 100, opacity: 0, duration: 1.4, ease: "expo.out", stagger: 0.06,
      scrollTrigger: { trigger: w, start: "top 95%" }
    });
  });

  /* ======================================================================
     Cartes en éventail (showroom) — se déploient au défilement
     ====================================================================== */
  $$(".fan").forEach(function (f) {
    if (!motion) return;
    var cards = $$(".fan__card", f);
    gsap.from(cards, {
      x: function (i) { return (1 - i) * 140; }, y: 120, rotate: 0, opacity: 0,
      duration: 1.6, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: f, start: "top 80%" }
    });
    if (finePointer) {
      f.addEventListener("pointermove", function (e) {
        var b = f.getBoundingClientRect();
        var px = (e.clientX - b.left) / b.width - 0.5;
        var py = (e.clientY - b.top) / b.height - 0.5;
        cards.forEach(function (c, i) {
          gsap.to(c, { rotateY: px * 18, rotateX: -py * 14, x: px * (20 + i * 18), y: py * (16 + i * 10), duration: 0.8, ease: "power3" });
        });
      });
      f.addEventListener("pointerleave", function () { gsap.to(cards, { rotateY: 0, rotateX: 0, x: 0, y: 0, duration: 1.2, ease: "elastic.out(1, .5)" }); });
    }
  });

  /* ======================================================================
     Boutons aimantés + inclinaison 3D
     ====================================================================== */
  if (motion && finePointer) {
    $$("[data-magnetic]").forEach(function (el) {
      var mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      var my = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      el.addEventListener("pointermove", function (e) {
        var b = el.getBoundingClientRect();
        mx((e.clientX - b.left - b.width / 2) * 0.3);
        my((e.clientY - b.top - b.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", function () {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, .4)" });
      });
    });
  }

  window.CIMBBA.tilt = function (scope) {
    if (!motion || !finePointer) return;
    $$("[data-tilt]", scope).forEach(function (el) {
      if (el._tilt) return;
      el._tilt = true;
      el.addEventListener("pointermove", function (e) {
        var b = el.getBoundingClientRect();
        var px = (e.clientX - b.left) / b.width - 0.5;
        var py = (e.clientY - b.top) / b.height - 0.5;
        gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: 0.6, ease: "power3" });
      });
      el.addEventListener("pointerleave", function () { gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1, ease: "elastic.out(1, .5)" }); });
    });
  };
  window.CIMBBA.tilt(document);

  /* ======================================================================
     Lien actif dans la navigation
     ====================================================================== */
  var navLinks = $$('.nav__a[href^="#"]');
  if (navLinks.length && ST && gsap) {
    navLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (!sec) return;
      ST.create({
        trigger: sec, start: "top 50%", end: "bottom 50%",
        onToggle: function (self) { if (self.isActive) { navLinks.forEach(function (l) { l.classList.remove("is-on"); }); a.classList.add("is-on"); } }
      });
    });
  }

  /* ======================================================================
     FAQ (accordéon)
     ====================================================================== */
  $$(".faq__item").forEach(function (item) {
    var q = $(".faq__q", item), a = $(".faq__a", item);
    var setOpen = function (open) {
      item.classList.toggle("is-open", open);
      q.setAttribute("aria-expanded", open ? "true" : "false");
      if (gsap) gsap.to(a, { height: open ? "auto" : 0, duration: 0.8, ease: "expo.out", onComplete: function () { if (ST) ST.refresh(); } });
      else a.style.height = open ? "auto" : "0";
    };
    if (item.classList.contains("is-open")) a.style.height = "auto";
    q.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      $$(".faq__item.is-open").forEach(function (o) { if (o !== item) { o.classList.remove("is-open"); $(".faq__q", o).setAttribute("aria-expanded", "false"); if (gsap) gsap.to($(".faq__a", o), { height: 0, duration: 0.6, ease: "expo.out" }); else $(".faq__a", o).style.height = "0"; } });
      setOpen(open);
    });
  });

  /* ======================================================================
     Image en plein écran
     ====================================================================== */
  var lb = $(".lb");
  if (lb) {
    var lbImg = $("img", lb), lbCap = $(".lb__cap", lb);
    $$("[data-lightbox]").forEach(function (el) {
      el.addEventListener("click", function () {
        lbImg.src = el.getAttribute("data-lightbox");
        lbImg.alt = el.getAttribute("data-caption") || "";
        lbCap.textContent = el.getAttribute("data-caption") || "";
        lb.classList.add("is-open");
        if (lenis) lenis.stop();
        if (gsap) gsap.fromTo(lbImg, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" });
      });
    });
    var closeLb = function () { lb.classList.remove("is-open"); if (lenis) lenis.start(); };
    lb.addEventListener("click", function (e) { if (e.target !== lbImg) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
  }

  /* ======================================================================
     Formulaires (Web3Forms)
     ====================================================================== */
  function setStatus(form, type, msg) {
    var s = form.querySelector(".status");
    if (!s) return;
    s.className = "status" + (type ? " is-" + type : "");
    s.textContent = msg || "";
  }

  // Renvoie une promesse ; réutilisé par le showroom pour le devis.
  window.CIMBBA.submitForm = function (form, extra) {
    var data = new FormData(form);
    if (extra) Object.keys(extra).forEach(function (k) { data.set(k, extra[k]); });
    setStatus(form, "loading", "Envoi en cours…");
    return fetch(form.getAttribute("action"), { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!(res.ok && res.data.success)) throw new Error(res.data.message || "L'envoi a échoué. Veuillez réessayer.");
        setStatus(form, "success", form.getAttribute("data-success") || "Merci ! Votre demande a bien été envoyée.");
        form.reset();
      })
      .catch(function (err) {
        setStatus(form, "error", (err && err.message) || "L'envoi a échoué. Appelez-nous au 07 08 98 38 13.");
        throw err;
      });
  };

  $$("form[data-web3]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      window.CIMBBA.submitForm(form).catch(function () {});
    });
  });

  var dateInput = $('input[type="date"][data-min-today]');
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ======================================================================
     Démarrage
     ====================================================================== */
  if (!motion) {
    if (loader) loader.remove();
    return;
  }
  var seen = store(function () { return sessionStorage.getItem(SEEN); });
  var fromPage = root.classList.contains("pt-in");
  if (loader && !seen && !fromPage) {
    runLoader();
  } else {
    if (loader) loader.remove();
    store(function () { sessionStorage.setItem(SEEN, "1"); });
    if (fromPage && pt) pageIn(); else startIntro();
  }
  window.addEventListener("load", function () { ST.refresh(); });
})();
