// assets/js/cliente.js

const DB = {
  sessionLS: "session",
  carrinhoLS: "carrinho"
};

const WHATSAPP_NUMERO = "+5521987409682";

function getSessionCliente() {
  const session = utils.loadLS(DB.sessionLS, null);
  if (!session || session.role !== "cliente") {
    location.href = "index.html";
    return null;
  }
  return session;
}

async function getClienteBySession(session) {
  const clientes = await GitHubDB.getClientes();
  return clientes.find(c => c.id === session.id);
}

// cria exemplos iniciais se ainda não existirem
async function initMockDataCliente() {
  let servicos = await GitHubDB.getServicos();
  if (!servicos || !servicos.length) {
    servicos = [
      { id: "srv1", nome: "Instalação de tomada", preco: 80, tempo: "1h", visivel: true },
      { id: "srv2", nome: "Troca de disjuntor", preco: 120, tempo: "1h30", visivel: true },
      { id: "srv3", nome: "Revisão elétrica completa", preco: 350, tempo: "4h", visivel: true }
    ];
    await GitHubDB.saveServicos(servicos);
  }

  let materiais = await GitHubDB.getMateriais();
  if (!materiais || !materiais.length) {
    materiais = [
      { id: "mat1", nome: "Tomada 10A", preco: 15, obs: "Marca padrão" },
      { id: "mat2", nome: "Disjuntor 20A", preco: 45, obs: "Bipolar" },
      { id: "mat3", nome: "Fio 2,5mm - 10m", preco: 60, obs: "Antichama" }
    ];
    await GitHubDB.saveMateriais(materiais);
  }

  let cupons = await GitHubDB.getCupons();
  if (!cupons || !cupons.length) {
    const now = new Date();
    const fim = new Date();
    fim.setMonth(fim.getMonth() + 1);
    cupons = [
      {
        codigo: "BEMVINDO10",
        desconto: 10,
        inicio: now.toISOString(),
        fim: fim.toISOString(),
        ativo: true
      }
    ];
    await GitHubDB.saveCupons(cupons);
  }
}

function getCarrinho() {
  return utils.loadLS(DB.carrinhoLS, { servicos: [], materiais: [] });
}

function setCarrinho(c) {
  utils.saveLS(DB.carrinhoLS, c);
}

async function renderServicos() {
  const lista = document.getElementById("listaServicos");
  const servicos = await GitHubDB.getServicos();
  const carrinho = getCarrinho();
  lista.innerHTML = "";

  servicos
    .filter(s => s.visivel)
    .forEach(s => {
      const item = document.createElement("div");
      item.className = "card-list-item";
      const qnt = carrinho.servicos.find(i => i.id === s.id)?.qtd || 0;
      item.innerHTML = `
        <div class="card-list-item-header">
          <strong>${s.nome}</strong>
          <span class="badge badge-success">R$ ${s.preco.toFixed(2)}</span>
        </div>
        <p class="text-muted">Tempo estimado: ${s.tempo || "—"}</p>
        <div class="form-row">
          <button class="btn btn-outline" data-id="${s.id}" data-type="srv-rem">-</button>
          <span style="min-width:40px;text-align:center;">${qnt}</span>
          <button class="btn btn-primary" data-id="${s.id}" data-type="srv-add">+</button>
        </div>
      `;
      lista.appendChild(item);
    });
}

