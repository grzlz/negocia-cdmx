<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import MapaDenue from '$lib/components/MapaDenue.svelte';
	import Semaforo from '$lib/components/Semaforo.svelte';
	import ReporteCard from '$lib/components/ReporteCard.svelte';
	import { GIROS } from '$lib/registro';
	import type { AnalisisResultado, EstablecimientoDenue } from '$lib/viabilidad/types';
	import type { PageData } from './$types';
	import { exportarAnalisisPDF } from '$lib/pdf';

	let { data }: { data: PageData } = $props();

	function esNegocioValido(v: unknown): v is {
		nombre: string;
		giro: string;
		ramo: string | null;
		tiene_razon_social: number;
		razon_social: string | null;
		rfc: string | null;
		cp: string | null;
		calle: string | null;
		colonia: string | null;
	} {
		if (!v || typeof v !== 'object') return false;
		const n = v as Record<string, unknown>;
		return (
			typeof n.nombre === 'string' &&
			typeof n.giro === 'string' &&
			(n.tiene_razon_social === 0 || n.tiene_razon_social === 1)
		);
	}

	const giroLabel = $derived(GIROS.find((g) => g.value === data.negocio?.giro)?.label ?? '—');
	const giroValue = $derived(
		typeof data.negocio?.giro === 'string' ? data.negocio.giro : 'servicios'
	);

	// Palabra clave para DENUE: ramo específico o giro genérico como fallback.
	const keyword = $derived(
		esNegocioValido(data.negocio)
			? (data.negocio.ramo?.toLowerCase() ?? data.negocio.giro ?? 'comercio')
			: 'comercio'
	);

	// Zona para el análisis de IA: colonia + alcaldía inferida del CP.
	const zonaAnalisis = $derived(() => {
		if (!esNegocioValido(data.negocio)) return 'CDMX';
		const colonia = data.negocio.colonia ?? '';
		const cp = data.negocio.cp ?? '';
		return [colonia, cp ? `CP ${cp}` : ''].filter(Boolean).join(', ') || 'CDMX';
	});

	// --- Estado del análisis de viabilidad (IA) ---
	type Estado = 'idle' | 'loading' | 'done' | 'error';
	let estado = $state<Estado>('idle');
	let mensajeLoadingIdx = $state(0);
	let resultado = $state<AnalisisResultado | null>(null);
	let errorMsg = $state<string | null>(null);

	const mensajesLoading = [
		'Cargando establecimientos de la zona…',
		'Analizando competencia con IA…',
		'Calculando semáforo de viabilidad…',
		'Generando reporte final…'
	];

	let timerMensaje: ReturnType<typeof setInterval> | null = null;
	let abortController: AbortController | null = null;

	function arrancarMensajes() {
		mensajeLoadingIdx = 0;
		timerMensaje = setInterval(() => {
			mensajeLoadingIdx = (mensajeLoadingIdx + 1) % mensajesLoading.length;
		}, 1200);
	}

	function detenerMensajes() {
		if (timerMensaje) {
			clearInterval(timerMensaje);
			timerMensaje = null;
		}
	}

	async function generarAnalisis() {
		if (!data.negocio) return;

		estado = 'loading';
		errorMsg = null;
		resultado = null;
		arrancarMensajes();
		abortController = new AbortController();

		try {
			const res = await fetch('/api/viabilidad', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					negocio: {
						nombre: data.negocio.nombre,
						giro: giroValue,
						ramo: data.negocio.ramo ?? 'Sin ramo',
						zona: zonaAnalisis()
					}
				}),
				signal: abortController.signal
			});

			if (!res.ok) {
				const errBody = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(errBody.error ?? `Error ${res.status}`);
			}

			const json = (await res.json()) as AnalisisResultado;
			resultado = json;
			estado = 'done';
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			errorMsg = err instanceof Error ? err.message : 'Error de red';
			estado = 'error';
		} finally {
			detenerMensajes();
		}
	}

	function reintentar() {
		void generarAnalisis();
	}

	// Radar de bienvenida al cargar la página
	const MENSAJES_RADAR = [
		'Registrando tu negocio…',
		'Consultando el DENUE en tu zona…',
		'Analizando competencia del mercado…',
		'Preparando tu análisis de viabilidad…'
	];
	let mensajeRadarIdx = $state(0);
	let mostrarRadar = $state(false);
	let timerRadar: ReturnType<typeof setInterval> | null = null;

	function iniciarRadar() {
		mostrarRadar = true;
		mensajeRadarIdx = 0;
		timerRadar = setInterval(() => {
			mensajeRadarIdx = (mensajeRadarIdx + 1) % MENSAJES_RADAR.length;
		}, 1400);
		setTimeout(() => {
			if (timerRadar) clearInterval(timerRadar);
			mostrarRadar = false;
		}, 3000);
	}

	// Auto-arranca al cargar la página si hay registro válido.
	let yaArranco = false;
	onMount(() => {
		if (yaArranco) return;
		yaArranco = true;
		if (data.usuario && esNegocioValido(data.negocio)) {
			iniciarRadar();
			void generarAnalisis();
		}
	});

	onDestroy(() => {
		detenerMensajes();
		abortController?.abort();
	});

	const competencia: EstablecimientoDenue[] = $derived(resultado?.competencia_considerada ?? []);

	// ── Exportar PDF ──────────────────────────────────────────────────────────
	let exportando = $state(false);

	async function exportarPDF() {
		if (!resultado || !esNegocioValido(data.negocio) || !data.usuario) return;
		exportando = true;
		try {
			await exportarAnalisisPDF(
				resultado,
				{
					nombre: data.negocio.nombre,
					giro: giroLabel,
					ramo: data.negocio.ramo,
					cp: data.negocio.cp,
					calle: data.negocio.calle,
					colonia: data.negocio.colonia
				},
				{
					nombre: String(data.usuario.nombre ?? ''),
					apellido_pat: String(data.usuario.apellido_pat ?? ''),
					apellido_mat: data.usuario.apellido_mat ? String(data.usuario.apellido_mat) : undefined
				}
			);
		} finally {
			exportando = false;
		}
	}
