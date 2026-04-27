# Dev Cookie Sync

在開發環境之間同步 Cookie 的 Chrome 擴充功能。

開發時常需要在不同環境（如 alpha、staging、localhost）之間切換，但 Cookie 無法跨域共享，導致每次都要重新登入。這個擴充功能讓你一鍵將 Cookie 從來源環境同步到目標環境。

## 功能特色

- 一鍵將 Cookie 從來源 URL 同步到多個目標 URL
- 支援多組 Preset（預設組合），快速切換不同環境配置
- 支援 HttpOnly Cookie（透過 `chrome.cookies` API）
- 自動偵測同步狀態
- 可加入備註 URL，方便快速開啟相關頁面

## 安裝方式

1. Clone 或下載此專案
   ```bash
   git clone https://github.com/ayugioh2003/dev-cookie-sync.git
   ```
2. 開啟 Chrome，前往 `chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇此專案資料夾

## 使用教學

### 基本流程

1. **先在來源環境登入**：在瀏覽器開啟來源網站（如 `https://alpha.example.com`）並登入，確保 Cookie 已存在
2. **點擊擴充功能圖示**：在 Chrome 工具列點擊 🍪 Dev Cookie Sync 圖示
3. **設定同步參數**：
   - **Preset Name**：為這組設定取個名字（如「Alpha → Local」）
   - **Source URL**：Cookie 的來源網址（如 `https://alpha.example.com`）
   - **Target URLs**：要同步到的目標網址（如 `http://localhost:3000`），可以加入多個
   - **Cookie Name**：要同步的 Cookie 名稱（如 `session`）
4. **點擊「Sync Now」**：開始同步
5. **重新整理目標頁面**：同步完成後，重新整理 localhost 頁面即可使用同步後的 Cookie

### 管理 Preset

- **儲存 Preset**：設定好參數後，點擊「💾 Save Preset」儲存
- **切換 Preset**：從上方下拉選單選擇已儲存的 Preset
- **新增 Preset**：從下拉選單選擇「+ New Preset...」
- **刪除 Preset**：選擇該 Preset 後，點擊 🗑️ 按鈕

### 多目標同步

點擊 Target URLs 旁的「+」按鈕可以新增多個目標 URL，一次同步到所有目標環境。

### 備註 URL

點擊 Note URLs 旁的「+」按鈕可以加入備註用的 URL（如登入頁面），方便快速開啟。點擊 ↗ 按鈕可直接在新分頁開啟該 URL。

## 狀態說明

| 狀態 | 說明 |
|------|------|
| Ready to sync | 來源有 Cookie，可以開始同步 |
| ✅ All targets synced | 所有目標的 Cookie 已與來源一致 |
| 🔄 N/M need sync | 有部分目標尚未同步 |
| ⚠️ 未登入 | 來源找不到 Cookie，請先登入 |
| ❌ Error | 發生錯誤 |

## 權限說明

| 權限 | 用途 |
|------|------|
| `cookies` | 讀取與寫入 Cookie |
| `storage` | 在本機儲存 Preset 設定 |
| `<all_urls>` | 存取任意 URL 的 Cookie |

## License

MIT
