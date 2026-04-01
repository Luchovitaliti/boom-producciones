# BOOM Producciones — Documentación Completa de la App
## Todo lo que hace, cómo funciona y prompt para Claude Code

---

## CONTEXTO DEL PROYECTO

**BOOM Producciones** es una productora de eventos ubicada en Valle de Uco, Mendoza, Argentina. La app es un sistema de gestión interna completo que centraliza todo el trabajo del equipo: desde la planificación y el stock de barra, hasta el seguimiento de públicas, el contenido de redes y la administración financiera de cada evento.

**Stack técnico actual:**
- HTML + CSS + JavaScript vanilla (single file)
- Firebase Firestore (base de datos en la nube, tiempo real)
- Deploy en Vercel (URL: boom-producciones.vercel.app)
- Sin frameworks, sin build tools — corre directo en el browser

**Marca:**
- Colores: negro `#0c0e0c`, verde `#5ab033`, violeta `#7c3aed`
- Logo: ícono de bomba con líquido verde (SVG), texto BOOM en display font
- Tipografía: DM Sans
- Estética: dark mode, minimalista, profesional

---

## ARQUITECTURA GENERAL

### Sistema de autenticación
La app usa un sistema de login propio (no Firebase Auth). Los usuarios y contraseñas se guardan en Firestore bajo la colección `config/users`. Al entrar:
1. Se valida usuario + contraseña contra el array `USERS` en memoria
2. Si es correcto, se carga toda la data desde Firebase
3. Se construye el sidebar y la navegación según los módulos asignados a ese usuario
4. Se inician los listeners de tiempo real (especialmente el chat)

### Sistema de usuarios y roles
Hay 5 roles predefinidos, pero el sistema es flexible — el ADMIN puede crear cualquier usuario con cualquier nombre y asignarle módulos individuales:

| Usuario | Contraseña | Rol | Acceso por defecto |
|---------|-----------|-----|-------------------|
| ADMIN | Lucho1 | Admin Console | Todo |
| BARRA | boombarra1 | Barra | Barra + Chat + Perfil |
| PUBLICA | boomlider1 | Públicas | Líder Públicas + Públicas + BOOM + Chat + Perfil |
| CM | boomcm1 | CM | CM + BOOM + Chat + Perfil |
| ADMINFIN | boomadmin1 | Administración | Administración + Proveedores + Chat + Perfil |

Cada usuario tiene: `user` (login), `pass` (contraseña), `role` (rol visible), `chatName` (nombre en el chat), `photo` (foto de perfil en base64), `bio`, `instagram`, `telefono`, `pages` (array de módulos habilitados).

### Sistema de eventos
Los eventos son el eje central de la app. **Solo el ADMIN puede crearlos, editarlos o eliminarlos.** Cada evento tiene:
- `nombre`: nombre del evento
- `fecha`: fecha (formato YYYY-MM-DD)
- `precio`: precio de la entrada
- `minPubs`: mínimo de publicaciones requeridas a las públicas
- `venue`: lugar del evento
- `desc`: notas internas

Todos los demás módulos (barra, gastos, publicaciones, actividad de públicas, etc.) están indexados por número de evento. En la topbar hay un selector para cambiar entre eventos y toda la app se actualiza.

### Firebase — colecciones
```
eventos/lista        → array de eventos + EV_FIN
stock/ev0, ev1...    → stock inicio y cierre por evento
gastos/ev0, ev1...   → lista de gastos por evento
cajas/ev0, ev1...    → datos de cajas (Fudo vs Real) por evento
staff/ev0, ev1...    → personal contratado por evento
publicas/lista       → base de datos de públicas
actividad/ev0...     → actividad de cada pública por evento
publogs/ev0...       → log de publicaciones de públicas
beneficios/ev0...    → beneficios otorgados por evento
cm/posts             → publicaciones programadas CM
cm/tasks             → tareas CM
boom/ideas           → ideas del equipo
chat/general         → mensajes canal general
chat/ideas           → mensajes canal ideas
chat/barra           → mensajes canal barra
chat/cm              → mensajes canal CM
chat/publicas        → mensajes canal públicas
chat/admin           → mensajes canal admin
chat/ev0, ev1, ev2   → mensajes por evento
proveedores/lista    → base de datos de proveedores
config/users         → usuarios y contraseñas
```

