// effects.js - Handles Canvas Particles, Butterflies, and Easter Egg visual effects

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("bg-canvas");
    const ctx = canvas.getContext("2d");

    let width, height;
    let particles = [];
    let butterflies = [];
    let isEasterEgg = false;
    let currentTheme = 'day';
    let mouseX = -1000;
    let mouseY = -1000;

    // Configuration
    const particleCount = 40;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener("resize", resize);
    resize();

    // --- Base Particles ---
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5 - 0.2;
            this.life = Math.random() * 100;
            this.maxLife = 100 + Math.random() * 50;
            this.opacity = Math.random() * 0.5 + 0.2;

            const colors = ["#fff", "#ffdeeb", "#e0c3fc", "#cde4ff", "#ffe66d"];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life++;

            this.x += Math.sin(this.life * 0.05) * 0.2;

            if (this.y < -10 || this.x < -10 || this.x > width + 10 || this.life >= this.maxLife) {
                this.reset();
                this.y = height + 10;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

            let currentOpacity = this.opacity;
            if (this.life < 20) currentOpacity = this.opacity * (this.life / 20);
            if (this.life > this.maxLife - 20) currentOpacity = this.opacity * ((this.maxLife - this.life) / 20);

            // Change particle look based on theme
            if (currentTheme === 'underwater') {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                ctx.lineWidth = 1;
                ctx.globalAlpha = currentOpacity;
                ctx.stroke();
            } else if (currentTheme === 'night') {
                ctx.fillStyle = "#fff";
                ctx.globalAlpha = currentOpacity;
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#fff";
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = currentOpacity;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            ctx.globalAlpha = 1;
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // --- Global Animation Loop ---
    function animate() {
        ctx.clearRect(0, 0, width, height);

        if (!isEasterEgg) {
            particles.forEach(p => {
                p.update();
                p.draw();
            });
        }

        butterflies.forEach(b => {
            b.update();
            b.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();

    // --- Idle Butterflies Logic ---
    class Butterfly {
        constructor() {
            this.x = -50;
            this.y = Math.random() * height;
            this.targetX = width * Math.random();
            this.targetY = height * Math.random();
            this.size = 15;
            this.angle = 0;
            this.flapSpeed = Math.random() * 0.2 + 0.1;
            this.time = Math.random() * 100;

            const rand = Math.random();
            if (rand < 0.4) {
                // Orange and yellow (hue 35-65)
                const hue = Math.floor(Math.random() * 30) + 35;
                this.color = `hsl(${hue}, 80%, 65%)`;
            } else if (rand < 0.7) {
                // Blue (hue 190-240)
                const hue = Math.floor(Math.random() * 50) + 190;
                this.color = `hsl(${hue}, 80%, 70%)`;
            } else if (rand < 0.9) {
                // Pink (hue 300-340)
                const hue = Math.floor(Math.random() * 40) + 300;
                this.color = `hsl(${hue}, 80%, 75%)`;
            } else {
                // Random chance
                this.color = `hsl(${Math.random() * 360}, 70%, 70%)`;
            }
        }

        update() {
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Avoid mouse cursor
            const mouseDx = this.x - mouseX;
            const mouseDy = this.y - mouseY;
            const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

            if (mouseDistance < 150) {
                // Fly away from mouse
                this.targetX = this.x + (mouseDx / mouseDistance) * 300;
                this.targetY = this.y + (mouseDy / mouseDistance) * 300;

                // Keep target within bounds
                this.targetX = Math.max(50, Math.min(width - 50, this.targetX));
                this.targetY = Math.max(50, Math.min(height - 50, this.targetY));

                // Recalculate dx, dy, and distance to new target
                dx = this.targetX - this.x;
                dy = this.targetY - this.y;
                distance = Math.sqrt(dx * dx + dy * dy);
            }

            if (distance > 5) {
                // Determine speed (faster when flying away from mouse)
                const speed = mouseDistance < 150 ? 5 : 2;
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
                this.angle = Math.atan2(dy, dx);
            } else {
                this.targetX = Math.random() * width;
                this.targetY = Math.random() * height;
            }

            // Flap faster when fleeing
            const currentFlapSpeed = mouseDistance < 150 ? this.flapSpeed * 2 : this.flapSpeed;
            this.time += currentFlapSpeed;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            if (currentTheme === 'underwater') {
                // Draw Fish
                const wiggle = Math.sin(this.time * 2) * 5;
                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.9;

                // Body
                ctx.beginPath();
                ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tail
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(-18, -6 + wiggle);
                ctx.lineTo(-18, 6 + wiggle);
                ctx.closePath();
                ctx.fill();

                // Eye
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(6, -2, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#000";
                ctx.beginPath();
                ctx.arc(6.5, -2, 1, 0, Math.PI * 2);
                ctx.fill();

            } else {
                // Draw Butterfly
                const flap = Math.abs(Math.sin(this.time));

                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.8;

                ctx.beginPath();
                ctx.ellipse(-5 * flap, -5, 8 * flap, 10, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(5 * flap, -5, 8 * flap, 10, -Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#333";
                ctx.beginPath();
                ctx.ellipse(0, -2, 2, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // Initialize Butterflies (Adjusted to 5)
    for (let i = 0; i < 5; i++) {
        butterflies.push(new Butterfly());
    }

    // Track mouse position for butterfly avoidance
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener("mouseout", () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // Handle Theme Changes
    document.addEventListener("themeChanged", (e) => {
        currentTheme = e.detail.theme;

        // Slightly re-tint butterflies/fishes on night theme
        if (currentTheme === 'night') {
            butterflies.forEach(b => {
                // Ensure they are slightly brighter on dark bg
                b.color = `hsl(${Math.random() * 360}, 80%, 75%)`;
            });
        } else if (currentTheme === 'underwater') {
            butterflies.forEach(b => {
                b.color = `hsl(${Math.random() * 60 + 180}, 80%, 65%)`; // Blue/teal/orange fish
            });
        } else {
            butterflies.forEach(b => {
                // Reset to standard logic
                const rand = Math.random();
                if (rand < 0.4) {
                    const hue = Math.floor(Math.random() * 30) + 35;
                    b.color = `hsl(${hue}, 80%, 65%)`;
                } else if (rand < 0.7) {
                    const hue = Math.floor(Math.random() * 50) + 190;
                    b.color = `hsl(${hue}, 80%, 70%)`;
                } else if (rand < 0.9) {
                    const hue = Math.floor(Math.random() * 40) + 300;
                    b.color = `hsl(${hue}, 80%, 75%)`;
                } else {
                    b.color = `hsl(${Math.random() * 360}, 70%, 70%)`;
                }
            });
        }
    });

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        butterflies.forEach((b, index) => {
            const dx = clickX - b.x;
            const dy = clickY - b.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                window.createExplosion(b.x, b.y, b.color);
                butterflies.splice(index, 1);

                setTimeout(() => {
                    butterflies.push(new Butterfly());
                }, 2000);
            }
        });
    });

    // --- Confetti helper ---
    const rawConfetti = [];
    window.createExplosion = (x, y, color = null) => {
        for (let i = 0; i < 30; i++) {
            const conf = document.createElement("div");
            conf.className = "confetti-particle";
            conf.style.position = "absolute";
            conf.style.left = x + "px";
            conf.style.top = y + "px";
            conf.style.width = (Math.random() * 8 + 4) + "px";
            conf.style.height = (Math.random() * 8 + 4) + "px";
            conf.style.backgroundColor = color || `hsl(${Math.random() * 360}, 80%, 60%)`;
            conf.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
            conf.style.zIndex = "1000";
            conf.style.pointerEvents = "none";
            document.body.appendChild(conf);

            const vx = (Math.random() - 0.5) * 15;
            const vy = (Math.random() - 0.5) * 15 - 5;

            rawConfetti.push({ el: conf, x, y, vx, vy, life: 1.0 });
        }

        if (!confettiLooping) {
            confettiLooping = true;
            updateConfetti();
        }
    };

    let confettiLooping = false;
    function updateConfetti() {
        let active = false;
        for (let i = rawConfetti.length - 1; i >= 0; i--) {
            let p = rawConfetti[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5;
            p.life -= 0.02;

            p.el.style.left = p.x + "px";
            p.el.style.top = p.y + "px";
            p.el.style.opacity = p.life;
            p.el.style.transform = `rotate(${p.life * 360}deg)`;

            if (p.life <= 0) {
                p.el.remove();
                rawConfetti.splice(i, 1);
            } else {
                active = true;
            }
        }

        if (active) {
            requestAnimationFrame(updateConfetti);
        } else {
            confettiLooping = false;
        }
    }

    // --- Easter Egg Space Scene ---
    document.addEventListener("easterEggStart", () => {
        isEasterEgg = true;
        createStars();
    });

    document.addEventListener("easterEggEnd", () => {
        isEasterEgg = false;
        document.getElementById("galaxy-stars").innerHTML = "";
    });

    function createStars() {
        const container = document.getElementById("galaxy-stars");
        container.innerHTML = "";
        for (let i = 0; i < 100; i++) {
            const star = document.createElement("div");
            star.style.position = "absolute";
            star.style.left = Math.random() * 100 + "vw";
            star.style.top = Math.random() * 100 + "vh";
            const size = Math.random() * 3 + 1;
            star.style.width = size + "px";
            star.style.height = size + "px";
            star.style.backgroundColor = "#fff";
            star.style.borderRadius = "50%";
            star.style.boxShadow = "0 0 5px #fff";
            star.style.opacity = Math.random();
            star.style.animation = `blink ${Math.random() * 3 + 2}s infinite alternate`;
            container.appendChild(star);
        }
    }
});
