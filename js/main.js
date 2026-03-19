// main.js - Core application logic, flower interaction, and state management

document.addEventListener('DOMContentLoaded', () => {
    // --- State and DOM Elements ---
    const flowerBud = document.getElementById('flower-bud');
    const flower = document.getElementById('flower');
    const petals = document.querySelectorAll('.petal');
    const panelBackdrop = document.getElementById('panel-backdrop');
    const panelContainer = document.getElementById('panel-container');
    const closePanelBtn = document.getElementById('close-panel');
    const panels = document.querySelectorAll('.panel-content');
    const themeHintPopup = document.getElementById('theme-hint-popup');
    const closeHintBtn = document.getElementById('close-hint');

    // --- Flower Blooming Logic ---
    let isBloomed = false;

    // Simulate initial load delay then bloom
    setTimeout(() => {
        bloomFlower();
    }, 1500);

    flowerBud.addEventListener('click', () => {
        if (!isBloomed) bloomFlower();
    });

    function bloomFlower() {
        isBloomed = true;
        flowerBud.classList.add('hidden');
        flower.classList.remove('hidden');

        // Ensure petals start with a slight stagger animation could be done via JS or CSS

        // Show theme switcher hint popup with a slight delay
        setTimeout(() => {
            if (themeHintPopup) {
                themeHintPopup.classList.remove('hidden');
            }
        }, 1200);
    }

    // --- Petal Interaction ---
    petals.forEach(petal => {
        petal.addEventListener('click', () => {
            const feature = petal.getAttribute('data-feature');
            openFeaturePanel(feature);
        });
    });

    // --- Theme Switching Logic on Face Click ---
    const centerPiece = document.querySelector('.center-piece');
    let currentThemeIndex = 0;
    const themes = ['day', 'night', 'underwater'];

    if (centerPiece) {
        centerPiece.addEventListener('click', () => {
            // Give the face a little bounce feedback
            centerPiece.style.transform = 'scale(0.9)';
            setTimeout(() => {
                centerPiece.style.transform = '';
            }, 100);

            // Hide hint popup when user takes the hint
            if (themeHintPopup && !themeHintPopup.classList.contains('hidden')) {
                hideHintPopup();
            }

            // Cycle Theme
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            const newTheme = themes[currentThemeIndex];

            // Apply body classes
            document.body.classList.remove('night-theme', 'underwater-theme');
            if (newTheme !== 'day') {
                document.body.classList.add(`${newTheme}-theme`);
            }

            // Sync with effects.js particles/butterflies
            document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }

    // --- UI Panel Management ---
    function openFeaturePanel(featureId) {
        // Hide all panels
        panels.forEach(panel => panel.classList.add('hidden'));

        // Show target panel
        const targetPanel = document.getElementById(`${featureId}-panel`);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
        }

        // Show container and backdrop
        panelBackdrop.classList.remove('hidden');
        panelContainer.classList.remove('hidden');

        // If music panel opened, hide mini-player
        if (featureId === 'music') {
            const miniPlayer = document.getElementById('mini-player');
            if (miniPlayer) miniPlayer.classList.add('hidden');
        }

        // Trigger feature initialization via a custom event
        document.dispatchEvent(new CustomEvent('featureOpened', { detail: { feature: featureId } }));
    }

    function closePanel() {
        panelBackdrop.classList.add('hidden');
        panelContainer.classList.add('hidden');

        // Find which feature is currently open to dispatch close event
        let openFeature = null;
        panels.forEach(panel => {
            if (!panel.classList.contains('hidden')) {
                openFeature = panel.id.replace('-panel', '');
            }
        });

        if (openFeature) {
            document.dispatchEvent(new CustomEvent('featureClosed', { detail: { feature: openFeature } }));
        }

        // If music was playing and we closed the music panel, show mini-player
        if (openFeature === 'music' && window.MusicController && window.MusicController.isPlaying()) {
            const miniPlayer = document.getElementById('mini-player');
            const miniSongName = document.getElementById('mini-song-name');
            if (miniPlayer) miniPlayer.classList.remove('hidden');
            if (miniSongName && window.MusicController.getSongName()) {
                miniSongName.innerText = window.MusicController.getSongName();
            }
        }
    }

    closePanelBtn.addEventListener('click', closePanel);
    panelBackdrop.addEventListener('click', closePanel);

    // Escape key closes panels
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panelContainer.classList.contains('hidden')) {
            closePanel();
        }
    });

    // --- Idle Activity Monitor ---
    let idleTimer;
    const idleTimeRequired = 10000; // 10 seconds

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        document.dispatchEvent(new CustomEvent('userActive'));

        if (!panelContainer.classList.contains('hidden') || !isBloomed) return; // Don't trigger idle if panel is open or not bloomed

        idleTimer = setTimeout(() => {
            document.dispatchEvent(new CustomEvent('userIdle'));
        }, idleTimeRequired);
    }

    // Track common activities
    ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // Start timer initially
    resetIdleTimer();

    // --- Easter Egg Logic ("magic") ---
    let typedStr = '';
    const magicWord = 'magic';

    document.addEventListener('keydown', (e) => {
        // ignore if typing in an input (though we have none except maybe range/color, but safe check)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        typedStr += e.key.toLowerCase();

        // Keep only the last length of characters
        if (typedStr.length > magicWord.length) {
            typedStr = typedStr.slice(-magicWord.length);
        }

        if (typedStr === magicWord) {
            triggerEasterEgg();
            typedStr = '';
        }
    });

    function triggerEasterEgg() {
        // Trigger bloom out animation
        flower.classList.add('bloom-out');
        document.body.classList.add('magic-mode');

        setTimeout(() => {
            document.getElementById('galaxy-overlay').classList.remove('hidden');
            document.dispatchEvent(new CustomEvent('easterEggStart'));
        }, 1000);
    }

    document.getElementById('return-btn').addEventListener('click', () => {
        document.getElementById('galaxy-overlay').classList.add('hidden');
        document.body.classList.remove('magic-mode');
        flower.classList.remove('bloom-out');
        document.dispatchEvent(new CustomEvent('easterEggEnd'));
    });

    // --- Theme Hint Popup Logic ---
    function hideHintPopup() {
        if (!themeHintPopup) return;
        themeHintPopup.classList.add('fade-out');
        setTimeout(() => {
            themeHintPopup.classList.add('hidden');
            themeHintPopup.classList.remove('fade-out');
        }, 500);
    }

    if (closeHintBtn) {
        closeHintBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering flower/petal clicks if any
            hideHintPopup();
        });
    }
});
