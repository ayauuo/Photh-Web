let videoWidth = 988;
let videoHeight = 724;
const pictureArea=document.querySelector('.picture-area');
const video = document.querySelector('#camera'); // 或用 getElementById

const cover = document.querySelector('.cover');

function getShotCount() {
  if (typeof selectedTemplate !== 'undefined' && selectedTemplate && selectedTemplate.shotCount != null) {
    return selectedTemplate.shotCount;
  }
  return 4;
}

function getCurrentFrameUrl(index) {
  const id = typeof selectedTemplate !== 'undefined' && selectedTemplate ? selectedTemplate.id : 'bk04';
  const num = String(index + 1).padStart(2, '0');
  return `assets/templates/ShootPage/${id}/${id}_view${num}.png`;
}

function setCoverAndVideoSize() {
  if (!cover || !pictureArea) return;
  cover.style.width = `${videoWidth}px`;
  cover.style.height = `${videoHeight}px`;
  cover.style.backgroundImage = `url('${getCurrentFrameUrl(0)}')`;
  pictureArea.style.width = `${videoWidth}px`;
  pictureArea.style.height = `${videoHeight}px`;
}
setCoverAndVideoSize();

/** 播放倒數 10 秒拍照音樂（約 11 秒：前 1 秒「開始拍照囉」，接著 10→1），畫面中央倒數與前 1 秒對齊（一開始就顯示 10），只顯示數字不顯示「拍照!」 */
function playCountdownAudio() {
  const countdownEl = document.getElementById('shoot-countdown');
  let countdownInterval = null;

  const stopCountdown = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    if (countdownEl) {
      countdownEl.classList.remove('is-visible');
      countdownEl.textContent = '';
    }
  };

  return new Promise((resolve, reject) => {
    const audio = new Audio('assets/templates/music/倒數10秒拍照.mp3');
    audio.addEventListener('ended', () => {
      stopCountdown();
      resolve();
    }, { once: true });
    audio.addEventListener('error', (e) => {
      stopCountdown();
      reject(e);
    }, { once: true });
    audio.play().catch((e) => {
      stopCountdown();
      reject(e);
    });

    if (countdownEl) {
      countdownEl.classList.add('is-visible');
      const startCountdown = () => {
        let n = 10;
        countdownEl.textContent = n;
        countdownInterval = setInterval(() => {
          n -= 1;
          if (n >= 1) {
            countdownEl.textContent = n;
          } else {
            countdownEl.textContent = '';
            if (n < 0) stopCountdown();
          }
        }, 1000);
      };
      setTimeout(startCountdown, 1000);
    }
  });
}

/** 擷取目前畫面：video（鏡像與顯示一致）+ 指定框圖，回傳 data URL */
function captureFrame(frameImageUrl) {
  const w = Number(videoWidth);
  const h = Number(videoHeight);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/jpeg'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Frame image load failed'));
    img.src = frameImageUrl;
  });
}

let isBurstShooting = false;
let shootingDone = false;
/** 已重拍過的張數（每張只能重拍一次），例如 Set(2) 表示第 2 張已重拍 */
let reshootUsedSlots = new Set();
let currentMainIndex = 1;

function stopCamera() {
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach((t) => t.stop());
    video.srcObject = null;
  }
}

/** 連拍：拍 getShotCount() 張，每張結果放到左邊對應縮圖；拍完關閉攝影機、顯示合成圖與按鈕 */
async function startBurstShoot() {
  if (!video || !video.srcObject || isBurstShooting) return;
  const count = getShotCount();
  isBurstShooting = true;
  const nextBtn = document.querySelector('.next-btn');
  const againBtn = document.querySelector('.again-btn');
  if (nextBtn) nextBtn.disabled = true;

  for (let i = 0; i < count; i++) {
    const frameUrl = getCurrentFrameUrl(i);
    if (cover) cover.style.backgroundImage = `url('${frameUrl}')`;
    await new Promise(r => requestAnimationFrame(r));

    try {
      await playCountdownAudio();
    } catch (e) {
      console.warn('Countdown audio failed, capturing immediately', e);
    }

    try {
      const dataUrl = await captureFrame(frameUrl);
      const thumb = document.getElementById(`shoot-page-${i + 1}`);
      if (thumb) thumb.src = dataUrl;
    } catch (e) {
      console.error('Capture failed at shot', i + 1, e);
    }
  }

  isBurstShooting = false;
  stopCamera();
  shootingDone = true;
  reshootUsedSlots = new Set();
  currentMainIndex = 1;

  const pictureArea = document.querySelector('.picture-area');
  const mainPreviewEl = document.getElementById('shoot-main-preview');
  const thumb1 = document.getElementById('shoot-page-1');
  if (pictureArea) pictureArea.classList.add('is-preview');
  if (mainPreviewEl && thumb1) mainPreviewEl.src = thumb1.src;
  const btns = document.querySelector('.btns.shoot-btns');
  if (btns) btns.classList.add('is-visible');
  updateAgainBtnVisibility();
  if (nextBtn) nextBtn.disabled = false;
}

