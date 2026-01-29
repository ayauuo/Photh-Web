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
  processing: document.getElementById('screen-processing'),
  result: document.getElementById('screen-result'),
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
  
  if (name === "shoot") startCamera();
  if (name !== "shoot") stopCamera();
  
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
document.getElementById('btn-test-payment').addEventListener('click', () => showScreen("payment"));
document.getElementById('btn-test-template').addEventListener('click', () => showScreen("template"));
document.getElementById('btn-test-shoot').addEventListener('click', () => {
  // 確保有選中的版型，如果沒有則使用第一個
  if (!selectedTemplate && templates.length > 0) {
    selectedTemplate = templates[0];
  }
  if (selectedTemplate) {
    startShootFlow();
  } else {
    showScreen("shoot");
  }
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
    selectedTemplate = templates[0];
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
    stageSize: { maxWidth: "1200px", maxHeight: "calc(100vh - 200px)" },
    width: 1205, height: 1795, slots: [
      { x: 43, y: 244, w: 544, h: 471 },
      { x: 42, y: 1225, w: 544, h: 471 },
      { x: 625, y: 244, w: 544, h: 471 },
      { x: 623, y: 1061, w: 544, h: 471 },
    ] },
  { id: "bk02", preview: "assets/templates/chooselayout/bk02.png", shotCount: 4, sizeKey: "4x6",
    captureW: 547, captureH: 405,
    stageSize: { maxWidth: "1200px", maxHeight: "calc(100vh - 200px)" },
    width: 1205, height: 1795, slots: [
      { x: 39, y: 667, w: 547, h: 405 },
      { x: 39, y: 1158, w: 547, h: 405 },
      { x: 662, y: 667, w: 547, h: 405 },
      { x: 662, y: 1158, w: 547, h: 405 },
    ] },
  { id: "bk03", preview: "assets/templates/chooselayout/bk03.png", shotCount: 2, sizeKey: "4x6",
    captureW: 524, captureH: 502,
    stageSize: { maxWidth: "1200px", maxHeight: "calc(100vh - 200px)" },
    width: 1205, height: 1795, slots: [
      { x: 56, y: 1004, w: 524 , h: 502 },
      { x: 637, y: 590, w: 524, h: 502 },
    ] },
  { id: "bk04", preview: "assets/templates/chooselayout/bk04.png", shotCount: 4, sizeKey: "4x6",
    captureW: 529, captureH: 400,
    stageSize: { maxWidth: "1200px", maxHeight: "calc(100vh - 200px)" },
    width: 1205, height: 1795, slots: [
      { x: 54, y: 761, w: 529, h: 400 },
      { x: 632, y: 761, w: 529, h: 400 },
      { x: 54, y: 1290, w: 529, h: 400 },
      { x: 632, y: 1290, w: 529, h: 400 },
    ] },
];

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
const templateNextBtn = document.getElementById('btn-template-next');
let selectedTemplate = null;

function updateStageSize() {
  const stageEl = document.querySelector('#screen-shoot .stage');
  if (!stageEl) return;

  const size = selectedTemplate?.stageSize;
  // 沒設定就回到 CSS 預設（清掉 inline style）
  if (!size) {
    stageEl.style.maxWidth = "";
    stageEl.style.maxHeight = "";
    return;
  }

  if (size.maxWidth != null) stageEl.style.maxWidth = size.maxWidth;
  if (size.maxHeight != null) stageEl.style.maxHeight = size.maxHeight;
}

function renderTemplateList() {
  templateListEl.innerHTML = "";
  let firstCard = null;
  templates.forEach(t => {
    const card = document.createElement('div');
    card.className = "template-card";
    if (!firstCard) firstCard = card;
    card.innerHTML = `
      <div class="template-preview">
        <img class="template-img" alt="${t.id}">
      </div>
    `;
    const img = card.querySelector(".template-img");
    setPreviewImage(img, t.preview);
    card.addEventListener('click', () => {
      selectedTemplate = t;
      document.querySelectorAll('.template-card').forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      updateStageSize();
    });
    templateListEl.appendChild(card);
  });
  if (templates.length > 0 && firstCard) {
    selectedTemplate = templates[0];
    firstCard.classList.add('selected');
    updateStageSize();
  }
}
renderTemplateList();

