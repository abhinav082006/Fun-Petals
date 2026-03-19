// features.js - Interactivity for the six petal panels

document.addEventListener("DOMContentLoaded", () => {

    // Global Streams
    let currentVideoStream = null;
    let audioContext = null;

    // Listen for panel open/close
    document.addEventListener("featureOpened", (e) => {
        const feature = e.detail.feature;
        if (feature === "photobooth") initPhotobooth();
        if (feature === "music") initMusic();
        if (feature === "doodle") initDoodle();
        if (feature === "todo") initTodo();
        if (feature === "timer") initTimer();
    });

    document.addEventListener("featureClosed", (e) => {
        const feature = e.detail.feature;
        // Cleanup resources (music continues in background)
        if (feature === "photobooth") stopWebcam();
    });

    // --- Webcam Helper ---
    async function startWebcam(videoElementId) {
        try {
            if (currentVideoStream) stopWebcam();
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            currentVideoStream = stream;
            const video = document.getElementById(videoElementId);
            video.srcObject = stream;
            return true;
        } catch (err) {
            console.warn("Webcam access denied or unavailable", err);
            return false;
        }
    }

    function stopWebcam() {
        if (currentVideoStream) {
            currentVideoStream.getTracks().forEach(track => track.stop());
            currentVideoStream = null;
        }
    }


    // --- 1. Photobooth ---
    function initPhotobooth() {
        const video = document.getElementById("webcam-video");
        const canvas = document.getElementById("photo-canvas");
        const ctx = canvas.getContext("2d");
        const resultImg = document.getElementById("photo-result");
        const takeBtn = document.getElementById("take-photo-btn");
        const retakeBtn = document.getElementById("retake-photo-btn");
        const downloadBtn = document.getElementById("download-photo-btn");
        const frameSelector = document.getElementById("frame-selector");
        const cameraFrame = document.getElementById("camera-frame");
        const flashOverlay = document.getElementById("flash-overlay");
        const countdownDisplay = document.getElementById("countdown-display");

        // Reset state
        video.classList.remove("hidden");
        resultImg.classList.add("hidden");
        takeBtn.classList.remove("hidden");
        retakeBtn.classList.add("hidden");
        downloadBtn.classList.add("hidden");

        startWebcam("webcam-video");

        frameSelector.onchange = () => {
            cameraFrame.className = `frame-${frameSelector.value}`;
        };

        // Ensure canvas matches video aspect ratio when taking photo
        takeBtn.onclick = () => {
            if (!currentVideoStream) return;

            takeBtn.disabled = true;
            let count = 3;
            countdownDisplay.innerText = count;
            countdownDisplay.classList.remove("hidden");

            const interval = setInterval(() => {
                count--;
                if (count > 0) {
                    countdownDisplay.innerText = count;
                } else {
                    clearInterval(interval);
                    countdownDisplay.classList.add("hidden");
                    snapPhoto();
                }
            }, 1000);
        };

        function snapPhoto() {
            flashOverlay.classList.remove("hidden");
            setTimeout(() => flashOverlay.classList.add("hidden"), 100);

            const vidW = video.videoWidth;
            const vidH = video.videoHeight;
            const frameType = frameSelector.value;

            // Expand the canvas to add illustrated border around the photo
            const padH = Math.round(vidW * 0.22);
            const padTop = Math.round(vidH * 0.22);
            const padBot = Math.round(vidH * 0.28);
            canvas.width = vidW + padH * 2;
            canvas.height = vidH + padTop + padBot;
            const W = canvas.width, H = canvas.height;
            // Photo slot coordinates
            const photoX = padH, photoY = padTop, photoW = vidW, photoH = vidH;

            // 1. Draw illustrated background
            drawIllustration(ctx, frameType, W, H, photoX, photoY, photoW, photoH, false);

            // 2. Clip and composite the mirrored video into the photo slot
            ctx.save();
            ctx.beginPath();
            frameRoundedRect(ctx, photoX, photoY, photoW, photoH, 8);
            ctx.clip();
            ctx.translate(photoX + photoW, photoY);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, photoW, photoH);
            ctx.restore();

            // 3. Draw foreground decorations on top of the photo
            drawIllustration(ctx, frameType, W, H, photoX, photoY, photoW, photoH, true);

            const dataUrl = canvas.toDataURL("image/png");
            resultImg.src = dataUrl;
            downloadBtn.href = dataUrl;

            video.classList.add("hidden");
            resultImg.classList.remove("hidden");
            takeBtn.classList.add("hidden");
            retakeBtn.classList.remove("hidden");
            downloadBtn.classList.remove("hidden");
            takeBtn.disabled = false;
        }

        retakeBtn.onclick = () => {
            video.classList.remove("hidden");
            resultImg.classList.add("hidden");
            takeBtn.classList.remove("hidden");
            retakeBtn.classList.add("hidden");
            downloadBtn.classList.add("hidden");
        };
    }

    function frameRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    function drawIllustration(ctx, type, W, H, px, py, pw, ph, isFG) {
        if (type === 'underwater') {
            if (!isFG) {
                // === UNDERWATER BACKGROUND ===
                // Ocean gradient
                const bg = ctx.createLinearGradient(0, 0, 0, H);
                bg.addColorStop(0, '#b8eaf5'); bg.addColorStop(0.7, '#6bbbd8'); bg.addColorStop(1, '#3a93ba');
                ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

                // Light caustic ripple hints
                for (let i = 0; i < 12; i++) {
                    ctx.beginPath();
                    ctx.ellipse(W * (i / 11), py * 0.4 + Math.sin(i) * py * 0.15, W * 0.06, py * 0.06, 0, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke();
                }

                // Sandy bottom
                const sandTop = H - py * 0.7;
                const sand = ctx.createLinearGradient(0, sandTop, 0, H);
                sand.addColorStop(0, '#e8d5a3'); sand.addColorStop(1, '#c4a870');
                ctx.fillStyle = sand;
                ctx.beginPath();
                ctx.moveTo(0, H);
                ctx.bezierCurveTo(W * 0.15, sandTop - py * 0.05, W * 0.35, sandTop + py * 0.08, W * 0.5, sandTop);
                ctx.bezierCurveTo(W * 0.65, sandTop - py * 0.08, W * 0.85, sandTop + py * 0.05, W, H);
                ctx.closePath(); ctx.fill();

                // Sand ripple lines
                ctx.strokeStyle = 'rgba(180,140,80,0.3)'; ctx.lineWidth = 1.5;
                for (let r = 0; r < 3; r++) {
                    ctx.beginPath();
                    const ry = sandTop + py * 0.1 + r * py * 0.08;
                    ctx.bezierCurveTo(0, ry, W * 0.5, ry - py * 0.04, W, ry);
                    ctx.moveTo(0, ry); ctx.stroke();
                }

                // Seaweed
                [[px * 0.3, sandTop], [px * 0.65, sandTop], [W - px * 0.35, sandTop], [W - px * 0.6, sandTop]].forEach(([sx, sy]) => {
                    for (let side of [-1, 1]) {
                        ctx.strokeStyle = side === -1 ? '#5aaa72' : '#4a9060';
                        ctx.lineWidth = 3; ctx.lineCap = 'round';
                        ctx.beginPath(); ctx.moveTo(sx, sy);
                        ctx.bezierCurveTo(sx + 14 * side, sy - py * 0.3, sx - 10 * side, sy - py * 0.55, sx, sy - py * 0.7);
                        ctx.stroke();
                    }
                });

                // Background bubbles
                const bubbles = [[px * 0.4, py + ph * 0.2], [px * 0.7, py + ph * 0.55], [px * 0.35, py + ph * 0.85], [W - px * 0.45, py + ph * 0.3], [W - px * 0.6, py + ph * 0.7], [px + pw * 0.2, py * 0.5], [px + pw * 0.8, py * 0.3], [px + pw * 0.5, H - py * 0.35]];
                bubbles.forEach(([bx, by], i) => {
                    const r = W * (0.014 + (i % 3) * 0.008);
                    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
                    // bubble shine
                    ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.25, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
                });

            } else {
                // === UNDERWATER FOREGROUND ===
                // Photo slot border (looks like aquarium glass)
                ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
                frameRoundedRect(ctx, px, py, pw, ph, 8); ctx.stroke();
                // Inner subtle dark shadow border
                ctx.strokeStyle = 'rgba(50,100,150,0.3)'; ctx.lineWidth = 1.5;
                frameRoundedRect(ctx, px + 3, py + 3, pw - 6, ph - 6, 6); ctx.stroke();

                // Fish on the sides
                ctx.font = `${W * 0.045}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🐟', px * 0.5, py + ph * 0.3);
                ctx.fillText('🐠', W - px * 0.5, py + ph * 0.65);
                ctx.fillText('🦑', px * 0.5, py + ph * 0.72);
                ctx.fillText('🐡', W - px * 0.52, py + ph * 0.28);
                // Small shell at sand
                ctx.font = `${W * 0.035}px serif`;
                ctx.fillText('🐚', W * 0.5, H - py * 0.35);
                ctx.fillText('🐠', W * 0.3, H - py * 0.22);

                // Corner bubbles close to photo
                [[px - 15, py + ph * 0.15], [px - 8, py + ph * 0.4], [W - px + 15, py + ph * 0.25]].forEach(([bx, by]) => {
                    ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
                });

                // Watermark
                ctx.font = `italic ${W * 0.025}px Georgia`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                ctx.fillText('fun petals 🌊', px + 4, H - 6);
            }

        } else if (type === 'sakura') {
            if (!isFG) {
                // === SAKURA BACKGROUND ===
                // Soft sky gradient
                const bg = ctx.createLinearGradient(0, 0, 0, H);
                bg.addColorStop(0, '#fde8f5'); bg.addColorStop(0.65, '#ffc2d4'); bg.addColorStop(1, '#ffaac0');
                ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

                // Soft cloud puffs at top
                [[W * 0.25, py * 0.35], [W * 0.7, py * 0.25], [W * 0.1, py * 0.55]].forEach(([cx, cy]) => {
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    [0, -12, 12, -6, 6].forEach((dx, i) => {
                        ctx.beginPath(); ctx.arc(cx + dx, cy + Math.abs(i) * 3, px * 0.18 - i * 1.5, 0, Math.PI * 2); ctx.fill();
                    });
                });

                // Green grassy hills at bottom
                const hillY = H - py * 0.72;
                const hill = ctx.createLinearGradient(0, hillY, 0, H);
                hill.addColorStop(0, '#aee0a0'); hill.addColorStop(1, '#7ec87a');
                ctx.fillStyle = hill;
                ctx.beginPath(); ctx.moveTo(0, H);
                ctx.bezierCurveTo(W * 0.2, hillY + py * 0.05, W * 0.4, hillY - py * 0.12, W * 0.6, hillY);
                ctx.bezierCurveTo(W * 0.75, hillY + py * 0.08, W * 0.9, hillY - py * 0.05, W, hillY + py * 0.1);
                ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

                // Scatter petal shapes
                const petalColors = ['rgba(255,182,203,0.8)', 'rgba(255,160,185,0.7)', 'rgba(255,200,215,0.9)'];
                [[px * 0.3, py * 0.4], [px * 0.65, H * 0.5], [px * 0.4, H * 0.78], [W - px * 0.3, py * 0.45], [W - px * 0.6, H * 0.55], [W - px * 0.35, H * 0.79], [W * 0.25, py * 0.65], [W * 0.75, py * 0.7], [W * 0.3, H - py * 0.42], [W * 0.7, H - py * 0.38]].forEach(([ex, ey], i) => {
                    ctx.save(); ctx.translate(ex, ey); ctx.rotate(i * 0.8);
                    ctx.fillStyle = petalColors[i % 3];
                    ctx.beginPath(); ctx.ellipse(0, 0, px * 0.09, px * 0.045, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                });

            } else {
                // === SAKURA FOREGROUND ===
                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
                frameRoundedRect(ctx, px, py, pw, ph, 8); ctx.stroke();
                ctx.strokeStyle = 'rgba(255,182,203,0.4)'; ctx.lineWidth = 1;
                frameRoundedRect(ctx, px + 4, py + 4, pw - 8, ph - 8, 5); ctx.stroke();

                // Flower emojis
                ctx.font = `${W * 0.045}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🌸', px * 0.45, py * 0.45);
                ctx.fillText('🌸', W - px * 0.45, py * 0.45);
                ctx.fillText('🌷', px * 0.45, H - py * 0.4);
                ctx.fillText('🌷', W - px * 0.45, H - py * 0.4);
                ctx.font = `${W * 0.035}px serif`;
                ctx.fillText('✿', px * 0.5, py + ph * 0.35);
                ctx.fillText('✿', W - px * 0.5, py + ph * 0.65);

                // Bottom label
                ctx.font = `italic ${W * 0.03}px Georgia`;
                ctx.fillStyle = 'rgba(180,80,110,0.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('✿ fun petals ✿', W / 2, H - 8);
            }

        } else if (type === 'glitter') {
            if (!isFG) {
                // === Y2K GLITTER BACKGROUND ===
                // Holographic base
                const bg = ctx.createLinearGradient(0, 0, W, H);
                bg.addColorStop(0, '#fce4f5'); bg.addColorStop(0.33, '#e8d0ff'); bg.addColorStop(0.66, '#cce5ff'); bg.addColorStop(1, '#fce4f5');
                ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

                // Diagonal shimmer stripes
                for (let d = -W; d < W * 2; d += W * 0.07) {
                    ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + W * 0.04, 0); ctx.lineTo(d + W * 0.04 + H, H); ctx.lineTo(d + H, H);
                    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
                }

                // Scattered glitter dots
                [[px * 0.3, py * 0.3], [px * 0.6, H * 0.5], [px * 0.4, H * 0.78], [W - px * 0.3, py * 0.35], [W - px * 0.55, H * 0.55], [W - px * 0.38, H * 0.8], [W * 0.3, py * 0.55], [W * 0.7, py * 0.6], [W * 0.25, H - py * 0.42], [W * 0.72, H - py * 0.38]].forEach(([gx, gy]) => {
                    ctx.beginPath(); ctx.arc(gx, gy, px * 0.05, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
                });

                // Star bursts
                ['#f9a8d4', '#c4b5fd', '#93c5fd'].forEach((col, i) => {
                    const sx = [px * 0.5, W - px * 0.5, W * 0.5][i], sy = [H * 0.5, H * 0.3, H - py * 0.35][i];
                    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                        ctx.beginPath();
                        ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * px * 0.2, sy + Math.sin(a) * px * 0.2);
                        ctx.stroke();
                    }
                });

            } else {
                // === GLITTER FOREGROUND ===
                // Gradient border frame
                const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
                grad.addColorStop(0, '#f9a8d4'); grad.addColorStop(0.5, '#a78bfa'); grad.addColorStop(1, '#7dd3fc');
                ctx.strokeStyle = grad; ctx.lineWidth = 6;
                frameRoundedRect(ctx, px, py, pw, ph, 8); ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
                frameRoundedRect(ctx, px + 7, py + 7, pw - 14, ph - 14, 5); ctx.stroke();

                // Sparkle emojis around the border
                ctx.font = `${W * 0.04}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ['✨', '✦', '✧', '✨', '✦'].forEach((s, i) => {
                    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    const rx = W / 2 + Math.cos(angle) * (pw / 2 + px * 0.4), ry = H / 2 + Math.sin(angle) * (ph / 2 + py * 0.4);
                    ctx.fillText(s, rx, ry);
                });
                ctx.fillText('💫', px * 0.45, py * 0.45);
                ctx.fillText('💫', W - px * 0.45, H - py * 0.45);

                // Label
                ctx.font = `bold ${W * 0.028}px Arial`; ctx.fillStyle = 'rgba(167, 139, 250, 0.9)';
                ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('✦ fun petals ✦', W / 2, H - 6);
            }

        } else if (type === 'stars') {
            if (!isFG) {
                // === DREAMY STARS BACKGROUND ===
                // Deep night sky gradient
                const bg = ctx.createLinearGradient(0, 0, 0, H);
                bg.addColorStop(0, '#0a0a2e'); bg.addColorStop(0.5, '#1a1050'); bg.addColorStop(1, '#0d1a3a');
                ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

                // Aurora bands
                ['rgba(99,102,241,0.12)', 'rgba(167,139,250,0.08)', 'rgba(236,72,153,0.07)'].forEach((col, i) => {
                    const ag = ctx.createLinearGradient(0, H * (0.2 + i * 0.15), 0, H * (0.35 + i * 0.15));
                    ag.addColorStop(0, 'transparent'); ag.addColorStop(0.5, col); ag.addColorStop(1, 'transparent');
                    ctx.fillStyle = ag; ctx.fillRect(0, H * (0.2 + i * 0.15), W, H * 0.15);
                });

                // Stars scattered in border area
                const starPos = [[px * 0.3, py * 0.25], [px * 0.6, py * 0.7], [px * 0.4, H * 0.42], [px * 0.55, H * 0.72], [W - px * 0.3, py * 0.3], [W - px * 0.55, py * 0.72], [W - px * 0.38, H * 0.45], [W - px * 0.6, H * 0.78], [W * 0.25, py * 0.5], [W * 0.75, py * 0.55], [W * 0.3, H - py * 0.35], [W * 0.7, H - py * 0.3], [W * 0.15, H * 0.65], [W * 0.85, H * 0.68]];
                starPos.forEach(([sx, sy], i) => {
                    const starColors = ['#fde68a', '#c4b5fd', 'white', '#fbcfe8'];
                    const sr = px * (0.025 + (i % 3) * 0.012);
                    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fillStyle = starColors[i % 4]; ctx.fill();
                    // glow
                    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3);
                    glow.addColorStop(0, starColors[i % 4].replace(')', ',0.3)').replace('rgb', 'rgba')); glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, sr * 3, 0, Math.PI * 2); ctx.fill();
                });

                // Crescent moon
                const mx = W - px * 0.55, my = py * 0.5;
                ctx.fillStyle = '#fde68a';
                ctx.beginPath(); ctx.arc(mx, my, px * 0.22, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#0d1a3a';
                ctx.beginPath(); ctx.arc(mx + px * 0.09, my - px * 0.04, px * 0.18, 0, Math.PI * 2); ctx.fill();

                // Foreground hill silhouette
                ctx.fillStyle = '#050516';
                ctx.beginPath(); ctx.moveTo(0, H);
                ctx.bezierCurveTo(W * 0.2, H - py * 0.3, W * 0.4, H - py * 0.55, W * 0.5, H - py * 0.4);
                ctx.bezierCurveTo(W * 0.6, H - py * 0.55, W * 0.8, H - py * 0.28, W, H);
                ctx.closePath(); ctx.fill();

            } else {
                ctx.strokeStyle = 'rgba(167,139,250,0.8)'; ctx.lineWidth = 3;
                frameRoundedRect(ctx, px, py, pw, ph, 8); ctx.stroke();
                ctx.strokeStyle = 'rgba(99,102,241,0.3)'; ctx.lineWidth = 1.5;
                frameRoundedRect(ctx, px + 4, py + 4, pw - 8, ph - 8, 5); ctx.stroke();

                ctx.font = `${W * 0.04}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🌙', px * 0.48, py * 0.48);
                ctx.fillText('⭐', W - px * 0.48, py * 0.48);
                ctx.fillText('🌟', px * 0.48, H - py * 0.42);
                ctx.fillText('✨', W - px * 0.48, H - py * 0.42);

                ctx.font = `italic ${W * 0.028}px Georgia`;
                ctx.fillStyle = 'rgba(196,181,253,0.8)'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('✨ fun petals ✨', W / 2, H - 6);
            }

        } else if (type === 'vintage-film') {
            if (!isFG) {
                // === VINTAGE FILM BACKGROUND ===
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, W, H);

                // Grainy texture dots
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                for (let i = 0; i < 500; i++) {
                    ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
                }

                // Film sprocket holes (top and bottom)
                ctx.fillStyle = '#222';
                const holeW = W * 0.04, holeH = py * 0.4;
                for (let x = holeW; x < W; x += holeW * 2) {
                    ctx.fillRect(x, py * 0.3, holeW, holeH);
                    ctx.fillRect(x, H - py * 0.3 - holeH, holeW, holeH);
                }

                // Vertical scratch lines
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 5; i++) {
                    const sx = Math.random() * W;
                    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
                }
            } else {
                // === VINTAGE FILM FOREGROUND ===
                // Inner frame line
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 2;
                frameRoundedRect(ctx, px - 2, py - 2, pw + 4, ph + 4, 4);
                ctx.stroke();

                // Numbers and text
                ctx.font = `bold ${W * 0.035}px Courier New`;
                ctx.fillStyle = '#d48806'; // Aged orange/yellow
                ctx.textAlign = 'left';
                ctx.fillText('24A', px, py * 0.25);
                ctx.fillText('KODAK SAFETY', px + pw * 0.3, py * 0.25);

                ctx.textAlign = 'right';
                ctx.fillText('FUJI-400', px + pw, H - py * 0.15);

                // Time stamp
                ctx.font = `${W * 0.03}px monospace`;
                ctx.fillStyle = 'rgba(212, 136, 6, 0.8)';
                ctx.fillText('MAR 18 2026', px + pw - 10, py + ph - 10);
            }

        } else if (type === 'neon-cyber') {
            if (!isFG) {
                // === NEON CYBER BACKGROUND ===
                ctx.fillStyle = '#050510';
                ctx.fillRect(0, 0, W, H);

                // Grid lines
                ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)';
                ctx.lineWidth = 1;
                for (let x = 0; x < W; x += 40) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
                }
                for (let y = 0; y < H; y += 40) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                }

                // Glowing triangles
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    const tx = Math.random() * W, ty = Math.random() * H;
                    ctx.moveTo(tx, ty);
                    ctx.lineTo(tx + 40, ty + 20);
                    ctx.lineTo(tx + 10, ty + 50);
                    ctx.closePath();
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 0, 255, 0.05)' : 'rgba(0, 242, 255, 0.05)';
                    ctx.fill();
                }
            } else {
                // === NEON CYBER FOREGROUND ===
                // Neon border
                ctx.strokeStyle = '#00f2ff';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00f2ff';
                frameRoundedRect(ctx, px, py, pw, ph, 4);
                ctx.stroke();

                // Corner brackets
                ctx.strokeStyle = '#ff00ff';
                ctx.shadowColor = '#ff00ff';
                ctx.lineWidth = 5;
                // Top Left
                ctx.beginPath(); ctx.moveTo(px - 10, py + 30); ctx.lineTo(px - 10, py - 10); ctx.lineTo(px + 30, py - 10); ctx.stroke();
                // Bottom Right
                ctx.beginPath(); ctx.moveTo(px + pw + 10, py + ph - 30); ctx.lineTo(px + pw + 10, py + ph + 10); ctx.lineTo(px + pw - 30, py + ph + 10); ctx.stroke();

                ctx.shadowBlur = 0;

                // Cyber text
                ctx.font = `bold ${W * 0.03}px "Courier New"`;
                ctx.fillStyle = '#00f2ff';
                ctx.textAlign = 'center';
                ctx.fillText('// PETAL_PROTOCOL V2.4', W / 2, py * 0.4);
                ctx.fillText('REC [●]', px + pw * 0.85, py + 25);
            }

        } else if (type === 'botanical') {
            if (!isFG) {
                // === COTTAGCORE BACKGROUND ===
                ctx.fillStyle = '#fdf6e3'; // Parchment
                ctx.fillRect(0, 0, W, H);

                // Paper texture lines
                ctx.strokeStyle = 'rgba(140, 122, 107, 0.1)';
                ctx.lineWidth = 1;
                for (let y = 0; y < H; y += 2) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                }

                // Dried leaves/vines
                const leaves = [[px * 0.3, py * 0.4], [W - px * 0.3, H - py * 0.4], [px * 0.4, H - py * 0.5], [W - px * 0.5, py * 0.3]];
                leaves.forEach(([lx, ly], i) => {
                    ctx.save(); ctx.translate(lx, ly); ctx.rotate(i * Math.PI / 2);
                    ctx.fillStyle = 'rgba(127, 176, 127, 0.3)';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 30, 15, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            } else {
                // === COTTAGECORE FOREGROUND ===
                // Brown rustic border
                ctx.strokeStyle = '#8c7a6b';
                ctx.lineWidth = 10;
                frameRoundedRect(ctx, px, py, pw, ph, 30);
                ctx.stroke();

                // Emojis and floral details
                ctx.font = `${W * 0.06}px serif`;
                ctx.textAlign = 'center';
                ctx.fillText('🌿', px, py);
                ctx.fillText('🍄', px + pw, py);
                ctx.fillText('🍃', px, py + ph);
                ctx.fillText('🦋', px + pw, py + ph);

                ctx.font = `italic ${W * 0.035}px "Palatino", serif`;
                ctx.fillStyle = '#8c7a6b';
                ctx.fillText('~ in the garden ~', W / 2, H - py * 0.25);
            }
        }
    }


    // --- 2. Music Galaxy (IndexedDB + Custom Audio) ---
    const DB_NAME = "FunPetalsMusicDB";
    const STORE_NAME = "tracks";

    const musicDB = {
        async init() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        },
        async addTrack(track) {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                const req = store.add(track);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        },
        async getAllTracks() {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const store = tx.objectStore(STORE_NAME);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        },
        async deleteTrack(id) {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                const req = store.delete(id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }
    };

    let currentTracks = [];
    let currentTrackIndex = -1;
    let customAudioElement = null;
    let audioSourceNode = null;
    let analyserNode = null;
    let visualizerAnimationId = null;

    function initMusic() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } else if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        customAudioElement = document.getElementById("audio-player");
        const planetContainer = document.getElementById("planet-container");
        const addBtn = document.getElementById("add-music-btn");
        const fileInput = document.getElementById("custom-audio-input");
        const nowPlaying = document.getElementById("now-playing");
        const playPauseBtn = document.getElementById("play-pause-btn");
        const prevBtn = document.getElementById("prev-btn");
        const nextBtn = document.getElementById("next-btn");
        const playbackControls = document.getElementById("playback-controls");
        const progressContainer = document.getElementById("progress-container");
        const progressBar = document.getElementById("progress-bar");
        const currentTimeEl = document.getElementById("current-time");
        const totalTimeEl = document.getElementById("total-time");

        function formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }

        // Update progress bar and current time as audio plays
        customAudioElement.addEventListener("timeupdate", () => {
            if (!isNaN(customAudioElement.duration) && customAudioElement.duration > 0) {
                progressBar.value = customAudioElement.currentTime;
                currentTimeEl.innerText = formatTime(customAudioElement.currentTime);
            }
        });

        // Set progress bar max when metadata (duration) is known
        customAudioElement.addEventListener("loadedmetadata", () => {
            progressBar.max = Math.floor(customAudioElement.duration);
            totalTimeEl.innerText = formatTime(customAudioElement.duration);
            progressBar.value = 0;
            currentTimeEl.innerText = "0:00";
        });

        // Seek when user drags the bar
        progressBar.addEventListener("input", () => {
            customAudioElement.currentTime = progressBar.value;
        });

        // Setup visualizer bars if empty
        const vis = document.getElementById("visualizer");
        if (vis.children.length === 0) {
            for (let i = 0; i < 8; i++) {
                const bar = document.createElement("div");
                bar.className = "bar";
                vis.appendChild(bar);
            }
        }

        if (!audioSourceNode) {
            audioSourceNode = audioContext.createMediaElementSource(customAudioElement);
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 64;
            audioSourceNode.connect(analyserNode);
            analyserNode.connect(audioContext.destination);

            customAudioElement.onended = () => {
                playNextTrack();
            };
        }

        addBtn.onclick = () => fileInput.click();

        fileInput.onchange = async (e) => {
            const files = e.target.files;
            if (!files.length) return;

            nowPlaying.innerText = "Saving track...";

            for (let file of files) {
                // Ensure name is clean
                let name = file.name.replace(/\.[^/.]+$/, "");
                if (name.length > 15) name = name.substring(0, 15) + "...";

                const trackId = await musicDB.addTrack({ name: name, blob: file });
                const trackInfo = { id: trackId, name: name, blob: file };
                currentTracks.push(trackInfo);
                renderPlanet(trackInfo);
            }
            nowPlaying.innerText = "Track(s) added!";
            fileInput.value = "";
        };

        async function loadSavedTracks() {
            try {
                currentTracks = await musicDB.getAllTracks();
                // Clear any leftover visually before re-rendering
                planetContainer.querySelectorAll(".planet:not(.add-planet)").forEach(p => p.remove());
                currentTracks.forEach(renderPlanet);
            } catch (err) {
                console.error("Error loading DB tracks", err);
            }
        }

        function renderPlanet(track) {
            const p = document.createElement("div");
            p.className = "planet track-planet";
            const hues = ["#ffb7b2", "#e2f0cb", "#c7ceea", "#ffdeeb", "#cde4ff", "#e0c3fc"];
            const bg = hues[track.id % hues.length];
            p.style.setProperty("--bg", bg);

            // Container for proper absolute positioning of delete internal
            p.style.position = "relative";

            // Display first 8 characters
            p.innerHTML = `<span>${track.name.substring(0, 8)}</span>
                           <div class="delete-btn" title="Remove Track">x</div>`;

            p.onclick = (e) => {
                // Ignore general planet click if delete btn was hit
                if (e.target.classList.contains("delete-btn")) return;
                const idx = currentTracks.findIndex(t => t.id === track.id);
                playTrack(idx);
            };

            const delBtn = p.querySelector(".delete-btn");
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                await musicDB.deleteTrack(track.id);

                // If the track being deleted is currently playing
                const idx = currentTracks.findIndex(t => t.id === track.id);
                if (idx === currentTrackIndex) {
                    customAudioElement.pause();
                    playPauseBtn.innerText = "▶";
                    nowPlaying.innerText = "Select or add a planet";
                    playbackControls.classList.add("hidden");
                    progressContainer.classList.add("hidden");
                    currentTrackIndex = -1;
                    customAudioElement.src = "";
                } else if (idx < currentTrackIndex) {
                    // adjust index if a previous track was deleted
                    currentTrackIndex--;
                }

                currentTracks.splice(idx, 1);
                p.remove();

                if (currentTracks.length === 0) {
                    document.querySelectorAll(".bar").forEach(b => b.style.height = '10px');
                }
            };

            planetContainer.insertBefore(p, addBtn);
        }

        function playTrack(idx) {
            if (idx < 0 || idx >= currentTracks.length) return;
            currentTrackIndex = idx;
            const track = currentTracks[idx];

            document.querySelectorAll(".track-planet").forEach((p, i) => {
                if (i === idx) p.classList.add("active-planet");
                else p.classList.remove("active-planet");
            });

            nowPlaying.innerText = `Playing: ${track.name} 🎵`;
            playbackControls.classList.remove("hidden");
            progressContainer.classList.remove("hidden");

            // Sync mini-player
            const miniPlayer = document.getElementById("mini-player");
            if (miniPlayer) miniPlayer.classList.remove("hidden");

            const miniSongName = document.getElementById("mini-song-name");
            if (miniSongName) miniSongName.innerText = track.name;

            const url = URL.createObjectURL(track.blob);
            customAudioElement.src = url;
            customAudioElement.play().then(() => {
                playPauseBtn.innerText = "⏸";
                const miniPP = document.getElementById("mini-play-pause");
                if (miniPP) miniPP.innerText = "⏸";
                startVisualizer();
            }).catch(e => console.log("Play interrupted", e));
        }

        function playNextTrack() {
            if (currentTracks.length === 0) return;
            customAudioElement.pause();
            let nextIndex = (currentTrackIndex + 1) % currentTracks.length;
            playTrack(nextIndex);
        }

        function playPrevTrack() {
            if (currentTracks.length === 0) return;
            customAudioElement.pause();
            let prevIndex = (currentTrackIndex - 1 + currentTracks.length) % currentTracks.length;
            playTrack(prevIndex);
        }

        playPauseBtn.onclick = () => {
            const miniPP = document.getElementById("mini-play-pause");
            if (customAudioElement.paused) {
                customAudioElement.play();
                playPauseBtn.innerText = "⏸";
                if (miniPP) miniPP.innerText = "⏸";
                startVisualizer();
            } else {
                customAudioElement.pause();
                playPauseBtn.innerText = "▶";
                if (miniPP) miniPP.innerText = "▶";
            }
        };

        nextBtn.onclick = playNextTrack;
        prevBtn.onclick = playPrevTrack;

        function startVisualizer() {
            if (visualizerAnimationId) cancelAnimationFrame(visualizerAnimationId);

            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const bars = document.querySelectorAll(".bar");

            function renderFrame() {
                if (customAudioElement.paused) {
                    bars.forEach(b => b.style.height = '10px');
                    return;
                }
                visualizerAnimationId = requestAnimationFrame(renderFrame);
                analyserNode.getByteFrequencyData(dataArray);

                for (let i = 0; i < 8; i++) {
                    const value = dataArray[i * 2]; // Map visual to lower bounded frequency spectrum
                    const h = 10 + (value / 255) * 40;
                    if (bars[i]) bars[i].style.height = `${h}px`;
                }
            }
            renderFrame();
        }

        window.MusicController = {
            playNext: playNextTrack,
            playPrev: playPrevTrack,
            togglePlay: async () => {
                if (audioContext && audioContext.state === "suspended") {
                    await audioContext.resume();
                }
                if (currentTracks.length === 0) return false;
                if (currentTrackIndex === -1 && currentTracks.length > 0) {
                    playTrack(0);
                    return true;
                }
                const miniPP = document.getElementById("mini-play-pause");
                if (customAudioElement.paused) {
                    customAudioElement.play();
                    playPauseBtn.innerText = "⏸";
                    if (miniPP) miniPP.innerText = "⏸";
                    startVisualizer();
                    return true;
                } else {
                    customAudioElement.pause();
                    playPauseBtn.innerText = "▶";
                    if (miniPP) miniPP.innerText = "▶";
                    return false;
                }
            },
            getSongName: () => currentTrackIndex >= 0 && currentTracks[currentTrackIndex] ? currentTracks[currentTrackIndex].name : null,
            isPlaying: () => customAudioElement && !customAudioElement.paused,
            hasTracks: () => currentTracks.length > 0
        };

        // Wire up the mini-player buttons (safe to call multiple times; onclick overwrites)
        const miniPlayerEl = document.getElementById("mini-player");
        const miniPrevBtn = document.getElementById("mini-prev");
        const miniPlayPauseBtn = document.getElementById("mini-play-pause");
        const miniNextBtn = document.getElementById("mini-next");

        if (miniPrevBtn) miniPrevBtn.onclick = () => { playPrevTrack(); };
        if (miniNextBtn) miniNextBtn.onclick = () => { playNextTrack(); };
        if (miniPlayPauseBtn) {
            miniPlayPauseBtn.onclick = async () => {
                if (audioContext && audioContext.state === "suspended") await audioContext.resume();
                if (customAudioElement.paused) {
                    customAudioElement.play();
                    miniPlayPauseBtn.innerText = "⏸";
                    playPauseBtn.innerText = "⏸";
                    startVisualizer();
                } else {
                    customAudioElement.pause();
                    miniPlayPauseBtn.innerText = "▶";
                    playPauseBtn.innerText = "▶";
                }
            };
        }

        const miniCloseBtn = document.getElementById("mini-close-btn");
        if (miniCloseBtn) {
            miniCloseBtn.onclick = () => {
                if (miniPlayerEl) miniPlayerEl.classList.add("hidden");
            };
        }

        // On init, cleanly load the persisted tracks, avoiding duplicate loading if already filled
        if (currentTracks.length === 0) {
            loadSavedTracks();
        } else {
            // Re-bind controls on re-open
            if (!customAudioElement.paused) startVisualizer();
        }
    }


    // --- 3. AI Assistant ---
    // AI Hub logic is purely HTML links now.



    // --- 4. Doodle ---
    function initDoodle() {
        const canvas = document.getElementById("doodle-canvas");
        const ctx = canvas.getContext("2d");
        const colorPicker = document.getElementById("brush-color");
        const sizePicker = document.getElementById("brush-size");
        const clearBtn = document.getElementById("clear-doodle");

        // Set white bg initially
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        function startDrawing(e) {
            isDrawing = true;
            [lastX, lastY] = getCoordinates(e);
        }

        function draw(e) {
            if (!isDrawing) return;
            const [x, y] = getCoordinates(e);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = colorPicker.value;
            ctx.lineWidth = sizePicker.value;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();

            [lastX, lastY] = [x, y];
        }

        function getCoordinates(e) {
            const rect = canvas.getBoundingClientRect();
            // Scale if needed
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return [
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            ];
        }

        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", () => isDrawing = false);
        canvas.addEventListener("mouseout", () => isDrawing = false);

        clearBtn.onclick = () => {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
    }


    // --- 5. To-Do List (Cozy Notebook) ---
    function initTodo() {
        const input = document.getElementById("todo-input");
        const addBtn = document.getElementById("add-todo-btn");
        const list = document.getElementById("todo-list");

        // Load from local storage
        let todos = JSON.parse(localStorage.getItem("cozyTodos")) || [];

        function saveTodos() {
            localStorage.setItem("cozyTodos", JSON.stringify(todos));
        }

        function renderTodos() {
            list.innerHTML = "";
            todos.forEach((todo, index) => {
                const li = document.createElement("li");
                li.className = "todo-item" + (todo.completed ? " completed" : "");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "todo-checkbox";
                checkbox.checked = todo.completed;
                checkbox.onchange = () => toggleTodo(index);

                const span = document.createElement("span");
                span.innerText = todo.text;
                span.style.flexGrow = "1";
                // click text to toggle as well
                span.style.cursor = "pointer";
                span.onclick = () => toggleTodo(index);

                const delBtn = document.createElement("button");
                delBtn.className = "todo-delete";
                delBtn.innerText = "✖";
                delBtn.onclick = () => deleteTodo(index);

                li.appendChild(checkbox);
                li.appendChild(span);
                li.appendChild(delBtn);

                list.appendChild(li);
            });
        }

        function addTodo() {
            const text = input.value.trim();
            if (text) {
                todos.push({ text: text, completed: false });
                input.value = "";
                saveTodos();
                renderTodos();
            }
        }

        function toggleTodo(index) {
            todos[index].completed = !todos[index].completed;
            saveTodos();
            renderTodos();
        }

        function deleteTodo(index) {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        }

        // Event listeners (bind only once to avoid duplicates if panel re-opened)
        addBtn.onclick = addTodo;
        input.onkeypress = (e) => {
            if (e.key === "Enter") addTodo();
        };

        // Initial render
        renderTodos();
    }


    // --- 6. Focus Timer ---
    let timerInterval = null;
    let timerSecondsLeft = 25 * 60; // 25 mins default

    function initTimer() {
        // Ensure music DB is loaded so the widget works immediately 
        if (!window.MusicController) {
            initMusic();
        }

        const minInput = document.getElementById("timer-input-mins");
        const secDisplay = document.getElementById("timer-seconds");
        const startBtn = document.getElementById("timer-start");
        const pauseBtn = document.getElementById("timer-pause");
        const resetBtn = document.getElementById("timer-reset");

        // Mini music controls
        const miniPrev = document.getElementById("mini-prev-btn");
        const miniPlay = document.getElementById("mini-play-btn");
        const miniNext = document.getElementById("mini-next-btn");

        minInput.onchange = () => {
            let val = parseInt(minInput.value);
            if (isNaN(val) || val < 1) val = 1;
            minInput.value = val;
            timerSecondsLeft = val * 60;
            updateDisplay();
        };

        function updateDisplay() {
            const m = Math.floor(timerSecondsLeft / 60);
            const s = timerSecondsLeft % 60;
            if (timerInterval) {
                minInput.value = m.toString().padStart(2, "0");
            } else {
                minInput.value = m;
            }
            secDisplay.innerText = s.toString().padStart(2, "0");
        }

        // Initialize state visually without resetting time if already running
        updateDisplay();
        if (timerInterval) {
            startBtn.classList.add("hidden");
            pauseBtn.classList.remove("hidden");
        }

        startBtn.onclick = () => {
            if (timerInterval) return;

            // Re-sync seconds from input in case it was edited and not blurred
            let val = parseInt(minInput.value);
            if (!isNaN(val) && val > 0 && Math.floor(timerSecondsLeft / 60) !== val && secDisplay.innerText === "00") {
                timerSecondsLeft = val * 60;
            }

            minInput.disabled = true;
            startBtn.classList.add("hidden");
            pauseBtn.classList.remove("hidden");

            timerInterval = setInterval(() => {
                if (timerSecondsLeft > 0) {
                    timerSecondsLeft--;
                    updateDisplay();
                } else {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    minInput.disabled = false;
                    startBtn.classList.remove("hidden");
                    pauseBtn.classList.add("hidden");

                    window.createExplosion(window.innerWidth / 2, window.innerHeight / 2); // celebration!
                    completionMsg.classList.remove("hidden");
                    playCompletionChime();
                }
            }, 1000);
        };

        pauseBtn.onclick = () => {
            clearInterval(timerInterval);
            timerInterval = null;
            minInput.disabled = false;
            startBtn.classList.remove("hidden");
            pauseBtn.classList.add("hidden");
        };

        resetBtn.onclick = () => {
            clearInterval(timerInterval);
            timerInterval = null;

            let val = parseInt(minInput.value);
            if (isNaN(val) || val < 1) val = 1;
            timerSecondsLeft = val * 60;

            updateDisplay();
            minInput.disabled = false;
            startBtn.classList.remove("hidden");
            pauseBtn.classList.add("hidden");
        };

        // Wire up mini music widget
        // Update play icon visually based on global state
        if (window.MusicController && window.MusicController.isPlaying()) {
            miniPlay.innerText = "⏸";
        } else {
            miniPlay.innerText = "▶";
        }

        miniPlay.onclick = async () => {
            if (window.MusicController) {
                // Short delay to allow tracks to load if initialized concurrently
                if (!window.MusicController.hasTracks()) {
                    await new Promise(r => setTimeout(r, 100)); // wait a bit for indexedDB
                }

                if (!window.MusicController.hasTracks()) {
                    alert("Please add a custom track in the Music petal first!");
                    return;
                }

                const isPlaying = await window.MusicController.togglePlay();
                miniPlay.innerText = isPlaying ? "⏸" : "▶";
            }
        };

        miniPrev.onclick = () => {
            if (window.MusicController) window.MusicController.playPrev();
            miniPlay.innerText = "⏸";
        };

        miniNext.onclick = () => {
            if (window.MusicController) window.MusicController.playNext();
            miniPlay.innerText = "⏸";
        };
    }
});
