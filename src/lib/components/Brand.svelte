<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	interface Props {
		/** Muestra el nombre junto al logo */
		showName?: boolean;
		href?: Pathname;
	}

	let { showName = true, href = '/' }: Props = $props();
</script>

<a href={resolve(href)} class="flex items-center gap-3">
	<img src="/logo.png" alt="Gobierno de la Ciudad de México" class="h-10 w-auto" />
	{#if showName}
		<span class="text-lg leading-tight font-semibold text-gob">
			Negocia<span class="text-neutral-800">CDMX</span>
		</span>
	{/if}
</a>
