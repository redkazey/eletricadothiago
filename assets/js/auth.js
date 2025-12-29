// assets/js/auth.js

const LS_KEYS = {
  loginAttempts: "loginAttempts",
  session: "session"
};

const ADMIN_CONFIG = {
  salt: "adm-salt-fixo"
};

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MIN = 15;

// inicializa admin se não existir em clientes.json / admin separado
async function initAdmin() {
  let clientes = await GitHubDB.getClientes();
  let adminUser = clientes.find(c => c.role === "admin");
  if (!adminUser) {
    const hash = await utils.hashPassword("thiago22", ADMIN_CONFIG.salt);
    adminUser = {
      id: "admin-1",
      nome: "Administrador",
      email: "admin@thiago22",
      salt: ADMIN_CONFIG.salt,
      hash,
      role: "admin"
    };
    clientes.push(adminUser);
    await GitHubDB.saveClientes(clientsSorted(clientes));
  }
}

function clientsSorted(arr) {
  return arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

function getAttempts() {
  return utils.loadLS(LS_KEYS.loginAttempts, {
    count: 0,
    blockedUntil: 0
  });
}
function setAttempts(obj) {
  utils.saveLS(LS_KEYS.loginAttempts, obj);
}
function isBlocked() {
  const { blockedUntil } = getAttempts();
  return Date.now() < blockedUntil;
}

// LOGIN
async function handleLogin(event) {
  event.preventDefault();
  const email = document
    .getElementById("loginEmail")
    .value.trim()
    .toLowerCase();
  const senha = document.getElementById("loginPassword").value;

  if (isBlocked()) {
    alert("Muitas tentativas inválidas. Tente novamente em alguns minutos.");
    return;
  }

  const attempts = getAttempts();
  const clientes = await GitHubDB.getClientes();

  const user = clientes.find(c => c.email === email);
  if (!user) {
    attempts.count++;
    if (attempts.count >= MAX_TENTATIVAS) {
      attempts.blockedUntil = Date.now() + BLOQUEIO_MIN * 60 * 1000;
      attempts.count = 0;
    }
    setAttempts(attempts);
    alert("Login ou senha inválidos.");
    return;
  }

  const ok = await utils.verifyPassword(senha, user.salt, user.hash);
  if (!ok) {
    attempts.count++;
    if (attempts.count >= MAX_TENTATIVAS) {
      attempts.blockedUntil = Date.now() + BLOQUEIO_MIN * 60 * 1000;
      attempts.count = 0;
    }
    setAttempts(attempts);
    alert("Login ou senha inválidos.");
    return;
  }

  setAttempts({ count: 0, blockedUntil: 0 });

  const session = {
    id: user.id,
    email: user.email,
    role: user.role || "cliente",
    loginAt: new Date().toISOString()
  };
  utils.saveLS(LS_KEYS.session, session);

  if (session.role === "admin") {
    let logs = await GitHubDB.getLogsAdmin();
    logs.push({ email: user.email, dataHora: new Date().toISOString() });
    await GitHubDB.saveLogsAdmin(logs);
    location.href = "admin.html";
  } else {
    location.href = "cliente.html";
  }
}

// CADASTRO
async function handleCadastro(event) {
  event.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const cep = document.getElementById("cep").value.trim();
  const endereco = document.getElementById("endereco").value.trim();
  const numero = document.getElementById("numero").value.trim();
  const complemento = document.getElementById("complemento").value.trim();
  const bairro = document.getElementById("bairro").value.trim();
  const observacao = document.getElementById("observacao").value.trim();
  const senha = document.getElementById("senha").value;
  const senha2 = document.getElementById("senha2").value;

  const allowed = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];
  const domain = email.split("@")[1] || "";
  if (!allowed.includes(domain)) {
    alert("Use um email Gmail, Hotmail, Outlook ou Yahoo.");
    return;
  }

  if (senha !== senha2) {
    alert("As senhas não conferem.");
    return;
  }

  let clientes = await GitHubDB.getClientes();
  if (clientes.some(c => c.email === email)) {
    alert("Já existe um cadastro com esse email.");
    return;
  }

  const salt = "cli-" + crypto.randomUUID();
  const hash = await utils.hashPassword(senha, salt);

  const novoCliente = {
    id: "cli-" + (clientes.length + 1),
    nome,
    cpf,
    telefone,
    email,
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    observacao,
    salt,
    hash,
    role: "cliente"
  };

  clientes.push(novoCliente);
  await GitHubDB.saveClientes(clientsSorted(clientes));

  alert("Cadastro realizado! Redirecionando para o login.");
  location.href = "index.html";
}

// listeners
document.addEventListener("DOMContentLoaded", async () => {
  await initAdmin();

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    const toggleBtn = document.getElementById("togglePassword");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const inp = document.getElementById("loginPassword");
        inp.type = inp.type === "password" ? "text" : "password";
      });
    }
  }

  const cadastroForm = document.getElementById("cadastroForm");
  if (cadastroForm) {
    cadastroForm.addEventListener("submit", handleCadastro);

    const cpf = document.getElementById("cpf");
    cpf.addEventListener("input", e => {
      e.target.value = utils.maskCPF(e.target.value);
    });
    const tel = document.getElementById("telefone");
    tel.addEventListener("input", e => {
      e.target.value = utils.maskTelefone(e.target.value);
    });
    const cep = document.getElementById("cep");
    cep.addEventListener("input", async e => {
      e.target.value = utils.maskCEP(e.target.value);
      const clean = e.target.value.replace(/D/g, "");
      if (clean.length === 8) {
        const info = await utils.fetchCEP(clean);
        if (info) {
          document.getElementById("endereco").value = `${info.logradouro}, ${info.localidade} - ${info.uf}`;
          document.getElementById("bairro").value = info.bairro || "";
        }
      }
    });
  }
});
