(() => {
  "use strict";

  const COLS = 18;
  const ROWS = 11;
  const CELL = 40;
  const STEP_MS = 150;
  const START_LENGTH = 5;
  const EYE_COUNT = 5;
  const START_MINIMUM = 9;
  const LEVEL_INCREMENT = 3;

  const DIRECTIONS = {
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 }
  };

  const board = document.querySelector("#board");
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  board.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const spriteSources = {
    eyeOpen: "assets/eye-open.png",
    eyeClosed: "assets/eye-closed.png",
    appleRed: "assets/apple-red.png",
    appleGold: "assets/apple-gold.png"
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
    levelComplete: document.querySelector("#levelScreen")
  };

  let state = "intro";
  let level = 1;
  let score = 0;
  let layout = null;
  let snake = [];
  let direction = DIRECTIONS.LEFT;
  let pendingDirection = null;
  let apple = null;
  let golden = false;
  let lastStep = 0;
  let pausedAt = 0;
  let swipeStart = null;

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
      const j = Math.floor(Math.random() * (i + 1));
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
    const y = Math.floor(ROWS / 2);
    const headX = Math.floor(COLS / 2) - 2;
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
      x: bounds.left + Math.floor(Math.random() * (bounds.right - bounds.left + 1)),
      y: bounds.top + Math.floor(Math.random() * (bounds.bottom - bounds.top + 1))
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
    direction = DIRECTIONS.LEFT;
    pendingDirection = null;
    golden = false;
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
      return { ...farthest[Math.floor(Math.random() * farthest.length)].cell, golden: true };
    }

    const useful = reachable.filter(entry => entry.distance >= 4);
    const pool = useful.length ? useful : reachable;
    return { ...pool[Math.floor(Math.random() * pool.length)].cell, golden: false };
  }

  function requestDirection(next) {
    if (state !== "playing") return;
    const opposite = next.x === -direction.x && next.y === -direction.y;
    const duplicate = next.x === direction.x && next.y === direction.y;
    if (!opposite && !duplicate) pendingDirection = next;
  }

  function step(timestamp) {
    if (pendingDirection) {
      direction = pendingDirection;
      pendingDirection = null;
    }

    const head = snake[0];
    const next = { x: head.x + direction.x, y: head.y + direction.y };
    if (!inBounds(next)) return lose();

    const eating = apple && same(next, apple);
    const bodyToCheck = eating ? snake : snake.slice(0, -1);
    if (bodyToCheck.some(part => same(part, next))) return lose();

    snake.unshift(next);
    if (eating) {
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
    if (!layout.eyes.every(eye => occupied.has(key(eye)))) return;
    golden = true;
    apple = chooseReachableApple(true);
    if (!apple) win(true);
  }

  function levelPoints() {
    const efficiency = Math.max(0, 200 - (snake.length - layout.minimum) * 12);
    return layout.minimum * 10 + efficiency;
  }

  function win(trapped = false) {
    const points = levelPoints();
    score += points;
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
    state = "gameOver";
    showOverlay(ui.gameOver);
  }

  function beginLevel(makeNewLayout) {
    if (makeNewLayout || !layout) layout = generateLayout(level);
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

  function drawTail() {
    if (snake.length < 2) return;
    const tail = centerOf(snake[snake.length - 1]);
    const neck = centerOf(snake[snake.length - 2]);
    const angle = Math.atan2(tail.y - neck.y, tail.x - neck.x);

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#050405";
    ctx.beginPath();
    ctx.moveTo(-10, -15);
    ctx.quadraticCurveTo(8, -12, 19, 0);
    ctx.quadraticCurveTo(8, 12, -10, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6b398b";
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.quadraticCurveTo(7, -10, 17, 0);
    ctx.quadraticCurveTo(7, 10, -9, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ded3b6";
    ctx.beginPath();
    ctx.moveTo(-9, -9);
    ctx.quadraticCurveTo(6, -8, 15, 0);
    ctx.quadraticCurveTo(6, 8, -9, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#080709";
    ctx.fillRect(-3, -10, 7, 20);
    ctx.restore();
  }

  function drawHead() {
    const head = centerOf(snake[0]);
    const angle = Math.atan2(direction.y, direction.x);

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);

    ctx.fillStyle = "#050405";
    ctx.beginPath();
    ctx.ellipse(2, 0, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b398b";
    ctx.beginPath();
    ctx.ellipse(2, 0, 17, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ded3b6";
    ctx.beginPath();
    ctx.ellipse(3, 0, 15, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#070608";
    ctx.fillRect(-8, -12, 7, 24);
    ctx.fillStyle = "#b9ff56";
    for (const eyeY of [-5, 5]) {
      ctx.beginPath();
      ctx.ellipse(8, eyeY, 3.2, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#151117";
      ctx.fillRect(8, eyeY - 2, 1.2, 4);
      ctx.fillStyle = "#b9ff56";
    }

    ctx.strokeStyle = "#a978ff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(23, 0);
    ctx.lineTo(27, -4);
    ctx.moveTo(23, 0);
    ctx.lineTo(27, 4);
    ctx.stroke();
    ctx.restore();
  }

  function drawStripedSnake() {
    if (snake.length < 2) return;

    strokeSnakeBody("#050405", 31);
    strokeSnakeBody("#6b398b", 27);
    strokeSnakeBody("#ded3b6", 22);
    strokeSnakeBody("rgba(255, 249, 224, 0.58)", 3);
    for (let i = 1; i < snake.length - 1; i++) drawStripe(i);
    drawTail();
    drawHead();
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

    drawStripedSnake();
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
  });

  document.addEventListener("pointerdown", event => {
    const control = event.target.closest("[data-direction]");
    if (!control) return;
    event.preventDefault();
    requestDirection(DIRECTIONS[control.dataset.direction]);
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
    maximumMinimum: MAXIMUM_MINIMUM,
    inspectLevel(levelNumber) {
      const candidate = generateLayout(Math.max(1, Math.floor(levelNumber)));
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
  requestAnimationFrame(frame);
})();
