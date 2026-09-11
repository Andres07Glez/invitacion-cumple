# 🖥️ Invitación de Cumpleaños — Segmentation Fault

Web app estática (HTML + CSS + JS vanilla) con Supabase (base de datos +
realtime), pensada para desplegarse en GitHub Pages.

## Flujo

1. Cada invitado recibe su **link personal**: `tusitio.com/?g=<slug>`. La
   página resuelve el slug contra `GUEST_LIST` (en `config.js`) y así sabe
   quién es sin pedirle que escriba ni elija su nombre — evita typos y
   evita que alguien confirme "por" otra persona. Si el link no trae un
   slug válido, se bloquea el acceso con un mensaje.
2. `index.html` muestra un falso "Segmentation Fault" estilo terminal con
   botones **[ SÍ ]** / **[ TALVEZ ]**.
3. **TALVEZ** dispara una secuencia de ventanas CMD falsas, un falso
   escaneo de "Windows Defender" que detecta una "amenaza", y luego una
   manada de gorilas persiguiendo el cursor hasta que aparece el botón
   **[ ACEPTAR ]**.
4. **SÍ** o **ACEPTAR** llevan a una pantalla que ya saluda al invitado por
   su nombre (resuelto por el link) y solo pide confirmar con un botón —
   sin inputs de texto.
5. Al confirmar:
   - Se guarda `{ slug, nombre, timestamp }` en la tabla `confirmados` de
     Supabase (upsert por slug: reabrir el link no crea duplicados).
   - Se muestra una pantalla "Logro Desbloqueado" con los detalles de la
     fiesta, confeti (canvas) y un jingle 8-bit (Web Audio API).
   - Botón **[ Ver quién más va ]** → `confirmed.html`.
6. `confirmed.html` muestra en tiempo real (Supabase Realtime) quién ha
   confirmado, con tiempo relativo, y quién de `GUEST_LIST` sigue sin
   confirmar (👻 ??? — aún en el limbo). La comparación es por slug exacto,
   sin ambigüedad de texto.

## Configuración

Todo lo que hay que editar está en **[js/config.js](js/config.js)**:

- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- `PARTY_DETAILS` (fecha, lugar, qué llevar, etc.)
- `GUEST_LIST` — mapa `{ slug: "Nombre" }`. El slug es lo que va en el link
  de cada invitado.

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el editor SQL, ejecuta:

   ```sql
   create table confirmados (
     id bigint generated always as identity primary key,
     slug text not null unique,
     nombre text not null,
     timestamp timestamptz not null default now()
   );

   alter table confirmados enable row level security;

   create policy "Permitir insert publico" on confirmados
     for insert with check (true);

   create policy "Permitir update publico" on confirmados
     for update using (true);

   create policy "Permitir select publico" on confirmados
     for select using (true);
   ```

3. En **Database > Replication**, habilita Realtime para la tabla
   `confirmados`.
4. Copia `Project URL` y `anon public key` desde **Project Settings > API**
   a `js/config.js`.

### 2. Imagen del "virus gorila"

Coloca tu imagen en `assets/gorilla.png` (ver
[assets/LEEME.txt](assets/LEEME.txt)). Si no la agregas, se usa un emoji
🦍 como fallback automático.

### 3. Links de cada invitado

Una vez publicado el sitio (ej. `https://tuusuario.github.io/cumple/`),
el link de cada invitado es la URL base + `?g=<slug>`. Con la lista actual
de `GUEST_LIST`:

```
?g=vianey      → Vianey
?g=antonio     → Antonio
?g=joseluis    → Jose Luis
?g=berenice    → Berenice
?g=valentino   → Valentino
?g=alejandro   → Alejandro
?g=francisco   → Francisco
```

Mándale a cada quien **solo su link** (WhatsApp, etc.) — no compartas el
link base sin `?g=`, porque sin un slug válido la página bloquea el acceso.

## Deploy en GitHub Pages

```bash
git init
git add .
git commit -m "Invitación de cumpleaños"
git branch -M main
git remote add origin <tu-repo>
git push -u origin main
```

Luego en GitHub: **Settings > Pages > Deploy from branch > main / (root)**.

No requiere build step — es HTML/CSS/JS estático que solo llama a la API
externa de Supabase desde el navegador.

## Estructura

```
index.html          Pantalla principal (link → segfault → talvez/sí → confirmar → logro)
confirmed.html       Lista en tiempo real de confirmados
css/style.css        Tema terminal oscuro / neón (CSS variables)
js/config.js         Credenciales, detalles de la fiesta y GUEST_LIST (EDITAR AQUÍ)
js/main.js           Lógica de index.html
js/confirmed.js      Lógica de confirmed.html (Supabase Realtime)
assets/              Imagen del gorila (opcional, con fallback a emoji)
```
