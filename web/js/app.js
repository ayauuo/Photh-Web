// 禁用右鍵選單
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// 禁用拖移圖片／影片（避免使用者拖走畫面元素）
document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
});

// 禁用常見的開發者工具快捷鍵
document.addEventListener('keydown', (e) => {
    // 禁用 F12 (開發者工具)
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    // 禁用 Ctrl+Shift+I (開發者工具)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }
    // 禁用 Ctrl+Shift+J (控制台)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
    }
    // 禁用 Ctrl+U (查看原始碼)
    if (e.ctrlKey && e.key === 'U') {
        e.preventDefault();
        return false;
    }
    // 禁用 Ctrl+S (儲存頁面)
    if (e.ctrlKey && e.key === 'S') {
        e.preventDefault();
        return false;
    }
});

const logEl = document.getElementById('log');
const hintEl = document.getElementById('hint');
const loadingOver = document.getElementById('loading-overlay');

// Helper to toggle loading spinner
const setLoading = (show) => { 
  if (loadingOver) loadingOver.style.display = show ? "flex" : "none"; 
};

const log = (s) => { 
  if (logEl) logEl.textContent += s + "\n"; 
  console.log(s);
};

// 計數器相關元素和變數
const totalAmountEl = document.getElementById('total-amount');
const lastAmountEl = document.getElementById('last-amount');
let totalAmount = 0; // 總金額

const screens = {
  idle: document.getElementById('screen-idle'),
  payment: document.getElementById('screen-payment'),
  template: document.getElementById('screen-template'),
  shoot: document.getElementById('screen-shoot'),
  "shoot-preview": document.getElementById('screen-shoot-preview'),
  result: document.getElementById('screen-result'),
  processing: document.getElementById('screen-processing'),
};
function showScreen(name) {
  console.log(`showScreen 被調用，目標畫面：${name}`);
  
  // 檢查目標畫面是否存在
  if (!screens[name]) {
    console.error(`錯誤：找不到畫面 "${name}"`);
    return;
  }
  
  // 移除所有畫面的 active 類
  Object.values(screens).forEach(el => {
    if (el) el.classList.remove('active');
  });
  
  // 添加目標畫面的 active 類
  screens[name].classList.add('active');
  console.log(`✓ 已切換到畫面：${name}`);
  
  if (name === "shoot-preview") populateShootPreviewScreen();

  // 切換到選版型頁面時重置計數器
  if (name === "template") {
    resetPaymentCounter();
    // 禁用紙鈔機（進入選擇版型頁面後停止接收紙鈔）
    notifyBillAcceptorState(false);
  }
  // 回到待機畫面時重新啟用紙鈔機
  if (name === "idle") {
    notifyBillAcceptorState(true);
  }
}

// 通知後端紙鈔機的啟用/禁用狀態
function notifyBillAcceptorState(enabled) {
  try {
    if (window.chrome && window.chrome.webview) {
      const message = JSON.stringify({
        "@event": "bill_acceptor_control",
        enabled: enabled
      });
      window.chrome.webview.postMessage(message);
      console.log(`已通知後端：紙鈔機 ${enabled ? '啟用' : '禁用'}`);
    }
  } catch (ex) {
    console.error("通知紙鈔機狀態失敗：", ex);
  }
}

function callHost(cmd, data = {}) {
  if (!window.chrome || !window.chrome.webview) {
    if (cmd === "save_image") return Promise.resolve({ filePath: "C:\\PhotoBooth\\Out\\mock.jpg" });
    if (cmd === "upload") return Promise.resolve({ url: "https://example.com/download/mock.jpg" });
    if (cmd === "print_hotfolder") return Promise.resolve({ copies: data.copies || 1 });
    return Promise.resolve({});
  }
  const id = crypto.randomUUID();
  const req = { id, cmd, data };
  return new Promise((resolve, reject) => {
    const handler = (ev) => {
      try {
        const res = JSON.parse(ev.data);
        if (!res.id || res.id !== id) return;
        window.chrome.webview.removeEventListener("message", handler);
        res.ok ? resolve(res.data) : reject(res.error);
      } catch {}
    };
    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage(JSON.stringify(req));
    setTimeout(() => reject("timeout"), 60000);
  });
}

