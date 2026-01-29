let videoWidth='560'
let videoHeight='410'
const video = document.querySelector('#camera'); // 或用 getElementById

async function startCamera() {
  try {
    // 2. 請求攝影機（只要影像，不要麥克風）


    const stream = await navigator.mediaDevices.getUserMedia({
      video:{
        width: { ideal: videoWidth },
        height: { ideal: videoHeight }
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