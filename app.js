/**
 * LinkDock — Personal Web Launchpad & Bookmark Organizer
 * Pure Vanilla JS (Zero Backend Required — GitHub Pages Ready)
 */

const STORAGE_KEY = 'linkdock_data_v2';
const VIEW_KEY = 'linkdock_view_mode';

const DEFAULT_DATA = {
  categories: [
    {
      id: 'cat-work',
      name: 'Road to GED',
      color: '#0EA5E9'
    }
  ],
  bookmarks: [
    {
      id: 'bm-6',
      title: 'GetSumMath',
      url: 'https://www.youtube.com/@GetSumMath/courses',
      categoryId: 'cat-work',
      icon: '',
      note: 'ช่องนีเด่น Social, Math',
      pinned: false
    },
    {
      id: 'bm-1793212876138',
      title: 'UltamateAlgebra',
      url: 'https://www.youtube.com/@UltimateAlgebra/courses',
      categoryId: 'cat-work',
      icon: '',
      note: 'ช่องนีเด่น Math, Sci',
      pinned: false
    },
    {
      id: 'bm-1793212928102',
      title: 'TestPrepChampions',
      url: 'https://www.youtube.com/@TestPrepChampions/playlists',
      categoryId: 'cat-work',
      icon: '',
      note: 'ช่องนีเด่น RLA, Social',
      pinned: false
    },
    {
      id: 'bm-1793212987999',
      title: 'PurelyPersistent',
      url: 'https://www.youtube.com/@PurelyPersistent/playlists',
      categoryId: 'cat-work',
      icon: '',
      note: 'ดีหมด',
      pinned: false
    },
    {
      id: 'bm-1793213057180',
      title: 'คลังข้อสอบ',
      url: 'https://www.gedpracticequestions.com/',
      categoryId: 'cat-work',
      icon: '',
      note: 'Mock examination',
      pinned: false
    }
  ]
};

// State
let state = loadState();
let activeCategoryId = 'all';
let searchQuery = '';
let searchEngine = 'filter'; // 'filter' | 'google' | 'youtube' | 'github'
let draggedBookmarkId = null;

// DOM Elements
const pinnedSection = document.getElementById('pinnedSection');
const pinnedGrid = document.getElementById('pinnedGrid');
const pinnedCount = document.getElementById('pinnedCount');
const categoryTabs = document.getElementById('categoryTabs');
const collectionsContainer = document.getElementById('collectionsContainer');
const totalStatsText = document.getElementById('totalStatsText');

const searchInput = document.getElementById('searchInput');
const engineSelectorBtn = document.getElementById('engineSelectorBtn');
const currentEngineLabel = document.getElementById('currentEngineLabel');
const engineMenu = document.getElementById('engineMenu');

// Modals
const bookmarkModal = document.getElementById('bookmarkModal');
const bookmarkForm = document.getElementById('bookmarkForm');
const bookmarkModalTitle = document.getElementById('bookmarkModalTitle');
const bookmarkIdInput = document.getElementById('bookmarkIdInput');
const bookmarkTitleInput = document.getElementById('bookmarkTitleInput');
const bookmarkUrlInput = document.getElementById('bookmarkUrlInput');
const bookmarkCategorySelect = document.getElementById('bookmarkCategorySelect');
const urlFaviconPreview = document.getElementById('urlFaviconPreview');
const bookmarkNoteInput = document.getElementById('bookmarkNoteInput');
const bookmarkPinnedCheck = document.getElementById('bookmarkPinnedCheck');

const categoryModal = document.getElementById('categoryModal');
const categoryForm = document.getElementById('categoryForm');
const categoryModalTitle = document.getElementById('categoryModalTitle');
const categoryIdInput = document.getElementById('categoryIdInput');
const categoryNameInput = document.getElementById('categoryNameInput');
const categoryColorPicker = document.getElementById('categoryColorPicker');
const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');

// ============================================================================
// Initialization & Persistence
// ============================================================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.bookmarks)) {
      return structuredClone(DEFAULT_DATA);
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load state:', err);
    return structuredClone(DEFAULT_DATA);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initViewMode() {
  const savedView = localStorage.getItem(VIEW_KEY) || 'grid';
  if (savedView === 'compact') {
    document.body.classList.add('compact-view');
  }
}

function updateClock() {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  clockEl.textContent = `${dateStr} · ${timeStr}`;
}

