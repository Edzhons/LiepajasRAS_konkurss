// Only run this if we are on spele.html
if (window.location.pathname.endsWith("spele.html")) {
  const game = document.getElementById('game');
  const bin = document.getElementById('bin');
  const scoreDisplay = document.getElementById('score');

  let score = 0;
  let items = [];
  let left = 180;
  let currentLevel = 0;
  let levelTime = 20; // seconds per level
  let levelTimer;
  let spawnInterval, updateInterval;

  // Levels
  const levels = [
    { target: "glass", binImg: "images/bin_glass.png", name: "Stikls" },
    { target: "plastic", binImg: "images/bin_plastic.png", name: "Plastmasa" },
    { target: "paper", binImg: "images/bin_paper.png", name: "Papīrs" }
  ];

  const trashTypes = [
    { type: "glass", images: ["images/glass1.png", "images/glass2.png"] },
    { type: "plastic", images: ["images/plastic1.png", "images/plastic2.png"] },
    { type: "paper", images: ["images/paper1.png", "images/paper2.png"] }
  ];

  // --- LEVEL SETUP ---
  function startLevel(levelIndex) {
    if (levelIndex >= levels.length) {
      endGame();
      return;
    }

    const level = levels[levelIndex];
    bin.src = level.binImg;
    scoreDisplay.textContent = `Score: ${score} — Līmenis ${levelIndex + 1}: ${level.name}`;
    showMessage(`Sākas ${levelIndex + 1}. līmenis — ${level.name}!`);

    items.forEach(item => item.remove());
    items = [];

    clearIntervals();
    spawnInterval = setInterval(spawnItem, 1000);
    updateInterval = setInterval(() => updateGame(level.target), 30);

    // Level timer
    levelTime = 20;
    levelTimer = setInterval(() => {
      levelTime--;
      if (levelTime <= 0) {
        clearInterval(levelTimer);
        // stop spawning new items
        clearInterval(spawnInterval);

        // check every 200ms if all items are gone
        const waitForItems = setInterval(() => {
          if (items.length === 0) {
            clearInterval(waitForItems);
            nextLevel();
          }
        }, 200);
      }
    }, 1000);
  }

  function nextLevel() {
    clearIntervals();
    currentLevel++;
    startLevel(currentLevel);
  }

  function clearIntervals() {
    clearInterval(spawnInterval);
    clearInterval(updateInterval);
    clearInterval(levelTimer);
  }

  function endGame() {
    clearIntervals();
    showMessage(`Spēle beigusies! Tavs punktu skaits: ${score}`);
  }

  // --- GAME MECHANICS ---
  function spawnItem() {
    const randomType = trashTypes[Math.floor(Math.random() * trashTypes.length)];
    const imageSrc = randomType.images[Math.floor(Math.random() * randomType.images.length)];

    const item = document.createElement('img');
    item.src = imageSrc;
    item.classList.add('item');
    item.dataset.type = randomType.type;
    item.style.left = Math.random() * 360 + 'px';
    game.appendChild(item);
    items.push(item);
  }

  function updateGame(targetType) {


    items.forEach((item, i) => {
      const top = parseFloat(item.style.top || 0);
      item.style.top = top + 4 + 'px';

    const itemRect = item.getBoundingClientRect();

    const margin = 30; // Adjust this value to control the collision sensitivity
    const binRect = {
        top: bin.getBoundingClientRect().top + margin,
        right: bin.getBoundingClientRect().right - margin,
        bottom: bin.getBoundingClientRect().bottom - margin,
        left: bin.getBoundingClientRect().left + margin
      };

      // Collision detection
      if (
        itemRect.bottom > binRect.top &&
        itemRect.right > binRect.left &&
        itemRect.left < binRect.right &&
        itemRect.top < binRect.bottom
      ) {
        if (item.dataset.type === targetType) {
          score += 1;
        } else {
          score -= 3;
        }

        scoreDisplay.textContent = `Score: ${score} — Līmenis ${currentLevel + 1}: ${levels[currentLevel].name}`;
        item.remove();
        items.splice(i, 1);
      }

      // Remove if out of bounds
      if (top > 600) {
        item.remove();
        items.splice(i, 1);
      }
    });
  }

// --- BIN MOVEMENT ---
let lastMoveTime = 0; // Tracks the last time the bin moved
const moveCooldown = 100; // Minimum time (in ms) between movements

document.addEventListener('keydown', e => {
  const currentTime = Date.now();

  // Only allow movement if enough time has passed since the last move
  if (currentTime - lastMoveTime < moveCooldown) {
    return;
  }
  lastMoveTime = currentTime;

  if (e.key === 'ArrowLeft') {
    if (left <= 0) { // Only wrap when exactly at the left boundary
      // Disable transition and teleport to the right side
      bin.style.transition = 'none';
      left = 320; // Wrap around to the right side
      bin.style.left = left + 'px';

      // Re-enable transition for smooth movement
      setTimeout(() => {
        bin.style.transition = 'left 0.2s ease';
      }, 0);
    } else if (left > 0) { // Normal movement
      left -= 40;
      bin.style.left = left + 'px';
    }
  }

  if (e.key === 'ArrowRight') {
    if (left >= 320) { // Only wrap when exactly at the right boundary
      // Disable transition and teleport to the left side
      bin.style.transition = 'none';
      left = 0; // Wrap around to the left side
      bin.style.left = left + 'px';

      // Re-enable transition for smooth movement
      setTimeout(() => {
        bin.style.transition = 'left 0.2s ease';
      }, 0);
    } else if (left < 320) { // Normal movement
      left += 40;
      bin.style.left = left + 'px';
    }
  }
});

  // --- HELPER FUNCTIONS ---
  function showMessage(text) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.position = 'absolute';
    msg.style.top = '45%';
    msg.style.left = '50%';
    msg.style.transform = 'translate(-50%, -50%)';
    msg.style.background = 'rgba(0,0,0,0.7)';
    msg.style.color = 'white';
    msg.style.padding = '10px 20px';
    msg.style.borderRadius = '10px';
    msg.style.fontSize = '20px';
    msg.style.zIndex = '999';
    game.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  // --- START GAME ---
  startLevel(currentLevel);
}
