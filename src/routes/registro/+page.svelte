<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import Field from '$lib/components/Field.svelte';
	import PrivacyNotice from '$lib/components/PrivacyNotice.svelte';
	import SasInfo from '$lib/components/SasInfo.svelte';
	import {
		GIROS,
		RAMOS_POR_GIRO,
		advertenciaRFC,
		errorDe,
		nuevoRegistro,
		preparePersistRegistro,
		validarDueno,
		validarNegocio,
		type ValidationError
	} from '$lib/registro';
	import { registroStore } from '$lib/registro.svelte';

	const PASOS = ['Dueño del negocio', 'Tu negocio'] as const;

	let paso = $state(0);
	let registro = $state(nuevoRegistro());
	let errores = $state<ValidationError[]>([]);
	let advertenciaRfcActiva = $state<string | null>(null);
	let consent = $state(false);
	let enviando = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);

	// Derivados de ramos según el giro elegido.
	const ramosDisponibles = $derived(
		registro.negocio.giro ? RAMOS_POR_GIRO[registro.negocio.giro] : []
	);

	// Al desmarcar razón social, limpiar los campos asociados.
	function onRazonSocialChange(e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		registro.negocio.tieneRazonSocial = checked;
		if (!checked) {
			registro.negocio.razonSocial = '';
			registro.negocio.rfc = '';
			advertenciaRfcActiva = null;
		}
	}

	// Al cambiar de ramo fuera de la jerarquía del giro (caso edge), limpiarlo.
	$effect(() => {
		if (registro.negocio.giro && registro.negocio.ramo) {
			const ok = RAMOS_POR_GIRO[registro.negocio.giro].includes(registro.negocio.ramo);
			if (!ok) registro.negocio.ramo = '';
		}
	});

	async function continuar() {
		errores = validarDueno(registro.dueno);
		if (errores.length > 0) {
			enfocarPrimerError();
			return;
		}
		if (!consent) {
			errores = [
				{
					field: 'consent',
					message: 'Debes aceptar el aviso de privacidad para continuar.'
				}
			];
			// Foco al checkbox de consentimiento.
			document.getElementById('consent')?.focus();
			return;
		}
		paso = 1;
		errores = [];
	}

	function regresar() {
		errores = [];
		paso = 0;
	}

	async function enviar() {
		if (enviando) return;
		errores = validarNegocio(registro.negocio);
		if (errores.length > 0) {
			enfocarPrimerError();
			return;
		}

		enviando = true;
		try {
			await preparePersistRegistro(registro);
			registroStore.set(registro);
			await goto(resolve('/demo'));
		} finally {
			enviando = false;
		}
	}

	function enfocarPrimerError() {
		// Espera al siguiente tick para que el DOM pinte los aria-invalid=true.
		queueMicrotask(() => {
			const el = formEl?.querySelector<HTMLElement>('[aria-invalid="true"]');
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				el.focus();
			}
		});
	}
</script>

