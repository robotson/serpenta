(() => {
  "use strict";

  const PORTRAIT_BOARD = Number.isFinite(window.innerWidth)
    && window.innerWidth <= 720
    && window.innerHeight > window.innerWidth;
  const COLS = PORTRAIT_BOARD ? 11 : 18;
  const ROWS = PORTRAIT_BOARD ? 18 : 11;
  const CELL = 40;
  const STEP_MS = 150;
  const START_LENGTH = 5;
  const EYE_COUNT = 5;
  const START_MINIMUM = 9;
  const LEVEL_INCREMENT = 3;

  function hashSeed(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let state = hashSeed(seed);
    return () => {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function requestedSeed() {
    try {
      return new URLSearchParams(window.location?.search || "").get("seed");
    } catch {
      return null;
    }
  }

  const challengeSeed = requestedSeed()
    || `run-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`;
  let random = seededRandom(challengeSeed);

  const DIRECTIONS = {
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 }
  };
  const START_DIRECTION = PORTRAIT_BOARD ? DIRECTIONS.UP : DIRECTIONS.LEFT;

  const board = document.querySelector("#board");
  board.style.setProperty("--board-columns", COLS);
  board.style.setProperty("--board-rows", ROWS);
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  board.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const snakeRenderer = window.createSerpentaSnakeRenderer?.(board, canvas.width, canvas.height) || null;

  const spriteSources = {
    eyeOpen: "assets/eye-open.png",
    eyeClosed: "assets/eye-closed.png",
    appleRed: "assets/apple-red.png",
    appleGold: "assets/apple-gold.png",
    snakeHead: "assets/snake-head-v2.png?v=3",
    snakeStraight: "assets/snake-straight-v2.png?v=3",
    snakeCorner: "assets/snake-corner-v2.png?v=4",
    snakeTail: "assets/snake-tail-v2.png?v=3"
  };
  const sprites = Object.fromEntries(Object.entries(spriteSources).map(([name, source]) => {
    const image = new Image();
    image.src = source;
    return [name, image];
  }));

  const ui = {
    level: document.querySelector("#levelValue"),
    minimum: document.querySelector("#minimumValue"),
    length: document.querySelector("#lengthValue"),
    score: document.querySelector("#scoreValue"),
    resultMinimum: document.querySelector("#resultMinimum"),
    resultLength: document.querySelector("#resultLength"),
    resultPoints: document.querySelector("#resultPoints"),
    intro: document.querySelector("#introScreen"),
    paused: document.querySelector("#pausedScreen"),
    gameOver: document.querySelector("#gameOverScreen"),
    levelComplete: document.querySelector("#levelScreen"),
    sound: document.querySelector("[data-action='sound']"),
    challenge: document.querySelector("#challengeLabel"),
    best: document.querySelectorAll("[data-best]"),
    shareStatus: document.querySelectorAll("[data-share-status]")
  };

  let state = "intro";
  let level = 1;
  let score = 0;
  let layout = null;
  let snake = [];
  let direction = START_DIRECTION;
  let directionQueue = [];
  let apple = null;
  let golden = false;
  let lastStep = 0;
  let pausedAt = 0;
  let swipeStart = null;
  let coveredEyes = 0;
  let audioContext = null;
  let soundEnabled = readSoundPreference();
  let bestScore = readBestScore();

  const soundPatterns = {
    turn: [[180, 0.018, 0.025]],
    eye: [[310, 0.04, 0.04], [465, 0.055, 0.035]],
    eat: [[220, 0.04, 0.045], [330, 0.05, 0.04]],
    gold: [[330, 0.05, 0.05], [495, 0.06, 0.05], [660, 0.08, 0.045]],
    win: [[262, 0.08, 0.045], [392, 0.1, 0.045], [523, 0.18, 0.05]],
    lose: [[170, 0.1, 0.05], [110, 0.22, 0.045]]
  };

  function readSoundPreference() {
    try {
      return window.localStorage?.getItem("serpenta.sound") !== "off";
    } catch {
      return true;
    }
  }

  function saveSoundPreference() {
    try {
      window.localStorage?.setItem("serpenta.sound", soundEnabled ? "on" : "off");
    } catch {
      // Storage can be unavailable in private or embedded browsing modes.
    }
  }

  function readBestScore() {
    try {
      return Math.max(0, Number.parseInt(window.localStorage?.getItem("serpenta.best") || "0", 10) || 0);
    } catch {
      return 0;
    }
  }

  function saveBestScore() {
    if (score <= bestScore) return;
    bestScore = score;
    try {
      window.localStorage?.setItem("serpenta.best", String(bestScore));
    } catch {
      // The current session can still display the record without persistent storage.
    }
    updateChallengeUi();
  }

  function challengeUrl(seed = challengeSeed) {
    const url = new URL(window.location?.href || "https://serpenta.demo.codes/");
    url.search = "";
    url.hash = "";
    url.searchParams.set("seed", seed);
    return url.toString();
  }

  function dailySeed() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `daily-${year}-${month}-${day}`;
  }

  function updateChallengeUi() {
    const daily = challengeSeed.startsWith("daily-");
    ui.challenge.textContent = daily
      ? `Daily challenge · ${challengeSeed.slice(6)}`
      : `Challenge · ${challengeSeed.replace(/^run-/, "").slice(0, 14)}`;
    for (const target of ui.best) target.textContent = bestScore;
  }

  async function shareChallenge() {
    const url = challengeUrl();
    const text = score > 0
      ? `I scored ${score} in Serpenta. Can you beat it?`
      : "Try this Serpenta challenge.";
    try {
      if (navigator.share) await navigator.share({ title: "Serpenta", text, url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(`${text} ${url}`);
      else throw new Error("Sharing is unavailable");
      for (const target of ui.shareStatus) target.textContent = "Challenge ready to share.";
    } catch (error) {
      if (error?.name === "AbortError") return;
      for (const target of ui.shareStatus) target.textContent = url;
    }
  }

  function openDailyChallenge() {
    window.location.assign(challengeUrl(dailySeed()));
  }

  function playSound(name) {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!soundEnabled || !AudioEngine || !soundPatterns[name]) return;
    audioContext ||= new AudioEngine();
    if (audioContext.state === "suspended") audioContext.resume();
    let start = audioContext.currentTime;
    for (const [frequency, duration, volume] of soundPatterns[name]) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
      start += duration * 0.8;
    }
  }

  function updateSoundButton() {
    ui.sound.setAttribute("aria-pressed", String(soundEnabled));
    ui.sound.textContent = soundEnabled ? "♪" : "×";
    ui.sound.title = soundEnabled ? "Sound on" : "Sound off";
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    saveSoundPreference();
    updateSoundButton();
    if (soundEnabled) playSound("turn");
  }

  function key(cell) {
    return `${cell.x},${cell.y}`;
  }

  function same(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function inBounds(cell) {
    return cell.x >= 0 && cell.x < COLS && cell.y >= 0 && cell.y < ROWS;
  }

  function neighbors(cell) {
    return Object.values(DIRECTIONS)
      .map(delta => ({ x: cell.x + delta.x, y: cell.y + delta.y }))
      .filter(inBounds);
  }

  function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function shuffled(values) {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function permutations(values) {
    if (values.length < 2) return [values.slice()];
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const rest = values.slice(0, i).concat(values.slice(i + 1));
      for (const tail of permutations(rest)) result.push([values[i], ...tail]);
    }
    return result;
  }

  function minimumOrdering(points) {
    let minimumSteps = Infinity;
    const orders = [];
    for (const order of permutations(points)) {
      let steps = 0;
      for (let i = 1; i < order.length; i++) steps += manhattan(order[i - 1], order[i]);
      if (steps < minimumSteps) {
        minimumSteps = steps;
        orders.length = 0;
        orders.push(order);
      } else if (steps === minimumSteps) {
        orders.push(order);
      }
    }
    return { minimumSteps, orders };
  }

  function lRoutes(from, to) {
    const routes = [];
    const horizontalFirst = [];
    const verticalFirst = [];
    let cursor = { ...from };

    while (cursor.x !== to.x) {
      cursor = { x: cursor.x + Math.sign(to.x - cursor.x), y: cursor.y };
      horizontalFirst.push(cursor);
    }
    while (cursor.y !== to.y) {
      cursor = { x: cursor.x, y: cursor.y + Math.sign(to.y - cursor.y) };
      horizontalFirst.push(cursor);
    }

    cursor = { ...from };
    while (cursor.y !== to.y) {
      cursor = { x: cursor.x, y: cursor.y + Math.sign(to.y - cursor.y) };
      verticalFirst.push(cursor);
    }
    while (cursor.x !== to.x) {
      cursor = { x: cursor.x + Math.sign(to.x - cursor.x), y: cursor.y };
      verticalFirst.push(cursor);
    }

    routes.push(horizontalFirst);
    if (horizontalFirst.map(key).join("|") !== verticalFirst.map(key).join("|")) routes.push(verticalFirst);
    return shuffled(routes);
  }

  // A witness with exactly the Manhattan lower-bound length proves the minimum is exact.
  function certifiedMinimumPath(points) {
    const { minimumSteps, orders } = minimumOrdering(points);

    function connect(order, index, path, occupied) {
      if (index === order.length) return path;
      const from = order[index - 1];
      const to = order[index];
      for (const route of lRoutes(from, to)) {
        if (route.some(cell => occupied.has(key(cell)))) continue;
        const nextOccupied = new Set(occupied);
        for (const cell of route) nextOccupied.add(key(cell));
        const result = connect(order, index + 1, path.concat(route), nextOccupied);
        if (result) return result;
      }
      return null;
    }

    for (const order of shuffled(orders)) {
      const witness = connect(order, 1, [{ ...order[0] }], new Set([key(order[0])]));
      if (witness && witness.length === minimumSteps + 1) {
        return { path: witness, minimum: witness.length, order };
      }
    }
    return null;
  }

  function spawnCells() {
    if (PORTRAIT_BOARD) {
      const x = Math.floor(COLS / 2);
      const headY = Math.min(ROWS - START_LENGTH, Math.floor(ROWS * 0.62));
      return Array.from({ length: START_LENGTH }, (_, i) => ({ x, y: headY + i }));
    }
    const y = Math.floor(ROWS / 2);
    const headX = Math.min(COLS - START_LENGTH, Math.floor(COLS * 0.62));
    return Array.from({ length: START_LENGTH }, (_, i) => ({ x: headX + i, y }));
  }

  function cornerCenterLayout() {
    const points = [
      { x: 0, y: 0 },
      { x: COLS - 1, y: 0 },
      { x: 0, y: ROWS - 1 },
      { x: COLS - 1, y: ROWS - 1 },
      { x: Math.floor((COLS - 1) / 2), y: Math.floor((ROWS - 1) / 2) }
    ];
    const certified = certifiedMinimumPath(points);
    return { eyes: points, ...certified };
  }

  const maximumLayout = cornerCenterLayout();
  const MAXIMUM_MINIMUM = maximumLayout.minimum;

  function randomPoint(bounds) {
    return {
      x: bounds.left + Math.floor(random() * (bounds.right - bounds.left + 1)),
      y: bounds.top + Math.floor(random() * (bounds.bottom - bounds.top + 1))
    };
  }

  function generateLayout(levelNumber) {
    const requested = Math.min(START_MINIMUM + (levelNumber - 1) * LEVEL_INCREMENT, MAXIMUM_MINIMUM);
    if (requested === MAXIMUM_MINIMUM) return { ...maximumLayout, requested };

    const progress = (requested - START_MINIMUM) / Math.max(1, MAXIMUM_MINIMUM - START_MINIMUM);
    const halfWidth = Math.min(Math.floor(COLS / 2), 3 + Math.ceil(progress * (COLS / 2 - 3)));
    const halfHeight = Math.min(Math.floor(ROWS / 2), 2 + Math.ceil(progress * (ROWS / 2 - 2)));
    const centerX = Math.floor((COLS - 1) / 2);
    const centerY = Math.floor((ROWS - 1) / 2);
    const bounds = {
      left: Math.max(0, centerX - halfWidth),
      right: Math.min(COLS - 1, centerX + halfWidth),
      top: Math.max(0, centerY - halfHeight),
      bottom: Math.min(ROWS - 1, centerY + halfHeight)
    };
    const forbidden = new Set(spawnCells().map(key));
    let bestAboveTarget = null;

    for (let attempt = 0; attempt < 5000; attempt++) {
      const points = [];
      const used = new Set();
      while (points.length < EYE_COUNT) {
        const point = randomPoint(bounds);
        if (used.has(key(point)) || forbidden.has(key(point))) continue;
        used.add(key(point));
        points.push(point);
      }

      const certificate = certifiedMinimumPath(points);
      if (!certificate) continue;
      const candidate = { eyes: points, ...certificate, requested };
      if (candidate.minimum >= requested && (!bestAboveTarget || candidate.minimum < bestAboveTarget.minimum)) {
        bestAboveTarget = candidate;
      }
      if (candidate.minimum >= requested && candidate.minimum <= requested + 2) return candidate;
    }

    if (bestAboveTarget) return bestAboveTarget;
    return { ...maximumLayout, requested };
  }

  function resetSnake() {
    snake = spawnCells();
    direction = START_DIRECTION;
    directionQueue = [];
    golden = false;
    coveredEyes = 0;
    apple = chooseReachableApple(false);
    updateHud();
  }

  function blockedCells() {
    const blocked = new Set(snake.map(key));
    blocked.delete(key(snake[0]));
    return blocked;
  }

  function reachableFromHead() {
    const blocked = blockedCells();
    const start = snake[0];
    const queue = [{ cell: start, distance: 0 }];
    const visited = new Set([key(start)]);
    const result = [];
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      for (const next of neighbors(current.cell)) {
        if (visited.has(key(next)) || blocked.has(key(next))) continue;
        visited.add(key(next));
        const entry = { cell: next, distance: current.distance + 1 };
        queue.push(entry);
        result.push(entry);
      }
    }
    return result;
  }

  function chooseReachableApple(makeGolden) {
    const reachable = reachableFromHead().filter(entry => !layout.eyes.some(eye => same(eye, entry.cell)));
    if (!reachable.length) return null;

    if (makeGolden) {
      const farthestDistance = Math.max(...reachable.map(entry => entry.distance));
      const farthest = reachable.filter(entry => entry.distance >= Math.max(3, farthestDistance - 2));
      return { ...farthest[Math.floor(random() * farthest.length)].cell, golden: true };
    }

    const useful = reachable.filter(entry => entry.distance >= 4);
    const pool = useful.length ? useful : reachable;
    return { ...pool[Math.floor(random() * pool.length)].cell, golden: false };
  }

  function enqueueDirection(queue, current, next) {
    const projected = queue.length ? queue[queue.length - 1] : current;
    const opposite = next.x === -projected.x && next.y === -projected.y;
    const duplicate = next.x === projected.x && next.y === projected.y;
    if (opposite || duplicate || queue.length >= 2) return false;
    queue.push(next);
    return true;
  }

  function requestDirection(next) {
    if (state !== "playing") return;
    if (enqueueDirection(directionQueue, direction, next)) {
      playSound("turn");
      return true;
    }
    return false;
  }

  function step(timestamp) {
    if (directionQueue.length) direction = directionQueue.shift();

    const head = snake[0];
    const next = { x: head.x + direction.x, y: head.y + direction.y };
    if (!inBounds(next)) return lose();

    const eating = apple && same(next, apple);
    const bodyToCheck = eating ? snake : snake.slice(0, -1);
    if (bodyToCheck.some(part => same(part, next))) return lose();

    snake.unshift(next);
    if (eating) {
      playSound(golden ? "gold" : "eat");
      if (golden) return win();
      apple = chooseReachableApple(false);
    } else {
      snake.pop();
    }

    updateEyes();
    updateHud();
    lastStep = timestamp;
  }

  function updateEyes() {
    if (golden) return;
    const occupied = new Set(snake.map(key));
    const nextCoveredEyes = layout.eyes.filter(eye => occupied.has(key(eye))).length;
    if (nextCoveredEyes > coveredEyes) playSound("eye");
    coveredEyes = nextCoveredEyes;
    if (coveredEyes !== EYE_COUNT) return;
    golden = true;
    apple = chooseReachableApple(true);
    if (!apple) win(true);
  }

  function levelPoints() {
    const efficiency = Math.max(0, 200 - (snake.length - layout.minimum) * 12);
    return layout.minimum * 10 + efficiency;
  }

  function win(trapped = false) {
    playSound("win");
    const points = levelPoints();
    score += points;
    saveBestScore();
    state = "levelComplete";
    ui.resultMinimum.textContent = layout.minimum;
    ui.resultLength.textContent = snake.length;
    ui.resultPoints.textContent = points;
    document.querySelector("#levelResult").textContent = trapped
      ? "Solved with nowhere left to go — that still counts."
      : "Minimum solved.";
    showOverlay(ui.levelComplete);
    updateHud();
  }

  function lose() {
    playSound("lose");
    state = "gameOver";
    showOverlay(ui.gameOver);
  }

  function beginLevel(makeNewLayout) {
    if (makeNewLayout || !layout) {
      random = seededRandom(`${challengeSeed}:layout:${level}`);
      layout = generateLayout(level);
    }
    random = seededRandom(`${challengeSeed}:play:${level}`);
    resetSnake();
    state = "playing";
    lastStep = performance.now();
    hideOverlays();
  }

  function nextLevel() {
    level += 1;
    beginLevel(true);
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      pausedAt = performance.now();
      showOverlay(ui.paused);
    } else if (state === "paused") {
      state = "playing";
      lastStep += performance.now() - pausedAt;
      hideOverlays();
    }
  }

  function handlePrimaryAction() {
    if (state === "intro") beginLevel(true);
    else if (state === "playing" || state === "paused") togglePause();
    else if (state === "gameOver") beginLevel(false);
    else if (state === "levelComplete") nextLevel();
  }

  function showOverlay(target) {
    for (const overlay of document.querySelectorAll(".overlay")) overlay.classList.remove("visible");
    target.classList.add("visible");
  }

  function hideOverlays() {
    for (const overlay of document.querySelectorAll(".overlay")) overlay.classList.remove("visible");
  }

  function updateHud() {
    ui.level.textContent = level;
    ui.minimum.textContent = layout ? layout.minimum : "—";
    ui.length.textContent = snake.length || START_LENGTH;
    ui.score.textContent = score;
    board.setAttribute(
      "aria-label",
      `Serpenta board. Level ${level}. Score ${score}. Snake length ${snake.length || START_LENGTH}.`
    );
  }

  function drawCell(cell, color, inset = 0) {
    ctx.fillStyle = color;
    ctx.fillRect(cell.x * CELL + inset, cell.y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
  }

  function drawSprite(image, cell, options = {}) {
    if (!image.complete || !image.naturalWidth) return false;
    const scale = options.scale || 1;
    const size = CELL * scale;
    ctx.save();
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.translate(cell.x * CELL + CELL / 2, cell.y * CELL + CELL / 2);
    ctx.rotate(options.rotation || 0);
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function centerOf(cell) {
    return { x: cell.x * CELL + CELL / 2, y: cell.y * CELL + CELL / 2 };
  }

  function strokeSnakeBody(color, width) {
    if (snake.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const tail = centerOf(snake[snake.length - 1]);
    ctx.moveTo(tail.x, tail.y);
    for (let i = snake.length - 2; i >= 0; i--) {
      const point = centerOf(snake[i]);
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }

  function drawStripe(index) {
    const point = centerOf(snake[index]);
    const towardHead = snake[index - 1];
    const towardTail = snake[index + 1];
    let tangentX = towardHead.x - towardTail.x;
    let tangentY = towardHead.y - towardTail.y;
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;
    tangentX /= tangentLength;
    tangentY /= tangentLength;
    const normalX = -tangentY;
    const normalY = tangentX;
    const halfStripe = index % 3 === 0 ? 12 : 11;

    ctx.strokeStyle = "#070608";
    ctx.lineWidth = index % 2 === 0 ? 9 : 7;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(point.x - normalX * halfStripe, point.y - normalY * halfStripe);
    ctx.lineTo(point.x + normalX * halfStripe, point.y + normalY * halfStripe);
    ctx.stroke();

    ctx.strokeStyle = "rgba(105, 57, 139, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(point.x - normalX * (halfStripe - 1), point.y - normalY * (halfStripe - 1));
    ctx.lineTo(point.x + normalX * (halfStripe - 1), point.y + normalY * (halfStripe - 1));
    ctx.stroke();
  }

  function cornerRotation(towardHead, towardTail) {
    const directions = new Set([
      `${towardHead.x},${towardHead.y}`,
      `${towardTail.x},${towardTail.y}`
    ]);
    if (directions.has("-1,0") && directions.has("0,1")) return 0;
    if (directions.has("-1,0") && directions.has("0,-1")) return Math.PI / 2;
    if (directions.has("1,0") && directions.has("0,-1")) return Math.PI;
    return -Math.PI / 2;
  }

  function drawStripedSnake() {
    if (snake.length < 2) return;

    // A continuous under-pipe keeps the generated tiles connected through every turn.
    strokeSnakeBody("#050405", 33);
    strokeSnakeBody("#5f2388", 29);

    for (let i = snake.length - 2; i >= 1; i--) {
      const current = snake[i];
      const towardHead = {
        x: snake[i - 1].x - current.x,
        y: snake[i - 1].y - current.y
      };
      const towardTail = {
        x: snake[i + 1].x - current.x,
        y: snake[i + 1].y - current.y
      };
      const straight = towardHead.x === -towardTail.x && towardHead.y === -towardTail.y;
      drawSprite(straight ? sprites.snakeStraight : sprites.snakeCorner, current, {
        rotation: straight
          ? (towardHead.y === 0 ? 0 : Math.PI / 2)
          : cornerRotation(towardHead, towardTail),
        scale: straight ? 0.92 : 1.45
      });
    }

    const tail = snake[snake.length - 1];
    const beforeTail = snake[snake.length - 2];
    drawSprite(sprites.snakeTail, tail, {
      rotation: Math.atan2(tail.y - beforeTail.y, tail.x - beforeTail.x),
      scale: 1
    });
    drawSprite(sprites.snakeHead, snake[0], {
      rotation: Math.atan2(direction.y, direction.x),
      scale: 1.18
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        drawCell({ x, y }, (x + y) % 2 ? "#111512" : "#181d19");
      }
    }

    if (layout) {
      const occupied = new Set(snake.map(key));
      for (const eye of layout.eyes) {
        const closed = golden || occupied.has(key(eye));
        const eyeSprite = closed ? sprites.eyeClosed : sprites.eyeOpen;
        if (!drawSprite(eyeSprite, eye, { scale: 1.18, alpha: closed ? 0.82 : 1 })) {
          drawCell(eye, closed ? "#51316f" : "#c2a0ff", 7);
        }
      }
    }

    if (apple) {
      const sprite = apple.golden ? sprites.appleGold : sprites.appleRed;
      if (!drawSprite(sprite, apple, { scale: 1.05 })) {
        drawCell(apple, apple.golden ? "#ffd54a" : "#ff5757", 8);
      }
    }

    if (!snake.length || !snakeRenderer?.draw(snake, direction, CELL)) drawStripedSnake();
  }

  function frame(timestamp) {
    if (state === "playing" && timestamp - lastStep >= STEP_MS) step(timestamp);
    draw();
    requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", event => {
    const keyName = event.key.toLowerCase();
    const controls = {
      arrowleft: DIRECTIONS.LEFT,
      a: DIRECTIONS.LEFT,
      arrowright: DIRECTIONS.RIGHT,
      d: DIRECTIONS.RIGHT,
      arrowup: DIRECTIONS.UP,
      w: DIRECTIONS.UP,
      arrowdown: DIRECTIONS.DOWN,
      s: DIRECTIONS.DOWN
    };

    if (keyName === " " || keyName === "spacebar") {
      event.preventDefault();
      if (!event.repeat) handlePrimaryAction();
      return;
    }
    if (controls[keyName]) {
      event.preventDefault();
      if (!event.repeat) requestDirection(controls[keyName]);
    }
  });

  document.addEventListener("click", event => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "start") beginLevel(true);
    if (action === "resume") togglePause();
    if (action === "retry") beginLevel(false);
    if (action === "next") nextLevel();
    if (action === "pause") togglePause();
    if (action === "sound") toggleSound();
    if (action === "daily") openDailyChallenge();
    if (action === "share") shareChallenge();
  });

  document.addEventListener("pointerdown", event => {
    const control = event.target.closest("[data-direction]");
    if (!control) return;
    event.preventDefault();
    if (requestDirection(DIRECTIONS[control.dataset.direction])) navigator.vibrate?.(8);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") togglePause();
  });

  board.addEventListener("pointerdown", event => {
    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    board.setPointerCapture?.(event.pointerId);
  });

  board.addEventListener("pointerup", event => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) requestDirection(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
    else requestDirection(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
  });

  board.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  // Small read-only hook for deterministic smoke tests and future level tooling.
  window.serpentaV2 = Object.freeze({
    board: { columns: COLS, rows: ROWS },
    renderer: snakeRenderer ? "webgl" : "sprites",
    startDirection: Object.keys(DIRECTIONS).find(name => DIRECTIONS[name] === START_DIRECTION),
    startCells: spawnCells().map(cell => ({ ...cell })),
    challengeSeed,
    maximumMinimum: MAXIMUM_MINIMUM,
    previewTurns(startName, turnNames) {
      const queued = [];
      const start = DIRECTIONS[startName];
      for (const name of turnNames) enqueueDirection(queued, start, DIRECTIONS[name]);
      return queued.map(turn => Object.keys(DIRECTIONS).find(name => DIRECTIONS[name] === turn));
    },
    inspectLevel(levelNumber) {
      const inspectedLevel = Math.max(1, Math.floor(levelNumber));
      random = seededRandom(`${challengeSeed}:layout:${inspectedLevel}`);
      const candidate = generateLayout(inspectedLevel);
      return {
        requested: candidate.requested,
        minimum: candidate.minimum,
        eyes: candidate.eyes.map(eye => ({ ...eye })),
        witnessLength: candidate.path.length,
        witnessIsSimple: new Set(candidate.path.map(key)).size === candidate.path.length
      };
    }
  });

  updateHud();
  updateSoundButton();
  updateChallengeUi();
  requestAnimationFrame(frame);
})();