templateNextBtn.addEventListener('click', () => {
  console.log('btn-template-next clicked');
  if (!selectedTemplate && templates.length > 0) selectedTemplate = templates[0];
  if (!selectedTemplate) {
    console.error('No template selected');
    return;
  }
  console.log('Starting shoot flow with template:', selectedTemplate.id);
  startShootFlow();
});

const v = document.getElementById('v');
const bigimg = document.getElementById('bigimg');
const bigFrame = document.getElementById('bigFrame');
const countEl = document.getElementById('count');
const retakeBtn = document.getElementById('retake');
const nextBtn = document.getElementById('next');
const filtersPanel = document.getElementById('filters');
const thumbs = [document.getElementById('t0'), document.getElementById('t1'),
  document.getElementById('t2'), document.getElementById('t3')];

// 切換濾鏡模式 UI（濾鏡欄顯示；縮圖欄不隱藏，避免「圖片不見了」）
function setFilterModeUI(active) {
  if (filtersPanel) filtersPanel.classList.toggle('active', active);
}
const thumbFrames = [document.getElementById('tf0'), document.getElementById('tf1'),
  document.getElementById('tf2'), document.getElementById('tf3')];
const EMPTY_SRC = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

// 載入框圖
function loadFrameImage(element, templateId, viewIndex) {
  if (!element || !templateId) return;
  const framePath = `assets/templates/ShootPage/${templateId}_view${String(viewIndex).padStart(2, '0')}.png`;
  element.src = framePath;
  element.onerror = () => {
    // 如果框圖不存在，隱藏元素
    element.style.display = 'none';
  };
  element.onload = () => {
    element.style.display = '';
  };
}

// 更新縮圖框（根據版型載入所有框）
function updateThumbFrames() {
  if (!selectedTemplate) return;
  const count = getShotCount();
  for (let i = 0; i < count; i++) {
    if (thumbFrames[i]) {
      loadFrameImage(thumbFrames[i], selectedTemplate.id, i + 1);
    }
  }
  // 隱藏不需要的框
  for (let i = count; i < 4; i++) {
    if (thumbFrames[i]) {
      thumbFrames[i].style.display = 'none';
    }
  }
}

// 更新大框（根據版型和當前拍攝進度）
function updateBigFrame(shotIndex) {
  if (!selectedTemplate || !bigFrame) return;
  loadFrameImage(bigFrame, selectedTemplate.id, shotIndex + 1);
  // 更新右側大框的進度標示
  updateStageCounter(shotIndex);
}

// 更新右側大框的進度標示
function updateStageCounter(shotIndex) {
  const stageCounterEl = document.getElementById('stage-counter');
  if (!stageCounterEl) return;
  const count = getShotCount();
  const current = shotIndex + 1;
  stageCounterEl.textContent = `${current}/${count}`;
}

const COUNTDOWN_SECONDS = window.APP_CONFIG ? window.APP_CONFIG.countdown_seconds : 1;

let stream = null;
let mode = "shooting";
let selected = -1;
let shots = [null, null, null, null];
let shotFiles = [null, null, null, null];
let retaken = [false, false, false, false];
let rawShots = [null, null, null, null];
// GLOBAL FILTER STATE: One set for ALL photos (Version 2 Feature)
let globalFilters = new Set();
let finalFilePath = "";
let finalDataUrl = "";
let autoPrint = false; // 標記是否需要自動列印
let faceMesh = null;
let canvasFx = null;
let warpTasks = [];

function getShotCount() { return selectedTemplate?.shotCount || 4; }

