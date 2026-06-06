<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		/** Etiqueta visible del campo. */
		label: string;
		/** Valor bindable (two-way binding con el padre). */
		value: string;
		type?: HTMLInputAttributes['type'];
		/** Nombre del input. Útil para autofill, validación HTML5 y SSR. */
		name?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		maxlength?: number;
		minlength?: number;
		pattern?: string;
		inputmode?: 'text' | 'tel' | 'email' | 'numeric' | 'url' | 'search' | 'none';
		autocomplete?: HTMLInputAttributes['autocomplete'];
		/** Texto de ayuda. Se asocia al input con `aria-describedby`. */
		hint?: string;
		/** Mensaje de error. Si se pasa, marca el input con `aria-invalid="true"`. */
		error?: string;
		/** Override del `id` auto-generado. Útil cuando hay varios Fields con la misma label. */
		id?: string;
		/** Handler para cuando el input pierde el foco. */
		onblur?: (e: FocusEvent) => void;
	}

	let {
		label,
		value = $bindable(),
		type = 'text',
		name,
		placeholder = '',
		required = false,
		disabled = false,
		readonly = false,
		maxlength,
		minlength,
		pattern,
		inputmode,
		autocomplete,
		hint,
		error,
		id,
		onblur
	}: Props = $props();

	// Auto-id determinista, seguro para SSR/hidratación.
	const autoId = $derived(
		id ??
			`field-${label
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '')}`
	);
	const hintId = $derived(`${autoId}-hint`);
	const errorId = $derived(`${autoId}-error`);
	const describedBy = $derived(
		[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);
	const errorAttr = $derived(error ? 'true' : undefined);
	const requiredAttr = $derived(required ? 'true' : undefined);
</script>

<div>
	<label for={autoId} class="mb-1 block text-sm font-medium text-neutral-700">
		{label}
		{#if required}<span class="text-gob" aria-hidden="true">*</span>{/if}
	</label>
	<input
		id={autoId}
		{name}
		{type}
		{placeholder}
		{required}
		{disabled}
		{readonly}
		{maxlength}
		{minlength}
		{pattern}
		{inputmode}
		{autocomplete}
		bind:value
		{onblur}
		aria-invalid={errorAttr}
		aria-describedby={describedBy}
		aria-required={requiredAttr}
		class="w-full rounded-lg border bg-white px-3 py-2 text-neutral-900 transition outline-none
			focus:ring-2 focus:ring-gob/30 focus:ring-offset-2 focus:ring-offset-white
			{error ? 'border-gob focus:border-gob' : 'border-neutral-300 focus:border-gob'}
			disabled:cursor-not-allowed disabled:bg-neutral-100"
	/>
	{#if hint && !error}
		<span id={hintId} class="mt-1 block text-xs text-neutral-500">
			{hint}
		</span>
	{/if}
	{#if error}
		<span id={errorId} role="alert" class="mt-1 block text-xs font-medium text-gob-dark">
			{error}
		</span>
	{/if}
</div>
