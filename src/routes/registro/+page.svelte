<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Brand from '$lib/components/Brand.svelte';
	import Field from '$lib/components/Field.svelte';
	import SasInfo from '$lib/components/SasInfo.svelte';
	import { GIROS, RAMOS, nuevoRegistro, validarDueno, validarNegocio } from '$lib/registro';

	const PASOS = ['Dueño del negocio', 'Tu negocio'];

	let paso = $state(0);
	let registro = $state(nuevoRegistro());
	let errores = $state<string[]>([]);

	function continuar() {
		errores = validarDueno(registro.dueno);
		if (errores.length === 0) paso = 1;
	}

	function regresar() {
		errores = [];
		paso = 0;
	}

	function enviar() {
		errores = validarNegocio(registro.negocio);
		if (errores.length > 0) return;
		// Por ahora persistimos en memoria/sesión; aquí conectaría el backend.
		sessionStorage.setItem('registro', JSON.stringify(registro));
		goto(resolve('/demo'));
	}
</script>

<svelte:head>
	<title>Registro — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<header class="border-b border-neutral-200 bg-white">
		<div class="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
			<Brand />
			<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
		</div>
	</header>

	<main class="mx-auto max-w-2xl px-6 py-10">
		<!-- Indicador de pasos -->
		<ol class="mb-8 flex items-center gap-4">
			{#each PASOS as etiqueta, i (etiqueta)}
				<li class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition
							{i <= paso ? 'bg-gob text-white' : 'bg-neutral-200 text-neutral-500'}"
					>
						{i + 1}
					</span>
					<span class="text-sm font-medium {i === paso ? 'text-gob' : 'text-neutral-500'}">
						{etiqueta}
					</span>
				</li>
				{#if i < PASOS.length - 1}
					<li class="h-px flex-1 bg-neutral-200"></li>
				{/if}
			{/each}
		</ol>

		{#if errores.length > 0}
			<div class="mb-6 rounded-lg border border-gob/30 bg-gob-soft px-4 py-3 text-sm text-gob-dark">
				<ul class="list-inside list-disc space-y-1">
					{#each errores as e (e)}<li>{e}</li>{/each}
				</ul>
			</div>
		{/if}

		<div class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
			{#if paso === 0}
				<h2 class="mb-1 text-xl font-semibold text-neutral-900">Datos del dueño</h2>
				<p class="mb-6 text-sm text-neutral-500">
					Cuéntanos quién está detrás de la idea de negocio.
				</p>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="sm:col-span-2">
						<Field label="Nombre" bind:value={registro.dueno.nombre} required />
					</div>
					<Field label="Apellido paterno" bind:value={registro.dueno.apellidoPaterno} required />
					<Field label="Apellido materno" bind:value={registro.dueno.apellidoMaterno} />
					<Field
						label="Teléfono"
						type="tel"
						bind:value={registro.dueno.telefono}
						maxlength={10}
						placeholder="10 dígitos"
						required
					/>
					<Field
						label="Correo"
						type="email"
						bind:value={registro.dueno.correo}
						placeholder="correo@ejemplo.com"
						required
					/>
				</div>

				<div class="mt-8 flex justify-end">
					<button
						onclick={continuar}
						class="rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
					>
						Continuar
					</button>
				</div>
			{:else}
				<h2 class="mb-1 text-xl font-semibold text-neutral-900">Datos del negocio</h2>
				<p class="mb-6 text-sm text-neutral-500">Información de la empresa que quieres abrir.</p>

				<div class="grid gap-4">
					<Field label="Nombre del negocio" bind:value={registro.negocio.nombre} required />

					<!-- Checkbox de razón social -->
					<label
						class="flex items-start gap-3 rounded-lg border border-neutral-300 p-3 transition hover:border-gob"
					>
						<input
							type="checkbox"
							bind:checked={registro.negocio.tieneRazonSocial}
							class="mt-0.5 h-4 w-4 accent-gob"
						/>
						<span class="text-sm">
							<span class="font-medium text-neutral-800">¿Ya cuentas con razón social?</span>
							<span class="block text-neutral-500">
								Marca esta casilla si ya constituiste una figura moral (sociedad).
							</span>
						</span>
					</label>

					<!-- Campos dinámicos según la respuesta -->
					{#if registro.negocio.tieneRazonSocial}
						<div class="grid gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-2">
							<div class="sm:col-span-2">
								<Field label="Razón social" bind:value={registro.negocio.razonSocial} required />
							</div>
							<Field
								label="RFC"
								bind:value={registro.negocio.rfc}
								maxlength={13}
								placeholder="ABC123456XYZ"
								hint="Persona moral (12) o física (13 caracteres)."
								required
							/>
						</div>
					{:else}
						<SasInfo />
					{/if}

					<!-- Giro -->
					<div>
						<span class="mb-1 block text-sm font-medium text-neutral-700">
							Giro <span class="text-gob">*</span>
						</span>
						<div class="flex flex-wrap gap-2">
							{#each GIROS as g (g.value)}
								<label
									class="cursor-pointer rounded-lg border px-4 py-2 text-sm transition
										{registro.negocio.giro === g.value
										? 'border-gob bg-gob-soft text-gob-dark'
										: 'border-neutral-300 text-neutral-600 hover:border-gob'}"
								>
									<input
										type="radio"
										value={g.value}
										bind:group={registro.negocio.giro}
										class="sr-only"
									/>
									{g.label}
								</label>
							{/each}
						</div>
					</div>

					<!-- Ramo -->
					<label class="block">
						<span class="mb-1 block text-sm font-medium text-neutral-700">
							Ramo <span class="text-gob">*</span>
						</span>
						<select
							bind:value={registro.negocio.ramo}
							class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-gob focus:ring-2 focus:ring-gob/30"
						>
							<option value="" disabled>Selecciona un ramo</option>
							{#each RAMOS as r (r)}
								<option value={r}>{r}</option>
							{/each}
						</select>
					</label>
				</div>

				<div class="mt-8 flex justify-between">
					<button
						onclick={regresar}
						class="rounded-lg border border-neutral-300 px-6 py-2.5 font-semibold text-neutral-700 transition hover:bg-neutral-100"
					>
						Regresar
					</button>
					<button
						onclick={enviar}
						class="rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
					>
						Finalizar registro
					</button>
				</div>
			{/if}
		</div>
	</main>
</div>
