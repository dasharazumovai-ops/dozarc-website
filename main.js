/* ============================================================
   Dozarc — Cinematic Interactive Experience
   - WebGL shader background (GPU-rendered nebula / flow field)
   - Three.js 3D hero centerpiece
   - IntersectionObserver-driven reveals
   - Throttled, rAF-synced scroll + mouse interactions
   - Pauses work when tab is hidden
   ============================================================ */

(() => {
  "use strict";

  // ---------- utilities ----------
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Global shared state — written by input handlers, read by render loops
  const state = {
    mouseX: 0.5,
    mouseY: 0.5,
    smoothMouseX: 0.5,
    smoothMouseY: 0.5,
    scrollY: 0,
    smoothScroll: 0,
    scrollProgress: 0,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    hidden: false,
    time: 0,
  };

  // ---------- Header with throttled scroll ----------
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const update = () => {
      header.classList.toggle("is-scrolled", state.scrollY > 24);
    };
    update();
    return update;
  }

  // ---------- Mobile menu ----------
  function initMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const siteNav = document.getElementById("siteNav");
    if (!menuToggle || !siteNav) return;
    menuToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // ---------- Scroll progress bar ----------
  function initScrollProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return () => {};
    return () => {
      bar.style.transform = `scaleX(${state.scrollProgress})`;
    };
  }

  // ---------- IntersectionObserver reveals ----------
  function initReveals() {
    const items = document.querySelectorAll(".reveal, .stagger > *");
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    items.forEach((el, i) => {
      // stagger delay for children of .stagger containers
      if (el.parentElement && el.parentElement.classList.contains("stagger")) {
        const idx = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.transitionDelay = `${idx * 80}ms`;
      }
      io.observe(el);
    });
  }

  // ---------- Magnetic buttons ----------
  function initMagneticButtons() {
    if (prefersReducedMotion) return;
    document.querySelectorAll(".btn").forEach((btn) => {
      let raf = 0;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      const animate = () => {
        currentX = lerp(currentX, targetX, 0.18);
        currentY = lerp(currentY, targetY, 0.18);
        btn.style.transform = `translate(${currentX}px, ${currentY}px)`;
        if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
          raf = requestAnimationFrame(animate);
        } else {
          raf = 0;
        }
      };

      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        targetX = dx * 0.25;
        targetY = dy * 0.35;
        if (!raf) raf = requestAnimationFrame(animate);
      });

      btn.addEventListener("mouseleave", () => {
        targetX = 0;
        targetY = 0;
        if (!raf) raf = requestAnimationFrame(animate);
      });
    });
  }

  // ---------- Card 3D tilt (throttled via rAF) ----------
  function initCardTilt() {
    if (prefersReducedMotion) return;
    document.querySelectorAll(".product-card, .about-card, .experience-panel").forEach((card) => {
      let raf = 0;
      let pendingEvent = null;

      const apply = () => {
        raf = 0;
        if (!pendingEvent) return;
        const rect = card.getBoundingClientRect();
        const x = pendingEvent.clientX - rect.left;
        const y = pendingEvent.clientY - rect.top;
        const rx = -((y / rect.height) - 0.5) * 10;
        const ry = ((x / rect.width) - 0.5) * 10;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
        card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
        pendingEvent = null;
      };

      card.addEventListener("mousemove", (e) => {
        pendingEvent = e;
        if (!raf) raf = requestAnimationFrame(apply);
      });

      card.addEventListener("mouseleave", () => {
        pendingEvent = null;
        card.style.transform = "";
      });
    });
  }

  // ---------- Custom glowing cursor ----------
  function initCursor() {
    if (prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const cursor = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!cursor || !ring) return;

    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let rx = cx, ry = cy;

    window.addEventListener("mousemove", (e) => {
      cx = e.clientX;
      cy = e.clientY;
    });

    // Hover state on interactive elements
    document.querySelectorAll("a, button, .product-card, .about-card, .experience-panel").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });

    const tick = () => {
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      rx = lerp(rx, cx, 0.18);
      ry = lerp(ry, cy, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ---------- WebGL shader background (Three.js) ----------
  function initShaderBackground() {
    const canvas = document.getElementById("waveCanvas");
    if (!canvas || typeof THREE === "undefined") return { render: () => {}, resize: () => {} };

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("WebGL not available, falling back to CSS background", e);
      canvas.style.display = "none";
      return { render: () => {}, resize: () => {} };
    }

    // Render at 0.85x resolution for performance on high-dpi displays — the
    // noise-based look is soft, so upscaling is invisible.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.85;
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
      uScroll:     { value: 0 },
    };

    const vertexShader = /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Fragment shader: slow premium gradient + electronic mesh
    const fragmentShader = /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2  uResolution;
      uniform vec2  uMouse;
      uniform float uScroll;

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float t = uTime * 0.00022;

        vec2 poleA = vec2(0.25 + sin(t * 1.1) * 0.18, 0.30 + cos(t * 0.7) * 0.12);
        vec2 poleB = vec2(0.75 + cos(t * 0.9) * 0.14, 0.70 + sin(t * 1.3) * 0.10);

        float dA = 1.0 - smoothstep(0.0, 1.1, length(uv - poleA));
        float dB = 1.0 - smoothstep(0.0, 1.1, length(uv - poleB));

        vec3 colA = vec3(0.04, 0.08, 0.26);
        vec3 colB = vec3(0.01, 0.04, 0.15);
        vec3 colC = vec3(0.10, 0.18, 0.52);

        vec3 bg = colB;
        bg = mix(bg, colA, dA * 0.85);
        bg = mix(bg, colC, dB * 0.40);

        float sweep = sin(uv.x * 1.6 - uv.y * 0.9 + t * 2.8) * 0.5 + 0.5;
        sweep = pow(sweep, 5.0) * 0.07;
        bg += vec3(0.18, 0.35, 0.90) * sweep;

        vec2 screen = vec2(uv.x * aspect, uv.y);
        float perspective = 1.0 + (1.0 - uv.y) * 0.6;
        vec2 gp = vec2(
          (uv.x - 0.5) * aspect * perspective,
          uv.y * perspective
        );

        float cellSize = 0.045;
        vec2 cell = gp / cellSize;
        vec2 cellFract = fract(cell);
        vec2 cellDist = min(cellFract, 1.0 - cellFract);

        float lineW = 0.018;
        float lineX = smoothstep(lineW, 0.0, cellDist.x);
        float lineY = smoothstep(lineW, 0.0, cellDist.y);
        float grid  = max(lineX, lineY);

        float dotR = 0.09;
        float dot  = smoothstep(dotR, 0.0, length(cellFract - 0.5));

        float wave = sin(gp.x * 3.8 - t * 4.5) * 0.5 + 0.5;
        wave *= sin(gp.y * 2.6 + t * 3.1) * 0.5 + 0.5;
        wave = pow(wave, 2.0);

        float edgeFade = smoothstep(0.0, 0.22, uv.x)
                       * smoothstep(1.0, 0.78, uv.x)
                       * smoothstep(0.0, 0.18, uv.y)
                       * smoothstep(1.0, 0.55, uv.y);

        float mouseD = length(screen - vec2(uMouse.x * aspect, 1.0 - uMouse.y));
        float mouseLift = smoothstep(0.5, 0.0, mouseD) * 0.55;

        float gridAlpha = (grid * 0.22 + dot * 0.32) * edgeFade;
        float gridBright = gridAlpha * (1.0 + wave * 0.7 + mouseLift);

        vec3 gridCol = mix(
          vec3(0.18, 0.38, 0.90),
          vec3(0.55, 0.85, 1.00),
          wave * 0.6 + dot * 0.4 + mouseLift * 0.5
        );

        vec3 color = bg + gridCol * gridBright;

        float vig = smoothstep(1.3, 0.3, length((uv - 0.5) * vec2(1.0, 1.2)));
        color *= mix(0.50, 1.0, vig);

        color *= 1.0 - uScroll * 0.20;

        gl_FragColor = vec4(color, 1.0);
      }
    `;
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    };
    resize();

    const render = (t) => {
      uniforms.uTime.value = t;
      uniforms.uMouse.value.set(state.smoothMouseX, state.smoothMouseY);
      uniforms.uScroll.value = clamp(state.smoothScroll / window.innerHeight, 0, 1);
      renderer.render(scene, camera);
    };

    return { render, resize };
  }

  // ---------- Three.js hero 3D scene ----------
  function initHeroScene() {
    const canvas = document.querySelector(".hero-canvas");
    if (!canvas || typeof THREE === "undefined") return { render: () => {}, resize: () => {} };

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      console.warn("Hero WebGL failed", e);
      return { render: () => {}, resize: () => {} };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // Main group (everything rotates together with mouse/scroll)
    const group = new THREE.Group();
    scene.add(group);

    // Inner tetrahedron — the "Dozarc pyramid" evolved into 3D
    const tetraGeo = new THREE.TetrahedronGeometry(1.15);
    const tetraMat = new THREE.MeshBasicMaterial({
      color: 0x6a94ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const tetra = new THREE.Mesh(tetraGeo, tetraMat);
    group.add(tetra);

    // Tetrahedron edges (crisp outline)
    const tetraEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(tetraGeo),
      new THREE.LineBasicMaterial({ color: 0xc7dcff, transparent: true, opacity: 0.9 })
    );
    group.add(tetraEdges);

    // Outer wireframe icosahedron — a geodesic cage that hints at a bigger universe
    const icoGeo = new THREE.IcosahedronGeometry(2.1, 1);
    const icoEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(icoGeo),
      new THREE.LineBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.5 })
    );
    group.add(icoEdges);

    // Second, larger, slower wireframe cage for depth
    const cageGeo = new THREE.OctahedronGeometry(2.9, 0);
    const cage = new THREE.LineSegments(
      new THREE.EdgesGeometry(cageGeo),
      new THREE.LineBasicMaterial({ color: 0x5a8cff, transparent: true, opacity: 0.28 })
    );
    group.add(cage);

    // Orbiting particles on a spherical shell
    const PARTICLE_COUNT = 260;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rad = 2.3 + Math.random() * 1.3;
      positions[i * 3]     = rad * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = rad * Math.cos(phi);
      speeds[i] = 0.2 + Math.random() * 0.8;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xbfe0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // Central bright core sprite (fake bloom)
    const coreCanvas = document.createElement("canvas");
    coreCanvas.width = coreCanvas.height = 128;
    const cctx = coreCanvas.getContext("2d");
    const grad = cctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(180,220,255,0.7)");
    grad.addColorStop(0.6, "rgba(90,140,255,0.15)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, 128, 128);
    const coreTex = new THREE.CanvasTexture(coreCanvas);
    const coreMat = new THREE.SpriteMaterial({
      map: coreTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const core = new THREE.Sprite(coreMat);
    core.scale.set(2.2, 2.2, 1);
    group.add(core);

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    let lastT = 0;
    const render = (t) => {
      const dt = Math.min((t - lastT) * 0.001, 0.05);
      lastT = t;

      // Scroll-driven scale/opacity (fades the centerpiece as you scroll past)
      const fadeStart = 0;
      const fadeEnd = window.innerHeight * 0.9;
      const fade = clamp(1 - (state.scrollY - fadeStart) / (fadeEnd - fadeStart), 0, 1);

      // Mouse parallax — group tilts toward cursor
      const targetRx = (state.smoothMouseY - 0.5) * 0.6;
      const targetRy = (state.smoothMouseX - 0.5) * 0.8;
      group.rotation.x = lerp(group.rotation.x, targetRx, 0.06);
      group.rotation.y += dt * 0.25 + (targetRy - group.rotation.y) * 0.04;

      // Inner elements spin on their own
      tetra.rotation.y -= dt * 0.4;
      tetra.rotation.x += dt * 0.2;
      tetraEdges.rotation.copy(tetra.rotation);
      icoEdges.rotation.y += dt * 0.15;
      icoEdges.rotation.x -= dt * 0.08;
      cage.rotation.y -= dt * 0.08;
      cage.rotation.z += dt * 0.05;
      particles.rotation.y += dt * 0.05;

      // Core pulse
      const pulse = 1 + Math.sin(t * 0.002) * 0.08;
      core.scale.set(2.2 * pulse, 2.2 * pulse, 1);

      // Apply scroll fade
      group.scale.setScalar(0.5 + fade * 0.5);
      tetraMat.opacity = 0.35 * fade;
      particleMat.opacity = 0.85 * fade;

      renderer.render(scene, camera);
    };

    return { render, resize };
  }

  // ---------- Input handlers ----------
  function initInputs() {
    window.addEventListener(
      "mousemove",
      (e) => {
        state.mouseX = e.clientX / state.viewportW;
        state.mouseY = e.clientY / state.viewportH;
      },
      { passive: true }
    );

    // Single scroll listener — updates shared state. Everyone reads in rAF.
    window.addEventListener(
      "scroll",
      () => {
        state.scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - state.viewportH;
        state.scrollProgress = docHeight > 0 ? clamp(state.scrollY / docHeight, 0, 1) : 0;
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      () => {
        state.viewportW = window.innerWidth;
        state.viewportH = window.innerHeight;
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      state.hidden = document.hidden;
    });
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    initInputs();
    initReveals();
    initMagneticButtons();
    initCardTilt();
    initCursor();

    const updateHeader = initHeader();
    const updateProgress = initScrollProgress();
    const bg = initShaderBackground();
    const hero = initHeroScene();

    // Resize handling — debounced for expensive canvas resizes
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (bg && bg.resize) bg.resize();
        if (hero && hero.resize) hero.resize();
      }, 120);
    });

    // Unified main loop — every animated thing tied to scroll/mouse/time reads
    // from smoothed state here. Single rAF to avoid contention.
    const tick = (t) => {
      if (!state.hidden) {
        state.time = t;
        // Smooth mouse & scroll for lag-free visual motion
        state.smoothMouseX = lerp(state.smoothMouseX, state.mouseX, 0.08);
        state.smoothMouseY = lerp(state.smoothMouseY, state.mouseY, 0.08);
        state.smoothScroll = lerp(state.smoothScroll, state.scrollY, 0.12);

        if (updateHeader) updateHeader();
        if (updateProgress) updateProgress();
        if (bg && bg.render) bg.render(t);
        if (hero && hero.render) hero.render(t);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();