function updateAgainBtnVisibility() {
  const againBtnEl = document.querySelector('.again-btn');
  if (!againBtnEl) return;
  if (reshootUsedSlots.has(currentMainIndex)) {
    againBtnEl.classList.add('is-hidden');
  } else {
    againBtnEl.classList.remove('is-hidden');
  }
}

async function startCamera() {
  try {
    // 2. 請求攝影機（只要影像，不要麥克風）
    // cover.style.backgroundImage=`url(${video.srcObject.getVideoTracks()[0].getSettings().url})`;




    pictureArea.style.width=`${videoWidth}px`;
    pictureArea.style.height=`${videoHeight}px`;
    const stream = await navigator.mediaDevices.getUserMedia({
      video:{
        width: { ideal: videoWidth },
        height: { ideal: videoHeight - 1 }
      } ,
      audio: false
    });
    // 3. 把串流設給 video 的 srcObject
    video.srcObject = stream;
    // 4. 播放才會顯示畫面
    await video.play();




    return stream; // 之後要關閉攝影機會用到
  } catch (err) {
    console.error('無法啟動攝影機：', err);
    throw err;
  }
}

// 呼叫一次就會啟動攝影機
startCamera();

const nextBtn = document.querySelector('.next-btn');
const againBtn = document.querySelector('.again-btn');
const mainPreview = document.getElementById('shoot-main-preview');

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (shootingDone && typeof showScreen === 'function') showScreen('shoot-preview');
  });
}

if (againBtn) {
  againBtn.addEventListener('click', async () => {
    if (reshootUsedSlots.has(currentMainIndex) || !shootingDone) return;
    const pictureArea = document.querySelector('.picture-area');
    if (pictureArea) pictureArea.classList.remove('is-preview');
    try {
      await startCamera();
    } catch (e) {
      console.error('Reshoot camera start failed', e);
      if (pictureArea) pictureArea.classList.add('is-preview');
      return;
    }
    whenVideoReady(async () => {
      const i = currentMainIndex - 1;
      const frameUrl = getCurrentFrameUrl(i);
      if (cover) cover.style.backgroundImage = `url('${frameUrl}')`;
      await new Promise(r => requestAnimationFrame(r));
      try {
        await playCountdownAudio();
      } catch (e) {
        console.warn('Countdown audio failed', e);
      }
      try {
        const dataUrl = await captureFrame(frameUrl);
        const thumb = document.getElementById(`shoot-page-${currentMainIndex}`);
        if (thumb) thumb.src = dataUrl;
        if (mainPreview) mainPreview.src = dataUrl;
      } catch (e) {
        console.error('Reshoot capture failed', e);
      }
      stopCamera();
      if (pictureArea) pictureArea.classList.add('is-preview');
      reshootUsedSlots.add(currentMainIndex);
      updateAgainBtnVisibility();
    });
  });
}

[1, 2, 3, 4].forEach((num) => {
  const thumb = document.getElementById(`shoot-page-${num}`);
  if (thumb) {
    thumb.addEventListener('click', () => {
      if (!shootingDone || !mainPreview) return;
      currentMainIndex = num;
      mainPreview.src = thumb.src;
      updateAgainBtnVisibility();
    });
  }
});

// 一進入拍照頁就自動開始連拍
function whenVideoReady(callback, timeoutMs = 5000) {
  if (!video) return;
  if (video.srcObject && video.readyState >= 2) {
    setTimeout(callback, 300);
    return;
  }
  const done = () => {
    video.removeEventListener('loadeddata', done);
    video.removeEventListener('canplay', done);
    setTimeout(callback, 300);
  };
  video.addEventListener('loadeddata', done);
  video.addEventListener('canplay', done);
  setTimeout(() => {
    video.removeEventListener('loadeddata', done);
    video.removeEventListener('canplay', done);
    if (video.srcObject && video.readyState >= 2) setTimeout(callback, 300);
  }, timeoutMs);
}

const screenShoot = document.getElementById('screen-shoot');
if (screenShoot) {
  const observer = new MutationObserver(() => {
    if (screenShoot.classList.contains('active')) {
      whenVideoReady(startBurstShoot);
    }
  });
  observer.observe(screenShoot, { attributes: true, attributeFilter: ['class'] });
}