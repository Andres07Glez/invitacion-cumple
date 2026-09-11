// ============================================================
//  CONFIG.JS — Edita este archivo para personalizar la fiesta
// ============================================================

// ---- Supabase ----
// Crea un proyecto en https://supabase.com, ve a Project Settings > API
const SUPABASE_URL = "https://anzhadhktoroaufkqqoc.supabase.co"; // ej: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_Y1dQF4EDf0Mmaa4Lf-GgVA_t3gTz5Ip";

// Tabla esperada en Supabase (crear manualmente en el editor SQL):
//
// create table confirmados (
//   id bigint generated always as identity primary key,
//   slug text not null unique,
//   nombre text not null,
//   timestamp timestamptz not null default now()
// );
//
// -- Habilitar Realtime para esta tabla desde Database > Replication
// -- Habilitar RLS + policies público (insert/update para el upsert, select para leer):
//
// alter table confirmados enable row level security;
// create policy "Permitir insert publico" on confirmados for insert with check (true);
// create policy "Permitir update publico" on confirmados for update using (true);
// create policy "Permitir select publico" on confirmados for select using (true);

// ---- Detalles de la fiesta ----
const PARTY_DETAILS = {
  nombreFestejado: "Andrés",
  fecha: "Sábado 12 de septiembre, 2026 — 3:00 PM",
  lugar: "Casa de Andrés (dirección:donde vea cartel de one piece)",
  queLlevar: "Tu mejor actitud, algo para compartir(chismes) y muchas ganas de bailear.",
  mensajeExtra: "Con que traigan hambre pasan",
};

// ---- Lista de invitados (hardcodeada) ----
// Cada invitado tiene un "slug" único que va en su link personal:
//   tusitio.com/?g=vianey
// La página resuelve el slug de la URL contra este mapa y así sabe quién
// es SIN pedirle que escriba ni seleccione su nombre — evita typos y
// evita que alguien confirme "por" otra persona escribiendo su nombre.
// Si el slug no está aquí, se bloquea el acceso (pantalla de invitación
// no reconocida).
const GUEST_LIST = {
  vianey19: "Vianey",
  joseluis29: "Jose Luis",
  antonio39: "Antonio",
  berenice49: "Berenice",
  valentino59: "Valentino",
  alejandro69: "Alejandro",
  francisco79: "Francisco",
  veronicadelmar89: "Del Mar",
  profejoseluis99: "Jose Luis",
};
