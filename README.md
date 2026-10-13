# HabitFlow — Daily Habit Tracker & Analytics

A modern, responsive habit tracker web application built with **HTML5, Vanilla CSS3, and JavaScript**, featuring an aesthetic **dark purple glowing theme**, real-time progress calculations, streak counters, weekly analytics, an interactive calendar heatmap, sound effects, and LocalStorage persistence.

---

## 🌟 Key Features

1. **Habit Management**:
   - **Add Daily Habits**: Create habits with customizable names, categories, emoji icons, and glowing color swatches.
   - **Edit & Delete**: Easily modify habit details or remove habits with a custom confirmation dialog.
   - **Mark as Completed**: Single-tap checkbox toggle with smooth checkmark animation, pop/chime sound effect, and celebratory confetti upon completing all habits for the day.

2. **Real-time Daily Progress**:
   - Dynamic progress bar with live percentage calculation.
   - Status badges that adapt based on your progress (`Ready to roll 🚀`, `Keep pushing 💪`, `Great momentum ⚡`, `Crushing it! 🔥`, `All Done! 🌟`).

3. **Streak Tracking**:
   - **Active Streak**: Tracks consecutive days of habit completion.
   - **Longest Streak**: Records your all-time consistency personal record.
   - **Visual Streak Flame & Dots**: Animated flicker flame and status level.
   - **Individual Habit Streaks**: Each habit card displays its own streak counter and 7-day mini dot history.

4. **Weekly Analytics & Bar Chart**:
   - Interactive 7-day vertical bar chart showing completion percentages for Mon–Sun.
   - Highlights today's performance and displays weekly consistency insights.

5. **Interactive Calendar Heatmap**:
   - GitHub-style monthly activity heatmap with 5 color intensity levels based on completion percentage.
   - Month-by-month navigation.
   - Clicking any day opens the **Day History Modal**, showing exactly which habits were completed on that date with the ability to retroactively toggle them.

6. **Audio & Micro-interactions**:
   - **Web Audio API**: Synthesized sounds for habit completion, unchecking, and 100% daily fanfare (no external audio files needed).
   - Sound toggle button to mute/unmute at any time.
   - Confetti bursts using Canvas Confetti.

7. **LocalStorage Persistence**:
   - Automatically saves all habits and completion history in browser `localStorage`.
   - Built-in **Demo Data** seeder for instant exploration.
   - **Export & Import**: Export your habits to a `.json` backup file or import existing backups.

8. **Modern Dark Purple Aesthetics**:
   - Rich dark palette (`#070512`, `#0e0924`, `#171034`, with neon violet `#8b5cf6`, orchid `#c084fc`, and flame `#f97316` accents).
   - Glassmorphic panels with subtle backdrop blur and glowing borders.
   - Modern typography using Google Fonts (`Outfit` and `Plus Jakarta Sans`).
   - Fully responsive across desktop, tablet, and mobile screens.

---

## 🚀 How to Run Locally

### Option 1: Live Local Server
The server is currently running in the background:
- Open your browser and navigate to: **`http://localhost:8080/index.html`**

### Option 2: Direct File Open
You can also open [`index.html`](file:///c:/Users/prabh/OneDrive/Desktop/WAD%20ASSIGN%20TASK2/index.html) directly in any web browser (Chrome, Edge, Firefox, Brave, Safari).
