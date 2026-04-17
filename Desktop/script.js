/* Sitvsset.org — neon lesson + games (no dependencies) */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 1800);
}

/* ---------- Audio (WebAudio beeps) ---------- */
const audioState = {
  enabled: true,
  ctx: null,
  master: null,
};

function ensureAudio() {
  if (!audioState.enabled) return null;
  if (audioState.ctx && audioState.ctx.state !== "closed") return audioState.ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  audioState.ctx = ctx;
  audioState.master = master;
  return ctx;
}

function beep({ type = "sine", freq = 440, dur = 0.09, gain = 0.6, detune = 0, glideTo = null } = {}) {
  const ctx = ensureAudio();
  if (!ctx || !audioState.master) return;
  const t0 = ctx.currentTime;

  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  o.detune.setValueAtTime(detune, t0);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  o.connect(g);
  g.connect(audioState.master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function sfxCorrect() {
  beep({ type: "triangle", freq: 520, glideTo: 920, dur: 0.10, gain: 0.7 });
  setTimeout(() => beep({ type: "sine", freq: 1240, dur: 0.06, gain: 0.5 }), 55);
}
function sfxWrong() {
  beep({ type: "sawtooth", freq: 180, glideTo: 120, dur: 0.14, gain: 0.6, detune: -14 });
  setTimeout(() => beep({ type: "square", freq: 92, dur: 0.08, gain: 0.35, detune: -22 }), 70);
}

function setAudioEnabled(enabled) {
  audioState.enabled = enabled;
  const btn = $("#toggle-audio");
  if (btn) {
    btn.textContent = `Audio: ${enabled ? "ON" : "OFF"}`;
    btn.setAttribute("aria-pressed", enabled ? "true" : "false");
  }
  toast(enabled ? "Audio enabled." : "Audio muted.");
}

/* ---------- Matrix / digital background ---------- */
function startMatrix() {
  const canvas = $("#matrix");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let cols = 0;
  let drops = [];
  let tick = 0;
  const glyphs = "01アカサタナハマヤラワガザダバパキシチニヒミリヰギジヂビピウクスツヌフムユルグズヅブプエケセテネヘメレゲゼデベペオコソトノホモヨロヲゴゾドボポ";

  function resize() {
    dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fontSize = Math.max(12, Math.round(w / 110));
    ctx.font = `${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace"}`;
    cols = Math.floor(w / (fontSize * 0.9));
    drops = Array.from({ length: cols }, () => Math.random() * h);
  }

  function draw() {
    tick++;
    ctx.fillStyle = "rgba(5, 7, 12, 0.08)";
    ctx.fillRect(0, 0, w, h);

    const fontSize = parseFloat(ctx.font) || 14;
    for (let i = 0; i < drops.length; i++) {
      const x = i * (fontSize * 0.85);
      const y = drops[i];
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)];

      const cyan = `rgba(24, 247, 255, ${0.55 + 0.25 * Math.sin((tick + i) * 0.03)})`;
      const purple = `rgba(165, 91, 255, ${0.35 + 0.25 * Math.cos((tick + i) * 0.028)})`;
      ctx.fillStyle = tick % 7 === 0 ? purple : cyan;
      ctx.fillText(ch, x, y);

      drops[i] += (fontSize * (1.1 + (i % 9) * 0.02));
      if (drops[i] > h + 40 && Math.random() > 0.985) drops[i] = -20;
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  draw();
}

/* ---------- Shared question bank ---------- */
const BANK = [
  { text: "Please ___ down for a moment.", a: "sit", why: "No object: a person takes a seat." },
  { text: "___ the glass on the counter.", a: "set", why: "Object: the glass is being placed." },
  { text: "The cat ___ on the windowsill.", a: "sat", why: "Past of sit: no object." },
  { text: "She ___ the backpack next to the door.", a: "set", why: "Object: the backpack is placed." },
  { text: "Let’s ___ a timer for 10 minutes.", a: "set", why: "Set an abstract thing: timer/alarm." },
  { text: "He told us to ___ quietly.", a: "sit", why: "Action of being seated." },
  { text: "The house ___ on a hill overlooking the sea.", a: "sits", why: "Idiomatic: be located." },
  { text: "___ the rules before the match starts.", a: "set", why: "Establish rules." },
  { text: "Please ___ your phone on silent.", a: "set", why: "Set = adjust/arrange." },
  { text: "We ___ the books on the shelf.", a: "set", why: "Object: books being placed." },
  { text: "They asked everyone to ___ in the front row.", a: "sit", why: "People take seats." },
  { text: "___ the box down carefully.", a: "set", why: "Object: the box is placed." },
  { text: "The dog ___ by the door waiting.", a: "sat", why: "Past of sit: no object." },
  { text: "I’ll ___ my keys right here.", a: "set", why: "Object: keys." },
  { text: "We ___ a goal for this week.", a: "set", why: "Set a goal (abstract object)." },
  { text: "Please ___ at this table.", a: "sit", why: "Seated position." },
  { text: "He ___ the candle on the table.", a: "set", why: "Object: the candle." },
  { text: "The meeting is ___ for 3 PM.", a: "set", why: "Set = scheduled." },
  { text: "The bird ___ on the branch.", a: "sat", why: "Past of sit." },
  { text: "___ the controller back on the dock.", a: "set", why: "Object: controller." },
];

function normalizeAnswer(word) {
  if (!word) return "";
  const w = String(word).trim().toLowerCase();
  if (w === "sit" || w === "sat" || w === "sits") return "sit";
  if (w === "set" || w === "sets") return "set";
  return w;
}

/* ---------- Hero interactions ---------- */
function wireHero() {
  const enter = $("#enter-challenge");
  if (!enter) return;
  enter.addEventListener("click", () => {
    ensureAudio();
    toast("Challenge accepted. Deploying to arena…");
    const target = $("#speed-quiz");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    beep({ type: "sine", freq: 420, glideTo: 740, dur: 0.12, gain: 0.45 });
  });
}

/* ---------- Speed Quiz ---------- */
function wireSpeedQuiz() {
  const elPrompt = $("#quiz-prompt");
  const elTime = $("#quiz-time");
  const elStreak = $("#quiz-streak");
  const elScore = $("#quiz-score");
  const elFeedback = $("#quiz-feedback");
  const btnSit = $("#btn-sit");
  const btnSet = $("#btn-set");
  const btnStart = $("#quiz-start");
  const btnReset = $("#quiz-reset");
  const btnDiff = $("#quiz-difficulty");
  const elDiffLabel = $("#quiz-difficulty-label");

  if (!elPrompt || !elTime || !elStreak || !elScore || !elFeedback || !btnSit || !btnSet || !btnStart || !btnReset || !btnDiff || !elDiffLabel) return;

  const DIFFS = [
    { name: "Normal", seconds: 4.0, score: 10, missPenalty: 7 },
    { name: "Hard", seconds: 2.8, score: 14, missPenalty: 9 },
    { name: "Insane", seconds: 1.9, score: 18, missPenalty: 12 },
  ];
  let diffIdx = 0;

  let running = false;
  let round = null;
  let tLeft = 0;
  let timerId = null;
  let score = 0;
  let streak = 0;

  function setFeedback(ok, msg) {
    elFeedback.innerHTML = ok
      ? `<span style="color: var(--good)"><strong>+HIT</strong></span> ${msg}`
      : `<span style="color: var(--bad)"><strong>MISS</strong></span> ${msg}`;
  }

  function updateHud() {
    elTime.textContent = tLeft.toFixed(1);
    elScore.textContent = String(score);
    elStreak.textContent = String(streak);
  }

  function newRound() {
    const q = shuffle(BANK)[0];
    const answer = normalizeAnswer(q.a);
    const expects = answer === "sit" ? "SIT" : "SET";
    const clue = q.text;
    round = { clue, answer, expects, why: q.why };
    elPrompt.textContent = clue.replace("___", "____");
    tLeft = DIFFS[diffIdx].seconds;
    updateHud();
    setFeedback(true, `New target locked: choose <strong>${expects}</strong>.`);
  }

  function endRun() {
    running = false;
    clearInterval(timerId);
    timerId = null;
    btnStart.textContent = "Start";
    setFeedback(true, `Run ended. Final score: <strong>${score}</strong>.`);
    toast(`Speed Quiz ended — score ${score}.`);
  }

  function tick() {
    if (!running) return;
    tLeft = Math.max(0, tLeft - 0.1);
    updateHud();
    if (tLeft <= 0.0001) {
      streak = 0;
      score = Math.max(0, score - DIFFS[diffIdx].missPenalty);
      updateHud();
      sfxWrong();
      setFeedback(false, `Time’s up. Tip: ${round?.why ?? "Look for the object."}`);
      newRound();
    }
  }

  function answer(choice) {
    if (!running || !round) return;
    const picked = choice;
    const ok = picked === round.answer;

    if (ok) {
      streak += 1;
      score += DIFFS[diffIdx].score + Math.floor(streak / 4) * 2;
      sfxCorrect();
      setFeedback(true, `${round.why} <span class="mono faint">(${round.expects})</span>`);
    } else {
      streak = 0;
      score = Math.max(0, score - DIFFS[diffIdx].missPenalty);
      sfxWrong();
      setFeedback(false, `Correct was <strong>${round.expects}</strong>. ${round.why}`);
    }

    updateHud();
    newRound();
  }

  function resetAll() {
    running = false;
    clearInterval(timerId);
    timerId = null;
    score = 0;
    streak = 0;
    tLeft = 0;
    round = null;
    btnStart.textContent = "Start";
    elPrompt.textContent = "Press Start.";
    elFeedback.textContent = "";
    updateHud();
    toast("Speed Quiz reset.");
  }

  btnStart.addEventListener("click", () => {
    ensureAudio();
    if (running) {
      endRun();
      return;
    }
    running = true;
    btnStart.textContent = "Stop";
    if (!round) newRound();
    if (!timerId) timerId = setInterval(tick, 100);
    toast(`Speed Quiz started — ${DIFFS[diffIdx].name}.`);
    beep({ type: "triangle", freq: 340, glideTo: 680, dur: 0.10, gain: 0.35 });
  });

  btnReset.addEventListener("click", resetAll);
  btnSit.addEventListener("click", () => answer("sit"));
  btnSet.addEventListener("click", () => answer("set"));

  btnDiff.addEventListener("click", () => {
    diffIdx = (diffIdx + 1) % DIFFS.length;
    elDiffLabel.textContent = DIFFS[diffIdx].name;
    toast(`Difficulty set to ${DIFFS[diffIdx].name}.`);
    beep({ type: "sine", freq: 560, glideTo: 740, dur: 0.08, gain: 0.28 });
    if (running) {
      tLeft = DIFFS[diffIdx].seconds;
      updateHud();
    }
  });

  // Keyboard: S = sit, D = set
  window.addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key.toLowerCase() === "s") answer("sit");
    if (e.key.toLowerCase() === "d") answer("set");
  });

  resetAll();
}

