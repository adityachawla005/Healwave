/* ─────────────────────────────────────────────────────────────────────────────
   HealWave · app.js
   Three.js: holographic brain/neural-network model
   GSAP:     page transitions, hero headline, scroll reveals, list stagger,
             counter numbers, horizontal scan lines, link hover trail
───────────────────────────────────────────────────────────────────────────── */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Hamburger ─────────────────────────────────────────────────────────────── */
const menu   = document.querySelector(".menu-toggle");
const navEl  = document.querySelector(".nav-links");
const header = document.querySelector(".site-header");
if (menu && navEl) menu.addEventListener("click", () => navEl.classList.toggle("open"));

/* ── Page-transition curtain ──────────────────────────────────────────────── */
const curtain = document.createElement("div");
curtain.className = "curtain";
document.body.appendChild(curtain);

document.querySelectorAll("a[href$='.html']").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = link.getAttribute("href");
    if (!href) return;
    e.preventDefault();
    if (window.gsap && !reduced) {
      gsap.to(curtain, { scaleY: 1, duration: 0.55, ease: "power3.inOut",
        onComplete: () => { window.location.href = href; } });
    } else { window.location.href = href; }
  });
});

/* ── Scroll-progress bar ──────────────────────────────────────────────────── */
const bar = document.createElement("div");
bar.id = "progress-bar";
document.body.appendChild(bar);

/* ── Split hero headlines into word spans ─────────────────────────────────── */
function splitLines() {
  document.querySelectorAll(".line").forEach((line) => {
    line.innerHTML = line.textContent.trim()
      .split(" ")
      .map((w) => `<span class="word">${w}&nbsp;</span>`)
      .join("");
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   THREE.JS — Holographic Brain + Neural Network
═══════════════════════════════════════════════════════════════════════════ */
function initThree() {
  const canvas = document.querySelector("#scene");
  if (!canvas || !window.THREE) return;

  const T = THREE;

  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene  = new T.Scene();
  scene.fog    = new T.FogExp2(0x050d1c, 0.055);

  const camera = new T.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0, 13);

  const root = new T.Group();
  scene.add(root);

  /* ── Lighting ── */
  scene.add(new T.AmbientLight(0xaad8ff, 0.5));

  const keyL = new T.PointLight(0xdff4ff, 3.8, 32);
  keyL.position.set(6, 5, 10);
  scene.add(keyL);

  const rimL = new T.PointLight(0x88bbff, 1.8, 24);
  rimL.position.set(-7, -4, 2);
  scene.add(rimL);

  const topL = new T.PointLight(0xccefff, 1.4, 20);
  topL.position.set(0, 8, 0);
  scene.add(topL);

  /* ── Helpers ── */
  const mat = (col, em, op = 1) => new T.MeshStandardMaterial({
    color: col, emissive: em, emissiveIntensity: 0.65,
    metalness: 0.55, roughness: 0.28,
    transparent: op < 1, opacity: op, depthWrite: op >= 0.5
  });

  const ghostMat = (col, op) => new T.MeshStandardMaterial({
    color: col, emissive: col, emissiveIntensity: 0.14,
    metalness: 0.0, roughness: 0.7,
    transparent: true, opacity: op, side: T.FrontSide, depthWrite: false
  });

  /* ── BRAIN SHAPE ──────────────────────────────────────────────────────────
     Approximate the brain silhouette by displacing a high-poly sphere
     using sinusoidal noise — gives the characteristic lobed, organic form.  */
  const brainGeo = new T.SphereGeometry(2.0, 96, 96);
  const posAttr  = brainGeo.attributes.position;
  const norms    = brainGeo.attributes.normal;
  const noiseAmp = 0.34;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    // Sinusoidal displacement — mimics cortical folding.
    const freq = 3.8;
    const d = noiseAmp * (
      Math.sin(x * freq + 1.1)  * Math.cos(y * freq * 0.9) +
      Math.sin(y * freq + 2.3)  * Math.cos(z * freq * 1.1) +
      Math.sin(z * freq * 1.3)  * Math.cos(x * freq * 0.8) * 0.5
    );

    // Flatten bottom (brain stem side) and slightly elongate forward.
    const flatten = y < -0.8 ? 0.55 : 1.0;
    const nx = norms.getX(i), ny = norms.getY(i), nz = norms.getZ(i);
    posAttr.setXYZ(i, x + nx * d * flatten, y + ny * d * flatten, z + nz * d * flatten);
  }
  brainGeo.computeVertexNormals();

  /* Wireframe-only brain — no solid fill, pure net */
  const wireMat = new T.MeshBasicMaterial({
    color: 0xc8f0ff, wireframe: true,
    transparent: true, opacity: 0.32
  });
  const brainMesh = new T.Mesh(brainGeo, wireMat);
  root.add(brainMesh);

  /* Very soft outer glow shells to add depth without filling solid */
  root.add(new T.Mesh(new T.SphereGeometry(2.22, 36, 36), ghostMat(0xaae4ff, 0.06)));
  root.add(new T.Mesh(new T.SphereGeometry(2.55, 28, 28), ghostMat(0x88ccff, 0.03)));

  /* Node positions still needed for connections and pulses — no visible spheres */
  const nodeCount = 52;
  const nodePositions = [];
  for (let i = 0; i < nodeCount; i++) {
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r     = 2.05 + Math.random() * 0.55;
    nodePositions.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.82,
      r * Math.cos(phi)
    ));
  }

  /* ── NEURAL CONNECTIONS ────────────────────────────────────────────────────
     Connect nearby node pairs with glowing lines — axon/synapse pathways. */
  const connectionMat = new T.LineBasicMaterial({
    color: 0xbcedff, transparent: true, opacity: 0.38
  });

  const maxDist = 2.6;
  nodePositions.forEach((a, i) => {
    nodePositions.forEach((b, j) => {
      if (j <= i) return;
      if (a.distanceTo(b) < maxDist) {
        const geo = new T.BufferGeometry().setFromPoints([a, b]);
        root.add(new T.Line(geo, connectionMat));
      }
    });
  });

  const pulses = [];


  /* ── Resize ── */
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  /* ── Render loop ── */
  const t0 = performance.now();
  const tick = () => {
    const t = (performance.now() - t0) * 0.001;

    /* Slow dignified rotation */
    root.rotation.y = t * 0.09;
    root.rotation.x = Math.sin(t * 0.13) * 0.07;

    /* Brain breathes */
    const bScale = 1 + Math.sin(t * 0.95) * 0.018;
    brainMesh.scale.setScalar(bScale);


    /* Slow cinematic camera drift */
    camera.position.x = Math.sin(t * 0.07) * 0.6;
    camera.position.y = Math.cos(t * 0.055) * 0.38;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();
}

