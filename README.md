# NegociaCDMX

Abrir un negocio en la CDMX es difícil porque no existe una sola herramienta que diga si tu idea es viable en tu zona **y** qué trámites legales debes completar primero.

---

## Para quién es

Emprendedores de la Ciudad de México que tienen una idea de negocio y necesitan dos respuestas concretas antes de invertir: si la zona aguanta otro establecimiento de su giro, y qué ventanillas deben pisar — en qué orden — para operar legalmente.

---

## Correrlo en 5 minutos

```sh
git clone https://github.com/grzlz/negocia-cdmx
cd negocia-cdmx
npm install

cp .env.example .env
# Edita .env y pon tu GEMINI_API_KEY (ver SETUP.md para obtenerla)

# Crea el archivo de secretos del DENUE
echo "INEGI_DENUE_TOKEN=tu_token_aqui" > .secret

npm run dev
```

Abre `http://localhost:5173`, regístrate y el análisis arranca solo.

> Sin `GEMINI_API_KEY` el análisis de viabilidad y la guía de registro fallan.  
> Sin `INEGI_DENUE_TOKEN` el mapa de negocios aledaños falla. Ver [SETUP.md](./SETUP.md) para obtener ambos.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Estilos | Tailwind CSS v4 |
| Lenguaje | TypeScript |
| Base de datos | SQLite vía `better-sqlite3` |
| IA | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Mapas | Leaflet + OpenStreetMap (gratuito, sin token) |
| Datos de negocios | API DENUE – INEGI |
| PDF | jsPDF (generación client-side) |
| Runtime | Node.js · `@sveltejs/adapter-node` |

---

## Limitaciones conocidas

- **Sesión sin persistencia entre dispositivos.** La autenticación usa una cookie de sesión simple; cerrar el navegador o cambiar de dispositivo cierra la sesión.
- **SQLite de archivo único.** Suficiente para desarrollo y demos; no escala a múltiples instancias en producción.
- **DENUE con cobertura limitada.** El analizador de viabilidad usa un dataset mock local de la CDMX; el mapa en tiempo real depende del token INEGI y puede devolver pocos resultados en zonas periféricas.
- **Guía de registro generada con IA.** Los pasos son orientativos y se basan en protocolos CDMX 2025; verifica siempre en las dependencias oficiales antes de actuar.
- **Sin Mapbox, sin `MapaCompetencia`.** El componente `MapaCompetencia` requiere `PUBLIC_MAPBOX_TOKEN`. El mapa principal (`MapaDenue`) funciona sin él usando OpenStreetMap.
