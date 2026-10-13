/**
 * HABITFLOW — DAILY HABIT TRACKER APPLICATION LOGIC
 * High-performance, vanilla JS with LocalStorage, Web Audio API,
 * streak algorithms, interactive calendar heatmap, and weekly analytics.
 */

// --- Constants & Configuration ---
const STORAGE_KEY = 'habitflow_habits_v1';
const SOUND_SETTING_KEY = 'habitflow_sound_enabled';

// Motivational quotes pool
const MOTIVATIONAL_QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Consistency is what transforms average into excellence.", author: "Tony Robbins" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" }
];

// Default demo habits for first launch or reset
const DEFAULT_DEMO_HABITS = [
  {
    id: 'habit_demo_1',
    name: 'Morning Hydration (750ml)',
    category: 'Health',
    icon: '💧',
    color: '#06b6d4',
    desc: 'Drink water with lemon right after waking up',
    createdAt: getDaysAgoDate(14),
    completedDates: getSampleCompletedDates([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13])
  },
  {
    id: 'habit_demo_2',
    name: '30-Minute Daily Workout',
    category: 'Fitness',
    icon: '🏃',
    color: '#f97316',
    desc: 'Cardio, strength session or brisk outdoor walk',
    createdAt: getDaysAgoDate(14),
    completedDates: getSampleCompletedDates([0, 1, 2, 3, 5, 6, 7, 8, 10, 12])
  },
  {
    id: 'habit_demo_3',
    name: 'Read 15 Pages of Book',
    category: 'Learning',
    icon: '📚',
    color: '#8b5cf6',
    desc: 'Current: Atomic Habits by James Clear',
    createdAt: getDaysAgoDate(14),
    completedDates: getSampleCompletedDates([1, 2, 3, 4, 6, 7, 8, 9, 11, 13])
  },
  {
    id: 'habit_demo_4',
    name: 'Mindful Meditation (10m)',
    category: 'Mindfulness',
    icon: '🧘',
    color: '#a855f7',
    desc: 'Box breathing and calm presence before work',
    createdAt: getDaysAgoDate(14),
    completedDates: getSampleCompletedDates([0, 1, 2, 4, 5, 6, 7, 9, 12])
  },
  {
    id: 'habit_demo_5',
    name: 'Focused Deep Work Block',
    category: 'Productivity',
    icon: '💻',
    color: '#ec4899',
    desc: '60 mins uninterrupted high-leverage focus',
    createdAt: getDaysAgoDate(14),
    completedDates: getSampleCompletedDates([0, 1, 2, 3, 4, 7, 8, 10, 13])
  }
];

// Helper to calculate dates N days ago (YYYY-MM-DD)
function getDaysAgoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDateKey(d);
}

function getSampleCompletedDates(offsetsArray) {
  return offsetsArray.map(days => getDaysAgoDate(days));
}

function formatDateKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// --- Application State ---
class HabitFlowApp {
  constructor() {
    this.habits = [];
    this.currentFilter = 'all';
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.soundEnabled = true;

    // Calendar navigation state
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth(); // 0-indexed

    // Delete pending habit holder
    this.habitToDelete = null;

    // Web Audio Synthesizer context
    this.audioCtx = null;

    this.init();
  }

  init() {
    this.loadSettings();
    this.loadHabits();
    this.initDOMReferences();
    this.initEventListeners();
    this.renderHeaderDate();
    this.renderMotivationalQuote();
    this.renderAll();
    this.initLucide();
  }

