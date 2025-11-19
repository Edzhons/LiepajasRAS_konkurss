if (window.location.pathname.endsWith("spele.html")) {
  const game = document.getElementById("game");
  const bin = document.getElementById("bin");
  const scoreDisplay = document.getElementById("score");

  let score = 0;
  let items = [];
  let left = 0;
  let currentLevel = 0;
  let levelTime = 20; // sekundes liimenii
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
    {
      target: "lightweight",
      binImg: "images/bin_lightweight.png",
      name: "Vieglais iepakojums (papīrs, plastmasa, metāls",
      explanation:
        "Vieglā iepakojuma konteinerā drīkst mest <b>tīrus</b> plastmasas un metāla iepakojumus, kā arī papīru un kartonu. Netīrs vai pārtikas atliekām piesārņots iepakojums nav derīgs otrreizējai pārstrādei.",
    },
    {
      target: "glass",
      binImg: "images/bin_glass.png",
      name: "Stikls",
      explanation:
        "Stikla konteinerā met tikai stikla pudeles un burkas! Logu stikls, spoguļi, keramika vai porcelāns jādod nodot kā sadzīves atkritumus.",
    },
    {
      target: "biodegradable",
      binImg: "images/bin_biodegradable.png",
      name: "Bioloģiski noārdāmie atkritumi",
      explanation:
        "Šajā konteinerā drīkst mest pārtikas atliekas, dārza un zaļos atkritumus, vecus augus, kafijas biezumus. Nekādā gadījumā nemest plastmasas iepakojumus vai šķidrumus!",
    },
    {
      target: "electronics",
      binImg: "images/bin_electronics.png",
      name: "sadzīves bīstamie atkritumi",
      explanation:
        "Bīstamajiem atkritumiem ir nepieciešama speciāla nodošana. Tie ir baterijas, nolietotas elektroiekārtas, spuldzes, termometri un elektroniskās cigaretes. Tiem ir speciāli savākšanas punkti.",
    },
    {
      target: "nonrecyclable",
      binImg: "images/bin_nonrecyclable.png",
      name: "Nešķirojamie sadzīves atkritumi",
      explanation:
        "Šeit met visu, ko nevar pārstrādāt vai kas nav bīstams: netīrs iepakojums, putuplasts, vienreizlietojamie trauki, higiēnas preces u.c.",
    },
  ];

  const trashTypes = [
    {
      type: "lightweight",
      images: ["images/lightweight1.png", "images/lightweight2.png"],
    },
    { type: "glass", images: ["images/glass1.png", "images/glass2.png"] },
    { type: "biodegradable", images: ["images/bio1.png", "images/bio2.png"] },
    {
      type: "electronics",
      images: ["images/electronics1.png", "images/electronics2.png"],
    },
    {
      type: "nonrecyclable",
      images: ["images/nonrecyclable1.png", "images/nonrecyclable2.png"],
    },
  ];

  function saveScore(
    score,
    nickname = localStorage.getItem("currentNickname") || "Spēlētājs"
  ) {
    let board = JSON.parse(localStorage.getItem("leaderboard") || "{}");

    const name = nickname;

    // ja speletajs nav tabulaa vai uzstada labaku rezultaatu to saglaba
    if (!board[name] || score > board[name]) {
      board[name] = score;
    }

    localStorage.setItem("leaderboard", JSON.stringify(board));
  }

  // Funkcija, lai parādītu līmeņa kopsavilkumu
  function showLevelSummary() {
    clearIntervals();

    // Saglabājam rezultātu pirms rādīt kopsavilkumu
    saveScore(score);
    updateLeaderboardBox();

    const currentLevelObj = levels[currentLevel];
    const summaryOverlay = document.getElementById("level-summary-overlay");

    document.getElementById("summary-level-title").textContent = `${
      currentLevel + 1
    }. līmeņa kopsavilkums`;
    document.getElementById(
      "summary-score-info"
    ).innerHTML = `Šajā līmenī: <b>Pareizi sašķiroti: ${correctSorts}</b> (+${correctSorts} p.) <b>>Nepareizi sašķiroti: ${incorrectSorts}</b> (-${
      incorrectSorts * 3
    } p.)`;

    document.getElementById("summary-target-name").textContent =
      currentLevelObj.name;
    document.getElementById("summary-explanation").textContent =
      currentLevelObj.explanation;

    const explanationElement = document.getElementById("summary-explanation");
    if (explanationElement) {
      explanationElement.innerHTML = currentLevelObj.explanation;
    }

    const exampleIconsContainer = document.getElementById(
      "summary-example-icons"
    );
    exampleIconsContainer.innerHTML = "";

    const targetTrashType = trashTypes.find(
      (t) => t.type === currentLevelObj.target
    );
    if (targetTrashType) {
      targetTrashType.images.slice(0, 3).forEach((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = currentLevelObj.name + " paraugs";
        img.classList.add("summary-example-icon");
        exampleIconsContainer.appendChild(img);
      });
    }

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

    if (summaryOverlay) summaryOverlay.classList.add("active");
  }

  function getLeaderboard() {
    const board = JSON.parse(localStorage.getItem("leaderboard") || "{}");

    /* šķiro top 5 dilstošā secībā */
    const sorted = Object.entries(board)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted;
  }

  function updateLeaderboardBox() {
    const lb = getLeaderboard();
    const list = document.getElementById("leaderboard-list");
    if (!list) return;

    const nickname = localStorage.getItem("currentNickname");

    list.innerHTML = "";

    lb.forEach(([name, score]) => {
      const li = document.createElement("li");
      li.textContent = `${name}: ${score}`;

      // Highlight ja sis ir tagadejais speletajs
      if (name === nickname) {
        li.classList.add("highlight");
      }

      list.appendChild(li);
    });
  }

  function startLevel(levelIndex) {
    if (levelIndex >= levels.length) {
      endGame();
      return;
    }

    const level = levels[levelIndex];
    bin.src = level.binImg;
    document.getElementById("current-level").textContent = `Līmenis: ${
      levelIndex + 1
    }`;
    document.getElementById("score").innerHTML = `<h1>🏆 Punkti: ${score}</h1>`;
    showMessage(`Sākas ${levelIndex + 1}. līmenis — ${level.name}!`);

    const firstTrashImage = trashTypes.find((t) => t.type === level.target)
      ?.images[0];
    if (firstTrashImage) {
      document.getElementById("level-icon").src = firstTrashImage;
    }
    const secondTrashImage = trashTypes.find((t) => t.type === level.target)
      ?.images[1];
    if (secondTrashImage) {
      document.getElementById("level-icon2").src = secondTrashImage;
    }

    items.forEach((item) => item.remove());
    items = [];

    clearIntervals();
    spawnInterval = setInterval(spawnItem, 1000);
    updateInterval = setInterval(() => updateGame(level.target), 30);

    levelTime = 20;
    const timerDisplay = document.getElementById("timer");
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

  function setBinInitial() {
    const gw = game.clientWidth || 400;
    const bw = bin.offsetWidth || 80;
    left = Math.round((gw - bw) / 2);
    left = Math.max(0, Math.min(left, gw - bw));
    bin.style.left = left + "px";
  }

  window.addEventListener("resize", () => {
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

    // atjaunina final score
    const fs = document.getElementById("final-score");
    if (fs) fs.textContent = "Tavs rezultāts: " + score;
    const over = document.getElementById("game-over-screen");
    if (over) over.classList.add("active");

    document.getElementById("level-summary-overlay").classList.remove("active");
  }

  function spawnItem() {
    const randomType =
      trashTypes[Math.floor(Math.random() * trashTypes.length)];
    const imageSrc =
      randomType.images[Math.floor(Math.random() * randomType.images.length)];

    const item = document.createElement("img");
    item.src = imageSrc;
    item.classList.add("item");
    item.dataset.type = randomType.type;
    game.appendChild(item);
    const gw = game.clientWidth || 400;
    const iw =
      item.offsetWidth || parseFloat(getComputedStyle(item).width) || 64;
    const maxLeftForItem = Math.max(0, gw - iw - 4);
    const randLeft = Math.random() * maxLeftForItem;
    item.style.left = randLeft + "px";
    items.push(item);
  }

  function updateGame(targetType) {
    const gameRect = game.getBoundingClientRect();

    items.forEach((item, i) => {
      const top = parseFloat(item.style.top || 0);
      item.style.top = top + 4 + "px";

      const itemRect = item.getBoundingClientRect();

      const margin = 15;
      const binRect = {
        top: bin.getBoundingClientRect().top + margin,
        right: bin.getBoundingClientRect().right - margin,
        bottom: bin.getBoundingClientRect().top + 5,
        left: bin.getBoundingClientRect().left + margin,
      };

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
          if (score < 0) score = 0; // score neiet zem 0
        }

        scoreDisplay.innerHTML = `<h1>🏆 Punkti: ${score}</h1>`;
        updateLeaderboardBox();
        item.remove();
        items.splice(i, 1);
      }

      if (itemRect.top > gameRect.bottom + 50) {
        item.remove();
        items.splice(i, 1);
      }
    });
  }

  let lastMoveTime = 0;
  const moveCooldown = 100;

  document.addEventListener("keydown", (e) => {
    const currentTime = Date.now();

    // kustība ierobežota uz noteiktu laiku
    if (currentTime - lastMoveTime < moveCooldown) {
      return;
    }
    lastMoveTime = currentTime;

    if (e.key === "ArrowLeft") {
      const gw = game.clientWidth || 400;
      const bw = bin.offsetWidth || 80;
      const maxLeft = Math.max(0, gw - bw);
      const step = Math.max(30, Math.round(gw / 8));

      if (left <= 0) {
        bin.style.transition = "none";
        left = maxLeft;
        bin.style.left = left + "px";
        setTimeout(() => {
          bin.style.transition = "left 0.2s ease";
        }, 0);
      } else {
        left = Math.max(0, left - step);
        bin.style.left = left + "px";
      }
    }

    if (e.key === "ArrowRight") {
      const gw = game.clientWidth || 400;
      const bw = bin.offsetWidth || 80;
      const maxLeft = Math.max(0, gw - bw);
      const step = Math.max(30, Math.round(gw / 8));

      if (left >= maxLeft) {
        bin.style.transition = "none";
        left = 0;
        bin.style.left = left + "px";
        setTimeout(() => {
          bin.style.transition = "left 0.2s ease";
        }, 0);
      } else {
        left = Math.min(maxLeft, left + step);
        bin.style.left = left + "px";
      }
    }
  });

  // telefona pogu kontroles
  let mobileMoveInterval = null;

  function moveBin(direction) {
    const gw = game.clientWidth || 400;
    const bw = bin.offsetWidth || 80;
    const maxLeft = Math.max(0, gw - bw);
    const step = Math.max(30, Math.round(gw / 8));

    if (direction === "left") {
      if (left <= 0) {
        bin.style.transition = "none";
        left = maxLeft;
        bin.style.left = left + "px";
        setTimeout(() => {
          bin.style.transition = "left 0.2s ease";
        }, 0);
      } else {
        left = Math.max(0, left - step);
        bin.style.left = left + "px";
      }
    } else if (direction === "right") {
      if (left >= maxLeft) {
        bin.style.transition = "none";
        left = 0;
        bin.style.left = left + "px";
        setTimeout(() => {
          bin.style.transition = "left 0.2s ease";
        }, 0);
      } else {
        left = Math.min(maxLeft, left + step);
        bin.style.left = left + "px";
      }
    }
  }

  function startMovingMobile(dir) {
    moveBin(dir);
    if (mobileMoveInterval) clearInterval(mobileMoveInterval);
    mobileMoveInterval = setInterval(() => moveBin(dir), 150);
  }

  function stopMovingMobile() {
    if (mobileMoveInterval) {
      clearInterval(mobileMoveInterval);
      mobileMoveInterval = null;
    }
  }

  function showMessage(text) {
    const msg = document.createElement("div");
    msg.innerHTML = text; // ⬅️ change
    msg.style.position = "absolute";
    msg.style.top = "45%";
    msg.style.left = "50%";
    msg.style.transform = "translate(-50%, -50%)";
    msg.style.background = "rgba(0,0,0,0.7)";
    msg.style.color = "white";
    msg.style.padding = "10px 20px";
    msg.style.borderRadius = "10px";
    msg.style.fontSize = "20px";
    msg.style.zIndex = "999";
    msg.style.textAlign = "center";
    game.appendChild(msg);
    setTimeout(() => msg.remove(), 5000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const overlay = document.getElementById("nickname-overlay");
    const card = document.getElementById("nickname-card");
    const input = document.getElementById("nickname-input");
    const okBtn = document.getElementById("nickname-ok");

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
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        startGameWithNickname();
      }
    });

    input.focus();
    function setupMobileControls() {
      const leftBtn = document.getElementById("mobile-left");
      const rightBtn = document.getElementById("mobile-right");
      const mobileControls = document.getElementById("mobile-controls");
      console.log("[DEBUG] setupMobileControls running", {
        leftBtn: !!leftBtn,
        rightBtn: !!rightBtn,
        mobileControls: !!mobileControls,
      });

      if (!leftBtn || !rightBtn || !mobileControls) {
        console.warn("[DEBUG] Mobile control elements missing", {
          leftBtn: !!leftBtn,
          rightBtn: !!rightBtn,
          mobileControls: !!mobileControls,
        });
        return;
      }

      if (window.location.search.indexOf("showcontrols=1") !== -1) {
        mobileControls.style.display = "flex";
        mobileControls.style.zIndex = "11000";
        mobileControls.style.opacity = "1";
        mobileControls.style.background = "transparent";
      }

      leftBtn.addEventListener("click", (evt) => {
        console.log("[DEBUG] mobile-left click");
        leftBtn.setAttribute("aria-pressed", "true");
        setTimeout(() => leftBtn.setAttribute("aria-pressed", "false"), 120);
        moveBin("left");
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowLeft" })
        );
      });
      rightBtn.addEventListener("click", (evt) => {
        console.log("[DEBUG] mobile-right click");
        rightBtn.setAttribute("aria-pressed", "true");
        setTimeout(() => rightBtn.setAttribute("aria-pressed", "false"), 120);
        moveBin("right");
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight" })
        );
      });

      const makeStart = (dir, el) => (e) => {
        e.preventDefault();
        console.log("[DEBUG] startMovingMobile", dir);
        el && el.setAttribute("aria-pressed", "true");
        startMovingMobile(dir);
      };
      const makeStop = (el) => (e) => {
        e && e.preventDefault && e.preventDefault();
        console.log("[DEBUG] stopMovingMobile");
        el && el.setAttribute("aria-pressed", "false");
        stopMovingMobile();
      };

      leftBtn.addEventListener("touchstart", makeStart("left", leftBtn), {
        passive: false,
      });
      leftBtn.addEventListener("mousedown", makeStart("left", leftBtn));
      leftBtn.addEventListener("touchend", makeStop(leftBtn));
      leftBtn.addEventListener("mouseup", makeStop(leftBtn));
      leftBtn.addEventListener("mouseleave", makeStop(leftBtn));

      rightBtn.addEventListener("touchstart", makeStart("right", rightBtn), {
        passive: false,
      });
      rightBtn.addEventListener("mousedown", makeStart("right", rightBtn));
      rightBtn.addEventListener("touchend", makeStop(rightBtn));
      rightBtn.addEventListener("mouseup", makeStop(rightBtn));
      rightBtn.addEventListener("mouseleave", makeStop(rightBtn));
    }

    setupMobileControls();

    try {
      const qs = window.location.search || "";
      if (qs.indexOf("showcontrols=1") !== -1) {
        const mc = document.getElementById("mobile-controls");
        if (mc) {
          mc.style.display = "flex";
          mc.style.zIndex = "11000";
          mc.style.opacity = "1";
          mc.setAttribute("aria-hidden", "false");
          console.log("[DEBUG] mobile-controls forced visible via URL param");
        }
      }
    } catch (e) {
      console.warn("Could not apply debug controls:", e);
    }
  });
}
