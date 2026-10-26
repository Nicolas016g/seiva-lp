const WA = "5516997082808";
const LEAD_EMAIL = "contato@alabarda.com.br";
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-lead]");
const topBtn = document.querySelector("[data-top]");
const menuBtn = document.querySelector("[data-menu-btn]");
const menu = document.querySelector("[data-menu]");
const stickyCta = document.querySelector(".sticky-cta");
const formError = document.querySelector("[data-form-error]");
const submitBtn = document.querySelector("[data-submit]");
const successBox = document.querySelector("[data-success]");
const waSuccess = document.querySelector("[data-wa-success]");
const leadSection = document.querySelector("#visita");

const INTEREST = {
  "157": "Torre Arbo 157 m²",
  "206": "Torre Raízes 206 m²",
  ambos: "as duas torres",
};

const HORARIO = {
  qualquer: "qualquer horário",
  manha: "de manhã",
  tarde: "à tarde",
  noite: "à noite",
};

function isDesktopNav() {
  return window.matchMedia("(min-width: 961px)").matches;
}

function closeMenu() {
  nav?.classList.remove("menu-open");
  document.body.classList.remove("menu-open");
  menuBtn?.setAttribute("aria-expanded", "false");
  if (menu) menu.hidden = !isDesktopNav();
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
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  if (menu) menu.hidden = !open;
});

window.addEventListener("resize", () => {
  if (isDesktopNav()) closeMenu();
});
closeMenu();

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

function showError(text) {
  if (!formError) return;
  formError.hidden = false;
  formError.textContent = text;
}

function clearError() {
  if (!formError) return;
  formError.hidden = true;
  formError.textContent = "";
}

function waText(payload) {
  const extra = payload.mensagem ? ` Observação: ${payload.mensagem}` : "";
  return `Olá! Sou ${payload.nome} (${payload.telefone} / ${payload.email}). Quero conhecer o Seiva Vila Harmonia, interesse em ${INTEREST[payload.interesse]}. Prefiro contato ${HORARIO[payload.horario] || "qualquer horário"}.${extra}`;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  return { response, data };
}

async function sendLead(payload) {
  try {
    const api = await postJson("/api/lead", payload);
    if (api.response.ok && api.data.ok !== false) return true;
  } catch {
    // Sem API no servidor estático: envia direto.
  }

  const { response, data } = await postJson(
    `https://formsubmit.co/ajax/${encodeURIComponent(LEAD_EMAIL)}`,
    {
      _subject: `Novo lead Seiva Vila Harmonia, ${INTEREST[payload.interesse] || payload.interesse}`,
      _template: "table",
      _captcha: "false",
      _replyto: payload.email,
      nome: payload.nome,
      email: payload.email,
      whatsapp: payload.telefone,
      interesse: INTEREST[payload.interesse] || payload.interesse,
      horario: HORARIO[payload.horario] || payload.horario,
      mensagem: payload.mensagem || "(sem observações)",
      origem: "seiva-lp",
    },
  );

  return response.ok && data.success !== false;
}

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

  clearError();

  if (payload.empresa) {
    form.classList.add("is-sent");
    if (successBox) successBox.hidden = false;
    return;
  }

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

  form.classList.add("is-loading");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";
  }

  try {
    const sent = await sendLead(payload);
    if (!sent) {
      showError("Não foi possível enviar agora. Tente de novo ou fale no WhatsApp.");
      return;
    }

    if (waSuccess) {
      waSuccess.href = `https://wa.me/${WA}?text=${encodeURIComponent(waText(payload))}`;
    }
    form.reset();
    form.classList.add("is-sent");
    if (successBox) successBox.hidden = false;
  } catch {
    showError("Não foi possível enviar agora. Confira a conexão e tente de novo.");
  } finally {
    form.classList.remove("is-loading");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Quero agendar visita";
    }
  }
});
