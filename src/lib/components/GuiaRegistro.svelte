<script lang="ts">
	import type { PasoGuia, GuiaResponse } from '../../routes/api/guia-registro/+server';

	interface Props {
		giro?: string;
		ramo?: string;
		zona?: string;
	}

	let { giro = 'comercio', ramo = '', zona = 'Ciudad de México' }: Props = $props();

	// ── Estado de la guía ────────────────────────────────────────────────────
	type Estado = 'idle' | 'loading' | 'done' | 'error';
	let estado = $state<Estado>('idle');
	let errorMsg = $state('');
	let guia = $state<GuiaResponse | null>(null);

	// ── Estado de progreso (checklist) ───────────────────────────────────────
	// Clave de localStorage basada en giro + zona para que cada contexto tenga su progreso.
	const claveStorage = $derived(`guia-progreso:${giro}:${zona}`);

	// Pasos completados: Set de números de paso.
	let completados = $state<Set<number>>(new Set());

	// Carga progreso guardado cuando la guía se muestra.
	function cargarProgreso() {
		try {
			const raw = localStorage.getItem(claveStorage);
			if (!raw) return;
			const arr = JSON.parse(raw) as number[];
			completados = new Set(arr);
		} catch {
			completados = new Set();
		}
	}

	function guardarProgreso(nuevos: Set<number>) {
		try {
			localStorage.setItem(claveStorage, JSON.stringify([...nuevos]));
		} catch {
			// localStorage no disponible (SSR o privado), ignorar.
		}
	}

	function togglePaso(numero: number) {
		const siguiente = new Set(completados);
		if (siguiente.has(numero)) {
			siguiente.delete(numero);
		} else {
			siguiente.add(numero);
		}
		completados = siguiente;
		guardarProgreso(siguiente);
	}

	function reiniciarProgreso() {
		completados = new Set();
		guardarProgreso(new Set());
	}

	// ── Derivados ────────────────────────────────────────────────────────────
	const total = $derived(guia?.pasos.length ?? 0);
	const hechos = $derived(completados.size);
	const porcentaje = $derived(total > 0 ? Math.round((hechos / total) * 100) : 0);

	// Fases únicas en orden de aparición.
	const fases = $derived(
		guia
			? [...new Map(guia.pasos.map((p) => [p.fase, p.fase])).keys()]
			: []
	);

	function pasosDeFase(fase: string): PasoGuia[] {
		return guia?.pasos.filter((p) => p.fase === fase) ?? [];
	}

	function faseCompleta(fase: string): boolean {
		return pasosDeFase(fase).every((p) => completados.has(p.numero));
	}

	// ── Generación ───────────────────────────────────────────────────────────
	async function generarGuia() {
		estado = 'loading';
		errorMsg = '';
		guia = null;

		try {
			const res = await fetch('/api/guia-registro', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ giro, ramo, zona })
			});

			if (!res.ok) {
				const err = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(err.error ?? `Error ${res.status}`);
			}

			const data = (await res.json()) as GuiaResponse;
			guia = data;
			estado = 'done';
			cargarProgreso();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Error desconocido';
			estado = 'error';
		}
	}
</script>

