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
    header.style.background = "rgba(5, 11, 22, 0.78)";
    header.style.borderColor = "rgba(255,255,255,0.18)";
  } else {
    header.style.background = "rgba(5, 11, 22, 0.55)";
    header.style.borderColor = "rgba(255,255,255,0.12)";
  }
});