<script lang="ts">
	import { resolve } from '$app/paths';
	import Brand from '$lib/components/Brand.svelte';
	import Field from '$lib/components/Field.svelte';

	let correo = $state('');
	let password = $state('');
</script>

<svelte:head>
	<title>Iniciar sesión — NegociaCDMX</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-neutral-50">
	<header class="border-b border-neutral-200 bg-white">
		<div class="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
			<Brand />
			<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
		</div>
	</header>

	<main class="flex flex-1 items-center justify-center px-6 py-10">
		<div class="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
			<h1 class="mb-1 text-xl font-semibold text-neutral-900">Iniciar sesión</h1>
			<p class="mb-6 text-sm text-neutral-500">Accede a tu panel de emprendimiento.</p>

			<form class="grid gap-4" onsubmit={(e) => e.preventDefault()}>
				<Field label="Correo" type="email" bind:value={correo} placeholder="correo@ejemplo.com" />
				<Field label="Contraseña" type="password" bind:value={password} />
				<button
					type="submit"
					class="mt-2 rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
				>
					Entrar
				</button>
			</form>

			<p class="mt-6 text-center text-sm text-neutral-500">
				¿No tienes cuenta?
				<a href={resolve('/registro')} class="font-medium text-gob hover:underline">Regístrate</a>
			</p>
		</div>
	</main>
</div>
