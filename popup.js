// Default presets
const DEFAULT_PRESETS = [
  {
    id: 'example-preset',
    name: 'Example (Alpha → Local)',
    source: 'https://alpha.example.com',
    targets: ['http://localhost:3000'],
    noteUrls: [],
    cookieName: 'session'
  }
]

// State
let presets = []
let currentPresetId = null
let targets = ['']
let noteUrls = []

// DOM Elements
const presetSelect = document.getElementById('preset-select')
const presetNameInput = document.getElementById('preset-name')
const sourceInput = document.getElementById('source-url')
const targetListEl = document.getElementById('target-list')
const noteListEl = document.getElementById('note-list')
const cookieNameInput = document.getElementById('cookie-name')
const syncBtn = document.getElementById('sync-btn')
const savePresetBtn = document.getElementById('save-preset-btn')
const deletePresetBtn = document.getElementById('delete-preset-btn')
const statusEl = document.getElementById('status')
const gotoSourceBtn = document.getElementById('goto-source')
const addTargetBtn = document.getElementById('add-target')
const addNoteBtn = document.getElementById('add-note')

// Initialize
async function init() {
  await loadPresets()
  renderPresetOptions()

  // Load last used preset
  const { lastPresetId } = await chrome.storage.local.get('lastPresetId')
  if (lastPresetId && presets.find(p => p.id === lastPresetId)) {
    selectPreset(lastPresetId)
  } else if (presets.length > 0) {
    selectPreset(presets[0].id)
  }

  checkStatus()
}

async function loadPresets() {
  const { savedPresets } = await chrome.storage.local.get('savedPresets')
  presets = savedPresets || DEFAULT_PRESETS

  // Migration: convert old format to new format
  presets = presets.map(p => ({
    ...p,
    targets: p.targets || (p.target ? [p.target] : ['']),
    noteUrls: p.noteUrls || (p.noteUrl ? [p.noteUrl] : [])
  }))
}

async function savePresets() {
  await chrome.storage.local.set({ savedPresets: presets })
}

function renderPresetOptions() {
  presetSelect.innerHTML = presets.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('') + '<option value="__new__">+ New Preset...</option>'
}

function renderUrlList(container, urls, type) {
  container.innerHTML = urls.map((url, index) => `
    <div class="url-item" data-index="${index}">
      <input type="url" class="form-input ${type}-input" value="${url}"
             placeholder="${type === 'target' ? 'http://localhost:3000' : 'https://login.example.com'}">
      <button type="button" class="btn-goto" title="Open URL">↗</button>
      <button type="button" class="btn-remove" title="Remove">×</button>
    </div>
  `).join('')

  // Add event listeners
  container.querySelectorAll('.url-item').forEach((item, index) => {
    const input = item.querySelector('.form-input')
    const gotoBtn = item.querySelector('.btn-goto')
    const removeBtn = item.querySelector('.btn-remove')

    input.addEventListener('input', (e) => {
      if (type === 'target') {
        targets[index] = e.target.value
        debouncedCheckStatus()
      } else {
        noteUrls[index] = e.target.value
      }
    })

    gotoBtn.addEventListener('click', () => {
      const url = input.value.trim()
      if (url) chrome.tabs.create({ url })
    })

    removeBtn.addEventListener('click', () => {
      if (type === 'target') {
        if (targets.length > 1) {
          targets.splice(index, 1)
          renderUrlList(container, targets, type)
          debouncedCheckStatus()
        }
      } else {
        noteUrls.splice(index, 1)
        renderUrlList(container, noteUrls, type)
      }
    })
  })
}

function selectPreset(presetId) {
  if (presetId === '__new__') {
    // New preset mode
    currentPresetId = null
    presetNameInput.value = ''
    sourceInput.value = ''
    targets = ['']
    noteUrls = []
    cookieNameInput.value = 'session'
    deletePresetBtn.style.display = 'none'
    presetSelect.value = '__new__'
  } else {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      currentPresetId = preset.id
      presetNameInput.value = preset.name
      sourceInput.value = preset.source
      targets = [...(preset.targets || [''])]
      noteUrls = [...(preset.noteUrls || [])]
      cookieNameInput.value = preset.cookieName
      deletePresetBtn.style.display = 'inline-block'
      presetSelect.value = presetId
      chrome.storage.local.set({ lastPresetId: presetId })
    }
  }

  renderUrlList(targetListEl, targets, 'target')
  renderUrlList(noteListEl, noteUrls, 'note')
  checkStatus()
}

function generateId() {
  return 'preset-' + Date.now()
}

async function saveCurrentAsPreset() {
  const name = presetNameInput.value.trim()
  const source = sourceInput.value.trim()
  const cookieName = cookieNameInput.value.trim()
  const validTargets = targets.map(t => t.trim()).filter(t => t)
  const validNoteUrls = noteUrls.map(n => n.trim()).filter(n => n)

  if (!name || !source || validTargets.length === 0 || !cookieName) {
    setStatus('請填寫所有必要欄位', 'error')
    return
  }

  if (currentPresetId) {
    // Update existing
    const preset = presets.find(p => p.id === currentPresetId)
    if (preset) {
      preset.name = name
      preset.source = source
      preset.targets = validTargets
      preset.noteUrls = validNoteUrls
      preset.cookieName = cookieName
    }
  } else {
    // Create new
    const newPreset = {
      id: generateId(),
      name,
      source,
      targets: validTargets,
      noteUrls: validNoteUrls,
      cookieName
    }
    presets.push(newPreset)
    currentPresetId = newPreset.id
  }

  await savePresets()
  renderPresetOptions()
  selectPreset(currentPresetId)
  setStatus('✅ Preset saved!', 'success')
}

