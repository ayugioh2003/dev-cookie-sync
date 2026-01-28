import { loadPresets, savePresets, getLastPresetId, setLastPresetId, generateId } from '../lib/storage.js'
import { syncCookieToTargets, checkSyncStatus } from '../lib/sync.js'
import { renderPresetOptions, renderUrlList, setStatus, openUrl } from '../lib/ui.js'

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
  presets = await loadPresets()
  renderPresetOptions(presetSelect, presets)

  // Load last used preset
  const lastPresetId = await getLastPresetId()
  if (lastPresetId && presets.find(p => p.id === lastPresetId)) {
    selectPreset(lastPresetId)
  } else if (presets.length > 0) {
    selectPreset(presets[0].id)
  }

  updateStatus()
}

function renderTargets() {
  renderUrlList(targetListEl, targets, 'target', {
    onInput: (index, value) => {
      targets[index] = value
      debouncedUpdateStatus()
    },
    onRemove: (index) => {
      if (targets.length > 1) {
        targets.splice(index, 1)
        renderTargets()
        debouncedUpdateStatus()
      }
    }
  })
}

function renderNotes() {
  renderUrlList(noteListEl, noteUrls, 'note', {
    onInput: (index, value) => {
      noteUrls[index] = value
    },
    onRemove: (index) => {
      noteUrls.splice(index, 1)
      renderNotes()
    }
  })
}

function selectPreset(presetId) {
  if (presetId === '__new__') {
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
      setLastPresetId(presetId)
    }
  }

  renderTargets()
  renderNotes()
  updateStatus()
}

async function saveCurrentAsPreset() {
  const name = presetNameInput.value.trim()
  const source = sourceInput.value.trim()
  const cookieName = cookieNameInput.value.trim()
  const validTargets = targets.map(t => t.trim()).filter(t => t)
  const validNoteUrls = noteUrls.map(n => n.trim()).filter(n => n)

  if (!name || !source || validTargets.length === 0 || !cookieName) {
    setStatus(statusEl, '請填寫所有必要欄位', 'error')
    return
  }

  if (currentPresetId) {
    const preset = presets.find(p => p.id === currentPresetId)
    if (preset) {
      preset.name = name
      preset.source = source
      preset.targets = validTargets
      preset.noteUrls = validNoteUrls
      preset.cookieName = cookieName
    }
  } else {
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

  await savePresets(presets)
  renderPresetOptions(presetSelect, presets)
  selectPreset(currentPresetId)
  setStatus(statusEl, '✅ Preset saved!', 'success')
}

async function deleteCurrentPreset() {
  if (!currentPresetId) return
  if (!confirm('Delete this preset?')) return

  presets = presets.filter(p => p.id !== currentPresetId)
  await savePresets(presets)
  renderPresetOptions(presetSelect, presets)

  if (presets.length > 0) {
    selectPreset(presets[0].id)
  } else {
    selectPreset('__new__')
  }
  setStatus(statusEl, 'Preset deleted', 'info')
}

async function syncCookie() {
  const source = sourceInput.value.trim()
  const validTargets = targets.map(t => t.trim()).filter(t => t)
  const cookieName = cookieNameInput.value.trim()

  if (!source || validTargets.length === 0 || !cookieName) {
    setStatus(statusEl, '請填寫所有欄位', 'error')
    return
  }

  syncBtn.disabled = true
  setStatus(statusEl, 'Syncing...', 'info')

  try {
    const successCount = await syncCookieToTargets(source, validTargets, cookieName)
    setStatus(statusEl, `✅ Cookie 已同步到 ${successCount} 個目標！`, 'success')
  } catch (error) {
    if (error.message.startsWith('NOT_LOGGED_IN:')) {
      const hostname = error.message.split(':')[1]
      setStatus(statusEl, `請先登入 ${hostname}`, 'error')
    } else {
      console.error('Sync failed:', error)
      setStatus(statusEl, `❌ Error: ${error.message}`, 'error')
    }
  }

  syncBtn.disabled = false
}

async function updateStatus() {
  const source = sourceInput.value.trim()
  const validTargets = targets.map(t => t.trim()).filter(t => t)
  const cookieName = cookieNameInput.value.trim()

  if (!source || validTargets.length === 0 || !cookieName) {
    setStatus(statusEl, 'Configure URLs above', 'info')
    return
  }

  try {
    const result = await checkSyncStatus(source, validTargets, cookieName)

    switch (result.status) {
      case 'not_logged_in':
        setStatus(statusEl, `⚠️ ${result.hostname} 未登入`, 'warning')
        break
      case 'synced':
        setStatus(statusEl, `✅ All ${result.syncedCount} targets synced`, 'success')
        break
      case 'ready':
        setStatus(statusEl, `Ready to sync (${result.total} targets)`, 'info')
        break
      case 'partial':
        setStatus(statusEl, `🔄 ${result.needSyncCount}/${result.total} need sync`, 'warning')
        break
    }
  } catch (e) {
    setStatus(statusEl, 'Configure URLs above', 'info')
  }
}

// Debounced status check
let statusTimeout
function debouncedUpdateStatus() {
  clearTimeout(statusTimeout)
  statusTimeout = setTimeout(updateStatus, 500)
}

// Event listeners
presetSelect.addEventListener('change', (e) => selectPreset(e.target.value))
syncBtn.addEventListener('click', syncCookie)
savePresetBtn.addEventListener('click', saveCurrentAsPreset)
deletePresetBtn.addEventListener('click', deleteCurrentPreset)
gotoSourceBtn.addEventListener('click', () => openUrl(sourceInput.value.trim()))

addTargetBtn.addEventListener('click', () => {
  targets.push('')
  renderTargets()
  const inputs = targetListEl.querySelectorAll('.form-input')
  if (inputs.length > 0) inputs[inputs.length - 1].focus()
})

addNoteBtn.addEventListener('click', () => {
  noteUrls.push('')
  renderNotes()
  const inputs = noteListEl.querySelectorAll('.form-input')
  if (inputs.length > 0) inputs[inputs.length - 1].focus()
})

sourceInput.addEventListener('input', debouncedUpdateStatus)
cookieNameInput.addEventListener('input', debouncedUpdateStatus)

// Initialize
init()