---

## MÓDULOS — DESCRIPCIÓN COMPLETA

---

### 1. DASHBOARD
**Acceso:** Admin Console

El panel principal del CEO. Muestra la situación financiera del evento seleccionado.

**Si no hay eventos creados:** muestra pantalla de bienvenida con botón "Crear primer evento".

**Con eventos:**
- Botones de + Nuevo evento / Editar / Eliminar (solo ADMIN)
- Métricas: Resultado del evento, Ingresos totales, Gastos registrados, Gastos pendientes, Tickets vendidos, Públicas activas
- Gráfico de barras horizontales con ganancia por área: Tickets Eventbrite, Anticipadas efectivo, Anticipadas MercadoPago, Taquilla, Barra
- Los montos se calculan en tiempo real desde los datos cargados

**Crear/editar evento (modal):** nombre, fecha, precio de entrada, mínimo de publicaciones de las públicas, venue, notas.

---

### 2. MÓDULO DE BARRA
**Acceso:** BARRA (y Admin)

El módulo más completo. Gestiona todo el ciclo de la barra en un evento. Tiene 7 pestañas:

#### Pestaña: Inicio (Stock inicial)
- Tabla con los 8 productos de barra: Cerveza Quilmes 1L, Cerveza Corona 355ml, Fernet Branca 750ml, Coca-Cola 500ml, Agua sin gas 500ml, Sprite 500ml, Champagne Chandon 750ml, Vino tinto Malbec 750ml
- Campos editables de cantidad por producto
- Indicador de estado (OK / Bajo / Muy bajo)
- Calcula automáticamente cuántas cajas equivale
- Botón **"💾 Guardar stock inicio"** → guarda en Firebase

#### Pestaña: Cierre (Stock final)
- Muestra stock de inicio
- Campo editable "Sobró" por producto
- Calcula automáticamente "Vendido" = Inicio - Sobró
- Botón **"💾 Guardar stock cierre"** → guarda en Firebase

#### Pestaña: Consumo
- Se activa solo cuando hay cierre cargado
- Métricas: Total vendido, % de rotación
- Ranking visual de productos más vendidos (barras de colores)

#### Pestaña: Precios
- Tabla completa con precio de venta y costo de cada producto
- **Los precios son editables directamente en la tabla**
- Calcula margen por unidad y ganancia estimada si hay cierre
- Botones: **"+ Producto"** (agrega nuevo producto) y **"💾 Guardar precios"**

#### Pestaña: Cajas
- 3 cajas de barra, cada una con 4 campos: Fudo Efectivo, Fudo MP, Real Efectivo, Real MP
- Fudo = lo que registró el sistema de punto de venta
- Real = lo que hay físicamente
- Tabla de resultado: diferencia por método de pago, si cuadra o hay diferencia
- Se actualiza en tiempo real al cambiar valores

#### Pestaña: Staff
- Métricas: total de personal, monto pagado, monto pendiente
- Tabla de personal: nombre, rol, horario entrada-salida, monto, método de pago (Efectivo / Transferencia / MercadoPago), estado (Pagado / Pendiente)
- Botón **"+ Agregar personal"** → modal con todos los campos
- Guarda en Firebase automáticamente

#### Pestaña: Compra
- Lista de sugerencia de compra para el próximo evento
- Calcula promedio de consumo de todos los eventos cerrados
- Aplica 10% de buffer de seguridad
- Muestra: stock actual, promedio de consumo, objetivo, cantidad a comprar, cantidad en cajas

---

### 3. ADMINISTRACIÓN
**Acceso:** ADMINFIN (y Admin)

Gestión financiera y de gastos de cada evento.