function resetSession() {
  shots = [null, null, null, null];
  shotFiles = [null, null, null, null];
  retaken = [false, false, false, false];
  rawShots = [null, null, null, null];
  globalFilters.clear();
  selected = -1;
  finalFilePath = "";
  finalDataUrl = "";
  autoPrint = false; // 重置自動列印標記
  thumbs.forEach(t => {
    t.src = EMPTY_SRC;
    t.classList.add("disabled");
    t.classList.remove("selected");
    t.style.filter = "none";
    t.style.display = "";
  });
  thumbFrames.forEach(tf => {
    if (tf) tf.style.display = "none";
  });
  if (bigimg) { bigimg.style.filter = "none"; bigimg.style.display = "none"; }
  if (bigFrame) { bigFrame.style.display = "none"; }
  if (v) v.style.display = "";
  setFilterModeUI(false);
  if (logEl) logEl.textContent = "";
  // 重置進度標示
  const stageCounterEl = document.getElementById('stage-counter');
  if (stageCounterEl) {
    const count = getShotCount();
    stageCounterEl.textContent = `1/${count}`;
  }
  applyShotCountToThumbs();
}

function applyShotCountToThumbs() {
  const count = getShotCount();
  for (let i = 0; i < 4; i++) {
    const visible = i < count;
    const thumbItem = thumbs[i].closest('.thumb-preview-item');
    if (thumbItem) {
      const label = thumbItem.querySelector('.thumb-label');
      if (label) {
        label.textContent = `${i + 1}/${count}`;
      }
      thumbItem.style.display = visible ? "" : "none";
    }
    thumbs[i].style.display = visible ? "" : "none";
    if (!visible) {
      thumbs[i].classList.remove("selected");
      thumbs[i].classList.add("disabled");
    }
  }
  if (selected >= count) selected = count > 0 ? 0 : -1;
}

function setThumbClickable(clickable) {
  const count = getShotCount();
  for (let i = 0; i < 4; i++) {
    const canClick = clickable && i < count;
    thumbs[i].classList.toggle('disabled', !canClick);
  }
}
function renderSelection() {
  for (let i = 0; i < 4; i++) thumbs[i].classList.toggle('selected', i === selected);
}
function showCameraOnStage() {
  v.style.display = "";
  bigimg.style.display = "none";
}
function showImageOnStage(dataUrl) {
  bigimg.src = dataUrl;
  bigimg.style.display = "";
  v.style.display = "none";
  if (selected >= 0) applyFilterPreviewToUI(selected);
}
function updateButtons() {
  const count = getShotCount();
  if (mode === "review") {
    nextBtn.style.display = "";
    // Retake allowed only if not already retaken
    const canRetake = selected >= 0 && selected < count && !retaken[selected];
    retakeBtn.style.display = canRetake ? "" : "none";
    retakeBtn.disabled = !canRetake;
    nextBtn.disabled = false;
    // Hide filters in initial review
    setFilterModeUI(false);
  } else if (mode === "retaking") {
    retakeBtn.style.display = "";
    nextBtn.style.display = "";
    retakeBtn.disabled = true;
    nextBtn.disabled = true;
    setFilterModeUI(false);
  } else if (mode === "filter") {
    retakeBtn.style.display = "none";
    nextBtn.style.display = "";
    nextBtn.disabled = false;
    // Show filters only in filter mode（左欄濾鏡、隱藏縮圖）
    setFilterModeUI(true);
  } else {
    // Shooting or Idle
    retakeBtn.style.display = "none";
    nextBtn.style.display = "none";
    setFilterModeUI(false);
  }
}

async function startCamera() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    v.srcObject = stream;
    await new Promise((resolve) => {
      if (v.readyState >= 2 && v.videoWidth > 0) return resolve();
      v.onloadedmetadata = () => resolve();
    });
  } catch {}
}
function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach(t => t.stop());
  stream = null;
}

let countdownAudio = null;
function playCountdownSound() {
  try {
    if (!countdownAudio) {
      countdownAudio = new Audio("assets/templates/music/倒數10秒拍照.mp3");
      countdownAudio.volume = 1.0;
    }
    // 重置並播放
    countdownAudio.currentTime = 0;
    countdownAudio.play().catch(() => {
      // 如果播放失敗（例如用戶還沒互動），靜默處理
    });
  } catch {}
}
async function countdown(seconds) {
  playCountdownSound();
  await new Promise(r => setTimeout(r, 1500));
  for (let i = seconds; i >= 0; i--) {
    countEl.textContent = i;
    await new Promise(r => setTimeout(r, 1000));
  }
  countEl.textContent = "";
}

