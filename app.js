const WA = "5516997082808";
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-lead]");
const topBtn = document.querySelector("[data-top]");

function onScroll() {
  nav.classList.toggle("is-solid", window.scrollY > 40);
  topBtn?.classList.toggle("is-on", window.scrollY > 480);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

topBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const nome = String(data.get("nome") || "").trim();
  const telefone = String(data.get("telefone") || "").trim();
  const interesse = String(data.get("interesse") || "");
  const label = {
    "157": "Torre Arbo 157 m²",
    "206": "Torre Raízes 206 m²",
    ambos: "as duas torres",
  }[interesse];
  const text = `Olá! Sou ${nome} (${telefone}). Quero conhecer o Seiva Vila Harmonia — interesse em ${label}.`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, "_blank");
});
