const WA = "5516997082808";
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-lead]");
const topBtn = document.querySelector("[data-top]");
const menuBtn = document.querySelector("[data-menu-btn]");
const menu = document.querySelector("[data-menu]");
const stickyCta = document.querySelector(".sticky-cta");
const formError = document.querySelector("[data-form-error]");
const formOk = document.querySelector("[data-form-ok]");
const submitBtn = document.querySelector("[data-submit]");
const leadSection = document.querySelector("#visita");

function closeMenu() {
  nav?.classList.remove("menu-open");
  menuBtn?.setAttribute("aria-expanded", "false");
}

function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("is-solid", y > 24);
  topBtn?.classList.toggle("is-on", y > 480);
  const leadTop = leadSection?.getBoundingClientRect().top ?? 0;
  const hideSticky = y < 360 || leadTop < window.innerHeight - 48;
  stickyCta?.classList.toggle("is-on", !hideSticky);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

topBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function maskPhone(value) {
  const d = digits(value).slice(0, 11);
  if (d.length < 3) return d.replace(/^(\d{0,2})/, "($1");
  if (d.length < 7) return d.replace(/^(\d{2})(\d+)/, "($1) $2");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

const phoneInput = form?.querySelector('[name="telefone"]');
phoneInput?.addEventListener("input", () => {
  phoneInput.value = maskPhone(phoneInput.value);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = {
    nome: String(data.get("nome") || "").trim(),
    email: String(data.get("email") || "").trim(),
    telefone: String(data.get("telefone") || "").trim(),
    interesse: String(data.get("interesse") || ""),
    horario: String(data.get("horario") || "qualquer"),
    mensagem: String(data.get("mensagem") || "").trim(),
    empresa: String(data.get("empresa") || "").trim(),
  };
  const lgpd = form.querySelector('[name="lgpd"]')?.checked;

  const showError = (text) => {
    if (formOk) formOk.hidden = true;
    if (!formError) return;
    formError.hidden = false;
    formError.textContent = text;
  };

  if (formError) {
    formError.hidden = true;
    formError.textContent = "";
  }
  if (formOk) formOk.hidden = true;

  if (!payload.nome || !payload.email || !payload.telefone || !payload.interesse) {
    showError("Preencha nome, e-mail, WhatsApp e o interesse.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    showError("Informe um e-mail válido.");
    return;
  }
  if (digits(payload.telefone).length < 10) {
    showError("Informe um WhatsApp com DDD.");
    return;
  }
  if (!lgpd) {
    showError("Para continuar, autorize o contato nos termos da LGPD.");
    return;
  }

  const label = {
    "157": "Torre Arbo 157 m²",
    "206": "Torre Raízes 206 m²",
    ambos: "as duas torres",
  }[payload.interesse];
  const when = {
    qualquer: "qualquer horário",
    manha: "de manhã",
    tarde: "à tarde",
    noite: "à noite",
  }[payload.horario];
  const extra = payload.mensagem ? ` Observação: ${payload.mensagem}` : "";
  const text = `Olá! Sou ${payload.nome} (${payload.telefone} / ${payload.email}). Quero conhecer o Seiva Vila Harmonia — interesse em ${label}. Prefiro contato ${when}.${extra}`;

  form.classList.add("is-loading");
  if (submitBtn) submitBtn.textContent = "Enviando…";

  try {
    await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Local ou falha de rede: o WhatsApp segue como canal de atendimento.
  }

  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");

  if (formOk) {
    formOk.hidden = false;
    formOk.textContent = "Pedido enviado. Vamos falar com você no WhatsApp em instantes.";
  }
  form.reset();
  form.classList.remove("is-loading");
  if (submitBtn) submitBtn.textContent = "Quero agendar visita";
});
