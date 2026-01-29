/**
 * 開發選項：指定網頁開啟後要顯示的頁面
 * 0 待機 1 選版型 2 拍照 3 拍照預覽 4 結果 5 列印中
 * 設為 null 則不套用（預設待機）
 */
const DEV_START_PAGE = 2;


/**
 * 預設版型索引（跳過選版型直接進拍照／拍照預覽時使用）
 * 0=bk01, 1=bk02, 2=bk03, 3=bk04
 */
const DEFAULT_TEMPLATE_INDEX =4;

(function () {
  if (typeof window !== "undefined") {
    window.DEFAULT_TEMPLATE_INDEX = DEFAULT_TEMPLATE_INDEX;
  }
  const n = DEV_START_PAGE;
  if (n == null || typeof n !== "number" || n < 0 || n > 5) return;
  const names = ["idle", "template", "shoot", "shoot-preview", "result", "processing"];
  if (typeof selectedTemplate !== "undefined" && (n === 2 || n === 3) && !selectedTemplate && typeof templates !== "undefined" && templates.length > 0) {
    const idx = typeof getDefaultTemplateIndex === "function" ? getDefaultTemplateIndex() : 0;
    selectedTemplate = templates[idx];
  }
  setTimeout(function () {
    // 直接進「拍照畫面」時要啟動完整拍照流程（倒數＋拍攝），不是只切畫面
    if (n === 2 && typeof startShootFlow === "function") {
      startShootFlow();
    } else if (typeof showScreen === "function") {
      showScreen(names[n]);
    }
  }, 0);
})();
