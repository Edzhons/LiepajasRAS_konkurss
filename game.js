// Only run this if we are on spele.html
if (window.location.pathname.endsWith("spele.html")) {
  const game = document.getElementById('game');
  const bin = document.getElementById('bin');
  const scoreDisplay = document.getElementById('score');

  let score = 0;
  let items = [];
  let left = 0; // will be initialized to centered value based on #game width
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

  // Initialize bin position to horizontally center inside the #game area
  function setBinInitial() {
    // ensure layout has been calculated
    const gw = game.clientWidth || 400;
    const bw = bin.offsetWidth || 80;
    left = Math.round((gw - bw) / 2);
    // clamp
    left = Math.max(0, Math.min(left, gw - bw));
    bin.style.left = left + 'px';
  }

  // keep bin centered when viewport changes
  window.addEventListener('resize', () => {
    setBinInitial();
  });

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
    game.appendChild(item);

    // After the item exists in the DOM we can measure its width and place it
    const gw = game.clientWidth || 400;
    const iw = item.offsetWidth || parseFloat(getComputedStyle(item).width) || 64;
    const maxLeftForItem = Math.max(0, gw - iw - 4); // small padding
    const randLeft = Math.random() * maxLeftForItem;
    item.style.left = randLeft + 'px';
    items.push(item);
  }

  function updateGame(targetType) {
    const gameRect = game.getBoundingClientRect();

    items.forEach((item, i) => {
      const top = parseFloat(item.style.top || 0);
      item.style.top = top + 4 + 'px';

      const itemRect = item.getBoundingClientRect();

      const margin = 15; // reduced collision margin for more precise hits
      const binRect = {
        top: bin.getBoundingClientRect().top + margin,
        right: bin.getBoundingClientRect().right - margin,
        bottom: bin.getBoundingClientRect().bottom - 150, // no margin at bottom
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

      // Remove if fallen past the bottom of game area with extra buffer
      if (itemRect.top > gameRect.bottom + 50) { // increased buffer to 50px
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
    const gw = game.clientWidth || 400;
    const bw = bin.offsetWidth || 80;
    const maxLeft = Math.max(0, gw - bw);
    const step = Math.max(30, Math.round(gw / 8)); // relative step, min 30px

    if (left <= 0) { // wrap to right
      bin.style.transition = 'none';
      left = maxLeft;
      bin.style.left = left + 'px';
      setTimeout(() => {
        bin.style.transition = 'left 0.2s ease';
      }, 0);
    } else { // normal movement
      left = Math.max(0, left - step);
      bin.style.left = left + 'px';
    }
  }

  if (e.key === 'ArrowRight') {
    const gw = game.clientWidth || 400;
    const bw = bin.offsetWidth || 80;
    const maxLeft = Math.max(0, gw - bw);
    const step = Math.max(30, Math.round(gw / 8));

    if (left >= maxLeft) {
      bin.style.transition = 'none';
      left = 0;
      bin.style.left = left + 'px';
      setTimeout(() => {
        bin.style.transition = 'left 0.2s ease';
      }, 0);
    } else {
      left = Math.min(maxLeft, left + step);
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
  // ensure bin is centered based on initial game size
  setBinInitial();
  startLevel(currentLevel);
}
