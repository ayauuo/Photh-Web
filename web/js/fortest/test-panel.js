/**
 * 測試面板：連按兩次空白鍵可開啟／關閉
 */
(function () {
  const DOUBLE_TAP_MS = 400;
  let lastSpaceAt = 0;

  function init() {
    const overlay = document.getElementById("test-panel-overlay");
    if (!overlay) return;

    document.addEventListener("keydown", function (e) {
      // ESC：僅關閉測試面板，不讓事件繼續傳遞（避免多關一層畫面）
      if (e.code === "Escape") {
        if (!overlay.classList.contains("test-panel--hidden")) {
          e.preventDefault();
          e.stopPropagation();
          overlay.classList.add("test-panel--hidden");
        }
        return;
      }
      if (e.code !== "Space") return;
      const now = Date.now();
      if (now - lastSpaceAt <= DOUBLE_TAP_MS) {
        e.preventDefault();
        overlay.classList.toggle("test-panel--hidden");
        lastSpaceAt = 0;
        return;
      }
      lastSpaceAt = now;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