#### Pestaña: Gastos
- Lista completa de gastos con: descripción, rubro, monto, estado (Pagado / Pendiente / En aprobación)
- Botón **"✓ Pagar"** → cambia estado a Pagado, guarda en Firebase
- Botón **"✕"** → elimina el gasto
- Botón **"+ Agregar gasto"** → modal con descripción, rubro (10 opciones predefinidas: Flyer/diseño, Publicidad en redes, Cachets artistas/DJ, Alquiler lugar, Staff, Habilitaciones, Sonido, Iluminación, Seguridad, Otros), monto

#### Pestaña: Aprobaciones CEO
- Muestra gastos en estado "aprobacion" esperando OK del CEO
- Botones Aprobar (pasa a pendiente) y Rechazar (elimina)

**Rubros disponibles:** Flyer/diseño, Publicidad en redes, Cachets artistas/DJ, Alquiler lugar/equipos, Staff, Habilitaciones, Sonido, Iluminación, Seguridad, Otros gastos.

---

### 4. LÍDER DE PÚBLICAS
**Acceso:** PUBLICA (y Admin)

El módulo más complejo. Gestión completa del equipo de públicas.

#### Panel superior
- Alerta de estado de campaña (🟢 / ⚠️ / 🔴) con % de cumplimiento
- Métricas: públicas activas, promedio de stories, total invitados, ingresaron, % de conversión, % cumplimiento

#### Pestaña: Ranking
- Tabla de posiciones ordenada por publicaciones totales
- Cada pública muestra: posición (🥇🥈🥉), avatar con iniciales, nombre, tipo (VIP/Común), red social, invitados, actitud
- Barra de progreso visual hacia el mínimo requerido
- Zonas coloreadas: Verde (top 33%), Amarillo (medio), Rojo (bajo)
- Botón **"+ Nueva pública"** → modal completo
- Botón **"Actualizar"** por pública → modal de carga de actividad

#### Pestaña: Actividad
- Tabla con stories, reels, TikToks, invitados, ingresaron, estado mínimo, actitud
- Botón **"Actualizar"** por pública

#### Pestaña: Invitados
- Tabla ordenada por ingresados
- Muestra % de conversión con badge de color (verde ≥80%, amarillo ≥50%, rojo <50%)

#### Pestaña: Clasificación
- Divide automáticamente en 4 categorías:
  - 🔥 TOP: cumplen publicaciones + llevan gente + actitud alta
  - ⚡ Activas: cumplen el mínimo
  - 🟡 Flojas: no llegan al mínimo
  - ❌ Descartables: no suman — evaluar baja

#### Pestaña: Beneficios
- Tabla de control de beneficios por pública
- Checks para: Entrada gratis, Consumición incluida
- Muestra nivel automático (TOP, Activa, Floja, Descartable)

#### Pestaña: Post-evento
- Análisis después del evento: evaluación individual de cada pública
- Clasifica como: Superó expectativas, Cumplió, Cumplió (sin ventas), No cumplió

**Modal de nueva pública:** nombre, Instagram, teléfono, tipo (Común/VIP), comisión, observaciones.

**Modal de actividad:** stories, reels, TikToks, invitados, ingresaron, actitud (Alta/Media/Baja), observaciones.

---

### 5. PÚBLICAS
**Acceso:** PUBLICA (y Admin)

Versión simplificada del módulo para el equipo de públicas (sin las funciones de gestión avanzada del Líder).

- Vista del equipo activo con estado de cumplimiento
- Botón **"+ Pub"** por pública → modal de registro de publicación (tipo, descripción, entradas vendidas)
- Log de últimas 8 publicaciones

---

### 6. CM (Community Manager)
**Acceso:** CM (y Admin)

Gestión del contenido de redes sociales y tareas.

#### Pestaña: Calendario
- Calendario mensual interactivo con navegación
- Countdown al próximo evento (si hay fecha cargada)
- Botones **"+ Publicación"** y **"+ Tarea"** en la parte superior
- Los días con contenido muestran badges de colores por red social:
  - Violeta: Instagram Feed
  - Dorado: Instagram Story
  - Rojo: Reel
  - Verde: TikTok
  - Badge azul: Evento
  - Amarillo: Tarea
- **Click en cualquier día** → panel lateral que muestra el contenido de ese día + botones rápidos para agregar publicación o tarea con la fecha pre-cargada