const CAP_W = 1600;
const CAP_H = 900;
function drawCoverVideoToCanvas(ctx, video, dw, dh) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return false;
  const dstAspect = dw / dh;
  const srcAspect = vw / vh;
  let sx, sy, sw, sh;
  if (srcAspect > dstAspect) {
    sh = vh; sw = Math.round(vh * dstAspect);
    sx = Math.round((vw - sw) / 2); sy = 0;
  } else {
    sw = vw; sh = Math.round(vw / dstAspect);
    sx = 0; sy = Math.round((vh - sh) / 2);
  }
     // 鏡像效果：先平移，再水平翻轉
     ctx.save();
     ctx.translate(dw, 0);
     ctx.scale(-1, 1);
     ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
     ctx.restore();
     return true;
}
function getCaptureSize() {
  if (selectedTemplate && selectedTemplate.captureW != null && selectedTemplate.captureH != null)
    return { w: selectedTemplate.captureW, h: selectedTemplate.captureH };
  return { w: CAP_W, h: CAP_H };
}

function captureToDataUrl() {
  if (!v.videoWidth || !v.videoHeight) return null;
  const size = getCaptureSize();
  const canvas = document.createElement('canvas');
  canvas.width = size.w; canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const ok = drawCoverVideoToCanvas(ctx, v, canvas.width, canvas.height);
  if (!ok) return null;
  return canvas.toDataURL('image/jpeg', 0.95);
}

// AI / Filter Logic
async function applyWarp(dataUrl, set) {
  if (!faceMesh || !canvasFx) {
      console.warn("FaceMesh or CanvasFx not initialized.");
      return dataUrl;
  }
  if (!dataUrl) return dataUrl;
  
  const img = await loadImage(dataUrl);
  
  let results = null;
  // Queue resolver
  const p = new Promise(r => warpTasks.push(r));
  
  try {
      await faceMesh.send({image: img});
      results = await p;
  } catch(e) {
      console.error("FaceMesh Error:", e);
      return dataUrl;
  }
  
  // If no faces, simply return original without alert
  if (!results || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    console.log("No faces detected in image.");
    return dataUrl;
  }
  
  const texture = canvasFx.texture(img);
  canvasFx.draw(texture);
  
  const w = img.width;
  const h = img.height;

  // Determine Strength from variable
  const SLIM_STRENGTH = window.APP_CONFIG ? window.APP_CONFIG.slim_strength : 0.20;
  const BIG_EYE_STRENGTH = window.APP_CONFIG ? window.APP_CONFIG.big_eye_strength : 0.20;

  // Apply to all detected faces
  for (const landmarks of results.multiFaceLandmarks) {
      const lm = (i) => ({
          x: landmarks[i].x * w,
          y: landmarks[i].y * h
      });

      if (set.has("slim")) {
         // Slim: Target Mandibular Angle (Lower Jaw) with Inward Pull
         // Landmarks: Customizable via config.js
         const jaws = (window.APP_CONFIG && window.APP_CONFIG.jaw_config) 
                      ? window.APP_CONFIG.jaw_config : { left_jaw: 172, right_jaw: 397 };
         
         const lJaw = lm(jaws.left_jaw);
         const rJaw = lm(jaws.right_jaw);
         const chin = lm(152);
         
         // Mouth Landmarks for Inward Offset (Vector reference)
         // 61: Left Mouth Corner, 291: Right Mouth Corner
         const lMouth = lm(61);
         const rMouth = lm(291);
         
         // Calculate Target Points: Move 40% from Jaw towards Mouth
         const lerp = (p1, p2, t) => ({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });
         const targetL = lerp(lJaw, lMouth, 0.4);
         const targetR = lerp(rJaw, rMouth, 0.4);
         
         // Radius calculation (roughly 30% of jaw-chin dist)
         const distL = Math.hypot(lJaw.x - chin.x, lJaw.y - chin.y);
         const radiusFactor = window.APP_CONFIG ? window.APP_CONFIG.slim_radius_factor : 0.3;
         const radius = Math.max(distL * 0.6, 30);
         
         // Apply Pinch at NEW Target Locations
         canvasFx.bulgePinch(targetL.x, targetL.y, radius, -SLIM_STRENGTH);
         canvasFx.bulgePinch(targetR.x, targetR.y, radius, -SLIM_STRENGTH);
         
         // Optional: Slight pinch on chin combined with V-line
         canvasFx.bulgePinch(chin.x, chin.y, radius * 0.8, -0.10);
      }
      
      if (set.has("bigeye")) {
         // BigEye: Bulge eyes
         const lInner = lm(33);
         const lOuter = lm(133);
         const lWidth = Math.hypot(lOuter.x - lInner.x, lOuter.y - lInner.y);
         const lRadius = lWidth * 0.9; 
         const lEye = lm(468);
         canvasFx.bulgePinch(lEye.x, lEye.y, lRadius, BIG_EYE_STRENGTH);

         const rInner = lm(362);
         const rOuter = lm(263);
         const rWidth = Math.hypot(rOuter.x - rInner.x, rOuter.y - rInner.y);
         const rRadius = rWidth * 0.9;
         const rEye = lm(473);
         canvasFx.bulgePinch(rEye.x, rEye.y, rRadius, BIG_EYE_STRENGTH);
      }
  }
  
  canvasFx.update();
  const res = canvasFx.toDataURL('image/jpeg', 0.95);
  texture.destroy();
  return res;
}

