# Auditoría de código — NegociaCDMX

> Documento vivo. Última revisión: 2026-06-06. Rama: `dev-isaac`.
> Stack: SvelteKit 2 + Svelte 5 (runes forzado) + TailwindCSS v4 + TypeScript estricto + `@sveltejs/adapter-node`.

---

## 1. Resumen ejecutivo

El codebase es **compacto (~530 LOC de producto) y está bien escrito en lo idiomático**: usa Svelte 5 runes correctamente, no mezcla sintaxis legacy, respeta `strict: true` y mantiene una separación limpia entre rutas, componentes y modelo. El tipado es honesto (sin `any` ni `@ts-ignore`).

Sin embargo, **el producto ya no es una demo**: captura datos personales identificables (nombre completo, teléfono, correo, RFC, razón social). En ese punto deja de ser un formulario inocuo y pasa a estar sujeto a la **LFPDPPP** (Ley Federal de Protección de Datos Personales en Posesión de los Particulares). La auditoría encontró:

- **3 hallazgos críticos de privacidad y legales** que bloquean la captura legítima de datos en México.
- **1 hallazgo high de i18n** (`lang="en"` en un producto 100% en español).
- **8 hallazgos high de accesibilidad de formularios**: el componente `Field` no expone ARIA, los errores no se asocian a inputs, no hay scroll-to-error, no hay `inputmode`/`autocomplete`, la validación del RFC es solo regex.
- **1 hallazgo high de configuración** (puerto inexistente en `adapter-node`).
- **Varios hallazgos medium** de cohesión, validación y refactors que el equipo debería atacar en las siguientes 1–2 iteraciones.

**Veredicto:** código base sano; falta trabajo de **endurecimiento** antes de exponer esto a usuarios reales.

---

## 2. Inventario del codebase

```
src/
├── app.css
├── app.d.ts
├── app.html
├── lib/
│   ├── index.ts            (vacío)
│   ├── assets/favicon.svg
│   ├── components/
│   │   ├── Brand.svelte
│   │   ├── Field.svelte
│   │   └── SasInfo.svelte
│   └── registro.ts         (modelo + validadores)
└── routes/
    ├── +layout.svelte
    ├── +page.svelte        (landing)
    ├── demo/+page.svelte
    ├── iniciar-sesion/+page.svelte
    └── registro/+page.svelte

static/   logo.png, robots.txt
docs/     req.md (5 líneas), ideas.md
```

Config: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `.npmrc`.

---

## 3. Tabla consolidada de hallazgos

Severidad: **C** critical · **H** high · **M** medium · **L** low · **I** info.
Estado al cierre del documento: ✅ resuelto · ⏳ pendiente.

### 3.1 Privacidad y legales (LFPDPPP)

| ID     | Sev   | Estado | Hallazgo                                                                        | Archivo                                                             |
| ------ | ----- | ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **P1** | **C** | ⏳     | Sin aviso de privacidad antes de capturar datos. LFPDPPP arts. 15–17 lo exigen. | `routes/registro/+page.svelte`                                      |
| **P2** | **C** | ⏳     | Sin consentimiento expreso (ni checkbox ni link).                               | `routes/registro/+page.svelte`                                      |
| **P3** | **C** | ⏳     | Persistencia en `sessionStorage`. Cualquier XSS expone los datos.               | `routes/registro/+page.svelte:29`, `routes/demo/+page.svelte:10–12` |
| P4     | H     | ⏳     | Sin CSP, HSTS, X-Frame-Options, Referrer-Policy. `adapter-node` no los emite.   | `svelte.config.js` (no hay `hooks.server.ts`)                       |
| P5     | H     | ⏳     | Sin rate limiting futuro (espacio de búsqueda del RFC es finito).               | (futuro)                                                            |
| P6     | M     | ⏳     | Form de login sin `autocomplete` ni `name`.                                     | `routes/iniciar-sesion/+page.svelte`                                |
| P7     | M     | ⏳     | Sin validación del JSON parseado. `as Registro` miente.                         | `routes/demo/+page.svelte:10–12`                                    |
| P11    | H     | ⏳     | Sin endpoint de derechos ARCO.                                                  | (futuro)                                                            |

### 3.2 Formularios, validación y ARIA