// ============================================================================
// URL & Favicon Helpers
// ============================================================================
function normalizeUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return 'https://example.com';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function getDomain(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getFaviconCandidates(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    const hostname = parsed.hostname;
    const cleanDomain = hostname.replace(/^www\./, '');
    const origin = parsed.origin;
    return [
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`,
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=128`,
      `${origin}/favicon.ico`
    ];
  } catch {
    return [];
  }
}

function renderFaviconInto(container, url, fallbackHtml) {
  const candidates = getFaviconCandidates(url);
  if (candidates.length === 0) {
    container.innerHTML = fallbackHtml;
    return;
  }

  const img = document.createElement('img');
  let index = 0;
  img.src = candidates[index];
  img.alt = '';
  img.loading = 'lazy';

  img.addEventListener('error', () => {
    index += 1;
    if (index < candidates.length) {
      img.src = candidates[index];
    } else {
      container.innerHTML = fallbackHtml;
    }
  });

  container.innerHTML = '';
  container.appendChild(img);
}

const DEFAULT_GLOBE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

function updateUrlFaviconPreview(rawUrl) {
  if (!urlFaviconPreview) return;
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || !trimmed.includes('.')) {
    urlFaviconPreview.innerHTML = DEFAULT_GLOBE_SVG;
    return;
  }
  renderFaviconInto(urlFaviconPreview, trimmed, DEFAULT_GLOBE_SVG);
}

// ============================================================================
// Rendering
// ============================================================================
function renderAll() {
  renderPinned();
  renderCategoryTabs();
  renderCollections();
  updateStatusFooter();
}

function matchesFilter(bm) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return (
    bm.title.toLowerCase().includes(q) ||
    bm.url.toLowerCase().includes(q) ||
    (bm.note && bm.note.toLowerCase().includes(q))
  );
}

function createShortcutCard(bm, indexBadge = null) {
  const card = document.createElement('div');
  card.className = 'shortcut-card';
  card.draggable = true;
  card.dataset.id = bm.id;

  const domain = getDomain(bm.url);
  const firstChar = escapeHtml((bm.title || domain || '?').charAt(0).toUpperCase());

  const badgeHtml = indexBadge !== null
    ? `<span class="hotkey-badge" title="กด Alt+${indexBadge} เพื่อเปิดทันที">Alt+${indexBadge}</span>`
    : '';

  const noteHtml = bm.note
    ? `<div class="card-note">${escapeHtml(bm.note)}</div>`
    : '';

  card.innerHTML = `
    <div class="card-favicon"></div>
    <div class="card-body">
      <div class="card-title-row">
        <div class="card-title">${escapeHtml(bm.title)}</div>
        ${badgeHtml}
      </div>
      <div class="card-domain">${escapeHtml(domain)}</div>
      ${noteHtml}
    </div>
    <div class="card-actions">
      <button type="button" class="card-action-btn ${bm.pinned ? 'pinned-active' : ''}" data-action="pin" title="${bm.pinned ? 'เอาออกจากรายการติดดาว' : 'ปักหมุดไว้ด้านบน'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${bm.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
      <button type="button" class="card-action-btn" data-action="edit" title="แก้ไขชื่อ / ลิงก์">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      </button>
      <button type="button" class="card-action-btn delete" data-action="delete" title="ลบทางลัด">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c0 1 2 1 2 2v2"/></svg>
      </button>
    </div>
  `;

  const faviconBox = card.querySelector('.card-favicon');
  renderFaviconInto(faviconBox, bm.url, `<span class="card-favicon-fallback">${firstChar}</span>`);

  // Click card to open URL
  card.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.dataset.action;
      if (action === 'pin') togglePinBookmark(bm.id);
      if (action === 'edit') openEditBookmarkModal(bm.id);
      if (action === 'delete') deleteBookmark(bm.id);
      return;
    }
    window.open(normalizeUrl(bm.url), '_blank', 'noopener,noreferrer');
  });

  // Drag & Drop events for reordering
  card.addEventListener('dragstart', (e) => {
    draggedBookmarkId = bm.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    draggedBookmarkId = null;
    card.classList.remove('dragging');
    document.querySelectorAll('.shortcut-card.drag-over').forEach(el => el.classList.remove('drag-over'));
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedBookmarkId && draggedBookmarkId !== bm.id) {
      card.classList.add('drag-over');
    }
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    if (!draggedBookmarkId || draggedBookmarkId === bm.id) return;
    reorderBookmarks(draggedBookmarkId, bm.id, bm.categoryId);
  });

  return card;
}

