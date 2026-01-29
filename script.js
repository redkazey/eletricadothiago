import { cadastrarUsuario, loginUsuario, salvarAgendamento, obterAgendamentos } from './firebase.js';

// Função de cadastro
async function salvarNovoCliente() {
  const nome = document.getElementById("cad-nome").value;
  const email = document.getElementById("cad-email").value;
  const senha = document.getElementById("cad-senha").value;

  if (!nome || !email || !senha) return alert("Preencha todos os campos!");

  await cadastrarUsuario(email, senha);
  alert("Cadastro realizado com sucesso!");
  showSec('sec-login');
}

// Função de login
async function realizarLogin() {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  await loginUsuario(email, senha);
  alert("Login realizado com sucesso!");
  showSec('sec-cliente');
  document.getElementById("client-name").innerText = email.split('@')[0]; // Nome do cliente (pode ser ajustado)
}

// Função de agendamento
async function agendar() {
  const nomeCliente = document.getElementById("client-name").innerText;
  const dataAgendamento = document.getElementById("data-agendamento").value;

  if (!dataAgendamento) return alert("Por favor, selecione uma data no calendário!");

  await salvarAgendamento(nomeCliente, dataAgendamento);
  alert("Agendamento realizado com sucesso!");
}

// Função para alternar as seções
function showSec(id) {
  document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