#### Pestaña: Lista de contenido
- Métricas: total programadas, próximas, publicadas
- Lista cronológica de publicaciones próximas con: fecha, red social, tipo de contenido, descripción, días restantes
- Botón **"✕"** para eliminar cada publicación

#### Pestaña: Tareas
- Métricas: pendientes, completadas
- Lista de tareas pendientes con checkbox, área responsable, fecha límite, días restantes
- Botón **"✕"** para eliminar
- Lista separada de tareas completadas (con opción de desmarcar)

**Modal nueva publicación:** fecha, hora, red social (IG Feed / IG Story / Reel / TikTok / Facebook), tipo de contenido (9 opciones), copy/descripción.

**Modal nueva tarea:** título, fecha, hora, avisar con X tiempo antes (2hs / 12hs / 1 día / 2 días), área responsable, visibilidad (Todos / Solo CM).

---

### 7. BOOM GENERAL
**Acceso:** Todos los módulos de comunicación

Espacio colaborativo del equipo completo.

#### Pestaña: Calendario
- El mismo calendario del CM pero compartido con todo el equipo
- Muestra todas las publicaciones y tareas de visibilidad "todos"

#### Pestaña: Tareas del equipo
- Solo tareas con visibilidad "todos"
- Cualquier miembro del equipo puede marcarlas como completadas

#### Pestaña: Brainstorming
- Tablero de ideas con sistema de votos
- Cualquier miembro puede proponer una idea (texto + categoría)
- Cada idea muestra: texto, categoría, autor, fecha, contador de votos
- Botón de votar (toggle) por idea
- Botón de eliminar para limpiar ideas descartadas
- Las ideas más votadas aparecen primero (ordenado por votos)

---

### 8. CHAT INTERNO
**Acceso:** Todos

Sistema de mensajería interna en tiempo real, sincronizado con Firebase.

**9 canales:**
- General, Ideas (canales generales)
- Barra, CM, Públicas, Admin (canales por área)
- Sunset 15 Mar, Sunset 22 Mar, Fiesta 5 Abr (canales por evento — se actualizan con los nombres reales de los eventos)

**Funcionamiento:**
- Cada usuario chatea automáticamente con su `chatName` (no puede cambiarlo)
- Los mensajes propios aparecen a la derecha con fondo verde BOOM
- Los mensajes ajenos aparecen a la izquierda con nombre del remitente
- **Es tiempo real**: cuando alguien envía un mensaje, aparece instantáneamente para todos los que tienen el canal abierto (Firebase `onSnapshot`)
- El avatar muestra foto si el usuario la tiene cargada en su perfil, si no muestra iniciales con color único

---

### 9. PROVEEDORES
**Acceso:** ADMINFIN (y Admin)

Base de datos de proveedores con historial por evento.

- Métricas: cantidad de proveedores, categorías, calificación promedio, pagos pendientes
- Botón **"+ Proveedor"** → modal completo
- Organizados por categoría (Sonido, Iluminación, DJ/Artista, Seguridad, Imprenta, Diseño, Fotografía, Catering, Venue, Otro)
- Cada proveedor muestra: nombre, contacto, teléfono, calificación en estrellas (★), observaciones, historial de eventos con estado de pago
- Botones **Editar** y **Eliminar** (con modal de confirmación para evitar borrados accidentales)

**Modal de proveedor:** nombre/empresa, categoría, contacto, teléfono, calificación (1-5 estrellas), observaciones.

---

### 10. REPORTES Y KPIs
**Acceso:** Admin Console

Vista analítica de la temporada completa.

#### Pestaña: General
- Grid con métricas grandes: eventos realizados, asistencia promedio, ingresos totales, resultado neto
- Tabla de resultado por evento con indicador Positivo/Negativo/Pendiente

#### Pestaña: Financiero
- Tabla comparativa por evento: Ingresos, Gastos, Margen %, Resultado
- Gráfico de barras de desglose de gastos promedio (Cachets, Venue, Staff, Publicidad, Habilitaciones, Otros)