function getCssFilterFor(set) {
  let css = "";
  if (set.has("bright")) css += "brightness(1.12) contrast(1.05) saturate(1.08) ";
  if (set.has("film")) css += "contrast(1.12) saturate(0.9) sepia(0.25) ";
  return css.trim() || "none";
}

// Core UI Updater for Filters
async function applyFilterPreviewToUI(index) {
  if (index < 0 || index >= 4) return;
  const set = globalFilters; // Use GLOBAL
  const thumb = thumbs[index];
  
  // 1. Warp (Face Shape)
  if (set.has("slim") || set.has("bigeye")) {
      try {
          if (rawShots[index]) {
             const warped = await applyWarp(rawShots[index], set);
             
             // Safety check: only update if filters match what we just processed
             // (In case user clicked buttons wildly, though LoadingOverlay prevents that)
             shots[index] = warped;
             if (selected === index) bigimg.src = warped;
             thumb.src = warped;
          }
      } catch (e) {
          console.error("Warp failed", e);
      }
  } else {
      // Revert to Raw
      if (rawShots[index]) {
          shots[index] = rawShots[index];
          if (selected === index) bigimg.src = shots[index];
          thumb.src = shots[index];
      }
  }

  // 2. CSS Color (Instant)
  const css = getCssFilterFor(set);
  bigimg.style.filter = css;
  thumb.style.filter = css;
}

async function captureAndStore(index, isRetake = false) {
  const dataUrl = captureToDataUrl();
  if (typeof dataUrl !== "string" || dataUrl.length < 50)
    throw new Error("captureToDataUrl failed");
  
  thumbs[index].src = dataUrl;
  shots[index] = dataUrl;
  rawShots[index] = dataUrl; // Store original
  
  if (selected === index) showImageOnStage(dataUrl);
  
  const res = await callHost("save_image", { base64: dataUrl, ext: "jpg" });
  shotFiles[index] = res.filePath;
  log(`${isRetake ? "重拍" : "拍照"}第 ${index + 1} 張：已存檔 ${res.filePath}`);
}

async function shootSequence() {
  const count = getShotCount();
  mode = "shooting";
  selected = -1;
  setThumbClickable(false);
  updateButtons();
  renderSelection();
  showCameraOnStage();
  hintEl.textContent = `拍攝中：每張倒數 ${COUNTDOWN_SECONDS} 秒`;
  updateThumbFrames();
  
  await startCamera();
  for (let i = 0; i < count; i++) {
    updateBigFrame(i);
    await countdown(COUNTDOWN_SECONDS);
    await captureAndStore(i, false);
  }
  
  mode = "review";
  setThumbClickable(true);
  thumbs.forEach(t => t.style.filter = "none");
  bigimg.style.filter = "none";
  setFilterModeUI(false);
  
  selected = count > 0 ? 0 : -1;
  renderSelection();
  if (selected >= 0) {
    showImageOnStage(shots[selected]);
    updateBigFrame(selected);
  }
  syncFilterButtons();
  hintEl.textContent = "拍完了：點縮圖可重拍，滿意請按下一步";
  updateButtons();
}

