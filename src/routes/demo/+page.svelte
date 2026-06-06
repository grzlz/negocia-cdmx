<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Brand from '$lib/components/Brand.svelte';
	import { GIROS, type Registro } from '$lib/registro';

	let registro = $state<Registro | null>(null);

	onMount(() => {
		const raw = sessionStorage.getItem('registro');
		if (raw) registro = JSON.parse(raw) as Registro;
	});

	const giroLabel = $derived(GIROS.find((g) => g.value === registro?.negocio.giro)?.label ?? '—');
</script>

<svelte:head>
	<title>Demo — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<header class="border-b border-neutral-200 bg-white">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
			<Brand />
			<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-6 py-10">
		{#if registro}
			<div
				class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
			>
				¡Registro completo, {registro.dueno.nombre}! Este es un adelanto del análisis que
				prepararemos para <strong>{registro.negocio.nombre}</strong>.
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-xl border border-neutral-200 bg-white p-6">
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">Dueño</h2>
					<dl class="space-y-1 text-sm">
						<div>
							<dt class="inline text-neutral-500">Nombre:</dt>
							<dd class="inline">
								{registro.dueno.nombre}
								{registro.dueno.apellidoPaterno}
								{registro.dueno.apellidoMaterno}
							</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Teléfono:</dt>
							<dd class="inline">{registro.dueno.telefono}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Correo:</dt>
							<dd class="inline">{registro.dueno.correo}</dd>
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
							<dd class="inline">{registro.negocio.nombre}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Giro:</dt>
							<dd class="inline">{giroLabel}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Ramo:</dt>
							<dd class="inline">{registro.negocio.ramo || '—'}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Figura moral:</dt>
							<dd class="inline">
								{registro.negocio.tieneRazonSocial
									? `${registro.negocio.razonSocial} (RFC ${registro.negocio.rfc})`
									: 'Persona física / por constituir'}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<div
				class="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500"
			>
				<p class="font-medium text-neutral-700">Próximamente</p>
				<p class="mt-1 text-sm">
					Análisis de viabilidad por zona, afluencia, competencia, trámites y programas de la CDMX.
				</p>
			</div>
		{:else}
			<div class="rounded-xl border border-neutral-200 bg-white p-10 text-center">
				<p class="text-neutral-600">Aún no hay un registro en esta sesión.</p>
				<a
					href={resolve('/registro')}
					class="mt-4 inline-block rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
				>
					Comenzar registro
				</a>
			</div>
		{/if}
	</main>
</div>