async function deleteCurrentPreset() {
  if (!currentPresetId) return

  if (!confirm('Delete this preset?')) return

  presets = presets.filter(p => p.id !== currentPresetId)
  await savePresets()
  renderPresetOptions()

  if (presets.length > 0) {
    selectPreset(presets[0].id)
  } else {
    selectPreset('__new__')
  }
  setStatus('Preset deleted', 'info')
}

function setStatus(message, type = 'info') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`
}

async function syncCookie() {
  const source = sourceInput.value.trim()
  const validTargets = targets.map(t => t.trim()).filter(t => t)
  const cookieName = cookieNameInput.value.trim()

  if (!source || validTargets.length === 0 || !cookieName) {
    setStatus('請填寫所有欄位', 'error')
    return
  }

  syncBtn.disabled = true
  setStatus('Syncing...', 'info')

  try {
    // 1. Read cookie from source
    const cookie = await chrome.cookies.get({
      url: source,
      name: cookieName
    })

    if (!cookie) {
      setStatus(`請先登入 ${new URL(source).hostname}`, 'error')
      syncBtn.disabled = false
      return
    }

    // 2. Write cookie to all targets
    let successCount = 0
    for (const target of validTargets) {
      const isSecure = target.startsWith('https://')
      await chrome.cookies.set({
        url: target,
        name: cookieName,
        value: cookie.value,
        path: '/',
        httpOnly: true,
        secure: isSecure,
        expirationDate: cookie.expirationDate
      })
      successCount++
    }

    setStatus(`✅ Cookie 已同步到 ${successCount} 個目標！`, 'success')

  } catch (error) {
    console.error('Sync failed:', error)
    setStatus(`❌ Error: ${error.message}`, 'error')
  }

  syncBtn.disabled = false
}

async function checkStatus() {
  const source = sourceInput.value.trim()
  const validTargets = targets.map(t => t.trim()).filter(t => t)
  const cookieName = cookieNameInput.value.trim()

  if (!source || validTargets.length === 0 || !cookieName) {
    setStatus('Configure URLs above', 'info')
    return
  }

  try {
    const sourceCookie = await chrome.cookies.get({
      url: source,
      name: cookieName
    })

    if (!sourceCookie) {
      setStatus(`⚠️ ${new URL(source).hostname} 未登入`, 'warning')
      return
    }

    // Check all targets
    let syncedCount = 0
    let needSyncCount = 0
    for (const target of validTargets) {
      const targetCookie = await chrome.cookies.get({
        url: target,
        name: cookieName
      })
      if (targetCookie && targetCookie.value === sourceCookie.value) {
        syncedCount++
      } else {
        needSyncCount++
      }
    }

    if (needSyncCount === 0) {
      setStatus(`✅ All ${syncedCount} targets synced`, 'success')
    } else if (syncedCount === 0) {
      setStatus(`Ready to sync (${validTargets.length} targets)`, 'info')
    } else {
      setStatus(`🔄 ${needSyncCount}/${validTargets.length} need sync`, 'warning')
    }
  } catch (e) {
    setStatus('Configure URLs above', 'info')
  }
}

// Navigation helpers
function openUrl(url) {
  if (url) {
    chrome.tabs.create({ url })
  }
}

// Event listeners
presetSelect.addEventListener('change', (e) => selectPreset(e.target.value))
syncBtn.addEventListener('click', syncCookie)
savePresetBtn.addEventListener('click', saveCurrentAsPreset)
deletePresetBtn.addEventListener('click', deleteCurrentPreset)
gotoSourceBtn.addEventListener('click', () => openUrl(sourceInput.value.trim()))

addTargetBtn.addEventListener('click', () => {
  targets.push('')
  renderUrlList(targetListEl, targets, 'target')
  // Focus the new input
  const inputs = targetListEl.querySelectorAll('.form-input')
  if (inputs.length > 0) inputs[inputs.length - 1].focus()
})

addNoteBtn.addEventListener('click', () => {
  noteUrls.push('')
  renderUrlList(noteListEl, noteUrls, 'note')
  // Focus the new input
  const inputs = noteListEl.querySelectorAll('.form-input')
  if (inputs.length > 0) inputs[inputs.length - 1].focus()
})

// Debounced status check on input change
let statusTimeout
function debouncedCheckStatus() {
  clearTimeout(statusTimeout)
  statusTimeout = setTimeout(checkStatus, 500)
}
sourceInput.addEventListener('input', debouncedCheckStatus)
cookieNameInput.addEventListener('input', debouncedCheckStatus)

// Initialize
init()
