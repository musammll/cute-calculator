/**
 * PastelCalc ✨ - Cute Aesthetic Calculator & Calculation Journal
 * Features:
 * - Cute sound effects via Web Audio API
 * - 5 Aesthetic pastel themes
 * - Interactive companion mascot
 * - Smart auto-heading generation for calculation sets
 * - Complete manual editing (headings, math expressions, notes)
 * - Calculation Tape & History with search and export
 * - Full keyboard support & live recalculations
 */

(function () {
  'use strict';

  // ===================================================================
  // 1. Audio Synthesizer (Cute Bubbly SFX via Web Audio API)
  // ===================================================================
  class SoundController {
    constructor() {
      this.enabled = localStorage.getItem('pastel_sound_enabled') !== 'false';
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('pastel_sound_enabled', this.enabled);
      if (this.enabled) this.playPop();
      return this.enabled;
    }

    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.15) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // AudioContext might be restricted until user gesture
      }
    }

    playPop() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    }

    playSuccess() {
      if (!this.enabled) return;
      try {
        this.init();
        const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        chords.forEach((freq, idx) => {
          setTimeout(() => {
            this.playTone(freq, 'sine', 0.12, 0.1);
          }, idx * 45);
        });
      } catch (e) {}
    }

    playDelete() {
      this.playTone(280, 'sine', 0.06, 0.1);
    }

    playClear() {
      this.playTone(320, 'triangle', 0.12, 0.12);
    }
  }

  // ===================================================================
  // 2. Math Evaluator & Formatter
  // ===================================================================
  class MathEngine {
    static sanitize(raw) {
      if (!raw) return '';
      return raw
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/,/g, '');
    }

    static formatNumber(num) {
      if (typeof num !== 'number' || isNaN(num)) return '0';
      if (!isFinite(num)) return 'Error';
      // If float with long decimals, round nicely
      const rounded = Math.round(num * 1e10) / 1e10;
      return rounded.toString();
    }

    static evaluate(expression) {
      const sanitized = this.sanitize(expression).trim();
      if (!sanitized) return 0;

      // Check for dangerous input
      if (/[^0-9+\-*/().%^ ]/.test(sanitized)) {
        throw new Error('Invalid characters');
      }

      // Convert power ^ to **
      let expr = sanitized.replace(/\^/g, '**');

      // Smart Percentage handling
      // e.g., "100 + 10%" -> "100 + (100 * 0.10)"
      // e.g., "50 * 20%" -> "50 * 0.20"
      expr = expr.replace(/(\d+(\.\d+)?)\s*([+\-])\s*(\d+(\.\d+)?)%/g, '($1 $3 ($1 * ($4 / 100)))');
      expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1 / 100)');

      // Validate matching parentheses
      const openParens = (expr.match(/\(/g) || []).length;
      const closeParens = (expr.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        expr += ')'.repeat(openParens - closeParens);
      }

      // Safe Function evaluation
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${expr})`)();
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Invalid calculation');
      }
      return result;
    }
  }

  // ===================================================================
  // 3. Smart Auto-Heading Generator
  // ===================================================================
  class AutoHeadingGenerator {
    /**
     * Generates a context-aware aesthetic heading for a set of calculations.
     * @param {Array} items - List of calculation objects in the set
     * @returns {string} cute auto heading
     */
    static generate(items = []) {
      if (!items || items.length === 0) {
        return this.getDefaultHeading();
      }

      const count = items.length;
      const expressions = items.map(i => i.expression);
      const results = items.map(i => Number(i.result) || 0);

      // Analyze operations
      let hasPercentage = false;
      let hasDivision = false;
      let hasMultiplication = false;
      let hasAdditionOnly = true;
      let hasPowerOrRoot = false;

      expressions.forEach(expr => {
        if (expr.includes('%')) hasPercentage = true;
        if (expr.includes('÷') || expr.includes('/')) hasDivision = true;
        if (expr.includes('×') || expr.includes('*')) hasMultiplication = true;
        if (expr.includes('^') || expr.includes('√')) hasPowerOrRoot = true;
        if (/[*\/÷×^√\-]/.test(expr)) {
          hasAdditionOnly = false;
        }
      });

      // Heuristic 1: Percentage heavy -> Discounts / Sales / Tips
      if (hasPercentage) {
        return `🏷️ Discount & Tax Calculations (${count})`;
      }

      // Heuristic 2: Bill splitting / division
      if (hasDivision && !hasMultiplication && count <= 4) {
        return `🍕 Bill Split & Shares`;
      }

      // Heuristic 3: Multiples / Inventory / Batch sizes
      if (hasMultiplication && !hasDivision && count > 1) {
        return `📦 Quantities & Multiples (${count})`;
      }

      // Heuristic 4: Powers & Roots
      if (hasPowerOrRoot) {
        return `📐 Geometry & Advanced Math`;
      }

      // Heuristic 5: Running additions / shopping tally
      if (hasAdditionOnly && count >= 2) {
        const sum = results.reduce((a, b) => a + b, 0);
        if (sum > 1000) {
          return `💼 Budget & Expense Tally (${count})`;
        }
        return `🛒 Shopping & Tally List (${count})`;
      }

      // Heuristic 6: High value financial math
      const maxVal = Math.max(...results);
      if (maxVal >= 2000) {
        return `💳 Major Budget Math (${count} items)`;
      }

      // Heuristic 7: Time-of-day contextual cute header
      const hour = new Date().getHours();
      let timeLabel = '✨ Day Calculation';
      if (hour >= 5 && hour < 12) timeLabel = '🌅 Morning Math & Notes';
      else if (hour >= 12 && hour < 17) timeLabel = '☀️ Afternoon Tally';
      else if (hour >= 17 && hour < 21) timeLabel = '🌆 Evening Calculation';
      else timeLabel = '🌙 Cozy Night Calculations';

      if (count === 1) {
        return `✨ Quick Math (${items[0].expression})`;
      }

      return `${timeLabel} (${count})`;
    }

    static getDefaultHeading() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `✨ Session: ${timeStr}`;
    }
  }

  // ===================================================================
  // 4. Mascot Companion Dialogues & Reactions
  // ===================================================================
  const MASCOT_MOODS = {
    greetings: [
      "Ready to crunch some numbers! ✨",
      "I love pretty numbers! 🍓",
      "Click any past calculation to edit it! ✏️",
      "Tip: Press Enter anytime to calculate! 🎀",
      "Look at that aesthetic glow! 🌸"
    ],
    success: [
      "Spot on! Math magic! 🎉",
      "Yay! Saved to your journal! ✨",
      "Beautiful total! 💖",
      "Calculated in a snap! 🐰",
      "Clean numbers, happy mind! 🌟"
    ],
    clear: [
      "All squeaky clean! 🫧",
      "Fresh canvas ready! 🌱",
      "Reset & refreshed! 🍃"
    ],
    error: [
      "Oopsie! Double check the operators 🐾",
      "Hmm, looks like a typo! Try again? 🌸",
      "Almost! Check your brackets 🎀"
    ],
    newSet: [
      "Started a brand new set! 📝",
      "Fresh set ready with smart heading! 🎨",
      "New notebook page opened! ✨"
    ]
  };

  function getRandomMood(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // ===================================================================
  // 5. App State & Model
  // ===================================================================
  class PastelApp {
    constructor() {
      this.sound = new SoundController();
      this.storageKey = 'pastel_calc_journal_v2';
      this.themeStorageKey = 'pastel_calc_theme';

      // Journal data structure:
      // sets: [ { id, title, isCustomTitle, createdAt, items: [ { id, expression, result, note, timestamp } ] } ]
      this.sets = this.loadJournal();
      this.activeSetId = this.ensureActiveSet();

      // UI Elements
      this.calcInput = document.getElementById('calcInput');
      this.calcLiveResult = document.getElementById('calcLiveResult');
      this.calcPrevExpr = document.getElementById('calcPrevExpr');
      this.companionSpeech = document.getElementById('companionSpeech');
      this.companionAvatar = document.getElementById('companionAvatar');
      this.currentSetHeadingPreview = document.getElementById('currentSetHeadingPreview');
      this.historyList = document.getElementById('historyList');
      this.historyEmpty = document.getElementById('historyEmpty');
      this.historyCountBadge = document.getElementById('historyCountBadge');
      this.historySearchInput = document.getElementById('historySearchInput');
      this.soundToggleBtn = document.getElementById('soundToggle');
      this.toastEl = document.getElementById('toast');

      // Theme Elements
      this.themeBtn = document.getElementById('themeBtn');
      this.themeMenu = document.getElementById('themeMenu');

      // Modal Elements
      this.modalOverlay = document.getElementById('editModalOverlay');
      this.modalExpressionInput = document.getElementById('modalExpressionInput');
      this.modalCalculatedResult = document.getElementById('modalCalculatedResult');
      this.modalNoteInput = document.getElementById('modalNoteInput');
      this.modalSaveBtn = document.getElementById('modalSaveBtn');
      this.modalCancelBtn = document.getElementById('modalCancelBtn');
      this.modalCloseBtn = document.getElementById('modalCloseBtn');
      this.editingItemRef = null; // { setId, itemId }

      this.init();
    }

    init() {
      this.initTheme();
      this.initSoundUI();
      this.bindKeypad();
      this.bindKeyboard();
      this.bindMascot();
      this.bindHistoryControls();
      this.bindModal();
      this.renderHistory();
      this.updateActiveSetTag();

      // Focus input on load
      this.calcInput.focus();
    }

    // --- Persistence ---
    loadJournal() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved calculations', e);
      }
      
      // Default initial aesthetic starter data so user immediately sees how headings & history work
      return [
        {
          id: 'set_starter_1',
          title: '🍓 Strawberry Cafe & Treats',
          isCustomTitle: true,
          createdAt: Date.now() - 3600000,
          items: [
            {
              id: 'item_s1',
              expression: '4.50 + 3.75 + 2.50',
              result: '10.75',
              note: 'Matcha Latte, Croissant & Cookie',
              timestamp: Date.now() - 3600000
            },
            {
              id: 'item_s2',
              expression: '10.75 + 15%',
              result: '12.36',
              note: 'With 15% Tip',
              timestamp: Date.now() - 3400000
            },
            {
              id: 'item_s3',
              expression: '12.36 ÷ 2',
              result: '6.18',
              note: 'Split with Bestie',
              timestamp: Date.now() - 3200000
            }
          ]
        }
      ];
    }

    saveJournal() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.sets));
        this.renderHistory();
        this.updateActiveSetTag();
      } catch (e) {
        console.error('Failed to save journal', e);
      }
    }

    ensureActiveSet() {
      if (this.sets.length === 0) {
        const newSet = {
          id: 'set_' + Date.now(),
          title: AutoHeadingGenerator.getDefaultHeading(),
          isCustomTitle: false,
          createdAt: Date.now(),
          items: []
        };
        this.sets.unshift(newSet);
        return newSet.id;
      }
      return this.sets[0].id;
    }

    getActiveSet() {
      let set = this.sets.find(s => s.id === this.activeSetId);
      if (!set) {
        this.activeSetId = this.ensureActiveSet();
        set = this.sets[0];
      }
      return set;
    }

    startNewSet(customTitle = null) {
      const newSet = {
        id: 'set_' + Date.now(),
        title: customTitle || AutoHeadingGenerator.getDefaultHeading(),
        isCustomTitle: !!customTitle,
        createdAt: Date.now(),
        items: []
      };
      this.sets.unshift(newSet);
      this.activeSetId = newSet.id;
      this.saveJournal();

      this.sayCompanion(getRandomMood(MASCOT_MOODS.newSet));
      this.sound.playSuccess();
      this.showToast('✨ Started a new calculation set!');
    }

    // --- Audio UI ---
    initSoundUI() {
      this.soundToggleBtn.innerHTML = this.sound.enabled ? '<span>🔊</span>' : '<span>🔇</span>';
      this.soundToggleBtn.title = this.sound.enabled ? 'Cute Sound: Enabled' : 'Cute Sound: Muted';

      this.soundToggleBtn.addEventListener('click', () => {
        const state = this.sound.toggle();
        this.soundToggleBtn.innerHTML = state ? '<span>🔊</span>' : '<span>🔇</span>';
        this.soundToggleBtn.title = state ? 'Cute Sound: Enabled' : 'Cute Sound: Muted';
        this.showToast(state ? 'Sound effects turned ON 🎶' : 'Sound effects muted 🤫');
      });
    }

    // --- Themes ---
    initTheme() {
      const savedTheme = localStorage.getItem(this.themeStorageKey) || 'strawberry';
      this.applyTheme(savedTheme);

      if (this.themeBtn && this.themeMenu) {
        this.themeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.themeMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
          if (!this.themeMenu.contains(e.target) && !this.themeBtn.contains(e.target)) {
            this.themeMenu.classList.remove('show');
          }
        });
      }

      document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const targetTheme = btn.getAttribute('data-theme-val') || btn.dataset.themeVal;
          if (targetTheme) {
            this.applyTheme(targetTheme);
            if (this.themeMenu) {
              this.themeMenu.classList.remove('show');
            }
            this.sound.playPop();
            const labelEl = btn.querySelector('.theme-name') || btn;
            this.showToast(`Switched to ${labelEl.textContent.trim()} ✨`);
          }
        });
      });
    }

    applyTheme(theme) {
      if (!theme) theme = 'strawberry';

      // Set on BOTH documentElement (root) and body for 100% reliable CSS variable propagation
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(this.themeStorageKey, theme);
      } catch (e) {}

      // Theme info mapping
      const themeMeta = {
        strawberry: { name: 'Strawberry 🍓', mascot: '🍓', companion: '🐰', color: '#fb7185' },
        matcha: { name: 'Matcha 🍵', mascot: '🍵', companion: '🐸', color: '#10b981' },
        lavender: { name: 'Lavender 🫐', mascot: '🫐', companion: '🦄', color: '#8b5cf6' },
        honey: { name: 'Honey 🍯', mascot: '🍯', companion: '🐻', color: '#f59e0b' },
        midnight: { name: 'Midnight 🌙', mascot: '🌙', companion: '🐱', color: '#ec4899' }
      };

      const current = themeMeta[theme] || themeMeta.strawberry;

      // Update Pill Button Label & Swatch
      const currentThemeLabel = document.getElementById('currentThemeLabel');
      const currentThemeSwatch = document.getElementById('currentThemeSwatch');
      if (currentThemeLabel) currentThemeLabel.textContent = current.name;
      if (currentThemeSwatch) currentThemeSwatch.style.backgroundColor = current.color;

      // Update active check in menu
      document.querySelectorAll('.theme-option').forEach(btn => {
        const val = btn.getAttribute('data-theme-val');
        btn.classList.toggle('active', val === theme);
      });

      // Update brand mascot & companion avatar
      const brandMascot = document.getElementById('brandMascot');
      if (brandMascot) brandMascot.textContent = current.mascot;
      if (this.companionAvatar) this.companionAvatar.textContent = current.companion;
    }

    // --- Mascot Speech & Reactions ---
    sayCompanion(text) {
      if (!this.companionSpeech) return;
      this.companionSpeech.textContent = text;
      this.companionSpeech.style.transform = 'scale(1.05)';
      setTimeout(() => {
        this.companionSpeech.style.transform = 'scale(1)';
      }, 200);
    }

    bindMascot() {
      const brandMascot = document.getElementById('brandMascot');
      if (brandMascot) {
        brandMascot.addEventListener('click', () => {
          this.sound.playPop();
          brandMascot.style.transform = 'scale(1.3) rotate(15deg)';
          setTimeout(() => {
            brandMascot.style.transform = '';
          }, 300);
          this.sayCompanion(getRandomMood(MASCOT_MOODS.greetings));
        });
      }

      const companion = document.getElementById('companion');
      if (companion) {
        companion.addEventListener('click', () => {
          this.sound.playPop();
          this.sayCompanion(getRandomMood(MASCOT_MOODS.greetings));
        });
      }
    }

    // --- Toast Notifications ---
    showToast(message) {
      if (!this.toastEl) return;
      this.toastEl.textContent = message;
      this.toastEl.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        this.toastEl.classList.remove('show');
      }, 2400);
    }

    // --- Keypad & Input Logic ---
    bindKeypad() {
      // Keypad buttons
      document.querySelectorAll('.calc-keypad .key, .calc-utility-row .key').forEach(button => {
        button.addEventListener('click', (e) => {
          const action = button.dataset.action;
          const val = button.dataset.val;

          // Push feedback animation
          button.classList.add('pressed');
          setTimeout(() => button.classList.remove('pressed'), 120);

          if (action === 'operator') {
            this.insertOperator(val);
            this.sound.playPop();
          } else if (val !== undefined) {
            this.insertValue(val);
            this.sound.playPop();
          } else if (action) {
            this.handleAction(action);
          }
        });
      });

      // Click on Active Set Tag to rename right from calculator header
      const activeSetTag = document.getElementById('activeSetTag');
      if (activeSetTag) {
        activeSetTag.style.cursor = 'pointer';
        activeSetTag.addEventListener('click', () => {
          const activeSet = this.getActiveSet();
          const newName = prompt('Rename current calculation set heading:', activeSet.title);
          if (newName && newName.trim()) {
            activeSet.title = newName.trim();
            activeSet.isCustomTitle = true;
            this.saveJournal();
            this.sound.playPop();
            this.showToast('✏️ Set heading updated!');
          }
        });
      }

      // New set button
      const btnNewSet = document.getElementById('btnNewSet');
      if (btnNewSet) {
        btnNewSet.addEventListener('click', () => {
          this.startNewSet();
        });
      }

      // Input event listener for live evaluation and manual keyboard typing
      this.calcInput.addEventListener('input', () => {
        this.updateLiveResult();
      });

      this.calcInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.executeCalculation();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.clearAll();
        }
      });
    }

    bindKeyboard() {
      // Global listener so typing anywhere feeds into calculator unless typing in modal/search
      document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (
          active === this.modalExpressionInput ||
          active === this.modalNoteInput ||
          active === this.historySearchInput ||
          active.classList.contains('set-title-editable')
        ) {
          return; // Let user type in text fields uninterrupted
        }

        if (e.key >= '0' && e.key <= '9') {
          if (active !== this.calcInput) {
            this.insertValue(e.key);
            this.sound.playPop();
          }
        } else if (['+', '-', '*', '/'].includes(e.key)) {
          if (active !== this.calcInput) {
            this.insertOperator(e.key);
            this.sound.playPop();
          }
        } else if (e.key === '.' || e.key === '(' || e.key === ')') {
          if (active !== this.calcInput) {
            this.insertValue(e.key);
            this.sound.playPop();
          }
        } else if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault();
          this.executeCalculation();
        } else if (e.key === 'Backspace' && active !== this.calcInput) {
          this.backspace();
        } else if (e.key === 'Escape') {
          this.clearAll();
        }
      });
    }

    insertValue(val) {
      const input = this.calcInput;
      // If current value is just '0' and typing a number, replace the '0'
      if (input.value === '0' && val >= '0' && val <= '9') {
        input.value = val;
        this.updateLiveResult();
        return;
      }

      const start = input.selectionStart !== null ? input.selectionStart : input.value.length;
      const end = input.selectionEnd !== null ? input.selectionEnd : input.value.length;
      const cur = input.value;

      // Replace or insert at cursor
      input.value = cur.substring(0, start) + val + cur.substring(end);
      input.selectionStart = input.selectionEnd = start + val.length;
      this.updateLiveResult();
    }

    insertOperator(op) {
      let displayOp = op;
      if (op === '*') displayOp = ' × ';
      else if (op === '/') displayOp = ' ÷ ';
      else if (op === '+') displayOp = ' + ';
      else if (op === '-') displayOp = ' − ';

      const input = this.calcInput;
      let val = input.value;

      // If input is empty and previous live result is a valid number, continue from result!
      if (!val.trim() && this.calcLiveResult.textContent !== '0' && this.calcLiveResult.textContent !== 'Error' && this.calcLiveResult.textContent !== '...') {
        input.value = this.calcLiveResult.textContent + displayOp;
        this.updateLiveResult();
        return;
      }

      // If ends with another operator, replace it nicely
      if (/[+\-×÷/*−]\s*$/.test(val.trim())) {
        input.value = val.trim().replace(/[+\-×÷/*−\s]+$/, '') + displayOp;
      } else {
        this.insertValue(displayOp);
      }
      this.updateLiveResult();
    }

    handleAction(action) {
      switch (action) {
        case 'clear-all':
          this.clearAll();
          break;
        case 'delete':
          this.backspace();
          break;
        case 'operator':
          // operator data-val is read from button
          break;
        case 'paren':
          this.insertSmartParentheses();
          this.sound.playPop();
          break;
        case 'negate':
          this.toggleNegate();
          this.sound.playPop();
          break;
        case 'percent':
          this.insertValue('%');
          this.sound.playPop();
          break;
        case 'square':
          this.insertValue('^2');
          this.sound.playPop();
          break;
        case 'sqrt':
          this.applySquareRoot();
          this.sound.playPop();
          break;
        case 'equals':
          this.executeCalculation();
          break;
      }
    }

    insertSmartParentheses() {
      const val = this.calcInput.value;
      const openCount = (val.match(/\(/g) || []).length;
      const closeCount = (val.match(/\)/g) || []).length;

      // If open > close and last char is a number or close paren, insert ')'
      if (openCount > closeCount && /[\d)%]$/.test(val.trim())) {
        this.insertValue(')');
      } else {
        this.insertValue('(');
      }
    }

    toggleNegate() {
      const val = this.calcInput.value.trim();
      if (!val) return;

      // Wrap in -() or remove if already wrapped
      if (val.startsWith('-(') && val.endsWith(')')) {
        this.calcInput.value = val.slice(2, -1);
      } else if (!isNaN(Number(val))) {
        this.calcInput.value = (Number(val) * -1).toString();
      } else {
        this.calcInput.value = `-(${val})`;
      }
      this.updateLiveResult();
    }

    applySquareRoot() {
      const val = this.calcInput.value.trim();
      if (!val) return;

      try {
        const evaluated = MathEngine.evaluate(val);
        if (evaluated < 0) {
          this.sayCompanion("Can't take square root of negative numbers! 🌸");
          return;
        }
        const res = Math.sqrt(evaluated);
        this.calcPrevExpr.textContent = `√(${val})`;
        this.calcInput.value = MathEngine.formatNumber(res);
        this.updateLiveResult();
        this.commitCalculation(`√(${val})`, res);
      } catch (e) {
        this.calcInput.value = `Math.sqrt(${val})`;
        this.updateLiveResult();
      }
    }

    backspace() {
      const input = this.calcInput;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const cur = input.value;

      if (start === end && start > 0) {
        input.value = cur.substring(0, start - 1) + cur.substring(end);
        input.selectionStart = input.selectionEnd = start - 1;
      } else if (start !== end) {
        input.value = cur.substring(0, start) + cur.substring(end);
        input.selectionStart = input.selectionEnd = start;
      }
      this.sound.playDelete();
      this.updateLiveResult();
    }

    clearAll() {
      this.calcInput.value = '';
      this.calcLiveResult.textContent = '0';
      this.calcPrevExpr.textContent = '';
      this.calcInput.focus();
      this.sound.playClear();
      this.sayCompanion(getRandomMood(MASCOT_MOODS.clear));
    }

    updateLiveResult() {
      const raw = this.calcInput.value.trim();
      if (!raw) {
        this.calcLiveResult.textContent = '0';
        return;
      }
      try {
        const val = MathEngine.evaluate(raw);
        this.calcLiveResult.textContent = MathEngine.formatNumber(val);
      } catch (e) {
        // Incomplete expression while typing
        this.calcLiveResult.textContent = '...';
      }
    }

    executeCalculation() {
      const expression = this.calcInput.value.trim();
      if (!expression) return;

      try {
        const resultVal = MathEngine.evaluate(expression);
        const formatted = MathEngine.formatNumber(resultVal);

        // Update preview line
        this.calcPrevExpr.textContent = `${expression} =`;
        this.calcInput.value = formatted;
        this.calcLiveResult.textContent = formatted;

        // Save into active calculation set
        this.commitCalculation(expression, resultVal);

        // Mascot celebratory response
        this.sound.playSuccess();
        this.sayCompanion(getRandomMood(MASCOT_MOODS.success));
      } catch (err) {
        this.sound.playTone(180, 'sawtooth', 0.15, 0.15);
        this.sayCompanion(getRandomMood(MASCOT_MOODS.error));
        this.calcLiveResult.textContent = 'Error';
      }
    }

    // --- Commit calculation into history set ---
    commitCalculation(expression, resultVal, note = '') {
      const activeSet = this.getActiveSet();

      const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        expression: expression,
        result: MathEngine.formatNumber(resultVal),
        note: note,
        timestamp: Date.now()
      };

      activeSet.items.unshift(newItem);

      // Smart Auto-Heading:
      // If the heading was NOT manually edited by user, recalculate heading automatically!
      if (!activeSet.isCustomTitle) {
        activeSet.title = AutoHeadingGenerator.generate(activeSet.items);
      }

      this.saveJournal();
    }

    updateActiveSetTag() {
      const activeSet = this.getActiveSet();
      if (this.currentSetHeadingPreview && activeSet) {
        this.currentSetHeadingPreview.textContent = `Active Set: ${activeSet.title}`;
        this.currentSetHeadingPreview.title = `Active Set: ${activeSet.title} (${activeSet.items.length} calculations)`;
      }
    }

    // =================================================================
    // 6. History Rendering & Manual Editing
    // =================================================================
    renderHistory(filterQuery = '') {
      const query = (filterQuery || this.historySearchInput.value || '').trim().toLowerCase();
      this.historyList.innerHTML = '';

      let totalCalculationsCount = 0;
      this.sets.forEach(set => totalCalculationsCount += set.items.length);
      this.historyCountBadge.textContent = totalCalculationsCount;

      if (this.sets.length === 0 || totalCalculationsCount === 0) {
        this.historyEmpty.style.display = 'flex';
        return;
      }
      this.historyEmpty.style.display = 'none';

      this.sets.forEach(set => {
        // Filter items
        const filteredItems = set.items.filter(item => {
          if (!query) return true;
          return (
            set.title.toLowerCase().includes(query) ||
            item.expression.toLowerCase().includes(query) ||
            item.result.toLowerCase().includes(query) ||
            (item.note && item.note.toLowerCase().includes(query))
          );
        });

        // Skip set if searching and no items match and set title doesn't match
        if (query && filteredItems.length === 0 && !set.title.toLowerCase().includes(query)) {
          return;
        }

        const itemsToDisplay = query ? filteredItems : set.items;
        const setCard = this.createSetElement(set, itemsToDisplay);
        this.historyList.appendChild(setCard);
      });
    }

    createSetElement(set, itemsToDisplay) {
      const setCard = document.createElement('div');
      setCard.className = 'history-set';
      if (set.id === this.activeSetId) {
        setCard.classList.add('active-set');
      }

      // Calculate Set Total
      const setSum = set.items.reduce((acc, curr) => acc + (Number(curr.result) || 0), 0);
      const formattedSetSum = MathEngine.formatNumber(setSum);

      const dateStr = new Date(set.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      setCard.innerHTML = `
        <div class="set-header">
          <div class="set-title-wrap">
            <span class="set-icon">${set.id === this.activeSetId ? '⭐' : '📁'}</span>
            <!-- Manually editable title element -->
            <input 
              type="text" 
              class="set-title-editable" 
              value="${this.escapeHtml(set.title)}" 
              title="Click to rename this calculation set"
            />
            <span class="set-badge">${set.items.length}</span>
          </div>
          <div class="set-actions">
            <button class="icon-btn-sm btn-set-rename" title="Rename this set heading" data-set-id="${set.id}">
              <span>✏️</span>
            </button>
            <button class="icon-btn-sm btn-set-activate" title="Make this the active set" data-set-id="${set.id}">
              <span>${set.id === this.activeSetId ? '📌' : '📍'}</span>
            </button>
            <button class="icon-btn-sm btn-set-delete" title="Delete entire set" data-set-id="${set.id}">
              <span>🗑️</span>
            </button>
          </div>
        </div>

        <div class="set-meta">
          <span>🕒 ${dateStr}</span>
          <span class="set-total-badge">Set Sum: = ${formattedSetSum}</span>
        </div>

        <div class="set-items-list"></div>
      `;

      // Handle manual heading inline editing
      const titleInput = setCard.querySelector('.set-title-editable');
      titleInput.addEventListener('change', (e) => {
        const newTitle = e.target.value.trim();
        if (newTitle) {
          set.title = newTitle;
          set.isCustomTitle = true; // User manually set title, don't overwrite with auto-generator
          this.saveJournal();
          this.showToast('✏️ Heading updated!');
        } else {
          e.target.value = set.title;
        }
      });
      titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          titleInput.blur();
        }
      });

      // Set rename pencil button
      const renameBtn = setCard.querySelector('.btn-set-rename');
      if (renameBtn) {
        renameBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          titleInput.focus();
          titleInput.select();
        });
      }

      // Set activate button
      const activateBtn = setCard.querySelector('.btn-set-activate');
      activateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeSetId = set.id;
        this.saveJournal();
        this.showToast(`Active set set to: ${set.title}`);
        this.sound.playPop();
      });

      // Set delete button
      const deleteBtn = setCard.querySelector('.btn-set-delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete the entire set "${set.title}" and its ${set.items.length} calculations?`)) {
          this.sets = this.sets.filter(s => s.id !== set.id);
          if (this.activeSetId === set.id) {
            this.activeSetId = this.ensureActiveSet();
          }
          this.saveJournal();
          this.sound.playDelete();
          this.showToast('🗑️ Calculation set deleted');
        }
      });

      // Render calculations within this set
      const itemsContainer = setCard.querySelector('.set-items-list');
      itemsToDisplay.forEach(item => {
        const itemEl = this.createItemElement(set, item);
        itemsContainer.appendChild(itemEl);
      });

      return setCard;
    }

    createItemElement(set, item) {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      itemEl.title = 'Click to load into calculator';

      itemEl.innerHTML = `
        <div class="item-left">
          <div class="item-expression">${this.escapeHtml(item.expression)}</div>
          ${item.note ? `<div class="item-note">🏷️ ${this.escapeHtml(item.note)}</div>` : ''}
        </div>
        <div class="item-right">
          <div class="item-result">= ${this.escapeHtml(item.result)}</div>
          <div class="item-actions">
            <!-- Edit button to manually edit expression & notes -->
            <button class="icon-btn-sm btn-item-edit" title="Manually edit expression or note" data-item-id="${item.id}">
              <span>✏️</span>
            </button>
            <!-- Delete single item -->
            <button class="icon-btn-sm btn-item-delete" title="Delete calculation" data-item-id="${item.id}">
              <span>✕</span>
            </button>
          </div>
        </div>
      `;

      // Clicking item body loads expression into calculator
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.item-actions')) return; // Ignore if edit/delete clicked
        this.calcInput.value = item.expression;
        this.calcLiveResult.textContent = item.result;
        this.calcPrevExpr.textContent = `Loaded from "${set.title}"`;
        this.calcInput.focus();
        this.sound.playPop();
        this.sayCompanion(`Loaded ${item.result} into calculator ✨`);
      });

      // Edit item button
      const editBtn = itemEl.querySelector('.btn-item-edit');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditModal(set.id, item.id);
      });

      // Delete item button
      const delBtn = itemEl.querySelector('.btn-item-delete');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        set.items = set.items.filter(i => i.id !== item.id);
        // If empty, regenerate or keep
        if (!set.isCustomTitle) {
          set.title = AutoHeadingGenerator.generate(set.items);
        }
        this.saveJournal();
        this.sound.playDelete();
        this.showToast('Calculation removed');
      });

      return itemEl;
    }

    // --- Modal for Manual Item Editing ---
    bindModal() {
      this.modalCancelBtn.addEventListener('click', () => this.closeEditModal());
      this.modalCloseBtn.addEventListener('click', () => this.closeEditModal());
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) this.closeEditModal();
      });

      // Live recalculation inside modal as user edits expression
      this.modalExpressionInput.addEventListener('input', () => {
        const expr = this.modalExpressionInput.value.trim();
        try {
          const val = MathEngine.evaluate(expr);
          this.modalCalculatedResult.textContent = MathEngine.formatNumber(val);
        } catch (e) {
          this.modalCalculatedResult.textContent = '...';
        }
      });

      this.modalSaveBtn.addEventListener('click', () => {
        this.saveModalChanges();
      });
    }

    openEditModal(setId, itemId) {
      const set = this.sets.find(s => s.id === setId);
      if (!set) return;
      const item = set.items.find(i => i.id === itemId);
      if (!item) return;

      this.editingItemRef = { setId, itemId };
      this.modalExpressionInput.value = item.expression;
      this.modalCalculatedResult.textContent = item.result;
      this.modalNoteInput.value = item.note || '';

      this.modalOverlay.classList.add('show');
      this.modalExpressionInput.focus();
    }

    closeEditModal() {
      this.modalOverlay.classList.remove('show');
      this.editingItemRef = null;
    }

    saveModalChanges() {
      if (!this.editingItemRef) return;
      const { setId, itemId } = this.editingItemRef;
      const set = this.sets.find(s => s.id === setId);
      if (!set) return;
      const item = set.items.find(i => i.id === itemId);
      if (!item) return;

      const newExpr = this.modalExpressionInput.value.trim();
      const newNote = this.modalNoteInput.value.trim();

      if (!newExpr) {
        alert('Expression cannot be empty');
        return;
      }

      try {
        const recalculated = MathEngine.evaluate(newExpr);
        item.expression = newExpr;
        item.result = MathEngine.formatNumber(recalculated);
        item.note = newNote;

        // Auto update title if not custom
        if (!set.isCustomTitle) {
          set.title = AutoHeadingGenerator.generate(set.items);
        }

        this.saveJournal();
        this.closeEditModal();
        this.sound.playSuccess();
        this.showToast('✨ Calculation updated successfully!');
      } catch (e) {
        alert('Invalid math expression. Please check operators and numbers.');
      }
    }

    // --- History Controls (Search, Clear, Export, Drawer) ---
    bindHistoryControls() {
      // Search
      this.historySearchInput.addEventListener('input', () => {
        this.renderHistory();
      });

      // Clear all history
      const btnClearHistory = document.getElementById('btnClearHistory');
      if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
          if (confirm('Are you sure you want to clear your entire calculation journal?')) {
            this.sets = [];
            this.activeSetId = this.ensureActiveSet();
            this.saveJournal();
            this.sound.playClear();
            this.showToast('Journal cleared 🫧');
          }
        });
      }

      // Export / Copy Journal
      const btnExportHistory = document.getElementById('btnExportHistory');
      if (btnExportHistory) {
        btnExportHistory.addEventListener('click', () => {
          this.exportJournal();
        });
      }

      // Mobile drawer toggle
      const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
      const historyPanel = document.getElementById('historyPanel');
      const btnCloseHistory = document.getElementById('btnCloseHistory');

      if (toggleHistoryBtn && historyPanel) {
        toggleHistoryBtn.addEventListener('click', () => {
          historyPanel.classList.toggle('open');
          this.sound.playPop();
        });
      }

      if (btnCloseHistory && historyPanel) {
        btnCloseHistory.addEventListener('click', () => {
          historyPanel.classList.remove('open');
        });
      }
    }

    exportJournal() {
      if (this.sets.length === 0 || this.sets.every(s => s.items.length === 0)) {
        this.showToast('No calculations to export yet! 📝');
        return;
      }

      let text = `# PastelCalc - Calculation Journal ✨\nGenerated: ${new Date().toLocaleString()}\n\n`;

      this.sets.forEach((set, sIdx) => {
        if (set.items.length === 0) return;
        const setSum = set.items.reduce((acc, curr) => acc + (Number(curr.result) || 0), 0);
        text += `## ${set.title}\n`;
        text += `Created: ${new Date(set.createdAt).toLocaleString()} | Set Sum = ${MathEngine.formatNumber(setSum)}\n`;
        text += `--------------------------------------------------\n`;
        set.items.forEach((item, idx) => {
          const noteStr = item.note ? ` (${item.note})` : '';
          text += `${idx + 1}. ${item.expression} = ${item.result}${noteStr}\n`;
        });
        text += `\n`;
      });

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.sound.playSuccess();
          this.showToast('📋 Journal copied to clipboard!');
        }).catch(() => {
          this.downloadJournalFile(text);
        });
      } else {
        this.downloadJournalFile(text);
      }
    }

    downloadJournalFile(content) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PastelCalc-Journal-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('💾 Journal downloaded as text file!');
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  // Initialize application on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.pastelApp = new PastelApp();
  });
})();