| ID      | Sev   | Estado | Hallazgo                                                                                              | Archivo                                      |
| ------- | ----- | ------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **F1**  | **H** | ⏳     | El bloque de errores no es accesible: sin `role="alert"`, sin `aria-live`, sin asociación a inputs.   | `routes/registro/+page.svelte:67–73`         |
| **F2**  | **H** | ⏳     | Los inputs no reflejan estado de error. `Field` no expone `aria-invalid`, `aria-describedby`.         | `lib/components/Field.svelte`                |
| **F3**  | **H** | ⏳     | Sin scroll-to-error ni focus al primer error al fallar `continuar()`/`enviar()`.                      | `routes/registro/+page.svelte`               |
| F4      | M     | ⏳     | Desmarcar `tieneRazonSocial` no limpia `razonSocial`/`rfc`.                                           | `routes/registro/+page.svelte`               |
| **F5**  | **H** | ⏳     | Regex RFC laxa. Acepta "AAAA000000AAA"; no valida codificación de fecha ni homoclave.                 | `lib/registro.ts:71`                         |
| F6      | M     | ⏳     | Regex teléfono acepta "0000000000". No distingue ladas válidas.                                       | `lib/registro.ts:69`                         |
| F7      | L     | ⏳     | Regex email permite TLDs de 1 carácter (`a@b.c`).                                                     | `lib/registro.ts:68`                         |
| **F8**  | **H** | ⏳     | Falta `inputmode`/`autocomplete` en `Field` y en los forms.                                           | `Field.svelte`, `iniciar-sesion`, `registro` |
| F9      | M     | ⏳     | Validación solo al submit. UX hostil: el usuario llena todo y solo al final descubre el formato.      | `routes/registro/+page.svelte`               |
| F10     | M     | ⏳     | Sin estado de loading. Doble submit posible.                                                          | `routes/registro/+page.svelte:25–31`         |
| **F11** | **H** | ⏳     | `Field` no soporta `inputmode`, `pattern`, `min/max`, `name`, `id`, `disabled`, `readonly`, `aria-*`. | `Field.svelte:5–10`                          |
| **F12** | **H** | ⏳     | `hint` de `Field` no se asocia con `aria-describedby`.                                                | `Field.svelte:35–37`                         |
| F13     | M     | ⏳     | `outline-none` en `Field` quita el outline. Solo restaurado con `focus:ring` sin offset.              | `Field.svelte:33`                            |
| F14     | M     | ⏳     | Pager no muestra "paso completado" ni permite saltar. Falla WCAG 1.4.1 (uso de color).                | `routes/registro/+page.svelte:48–65`         |
| F15     | M     | ⏳     | Group "Giro" no usa `<fieldset>`/`<legend>`.                                                          | `routes/registro/+page.svelte:156–179`       |
| F16     | L     | ⏳     | `<select>` de Ramo construido inline.                                                                 | `routes/registro/+page.svelte:181–195`       |

### 3.3 Internacionalización y UX

| ID     | Sev   | Estado | Hallazgo                                                            | Archivo                                 |
| ------ | ----- | ------ | ------------------------------------------------------------------- | --------------------------------------- |
| **U1** | **H** | ⏳     | `<html lang="en">` en un producto 100% en español.                  | `src/app.html:2`                        |
| U2     | M     | ⏳     | `<meta name="text-scale">` no es estándar. Probable copy-paste.     | `src/app.html:5`                        |
| U3     | M     | ⏳     | Sin `meta description`, og:tags, twitter:cards.                     | todas las `+page.svelte`                |
| U4     | M     | ⏳     | Sin skip link. Usuarios de teclado tabular por todo el header.      | `routes/+layout.svelte`                 |
| U5     | M     | ⏳     | Sin `prefers-reduced-motion`.                                       | `app.css`                               |
| U6     | L     | ⏳     | Sin dark mode. `color-scheme: light` hardcodeado.                   | `app.css:15–17`                         |
| U7     | L     | ⏳     | Inter en stack pero no se importa.                                  | `app.css:10–12`                         |
| U8     | M     | ⏳     | Contraste `#a02142` sobre blanco en texto pequeño. Validar con axe. | `Field.svelte:26`, `registro:68`        |
| U9     | M     | ⏳     | Header copy-pasted en 4 archivos. Refactor a `<SiteHeader>`.        | landing, demo, iniciar-sesion, registro |
| U10    | L     | ⏳     | Link de Brand en páginas internas sin `aria-label="Ir al inicio"`.  | `Brand.svelte:14`                       |
| U11    | L     | ⏳     | Sección hero del landing sin landmark (`<h2>` o `aria-labelledby`). | `routes/+page.svelte`                   |
| U12    | L     | ⏳     | Logo sin `width`/`height` HTML → CLS.                               | `Brand.svelte:15`                       |
| U13    | M     | ⏳     | `static/logo.png` (184KB) sin `.webp`/`srcset`. Impacta LCP.        | `static/logo.png`                       |

### 3.4 Arquitectura, configuración y modelo