function renderPinned() {
  const pinnedList = state.bookmarks.filter(b => b.pinned && matchesFilter(b));
  pinnedCount.textContent = pinnedList.length;

  if (pinnedList.length === 0) {
    pinnedSection.hidden = true;
    return;
  }

  pinnedSection.hidden = false;
  pinnedGrid.innerHTML = '';
  pinnedList.forEach((bm, idx) => {
    const hotkey = idx < 9 ? idx + 1 : null;
    pinnedGrid.appendChild(createShortcutCard(bm, hotkey));
  });
}

function renderCategoryTabs() {
  categoryTabs.innerHTML = '';

  const totalCount = state.bookmarks.length;
  const allTab = document.createElement('button');
  allTab.type = 'button';
  allTab.className = `cat-tab ${activeCategoryId === 'all' ? 'active' : ''}`;
  allTab.innerHTML = `
    <span>ทั้งหมด</span>
    <span class="cat-tab-count">${totalCount}</span>
  `;
  allTab.addEventListener('click', () => {
    activeCategoryId = 'all';
    renderCategoryTabs();
    renderCollections();
  });
  categoryTabs.appendChild(allTab);

  state.categories.forEach(cat => {
    const count = state.bookmarks.filter(b => b.categoryId === cat.id).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cat-tab ${activeCategoryId === cat.id ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="cat-dot" style="background:${cat.color}"></span>
      <span>${escapeHtml(cat.name)}</span>
      <span class="cat-tab-count">${count}</span>
    `;
    btn.addEventListener('click', () => {
      activeCategoryId = cat.id;
      renderCategoryTabs();
      renderCollections();
    });
    categoryTabs.appendChild(btn);
  });
}

function renderCollections() {
  collectionsContainer.innerHTML = '';

  const categoriesToShow = activeCategoryId === 'all'
    ? state.categories
    : state.categories.filter(c => c.id === activeCategoryId);

  let anyRendered = false;

  categoriesToShow.forEach(cat => {
    const items = state.bookmarks.filter(b => b.categoryId === cat.id && matchesFilter(b));
    if (searchQuery && items.length === 0) return;

    anyRendered = true;
    const block = document.createElement('section');
    block.className = 'category-block';

    const header = document.createElement('div');
    header.className = 'category-block-header';
    header.innerHTML = `
      <div class="category-block-title">
        <span class="cat-dot" style="background:${cat.color}"></span>
        <span>${escapeHtml(cat.name)}</span>
        <span class="count-pill">${items.length}</span>
      </div>
      <div class="category-header-actions">
        <button type="button" class="mini-btn" data-add-in-cat="${cat.id}">+ เพิ่มลิงก์ในหมวดนี้</button>
        <button type="button" class="mini-btn" data-edit-cat="${cat.id}">แก้ไขหมวด</button>
      </div>
    `;

    header.querySelector(`[data-add-in-cat="${cat.id}"]`).addEventListener('click', () => {
      openAddBookmarkModal(cat.id);
    });
    header.querySelector(`[data-edit-cat="${cat.id}"]`).addEventListener('click', () => {
      openEditCategoryModal(cat.id);
    });

    block.appendChild(header);

    if (items.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'empty-state';
      emptyBox.style.padding = '22px';
      emptyBox.innerHTML = `<p style="margin:0">ยังไม่มีทางลัดในหมวดหมู่นี้ กด <strong>+ เพิ่มลิงก์ในหมวดนี้</strong> หรือลากการ์ดมาวาง</p>`;
      block.appendChild(emptyBox);
    } else {
      const grid = document.createElement('div');
      grid.className = 'shortcuts-grid';
      items.forEach(bm => grid.appendChild(createShortcutCard(bm)));
      block.appendChild(grid);
    }

    collectionsContainer.appendChild(block);
  });

  if (!anyRendered) {
    collectionsContainer.innerHTML = `
      <div class="empty-state">
        <h3>ไม่พบทางลัดที่ค้นหา "${escapeHtml(searchQuery)}"</h3>
        <p>ลองเปลี่ยนคำค้นหา หรือกดปุ่ม Enter เพื่อค้นหาคำนี้บน Google ทันที</p>
      </div>
    `;
  }
}

function updateStatusFooter() {
  totalStatsText.textContent = `${state.bookmarks.length} ทางลัด ใน ${state.categories.length} หมวดหมู่`;
}

// ============================================================================
// CRUD Operations — Bookmarks & Drag Reorder
// ============================================================================
function populateCategorySelect(selectedId) {
  bookmarkCategorySelect.innerHTML = '';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    if (cat.id === selectedId) opt.selected = true;
    bookmarkCategorySelect.appendChild(opt);
  });
}

function openAddBookmarkModal(defaultCategoryId = null) {
  if (state.categories.length === 0) {
    state.categories.push({ id: 'cat-general', name: 'ทั่วไป', color: '#0EA5E9' });
  }
  bookmarkModalTitle.textContent = 'เพิ่มทางลัดเว็บไซต์ใหม่';
  bookmarkIdInput.value = '';
  bookmarkTitleInput.value = '';
  bookmarkUrlInput.value = '';
  bookmarkNoteInput.value = '';
  bookmarkPinnedCheck.checked = false;
  updateUrlFaviconPreview('');

  const targetCat = defaultCategoryId || (activeCategoryId !== 'all' ? activeCategoryId : state.categories[0].id);
  populateCategorySelect(targetCat);

  bookmarkModal.hidden = false;
  setTimeout(() => bookmarkUrlInput.focus(), 50);
}

function openEditBookmarkModal(id) {
  const bm = state.bookmarks.find(b => b.id === id);
  if (!bm) return;

  bookmarkModalTitle.textContent = 'แก้ไขทางลัดเว็บไซต์';
  bookmarkIdInput.value = bm.id;
  bookmarkTitleInput.value = bm.title;
  bookmarkUrlInput.value = bm.url;
  bookmarkNoteInput.value = bm.note || '';
  bookmarkPinnedCheck.checked = Boolean(bm.pinned);
  updateUrlFaviconPreview(bm.url);

  populateCategorySelect(bm.categoryId);
  bookmarkModal.hidden = false;
  setTimeout(() => bookmarkTitleInput.focus(), 50);
}

function togglePinBookmark(id) {
  const bm = state.bookmarks.find(b => b.id === id);
  if (!bm) return;
  bm.pinned = !bm.pinned;
  saveState();
  renderAll();
  showToast(bm.pinned ? `ปักหมุด "${bm.title}" แล้ว` : `ถอนหมุด "${bm.title}" แล้ว`);
}

function deleteBookmark(id) {
  const bm = state.bookmarks.find(b => b.id === id);
  if (!bm) return;
  if (!confirm(`ต้องการลบทางลัด "${bm.title}" ใช่หรือไม่?`)) return;

  state.bookmarks = state.bookmarks.filter(b => b.id !== id);
  saveState();
  renderAll();
  showToast(`ลบ "${bm.title}" เรียบร้อย`);
}

function reorderBookmarks(draggedId, targetId, targetCategoryId) {
  const fromIndex = state.bookmarks.findIndex(b => b.id === draggedId);
  const toIndex = state.bookmarks.findIndex(b => b.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return;

  const [movedItem] = state.bookmarks.splice(fromIndex, 1);
  if (targetCategoryId) {
    movedItem.categoryId = targetCategoryId;
  }
  state.bookmarks.splice(toIndex, 0, movedItem);
  saveState();
  renderAll();
  showToast('จัดเรียงลำดับใหม่แล้ว');
}

// ============================================================================
// CRUD Operations — Categories
// ============================================================================
function selectColorSwatch(colorHex) {
  categoryColorPicker.querySelectorAll('.color-swatch').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === colorHex);
  });
}

function getSelectedColorSwatch() {
  const active = categoryColorPicker.querySelector('.color-swatch.selected');
  return active ? active.dataset.color : '#0EA5E9';
}

function openAddCategoryModal() {
  categoryModalTitle.textContent = 'สร้างหมวดหมู่ใหม่';
  categoryIdInput.value = '';
  categoryNameInput.value = '';
  selectColorSwatch('#0EA5E9');
  deleteCategoryBtn.hidden = true;
  categoryModal.hidden = false;
  setTimeout(() => categoryNameInput.focus(), 50);
}

function openEditCategoryModal(catId) {
  const cat = state.categories.find(c => c.id === catId);
  if (!cat) return;
  categoryModalTitle.textContent = 'แก้ไขหมวดหมู่';
  categoryIdInput.value = cat.id;
  categoryNameInput.value = cat.name;
  selectColorSwatch(cat.color || '#0EA5E9');
  deleteCategoryBtn.hidden = state.categories.length <= 1;
  categoryModal.hidden = false;
  setTimeout(() => categoryNameInput.focus(), 50);
}

// ============================================================================
// Event Listeners
// ============================================================================
document.getElementById('openAddBookmarkBtn').addEventListener('click', () => openAddBookmarkModal());
document.getElementById('closeBookmarkModal').addEventListener('click', () => (bookmarkModal.hidden = true));
document.getElementById('cancelBookmarkBtn').addEventListener('click', () => (bookmarkModal.hidden = true));

bookmarkUrlInput.addEventListener('input', () => {
  updateUrlFaviconPreview(bookmarkUrlInput.value);
});

bookmarkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = bookmarkIdInput.value;
  const title = bookmarkTitleInput.value.trim();
  const url = normalizeUrl(bookmarkUrlInput.value);
  const categoryId = bookmarkCategorySelect.value;
  const icon = '';
  const note = bookmarkNoteInput.value.trim();
  const pinned = bookmarkPinnedCheck.checked;

  if (!title || !url) return;

  if (id) {
    const existing = state.bookmarks.find(b => b.id === id);
    if (existing) {
      Object.assign(existing, { title, url, categoryId, icon, note, pinned });
      showToast(`อัปเดต "${title}" แล้ว`);
    }
  } else {
    state.bookmarks.push({
      id: 'bm-' + Date.now(),
      title,
      url,
      categoryId,
      icon,
      note,
      pinned
    });
    showToast(`เพิ่มทางลัด "${title}" แล้ว`);
  }

  saveState();
  renderAll();
  bookmarkModal.hidden = true;
});

// Category Modal Listeners
document.getElementById('openAddCategoryBtn').addEventListener('click', openAddCategoryModal);
document.getElementById('closeCategoryModal').addEventListener('click', () => (categoryModal.hidden = true));
document.getElementById('cancelCategoryBtn').addEventListener('click', () => (categoryModal.hidden = true));

categoryColorPicker.addEventListener('click', (e) => {
  const swatch = e.target.closest('.color-swatch');
  if (!swatch) return;
  selectColorSwatch(swatch.dataset.color);
});

categoryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = categoryIdInput.value;
  const name = categoryNameInput.value.trim();
  const color = getSelectedColorSwatch();
  if (!name) return;

  if (id) {
    const cat = state.categories.find(c => c.id === id);
    if (cat) {
      cat.name = name;
      cat.color = color;
      showToast(`อัปเดตหมวดหมู่ "${name}" แล้ว`);
    }
  } else {
    const newId = 'cat-' + Date.now();
    state.categories.push({ id: newId, name, color });
    showToast(`สร้างหมวดหมู่ "${name}" แล้ว`);
  }

  saveState();
  renderAll();
  categoryModal.hidden = true;
});

deleteCategoryBtn.addEventListener('click', () => {
  const id = categoryIdInput.value;
  const cat = state.categories.find(c => c.id === id);
  if (!cat || state.categories.length <= 1) return;

  if (!confirm(`ต้องการลบหมวดหมู่ "${cat.name}" หรือไม่? (ทางลัดข้างในจะถูกย้ายไปหมวดหมู่แรกแทน)`)) {
    return;
  }

  const fallbackCat = state.categories.find(c => c.id !== id);
  state.bookmarks.forEach(b => {
    if (b.categoryId === id) b.categoryId = fallbackCat.id;
  });
  state.categories = state.categories.filter(c => c.id !== id);
  if (activeCategoryId === id) activeCategoryId = 'all';

  saveState();
  renderAll();
  categoryModal.hidden = true;
  showToast(`ลบหมวดหมู่ "${cat.name}" แล้ว`);
});

// Search & Omni Bar
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  if (searchEngine === 'filter') {
    renderPinned();
    renderCollections();
  }
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = searchInput.value.trim();
    if (!q) return;

    if (searchEngine === 'google') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
    } else if (searchEngine === 'youtube') {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
    } else if (searchEngine === 'github') {
      window.open(`https://github.com/search?q=${encodeURIComponent(q)}`, '_blank');
    } else {
      // Filter mode: open first matching bookmark or fallback to Google
      const firstMatch = state.bookmarks.find(b => matchesFilter(b));
      if (firstMatch) {
        window.open(normalizeUrl(firstMatch.url), '_blank');
      } else {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
      }
    }
  }
});

engineSelectorBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  engineMenu.hidden = !engineMenu.hidden;
});

engineMenu.addEventListener('click', (e) => {
  const opt = e.target.closest('.engine-option');
  if (!opt) return;
  searchEngine = opt.dataset.engine;
  engineMenu.querySelectorAll('.engine-option').forEach(el => el.classList.remove('active'));
  opt.classList.add('active');

  const labels = {
    filter: 'Filter',
    google: 'Google',
    youtube: 'YouTube',
    github: 'GitHub'
  };
  const placeholders = {
    filter: 'ค้นหาบุ๊กมาร์ก หรือกด Enter เพื่อเปิดลิงก์แรก...',
    google: 'พิมพ์คำค้นหาแล้วกด Enter เพื่อค้นบน Google...',
    youtube: 'พิมพ์คำค้นหาแล้วกด Enter เพื่อค้นบน YouTube...',
    github: 'พิมพ์คำค้นหาแล้วกด Enter เพื่อค้นบน GitHub...'
  };

  currentEngineLabel.textContent = labels[searchEngine];
  searchInput.placeholder = placeholders[searchEngine];
  engineMenu.hidden = true;
  searchInput.focus();
});

// View Mode Toggle
document.getElementById('viewModeBtn').addEventListener('click', () => {
  const isCompact = document.body.classList.toggle('compact-view');
  localStorage.setItem(VIEW_KEY, isCompact ? 'compact' : 'grid');
  showToast(isCompact ? 'มุมมองแบบกะทัดรัด (Compact)' : 'มุมมองแบบการ์ดมาตรฐาน (Grid)');
});