/* ---------- Drag-and-Drop battle ---------- */
function wireDragBattle() {
  const deck = $("#dd-deck");
  const laneSit = $("#lane-sit");
  const laneSet = $("#lane-set");
  const elCombo = $("#dd-combo");
  const elCorrect = $("#dd-correct");
  const elWrong = $("#dd-wrong");
  const elFeedback = $("#dd-feedback");
  const btnReshuffle = $("#dd-reshuffle");
  if (!deck || !laneSit || !laneSet || !elCombo || !elCorrect || !elWrong || !elFeedback || !btnReshuffle) return;

  let combo = 0;
  let correct = 0;
  let wrong = 0;
  let activeId = null;
  let cards = [];

  function setFeedback(ok, msg) {
    elFeedback.innerHTML = ok
      ? `<span style="color: var(--good)"><strong>COMBO</strong></span> ${msg}`
      : `<span style="color: var(--bad)"><strong>BREAK</strong></span> ${msg}`;
  }

  function updateHud() {
    elCombo.textContent = String(combo);
    elCorrect.textContent = String(correct);
    elWrong.textContent = String(wrong);
  }

  function makeCard(item, idx) {
    const id = `${Date.now()}-${idx}-${Math.random().toString(16).slice(2)}`;
    const el = document.createElement("div");
    el.className = "card";
    el.setAttribute("draggable", "true");
    el.dataset.id = id;
    el.dataset.answer = item.answer;
    el.innerHTML = `<div class="card__tag">DRAG CARD</div><div class="card__text">${item.text}</div>`;

    el.addEventListener("dragstart", (e) => {
      activeId = id;
      el.classList.add("is-dim");
      e.dataTransfer?.setData("text/plain", id);
      e.dataTransfer?.setDragImage(el, 18, 18);
      ensureAudio();
      beep({ type: "sine", freq: 420, dur: 0.04, gain: 0.18 });
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("is-dim");
      activeId = null;
    });
    return { id, el, answer: item.answer, text: item.text, why: item.why };
  }

  function clearLanes() {
    for (const lane of [laneSit, laneSet]) {
      $$(".card", lane).forEach((c) => c.remove());
      const ph = $(".lane__placeholder", lane);
      if (!ph) {
        const p = document.createElement("div");
        p.className = "lane__placeholder";
        p.textContent = lane === laneSit ? "Drop SIT phrases here" : "Drop SET phrases here";
        lane.appendChild(p);
      } else {
        ph.style.display = "";
      }
    }
  }

  function rebuildDeck() {
    deck.innerHTML = "";
    const pool = shuffle(BANK)
      .slice(0, 10)
      .map((q) => ({
        text: q.text.replace("___", `<span class="mono faint">[verb]</span>`),
        answer: normalizeAnswer(q.a),
        why: q.why,
      }));
    cards = pool.map((it, idx) => makeCard(it, idx));
    cards.forEach((c) => deck.appendChild(c.el));
  }

  function reshuffleAll() {
    combo = 0;
    correct = 0;
    wrong = 0;
    updateHud();
    clearLanes();
    rebuildDeck();
    elFeedback.textContent = "";
    toast("Deck reshuffled.");
    beep({ type: "triangle", freq: 620, glideTo: 820, dur: 0.08, gain: 0.26 });
  }

  function findCardById(id) {
    return cards.find((c) => c.id === id) || null;
  }

  function tryDrop(laneAnswer, id) {
    const c = findCardById(id);
    if (!c) return;
    const ok = c.answer === laneAnswer;

    if (ok) {
      combo += 1;
      correct += 1;
      sfxCorrect();
      setFeedback(true, `${c.why} <span class="mono faint">(placed in ${laneAnswer.toUpperCase()})</span>`);
      const lane = laneAnswer === "sit" ? laneSit : laneSet;
      $(".lane__placeholder", lane)?.setAttribute("style", "display:none");
      lane.appendChild(c.el);
      c.el.setAttribute("draggable", "false");
      c.el.style.cursor = "default";
      c.el.style.opacity = "0.95";
    } else {
      combo = 0;
      wrong += 1;
      sfxWrong();
      setFeedback(false, `That card belongs to <strong>${c.answer.toUpperCase()}</strong>. ${c.why}`);
    }

    updateHud();
  }

  function wireLane(laneEl, laneAnswer) {
    laneEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      laneEl.parentElement?.classList.add("is-over");
    });
    laneEl.addEventListener("dragleave", () => {
      laneEl.parentElement?.classList.remove("is-over");
    });
    laneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      laneEl.parentElement?.classList.remove("is-over");
      const id = e.dataTransfer?.getData("text/plain") || activeId;
      if (!id) return;
      ensureAudio();
      tryDrop(laneAnswer, id);
    });
  }

  wireLane(laneSit, "sit");
  wireLane(laneSet, "set");
  btnReshuffle.addEventListener("click", reshuffleAll);
  reshuffleAll();
}