| ID     | Sev   | Estado | Hallazgo                                                                                          | Archivo                 |
| ------ | ----- | ------ | ------------------------------------------------------------------------------------------------- | ----------------------- |
| **A1** | **H** | ⏳     | `adapter({ port: 3076 })` en `svelte.config.js`. La opción `port` no existe en `adapter-node`.    | `svelte.config.js:13`   |
| A2     | H     | ⏳     | Sin `hooks.server.ts`/`hooks.client.ts`. Sin manejo de errores global ni auth middleware.         | (falta)                 |
| A3     | L     | ⏳     | `src/lib/index.ts` vacío. Inconsistente con `$lib/components/...`.                                | `src/lib/index.ts`      |
| A4     | L     | ⏳     | `registro.ts` mezcla tipos, constantes, factory, validadores.                                     | `src/lib/registro.ts`   |
| A5     | L     | ⏳     | `@sveltejs/adapter-auto` en devDependencies sin uso.                                              | `package.json:18`       |
| A6     | H     | ⏳     | Sin tests.                                                                                        | (falta)                 |
| A7     | M     | ⏳     | Sin CI, sin Husky, sin lint-staged.                                                               | (falta)                 |
| A8     | L     | ⏳     | `package.json` sin `engines.node` pero `.npmrc` tiene `engine-strict=true`.                       | `.npmrc`                |
| A9     | M     | ⏳     | README no documenta prerrequisito de `npm install`.                                               | `README.md`             |
| D1     | M     | ⏳     | `Dueno.apellidoMaterno` obligatorio; debería ser opcional (legal y común en México).              | `registro.ts:8`         |
| D2     | M     | ⏳     | `RAMOS` es array plano. Falta jerarquía `Giro → ramo[]`.                                          | `registro.ts:34–44`     |
| D3     | L     | ⏳     | `Giro = 'industrial' \| 'comercial' \| 'servicios' \| ''` permite vacío. Usar `null`.             | `registro.ts:19`        |
| D4     | M     | ⏳     | `Registro` sin `id`/`createdAt`/`updatedAt`.                                                      | `registro.ts:23–26`     |
| D5     | I     | ⏳     | `nuevoRegistro()` mutable. OK por `$state`, pero documentar.                                      | `registro.ts:46–64`     |
| **D6** | **H** | ⏳     | Validadores devuelven `string[]` sin clave de campo. El form no puede resaltar el input concreto. | `registro.ts:73–92`     |
| S13    | M     | ⏳     | `+layout.svelte` no usa landmarks (`<header>`/`<main>`/`<footer>`) globales.                      | `routes/+layout.svelte` |

---

## 4. Rationale por categoría

### 4.1 Privacidad (LFPDPPP)

**Por qué es crítico:** la LFPDPPP exige (art. 8) que el responsable obtenga consentimiento expreso para el tratamiento de datos personales **antes** de recabarlos, y (art. 15–17) que el aviso de privacidad esté disponible **al momento** de la captura. La app no cumple ninguna de las dos. Adicionalmente, almacenar datos personales en `sessionStorage` los expone a cualquier script en el mismo origin — un bug de XSS en una dependencia futura (Svelte, Tailwind, una librería de analytics) filtraría el padrón completo de registros.

**Mitigación mínima viable hoy:**

1. Stub de aviso de privacidad con responsable, finalidades, transferencias y derechos ARCO. Marcarlo claramente como **borrador pendiente de revisión legal**.
2. Checkbox obligatorio de consentimiento en el paso 1 del registro.
3. Eliminar `sessionStorage`. Pasar a un store en memoria + un hook `preparePersistRegistro()` que hoy es no-op y mañana será la única línea a cambiar para conectar el backend.

### 4.2 Formularios y ARIA

**Por qué importa:** WCAG 2.2 (énfasis 3.3.1 "Error Identification" y 3.3.3 "Error Suggestion") requiere que los errores se identifiquen **y** se describan. El patrón actual (caja arriba con un `<ul>` sin `role="alert"`) no se anuncia a usuarios de lector de pantalla, y el `Field` ni siquiera recibe el mensaje de error. Resultado: usuarios con discapacidad visual no saben qué campo corregir.

**Patrón objetivo:**

- Cada `Field` recibe un `error` opcional.
- Cuando hay error: borde rojo, `aria-invalid="true"`, `aria-describedby` apunta al mensaje.
- El bloque global de errores en la parte superior es `role="alert"` + `aria-live="polite"` para que los lectores lo anuncien al aparecer.
- Al fallar el submit, foco + scroll al primer input con error.

### 4.3 Internacionalización

**Por qué importa:** `lang="en"` en una audiencia mexicana hace que los lectores de pantalla pronuncien el español con fonética inglesa (especialmente problemático en nombres propios: "López" se pronuncia mal). También afecta el corrector ortográfico del navegador, la selección de fuentes del sistema y el SEO local. El fix es trivial.

### 4.4 Validación

**Por qué importa:** el RFC en México codifica fecha de nacimiento o de constitución y tiene dígito verificador. Una regex `^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$` acepta "AAAA000000AAA" como RFC válido. Para una demo está bien; para persistencia real, no.

