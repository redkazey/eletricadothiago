// Importando o Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAeKlND06Jkjg_cNU7-zaRtdDRGHSKJo08",
  authDomain: "eletricadothiago-c2794.firebaseapp.com",
  projectId: "eletricadothiago-c2794",
  storageBucket: "eletricadothiago-c2794.appspot.app",
  messagingSenderId: "363660591943",
  appId: "1:363660591943:web:c9a41df1c6e0ef34c5c262",
  measurementId: "G-BYS08ZWM6F"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Função de cadastro de usuário
export const cadastrarUsuario = async (email, senha) => {
  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    console.log("Usuário criado com sucesso!");
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error.message);
  }
};

// Função de login de usuário
export const loginUsuario = async (email, senha) => {
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    console.log("Usuário logado com sucesso!");
  } catch (error) {
    console.error("Erro ao fazer login:", error.message);
  }
};

// Função para salvar agendamento
export const salvarAgendamento = async (nome, data) => {
  try {
    const docRef = await addDoc(collection(db, "agendamentos"), {
      nome: nome,
      data: data,
    });
    console.log("Agendamento salvo com ID:", docRef.id);
  } catch (error) {
    console.error("Erro ao salvar agendamento:", error.message);
  }
};

// Função para buscar agendamentos
export const obterAgendamentos = async () => {
  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  const agendamentos = querySnapshot.docs.map(doc => doc.data());
  return agendamentos;
};