#### Pestaña: Barra
- Ingresos de barra por evento con % de margen
- Ranking histórico de productos más vendidos

#### Pestaña: Públicas
- Métricas promedio de la temporada: cumplimiento, invitados, conversión
- Tabla de KPIs por evento: equipo, cumplieron, invitados, ingresaron, conversión

---

### 11. USUARIOS
**Acceso:** Admin Console exclusivo

Gestión completa del equipo.

- Lista de todos los usuarios con: avatar, nombre de usuario, rol, chatName, módulos habilitados
- Botón **"Módulos"** → modal para tildar/destildar qué módulos tiene acceso cada persona
- Botón **"Eliminar"** (excepto el Admin principal)
- Formulario para **agregar nuevo usuario**: usuario, contraseña, nombre en el chat, rol — el nuevo usuario entra con acceso básico (BOOM General + Chat + Perfil) y el Admin le asigna los módulos desde el botón "Módulos"
- **Todos los cambios se sincronizan en Firebase** — si el Admin agrega o modifica un usuario, el cambio es efectivo la próxima vez que esa persona inicia sesión

---

### 12. MI PERFIL
**Acceso:** Todos

Accesible desde el avatar en la topbar o desde el sidebar.

- **Header del perfil**: foto (si la tiene), nombre, rol, bio
- **Editar información**: nombre en el chat (nombre visible en toda la app), Instagram, teléfono, bio
- **Subir foto de perfil**: click en el avatar → abre selector de archivo → la foto se guarda en base64 y aparece en el chat y en la topbar
- **Cambiar contraseña**: campo de contraseña actual + nueva contraseña + confirmar (validación en tiempo real)
- **Mis módulos**: lista visual de a qué secciones tiene acceso el usuario

---

## NAVEGACIÓN Y UI

### Layout desktop
- **Topbar** fija en la parte superior: logo BOOM + ícono SVG de la bomba, selector de evento (dropdown), pill con el rol del usuario, avatar/foto que lleva al perfil, botón Salir
- **Sidebar** izquierdo fijo (220px): ítems de navegación agrupados por sección (Admin, Módulos, Comunicación, Mi cuenta)
- **Contenido principal** ocupa el resto de la pantalla con scroll propio

### Layout mobile (≤768px)
- **Topbar** compacta: logo pequeño, selector de evento reducido, avatar, salir
- **Bottom navigation bar** fija en la parte inferior: los primeros 4 módulos del usuario + Perfil, con íconos grandes y texto corto. Reemplaza al sidebar.
- Las pestañas (tabs) dentro de cada módulo tienen scroll horizontal en mobile
- Formularios en columna única
- Tablas con scroll horizontal

### Sidebar organización por secciones
- **Admin**: Dashboard, Proveedores, Reportes y KPIs, Usuarios (solo los que tienen acceso)
- **Módulos**: Barra, Administración, Líder Públicas, Públicas
- **Comunicación**: CM, BOOM General, Chat interno
- **Mi cuenta**: Mi perfil

### Modales
Todos los formularios importantes usan modales centrados (blur de fondo). Se cierran tocando fuera del modal o el botón Cancelar.

---

## FLUJO TÍPICO DE UN EVENTO

1. **ADMIN crea el evento** en el Dashboard → aparece en el selector de todos los usuarios
2. **ADMINFIN carga los gastos** en Administración → flyer, publicidad, caché DJ, alquiler
3. **CM programa el contenido** en el módulo CM → publicaciones en el calendario
4. **Líder de Públicas agrega el equipo** en Líder Públicas → crea las fichas de cada pública
5. **El equipo usa el Chat** por canales para coordinarse
6. **La noche del evento** → BARRA carga el stock de inicio y el personal
7. **Durante el evento** → Públicas registran sus publicaciones, Barra actualiza cajas
8. **Después del evento** → BARRA carga el cierre de stock + datos de cajas, ADMINFIN marca gastos como pagados
9. **Post-evento** → Líder de Públicas hace el análisis de clasificación, ADMIN revisa el Dashboard y los KPIs

---