<svelte:head>
	<title>Registro — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<SiteHeader maxWidth="2xl">
		<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
	</SiteHeader>

	<div class="mx-auto max-w-2xl px-6 py-10">
		<!-- Indicador de pasos -->
		<ol class="mb-8 flex items-center gap-4" aria-label="Progreso del registro">
			{#each PASOS as etiqueta, i (etiqueta)}
				<li class="flex items-center gap-2" aria-current={i === paso ? 'step' : undefined}>
					<span
						class="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition
							{i <= paso ? 'bg-gob text-white' : 'bg-neutral-200 text-neutral-500'}"
						aria-hidden="true"
					>
						{i + 1}
					</span>
					<span class="text-sm font-medium {i === paso ? 'text-gob' : 'text-neutral-500'}">
						{etiqueta}
					</span>
				</li>
				{#if i < PASOS.length - 1}
					<li class="h-px flex-1 bg-neutral-200" aria-hidden="true"></li>
				{/if}
			{/each}
		</ol>

		{#if errores.length > 0}
			<div
				role="alert"
				aria-live="polite"
				class="mb-6 rounded-lg border border-gob/30 bg-gob-soft px-4 py-3 text-sm text-gob-dark"
			>
				<p class="font-semibold">
					{errores.length === 1 ? 'Revisa este campo:' : `Revisa estos ${errores.length} campos:`}
				</p>
				<ul class="mt-1 list-inside list-disc space-y-0.5">
					{#each errores as er (er.field)}
						<li>{er.message}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<form
			bind:this={formEl}
			novalidate
			class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
		>
			{#if paso === 0}
				<h2 class="mb-1 text-xl font-semibold text-neutral-900">Datos del dueño</h2>
				<p class="mb-6 text-sm text-neutral-500">
					Cuéntanos quién está detrás de la idea de negocio.
				</p>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="sm:col-span-2">
						<Field
							label="Nombre"
							name="nombre"
							autocomplete="given-name"
							bind:value={registro.dueno.nombre}
							required
							error={errorDe(errores, 'nombre')}
						/>
					</div>
					<Field
						label="Apellido paterno"
						name="apellidoPaterno"
						autocomplete="family-name"
						bind:value={registro.dueno.apellidoPaterno}
						required
						error={errorDe(errores, 'apellidoPaterno')}
					/>
					<Field
						label="Apellido materno"
						name="apellidoMaterno"
						autocomplete="additional-name"
						bind:value={
							() => registro.dueno.apellidoMaterno ?? '',
							(v) => (registro.dueno.apellidoMaterno = v || undefined)
						}
						error={errorDe(errores, 'apellidoMaterno')}
					/>
					<Field
						label="Teléfono"
						name="telefono"
						type="tel"
						inputmode="tel"
						autocomplete="tel"
						bind:value={registro.dueno.telefono}
						maxlength={10}
						minlength={10}
						placeholder="10 dígitos"
						required
						error={errorDe(errores, 'telefono')}
					/>
					<Field
						label="Correo"
						name="correo"
						type="email"
						inputmode="email"
						autocomplete="email"
						bind:value={registro.dueno.correo}
						placeholder="correo@ejemplo.com"
						required
						error={errorDe(errores, 'correo')}
					/>
				</div>

				<div class="mt-6">
					<label class="flex items-start gap-3 text-sm">
						<input
							id="consent"
							type="checkbox"
							bind:checked={consent}
							aria-required="true"
							aria-invalid={errorDe(errores, 'consent') ? 'true' : undefined}
							aria-describedby={errorDe(errores, 'consent') ? 'consent-error' : undefined}
							class="mt-1 h-4 w-4 accent-gob"
						/>
						<span class="text-neutral-700">
							Acepto el
							<a
								href="#aviso-de-privacidad"
								class="font-medium text-gob underline-offset-2 hover:underline"
							>
								aviso de privacidad
							</a>
							y el tratamiento de mis datos personales conforme a la LFPDPPP.
						</span>
					</label>
					{#if errorDe(errores, 'consent')}
						<p id="consent-error" role="alert" class="mt-1 text-xs font-medium text-gob-dark">
							{errorDe(errores, 'consent')}
						</p>
					{/if}
				</div>

				<div class="mt-8 flex justify-end">
					<button
						type="button"
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
					<Field
						label="Nombre del negocio"
						name="nombreNegocio"
						bind:value={registro.negocio.nombre}
						required
						error={errorDe(errores, 'nombre')}
					/>

					<!-- Checkbox de razón social -->
					<label
						class="flex items-start gap-3 rounded-lg border border-neutral-300 p-3 transition hover:border-gob"
					>
						<input
							type="checkbox"
							checked={registro.negocio.tieneRazonSocial}
							onchange={onRazonSocialChange}
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
								<Field
									label="Razón social"
									name="razonSocial"
									bind:value={registro.negocio.razonSocial}
									required
									error={errorDe(errores, 'razonSocial')}
								/>
							</div>
							<div class="sm:col-span-2">
								<Field
									label="RFC"
									name="rfc"
									bind:value={registro.negocio.rfc}
									maxlength={13}
									minlength={12}
									placeholder="ABC123456XYZ"
									hint="Persona moral (12) o física (13 caracteres)."
									autocomplete="off"
									required
									error={errorDe(errores, 'rfc')}
									onblur={() => {
										advertenciaRfcActiva = advertenciaRFC(registro.negocio.rfc);
									}}
								/>
								{#if advertenciaRfcActiva && !errorDe(errores, 'rfc')}
									<p role="status" class="mt-1 text-xs font-medium text-amber-700">
										⚠ {advertenciaRfcActiva}
									</p>
								{/if}
							</div>
						</div>
					{:else}
						<SasInfo />
					{/if}

					<!-- Giro -->
					<fieldset>
						<legend class="mb-1 block text-sm font-medium text-neutral-700">
							Giro <span class="text-gob" aria-hidden="true">*</span>
						</legend>
						<div
							class="flex flex-wrap gap-2"
							role="radiogroup"
							aria-required="true"
							aria-invalid={errorDe(errores, 'giro') ? 'true' : undefined}
						>
							{#each GIROS as g (g.value)}
								<label
									class="cursor-pointer rounded-lg border px-4 py-2 text-sm transition
										{registro.negocio.giro === g.value
										? 'border-gob bg-gob-soft text-gob-dark'
										: 'border-neutral-300 text-neutral-600 hover:border-gob'}"
								>
									<input
										type="radio"
										name="giro"
										value={g.value}
										bind:group={registro.negocio.giro}
										class="sr-only"
									/>
									{g.label}
								</label>
							{/each}
						</div>
						{#if errorDe(errores, 'giro')}
							<p role="alert" class="mt-1 text-xs font-medium text-gob-dark">
								{errorDe(errores, 'giro')}
							</p>
						{/if}
					</fieldset>

					<!-- Ramo -->
					<label class="block">
						<span class="mb-1 block text-sm font-medium text-neutral-700">
							Ramo <span class="text-gob" aria-hidden="true">*</span>
						</span>
						<select
							name="ramo"
							bind:value={registro.negocio.ramo}
							disabled={!registro.negocio.giro}
							aria-required="true"
							aria-invalid={errorDe(errores, 'ramo') ? 'true' : undefined}
							class="w-full rounded-lg border bg-white px-3 py-2 transition outline-none
								focus:ring-2 focus:ring-gob/30 focus:ring-offset-2 focus:ring-offset-white
								disabled:cursor-not-allowed disabled:bg-neutral-100
								{errorDe(errores, 'ramo') ? 'border-gob focus:border-gob' : 'border-neutral-300 focus:border-gob'}"
						>
							<option value="" disabled>
								{registro.negocio.giro ? 'Selecciona un ramo' : 'Primero elige un giro'}
							</option>
							{#each ramosDisponibles as r (r)}
								<option value={r}>{r}</option>
							{/each}
						</select>
						{#if errorDe(errores, 'ramo')}
							<p role="alert" class="mt-1 text-xs font-medium text-gob-dark">
								{errorDe(errores, 'ramo')}
							</p>
						{/if}
					</label>
				</div>

				<div class="mt-8 flex justify-between">
					<button
						type="button"
						onclick={regresar}
						class="rounded-lg border border-neutral-300 px-6 py-2.5 font-semibold text-neutral-700 transition hover:bg-neutral-100"
					>
						Regresar
					</button>
					<button
						type="button"
						onclick={enviar}
						disabled={enviando}
						aria-busy={enviando}
						class="rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark disabled:cursor-not-allowed disabled:opacity-60"
					>
						{enviando ? 'Enviando…' : 'Finalizar registro'}
					</button>
				</div>
			{/if}
		</form>

		<details class="mt-8 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
			<summary class="cursor-pointer font-medium text-gob">Aviso de privacidad</summary>
			<div class="mt-3">
				<PrivacyNotice />
			</div>
		</details>
	</div>
</div>