function syncFilterButtons() {
  const set = globalFilters;
  document.querySelectorAll(".fbtn").forEach(b => {
    const k = b.dataset.filter;
    b.classList.toggle("on", set.has(k));
  });
}
function onSelectThumb(i) {
  const count = getShotCount();
  if (mode !== "review" && mode !== "filter") return;
  if (i >= count) return;
  if (!shots[i]) return;
  
  selected = i;
  renderSelection();
  showImageOnStage(shots[i]);
  updateBigFrame(i);
  updateButtons();
  syncFilterButtons();
}

async function retakeSelected() {
  const count = getShotCount();
  if (mode !== "review") return;
  if (selected < 0 || selected >= count) return;
  if (retaken[selected]) return;
  
  mode = "retaking";
  setFilterModeUI(false);
  setThumbClickable(false);
  updateButtons();
  hintEl.textContent = `重拍中：倒數 ${COUNTDOWN_SECONDS} 秒`;
  showCameraOnStage();
  updateBigFrame(selected);
  
  await countdown(COUNTDOWN_SECONDS);
  
  // Reset for retake
  if (rawShots[selected]) rawShots[selected] = null;
  await captureAndStore(selected, true);
  
  retaken[selected] = true;
  
  // Re-apply existing global filters to the new shot
  await applyFilterPreviewToUI(selected);
  
  mode = "review";
  setFilterModeUI(false);
  setThumbClickable(true);
  showImageOnStage(shots[selected]);
  hintEl.textContent = "重拍完成";
  updateButtons();
}

async function startShootFlow() {
  console.log('startShootFlow called');
  resetSession();
  console.log('resetSession done, calling showScreen("shoot")');
  showScreen("shoot");
  // 進入拍照畫面後再套一次尺寸，確保 layout 已就緒
  updateStageSize();
  console.log('showScreen("shoot") called');
  await shootSequence().catch(e => {
    console.error('shootSequence error:', e);
    log("錯誤：" + e);
  });
}

thumbs.forEach((t, i) => t.addEventListener('click', () => onSelectThumb(i)));
retakeBtn.addEventListener('click', () => retakeSelected());
nextBtn.addEventListener('click', async () => {
  if (mode === "review") {
    // Switch to Filter Mode
    mode = "filter";
    if (selected < 0 && getShotCount() > 0) selected = 0;
    renderSelection();
    updateButtons();
    hintEl.textContent = "請選擇濾鏡（將套用到所有照片）";
    if (getShotCount() > 0 && selected >= 0 && shots[selected]) {
      showImageOnStage(shots[selected]);
      updateBigFrame(selected);
    }
  } else if (mode === "filter") {
    await buildFinalOutput();
  }
});

// FIXED: Filter Click Handler (Async Batch Process)
document.getElementById("filters").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".fbtn");
  if (!btn) return;
  if (mode !== "filter") return;
  
  const key = btn.dataset.filter;
  const turnOn = !globalFilters.has(key);

  if (turnOn) globalFilters.add(key);
  else globalFilters.delete(key);
  
  syncFilterButtons();
  
  // Show loading overlay
  setLoading(true);
  
  // Process all photos sequentially
  (async () => {
      try {
          const count = getShotCount();
          for(let i=0; i<count; i++) {
             // Only process if image exists
             if(rawShots[i]) {
                await applyFilterPreviewToUI(i);
             }
          }
          console.log("Filters applied to all photos.");
      } catch (err) {
          console.error("Filter sequence error", err);
      } finally {
          // Hide loading overlay
          setLoading(false);
      }
  })();
});

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

