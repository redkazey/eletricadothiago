// assets/js/utils.js

function maskCPF(value) {
  return value
    .replace(/D/g, "")
    .replace(/(d{3})(d)/, "$1.$2")
    .replace(/(d{3})(d)/, "$1.$2")
    .replace(/(d{3})(d{1,2})$/, "$1-$2");
}

function maskTelefone(value) {
  return value
    .replace(/D/g, "")
    .replace(/(d{2})(d)/, "($1) $2")
    .replace(/(d{5})(d{4})$/, "$1-$2");
}

function maskCEP(value) {
  return value.replace(/D/g, "").replace(/(d{5})(d)/, "$1-$2");
}

async function fetchCEP(cep) {
  cep = cep.replace(/D/g, "");
  if (cep.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await res.json();
  if (data.erro) return null;
  return data;
}

// localStorage apenas para sessão / tentativas
function loadLS(key, defaultValue) {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}
function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Hash irreversível com PBKDF2 + salt
async function hashPassword(password, saltStr) {
  const enc = new TextEncoder();
  const salt = enc.encode(saltStr);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(rawKey)));
}

async function verifyPassword(password, salt, hashStored) {
  const hashTest = await hashPassword(password, salt);
  return hashTest === hashStored;
}

// Exportações simples
function exportCSV(filename, rows) {
  const processRow = row =>
    row
      .map(v => {
        if (v === null || v === undefined) return "";
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
      .join(",");
  const csvContent = rows.map(processRow).join("
");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function exportPDFPrint() {
  window.print();
}

window.utils = {
  maskCPF,
  maskTelefone,
  maskCEP,
  fetchCEP,
  loadLS,
  saveLS,
  hashPassword,
  verifyPassword,
  exportCSV,
  exportPDFPrint
};
