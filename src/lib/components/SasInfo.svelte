<script lang="ts">
	// Pasos para constituir una Sociedad por Acciones Simplificadas (SAS).
	// Fuente: tramites de la Secretaría de Economía (gob.mx) — proceso 100% en línea y gratuito.
	const pasos = [
		'Obtén tu e.firma (firma electrónica) vigente del SAT.',
		'Solicita la autorización de uso de denominación ante la Secretaría de Economía.',
		'Captura el acta constitutiva en el sistema tuempresa.gob.mx y firma con tu e.firma.',
		'Recibe la boleta de inscripción en el Registro Público de Comercio.',
		'Inscríbete en el RFC ante el SAT para obtener tu cédula fiscal.'
	];
</script>

<div class="rounded-lg border border-gob/30 bg-gob-soft p-4">
	<h3 class="font-semibold text-gob-dark">¿Aún no tienes figura moral?</h3>
	<p class="mt-1 text-sm text-neutral-700">
		Puedes constituir una <strong>Sociedad por Acciones Simplificadas (SAS)</strong>. Es el régimen
		más sencillo: se hace en línea, sin notario y sin costo.
	</p>
	<ol class="mt-3 space-y-2 text-sm text-neutral-700">
		{#each pasos as p, i (p)}
			<li class="flex gap-2">
				<span
					class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gob text-[11px] font-semibold text-white"
				>
					{i + 1}
				</span>
				<span>{p}</span>
			</li>
		{/each}
	</ol>
	<a
		href="https://www.tuempresa.gob.mx"
		target="_blank"
		rel="noopener noreferrer"
		class="mt-3 inline-block text-sm font-medium text-gob hover:underline"
	>
		Iniciar constitución en tuempresa.gob.mx →
	</a>
</div>
