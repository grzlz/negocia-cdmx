// Modelo de datos del módulo de registro (Reto 2 — Viabilidad de negocios CDMX)

export type Giro = 'industrial' | 'comercial' | 'servicios';

export interface Dueno {
	nombre: string;
	apellidoPaterno: string;
	apellidoMaterno: string;
	telefono: string;
	correo: string;
}

export interface Negocio {
	nombre: string;
	tieneRazonSocial: boolean;
	/** Solo aplica si tieneRazonSocial === true */
	razonSocial: string;
	rfc: string;
	giro: Giro | '';
	ramo: string;
}

export interface Registro {
	dueno: Dueno;
	negocio: Negocio;
}

export const GIROS: { value: Giro; label: string }[] = [
	{ value: 'industrial', label: 'Industrial' },
	{ value: 'comercial', label: 'Comercial' },
	{ value: 'servicios', label: 'Servicios' }
];

export const RAMOS: string[] = [
	'Alimentos',
	'Tecnología',
	'Salud',
	'Educación',
	'Moda y textil',
	'Construcción',
	'Turismo',
	'Entretenimiento',
	'Otro'
];

export function nuevoRegistro(): Registro {
	return {
		dueno: {
			nombre: '',
			apellidoPaterno: '',
			apellidoMaterno: '',
			telefono: '',
			correo: ''
		},
		negocio: {
			nombre: '',
			tieneRazonSocial: false,
			razonSocial: '',
			rfc: '',
			giro: '',
			ramo: ''
		}
	};
}

// --- Validaciones ligeras ---

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_TELEFONO = /^\d{10}$/;
// RFC persona moral (12) o física (13)
const RE_RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

export function validarDueno(d: Dueno): string[] {
	const errores: string[] = [];
	if (!d.nombre.trim()) errores.push('El nombre es obligatorio.');
	if (!d.apellidoPaterno.trim()) errores.push('El apellido paterno es obligatorio.');
	if (!RE_TELEFONO.test(d.telefono.trim())) errores.push('El teléfono debe tener 10 dígitos.');
	if (!RE_CORREO.test(d.correo.trim())) errores.push('El correo no es válido.');
	return errores;
}

export function validarNegocio(n: Negocio): string[] {
	const errores: string[] = [];
	if (!n.nombre.trim()) errores.push('El nombre del negocio es obligatorio.');
	if (n.tieneRazonSocial) {
		if (!n.razonSocial.trim()) errores.push('La razón social es obligatoria.');
		if (!RE_RFC.test(n.rfc.trim())) errores.push('El RFC no es válido.');
	}
	if (!n.giro) errores.push('Selecciona un giro.');
	if (!n.ramo) errores.push('Selecciona un ramo.');
	return errores;
}
