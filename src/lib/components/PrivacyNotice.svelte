<script lang="ts">
	/**
	 * Aviso de privacidad — stub para cumplimiento LFPDPPP.
	 *
	 * **BORRADOR — pendiente de revisión legal.** Los campos entre corchetes
	 * son marcadores que el área legal debe completar antes de producción.
	 * El contenido refleja los requisitos de los arts. 15–17 de la LFPDPPP:
	 * identidad del responsable, datos recabados, finalidades, transferencias
	 * y derechos ARCO.
	 */

	interface Props {
		/** Versión resumida pensada para acompañar un checkbox de consentimiento. */
		compact?: boolean;
	}

	let { compact = false }: Props = $props();
</script>

{#if compact}
	<div
		class="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 sm:text-sm"
	>
		<p>
			He leído y acepto el
			<a
				href="#aviso-de-privacidad"
				class="font-medium text-gob underline-offset-2 hover:underline"
			>
				aviso de privacidad
			</a>
			y el tratamiento de mis datos personales conforme a la LFPDPPP.
		</p>
		<p class="mt-1 text-[10px] text-neutral-500 sm:text-xs">
			Borrador sujeto a revisión legal. Última actualización: 2026-06-06.
		</p>
	</div>
{:else}
	<aside
		id="aviso-de-privacidad"
		class="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-700"
		aria-label="Aviso de privacidad"
	>
		<h2 class="text-base font-semibold text-gob-dark">Aviso de privacidad</h2>
		<p class="mt-1 text-xs text-neutral-500">
			Borrador sujeto a revisión legal — última actualización 2026-06-06.
		</p>

		<dl class="mt-4 space-y-3">
			<div>
				<dt class="font-medium text-neutral-800">Responsable</dt>
				<dd>[Razón social del responsable, domicilio, RFC — pendiente del área legal].</dd>
			</div>
			<div>
				<dt class="font-medium text-neutral-800">Datos personales recabados</dt>
				<dd>
					Nombre, apellidos, teléfono, correo electrónico, y opcionalmente razón social y RFC del
					negocio, así como giro y ramo.
				</dd>
			</div>
			<div>
				<dt class="font-medium text-neutral-800">Finalidades</dt>
				<dd>
					Primarias: evaluar la viabilidad de tu idea de negocio en la zona que elijas, generar la
					ruta de trámites y permisos ante las ventanillas correspondientes, e informarte sobre
					programas de emprendimiento de la CDMX que apliquen a tu perfil.
				</dd>
				<dd class="mt-1 text-neutral-500">
					Secundarias (opcionales, requieren consentimiento separado): estadísticas agregadas y
					mejora del servicio.
				</dd>
			</div>
			<div>
				<dt class="font-medium text-neutral-800">Transferencias</dt>
				<dd>No se realizan transferencias, salvo las exigidas por ley (art. 37 LFPDPPP).</dd>
			</div>
			<div>
				<dt class="font-medium text-neutral-800">Derechos ARCO</dt>
				<dd>
					Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo a <strong
						>[correo del responsable]</strong
					>. Para conocer el procedimiento, consulta el aviso de privacidad completo.
				</dd>
			</div>
		</dl>
	</aside>
{/if}