## PALETA DE COLORES Y DISEÑO

```css
--bg: #0c0e0c          /* Fondo principal — negro verdoso */
--bg2: #111411         /* Fondo secundario — cards, sidebar */
--bg3: #181c18         /* Fondo terciario — inputs, badges */
--border: #1e251e      /* Bordes suaves */
--border2: #252d25     /* Bordes más marcados */
--text: #e8f0e8        /* Texto principal */
--text2: #7a917a       /* Texto secundario */
--text3: #4a5a4a       /* Texto desactivado */
--accent: #5ab033      /* Verde BOOM — botones principales, activos */
--accent2: #3d8522     /* Verde oscuro — hover */
--accent3: #72cc44     /* Verde claro — highlights */
--violet: #7c3aed      /* Violeta — secciones, VIP */
--violet3: #9d5ff5     /* Violeta claro — badges info */
--red: #f87171         /* Rojo — negativos, peligro */
--yellow: #f5c542      /* Amarillo — advertencias */
--blue: #60a5fa        /* Azul — información */
```

**Botones:**
- `btnp` (primario): gradiente verde #5ab033 → #3d8522
- `btnd` (peligro): texto rojo, borde rojo tenue
- `btnsm` (pequeño): padding reducido, font 11px

---

## PROMPT PARA CLAUDE CODE

Si querés continuar el desarrollo de esta app con Claude Code, usá este prompt como base:

---