<div class="rounded-xl border border-neutral-200 bg-white">
	<!-- Encabezado -->
	<div class="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4">
		<div>
			<h3 class="text-sm font-semibold text-neutral-800">Guía de registro empresarial</h3>
			<p class="mt-0.5 text-xs text-neutral-500">
				Pasos oficiales para constituir tu negocio legalmente en la CDMX.
			</p>
		</div>
		{#if estado !== 'loading'}
			<button
				onclick={generarGuia}
				class="shrink-0 rounded-lg bg-gob px-4 py-2 text-xs font-semibold text-white transition hover:bg-gob-dark"
			>
				{estado === 'done' ? 'Regenerar' : 'Obtener guía'}
			</button>
		{/if}
	</div>

	<!-- Cuerpo -->
	{#if estado === 'idle'}
		<div class="px-5 py-5">
			<p class="text-sm text-neutral-500">
				Presiona <strong class="text-neutral-700">Obtener guía</strong> para recibir los pasos personalizados
				para tu giro: RFC, uso de suelo, licencia de funcionamiento, IMSS y trámites específicos.
			</p>
		</div>

	{:else if estado === 'loading'}
		<div class="flex items-center gap-3 px-5 py-6">
			<span class="relative flex h-6 w-6 shrink-0">
				<span
					class="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-gob/30 border-t-gob"
				></span>
			</span>
			<p class="text-sm text-neutral-600">Generando guía personalizada con IA…</p>
		</div>

	{:else if estado === 'error'}
		<div class="px-5 py-4">
			<p class="text-sm text-red-700">{errorMsg}</p>
			<button onclick={generarGuia} class="mt-2 text-xs font-medium text-gob hover:underline">
				Reintentar
			</button>
		</div>

	{:else if estado === 'done' && guia}
		<div class="px-5 py-5">
			<!-- Título y resumen -->
			{#if guia.titulo}
				<h4 class="text-base font-semibold text-neutral-900">{guia.titulo}</h4>
			{/if}
			{#if guia.resumen}
				<p class="mt-1 text-xs text-neutral-500">{guia.resumen}</p>
			{/if}

			<!-- Barra de progreso -->
			<div class="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-neutral-700">
						Progreso: {hechos} de {total} pasos completados
					</span>
					<span
						class="text-xs font-bold
							{porcentaje === 100
							? 'text-green-600'
							: porcentaje >= 50
								? 'text-amber-600'
								: 'text-neutral-500'}"
					>
						{porcentaje}%
					</span>
				</div>
				<div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
					<div
						class="h-full rounded-full transition-all duration-500
							{porcentaje === 100 ? 'bg-green-500' : porcentaje >= 50 ? 'bg-amber-400' : 'bg-gob'}"
						style="width: {porcentaje}%"
					></div>
				</div>
				{#if porcentaje === 100}
					<p class="mt-2 text-xs font-medium text-green-700">
						¡Completaste todos los pasos! Tu negocio está listo para operar legalmente.
					</p>
				{/if}
			</div>

			<!-- Fases con pasos -->
			<div class="mt-5 space-y-5">
				{#each fases as fase (fase)}
					{@const pasos = pasosDeFase(fase)}
					{@const completa = faseCompleta(fase)}
					<div>
						<!-- Encabezado de fase -->
						<div class="mb-2 flex items-center gap-2">
							<span
								class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold
									{completa ? 'bg-green-100 text-green-700' : 'bg-gob-soft text-gob-dark'}"
							>
								{#if completa}✓{:else}{fases.indexOf(fase) + 1}{/if}
							</span>
							<h5 class="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
								{fase}
							</h5>
							{#if completa}
								<span class="text-xs font-medium text-green-600">Completada</span>
							{/if}
						</div>

						<!-- Lista de pasos -->
						<div class="space-y-2 pl-1">
							{#each pasos as paso (paso.numero)}
								{@const hecho = completados.has(paso.numero)}
								<label
									class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition
										{hecho
										? 'border-green-200 bg-green-50'
										: 'border-neutral-200 bg-white hover:border-gob/40 hover:bg-gob-soft/40'}"
								>
									<!-- Checkbox -->
									<input
										type="checkbox"
										checked={hecho}
										onchange={() => togglePaso(paso.numero)}
										class="mt-0.5 h-4 w-4 shrink-0 accent-gob"
									/>

									<div class="min-w-0 flex-1">
										<!-- Número + título -->
										<div class="flex flex-wrap items-center gap-2">
											<span
												class="text-xs font-bold
													{hecho ? 'text-green-700 line-through' : 'text-gob-dark'}"
											>
												Paso {paso.numero}
											</span>
											<span
												class="text-sm font-semibold
													{hecho ? 'text-neutral-400 line-through' : 'text-neutral-800'}"
											>
												{paso.titulo}
											</span>
											{#if !paso.obligatorio}
												<span
													class="rounded-full border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500"
												>
													Opcional
												</span>
											{/if}
										</div>

										<!-- Descripción -->
										{#if paso.descripcion}
											<p class="mt-1 text-xs leading-relaxed text-neutral-600">
												{paso.descripcion}
											</p>
										{/if}

										<!-- Metadatos -->
										<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
											{#if paso.dependencia}
												<span class="font-medium text-neutral-700">{paso.dependencia}</span>
											{/if}
											{#if paso.costo}
												<span>💰 {paso.costo}</span>
											{/if}
											{#if paso.tiempo}
												<span>⏱ {paso.tiempo}</span>
											{/if}
											{#if paso.url}
												<a
													href="https://{paso.url.replace(/^https?:\/\//, '')}"
													target="_blank"
													rel="noopener noreferrer"
													class="text-gob hover:underline"
													onclick={(e) => e.stopPropagation()}
												>
													🔗 {paso.url}
												</a>
											{/if}
										</div>

										<!-- Advertencia -->
										{#if paso.advertencia}
											<p
												class="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800"
											>
												⚠️ {paso.advertencia}
											</p>
										{/if}
									</div>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Acciones al pie -->
			<div class="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
				<p class="text-xs text-neutral-400">
					Tu progreso se guarda automáticamente en este dispositivo.
				</p>
				{#if hechos > 0}
					<button
						onclick={reiniciarProgreso}
						class="text-xs text-neutral-400 transition hover:text-red-500"
					>
						Reiniciar progreso
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
