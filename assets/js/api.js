// assets/js/api.js
// Camada de "banco de dados" usando arquivos JSON no próprio repositório via GitHub Contents API.

(function () {
  const OWNER = "SEU_USUARIO_GITHUB";      // <- troque aqui
  const REPO = "SEU_REPOSITORIO";         // <- troque aqui
  const BRANCH = "main";
  const BASE_PATH = "data";
  const API_BASE = "https://api.github.com";

  // IDEAL: repositório privado para não expor o token.
  const TOKEN = "SEU_TOKEN_AQUI";

  async function githubFetch(path, options = {}) {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };

    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API erro ${res.status}: ${text}`);
    }
    return res.json();
  }

  async function load(key, defaultValue) {
    const path = `${BASE_PATH}/${key}.json`;
    try {
      const data = await githubFetch(
        `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`
      );
      const content = atob(data.content.replace(/
/g, ""));
      return JSON.parse(content);
    } catch (err) {
      if (String(err).includes("404")) return defaultValue;
      console.error("GitHubDB load error", err);
      throw err;
    }
  }

  async function save(key, value, message = "Atualizando dados via site") {
    const path = `${BASE_PATH}/${key}.json`;
    const contentStr = JSON.stringify(value, null, 2);
    const contentB64 = btoa(unescape(encodeURIComponent(contentStr)));

    let sha;
    try {
      const fileData = await githubFetch(
        `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`
      );
      sha = fileData.sha;
    } catch (err) {
      if (!String(err).includes("404")) {
        console.error("GitHubDB get sha error", err);
        throw err;
      }
      sha = undefined;
    }

    const body = {
      message,
      content: contentB64,
      branch: BRANCH,
      path
    };
    if (sha) body.sha = sha;

    return githubFetch(
      `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );
  }

  const GitHubDB = {
    load,
    save,

    getClientes: () => load("clientes", []),
    saveClientes: data => save("clientes", data, "Atualizando clientes"),

    getMateriais: () => load("materiais", []),
    saveMateriais: data => save("materiais", data, "Atualizando materiais"),

    getServicos: () => load("servicos", []),
    saveServicos: data => save("servicos", data, "Atualizando serviços"),

    getAgendamentos: () => load("agendamentos", []),
    saveAgendamentos: data => save("agendamentos", data, "Atualizando agendamentos"),

    getCupons: () => load("cupons", []),
    saveCupons: data => save("cupons", data, "Atualizando cupons"),

    getCuponsUsados: () => load("cuponsUsados", []),
    saveCuponsUsados: data =>
      save("cuponsUsados", data, "Atualizando cupons usados"),

    getLogsAdmin: () => load("log_acessos_admin", []),
    saveLogsAdmin: data =>
      save("log_acessos_admin", data, "Atualizando logs admin")
  };

  window.GitHubDB = GitHubDB;
})();
