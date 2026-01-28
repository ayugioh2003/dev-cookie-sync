# Dev Cookie Sync

Chrome Extension for syncing cookies between environments during development.

## Features

- 🔄 One-click cookie sync between any two URLs
- 💾 Save and manage multiple presets
- 🍪 Supports HttpOnly cookies
- ⚡ Auto-detects sync status

## Installation

1. Open Chrome, go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this folder

## Usage

1. Login to your source environment (e.g., alpha/staging)
2. Click the extension icon
3. Select a preset or configure custom URLs
4. Click "🔄 Sync Now"
5. Refresh your target page (e.g., localhost)

## Configuration

| Field | Description |
|-------|-------------|
| Source URL | The URL to copy cookies from |
| Target URL | The URL to copy cookies to |
| Cookie Name | The cookie to sync (e.g., `session`, `auth_token`) |

### Managing Presets

- **Save Preset**: Save current configuration for later use
- **Delete Preset**: Remove the selected preset
- **+ New Preset**: Create a new configuration from scratch

## Status Indicators

| Status | Meaning |
|--------|---------|
| Ready to sync | Source has cookie, ready to sync |
| ✅ Already synced | Cookies match between source and target |
| 🔄 Cookies differ | Cookies exist but values differ |
| ⚠️ Source 未登入 | No cookie found on source (login required) |
| ❌ Error | Something went wrong |

## Permissions

| Permission | Purpose |
|------------|---------|
| `cookies` | Read/write cookies |
| `storage` | Save presets locally |
| `<all_urls>` | Access cookies from any URL |

## Development

```bash
# Clone the repo
git clone https://github.com/ayugioh2003/dev-cookie-sync.git

# Load in Chrome as unpacked extension
```

## License

MIT
