# SCSS 樣式

PhotoBooth 樣式已改為 SCSS 管理，編譯後輸出為 `css/main.css`。

## 結構

- **`_variables.scss`**：色票、間距、圓角、資產路徑
- **`_mixins.scss`**：共用 mixins（flex-center、no-drag、no-select、absolute-fill）
- **`_base.scss`**：全站共用（:root、body、.screen、.btn、.center-actions）
- **`_page-idle.scss`**：待機／測試頁
- **`_page-template.scss`**：選版型頁
- **`_page-shoot.scss`**：拍照頁
- **`_page-processing.scss`**：處理中頁
- **`_page-result.scss`**：結果／QR 頁
- **`_loading.scss`**：載入遮罩與 spinner
- **`main.scss`**：入口，依序引入上述 partials

## 編譯

```bash
npm install
npm run build:css    # 編譯一次
npm run watch:css   # 監聽 scss/ 變更並自動編譯
```

編譯結果寫入 `css/main.css`，請勿直接改該檔，改完 SCSS 後再執行 `npm run build:css`。
