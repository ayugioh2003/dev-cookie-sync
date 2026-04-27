# 開發指南

## 專案結構

```
dev-cookie-sync/
├── manifest.json              # Chrome Extension 設定（Manifest V3）
├── assets/
│   └── icons/                 # 擴充功能圖示（16/48/128px）
└── src/
    ├── popup/                 # Popup UI
    │   ├── index.html         # 主頁面
    │   ├── index.js           # 進入點，事件綁定與流程控制
    │   └── style.css          # 樣式
    └── lib/                   # 共用模組
        ├── storage.js         # Preset 的讀寫、migration、ID 產生
        ├── sync.js            # Cookie 的讀取、寫入、同步、狀態檢查
        └── ui.js              # DOM 渲染工具（Preset 選單、URL 列表、狀態顯示）
```

## 技術說明

- **Manifest V3**：使用 Chrome Extension Manifest V3 格式
- **ES Modules**：`index.js` 以 `<script type="module">` 載入，各模組使用 `import` / `export`
- **無建置工具**：不需要 bundler，Chrome 原生支援 ES Modules
- **Chrome APIs**：
  - `chrome.cookies` — 讀寫 Cookie
  - `chrome.storage.local` — 本機持久化儲存
  - `chrome.tabs` — 開啟新分頁

## 本機開發

1. Clone 專案
   ```bash
   git clone https://github.com/ayugioh2003/dev-cookie-sync.git
   cd dev-cookie-sync
   ```

2. 在 Chrome 載入擴充功能
   - 前往 `chrome://extensions/`
   - 開啟「開發人員模式」
   - 點擊「載入未封裝項目」→ 選擇專案根目錄

3. 修改程式碼後，到 `chrome://extensions/` 點擊擴充功能卡片上的 🔄 重新載入按鈕，再重新開啟 Popup 即可看到變更

## 模組說明

### `src/popup/index.js`

主進入點，負責：
- 初始化：載入 Preset、綁定事件
- Preset 切換與 CRUD
- 呼叫 `sync.js` 執行同步
- 呼叫 `ui.js` 更新畫面

### `src/lib/storage.js`

Preset 資料的持久化：
- `loadPresets()` — 從 `chrome.storage.local` 讀取，包含舊格式 migration（單一 target → targets 陣列）
- `savePresets(presets)` — 寫入 storage
- `getLastPresetId()` / `setLastPresetId()` — 記住上次使用的 Preset
- `DEFAULT_PRESETS` — 首次使用時的預設資料

### `src/lib/sync.js`

Cookie 同步邏輯：
- `getCookie(url, cookieName)` — 讀取指定 URL 的 Cookie
- `setCookie(url, cookieName, value, expirationDate)` — 寫入 Cookie 到指定 URL
- `syncCookieToTargets(source, targets, cookieName)` — 從來源讀取 Cookie，寫入所有目標
- `checkSyncStatus(source, targets, cookieName)` — 檢查同步狀態（synced / ready / partial / not_logged_in）

### `src/lib/ui.js`

DOM 渲染工具：
- `renderPresetOptions()` — 渲染 Preset 下拉選單
- `renderUrlList()` — 渲染 URL 列表（支援新增、刪除、開啟連結）
- `setStatus()` — 更新狀態訊息與樣式
- `openUrl()` — 在新分頁開啟 URL