</script>

<svelte:head>
	<title>Demo — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<SiteHeader maxWidth="3xl">
		<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
	</SiteHeader>

	<div class="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
		{#if data.usuario && esNegocioValido(data.negocio)}
			<div
				role="status"
				aria-live="polite"
				class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
			>
				¡Registro completo, {data.usuario.nombre}! Este es el análisis de viabilidad para
				<strong>{data.negocio.nombre}</strong>.
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-xl border border-neutral-200 bg-white p-6">
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">Dueño</h2>
					<dl class="space-y-1 text-sm">
						<div>
							<dt class="inline text-neutral-500">Nombre:</dt>
							<dd class="inline">
								{data.usuario.nombre}
								{data.usuario.apellido_pat}
								{data.usuario.apellido_mat ?? ''}
							</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Teléfono:</dt>
							<dd class="inline">{data.usuario.telefono}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Correo:</dt>
							<dd class="inline">{data.usuario.correo}</dd>
						</div>
					</dl>
				</div>
				<div class="rounded-xl border border-neutral-200 bg-white p-6">
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">
						Negocio
					</h2>
					<dl class="space-y-1 text-sm">
						<div>
							<dt class="inline text-neutral-500">Nombre:</dt>
							<dd class="inline">{data.negocio.nombre}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Giro:</dt>
							<dd class="inline">{giroLabel}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Ramo:</dt>
							<dd class="inline">{data.negocio.ramo ?? '—'}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Figura moral:</dt>
							<dd class="inline">
								{data.negocio.tiene_razon_social === 1
									? `${data.negocio.razon_social ?? ''} (RFC ${data.negocio.rfc ?? ''})`
									: 'Persona física / por constituir'}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<!-- Sección de negocios aledaños con DENUE (mapa del equipo) -->
			<div class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
				<div class="flex items-center justify-between gap-4 border-b border-neutral-200 px-6 py-4">
					<div>
						<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
							Negocios aledaños
						</h2>
						<p class="mt-1 text-sm text-neutral-600">
							Competencia dentro de 1 km en el giro <strong>{giroLabel}</strong> — datos del DENUE · INEGI.
						</p>
					</div>
					<span class="hidden text-xs text-neutral-400 sm:block">DENUE · INEGI</span>
				</div>
				<div class="p-6">
					<MapaDenue
						cp={data.negocio.cp}
						calle={data.negocio.calle}
						colonia={data.negocio.colonia}
						{keyword}
					/>
				</div>
			</div>

			<!-- Análisis de viabilidad (IA + semáforo) -->
			<section class="mt-8" aria-label="Análisis de viabilidad">
				<header class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-neutral-900">Análisis de viabilidad</h2>
					{#if estado !== 'loading'}
						<button
							type="button"
							onclick={reintentar}
							class="rounded-md px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
						>
							{estado === 'done' ? 'Regenerar' : 'Reintentar'}
						</button>
					{/if}
				</header>

				{#if estado === 'loading'}
					<div
						role="status"
						aria-live="polite"
						aria-busy="true"
						class="rounded-2xl border border-gob/30 bg-gob-soft p-8 shadow-sm"
					>
						<div class="flex items-center gap-4">
							<span class="inline-flex h-10 w-10 items-center justify-center" aria-hidden="true">
								<span
									class="absolute h-8 w-8 animate-spin rounded-full border-2 border-gob/30 border-t-gob"
								></span>
							</span>
							<div>
								<p class="text-sm font-medium text-gob-dark">
									{mensajesLoading[mensajeLoadingIdx]}
								</p>
								<p class="mt-0.5 text-xs text-neutral-600">
									Esto puede tomar entre 5 y 15 segundos.
								</p>
							</div>
						</div>
						<ol
							class="mt-6 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"
							aria-label="Etapas del análisis"
						>
							{#each mensajesLoading as m, i (i)}
								<li
									class="rounded-md border px-2 py-1.5 text-center
										{i === mensajeLoadingIdx
										? 'border-gob bg-white font-semibold text-gob-dark'
										: i < mensajeLoadingIdx
											? 'border-gob/30 bg-white/60 text-gob-dark'
											: 'border-neutral-200 bg-white/40 text-neutral-500'}"
								>
									{i + 1}. {m.replace('…', '').replace('…', '').trim()}
								</li>
							{/each}
						</ol>
					</div>
				{:else if estado === 'error'}
					<div
						role="alert"
						aria-live="assertive"
						class="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm"
					>
						<h3 class="text-sm font-semibold text-rose-800">No se pudo generar el análisis</h3>
						<p class="mt-1 text-sm text-rose-700">{errorMsg}</p>
						<p class="mt-2 text-xs text-rose-600">
							Verifica tu GEMINI_API_KEY en .env o inténtalo de nuevo.
						</p>
					</div>
				{:else if estado === 'done' && resultado}
					<div class="space-y-4">
						<Semaforo semaforo={resultado.semaforo} />
						<ReporteCard markdown={resultado.reporte_markdown} {competencia} />
						<p class="text-center text-xs text-neutral-500">
							Análisis generado el {new Date(resultado.generado_en).toLocaleString('es-MX', {
								dateStyle: 'medium',
								timeStyle: 'short'
							})}
						</p>

						<!-- Exportar PDF -->
						<div class="flex justify-center pt-1">
							<button
								type="button"
								onclick={exportarPDF}
								disabled={exportando}
								class="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-gob hover:bg-gob-soft hover:text-gob-dark disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if exportando}
									<span class="relative flex h-4 w-4">
										<span class="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-gob/30 border-t-gob"></span>
									</span>
									Generando PDF…
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="h-4 w-4 text-gob"
										aria-hidden="true"
									>
										<path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
										<path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
									</svg>
									Descargar análisis en PDF
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</section>
		{:else}
			<div class="rounded-xl border border-neutral-200 bg-white p-10 text-center">
				<p class="text-neutral-600">
					Aún no hay un registro en esta sesión. Si completaste el formulario, tus datos no se
					persisten en este dispositivo.
				</p>
				<a
					href={resolve('/registro')}
					class="mt-4 inline-block rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
				>
					Comenzar registro
				</a>
			</div>
		{/if}
	</div>
</div>

{#if mostrarRadar}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/95 backdrop-blur-sm"
		aria-live="polite"
		aria-label="Analizando tu negocio"
	>
		<div class="radar-screen">
			<div class="ring r1"></div>
			<div class="ring r2"></div>
			<div class="ring r3"></div>
			<div class="crosshair ch-v"></div>
			<div class="crosshair ch-h"></div>
			<div class="sweep"></div>
			<div class="center-dot"></div>
			<div class="blip b1"></div>
			<div class="blip b2"></div>
			<div class="blip b3"></div>
			<div class="blip b4"></div>
			<div class="blip b5"></div>
		</div>

		<div class="mt-8 text-center">
			<p class="text-lg font-semibold text-white">{MENSAJES_RADAR[mensajeRadarIdx]}</p>
			{#if data.negocio?.nombre}
				<p class="mt-1 text-sm" style="color:#a02142cc">{data.negocio.nombre}</p>
			{/if}
			<div class="mt-4 flex justify-center gap-1.5">
				{#each MENSAJES_RADAR as _, i}
					<div
						class="h-1.5 w-1.5 rounded-full transition-colors duration-300"
						style={i === mensajeRadarIdx ? 'background:#a02142' : 'background:#ffffff33'}
					></div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.radar-screen {
		position: relative;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		background: radial-gradient(circle, #0d1f12 0%, #050d08 100%);
		box-shadow:
			0 0 0 2px #a0214244,
			0 0 40px #a0214222,
			inset 0 0 30px #00000088;
		overflow: hidden;
	}
	.ring {
		position: absolute;
		border-radius: 50%;
		border: 1px solid #a0214233;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	.r1 { width: 100%; height: 100%; }
	.r2 { width: 66%; height: 66%; }
	.r3 { width: 33%; height: 33%; }
	.crosshair {
		position: absolute;
		background: #a0214222;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	.ch-v { width: 1px; height: 100%; }
	.ch-h { width: 100%; height: 1px; }
	.sweep {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: conic-gradient(from 0deg, transparent 75%, #a0214288 100%);
		animation: radar-spin 2.5s linear infinite;
	}
	.center-dot {
		position: absolute;
		top: 50%; left: 50%;
		width: 8px; height: 8px;
		border-radius: 50%;
		background: #a02142;
		transform: translate(-50%, -50%);
		box-shadow: 0 0 6px #a02142;
		z-index: 2;
	}
	.blip {
		position: absolute;
		width: 6px; height: 6px;
		border-radius: 50%;
		background: #a02142;
		box-shadow: 0 0 8px #a02142cc;
	}
	.b1 { top: 28%; left: 62%; animation: blip-pulse 2.5s 0.3s ease-in-out infinite; }
	.b2 { top: 55%; left: 75%; animation: blip-pulse 2.5s 0.9s ease-in-out infinite; }
	.b3 { top: 70%; left: 40%; animation: blip-pulse 2.5s 1.5s ease-in-out infinite; }
	.b4 { top: 35%; left: 30%; animation: blip-pulse 2.5s 2.0s ease-in-out infinite; }
	.b5 { top: 60%; left: 58%; animation: blip-pulse 2.5s 0.6s ease-in-out infinite; }
	@keyframes radar-spin {
		from { transform: rotate(0deg); }
		to   { transform: rotate(360deg); }
	}
	@keyframes blip-pulse {
		0%, 100% { opacity: 0; transform: scale(0.4); }
		50%       { opacity: 1; transform: scale(1); }
	}
</style>