async function renderMateriais() {
  const lista = document.getElementById("listaMateriais");
  const materiais = await GitHubDB.getMateriais();
  const carrinho = getCarrinho();
  lista.innerHTML = "";

  materiais.forEach(m => {
    const item = document.createElement("div");
    item.className = "card-list-item";
    const qnt = carrinho.materiais.find(i => i.id === m.id)?.qtd || 0;
    item.innerHTML = `
      <div class="card-list-item-header">
        <strong>${m.nome}</strong>
        <span class="badge badge-success">R$ ${m.preco.toFixed(2)}</span>
      </div>
      <p class="text-muted">${m.obs || ""}</p>
      <div class="form-row">
        <button class="btn btn-outline" data-id="${m.id}" data-type="mat-rem">-</button>
        <span style="min-width:40px;text-align:center;">${qnt}</span>
        <button class="btn btn-primary" data-id="${m.id}" data-type="mat-add">+</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

async function renderResumo() {
  const resumo = document.getElementById("resumoCarrinho");
  if (!resumo) return;
  const carrinho = getCarrinho();
  const servicos = await GitHubDB.getServicos();
  const materiais = await GitHubDB.getMateriais();

  let total = 0;
  let html = "<h3>Resumo</h3>";

  if (!carrinho.servicos.length && !carrinho.materiais.length) {
    resumo.innerHTML = "<p>Nenhum item no carrinho.</p>";
    return;
  }

  if (carrinho.servicos.length) {
    html += "<strong>Serviços:</strong><ul>";
    carrinho.servicos.forEach(it => {
      const s = servicos.find(x => x.id === it.id);
      if (!s) return;
      const sub = s.preco * it.qtd;
      total += sub;
      html += `<li>${it.qtd}x ${s.nome} - R$ ${sub.toFixed(2)}</li>`;
    });
    html += "</ul>";
  }

  if (carrinho.materiais.length) {
    html += "<strong>Materiais:</strong><ul>";
    carrinho.materiais.forEach(it => {
      const m = materiais.find(x => x.id === it.id);
      if (!m) return;
      const sub = m.preco * it.qtd;
      total += sub;
      html += `<li>${it.qtd}x ${m.nome} - R$ ${sub.toFixed(2)}</li>`;
    });
    html += "</ul>";
  }

  html += `<p><strong>Total parcial: R$ ${total.toFixed(2)}</strong></p>`;
  resumo.innerHTML = html;
}

async function updateCarrinho(type, id, delta) {
  const carrinho = getCarrinho();
  const arr = type === "servicos" ? carrinho.servicos : carrinho.materiais;
  const item = arr.find(i => i.id === id);

  if (!item && delta > 0) {
    arr.push({ id, qtd: delta });
  } else if (item) {
    item.qtd += delta;
    if (item.qtd <= 0) {
      const idx = arr.indexOf(item);
      arr.splice(idx, 1);
    }
  }
  setCarrinho(carrinho);
  await renderServicos();
  await renderMateriais();
  await renderResumo();
}

async function renderHistorico(session) {
  const box = document.getElementById("historicoAgendamentos");
  const ags = (await GitHubDB.getAgendamentos()).filter(a => a.clienteId === session.id);

  if (!ags.length) {
    box.innerHTML = "<p>Você ainda não possui agendamentos.</p>";
    return;
  }

  box.innerHTML = "";
  ags.forEach(a => {
    const div = document.createElement("div");
    div.className = "card-list-item";
    div.innerHTML = `
      <div class="card-list-item-header">
        <strong>${new Date(a.dataHora).toLocaleString("pt-BR")}</strong>
        <span class="badge badge-muted">${a.status}</span>
      </div>
      <p>Total: R$ ${a.total.toFixed(2)}</p>
      <div class="form-row">
        <button class="btn btn-outline" data-id="${a.id}" data-act="whats">WhatsApp</button>
        <button class="btn btn-outline" data-id="${a.id}" data-act="reagendar">Reagendar</button>
        <button class="btn btn-outline" data-id="${a.id}" data-act="cancelar">Cancelar</button>
      </div>
    `;
    box.appendChild(div);
  });
}

function changeSectionCliente(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("visible"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const map = {
    servicos: "sec-servicos",
    materiais: "sec-materiais",
    "meus-servicos": "sec-meus-servicos",
    "meus-dados": "sec-meus-dados"
  };
  const secId = map[id] || "sec-servicos";
  document.getElementById(secId).classList.add("visible");
  document
    .querySelector(`.nav-item[data-section="${id}"]`)
    .classList.add("active");

  const titulo = document.getElementById("tituloSecao");
  const titles = {
    servicos: "Serviços de Mão de Obra",
    materiais: "Materiais",
    "meus-servicos": "Meus Serviços Contratados",
    "meus-dados": "Meus Dados"
  };
  if (titulo) titulo.textContent = titles[id] || "Serviços de Mão de Obra";
}

function validarCupomAplicacao(codigo, cpf, cupons, usados) {
  const cupom = cupons.find(
    c => c.codigo.toUpperCase() === codigo.toUpperCase() && c.ativo
  );
  if (!cupom) return { ok: false, msg: "Cupom inexistente ou inativo." };

  const agora = new Date();
  if (agora < new Date(cupom.inicio) || agora > new Date(cupom.fim)) {
    return { ok: false, msg: "Cupom fora do período de validade." };
  }

  const jaUsou = usados.find(u => u.codigo === cupom.codigo && u.cpf === cpf);
  if (jaUsou) return { ok: false, msg: "Esse CPF já utilizou esse cupom." };

  return { ok: true, cupom };
}

async function finalizarAgendamento(session) {
  const carrinho = getCarrinho();
  const servicos = await GitHubDB.getServicos();
  const materiais = await GitHubDB.getMateriais();

  const data = document.getElementById("dataAgendamento").value;
  const hora = document.getElementById("horaAgendamento").value;
  const cpfCupom = document.getElementById("cpfCupom").value.trim();
  const codigoCupom = document.getElementById("cupom").value.trim();

  if (!data || !hora) {
    alert("Informe data e horário.");
    return;
  }
  if (!carrinho.servicos.length && !carrinho.materiais.length) {
    alert("Adicione pelo menos um serviço ou material.");
    return;
  }

  let total = 0;
  let txtServicos = "";
  carrinho.servicos.forEach(it => {
    const s = servicos.find(x => x.id === it.id);
    if (!s) return;
    const sub = s.preco * it.qtd;
    total += sub;
    txtServicos += `${it.qtd}x ${s.nome} (R$ ${sub.toFixed(2)})
`;
  });

  let txtMateriais = "";
  carrinho.materiais.forEach(it => {
    const m = materiais.find(x => x.id === it.id);
    if (!m) return;
    const sub = m.preco * it.qtd;
    total += sub;
    txtMateriais += `${it.qtd}x ${m.nome} (R$ ${sub.toFixed(2)})
`;
  });

  let desconto = 0;
  let cupomAplicado = null;

  const cupons = await GitHubDB.getCupons();
  let usados = await GitHubDB.getCuponsUsados();

  if (codigoCupom && cpfCupom) {
    const res = validarCupomAplicacao(codigoCupom, cpfCupom, cupons, usados);
    if (!res.ok) {
      alert(res.msg);
      return;
    }
    cupomAplicado = res.cupom.codigo;
    desconto = (total * res.cupom.desconto) / 100;
  }

  const dataHora = new Date(`${data}T${hora}:00`);
  const totalFinal = total - desconto;

  let agendamentos = await GitHubDB.getAgendamentos();
  const novo = {
    id: "ag-" + (agendamentos.length + 1),
    clienteId: session.id,
    dataHora: dataHora.toISOString(),
    total: totalFinal,
    status: "Pendente",
    cupom: cupomAplicado,
    cpfCupom: cpfCupom || null,
    servicos: carrinho.servicos,
    materiais: carrinho.materiais
  };
  agendamentos.push(novo);
  await GitHubDB.saveAgendamentos(agendamentos);

  if (cupomAplicado && cpfCupom) {
    usados.push({
      codigo: cupomAplicado,
      cpf: cpfCupom,
      dataHora: new Date().toISOString(),
      valor: desconto
    });
    await GitHubDB.saveCuponsUsados(usados);
  }

  setCarrinho({ servicos: [], materiais: [] });
  await renderServicos();
  await renderMateriais();
  await renderResumo();

  const texto = `Olá, Thiago! 😊

Gostaria de agendar um serviço de eletricista.

Cliente: ${session.email}
Data e horário desejados: ${dataHora.toLocaleString("pt-BR")}

Serviços:
${txtServicos || "Nenhum"}

Materiais:
${txtMateriais || "Nenhum"}

Cupom: ${cupomAplicado || "Nenhum"}
Total final: R$ ${totalFinal.toFixed(2)}

Mensagem automática gerada pelo site.`;

  const url = `https://wa.me/${WHATSAPP_NUMERO.replace(/D/g, "")}?text=${encodeURIComponent(
    texto
  )}`;
  window.open(url, "_blank");
  alert("Pedido criado e enviado para o WhatsApp!");
}

async function initClientePage() {
  const session = getSessionCliente();
  if (!session) return;

  await initMockDataCliente();

  const cliente = await getClienteBySession(session);
  if (cliente) {
    document.getElementById("clienteNome").textContent = cliente.nome;
    document.getElementById("md_nome").value = cliente.nome;
    document.getElementById("md_telefone").value = cliente.telefone;
    document.getElementById("md_observacao").value = cliente.observacao || "";
  }

  await renderServicos();
  await renderMateriais();
  await renderResumo();

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", async () => {
      changeSectionCliente(btn.dataset.section);
      if (btn.dataset.section === "meus-servicos") {
        await renderHistorico(session);
      }
    });
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(DB.sessionLS);
    location.href = "index.html";
  });

  document.getElementById("listaServicos").addEventListener("click", async e => {
    const t = e.target;
    if (!t.dataset.type) return;
    const id = t.dataset.id;
    if (t.dataset.type === "srv-add") await updateCarrinho("servicos", id, 1);
    if (t.dataset.type === "srv-rem") await updateCarrinho("servicos", id, -1);
  });

  document.getElementById("listaMateriais").addEventListener("click", async e => {
    const t = e.target;
    if (!t.dataset.type) return;
    const id = t.dataset.id;
    if (t.dataset.type === "mat-add") await updateCarrinho("materiais", id, 1);
    if (t.dataset.type === "mat-rem") await updateCarrinho("materiais", id, -1);
  });

  document.getElementById("cpfCupom").addEventListener("input", e => {
    e.target.value = utils.maskCPF(e.target.value);
  });

  document.getElementById("formMeusDados").addEventListener("submit", async e => {
    e.preventDefault();
    let clientes = await GitHubDB.getClientes();
    const c = clientes.find(x => x.id === session.id);
    if (!c) return;
    c.nome = document.getElementById("md_nome").value.trim();
    c.telefone = document.getElementById("md_telefone").value.trim();
    c.observacao = document.getElementById("md_observacao").value.trim();
    await GitHubDB.saveClientes(clientsSorted(clientes));
    alert("Dados atualizados!");
  });

  document.getElementById("formFinalizar").addEventListener("submit", async e => {
    e.preventDefault();
    await finalizarAgendamento(session);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("clienteNome")) {
    initClientePage();
  }
});