// Backup Export / Import Menu
const dataMenuBtn = document.getElementById('dataMenuBtn');
const dataMenuPanel = document.getElementById('dataMenuPanel');
const importFileInput = document.getElementById('importFileInput');

dataMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dataMenuPanel.hidden = !dataMenuPanel.hidden;
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkdock-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  dataMenuPanel.hidden = true;
  showToast('ดาวน์โหลดไฟล์สำรองข้อมูล (.json) แล้ว');
});

document.getElementById('importBtn').addEventListener('click', () => {
  importFileInput.click();
  dataMenuPanel.hidden = true;
});

importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported.categories) && Array.isArray(imported.bookmarks)) {
        state = imported;
        saveState();
        renderAll();
        showToast('นำเข้าข้อมูลบุ๊กมาร์กสำเร็จ!');
      } else {
        alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
      }
    } catch {
      alert('ไม่สามารถอ่านไฟล์ JSON ได้');
    }
  };
  reader.readAsText(file);
  importFileInput.value = '';
});

document.getElementById('resetDefaultBtn').addEventListener('click', () => {
  dataMenuPanel.hidden = true;
  if (!confirm('ต้องการรีเซ็ตข้อมูลกลับเป็นตัวอย่างเริ่มต้นหรือไม่?')) return;
  state = structuredClone(DEFAULT_DATA);
  activeCategoryId = 'all';
  saveState();
  renderAll();
  showToast('รีเซ็ตเป็นข้อมูลเริ่มต้นแล้ว');
});

