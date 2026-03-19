// vines.js - Spawns animated hanging creepers/vines from the top corners

document.addEventListener("DOMContentLoaded", () => {
    const createVines = (side) => {
        const vineContainer = document.createElement("div");
        vineContainer.className = `vine-container ${side}`;
        document.body.appendChild(vineContainer);

        // Right side has fewer vines
        const numBranches = side === "right" ?
            3 + Math.floor(Math.random() * 2) :
            5 + Math.floor(Math.random() * 4);

        for (let i = 0; i < numBranches; i++) {
            const vine = document.createElement("div");
            vine.className = "vine-branch";

            // Adjust spacing if right side has fewer branches to still look natural
            const spacing = side === "right" ? 50 : 35;
            vine.style.left = `${(i * spacing) + (Math.random() * 20)}px`;

            // Randomize height (100px to 350px)
            const height = Math.random() * 250 + 100;
            vine.style.height = `${height}px`;
            vine.style.animationDelay = `${Math.random() * 3}s`;

            // Add leaves
            const numLeaves = Math.floor(height / 30); // Leaf every ~30px
            for (let j = 0; j < numLeaves; j++) {
                const leaf = document.createElement("div");
                leaf.className = "vine-leaf";
                leaf.style.top = `${(j / numLeaves) * 100}%`;

                const isLeft = Math.random() > 0.5;
                leaf.style.left = isLeft ? "-15px" : "5px";

                // Angle them outwards
                const rotation = isLeft ? -45 - Math.random() * 30 : 45 + Math.random() * 30;
                leaf.style.transform = `rotate(${rotation}deg)`;

                // Add tiny color variations
                const leafColors = ['#8fbc8f', '#98fb98', '#7fb07f'];
                leaf.style.background = leafColors[Math.floor(Math.random() * leafColors.length)];

                vine.appendChild(leaf);
            }

            vineContainer.appendChild(vine);
        }
    };

    createVines("left");
    createVines("right");

    createVines("left");
    createVines("right");

    // Hide vines during Easter Egg mode (Magical Galaxy)
    document.addEventListener("easterEggStart", () => {
        document.querySelectorAll(".vine-container").forEach(el => el.style.display = 'none');
    });
    document.addEventListener("easterEggEnd", () => {
        document.querySelectorAll(".vine-container").forEach(el => el.style.display = 'block');
    });
});
