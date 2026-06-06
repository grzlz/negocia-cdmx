<script lang="ts">
	import { resolve } from '$app/paths';
	import Brand from '$lib/components/Brand.svelte';

	const features = [
		{ t: 'Viabilidad por zona', d: 'Afluencia y competencia antes de invertir.' },
		{ t: 'Trámites en orden', d: 'Qué documentos, en qué ventanilla y en qué secuencia.' },
		{ t: 'Programas CDMX', d: 'Apoyos y programas de emprendimiento disponibles.' }
	];
</script>

<svelte:head>
	<title>NegociaCDMX — Viabilidad de negocios en la Ciudad de México</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<header class="border-b border-neutral-200 bg-white">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<Brand />
			<a href={resolve('/iniciar-sesion')} class="text-sm font-medium text-gob hover:underline">
				Iniciar sesión
			</a>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-6">
		<section class="py-16 text-center sm:py-24">
			<h1 class="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
				¿Tu idea de negocio es <span class="text-gob">viable</span> en la zona que elegiste?
			</h1>
			<p class="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
				Descubre la afluencia y competencia de tu zona, conoce los trámites y permisos que
				necesitas, y participa en los programas de emprendimiento de la Ciudad de México.
			</p>

			<div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a
					href={resolve('/registro')}
					class="w-full rounded-lg bg-gob px-8 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-gob-dark sm:w-auto"
				>
					Registro
				</a>
				<a
					href={resolve('/iniciar-sesion')}
					class="w-full rounded-lg border border-gob px-8 py-3 text-center font-semibold text-gob transition hover:bg-gob-soft sm:w-auto"
				>
					Iniciar sesión
				</a>
				<a
					href={resolve('/demo')}
					class="w-full rounded-lg border border-neutral-300 px-8 py-3 text-center font-semibold text-neutral-700 transition hover:bg-neutral-100 sm:w-auto"
				>
					Ver demo
				</a>
			</div>
		</section>

		<section class="grid gap-6 pb-20 sm:grid-cols-3">
			{#each features as item (item.t)}
				<div class="rounded-xl border border-neutral-200 bg-white p-6">
					<h3 class="font-semibold text-gob">{item.t}</h3>
					<p class="mt-2 text-sm text-neutral-600">{item.d}</p>
				</div>
			{/each}
		</section>
	</main>
</div>