```
Sos el desarrollador de BOOM App, la app de gestión interna de BOOM Producciones, 
una productora de eventos de Valle de Uco, Mendoza, Argentina.

CONTEXTO DE LA APP:
- App web single-file HTML + CSS + JS vanilla
- Base de datos: Firebase Firestore (proyecto: boom-producciones)
- Deploy: Vercel (boom-producciones.vercel.app)
- Firebase config:
  apiKey: "AIzaSyCJ3JlOH7cWId3t4pe_7WuuyqptWk7VXE0"
  projectId: "boom-producciones"
  appId: "1:53907802659:web:4c66eeb1eaed087e467f96"

IDENTIDAD VISUAL:
- Dark mode profundo: fondo #0c0e0c, verde #5ab033 como acento principal, violeta #7c3aed para secciones
- Logo: ícono SVG de bomba con líquido verde, sin fondo
- Tipografía: DM Sans
- Los botones primarios usan gradiente verde (#5ab033 → #3d8522)
- Las burbujas de chat propias usan el gradiente verde

USUARIOS Y ROLES (5 usuarios base, expandibles):
- ADMIN (Lucho1): acceso total, CEO de BOOM
- BARRA (boombarra1): módulo de barra + chat + perfil
- PUBLICA (boomlider1): líder públicas + públicas + boom general + chat + perfil
- CM (boomcm1): community manager + boom general + chat + perfil
- ADMINFIN (boomadmin1): administración + proveedores + chat + perfil

MÓDULOS DE LA APP:
1. Dashboard (solo ADMIN): métricas CEO, gestión de eventos (crear/editar/eliminar)
2. Barra (BARRA): 7 pestañas — Stock inicio, Cierre, Consumo/ranking, Precios editables, Cajas Fudo vs Real, Staff, Lista de compra
3. Administración (ADMINFIN): gastos por evento, aprobaciones CEO
4. Líder Públicas (PUBLICA): ranking, actividad, invitados, clasificación automática TOP/Activa/Floja/Descartable, beneficios, post-evento
5. Públicas (PUBLICA): registro de publicaciones, log de actividad
6. CM (CM): calendario interactivo con click-to-add, lista de contenido, tareas con checkbox
7. BOOM General (todos): calendario compartido, tareas de equipo, brainstorming con votos
8. Chat interno (todos): 9 canales en tiempo real con Firebase, mensajes por usuario logueado
9. Proveedores (ADMINFIN): base de datos, historial por evento, editar/eliminar
10. Reportes y KPIs (ADMIN): 4 pestañas — general, financiero, barra, públicas
11. Usuarios (ADMIN): gestión de accesos, asignación de módulos por usuario
12. Mi Perfil (todos): foto de perfil, bio, redes, cambio de contraseña

ESTRUCTURA DE DATOS (Firebase Firestore):
- eventos/lista: array de eventos con {nombre, fecha, precio, minPubs, venue, desc}
- stock/ev{N}: {ini: [8 valores], cie: [8 valores o nulls]}
- gastos/ev{N}: {items: [{d, r, m, e, a}]}
- cajas/ev{N}: {items: [{fE, fM, rE, rM}×3]}
- staff/ev{N}: {items: [{n, rol, ent, sal, monto, met, pag}]}
- publicas/lista: {items: [{id, n, ig, tel, tipo, com, activo, obs, camps}]}
- actividad/ev{N}: {pid: {stories, reels, tiktok, inv, ing, actitud, obs}}
- publogs/ev{N}: {items: [{pid, tipo, desc, ent, ts}]}
- beneficios/ev{N}: {pid: {ent, con, ex}}
- cm/posts: {items: [{id, fecha, hora, red, tipo, desc}]}
- cm/tasks: {items: [{id, titulo, fecha, hora, aviso, area, vis, done}]}
- boom/ideas: {items: [{id, txt, cat, autor, fecha, votos}]}
- chat/{canal}: {msgs: [{u, t, ts}]}
- proveedores/lista: {items: [{id, n, cat, cont, tel, cal, obs, eventos, pagado, montos}]}
- config/users: {items: [array completo de usuarios con contraseñas]}

REGLAS DE DESARROLLO:
1. NUNCA romper funcionalidad existente al agregar features nuevas
2. Siempre verificar que el login con ADMIN/Lucho1 funcione antes de entregar
3. Firebase usa el SDK Compat (no ES modules): firebase-app-compat.js + firebase-firestore-compat.js
4. Los datos de Firebase se cargan DESPUÉS del login exitoso, no antes
5. Siempre usar window._fbOK para verificar si Firebase está disponible antes de guardar
6. La app debe funcionar aunque Firebase esté offline (datos locales como fallback)
7. Responsive: desktop con sidebar lateral, mobile con bottom nav fija + sidebar horizontal scrolleable
8. El calendario debe usar las fechas reales de EVENTOS (no hardcodeadas)
9. Solo el rol 'Admin Console' puede crear/editar/eliminar eventos y usuarios
10. El chat es en tiempo real con Firebase onSnapshot listeners
11. Mantener la paleta de colores BOOM (negro #0c0e0c, verde #5ab033, violeta #7c3aed)
12. Todos los modales se cierran tocando fuera del área del modal

PRÓXIMAS MEJORAS PENDIENTES:
- Sistema de notificaciones push para tareas con fecha límite
- Modo "Día del evento" con vista simplificada para el día D
- Portal externo para que las públicas carguen sus publicaciones
- Módulo de Tickets con integración a Eventbrite
- Módulo de Artistas/Riders con requerimientos técnicos
- Sistema de plantillas de eventos (copiar configuración de evento anterior)
- Exportar reportes a PDF
- Dominio propio (boom.vercel.app o similar)
- Reglas de seguridad de Firebase (actualmente en modo abierto)
```

---

## NOTAS TÉCNICAS IMPORTANTES

**Firebase SDK Compat** — el proyecto usa la versión "compat" del SDK de Firebase que funciona con JS normal (sin import/export). Se carga desde CDN:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
```

**Por qué no funciona abriendo el archivo local** — Chrome bloquea las peticiones de Firebase cuando el archivo se abre directamente (`file://`). Siempre debe abrirse desde una URL `https://`.

**Flujo de actualización de la app:**
1. Modificar con Claude Code (o Claude.ai)
2. Descargar el `index.html`
3. Ir a github.com/Luchovitaliti/boom-producciones
4. Reemplazar el `index.html` con el nuevo
5. Commit → Vercel redeploya automáticamente en ~1 minuto
6. Los datos en Firebase no se tocan nunca

**Reglas de Firestore** — actualmente en modo prueba (permiso abierto por 30 días). Antes de que expire hay que configurar reglas de seguridad reales que requieran autenticación.
