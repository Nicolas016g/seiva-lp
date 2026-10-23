const TO_EMAIL = process.env.LEAD_EMAIL?.trim() || "contato@alabarda.com.br";

const INTEREST = {
  "157": "Torre Arbo 157 m²",
  "206": "Torre Raízes 206 m²",
  ambos: "As duas torres",
};

const HORARIO = {
  qualquer: "Qualquer horário",
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

function clean(value, max = 400) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function digits(value) {
  return clean(value, 40).replace(/\D/g, "");
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  if (clean(body.empresa) || clean(body.honeypot)) {
    res.status(200).json({ ok: true });
    return;
  }

  const lead = {
    nome: clean(body.nome, 120),
    email: clean(body.email, 160).toLowerCase(),
    telefone: clean(body.telefone, 40),
    interesse: INTEREST[clean(body.interesse, 20)] || clean(body.interesse, 80),
    horario: HORARIO[clean(body.horario, 20)] || clean(body.horario, 40),
    mensagem: clean(body.mensagem, 800),
    origem: "seiva-lp",
    recebidoEm: new Date().toISOString(),
  };

  if (!lead.nome || !lead.email || !lead.telefone || !lead.interesse) {
    res.status(400).json({ ok: false, error: "required" });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    res.status(400).json({ ok: false, error: "email" });
    return;
  }

  if (digits(lead.telefone).length < 10) {
    res.status(400).json({ ok: false, error: "phone" });
    return;
  }

  try {
    const response = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(TO_EMAIL)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: `Novo lead Seiva Vila Harmonia — ${lead.interesse}`,
          _template: "table",
          _captcha: "false",
          _replyto: lead.email,
          nome: lead.nome,
          email: lead.email,
          whatsapp: lead.telefone,
          interesse: lead.interesse,
          horario: lead.horario || "Qualquer horário",
          mensagem: lead.mensagem || "(sem observações)",
          origem: lead.origem,
          recebidoEm: lead.recebidoEm,
        }),
      },
    );

    if (!response.ok) {
      res.status(502).json({ ok: false, error: "upstream" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ ok: false, error: "network" });
  }
}