// 按鈕事件監聽器（如果元素存在）
const btnStart = document.getElementById('btn-start');
if (btnStart) btnStart.addEventListener('click', () => showScreen("payment"));
const btnPaid = document.getElementById('btn-paid');
if (btnPaid) btnPaid.addEventListener('click', () => showScreen("template"));
const btnPaid2 = document.getElementById('btn-paid-2');
if (btnPaid2) btnPaid2.addEventListener('click', () => showScreen("template"));

// 測試按鈕：直接進入各個頁面
document.getElementById('btn-test-payment').addEventListener('click', () => showScreen("idle"));
document.getElementById('btn-test-template').addEventListener('click', () => showScreen("template"));
document.getElementById('btn-test-shoot').addEventListener('click', () => {
  if (!selectedTemplate && templates.length > 0) selectedTemplate = templates[getDefaultTemplateIndex()];
  showScreen("shoot");
});
document.getElementById('btn-test-shoot-preview').addEventListener('click', () => {
  if (!selectedTemplate && templates.length > 0) selectedTemplate = templates[getDefaultTemplateIndex()];
  showScreen("shoot-preview");
});
document.getElementById('btn-shoot-preview-next').addEventListener('click', () => {
  buildFinalOutput();
});
document.getElementById('btn-test-processing').addEventListener('click', () => showScreen("processing"));
document.getElementById('btn-test-result').addEventListener('click', () => {
  // 為了測試結果頁面，需要設置一些模擬數據
  const finalPreview = document.getElementById('final-preview');
  const qrImage = document.getElementById('qr-image');
  const qrText = document.getElementById('qr-text');
  if (finalPreview) {
    finalPreview.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  }
  if (qrImage) {
    qrImage.src = "https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://example.com/test";
  }
  if (qrText) {
    qrText.textContent = "https://example.com/test";
  }
  showScreen("result");
});

// 直接拍照並列印按鈕
document.getElementById('btn-quick-print').addEventListener('click', async () => {
  // 設置自動列印標記
  autoPrint = true;
  // 自動選擇第一個版型
  if (templates.length > 0) {
    selectedTemplate = templates[getDefaultTemplateIndex()];
    console.log('快速列印：自動選擇版型', selectedTemplate.id);
    // 啟動拍照流程
    await startShootFlow();
  } else {
    console.error('沒有可用的版型');
    autoPrint = false;
  }
});

// 更新計數器顯示
function updatePaymentCounter(amount) {
  if (!totalAmountEl || !lastAmountEl) return;
  
  totalAmount += amount;
  totalAmountEl.textContent = `NT$ ${totalAmount}`;
  lastAmountEl.textContent = `剛剛收到：NT$ ${amount}`;
  
  // 3 秒後恢復提示文字
  setTimeout(() => {
    if (lastAmountEl) {
      lastAmountEl.textContent = totalAmount > 0 ? "等待投幣..." : "等待投幣...";
    }
  }, 3000);
}

// 重置計數器（切換到選版型頁面時）
function resetPaymentCounter() {
  totalAmount = 0;
  if (totalAmountEl) totalAmountEl.textContent = "NT$ 0";
  if (lastAmountEl) lastAmountEl.textContent = "等待投幣...";
}

if (window.chrome && window.chrome.webview) {
  console.log("✓ WebView 消息監聽器已設置");
  window.chrome.webview.addEventListener("message", (ev) => {
    try {
      console.log("收到 WebView 消息：", ev.data);
      const msg = JSON.parse(ev.data);
      console.log("解析後的消息：", msg);
      
      // 檢查事件類型（支援 @event 和 event 兩種格式）
      const eventType = msg["@event"] || msg.event;
      
      if (eventType === "paid") {
        console.log(`收到付款事件：${msg.amount} 元`);
        // 更新計數器
        if (msg.amount) {
          updatePaymentCounter(msg.amount);
          console.log(`計數器已更新，總金額：${totalAmount}`);
        }
        // 如果是 100 元，延遲 1 秒後切換到選版型頁面
        if (msg.amount === 100) {
          console.log("金額為 100 元，將在 1 秒後切換到選版型頁面");
          setTimeout(() => {
            console.log("切換到選版型頁面");
            showScreen("template");
          }, 1000); // 延遲 1 秒
        }
      } else {
        console.log("消息不是付款事件，忽略。事件類型：", eventType);
      }
    } catch (ex) {
      console.error("處理 WebView 消息時發生錯誤：", ex);
      console.error("原始消息數據：", ev.data);
    }
  });
} else {
  console.warn("⚠ WebView API 不可用");
}

