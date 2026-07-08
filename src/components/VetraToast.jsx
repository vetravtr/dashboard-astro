// VETRA Toast — componente de notificação estilizado
// Substitui os alert() padrão do navegador por um modal no padrão VETRA

const VETRA_TOAST_ID = "vetra-toast-root";

let toastRoot = null;

function getOrCreateRoot() {
  if (toastRoot) return toastRoot;
  
  // Verificar se já existe no DOM
  let existing = document.getElementById(VETRA_TOAST_ID);
  if (existing) {
    toastRoot = existing;
    return toastRoot;
  }
  
  // Criar container
  const div = document.createElement("div");
  div.id = VETRA_TOAST_ID;
  div.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(5, 1, 9, 0.8);
    backdrop-filter: blur(4px);
    font-family: 'Urbanist', 'Inter', sans-serif;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;
  
  div.innerHTML = `
    <div style="
      background: rgb(8, 3, 15);
      border: 1px solid rgba(100, 51, 144, 0.3);
      border-radius: 20px;
      padding: 32px 36px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    ">
      <p id="vetra-toast-msg" style="
        color: #ffffff;
        font-family: 'Urbanist', 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.5;
        margin: 0 0 24px 0;
      "></p>
      <button id="vetra-toast-btn" style="
        background: #643390 !important;
        color: #ffffff !important;
        border: none;
        border-radius: 999px;
        padding: 12px 32px;
        font-family: 'Urbanist', 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      ">OK</button>
    </div>
  `;
  
  // Hover no botão
  const btn = div.querySelector("#vetra-toast-btn");
  btn.addEventListener("mouseenter", () => btn.style.background = "#9A3CEB");
  btn.addEventListener("mouseleave", () => btn.style.background = "#643390");
  
  document.body.appendChild(div);
  toastRoot = div;
  
  // Fechar ao clicar no fundo ou no botão
  div.addEventListener("click", (e) => {
    if (e.target === div || e.target === btn) closeToast();
  });
  
  // Fechar com Escape
  const escHandler = (e) => { if (e.key === "Escape") { closeToast(); document.removeEventListener("keydown", escHandler); } };
  document.addEventListener("keydown", escHandler);
  
  return div;
}

function closeToast() {
  if (!toastRoot) return;
  toastRoot.style.opacity = "0";
  setTimeout(() => {
    if (toastRoot && toastRoot.parentNode) {
      toastRoot.parentNode.removeChild(toastRoot);
    }
    toastRoot = null;
  }, 200);
}

export function vetraToast(message) {
  const root = getOrCreateRoot();
  const msgEl = root.querySelector("#vetra-toast-msg");
  if (msgEl) msgEl.textContent = message;
  
  // Mostrar
  requestAnimationFrame(() => {
    root.style.opacity = "1";
  });
}

// Substituir window.alert globalmente
export function overrideAlert() {
  window.vetraAlert = vetraToast;
}
