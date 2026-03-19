// garden.js - Spawns and animates the interactive garden background

document.addEventListener("DOMContentLoaded", () => {
    const gardenLayer = document.getElementById("garden-layer");
    if (!gardenLayer) return;

    const numGrass = Math.floor(window.innerWidth / 15); // Density
    const numFlowers = Math.floor(window.innerWidth / 100);
    const numFireflies = 15;

    const plants = [];

    // Create Grass
    for (let i = 0; i < numGrass; i++) {
        const grass = document.createElement("div");
        grass.className = "grass-blade";
        const height = Math.random() * 60 + 40; // 40px to 100px
        const left = Math.random() * window.innerWidth;
        const width = Math.random() * 4 + 3; // 3 to 7px width bases

        grass.style.borderBottomWidth = `${height}px`;
        grass.style.borderLeftWidth = `${width}px`;
        grass.style.borderRightWidth = `${width}px`;
        grass.style.left = `${left}px`;

        // Slight color variations
        const light = Math.random() > 0.5 ? '#98fb98' : '#8fbc8f';
        const dark = '#7fb07f';
        grass.style.borderBottomColor = Math.random() > 0.8 ? dark : light;

        // Add random natural sway offset
        const baseAngle = (Math.random() - 0.5) * 20; // -10deg to 10deg start
        grass.dataset.baseAngle = baseAngle;
        grass.dataset.x = left;
        grass.style.transform = `rotate(${baseAngle}deg)`;

        gardenLayer.appendChild(grass);
        plants.push(grass);
    }

    // Create Mini Flowers
    for (let i = 0; i < numFlowers; i++) {
        const stem = document.createElement("div");
        stem.className = "flower-stem";
        const height = Math.random() * 50 + 80; // 80 to 130px
        const left = Math.random() * window.innerWidth;

        stem.style.height = `${height}px`;
        stem.style.left = `${left}px`;

        const flowerHead = document.createElement("div");
        flowerHead.className = "mini-flower";

        // Random colors
        const colors = [
            'radial-gradient(circle, #ffe66d 30%, #ffdeeb 40%)',
            'radial-gradient(circle, #fff 30%, #cde4ff 40%)',
            'radial-gradient(circle, #fff7c2 30%, #e0c3fc 40%)'
        ];
        flowerHead.style.background = colors[Math.floor(Math.random() * colors.length)];

        stem.appendChild(flowerHead);

        const baseAngle = (Math.random() - 0.5) * 15;
        stem.dataset.baseAngle = baseAngle;
        stem.dataset.x = left;
        stem.style.transform = `rotate(${baseAngle}deg)`;

        gardenLayer.appendChild(stem);
        plants.push(stem);
    }

    // Create Fireflies
    for (let i = 0; i < numFireflies; i++) {
        const firefly = document.createElement("div");
        firefly.className = "firefly";

        firefly.style.left = `${Math.random() * window.innerWidth}px`;
        firefly.style.bottom = `${Math.random() * 100 + 10}px`;

        firefly.style.animationDuration = `${Math.random() * 5 + 5}s`;
        firefly.style.animationDelay = `${Math.random() * 5}s`;

        gardenLayer.appendChild(firefly);
    }

    // Interactive Sway on Mouse Move
    let mouseX = window.innerWidth / 2;
    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
    }, { passive: true });

    // Animation Loop for plants resolving back to base or bending away from mouse
    function animateGarden() {
        plants.forEach(plant => {
            const plantX = parseFloat(plant.dataset.x);
            const baseAngle = parseFloat(plant.dataset.baseAngle);

            const dx = mouseX - plantX;
            const distance = Math.abs(dx);

            let targetAngle = baseAngle;

            // If mouse is near, bend away
            // The closer, the more it bends
            const influenceRadius = 150;
            if (distance < influenceRadius) {
                // Bend angle: max 45deg, fading to 0 at edge of influence
                const force = (1 - (distance / influenceRadius)) * 45;
                // direction depends on sign of dx (mouse left of plant -> plant bends right)
                const dir = dx < 0 ? 1 : -1;
                targetAngle = baseAngle + (force * dir);
            }

            plant.style.transform = `rotate(${targetAngle}deg)`;
        });

        // Add slow natural wind sway over time
        const time = Date.now() * 0.001;
        const wind = Math.sin(time) * 5; // gentle 5 deg sway

        plants.forEach(plant => {
            // We adjust the current rotate value smoothly above, but since this is DOM/CSS,
            // CSS transition handles the smoothing. We just update the target property.

            // Extract current target
            let rotStr = plant.style.transform;
            let currentTarget = parseFloat(rotStr.replace('rotate(', '').replace('deg)', ''));
            if (isNaN(currentTarget)) currentTarget = parseFloat(plant.dataset.baseAngle);

            plant.style.transform = `rotate(${currentTarget + wind}deg)`;
        });

        // Run updates less frequently than 60fps to save performance, CSS transitions handle smoothing
        setTimeout(() => requestAnimationFrame(animateGarden), 100);
    }

    animateGarden();

    // Hide garden in space mode
    document.addEventListener("easterEggStart", () => {
        gardenLayer.style.display = 'none';
    });

    document.addEventListener("easterEggEnd", () => {
        gardenLayer.style.display = 'flex';
    });
});