/* ---------- Boss fight (12 rounds) ---------- */
function wireBossFight() {
  const elPrompt = $("#boss-prompt");
  const elFeedback = $("#boss-feedback");
  const elRound = $("#boss-round");
  const elHits = $("#boss-hits");
  const elFails = $("#boss-fails");
  const elShield = $("#boss-shield");
  const elShieldFill = $("#boss-shield-fill");
  const btnStart = $("#boss-start");
  const btnReset = $("#boss-reset");
  const btnSit = $("#boss-sit");
  const btnSet = $("#boss-set");
  if (!elPrompt || !elFeedback || !elRound || !elHits || !elFails || !elShield || !elShieldFill || !btnStart || !btnReset || !btnSit || !btnSet) return;

  const TOTAL = 12;
  let running = false;
  let pool = [];
  let idx = 0;
  let hits = 0;
  let fails = 0;
  let shield = 100;
  let current = null;

  function updateHud() {
    elRound.textContent = String(idx);
    elHits.textContent = String(hits);
    elFails.textContent = String(fails);
    elShield.textContent = String(shield);
    elShieldFill.style.width = `${shield}%`;
  }

  function setFeedback(ok, msg) {
    elFeedback.innerHTML = ok
      ? `<span style="color: var(--good)"><strong>HIT</strong></span> ${msg}`
      : `<span style="color: var(--bad)"><strong>FAIL</strong></span> ${msg}`;
  }

  function loadRound() {
    current = pool[idx - 1];
    if (!current) return;
    elPrompt.textContent = current.text.replace("___", "____");
    setFeedback(true, "Choose quickly. Your shield depends on it.");
    updateHud();
  }

  function endBoss(win) {
    running = false;
    btnStart.textContent = "Start Boss Fight";
    if (win) {
      setFeedback(true, `Boss defeated. Final shield: <strong>${shield}%</strong>.`);
      toast("Boss defeated.");
      beep({ type: "triangle", freq: 520, glideTo: 1040, dur: 0.16, gain: 0.45 });
      setTimeout(() => beep({ type: "sine", freq: 1320, dur: 0.10, gain: 0.35 }), 120);
    } else {
      setFeedback(false, `You were defeated. Final hits: <strong>${hits}</strong>. Try again.`);
      toast("Boss fight failed. Rebooting…");
      beep({ type: "sawtooth", freq: 220, glideTo: 110, dur: 0.22, gain: 0.45 });
    }
  }

  function answer(choice) {
    if (!running || !current) return;
    const correctAns = normalizeAnswer(current.a);
    const ok = choice === correctAns;
    if (ok) {
      hits += 1;
      sfxCorrect();
      setFeedback(true, `${current.why} <span class="mono faint">(round cleared)</span>`);
    } else {
      fails += 1;
      shield = clamp(shield - 18, 0, 100);
      sfxWrong();
      setFeedback(false, `Correct was <strong>${correctAns.toUpperCase()}</strong>. ${current.why}`);
    }

    if (shield <= 0) {
      updateHud();
      endBoss(false);
      return;
    }

    if (idx >= TOTAL) {
      idx = TOTAL;
      updateHud();
      endBoss(true);
      return;
    }

    idx += 1;
    loadRound();
  }

  function startBoss() {
    ensureAudio();
    pool = shuffle(BANK).slice(0, TOTAL);
    idx = 1;
    hits = 0;
    fails = 0;
    shield = 100;
    running = true;
    btnStart.textContent = "Abort";
    loadRound();
    toast("Boss fight started. 12 rounds.");
    beep({ type: "triangle", freq: 360, glideTo: 720, dur: 0.12, gain: 0.35 });
  }

  function resetBoss() {
    running = false;
    pool = [];
    idx = 0;
    hits = 0;
    fails = 0;
    shield = 100;
    current = null;
    btnStart.textContent = "Start Boss Fight";
    elPrompt.textContent = "Press Start.";
    elFeedback.textContent = "";
    updateHud();
    toast("Boss fight reset.");
  }

  btnStart.addEventListener("click", () => {
    if (running) {
      resetBoss();
      return;
    }
    startBoss();
  });
  btnReset.addEventListener("click", resetBoss);
  btnSit.addEventListener("click", () => answer("sit"));
  btnSet.addEventListener("click", () => answer("set"));

  // Keyboard: J = sit, K = set (different from speed quiz)
  window.addEventListener("keydown", (e) => {
    if (!running) return;
    const k = e.key.toLowerCase();
    if (k === "j") answer("sit");
    if (k === "k") answer("set");
  });

  resetBoss();
}

/* ---------- Global wiring ---------- */
function wireAudioToggle() {
  const btn = $("#toggle-audio");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    // Attempt to resume ctx on user gesture when enabling.
    const next = !audioState.enabled;
    setAudioEnabled(next);
    if (next) {
      const ctx = ensureAudio();
      if (ctx && ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          // ignore
        }
      }
      beep({ type: "sine", freq: 520, glideTo: 840, dur: 0.08, gain: 0.28 });
    }
  });
  setAudioEnabled(true);
}

function primeAudioOnFirstGesture() {
  const handler = async () => {
    const ctx = ensureAudio();
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler, { once: true, passive: true });
  window.addEventListener("keydown", handler, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  startMatrix();
  wireAudioToggle();
  primeAudioOnFirstGesture();
  wireHero();
  wireSpeedQuiz();
  wireDragBattle();
  wireBossFight();

  // Smooth nav scroll
  $$(".topbar__nav a").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      beep({ type: "sine", freq: 460, dur: 0.04, gain: 0.16 });
    });
  });
});