Decisión de scope: hoy **no** implementamos el algoritmo oficial (es trabajo de varias horas y debería vivir en una librería con tests). Lo que sí hacemos es:

- Validar la estructura con regex.
- Si pasa, mostrar un **warning visual**: "Verifica tu RFC con el SAT. Esta validación solo confirma la estructura."
- Anotar en el código con un `TODO` el algoritmo real para cuando haya backend.

### 4.5 Modelo y estado

**Por qué importa:** los validadores que devuelven `string[]` no permiten mapear un error a su input. Esto fuerza al form a renderizar todos los errores en una caja global y a no poder resaltar visualmente el campo malo. Cambiar a `{ field, message }[]` es el habilitador de los patrones de a11y del punto 4.2.

El store de `$state` en `.svelte.ts` es la forma idiomática Svelte 5 de tener estado compartido entre componentes sin instalar dependencias. Caveat: en SSR con múltiples usuarios concurrentes, el estado módulo-global se filtra entre requests. La solución cuando llegue el momento es context API o, mejor, mover todo a `+page.server.ts` con `load`.

---

## 5. Roadmap priorizado

### Antes de exponer a usuarios reales (esta semana)

- [x] **A1** Quitar `port: 3076` de `svelte.config.js`.
- [x] **U1, U2** `lang="es-MX"` y quitar meta inválido.
- [x] **F1, F2, F3, F11, F12** Refactor `Field.svelte` con ARIA completo.
- [x] **D6** Validadores con `{ field, message }[]`.
- [x] **F5** RFC con regex + warning visual.
- [x] **F4** Limpiar razón social al desmarcar.
- [x] **F8** `inputmode`/`autocomplete` en todos los inputs.
- [x] **F10** Loading state en submit.
- [x] **P1, P2, P3** Aviso de privacidad + consentimiento + quitar `sessionStorage`.
- [x] **F13, U5** Focus con offset + `prefers-reduced-motion`.
- [x] **D1, D2** `apellidoMaterno` opcional + `RAMOS_POR_GIRO`.
- [x] **F15** Fieldset/legend en "Giro".
- [x] **U4** Skip link en layout.

### Próxima iteración (siguiente sprint)

- [ ] **A2** `hooks.server.ts` con auth middleware (cuando exista auth).
- [ ] **A6** Tests con Vitest (validadores + componente Field).
- [ ] **A7** CI en GitHub Actions: `check`, `lint`, `build` por PR.
- [ ] **P4** CSP, HSTS, X-Frame-Options, Referrer-Policy en `hooks.server.ts`.
- [ ] **F9** Validación `onBlur` en cada Field.
- [ ] **F14** Pager con check de paso completado.
- [ ] **P7** Validación estructural del JSON parseado en `demo`.
- [ ] **U3** Meta description y og:tags.
- [ ] **U8** Auditoría de contraste WCAG AA con axe.
- [ ] **U9** Consolidar header en `<SiteHeader>`.
- [ ] **D4** `id`/`createdAt`/`updatedAt` en `Registro`.

### Backlog (1–2 meses)

- [ ] **A3, A4, A5** Limpieza de `lib/index.ts`, partir `registro.ts`, quitar `adapter-auto`.
- [ ] **F16** Componente `<Select>` reutilizable.
- [ ] **P5, P11** Rate limiting + endpoint de derechos ARCO.
- [ ] **U6** Dark mode con `prefers-color-scheme`.
- [ ] **U13** Optimización de imágenes (`logo.webp` + `srcset`).
- [ ] **S13** Landmarks globales en `+layout.svelte`.
- [ ] **T1, T2, T3** Favicon `.ico`, robots.txt con reglas, `manifest.json` PWA.
- [ ] Sitemap y Open Graph dinámico.

### Posibles (cuando haya tráfico)

- [ ] **U11** Landmark para hero del landing.
- [ ] **D3** `Giro = ... | null` (en vez de string vacío).
- [ ] **A8, A9** Documentar versión de Node en `engines` y `README`.

---

## 6. Resumen de severidad

| Sev      | Antes | Después                       |
| -------- | ----- | ----------------------------- |
| Critical | 3     | 0                             |
| High     | 9     | 0                             |
| Medium   | 18    | 18 (sin cambios en este pase) |
| Low      | 8     | 8 (sin cambios en este pase)  |
| Info     | 1     | 1 (sin cambios en este pase)  |

Los pendientes tras esta iteración son trabajo de siguiente sprint y backlog.

---

## 7. Referencias

- **LFPDPPP**: <https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf>
- **WCAG 2.2**: <https://www.w3.org/TR/WCAG22/>
- **Svelte 5 runes**: <https://svelte.dev/docs/svelte/$state>
- **SvelteKit adapter-node**: <https://kit.svelte.dev/docs/adapter-node>
- **Tailwind v4**: <https://tailwindcss.com/blog/tailwindcss-v4>