/* ═══════════════════════════════════════════════════════════════════════════
   GSAP — All page animations
═══════════════════════════════════════════════════════════════════════════ */
function initMotion() {
  /* Degrade gracefully if GSAP didn't load */
  if (!window.gsap) {
    document.querySelectorAll(".reveal, .word").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── Curtain out ── */
  gsap.fromTo(curtain,
    { scaleY: 1, transformOrigin: "bottom" },
    { scaleY: 0, duration: 0.75, ease: "power3.inOut" });

  /* ── Hero headline words fly in ── */
  if (!reduced) {
    const words = gsap.utils.toArray(".line .word");
    if (words.length) {
      gsap.from(words, {
        yPercent: 110, opacity: 0,
        duration: 1.1, stagger: 0.07, ease: "power3.out", delay: 0.2
      });
    }
    gsap.from(".hero-foot", { opacity: 0, y: 22, duration: 1.1, delay: 1.0, ease: "power2.out" });
  }

  /* ── Hero photo parallax ── */
  const photo = document.querySelector(".hero-photo");
  if (photo && !reduced) {
    gsap.to(photo, {
      yPercent: 14, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.2 }
    });
  }

  /* ── VitaPulse section parallax ── */
  const vitaImg = document.querySelector(".vita img");
  if (vitaImg && !reduced) {
    gsap.to(vitaImg, {
      yPercent: 12,
      scrollTrigger: { trigger: ".vita", start: "top bottom", end: "bottom top", scrub: 1.2 }
    });
  }

  /* ── Generic scroll reveals ── */
  if (!reduced) {
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.85, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = 1; el.style.transform = "none";
    });
  }

  /* ── Solution list items stagger in ── */
  if (!reduced) {
    const listItems = gsap.utils.toArray(".list li");
    if (listItems.length) {
      gsap.fromTo(listItems,
        { opacity: 0, x: -28 },
        { opacity: 1, x: 0, duration: 0.7, stagger: 0.14, ease: "power2.out",
          scrollTrigger: { trigger: ".list", start: "top 82%" } });
    }
  }

  /* ── Impact row: each article slides up with stagger ── */
  if (!reduced) {
    const articles = gsap.utils.toArray(".impact-row article");
    if (articles.length) {
      gsap.fromTo(articles,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: "power2.out",
          scrollTrigger: { trigger: ".impact-row", start: "top 84%" } });
    }
  }

  /* ── Section headline: clip-reveal (each h2 clips open) ── */
  if (!reduced) {
    gsap.utils.toArray(".stage h2").forEach((h) => {
      gsap.fromTo(h,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: h, start: "top 88%" } });
    });
  }

  /* ── Scroll-progress bar ── */
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      bar.style.transform = `scaleX(${self.progress})`;
    }
  });

  /* ── Header becomes solid after hero ── */
  if (header && !document.body.classList.contains("inner")) {
    ScrollTrigger.create({
      start: "top -40",
      onUpdate: (self) => header.classList.toggle("solid", self.scroll() > 80)
    });
  }
}

/* ── Boot ─────────────────────────────────────────────────────────────────── */
splitLines();
initThree();
initMotion();
