
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
    let nickname = null;

    // Līmeņa rezultātu uzskaite
    let correctSorts = 0;
    let incorrectSorts = 0;


    // vieglo iepakojumu  (papīra, plastmasas un metāla),
    // stikla iepakojumu,
    // bioloģiski noārdāmos atkritumus  (pārtikas pārpalikumus, dārza un zāles atkritumus, vecus augus u.tml.),
    // sadzīves bīstamos atkritumus (baterijas, elektroiekārtas, spuldzes, elektroniskās cigaretes u.tml.),
    // nešķirojamos sadzīves atkritumus


    const levels = [
      { target: "lightweight", binImg: "images/bin_lightweight.png", name: "Vieglais iepakojums (papīrs, plastmasa, metāls",
        explanation: "Vieglā iepakojuma konteinerā drīkst mest <b>tīrus</b> plastmasas un metāla iepakojumus, kā arī papīru un kartonu. Netīrs vai pārtikas atliekām piesārņots iepakojums nav derīgs otrreizējai pārstrādei."
      },
      { target: "glass", binImg: "images/bin_glass.png", name: "Stikls",
        explanation: "Stikla konteinerā met tikai stikla pudeles un burkas! Logu stikls, spoguļi, keramika vai porcelāns jādod nodot kā sadzīves atkritumus."
      },
      { target: "biodegradable", binImg: "images/bin_biodegradable.png", name: "Bioloģiski noārdāmie atkritumi",
        explanation: "Šajā konteinerā drīkst mest pārtikas atliekas, dārza un zaļos atkritumus, vecus augus, kafijas biezumus. Nekādā gadījumā nemest plastmasas iepakojumus vai šķidrumus!"
      },
      { target: "electronics", binImg: "images/bin_electronics.png", name: "sadzīves bīstamie atkritumi",
        explanation: "Bīstamajiem atkritumiem ir nepieciešama speciāla nodošana. Tie ir baterijas, nolietotas elektroiekārtas, spuldzes, termometri un elektroniskās cigaretes. Tiem ir speciāli savākšanas punkti."
      },
      { target: "nonrecyclable", binImg: "images/bin_nonrecyclable.png", name: "Nešķirojamie sadzīves atkritumi",
        explanation: "Šeit met visu, ko nevar pārstrādāt vai kas nav bīstams: netīrs iepakojums, putuplasts, vienreizlietojamie trauki, higiēnas preces u.c."
      }
    ];

    const trashTypes = [
      { type: "lightweight", images: ["images/lightweight1.png", "images/lightweight2.png"] },
      { type: "glass", images: ["images/glass1.png", "images/glass2.png"] },
      { type: "biodegradable", images: ["images/bio1.png", "images/bio2.png"] },
      { type: "electronics", images: ["images/electronics1.png", "images/electronics2.png"] },
      { type: "nonrecyclable", images: ["images/nonrecyclable1.png", "images/nonrecyclable2.png"] }
    ];

  function saveScore(score, nickname = localStorage.getItem("currentNickname") || "Spēlētājs") {
    let board = JSON.parse(localStorage.getItem("leaderboard") || "{}");

    const name = nickname;

    // If player not in board OR new score is higher → save it
    if (!board[name] || score > board[name]) {
      board[name] = score;
    }

    localStorage.setItem("leaderboard", JSON.stringify(board));
  }

  // Funkcija, lai parādītu līmeņa kopsavilkumu
  function showLevelSummary() {
    clearIntervals(); // Apturam visus spēles ciklus
    
    // Saglabājam rezultātu pirms rādīt kopsavilkumu
    saveScore(score); 
    updateLeaderboardBox();

    const currentLevelObj = levels[currentLevel];
    const summaryOverlay = document.getElementById("level-summary-overlay");
    
    // Aizpildām kartes saturu
    document.getElementById("summary-level-title").textContent = `${currentLevel + 1}. līmeņa kopsavilkums`;
    document.getElementById("summary-score-info").innerHTML = 
        `Šajā līmenī: <b>Pareizi sašķiroti: ${correctSorts}</b> (+${correctSorts} p.) <b>>Nepareizi sašķiroti: ${incorrectSorts}</b> (-${incorrectSorts * 3} p.)`;
    
    // Izglītojošais saturs
    document.getElementById("summary-target-name").textContent = currentLevelObj.name;
    document.getElementById("summary-explanation").textContent = currentLevelObj.explanation;

    const explanationElement = document.getElementById("summary-explanation");
    if (explanationElement) {
        explanationElement.innerHTML = currentLevelObj.explanation;
    }

    // Rādām pareizo atkritumu ikonas kā piemērus
    const exampleIconsContainer = document.getElementById("summary-example-icons");
    exampleIconsContainer.innerHTML = ''; // Notīra iepriekšējās ikonas

    const targetTrashType = trashTypes.find(t => t.type === currentLevelObj.target);
    if (targetTrashType) {
        targetTrashType.images.slice(0, 3).forEach(src => { // Rādām max 3 piemērus
            const img = document.createElement('img');
            img.src = src;
            img.alt = currentLevelObj.name + ' paraugs';
            img.classList.add('summary-example-icon'); // Jauna klase stilizācijai
            exampleIconsContainer.appendChild(img);
        });
    }

    // Pievienojam klausītāju pogai Turpināt
    const nextBtn = document.getElementById("next-level-btn");
    nextBtn.onclick = nextLevel;

    // Pārbaudām, vai šis ir pēdējais līmenis
    if (currentLevel >= levels.length - 1) {
        nextBtn.textContent = "Pabeigt spēli un redzēt galīgos rezultātus";
        nextBtn.onclick = endGame;
    } else {
          nextBtn.textContent = "Turpināt uz nākamo līmeni";
          nextBtn.onclick = nextLevel;
    }

    // Parādam pārklājumu
    if (summaryOverlay) summaryOverlay.classList.add("active");
  }

  function getLeaderboard() {
    const board = JSON.parse(localStorage.getItem("leaderboard") || "{}");

    // Convert to array → sort → return top 5
    const sorted = Object.entries(board)
      .sort((a, b) => b[1] - a[1]) // high → low
      .slice(0, 5);

    return sorted;
  }

  // --- LEADERBOARD BOX (right panel) ---
  function updateLeaderboardBox() {
    const lb = getLeaderboard();
    const list = document.getElementById("leaderboard-list");
    if (!list) return;

    const nickname = localStorage.getItem("currentNickname");

    list.innerHTML = "";

    lb.forEach(([name, score]) => {
      const li = document.createElement("li");
      li.textContent = `${name}: ${score}`;

      // Highlight if this is the current player
      if (name === nickname) {
        li.classList.add("highlight");
      }

      list.appendChild(li);
    });
  }

    // --- LEVEL SETUP ---
    function startLevel(levelIndex) {
      if (levelIndex >= levels.length) {
        endGame();
        return;
      }

      const level = levels[levelIndex];
      bin.src = level.binImg;
      document.getElementById('current-level').textContent = `Līmenis: ${levelIndex + 1}`;
      document.getElementById('score').innerHTML = `<h1>🏆 Punkti: ${score}</h1>`;
      showMessage(`Sākas ${levelIndex + 1}. līmenis — ${level.name}!`);

      // Update the level icon to the first trash symbol in the level
      const firstTrashImage = trashTypes.find(t => t.type === level.target)?.images[0];
      if (firstTrashImage) {
        document.getElementById('level-icon').src = firstTrashImage;
      }
      const secondTrashImage = trashTypes.find(t => t.type === level.target)?.images[1];
      if (secondTrashImage) {
        document.getElementById('level-icon2').src = secondTrashImage;
      }

      items.forEach(item => item.remove());
      items = [];

      clearIntervals();
      spawnInterval = setInterval(spawnItem, 1000);
      updateInterval = setInterval(() => updateGame(level.target), 30);

      // Level timer
      levelTime = 20;
      const timerDisplay = document.getElementById('timer');
      timerDisplay.innerHTML = `<h2>⏱️ Laiks: ${levelTime}s</h2>`;


      levelTimer = setInterval(() => {
        levelTime--;
        timerDisplay.innerHTML = `<h2>⏱️ Laiks: ${levelTime}s</h2>`;
        
        if (levelTime <= 0) {
          clearInterval(levelTimer);
          clearInterval(spawnInterval);

          const waitForItems = setInterval(() => {
            if (items.length === 0) {
              clearInterval(waitForItems);
              showLevelSummary();
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
      const summaryOverlay = document.getElementById("level-summary-overlay");
      if (summaryOverlay) summaryOverlay.classList.remove("active");
      
      clearIntervals();
      currentLevel++;
      
      // Resetējam līmeņa rezultātu uzskaiti
      correctSorts = 0;
      incorrectSorts = 0;
      
      startLevel(currentLevel);
    }

    function clearIntervals() {
      clearInterval(spawnInterval);
      clearInterval(updateInterval);
      clearInterval(levelTimer);
    }

    function endGame() {
      const summaryOverlay = document.getElementById("level-summary-overlay");
      if (summaryOverlay) summaryOverlay.classList.remove("active");

      clearIntervals();

      saveScore(score);
      updateLeaderboardBox();

      // Update the final score on the overlay
      const fs = document.getElementById("final-score");
      if (fs) fs.textContent = "Tavs rezultāts: " + score;

      // Show overlay
      const over = document.getElementById("game-over-screen");
      if (over) over.classList.add("active");
      
      document.getElementById("level-summary-overlay").classList.remove("active");
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

        const margin = 15; // Reduced collision margin for more precise hits
        const binRect = {
          top: bin.getBoundingClientRect().top + margin,
          right: bin.getBoundingClientRect().right - margin,
          bottom: bin.getBoundingClientRect().top + 5, // Only the top 5px of the bin is active
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
            correctSorts += 1;
          } else {
            score -= 3;
            incorrectSorts += 1;
            if (score < 0) score = 0; // Ensure score does not go below 0
          }

          scoreDisplay.innerHTML = `<h1>🏆 Punkti: ${score}</h1>`;
          updateLeaderboardBox();
          item.remove();
          items.splice(i, 1);
        }

        // Remove if fallen past the bottom of game area with extra buffer
        if (itemRect.top > gameRect.bottom + 50) { // Increased buffer to 50px
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
      msg.innerHTML = text; // ⬅️ change
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
      msg.style.textAlign = 'center';
      game.appendChild(msg);
      setTimeout(() => msg.remove(), 5000);
    }


      // --- START GAME ---
    document.addEventListener("DOMContentLoaded", function () {
      const overlay = document.getElementById("nickname-overlay");
      const card    = document.getElementById("nickname-card");
      const input   = document.getElementById("nickname-input");
      const okBtn   = document.getElementById("nickname-ok");

      // Failsafe: if overlay missing, just start with default
      if (!overlay || !card || !input || !okBtn) {
        nickname = localStorage.getItem("currentNickname") || "Spēlētājs";
        localStorage.setItem("currentNickname", nickname);

        const nameEl = document.getElementById("player-name-left");
        if (nameEl) nameEl.textContent = nickname;

        updateLeaderboardBox();
        setBinInitial();
        startLevel(currentLevel);
        return;
      }

      // Pre-fill with last nickname if exists
      const stored = localStorage.getItem("currentNickname");
      if (stored) {
        input.value = stored;
      }

      function startGameWithNickname() {
        let name = input.value.trim();
        if (!name) name = "Spēlētājs";

        nickname = name;
        localStorage.setItem("currentNickname", nickname);

        const nameEl = document.getElementById("player-name-left");
        if (nameEl) nameEl.textContent = nickname;

        updateLeaderboardBox();
        setBinInitial();
        startLevel(currentLevel);

        overlay.style.display = "none";
      }

      okBtn.addEventListener("click", startGameWithNickname);

      // Press Enter to confirm
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          startGameWithNickname();
        }
      });

      // Focus input on load
      input.focus();
    });
  }