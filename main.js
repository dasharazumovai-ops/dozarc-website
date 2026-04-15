const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  if (!header) return;

  if (window.scrollY > 20) {
    header.style.background = "rgba(13, 35, 74, 0.55)";
    header.style.borderColor = "rgba(255,255,255,0.22)";
  } else {
    header.style.background = "rgba(13, 35, 74, 0.40)";
    header.style.borderColor = "rgba(255,255,255,0.14)";
  }
});
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  reveals.forEach((el) => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;

    if (elementTop < windowHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

const cards = document.querySelectorAll(".product-card");

cards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -(y - centerY) / 15;
    const rotateY = (x - centerX) / 15;

    card.style.transition = "transform 0.1s ease";
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transition = "transform 0.4s ease";
    card.style.transform = "rotateX(0) rotateY(0) scale(1)";
  });
});

const canvas = document.getElementById("waveCanvas");

if (canvas) {
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  let animationFrameId = 0;
  let time = 0;

  const layers = [
    {
      count: 100,
      spacing: 26,
      amplitude: 18,
      frequency: 0.010,
      speed: 0.00015,
      thickness: 1.2,
      color: "rgba(170, 210, 255, 0.07)",
      glow: "rgba(200, 235, 255, 0.03)",
      offsetX: -80,
      offsetY: 0,
      tilt: 0.12
    },
    {
      count: 94,
      spacing: 30,
      amplitude: 28,
      frequency: 0.012,
      speed: 0.00012,
      thickness: 1.4,
      color: "rgba(170, 210, 255, 0.1)",
      glow: "rgba(220, 240, 255, 0.04)",
      offsetX: 40,
      offsetY: 40,
      tilt: 0.08
    },
    {
      count: 88,
      spacing: 34,
      amplitude: 38,
      frequency: 0.014,
      speed: 0.0001,
      thickness: 1.6,
      color: "rgba(180, 220, 255, 0.16)",
      glow: "rgba(230, 245, 255, 0.05)",
      offsetX: 120,
      offsetY: 80,
      tilt: 0.05
    }
  ];

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function drawVerticalWaveLayer(layer, index) {
    const startX = -300;
    const endX = width + 300;
    const usableHeight = height + 500;

    for (let i = 0; i < layer.count; i++) {
      const baseX = startX + i * layer.spacing;

      ctx.beginPath();

      for (let y = -60; y <= usableHeight; y += 8) {
        const wave1 =
          Math.sin(y * layer.frequency + time * layer.speed * 1000 + i * 0.55) *
          layer.amplitude;

        const wave2 =
          Math.cos(y * layer.frequency * 0.55 - time * layer.speed * 700 + i * 0.28) *
          (layer.amplitude * 0.45);

        const drift = y * layer.tilt;
        const x = baseX + wave1 + wave2 + drift;

        if (y === -60) {
          ctx.moveTo(x, y + layer.offsetY);
        } else {
          ctx.lineTo(x, y + layer.offsetY);
        }
      }

      ctx.strokeStyle = layer.color;
      ctx.lineWidth = layer.thickness;
      ctx.shadowBlur = 4;
      ctx.shadowColor = layer.glow;
      ctx.stroke();
    }

    // subtle edge highlights on selected lines only
    for (let i = 1; i < layer.count; i += 3) {
      const baseX = startX + i * layer.spacing + 6;

      ctx.beginPath();

      for (let y = -60; y <= usableHeight; y += 10) {
        const wave1 =
          Math.sin(y * layer.frequency + time * layer.speed * 1000 + i * 0.55) *
          layer.amplitude;

        const wave2 =
          Math.cos(y * layer.frequency * 0.55 - time * layer.speed * 700 + i * 0.28) *
          (layer.amplitude * 0.45);

        const drift = y * layer.tilt;
        const x = baseX + wave1 + wave2 + drift;

        if (y === -60) {
          ctx.moveTo(x, y + layer.offsetY);
        } else {
          ctx.lineTo(x, y + layer.offsetY);
        }
      }

      ctx.strokeStyle = "rgba(235, 245, 255, 0.08)";
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(235, 245, 255, 0.08)";
      ctx.stroke();
    }

    // dots to make it feel more digital, not broken
    for (let i = 0; i < layer.count; i += 2) {
      const baseX = startX + i * layer.spacing;

      for (let y = 0; y <= usableHeight; y += 24) {
        const wave1 =
          Math.sin(y * layer.frequency + time * layer.speed * 1000 + i * 0.55) *
          layer.amplitude;

        const wave2 =
          Math.cos(y * layer.frequency * 0.55 - time * layer.speed * 700 + i * 0.28) *
          (layer.amplitude * 0.45);

        const drift = y * layer.tilt;
        const x = baseX + wave1 + wave2 + drift;

        ctx.beginPath();
        ctx.arc(x, y + layer.offsetY, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220, 240, 255, 0.08)";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(220, 240, 255, 0.08)";
        ctx.fill();
      }
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    time += 0.25;

    for (let i = 0; i < layers.length; i++) {
      drawVerticalWaveLayer(layers[i], i);
    }

    animationFrameId = requestAnimationFrame(drawFrame);
  }

  resizeCanvas();
  drawFrame();

  window.addEventListener("resize", () => {
    cancelAnimationFrame(animationFrameId);
    resizeCanvas();
    drawFrame();
  });
}