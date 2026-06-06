// Store reactivo de Svelte 5 para el registro en curso.
//
// Patrón: `$state` en archivo `.svelte.ts` para tener estado compartido entre
// componentes sin instalar dependencias externas.
//
// CAVEAT — SSR: este estado es módulo-global. En SSR con múltiples usuarios
// concurrentes, las requests se filtrarían entre sí. La solución cuando
// exista backend es: (a) no usar este store en SSR, (b) pasar el registro vía
// `+page.server.ts` `load`, o (c) guardarlo solo en cliente. Documentado para
// referencia futura.

import type { Registro } from './registro';

class RegistroStore {
	#actual = $state<Registro | null>(null);

	get actual(): Registro | null {
		return this.#actual;
	}

	set(r: Registro): void {
		this.#actual = r;
	}

	clear(): void {
		this.#actual = null;
	}
}

export const registroStore = new RegistroStore();
