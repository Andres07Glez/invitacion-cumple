// ============================================================
//  CONFIRMED.JS — lógica de confirmed.html
// ============================================================

(function () {
  "use strict";

  document.getElementById("party-name").textContent = PARTY_DETAILS.nombreFestejado + "'s birthday";

  let supabase = null;
  try {
    if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes("TU_SUPABASE")) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.warn("Supabase no inicializado:", e);
  }

  const listEl = document.getElementById("guest-list");

  // slug -> { nombre, timestamp }
  const confirmedBySlug = new Map();

  function relativeTime(isoString) {
    const then = new Date(isoString).getTime();
    const now = Date.now();
    const diffMs = Math.max(now - then, 0);
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "hace " + sec + "s";
    const min = Math.floor(sec / 60);
    if (min < 60) return "hace " + min + " min";
    const hr = Math.floor(min / 60);
    if (hr < 24) return "hace " + hr + "h";
    const day = Math.floor(hr / 24);
    return "hace " + day + "d";
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function render() {
    listEl.innerHTML = "";

    // Solo se muestran los que ya confirmaron (por privacidad no se expone
    // quién falta por responder). GUEST_LIST se usa únicamente para
    // ignorar cualquier slug que no corresponda a un invitado real.
    const rows = [];
    confirmedBySlug.forEach((info, slug) => {
      if (!GUEST_LIST[slug]) return; // slug desconocido, se ignora
      rows.push({ nombre: info.nombre, timestamp: info.timestamp });
    });

    rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (rows.length === 0) {
      listEl.innerHTML =
        '<div class="guest-row"><span class="guest-name">Nadie ha confirmado todavía...</span></div>';
      return;
    }

    rows.forEach((row) => {
      const div = document.createElement("div");
      div.className = "guest-row confirmed";
      div.innerHTML =
        '<span class="guest-name">' + escapeHtml(row.nombre) + "</span>" +
        '<span class="guest-time">' + relativeTime(row.timestamp) + "</span>";
      listEl.appendChild(div);
    });
  }

  async function loadInitial() {
    if (!supabase) {
      listEl.innerHTML = '<div class="guest-row"><span class="guest-name">⚠ Supabase no configurado (revisa config.js)</span></div>';
      return;
    }
    const { data, error } = await supabase
      .from("confirmados")
      .select("slug, nombre, timestamp")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error cargando confirmados:", error);
      listEl.innerHTML = '<div class="guest-row"><span class="guest-name">⚠ error al cargar la lista</span></div>';
      return;
    }
    (data || []).forEach((row) => {
      confirmedBySlug.set(row.slug, { nombre: row.nombre, timestamp: row.timestamp });
    });
    render();
  }

  function subscribeRealtime() {
    if (!supabase) return;
    supabase
      .channel("confirmados-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confirmados" },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          confirmedBySlug.set(row.slug, { nombre: row.nombre, timestamp: row.timestamp });
          render();
        }
      )
      .subscribe();
  }

  loadInitial();
  subscribeRealtime();

  // refresca los tiempos relativos cada 30s
  setInterval(render, 30000);
})();