  // Safely initialize Lucide icons
  initLucide() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // --- Sound Synthesizer via Web Audio API ---
  playTone(type = 'complete') {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'complete') {
        // High cheery chime (E5 -> G#5 -> B5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.16);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'uncheck') {
        // Subtle low pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'celebrate') {
        // Flourish arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const o = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          o.connect(g);
          g.connect(this.audioCtx.destination);
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.07);
          g.gain.setValueAtTime(0.2, now + idx * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);
          o.start(now + idx * 0.07);
          o.stop(now + idx * 0.07 + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // --- Confetti Celebration ---
  triggerConfetti(epic = false) {
    if (typeof confetti === 'function') {
      if (epic) {
        // Grand celebration fireworks
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b']
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#a855f7', '#f43f5e', '#3b82f6']
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#a855f7', '#f43f5e', '#3b82f6']
          });
        }, 200);
      } else {
        // Normal burst
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#a855f7', '#c084fc', '#ec4899', '#10b981']
        });
      }
    }
  }

  // --- LocalStorage Storage Layer ---
  loadSettings() {
    const sound = localStorage.getItem(SOUND_SETTING_KEY);
    this.soundEnabled = sound === null ? true : sound === 'true';
  }

  saveSettings() {
    localStorage.setItem(SOUND_SETTING_KEY, String(this.soundEnabled));
  }

  loadHabits() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.habits = JSON.parse(data);
      } else {
        // Pre-populate with beautiful demo data on first launch
        this.habits = JSON.parse(JSON.stringify(DEFAULT_DEMO_HABITS));
        this.saveHabits();
      }
    } catch (err) {
      console.error('Error loading habits:', err);
      this.habits = [];
    }
  }

  saveHabits() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.habits));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      this.showToast('Storage quota exceeded or error saving habits', 'info');
    }
  }

  // --- DOM References ---
  initDOMReferences() {
    this.dom = {
      headerDateText: document.getElementById('headerDateText'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      soundIcon: document.getElementById('soundIcon'),
      resetDemoBtn: document.getElementById('resetDemoBtn'),
      openNewHabitModalBtn: document.getElementById('openNewHabitModalBtn'),
      quickAddBtn: document.getElementById('quickAddBtn'),

      // Top Stats
      dailyProgressPercent: document.getElementById('dailyProgressPercent'),
      dailyProgressBar: document.getElementById('dailyProgressBar'),
      dailyCompletedCount: document.getElementById('dailyCompletedCount'),
      dailyStatusBadge: document.getElementById('dailyStatusBadge'),
      currentStreakDisplay: document.getElementById('currentStreakDisplay'),
      streakDots: document.getElementById('streakDots'),
      streakStatus: document.getElementById('streakStatus'),
      streakSubtitle: document.getElementById('streakSubtitle'),
      longestStreakDisplay: document.getElementById('longestStreakDisplay'),
      bestStreakMeta: document.getElementById('bestStreakMeta'),
      weeklyAverageRate: document.getElementById('weeklyAverageRate'),
      weeklyCompletionsCount: document.getElementById('weeklyCompletionsCount'),
      consistencyBadge: document.getElementById('consistencyBadge'),

      // Habits list section
      habitsCountBadge: document.getElementById('habitsCountBadge'),
      habitSearchInput: document.getElementById('habitSearchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      statusFilterTabs: document.getElementById('statusFilterTabs'),
      categoryChips: document.getElementById('categoryChips'),
      habitsListContainer: document.getElementById('habitsListContainer'),
      emptyStateCard: document.getElementById('emptyStateCard'),
      emptyStateTitle: document.getElementById('emptyStateTitle'),
      emptyStateDesc: document.getElementById('emptyStateDesc'),
      emptyStateActionBtn: document.getElementById('emptyStateActionBtn'),

      // Analytics & Calendar
      weeklyBarsContainer: document.getElementById('weeklyBarsContainer'),
      weeklyInsightText: document.getElementById('weeklyInsightText'),
      prevMonthBtn: document.getElementById('prevMonthBtn'),
      nextMonthBtn: document.getElementById('nextMonthBtn'),
      calendarMonthLabel: document.getElementById('calendarMonthLabel'),
      calendarCellsContainer: document.getElementById('calendarCellsContainer'),

      // Motivation
      dailyQuoteText: document.getElementById('dailyQuoteText'),
      dailyQuoteAuthor: document.getElementById('dailyQuoteAuthor'),

      // Habit Modal
      habitModalOverlay: document.getElementById('habitModalOverlay'),
      closeHabitModalBtn: document.getElementById('closeHabitModalBtn'),
      cancelHabitModalBtn: document.getElementById('cancelHabitModalBtn'),
      habitForm: document.getElementById('habitForm'),
      modalTitle: document.getElementById('modalTitle'),
      habitEditId: document.getElementById('habitEditId'),
      habitNameInput: document.getElementById('habitNameInput'),
      habitCategorySelect: document.getElementById('habitCategorySelect'),
      habitDescInput: document.getElementById('habitDescInput'),
      iconPickerGrid: document.getElementById('iconPickerGrid'),
      selectedIconInput: document.getElementById('selectedIconInput'),
      colorSwatches: document.getElementById('colorSwatches'),
      selectedColorInput: document.getElementById('selectedColorInput'),
      saveHabitBtnText: document.getElementById('saveHabitBtnText'),

      // Calendar Day Detail Modal
      dayDetailModalOverlay: document.getElementById('dayDetailModalOverlay'),
      closeDayDetailModalBtn: document.getElementById('closeDayDetailModalBtn'),
      doneDayDetailModalBtn: document.getElementById('doneDayDetailModalBtn'),
      dayDetailTitle: document.getElementById('dayDetailTitle'),
      dayDetailSubtitle: document.getElementById('dayDetailSubtitle'),
      dayDetailPercent: document.getElementById('dayDetailPercent'),
      dayDetailCount: document.getElementById('dayDetailCount'),
      dayDetailStatusText: document.getElementById('dayDetailStatusText'),
      dayDetailList: document.getElementById('dayDetailList'),

      // Delete Modal
      confirmDeleteModalOverlay: document.getElementById('confirmDeleteModalOverlay'),
      cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
      confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
      deleteHabitPreview: document.getElementById('deleteHabitPreview'),

      // Footer Actions
      exportDataBtn: document.getElementById('exportDataBtn'),
      importDataBtn: document.getElementById('importDataBtn'),
      importFileInput: document.getElementById('importFileInput'),
      clearAllDataBtn: document.getElementById('clearAllDataBtn'),

      // Toast
      toastContainer: document.getElementById('toastContainer')
    };

    this.updateSoundIcon();
  }

  // --- Event Listeners Setup ---
  initEventListeners() {
    // Sound Toggle
    this.dom.soundToggleBtn.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.saveSettings();
      this.updateSoundIcon();
      this.showToast(this.soundEnabled ? 'Sound effects enabled' : 'Sound effects muted', 'info');
      if (this.soundEnabled) this.playTone('complete');
    });

    // Reset to Demo Data
    this.dom.resetDemoBtn.addEventListener('click', () => {
      if (confirm('Load demo habits and progress? This will reset your habit list to demo habits.')) {
        this.habits = JSON.parse(JSON.stringify(DEFAULT_DEMO_HABITS));
        this.saveHabits();
        this.renderAll();
        this.showToast('Demo habits loaded successfully!', 'success');
      }
    });

    // Clear All Data
    this.dom.clearAllDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete ALL habits and history? This cannot be undone.')) {
        this.habits = [];
        this.saveHabits();
        this.renderAll();
        this.showToast('All habits cleared', 'info');
      }
    });

    // Export Data JSON
    this.dom.exportDataBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.habits, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `habitflow_backup_${getDaysAgoDate(0)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.showToast('Habits exported as JSON file', 'success');
    });

    // Import Data JSON
    this.dom.importDataBtn.addEventListener('click', () => {
      this.dom.importFileInput.click();
    });

    this.dom.importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            this.habits = imported;
            this.saveHabits();
            this.renderAll();
            this.showToast('Habits imported successfully!', 'success');
          } else {
            alert('Invalid backup file format');
          }
        } catch (err) {
          alert('Could not read backup JSON file');
        }
      };
      reader.readAsText(file);
      this.dom.importFileInput.value = '';
    });

    // Open Habit Modal (Add New)
    const openAddModal = () => {
      this.openHabitModal();
    };
    this.dom.openNewHabitModalBtn.addEventListener('click', openAddModal);
    this.dom.quickAddBtn.addEventListener('click', openAddModal);
    this.dom.emptyStateActionBtn.addEventListener('click', openAddModal);

    // Close Habit Modal
    this.dom.closeHabitModalBtn.addEventListener('click', () => this.closeHabitModal());
    this.dom.cancelHabitModalBtn.addEventListener('click', () => this.closeHabitModal());

    // Habit Form Submission
    this.dom.habitForm.addEventListener('submit', (e) => this.handleHabitFormSubmit(e));

    // Icon Picker buttons
    this.dom.iconPickerGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.icon-pick-btn');
      if (!btn) return;
      this.dom.iconPickerGrid.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.dom.selectedIconInput.value = btn.dataset.icon;
    });

    // Color Swatches
    this.dom.colorSwatches.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      this.dom.selectedColorInput.value = swatch.dataset.color;
    });

    // Category select auto-switch icon helper
    this.dom.habitCategorySelect.addEventListener('change', (e) => {
      const cat = e.target.value;
      const defaultIcons = {
        'Health': '💧',
        'Fitness': '🏃',
        'Mindfulness': '🧘',
        'Productivity': '💻',
        'Learning': '📚',
        'Creative': '🎨',
        'Lifestyle': '☀️'
      };
      const matchingIcon = defaultIcons[cat];
      if (matchingIcon) {
        const targetBtn = Array.from(this.dom.iconPickerGrid.children).find(b => b.dataset.icon === matchingIcon);
        if (targetBtn) {
          targetBtn.click();
        }
      }
    });

    // Search Habit Input
    this.dom.habitSearchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      if (this.searchQuery.length > 0) {
        this.dom.clearSearchBtn.classList.remove('hidden');
      } else {
        this.dom.clearSearchBtn.classList.add('hidden');
      }
      this.renderHabitsList();
    });

    this.dom.clearSearchBtn.addEventListener('click', () => {
      this.dom.habitSearchInput.value = '';
      this.searchQuery = '';
      this.dom.clearSearchBtn.classList.add('hidden');
      this.renderHabitsList();
    });

    // Status Filter Tabs
    this.dom.statusFilterTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      this.dom.statusFilterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.currentFilter = tab.dataset.filter;
      this.renderHabitsList();
    });

    // Category Filter Chips
    this.dom.categoryChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;
      this.dom.categoryChips.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.currentCategory = chip.dataset.category;
      this.renderHabitsList();
    });

    // Calendar Navigation
    this.dom.prevMonthBtn.addEventListener('click', () => {
      this.viewMonth--;
      if (this.viewMonth < 0) {
        this.viewMonth = 11;
        this.viewYear--;
      }
      this.renderCalendar();
      this.initLucide();
    });

    this.dom.nextMonthBtn.addEventListener('click', () => {
      this.viewMonth++;
      if (this.viewMonth > 11) {
        this.viewMonth = 0;
        this.viewYear++;
      }
      this.renderCalendar();
      this.initLucide();
    });

    // Close Day Detail Modal
    this.dom.closeDayDetailModalBtn.addEventListener('click', () => this.closeDayDetailModal());
    this.dom.doneDayDetailModalBtn.addEventListener('click', () => this.closeDayDetailModal());

    // Delete Modal
    this.dom.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
    this.dom.confirmDeleteBtn.addEventListener('click', () => this.executeDeleteHabit());

    // Close modals on clicking overlay backdrop
    window.addEventListener('click', (e) => {
      if (e.target === this.dom.habitModalOverlay) this.closeHabitModal();
      if (e.target === this.dom.dayDetailModalOverlay) this.closeDayDetailModal();
      if (e.target === this.dom.confirmDeleteModalOverlay) this.closeDeleteModal();
    });

    // Keyboard ESC to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeHabitModal();
        this.closeDayDetailModal();
        this.closeDeleteModal();
      }
    });
  }

  updateSoundIcon() {
    if (this.dom.soundIcon) {
      this.dom.soundIcon.setAttribute('data-lucide', this.soundEnabled ? 'volume-2' : 'volume-x');
      this.initLucide();
    }
  }

  // --- Header & Motivational Quote ---
  renderHeaderDate() {
    const today = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    this.dom.headerDateText.textContent = today.toLocaleDateString('en-US', options);
  }

  renderMotivationalQuote() {
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    this.dom.dailyQuoteText.textContent = `"${quote.text}"`;
    this.dom.dailyQuoteAuthor.textContent = `— ${quote.author}`;
  }

  // --- Modal Open/Close Logic ---
  openHabitModal(habitToEdit = null) {
    this.dom.habitForm.reset();
    if (habitToEdit) {
      this.dom.modalTitle.textContent = 'Edit Habit';
      this.dom.saveHabitBtnText.textContent = 'Update Habit';
      this.dom.habitEditId.value = habitToEdit.id;
      this.dom.habitNameInput.value = habitToEdit.name;
      this.dom.habitCategorySelect.value = habitToEdit.category || 'Health';
      this.dom.habitDescInput.value = habitToEdit.desc || '';
      this.dom.selectedIconInput.value = habitToEdit.icon || '💧';
      this.dom.selectedColorInput.value = habitToEdit.color || '#8b5cf6';

      // Select icon
      const iconBtn = Array.from(this.dom.iconPickerGrid.children).find(b => b.dataset.icon === habitToEdit.icon);
      if (iconBtn) {
        this.dom.iconPickerGrid.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('active'));
        iconBtn.classList.add('active');
      }

      // Select color
      const colorBtn = Array.from(this.dom.colorSwatches.children).find(b => b.dataset.color === habitToEdit.color);
      if (colorBtn) {
        this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        colorBtn.classList.add('active');
      }
    } else {
      this.dom.modalTitle.textContent = 'Create New Habit';
      this.dom.saveHabitBtnText.textContent = 'Save Habit';
      this.dom.habitEditId.value = '';
      this.dom.selectedIconInput.value = '💧';
      this.dom.selectedColorInput.value = '#8b5cf6';

      // Reset icon & color to first
      this.dom.iconPickerGrid.querySelectorAll('.icon-pick-btn').forEach((b, i) => {
        b.classList.toggle('active', i === 0);
      });
      this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach((s, i) => {
        s.classList.toggle('active', i === 0);
      });
    }

    this.dom.habitModalOverlay.classList.remove('hidden');
    this.dom.habitNameInput.focus();
    this.initLucide();
  }

  closeHabitModal() {
    this.dom.habitModalOverlay.classList.add('hidden');
  }

  handleHabitFormSubmit(e) {
    e.preventDefault();
    const name = this.dom.habitNameInput.value.trim();
    if (!name) return;

    const category = this.dom.habitCategorySelect.value;
    const desc = this.dom.habitDescInput.value.trim();
    const icon = this.dom.selectedIconInput.value || '💧';
    const color = this.dom.selectedColorInput.value || '#8b5cf6';
    const editId = this.dom.habitEditId.value;

    if (editId) {
      // Edit existing
      const habit = this.habits.find(h => h.id === editId);
      if (habit) {
        habit.name = name;
        habit.category = category;
        habit.desc = desc;
        habit.icon = icon;
        habit.color = color;
        this.showToast(`Updated "${name}"`, 'success');
      }
    } else {
      // Create new
      const newHabit = {
        id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name,
        category,
        icon,
        color,
        desc,
        createdAt: formatDateKey(new Date()),
        completedDates: []
      };
      this.habits.unshift(newHabit);
      this.showToast(`Added new habit "${name}"`, 'success');
    }

    this.saveHabits();
    this.closeHabitModal();
    this.renderAll();
    this.playTone('complete');
  }

  // --- Habit Deletion with Confirm Dialog ---
  confirmDelete(habit) {
    this.habitToDelete = habit;
    this.dom.deleteHabitPreview.textContent = `${habit.icon} ${habit.name} (${habit.category})`;
    this.dom.confirmDeleteModalOverlay.classList.remove('hidden');
    this.initLucide();
  }

  closeDeleteModal() {
    this.habitToDelete = null;
    this.dom.confirmDeleteModalOverlay.classList.add('hidden');
  }

  executeDeleteHabit() {
    if (!this.habitToDelete) return;
    const habitName = this.habitToDelete.name;
    this.habits = this.habits.filter(h => h.id !== this.habitToDelete.id);
    this.saveHabits();
    this.closeDeleteModal();
    this.renderAll();
    this.showToast(`Deleted "${habitName}"`, 'info');
  }

  // --- Mark Habit Completed Toggle (Today or Arbitrary Date) ---
  toggleHabitCompletion(habitId, dateKey = null) {
    const targetDate = dateKey || formatDateKey(new Date());
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!Array.isArray(habit.completedDates)) {
      habit.completedDates = [];
    }

    const isAlreadyCompleted = habit.completedDates.includes(targetDate);

    if (isAlreadyCompleted) {
      // Uncheck
      habit.completedDates = habit.completedDates.filter(d => d !== targetDate);
      this.playTone('uncheck');
    } else {
      // Check
      habit.completedDates.push(targetDate);
      this.playTone('complete');

      // Check if all habits for today are now completed!
      const todayKey = formatDateKey(new Date());
      if (targetDate === todayKey) {
        const allDone = this.habits.length > 0 && this.habits.every(h => (h.completedDates || []).includes(todayKey));
        if (allDone) {
          this.triggerConfetti(true);
          this.playTone('celebrate');
          this.showToast("All habits complete for today! Fantastic work! 🌟", 'success');
        } else {
          this.triggerConfetti(false);
        }
      }
    }

    this.saveHabits();
    this.renderAll();

    // If day detail modal is open for this date, re-render it
    if (!this.dom.dayDetailModalOverlay.classList.contains('hidden')) {
      this.renderDayDetailContent(targetDate);
    }
  }

  // --- Streaks Calculation Algorithm ---
  calculateStreaks() {
    const todayKey = formatDateKey(new Date());
    const yesterdayKey = getDaysAgoDate(1);

    // Build a map of dates that had at least one completion
    const activitySet = new Set();
    this.habits.forEach(h => {
      (h.completedDates || []).forEach(d => activitySet.add(d));
    });

    // 1. Current Active Streak
    let currentStreak = 0;
    let checkDate = new Date();

    // If today has completion, start counting from today
    // If today doesn't have completion yet, check if yesterday had completion to keep streak intact!
    let startCounting = false;
    if (activitySet.has(todayKey)) {
      startCounting = true;
    } else if (activitySet.has(yesterdayKey)) {
      // Yesterday had activity, move pointer to yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      startCounting = true;
    }

    if (startCounting) {
      while (true) {
        const key = formatDateKey(checkDate);
        if (activitySet.has(key)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 2. Longest Streak Ever
    let longestStreak = currentStreak;
    if (activitySet.size > 0) {
      // Sort dates chronologically
      const sortedDates = Array.from(activitySet).sort();
      let tempStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prev = parseDateKey(sortedDates[i - 1]);
        const curr = parseDateKey(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    }

    return { currentStreak, longestStreak };
  }

  // Calculate streak for an individual habit
  calculateHabitStreak(habit) {
    if (!habit.completedDates || habit.completedDates.length === 0) return 0;
    const dateSet = new Set(habit.completedDates);
    const todayKey = formatDateKey(new Date());
    const yesterdayKey = getDaysAgoDate(1);

    let streak = 0;
    let checkDate = new Date();

    if (dateSet.has(todayKey)) {
      // counting from today
    } else if (dateSet.has(yesterdayKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      return 0;
    }

    while (true) {
      const key = formatDateKey(checkDate);
      if (dateSet.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // --- Render Top Stats Cards ---
  renderStats() {
    const todayKey = formatDateKey(new Date());
    const totalHabits = this.habits.length;
    let completedToday = 0;

    this.habits.forEach(h => {
      if ((h.completedDates || []).includes(todayKey)) {
        completedToday++;
      }
    });

    const percent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    // Daily Progress Card
    this.dom.dailyProgressPercent.textContent = `${percent}%`;
    this.dom.dailyProgressBar.style.width = `${percent}%`;
    this.dom.dailyCompletedCount.textContent = `${completedToday} of ${totalHabits} completed`;

    let badgeText = 'Ready to roll 🚀';
    if (percent === 100 && totalHabits > 0) badgeText = 'All Done! 🌟';
    else if (percent >= 70) badgeText = 'Crushing it! 🔥';
    else if (percent >= 40) badgeText = 'Great momentum ⚡';
    else if (percent > 0) badgeText = 'Keep pushing 💪';
    this.dom.dailyStatusBadge.textContent = badgeText;

    // Streaks
    const { currentStreak, longestStreak } = this.calculateStreaks();
    this.dom.currentStreakDisplay.innerHTML = `${currentStreak} <span class="stat-unit">days</span>`;
    this.dom.longestStreakDisplay.innerHTML = `${longestStreak} <span class="stat-unit">days</span>`;

    if (currentStreak >= 7) {
      this.dom.streakStatus.textContent = '🔥 Unstoppable';
    } else if (currentStreak >= 3) {
      this.dom.streakStatus.textContent = '⚡ In The Zone';
    } else if (currentStreak > 0) {
      this.dom.streakStatus.textContent = '✨ Active Run';
    } else {
      this.dom.streakStatus.textContent = '🌱 Start Today';
    }

    // Render Streak Dots (visual meter up to 5 days)
    const dotCount = 5;
    let dotsHtml = '';
    for (let i = 0; i < dotCount; i++) {
      dotsHtml += `<span class="dot ${i < Math.min(currentStreak, dotCount) ? 'active' : ''}"></span>`;
    }
    this.dom.streakDots.innerHTML = dotsHtml;

    // 7-Day Consistency Stat
    let totalCompletions7d = 0;
    let totalPossible7d = totalHabits * 7;
    for (let i = 0; i < 7; i++) {
      const dateKey = getDaysAgoDate(i);
      this.habits.forEach(h => {
        if ((h.completedDates || []).includes(dateKey)) {
          totalCompletions7d++;
        }
      });
    }

    const weeklyAvg = totalPossible7d > 0 ? Math.round((totalCompletions7d / totalPossible7d) * 100) : 0;
    this.dom.weeklyAverageRate.textContent = `${weeklyAvg}%`;
    this.dom.weeklyCompletionsCount.textContent = `${totalCompletions7d} checks in past 7 days`;

    if (weeklyAvg >= 80) this.dom.consistencyBadge.textContent = 'Elite Consistency 🏆';
    else if (weeklyAvg >= 50) this.dom.consistencyBadge.textContent = 'Solid Rhythm ⚡';
    else this.dom.consistencyBadge.textContent = 'Building Pace 🌱';
  }

  // --- Render Habits List ---
  renderHabitsList() {
    const todayKey = formatDateKey(new Date());

    // Filter habits
    let filtered = this.habits.filter(h => {
      // Category filter
      if (this.currentCategory !== 'all' && h.category !== this.currentCategory) {
        return false;
      }

      // Search query filter
      if (this.searchQuery && !h.name.toLowerCase().includes(this.searchQuery) &&
          !(h.desc && h.desc.toLowerCase().includes(this.searchQuery))) {
        return false;
      }

      // Status filter
      const isDone = (h.completedDates || []).includes(todayKey);
      if (this.currentFilter === 'pending' && isDone) return false;
      if (this.currentFilter === 'completed' && !isDone) return false;

      return true;
    });

    this.dom.habitsCountBadge.textContent = `${filtered.length} of ${this.habits.length}`;

    if (filtered.length === 0) {
      this.dom.habitsListContainer.innerHTML = '';
      this.dom.emptyStateCard.classList.remove('hidden');

      if (this.habits.length === 0) {
        this.dom.emptyStateTitle.textContent = 'No habits yet';
        this.dom.emptyStateDesc.textContent = 'Create your daily habits to start building streaks and momentum!';
        this.dom.emptyStateActionBtn.classList.remove('hidden');
      } else {
        this.dom.emptyStateTitle.textContent = 'No habits matching filters';
        this.dom.emptyStateDesc.textContent = 'Try selecting another category or clearing your search filter.';
        this.dom.emptyStateActionBtn.classList.add('hidden');
      }
      return;
    }

    this.dom.emptyStateCard.classList.add('hidden');

    // Generate Cards
    let html = '';
    filtered.forEach(habit => {
      const isCompleted = (habit.completedDates || []).includes(todayKey);
      const streak = this.calculateHabitStreak(habit);
      const cardColor = habit.color || '#8b5cf6';

      // 7-day mini dot history (from 6 days ago up to today)
      let miniHistoryHtml = '';
      for (let i = 6; i >= 0; i--) {
        const dKey = getDaysAgoDate(i);
        const dayDone = (habit.completedDates || []).includes(dKey);
        const isToday = i === 0;
        miniHistoryHtml += `
          <span class="mini-day-dot ${dayDone ? 'done' : ''} ${isToday ? 'is-today' : ''}" 
                title="${dKey}: ${dayDone ? 'Completed' : 'Missed'}"></span>
        `;
      }

      html += `
        <article class="habit-card ${isCompleted ? 'is-completed' : ''}" 
                 style="--habit-color: ${cardColor};" 
                 data-id="${habit.id}">
          <div class="habit-card-left">
            <button class="habit-check-btn" 
                    title="${isCompleted ? 'Mark as incomplete' : 'Mark as completed for today'}"
                    aria-label="${isCompleted ? 'Completed' : 'Not completed'}"
                    data-action="toggle" 
                    data-id="${habit.id}">
              <i data-lucide="check"></i>
            </button>

            <div class="habit-details">
              <div class="habit-title-row">
                <span class="habit-emoji-badge">${habit.icon || '💧'}</span>
                <h3 class="habit-title">${this.escapeHTML(habit.name)}</h3>
                <span class="habit-category-tag">${habit.category || 'Daily'}</span>
              </div>
              ${habit.desc ? `<p class="habit-desc">${this.escapeHTML(habit.desc)}</p>` : ''}
            </div>
          </div>

          <div class="habit-card-right">
            <div class="habit-streak-pill" title="Current habit streak: ${streak} days">
              <i data-lucide="flame"></i>
              <span>${streak}d</span>
            </div>

            <div class="habit-mini-history" title="Last 7 days completion history">
              ${miniHistoryHtml}
            </div>

            <div class="habit-actions-group">
              <button class="habit-action-btn edit" 
                      title="Edit Habit" 
                      aria-label="Edit Habit"
                      data-action="edit" 
                      data-id="${habit.id}">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="habit-action-btn delete" 
                      title="Delete Habit" 
                      aria-label="Delete Habit"
                      data-action="delete" 
                      data-id="${habit.id}">
                <i data-lucide="trash"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    });

    this.dom.habitsListContainer.innerHTML = html;

    // Delegate clicks on habit list
    this.dom.habitsListContainer.onclick = (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle"]');
      if (toggleBtn) {
        this.toggleHabitCompletion(toggleBtn.dataset.id);
        return;
      }

      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn) {
        const h = this.habits.find(item => item.id === editBtn.dataset.id);
        if (h) this.openHabitModal(h);
        return;
      }

      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        const h = this.habits.find(item => item.id === deleteBtn.dataset.id);
        if (h) this.confirmDelete(h);
        return;
      }
    };

    this.initLucide();
  }

  // --- Render Weekly Analytics Bar Chart ---
  renderWeeklyChart() {
    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totalHabits = this.habits.length;
    let html = '';
    let weeklyRateSum = 0;

    // 7 days: 6 days ago -> today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = formatDateKey(d);
      const dayLabel = daysName[d.getDay()];
      const isToday = i === 0;

      let completedCount = 0;
      this.habits.forEach(h => {
        if ((h.completedDates || []).includes(dateKey)) {
          completedCount++;
        }
      });

      const pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
      weeklyRateSum += pct;

      html += `
        <div class="bar-column ${isToday ? 'is-today' : ''}" 
             title="${dateKey}: ${completedCount}/${totalHabits} completed (${pct}%)"
             onclick="window.habitFlow.openDayDetail('${dateKey}')">
          <span class="bar-tooltip">${pct}%</span>
          <div class="bar-pill-track">
            <div class="bar-pill-fill" style="height: ${Math.max(pct, 4)}%"></div>
          </div>
          <span class="bar-label">${isToday ? 'Today' : dayLabel}</span>
        </div>
      `;
    }

    this.dom.weeklyBarsContainer.innerHTML = html;

    const avgRate = Math.round(weeklyRateSum / 7);
    if (avgRate >= 80) {
      this.dom.weeklyInsightText.textContent = `Spectacular! You're completing ${avgRate}% of habits this week. Keep flowing!`;
    } else if (avgRate >= 50) {
      this.dom.weeklyInsightText.textContent = `Solid work: ${avgRate}% weekly consistency rate. Finish today strong!`;
    } else {
      this.dom.weeklyInsightText.textContent = `Currently at ${avgRate}% this week. A small step today creates giant results!`;
    }
  }

  // --- Render Calendar Heatmap View ---
  renderCalendar() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this.dom.calendarMonthLabel.textContent = `${monthNames[this.viewMonth]} ${this.viewYear}`;

    // Calculate days for the month
    const firstDayOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const lastDayOfMonth = new Date(this.viewYear, this.viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Day of week for 1st day (0 is Sun, convert to Mon-based: Mon=0, Sun=6)
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const todayKey = formatDateKey(new Date());
    const totalHabits = this.habits.length;
    let html = '';

    // Empty padding slots for days before 1st of month
    for (let p = 0; p < startDayIndex; p++) {
      html += `<div class="calendar-day-cell other-month" aria-hidden="true"></div>`;
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const cellDate = new Date(this.viewYear, this.viewMonth, dayNum);
      const dateKey = formatDateKey(cellDate);
      const isToday = dateKey === todayKey;

      let completedCount = 0;
      this.habits.forEach(h => {
        if ((h.completedDates || []).includes(dateKey)) {
          completedCount++;
        }
      });

      const pct = totalHabits > 0 ? (completedCount / totalHabits) : 0;
      let levelClass = 'level-0';
      if (pct > 0.75) levelClass = 'level-4';
      else if (pct > 0.5) levelClass = 'level-3';
      else if (pct > 0.25) levelClass = 'level-2';
      else if (pct > 0) levelClass = 'level-1';

      html += `
        <button class="calendar-day-cell ${levelClass} ${isToday ? 'is-today' : ''}" 
                data-date="${dateKey}"
                title="${dateKey}: ${completedCount}/${totalHabits} completed (${Math.round(pct * 100)}%)"
                onclick="window.habitFlow.openDayDetail('${dateKey}')">
          <span>${dayNum}</span>
        </button>
      `;
    }

    this.dom.calendarCellsContainer.innerHTML = html;
  }

  // --- Day Detail Modal (History & Interactive Toggle) ---
  openDayDetail(dateKey) {
    this.currentInspectedDate = dateKey;
    const d = parseDateKey(dateKey);
    const formatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    this.dom.dayDetailTitle.textContent = formatted;

    const isToday = dateKey === formatDateKey(new Date());
    this.dom.dayDetailSubtitle.textContent = isToday ? "Today's habit completion status" : "Historical completion on this date";

    this.renderDayDetailContent(dateKey);
    this.dom.dayDetailModalOverlay.classList.remove('hidden');
    this.initLucide();
  }

  closeDayDetailModal() {
    this.dom.dayDetailModalOverlay.classList.add('hidden');
    this.currentInspectedDate = null;
  }

  renderDayDetailContent(dateKey) {
    const totalHabits = this.habits.length;
    let completedCount = 0;

    let listHtml = '';
    this.habits.forEach(h => {
      const isDone = (h.completedDates || []).includes(dateKey);
      if (isDone) completedCount++;

      listHtml += `
        <div class="day-habit-row">
          <div class="day-habit-info">
            <span class="habit-emoji-badge">${h.icon || '💧'}</span>
            <span style="font-weight: 600; color: #fff;">${this.escapeHTML(h.name)}</span>
          </div>
          <button class="day-habit-toggle-btn ${isDone ? 'done' : ''}" 
                  title="${isDone ? 'Mark as missed' : 'Mark as done'}"
                  onclick="window.habitFlow.toggleHabitCompletion('${h.id}', '${dateKey}')">
            <i data-lucide="${isDone ? 'check' : 'plus'}"></i>
          </button>
        </div>
      `;
    });

    const pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
    this.dom.dayDetailPercent.textContent = `${pct}%`;
    this.dom.dayDetailCount.textContent = `${completedCount}/${totalHabits}`;

    if (pct === 100 && totalHabits > 0) {
      this.dom.dayDetailStatusText.textContent = "100% Perfect Day ✨";
    } else if (pct > 0) {
      this.dom.dayDetailStatusText.textContent = `${completedCount} Habits Done`;
    } else {
      this.dom.dayDetailStatusText.textContent = "No habits logged";
    }

    this.dom.dayDetailList.innerHTML = listHtml || '<p style="color:var(--text-muted); padding:1rem; text-align:center;">No habits available to display.</p>';
    this.initLucide();
  }

  // --- Master Re-render Trigger ---
  renderAll() {
    this.renderStats();
    this.renderHabitsList();
    this.renderWeeklyChart();
    this.renderCalendar();
  }

  // --- Toast Notifications System ---
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    else if (type === 'flame') iconName = 'flame';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${this.escapeHTML(message)}</span>
    `;

    this.dom.toastContainer.appendChild(toast);
    this.initLucide();

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
}

// Instantiate and expose globally for inline event handlers
window.addEventListener('DOMContentLoaded', () => {
  window.habitFlow = new HabitFlowApp();
});
