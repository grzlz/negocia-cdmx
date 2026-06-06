# NegociaCDMX

Herramienta para emprendedores e inversionistas que quieren **abrir un negocio en la Ciudad de México**. Resuelve la doble barrera del emprendedor: saber si su idea es **viable en la zona elegida** y conocer **qué trámites, permisos y ventanillas** necesita, y en qué orden.

> Reto 2 — Viabilidad de negocios CDMX.

## Funcionalidad actual

- **Landing** con tres accesos: Registro, Iniciar sesión y Demo.
- **Registro con formulario por pasos (pager):**
  - **Dueño del negocio:** nombre, apellidos, teléfono y correo (con validación).
  - **Negocio:** nombre, giro (industrial / comercial / servicios) y ramo.
  - Campos dinámicos según figura moral:
    - Con razón social → captura de **razón social** y **RFC** (validado).
    - Sin figura moral → guía para constituir una **Sociedad por Acciones Simplificadas (SAS)**.
- Identidad visual del Gobierno de la CDMX (color institucional `#a02142`).

## Stack

- **SvelteKit** + **Svelte 5**
- **TailwindCSS v4**
- **TypeScript**

## Desarrollo

```sh
npm install
npm run dev          # servidor de desarrollo
npm run dev -- --open
```

Otros scripts:

```sh
npm run check        # type-check con svelte-check
npm run lint         # prettier + eslint
npm run format       # prettier --write
npm run build        # build de producción
npm run preview      # previsualizar el build
```

## Estructura

```
src/
├── lib/
│   ├── registro.ts          # modelo de datos y validaciones del registro
│   └── components/          # Brand, Field, SasInfo
└── routes/
    ├── +page.svelte         # landing
    ├── registro/            # formulario por pasos
    ├── iniciar-sesion/
    └── demo/
docs/
├── req.md                   # planteamiento del reto
└── ideas.md                 # notas de producto
```

## Próximas features

Lo que falta para cubrir el reto completo:

- [ ] **Análisis de viabilidad por zona** — afluencia y competencia del giro/ramo en la ubicación elegida.
- [ ] **Mapa de trámites** — qué documentos y permisos se necesitan, en qué ventanilla y en qué orden (ruta crítica del emprendedor).
- [ ] **Programas de emprendimiento CDMX** — apoyos y convocatorias disponibles según el perfil del negocio.
- [ ] **Autenticación real** — registro/inicio de sesión persistente (hoy el flujo es solo de captura).
- [ ] **Panel del emprendedor** — guardar el negocio, retomar trámites y dar seguimiento al avance.
- [ ] **Estimación de costos y tiempos** por trámite.

> ¿Ideas o prioridades? Ver `docs/ideas.md`.
