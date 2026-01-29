# PhotoBooth CSS 檔案條列與功能說明

此文件條列所有樣式檔，並簡述各檔負責的畫面與功能。  
HTML 只需引用 **styles.css**，其餘由該檔以 `@import` 依序載入。

---

## 一、入口檔

| 檔案 | 路徑 | 功能說明 |
|------|------|----------|
| **styles.css** | `web/styles.css` | **樣式入口**。僅負責以 `@import` 依序載入底下 7 個 CSS，本身不寫樣式。引入順序勿改，否則可能影響層級與覆蓋關係。 |

---

## 二、全站共用（base）

| 檔案 | 路徑 | 功能說明 |
|------|------|----------|
| **base.css** | `web/css/base.css` | **全站共用**。定義：<br>• **色票**：`:root` 的 `--bg`、`--text`、`--accent`、`--orange`<br>• **基礎**：`*` 的 `box-sizing`、`body` 字型與背景<br>• **畫面切換**：`.screen` 預設隱藏、`.screen.active` 顯示、`.screen.template-screen.active` 以 flex 顯示、非作用中畫面 `pointer-events: none`<br>• **通用按鈕**：`.btn`、`.btn.primary` / `.accent` / `.orange`、`.center-actions` |

---

## 三、各頁面專用

| 檔案 | 路徑 | 對應畫面 | 功能說明 |
|------|------|----------|----------|
| **page-idle.css** | `web/css/page-idle.css` | **待機／測試頁** `#screen-idle` | • 待機背景圖層：`.idle-background`、`.idle-logo`、`.idle-coin`（全屏覆蓋）<br>• 測試按鈕區：`.test-buttons`、`.test-buttons .btn`、`.sub`<br>• 付款計數區：`.payment-counter`、`.counter-label`、`.counter-amount`、`.counter-last`（投幣相關顯示） |
| **page-template.css** | `web/css/page-template.css` | **選版型頁** `#screen-template` | • 選版型全屏背景：`.template-screen`（含背景圖）、`.template-scroll` 捲動區<br>• 模板列表：`.template-grid`、`.template-card`、選取態 `.template-card.selected`、`.template-preview`、`.template-img`<br>• 底部：`.template-footer`、下一步按鈕 `#btn-template-next`（大、黑底白字） |
| **page-shoot.css** | `web/css/page-shoot.css` | **拍照頁** `#screen-shoot` | • 整體：`.shoot-screen`、`.shoot-background`、`.shoot-content`、`.shoot-main-layout`<br>• **左側**：`.shoot-left-panel`、四張縮圖 `.thumb-wrapper`、`.thumb`、`.thumb-frame`、`.thumb.disabled` / `.thumb.selected`<br>• **右側**：`.shoot-right-area`、`.stage`、`.frame`、`video`（鏡像）、`.bigimg`、`.big-frame`、倒數疊加 `.overlayCount`、`.shoot-hint`<br>• **底部**：`.shoot-footer`、`.shoot-controls`、重拍／下一步 `.shoot-btn-reshoot`、`.shoot-btn-next`<br>• **濾鏡**：`.filters`、`.filters.active`、`.fbtn`、`.fbtn.on`<br>• 除錯：`.hint`、`.log` |
| **page-processing.css** | `web/css/page-processing.css` | **處理中頁** `#screen-processing` | • 合成／上傳中全屏：`#screen-processing.active` 置中、白底<br>• 內容區：`.processing-content`、`.processing-image`（處理中圖示） |
| **page-result.css** | `web/css/page-result.css` | **結果／QR 頁** `#screen-result` | • 結果頁背景：`#screen-result`（含背景圖）<br>• 版面：`.result-wrap`（grid 2fr 1fr）、`.result-preview`、最終預覽圖<br>• QR 區：`.qr-panel`、`.qr-title`、`.qr-frame`、`.qr-text`<br>• 列印區：`.print-section`、`.print-button-wrapper`、`.input-row`（列印數量等） |
| **loading.css** | `web/css/loading.css` | **全站載入遮罩** `#loading-overlay` | • 全螢幕半透明遮罩：`.loading-overlay`（固定、最高 z-index）<br>• 旋轉動畫：`.spinner`、`@keyframes spin`（載入中指示） |

---

## 四、條列式總覽（依載入順序）

1. **styles.css** — 入口，只做 `@import`，不寫樣式。
2. **base.css** — 全站：變數、body、畫面切換、通用按鈕。
3. **page-idle.css** — 待機／測試頁：背景、測試按鈕、付款計數。
4. **page-template.css** — 選版型頁：背景、模板卡片、下一步按鈕。
5. **page-shoot.css** — 拍照頁：左縮圖、右攝影機／預覽、倒數、底部按鈕、濾鏡。
6. **page-processing.css** — 處理中頁：全屏置中圖。
7. **page-result.css** — 結果頁：預覽、QR、列印區。
8. **loading.css** — 全站載入遮罩與旋轉動畫。

---

## 五、對應 HTML 畫面 ID

| CSS 檔 | 主要對應的畫面 / 元素 |
|--------|------------------------|
| base.css | 所有 `.screen`、`.btn`、`.center-actions` |
| page-idle.css | `#screen-idle`、`.test-buttons`、`.payment-counter` |
| page-template.css | `#screen-template`、`#template-list`、`#btn-template-next` |
| page-shoot.css | `#screen-shoot`、`#t0`～`#t3`、`#v`、`#bigimg`、`#count`、`#retake`、`#next`、`#filters` |
| page-processing.css | `#screen-processing`、`.processing-image` |
| page-result.css | `#screen-result`、`#final-preview`、`#qr-image`、`#qr-text`、`#btn-print-wrapper`、`#copies` |
| loading.css | `#loading-overlay`、`.spinner` |

修改某一頁的樣式時，到對應的 `page-*.css` 或 `base.css` 即可；改全站按鈕、色票、畫面切換則改 **base.css**。