const templates = [
  { id: "bk01", preview: "assets/templates/chooselayout/bk01.png", shotCount: 4, sizeKey: "4x6",
    captureW: 544, captureH: 471,
    stageSize: { maxWidth: "1000px", maxHeight: "calc(100vh - 200px)" },
    frameAspectRatio: "544/471",
    width: 1205, height: 1795, slots: [
      { x: 43, y: 244, w: 544, h: 471 },
      { x: 42, y: 1225, w: 544, h: 471 },
      { x: 625, y: 244, w: 544, h: 471 },
      { x: 623, y: 1061, w: 544, h: 471 },
    ] },
  { id: "bk02", preview: "assets/templates/chooselayout/bk02.png", shotCount: 4, sizeKey: "4x6",
    captureW: 547, captureH: 405,
    stageSize: { maxWidth: "1000px", maxHeight: "calc(100vh - 200px)" },
    frameAspectRatio: "547/405",
    width: 1205, height: 1795, slots: [
      { x: 39, y: 667, w: 547, h: 405 },
      { x: 39, y: 1158, w: 547, h: 405 },
      { x: 662, y: 667, w: 547, h: 405 },
      { x: 662, y: 1158, w: 547, h: 405 },
    ] },
  { id: "bk03", preview: "assets/templates/chooselayout/bk03.png", shotCount: 2, sizeKey: "4x6",
    captureW: 524, captureH: 502,
    stageSize: { maxWidth: "1000px", maxHeight: "calc(100vh - 200px)" },
    frameAspectRatio: "524/502",
    width: 1205, height: 1795, slots: [
      { x: 56, y: 1004, w: 524 , h: 502 },
      { x: 637, y: 590, w: 524, h: 502 },
    ] },
  { id: "bk04", preview: "assets/templates/chooselayout/bk04.png", shotCount: 4, sizeKey: "4x6",
    captureW: 529, captureH: 400,
    stageSize: { maxWidth: "1000px", maxHeight: "calc(100vh - 200px)" },
    frameAspectRatio: "529/400",
    width: 1205, height: 1795, slots: [
      { x: 54, y: 761, w: 529, h: 400 },
      { x: 632, y: 761, w: 529, h: 400 },
      { x: 54, y: 1290, w: 529, h: 400 },
      { x: 632, y: 1290, w: 529, h: 400 },
    ] },
];

/** 預設版型索引（由 js/fortest/dev-start-page.js 的 DEFAULT_TEMPLATE_INDEX 控制，0=bk01, 1=bk02, 2=bk03, 3=bk04） */
function getDefaultTemplateIndex() {
  if (!templates || !templates.length) return 0;
  const idx = typeof window !== "undefined" && window.DEFAULT_TEMPLATE_INDEX;
  if (typeof idx !== "number" || idx < 0) return 0;
  return Math.min(idx, templates.length - 1);
}

const previewExts = [".jpg", ".jpeg", ".png", ".webp"];
function setPreviewImage(img, base) {
  if (!img || !base) return;
  const hasExt = /\.[a-z0-9]+$/i.test(base);
  const candidates = hasExt ? [base] : previewExts.map(ext => base + ext);
  let idx = 0;
  const tryNext = () => {
    if (idx >= candidates.length) return;
    img.src = candidates[idx++];
  };
  img.addEventListener("error", tryNext);
  tryNext();
}

const templateListEl = document.getElementById('template-list');
let selectedTemplate = null;

