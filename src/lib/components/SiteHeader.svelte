<script lang="ts">
	import type { Snippet } from 'svelte';
	import Brand from './Brand.svelte';

	interface Props {
		/** Ancho del contenedor interno. */
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '5xl';
		/** Contenido opcional a la derecha del header (típicamente un link de retorno). */
		children?: Snippet;
	}

	let { maxWidth = '5xl', children }: Props = $props();

	const maxClass = $derived(`max-w-${maxWidth}`);
</script>

<header class="border-b border-neutral-200 bg-white">
	<div class="mx-auto flex {maxClass} items-center justify-between px-6 py-4">
		<Brand />
		{#if children}
			{@render children()}
		{/if}
	</div>
</header>
