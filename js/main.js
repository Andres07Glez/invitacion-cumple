// ============================================================
//  MAIN.JS — lógica de index.html
// ============================================================

(function () {
  "use strict";

  // ---------- Supabase client ----------
  let supabase = null;
  try {
    if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes("TU_SUPABASE")) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.warn("Supabase no inicializado:", e);
  }

  // ---------- Audio (Web Audio API, sin archivos externos) ----------
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function beep(freq, duration, type, volume) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq || 440;
      gain.gain.setValueAtTime(volume || 0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (duration || 0.08));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (duration || 0.08));
    } catch (e) {}
  }

  // ---------- Vibración (solo celulares compatibles) ----------
  function vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
  }

  // ---------- Fullscreen agresivo (requiere gesto del usuario) ----------
  function requestFullscreenSafe() {
    try {
      const el = document.documentElement;
      const req =
        el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (!req) return;
      const result = req.call(el);
      if (result && result.catch) {
        result.catch((e) => {
          // Falla comúnmente si la página está embebida en un iframe sin
          // el atributo allow="fullscreen" (p.ej. previsualizadores) — en
          // una pestaña normal del navegador esto no debería pasar.
          console.warn("No se pudo entrar en fullscreen:", e && e.message);
        });
      }
    } catch (e) {}
  }

  // Pide pantalla completa desde la PRIMERA interacción posible del
  // usuario. Los navegadores nunca permiten fullscreen sin un gesto real
  // (no se puede disparar solo al cargar la página), así que reintenta en
  // cada click/tecla/touch hasta que realmente entre en fullscreen, en vez
  // de intentarlo una sola vez y rendirse si esa primera llamada falla.
  const FS_EVENTS = ["pointerdown", "click", "keydown", "touchstart"];
  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
  }
  function attemptFullscreenOnInteraction() {
    if (isFullscreen()) {
      stopTryingFullscreen();
      return;
    }
    requestFullscreenSafe();
  }
  function stopTryingFullscreen() {
    FS_EVENTS.forEach((evt) =>
      window.removeEventListener(evt, attemptFullscreenOnInteraction, true)
    );
    document.removeEventListener("fullscreenchange", stopTryingFullscreen);
  }
  FS_EVENTS.forEach((evt) => {
    window.addEventListener(evt, attemptFullscreenOnInteraction, { capture: true });
  });
  document.addEventListener("fullscreenchange", stopTryingFullscreen);

  // ---------- Screens ----------
  const screenSegfault = document.getElementById("screen-segfault");
  const screenName = document.getElementById("screen-name");
  const screenAchievement = document.getElementById("screen-achievement");
  const screenInvalid = document.getElementById("screen-invalid");

  function showScreen(el) {
    [screenSegfault, screenName, screenAchievement, screenInvalid].forEach((s) =>
      s.classList.add("hidden")
    );
    el.classList.remove("hidden");
  }

  // ---------- Identidad del invitado (resuelta por link, sin input) ----------
  // El link personal es tusitio.com/?g=<slug>. El slug se cruza contra
  // GUEST_LIST (definido en config.js) para saber quién es, sin pedirle
  // que escriba ni elija su nombre — así se evitan typos y que alguien
  // confirme "por" otra persona tecleando su nombre.
  const urlParams = new URLSearchParams(window.location.search);
  const guestSlug = (urlParams.get("g") || "").trim().toLowerCase();
  const guestName = GUEST_LIST && GUEST_LIST[guestSlug] ? GUEST_LIST[guestSlug] : null;

  if (!guestName) {
    showScreen(screenInvalid);
    return; // no hay invitado válido: no se activa el resto de la página
  }

  document.getElementById("guest-name-display").textContent = guestName;

  // ---------- Buttons ----------
  document.getElementById("btn-si").addEventListener("click", () => {
    requestFullscreenSafe();
    showScreen(screenName);
  });

  document.getElementById("btn-talvez").addEventListener("click", () => {
    requestFullscreenSafe();
    runChaosSequence();
  });

  // ============================================================
  //  CHAOS SEQUENCE (botón TALVEZ)
  // ============================================================
  const FAKE_CMD_LINES = [
    "C:\\SYSTEM32> iniciando protocolo de persuasión...",
    "descargando dudas.exe [##########] 100%",
    "C:\\> buscando excusas.dll",
    "ADVERTENCIA: nivel de flojera crítico detectado",
    "C:\\> formateando indecisión...",
    "inyectando FOMO.sys en proceso activo",
    "C:\\SYSTEM32> escaneo completo: 0 excusas válidas encontradas",
    "C:\\> ejecutando presion_social.bat",
    "ERROR 404: salida no encontrada",
    "C:\\> ya casi... solo faltan unos segundos",
  ];

  function runChaosSequence() {
    document.getElementById("btn-talvez").disabled = true;
    document.getElementById("btn-si").disabled = true;

    const chaosLayer = document.getElementById("chaos-layer");
    chaosLayer.innerHTML = "";
    let popupCount = 0;
    const maxPopups = 15;

    vibrate([60, 40, 60]);

    const popupInterval = setInterval(() => {
      spawnFakeCmd(chaosLayer);
      beep(180 + Math.random() * 500, 0.06, "square", 0.05);
      popupCount++;
      if (popupCount >= maxPopups) {
        clearInterval(popupInterval);
        setTimeout(() => spawnFakeScan(chaosLayer), 400);
      }
    }, 280);
  }

  function typeInto(el, text, speedMs, onDone) {
    let i = 0;
    el.textContent = "";
    const cursor = document.createElement("span");
    cursor.className = "blink";
    cursor.textContent = "_";

    const interval = setInterval(() => {
      el.textContent = text.slice(0, i);
      el.appendChild(cursor);
      i++;
      if (i > text.length) {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, speedMs);
  }

  function spawnFakeCmd(container) {
    const box = document.createElement("div");
    box.className = "fake-cmd";
    const maxX = Math.max(window.innerWidth - 360, 20);
    const maxY = Math.max(window.innerHeight - 160, 20);
    box.style.left = Math.floor(Math.random() * maxX) + "px";
    box.style.top = Math.floor(Math.random() * maxY) + "px";

    box.innerHTML =
      '<div class="cmd-titlebar"><span>C:\\WINDOWS\\system32\\cmd.exe</span><span>—□×</span></div>' +
      '<div class="cmd-body"></div>';

    container.appendChild(box);

    const line = FAKE_CMD_LINES[Math.floor(Math.random() * FAKE_CMD_LINES.length)];
    typeInto(box.querySelector(".cmd-body"), line, 22);
  }

  // ---------- Falso escaneo "Windows Defender" ----------
  function spawnFakeScan(container) {
    const box = document.createElement("div");
    box.className = "fake-scan";
    box.innerHTML =
      '<div class="cmd-titlebar"><span>Windows Defender — Análisis en tiempo real</span><span>—□×</span></div>' +
      '<div class="scan-body">' +
      '  <div class="scan-status" id="scan-status">Analizando archivos del sistema...</div>' +
      '  <div class="scan-bar"><div class="scan-bar-fill" id="scan-bar-fill"></div></div>' +
      '  <div class="scan-pct" id="scan-pct">0%</div>' +
      "</div>";
    container.appendChild(box);

    const fill = box.querySelector("#scan-bar-fill");
    const pct = box.querySelector("#scan-pct");
    const status = box.querySelector("#scan-status");

    let progress = 0;
    const duration = 1900;
    const start = performance.now();

    function tick(now) {
      progress = Math.min((now - start) / duration, 1);
      const pctVal = Math.floor(progress * 100);
      fill.style.width = pctVal + "%";
      pct.textContent = pctVal + "%";
      if (pctVal % 17 === 0) beep(300 + pctVal * 3, 0.03, "square", 0.03);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        fill.classList.add("threat");
        status.textContent = "⚠ AMENAZA DETECTADA: fiesta_sorpresa.exe";
        status.classList.add("threat-text");
        beep(120, 0.35, "sawtooth", 0.08);
        vibrate([150, 80, 150, 80, 150]);
        setTimeout(showGorilla, 900);
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- Manada de gorilas persiguiendo el cursor ----------
  const MAX_GORILLAS = 18;
  let gorillaChaseHandle = null; // { rafId, onMove, onTouch }

  // Punto aleatorio sobre la orilla de la pantalla (arriba/derecha/abajo/izquierda)
  function randomEdgePoint() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) return { x: Math.random() * w, y: -70 }; // arriba
    if (edge === 1) return { x: w + 70, y: Math.random() * h }; // derecha
    if (edge === 2) return { x: Math.random() * w, y: h + 70 }; // abajo
    return { x: -70, y: Math.random() * h }; // izquierda
  }

  function createGorillaEl() {
    const el = document.createElement("div");
    el.className = "gorilla-chaser";
    el.innerHTML =
      '<img src="assets/gorilla.png" alt="" ' +
      'onerror="this.style.display=\'none\'; this.nextElementSibling.classList.remove(\'hidden\');" />' +
      '<div class="gorilla-fallback hidden">🦍</div>';

    const spawn = randomEdgePoint();
    el.dataset.x = spawn.x;
    el.dataset.y = spawn.y;

    // pequeño "revoloteo" propio alrededor del cursor una vez que llegan,
    // y una velocidad de acercamiento lenta y ligeramente distinta por mono
    el.dataset.angle = Math.random() * Math.PI * 2;
    el.dataset.hoverRadius = 25 + Math.random() * 50;
    el.dataset.speed = 0.008 + Math.random() * 0.01; // lento: "poco a poco"
    return el;
  }

  function showGorilla() {
    document.getElementById("chaos-layer").innerHTML = "";

    const layer = document.getElementById("gorilla-layer");
    layer.innerHTML = "";

    vibrate([100, 50, 100]);
    beep(90, 0.4, "sawtooth", 0.06);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    function onMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    function onTouch(e) {
      if (e.touches && e.touches[0]) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch);

    // cada mono parte de su punto en la orilla y se acerca lentamente al
    // cursor; una vez cerca, revolotea suavemente a su alrededor en vez
    // de quedarse pegado en un punto fijo
    function chaseLoop() {
      const t = performance.now() / 1000;
      layer.querySelectorAll(".gorilla-chaser").forEach((el) => {
        const angle = parseFloat(el.dataset.angle) + t * 0.4;
        const hoverRadius = parseFloat(el.dataset.hoverRadius);
        const targetX = mouseX + Math.cos(angle) * hoverRadius;
        const targetY = mouseY + Math.sin(angle) * hoverRadius;
        const speed = parseFloat(el.dataset.speed);

        let x = parseFloat(el.dataset.x);
        let y = parseFloat(el.dataset.y);
        x += (targetX - x) * speed;
        y += (targetY - y) * speed;
        el.dataset.x = x;
        el.dataset.y = y;
        el.style.transform = "translate(" + (x - 55) + "px, " + (y - 55) + "px)";
      });
      gorillaChaseHandle.rafId = requestAnimationFrame(chaseLoop);
    }

    gorillaChaseHandle = { rafId: null, onMove, onTouch };
    gorillaChaseHandle.rafId = requestAnimationFrame(chaseLoop);

    // agrega gorilas progresivamente hasta llegar a MAX_GORILLAS, cada uno
    // apareciendo en una orilla distinta de la pantalla
    let count = 0;
    const spawnInterval = setInterval(() => {
      count++;
      layer.appendChild(createGorillaEl());
      beep(150 + count * 25, 0.05, "square", 0.04);
      vibrate([40]);
      if (count >= MAX_GORILLAS) {
        clearInterval(spawnInterval);
        setTimeout(showAcceptButton, 3500);
      }
    }, 350);
  }

  function stopGorillaChase() {
    if (!gorillaChaseHandle) return;
    cancelAnimationFrame(gorillaChaseHandle.rafId);
    window.removeEventListener("mousemove", gorillaChaseHandle.onMove);
    window.removeEventListener("touchmove", gorillaChaseHandle.onTouch);
    document.getElementById("gorilla-layer").innerHTML = "";
    gorillaChaseHandle = null;
  }

  function showAcceptButton() {
    const box = document.querySelector(".segfault-box");
    const acceptRow = document.createElement("div");
    acceptRow.className = "btn-row";
    acceptRow.innerHTML = '<button id="btn-aceptar" class="term-btn accent">[ ACEPTAR ]</button>';
    box.appendChild(acceptRow);

    document.getElementById("btn-aceptar").addEventListener("click", () => {
      stopGorillaChase();
      showScreen(screenName);
    });
  }

  // ============================================================
  //  CONFIRMACIÓN DE ASISTENCIA (identidad ya resuelta por el link)
  // ============================================================
  document.getElementById("btn-confirm-name").addEventListener("click", handleConfirm);

  async function handleConfirm() {
    const errorEl = document.getElementById("name-error");
    const btn = document.getElementById("btn-confirm-name");

    errorEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "[ PROCESANDO... ]";

    const timestamp = new Date().toISOString();

    // ---- Guardar en Supabase ----
    // upsert por slug: si el mismo link se abre más de una vez, solo
    // actualiza el timestamp en vez de crear entradas duplicadas.
    let dbOk = true;
    if (supabase) {
      try {
        const { error } = await supabase
          .from("confirmados")
          .upsert([{ slug: guestSlug, nombre: guestName, timestamp }], { onConflict: "slug" });
        if (error) {
          console.error("Error de Supabase:", error);
          dbOk = false;
        }
      } catch (e) {
        console.error("Excepción al guardar en Supabase:", e);
        dbOk = false;
      }
    } else {
      console.warn("Supabase no configurado — saltando guardado en base de datos.");
      dbOk = false;
    }

    if (!dbOk) {
      btn.disabled = false;
      btn.textContent = "[ CONFIRMAR ]";
      errorEl.textContent = "> ⚠ no se pudo guardar tu confirmación (revisa config.js / conexión)";
      errorEl.classList.remove("hidden");
      return;
    }

    showAchievement();
  }

  function showAchievement() {
    document.getElementById("detail-fecha").textContent = PARTY_DETAILS.fecha;
    document.getElementById("detail-lugar").textContent = PARTY_DETAILS.lugar;
    document.getElementById("detail-llevar").textContent = PARTY_DETAILS.queLlevar;
    document.getElementById("detail-extra").textContent = PARTY_DETAILS.mensajeExtra;
    document.getElementById("save-status").textContent = "> ✔ confirmación guardada";

    showScreen(screenAchievement);
    launchConfetti();
    playAchievementSound();
  }

  // ============================================================
  //  CONFETTI (canvas vanilla)
  // ============================================================
  function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#39ff14", "#ff2bd6", "#00fff2", "#f4ff2b", "#ff2b2b"];
    const pieces = [];
    const count = 160;

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: 2 + Math.random() * 3,
        speedX: -1.5 + Math.random() * 3,
        rotation: Math.random() * 360,
        rotationSpeed: -6 + Math.random() * 12,
      });
    }

    let running = true;
    const duration = 6000;
    const startTime = performance.now();

    function frame(now) {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (now - startTime < duration) {
        requestAnimationFrame(frame);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(frame);

    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  // ============================================================
  //  SONIDO 8-BIT (generado con Web Audio API, sin archivos externos)
  // ============================================================
  function playAchievementSound() {
    try {
      const ctx = getAudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      let t = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        t += 0.14;
      });
    } catch (e) {
      console.warn("No se pudo reproducir sonido:", e);
    }
  }
})();
