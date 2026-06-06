# SETUP — NegociaCDMX

Instrucciones verificadas para levantar el proyecto desde cero.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 20 LTS | `node --version` |
| npm | 10 | `npm --version` |
| Git | cualquiera | `git --version` |

---

## 1. Clonar e instalar

```sh
git clone https://github.com/grzlz/negocia-cdmx
cd negocia-cdmx
npm install
```

---

## 2. Variables de entorno

```sh
cp .env.example .env
```

Edita `.env` y completa los campos:

```env
GEMINI_API_KEY=AIza...        # obligatorio para análisis de IA y guía de registro
GEMINI_MODEL=gemini-2.5-flash # o gemini-2.5-pro para mejor razonamiento
DATABASE_PATH=data/negocia.db  # ruta al archivo SQLite (se crea automáticamente)
PUBLIC_MAPBOX_TOKEN=           # opcional — solo para MapaCompetencia
```

### Obtener `GEMINI_API_KEY`

1. Ve a [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Inicia sesión con tu cuenta Google.
3. Haz clic en **Create API key** → copia el valor.
4. Pégalo en `.env` como `GEMINI_API_KEY=AIza...`.

La clave es gratuita dentro del tier de Google AI Studio (60 peticiones/minuto en Flash).

---

## 3. Token del DENUE (INEGI)

El mapa de negocios aledaños consulta la API DENUE del INEGI. El token va en un archivo `.secret` separado (no en `.env`) para que el build no lo exponga.

```sh
# Crea el archivo en la raíz del proyecto
echo "INEGI_DENUE_TOKEN=tu_token" > .secret
```

### Obtener el token DENUE

1. Regístrate en [www.inegi.org.mx/app/api/denue/](https://www.inegi.org.mx/app/api/denue/).
2. Solicita acceso a la API — el token llega por correo en 1–3 días hábiles.
3. El token tiene el formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

> Sin este token el servidor devuelve `503` al cargar el mapa de negocios. El resto de la app (registro, análisis de IA, guía, exportar PDF) funciona con normalidad.

---

## 4. Levantar en desarrollo

```sh
npm run dev
```

Abre `http://localhost:5173`.

La base de datos SQLite se crea automáticamente en `data/negocia.db` al primer request que la necesite. No es necesario ejecutar migraciones manualmente.

---

## 5. Otros comandos útiles

```sh
npm run check        # type-check completo (svelte-check + tsc)
npm run lint         # prettier + eslint (solo reporta)
npm run format       # prettier --write (aplica formato)
npm run build        # compilar para producción → carpeta build/
npm run preview      # previsualizar el build de producción
```

---

## 6. Producción con Node.js

```sh
npm run build
PORT=3000 node build
```

Para un puerto distinto cambia `PORT`. El adaptador es `@sveltejs/adapter-node`; no requiere nada más que Node.js en el servidor.

Si usas un proxy reverso (nginx, Caddy), apunta al puerto configurado. Ejemplo mínimo con Caddy:

```
example.com {
    reverse_proxy localhost:3000
}
```

---

## 7. Estructura de archivos de configuración

```
.env              # variables de entorno (no commitear — está en .gitignore)
.env.example      # plantilla pública con comentarios
.secret           # token INEGI DENUE (no commitear — está en .gitignore)
data/negocia.db   # base de datos SQLite (no commitear — está en .gitignore)
```

---

## 8. Problemas frecuentes

**`Error: GEMINI_API_KEY no configurada`**
— Falta el archivo `.env` o la variable está vacía. Repite el paso 2.

**`503 Servicio DENUE no configurado`**
— Falta el archivo `.secret` o el token es incorrecto. Repite el paso 3.

**`El modelo devolvió una respuesta con formato inválido`**
— Gemini ocasionalmente falla con el modelo thinking. Presiona **Reintentar** o cambia `GEMINI_MODEL=gemini-2.0-flash` en `.env`.

**`SQLITE_CANTOPEN` al arrancar**
— El directorio `data/` no existe o no tiene permisos de escritura. Crea el directorio: `mkdir -p data`.

**Puerto 5173 en uso**
— Vite elige el siguiente disponible automáticamente y lo muestra en la terminal.