// Initialization
async function initFaceMesh() {
  if (typeof FaceMesh === "undefined" || typeof fx === "undefined") {
    console.warn("FaceMesh/fx undefined. Waiting...");
    setTimeout(initFaceMesh, 1000);
    return;
  }
  
  const mpUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh";
  faceMesh = new FaceMesh({locateFile: (file) => `${mpUrl}/${file}`});
  
  faceMesh.setOptions({
    maxNumFaces: 4,
    refineLandmarks: true, 
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  
  faceMesh.onResults((results) => {
    const r = warpTasks.shift();
    if (r) r(results);
  });
  
  try {
      await faceMesh.initialize();
      console.log("FaceMesh Initialized");
  } catch (err) {
      console.error("FaceMesh init error:", err);
  }
  
  try {
     canvasFx = fx.canvas();
     console.log("GLFX Initialized");
  } catch (e) { console.error("glfx init failed", e); }
}

setTimeout(initFaceMesh, 500);
async function buildFinalOutput() {
  if (!selectedTemplate) return;
  showScreen("processing");
  const t = selectedTemplate;
  
  // 載入 QRcodePage 的模板圖片作為底圖
  const templateBasePath = `assets/templates/QRcodePage/${t.id}.png`;
  const templateImg = await loadImage(templateBasePath).catch(() => null);
  
  const canvas = document.createElement('canvas');
  // 使用模板圖片的尺寸，如果載入失敗則使用原來的尺寸
  if (templateImg) {
    canvas.width = templateImg.width;
    canvas.height = templateImg.height;
  } else {
    canvas.width = t.width;
    canvas.height = t.height;
  }
  const ctx = canvas.getContext('2d');
  
  // 先繪製白色背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 先將拍攝的照片繪製到底層
  const count = t.shotCount || 4;
  for (let i = 0; i < count; i++) {
    if (!shots[i]) continue;
    const img = await loadImage(shots[i]);
    const slot = t.slots[i];
    if (!slot) continue;
    
    // 計算在模板圖片上的位置（如果模板圖片尺寸不同，需要按比例縮放）
    let slotX = slot.x;
    let slotY = slot.y;
    let slotW = slot.w;
    let slotH = slot.h;
    
    if (templateImg && (templateImg.width !== t.width || templateImg.height !== t.height)) {
      // 按比例縮放 slot 位置和尺寸
      const scaleX = canvas.width / t.width;
      const scaleY = canvas.height / t.height;
      slotX = slot.x * scaleX;
      slotY = slot.y * scaleY;
      slotW = slot.w * scaleX;
      slotH = slot.h * scaleY;
    }
    
    ctx.filter = getCssFilterFor(globalFilters);
    drawCoverImage(ctx, img, slotX, slotY, slotW, slotH);
  }
  ctx.filter = "none";
  
  // 最後繪製模板圖片在上層（這樣模板會顯示在照片上面）
  if (templateImg) {
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
  }
  finalDataUrl = canvas.toDataURL("image/jpeg", 0.95);
  document.getElementById('final-preview').src = finalDataUrl;
  try {
    const saved = await callHost("save_image", { base64: finalDataUrl, ext: "jpg" });
    finalFilePath = saved.filePath;
    const uploadRes = await callHost("upload", { filePath: finalFilePath });
    const url = uploadRes.url || "https://example.com/download/mock.jpg";
    document.getElementById('qr-text').textContent = url;
    
    // Mock QR code generation - replace with actual API when ready
    const qrImageUrl = await generateQRCode(url);
    document.getElementById('qr-image').src = qrImageUrl;
  } catch (err) {
    document.getElementById('qr-text').textContent = "上傳失敗";
    // Use placeholder QR on error
    document.getElementById('qr-image').src = generatePlaceholderQR();
  }
  
  // 如果需要自動列印，直接執行列印並返回待機畫面
  if (autoPrint && finalFilePath) {
    try {
      await callHost("print_hotfolder", {
        filePath: finalFilePath,
        sizeKey: selectedTemplate ? selectedTemplate.sizeKey : "4x6",
        copies: 1
      });
      console.log('自動列印完成');
    } catch (err) {
      console.error('自動列印失敗：', err);
    }
    // 重置狀態並返回待機畫面
    autoPrint = false;
    resetSession();
    showScreen("idle");
  } else {
    // 正常流程：顯示結果頁面
    showScreen("result");
  }
}

document.getElementById('btn-print-wrapper').addEventListener('click', async () => {
  if (!finalFilePath) return;
  let copies = parseInt(document.getElementById('copies').value, 10);
  if (Number.isNaN(copies)) copies = 1;
  copies = Math.min(5, Math.max(1, copies));
  document.getElementById('copies').value = copies;
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