// Close dropdowns & modals on outside click / Escape
document.addEventListener('click', () => {
  engineMenu.hidden = true;
  dataMenuPanel.hidden = true;
});

document.addEventListener('keydown', (e) => {
  const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

  if (e.key === 'Escape') {
    bookmarkModal.hidden = true;
    categoryModal.hidden = true;
    engineMenu.hidden = true;
    dataMenuPanel.hidden = true;
    if (document.activeElement === searchInput) {
      searchInput.blur();
    }
    return;
  }

  // Hotkey '/' to focus search
  if (e.key === '/' && !isTyping) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }

  // Hotkey 'n' or 'N' to add new shortcut
  if ((e.key === 'n' || e.key === 'N') && !isTyping && bookmarkModal.hidden && categoryModal.hidden) {
    e.preventDefault();
    openAddBookmarkModal();
    return;
  }

  // Alt + 1..9 to launch pinned shortcuts
  if (e.altKey && /^[1-9]$/.test(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    const pinnedList = state.bookmarks.filter(b => b.pinned);
    if (pinnedList[idx]) {
      e.preventDefault();
      window.open(normalizeUrl(pinnedList[idx].url), '_blank');
    }
  }
});

// ============================================================================
// Utilities
// ============================================================================
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2400);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Boot
initViewMode();
updateClock();
setInterval(updateClock, 15000);
renderAll();