function renderTemplateList() {
  templateListEl.innerHTML = "";
  selectedTemplate = null;
  templateListEl.classList.remove('has-selection');
  templates.forEach(t => {
    const card = document.createElement('div');
    card.className = "screen-template__card";
    card.innerHTML = `
      <div class="screen-template__card-preview">
        <img class="screen-template__card-img" alt="${t.id}">
      </div>
    `;
    const img = card.querySelector(".screen-template__card-img");
    setPreviewImage(img, t.preview);
    card.addEventListener('click', () => {
      if (card.classList.contains('is-selected')) {
        showTemplateMsgbox();
        return;
      }
      selectedTemplate = t;
      document.querySelectorAll('.screen-template__card').forEach(el => el.classList.remove('is-selected'));
      card.classList.add('is-selected');
      templateListEl.classList.add('has-selection');
    });
    templateListEl.appendChild(card);
  });
}
renderTemplateList();

const templateMsgboxEl = document.getElementById('template-msgbox');
const templateMsgboxConfirmBtn = document.getElementById('template-msgbox-confirm');
const templateMsgboxRepeatBtn = document.getElementById('template-msgbox-repeat');

function showTemplateMsgbox() {
  if (templateMsgboxEl) templateMsgboxEl.classList.remove('screen-template__msgbox--hidden');
}

function hideTemplateMsgbox() {
  if (templateMsgboxEl) templateMsgboxEl.classList.add('screen-template__msgbox--hidden');
}

if (templateMsgboxConfirmBtn) {
  templateMsgboxConfirmBtn.addEventListener('click', () => {
    hideTemplateMsgbox();
    showScreen("shoot");
  });
}
if (templateMsgboxRepeatBtn) {
  templateMsgboxRepeatBtn.addEventListener('click', () => {
    hideTemplateMsgbox();
  });
}

// 等比例縮放並填充（cover模式，會裁剪）
function drawCoverImage(ctx, img, dx, dy, dw, dh) {
  const srcAspect = img.width / img.height;
  const dstAspect = dw / dh;
  let sx, sy, sw, sh;
  if (srcAspect > dstAspect) {
    sh = img.height; sw = Math.round(img.height * dstAspect);
    sx = Math.round((img.width - sw) / 2); sy = 0;
  } else {
    sw = img.width; sh = Math.round(img.width / dstAspect);
    sx = 0; sy = Math.round((img.height - sh) / 2);
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// 等比例縮放並適應（contain模式，保持完整，可能留白）
function drawContainImage(ctx, img, dx, dy, dw, dh) {
  const srcAspect = img.width / img.height;
  const dstAspect = dw / dh;
  let targetW, targetH, offsetX, offsetY;
  
  if (srcAspect > dstAspect) {
    // 圖片較寬，以寬度為準
    targetW = dw;
    targetH = dw / srcAspect;
    offsetX = 0;
    offsetY = (dh - targetH) / 2;
  } else {
    // 圖片較高，以高度為準
    targetH = dh;
    targetW = dh * srcAspect;
    offsetX = (dw - targetW) / 2;
    offsetY = 0;
  }
  
  ctx.drawImage(img, 0, 0, img.width, img.height, dx + offsetX, dy + offsetY, targetW, targetH);
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

document.getElementById('btn-print-wrapper').addEventListener('click', async () => {
  if (!finalFilePath) return;
  let copies = parseInt(document.getElementById('copies').value, 10);
  if (Number.isNaN(copies)) copies = 1;
  copies = Math.min(5, Math.max(1, copies));
  document.getElementById('copies').value = copies;
  showScreen("processing");
  await callHost("print_hotfolder", {
    filePath: finalFilePath,
    sizeKey: selectedTemplate ? selectedTemplate.sizeKey : "4x6",
    copies
  });
  // 重置自動列印標記
  autoPrint = false;
  resetSession();
  showScreen("idle");
});

// Mock QR Code Generation Function
// Currently returns external API, can be replaced with local asset or custom implementation
async function generateQRCode(data) {
  // Option 1: Use external API (current)
  // return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  
  // Option 2: Mock - return a placeholder (for offline testing)
  // return "assets/templates/common/qr_placeholder.png";
  
  // Using external API for now
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

function generatePlaceholderQR() {
  // Generate a simple placeholder image as data URI
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = '#999';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR Code', 100, 100);
  return canvas.toDataURL();
}
