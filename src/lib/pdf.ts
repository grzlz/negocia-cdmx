// Generador de PDF para el análisis de viabilidad.
// Solo se ejecuta en el cliente (importación dinámica de jsPDF).

import type { AnalisisResultado, SemaforoColor } from './viabilidad/types';

// ── Paleta ───────────────────────────────────────────────────────────────────
const C = {
	gob: [160, 33, 66] as [number, number, number],
	gobSoft: [253, 242, 246] as [number, number, number],
	verde: [5, 150, 105] as [number, number, number],
	verdeLight: [209, 250, 229] as [number, number, number],
	amarillo: [217, 119, 6] as [number, number, number],
	amarilloLight: [254, 243, 199] as [number, number, number],
	rojo: [225, 29, 72] as [number, number, number],
	rojoLight: [255, 228, 230] as [number, number, number],
	neutral900: [15, 23, 42] as [number, number, number],
	neutral700: [55, 65, 81] as [number, number, number],
	neutral500: [107, 114, 128] as [number, number, number],
	neutral200: [229, 231, 235] as [number, number, number],
	neutral50: [249, 250, 251] as [number, number, number],
	white: [255, 255, 255] as [number, number, number]
} as const;

const semaforoColor: Record<SemaforoColor, [number, number, number]> = {
	verde: C.verde,
	amarillo: C.amarillo,
	rojo: C.rojo
};
const semaforoLight: Record<SemaforoColor, [number, number, number]> = {
	verde: C.verdeLight,
	amarillo: C.amarilloLight,
	rojo: C.rojoLight
};
const semaforoLabel: Record<SemaforoColor, string> = {
	verde: 'Viable',
	amarillo: 'Viable con reservas',
	rojo: 'Riesgo alto'
};

// ── Utilidades de layout ──────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Convierte líneas largas en varias líneas según ancho máximo.
function wrapText(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	doc: any,
	text: string,
	maxWidth: number
): string[] {
	return doc.splitTextToSize(text, maxWidth) as string[];
}

// ── Parser de markdown (solo lo que usa el reporte) ───────────────────────────
type Bloque =
	| { tipo: 'h2'; texto: string }
	| { tipo: 'h3'; texto: string }
	| { tipo: 'p'; texto: string }
	| { tipo: 'ul'; items: string[] }
	| { tipo: 'ol'; items: string[] };

function parsearMd(md: string): Bloque[] {
	const bloques: Bloque[] = [];
	const lineas = md.split('\n');
	let i = 0;
	while (i < lineas.length) {
		const l = lineas[i].trim();
		if (!l) { i++; continue; }
		if (l.startsWith('### ')) { bloques.push({ tipo: 'h3', texto: l.slice(4) }); i++; continue; }
		if (l.startsWith('## ')) { bloques.push({ tipo: 'h2', texto: l.slice(3) }); i++; continue; }
		if (l.startsWith('- ') || l.startsWith('* ')) {
			const items: string[] = [];
			while (i < lineas.length && (lineas[i].trim().startsWith('- ') || lineas[i].trim().startsWith('* '))) {
				items.push(lineas[i].trim().slice(2));
				i++;
			}
			bloques.push({ tipo: 'ul', items });
			continue;
		}
		if (/^\d+\.\s/.test(l)) {
			const items: string[] = [];
			while (i < lineas.length && /^\d+\.\s/.test(lineas[i].trim())) {
				items.push(lineas[i].trim().replace(/^\d+\.\s/, ''));
				i++;
			}
			bloques.push({ tipo: 'ol', items });
			continue;
		}
		// Párrafo (puede tener negrita **texto** → limpiar)
		let texto = l.replace(/\*\*(.*?)\*\*/g, '$1');
		i++;
		while (i < lineas.length && lineas[i].trim() && !lineas[i].trim().startsWith('#') && !lineas[i].trim().startsWith('- ') && !lineas[i].trim().startsWith('* ') && !/^\d+\.\s/.test(lineas[i].trim())) {
			texto += ' ' + lineas[i].trim().replace(/\*\*(.*?)\*\*/g, '$1');
			i++;
		}
		bloques.push({ tipo: 'p', texto });
	}
	return bloques;
}

// ── Función principal ─────────────────────────────────────────────────────────
export async function exportarAnalisisPDF(
	resultado: AnalisisResultado,
	negocio: {
		nombre: string;
		giro: string;
		ramo?: string | null;
		cp?: string | null;
		calle?: string | null;
		colonia?: string | null;
	},
	usuario: {
		nombre: string;
		apellido_pat: string;
		apellido_mat?: string;
	}
): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF({ unit: 'mm', format: 'a4' });
	let y = 0;

	// ── Verificar si hay espacio suficiente, si no añadir página ─────────────
	function checkPage(needed: number) {
		if (y + needed > PAGE_H - 16) {
			doc.addPage();
			y = MARGIN;
		}
	}

	// ── Header ────────────────────────────────────────────────────────────────
	doc.setFillColor(...C.gob);
	doc.rect(0, 0, PAGE_W, 22, 'F');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(14);
	doc.setTextColor(...C.white);
	doc.text('NegociaCDMX', MARGIN, 10);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.text('Análisis de viabilidad empresarial', MARGIN, 16);
	// Fecha alineada a la derecha
	const fecha = new Date(resultado.generado_en).toLocaleString('es-MX', {
		dateStyle: 'long',
		timeStyle: 'short'
	});
	doc.text(fecha, PAGE_W - MARGIN, 16, { align: 'right' });

	y = 30;

	// ── Tarjeta de datos del negocio ──────────────────────────────────────────
	doc.setFillColor(...C.neutral50);
	doc.setDrawColor(...C.neutral200);
	doc.setLineWidth(0.3);
	doc.roundedRect(MARGIN, y, CONTENT_W, 28, 2, 2, 'FD');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.setTextColor(...C.neutral900);
	doc.text(negocio.nombre, MARGIN + 4, y + 7);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(...C.neutral700);
	const nombreDueno = [usuario.nombre, usuario.apellido_pat, usuario.apellido_mat ?? ''].filter(Boolean).join(' ');
	doc.text(`Dueño: ${nombreDueno}`, MARGIN + 4, y + 14);

	const giroRamo = [negocio.giro, negocio.ramo].filter(Boolean).join(' · ');
	doc.text(`Giro / Ramo: ${giroRamo}`, MARGIN + 4, y + 19.5);

	const direccion = [negocio.calle, negocio.colonia, negocio.cp ? `CP ${negocio.cp}` : '']
		.filter(Boolean)
		.join(', ');
	if (direccion) {
		doc.text(`Dirección: ${direccion}`, MARGIN + 4, y + 25);
	}

	y += 34;

	// ── Semáforo ──────────────────────────────────────────────────────────────
	const sc = resultado.semaforo;
	const [sr, sg, sb] = semaforoColor[sc.color];
	const [lr, lg, lb] = semaforoLight[sc.color];

	doc.setFillColor(lr, lg, lb);
	doc.setDrawColor(sr, sg, sb);
	doc.setLineWidth(0.4);
	const semaforoH = 10 + (sc.razon ? 7 : 0) + (sc.alertas.length > 0 ? 5 + sc.alertas.length * 5.5 : 0);
	doc.roundedRect(MARGIN, y, CONTENT_W, Math.max(22, semaforoH + 8), 2, 2, 'FD');

	// Tres círculos del semáforo
	const orden: SemaforoColor[] = ['rojo', 'amarillo', 'verde'];
	const circleY = y + 7;
	orden.forEach((color, idx) => {
		const cx = MARGIN + 8 + idx * 10;
		if (color === sc.color) {
			doc.setFillColor(...semaforoColor[color]);
		} else {
			doc.setFillColor(...C.neutral200);
		}
		doc.circle(cx, circleY, 3.5, 'F');
	});

	// Score y veredicto
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(18);
	doc.setTextColor(sr, sg, sb);
	doc.text(String(sc.score), MARGIN + 38, y + 10);
	doc.setFontSize(8);
	doc.setTextColor(...C.neutral500);
	doc.text('/100', MARGIN + 38 + doc.getTextWidth(String(sc.score)) + 1, y + 10);

	doc.setFontSize(10);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(sr, sg, sb);
	doc.text(semaforoLabel[sc.color], MARGIN + 62, y + 7);

	let syOffset = 13;
	if (sc.razon) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8.5);
		doc.setTextColor(...C.neutral700);
		const razonLines = wrapText(doc, sc.razon, CONTENT_W - 8);
		doc.text(razonLines, MARGIN + 4, y + syOffset);
		syOffset += razonLines.length * 4.5;
	}

	if (sc.alertas.length > 0) {
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(7.5);
		doc.setTextColor(...C.neutral700);
		doc.text('Alertas:', MARGIN + 4, y + syOffset + 1);
		syOffset += 5;
		doc.setFont('helvetica', 'normal');
		for (const alerta of sc.alertas) {
			const aLines = wrapText(doc, `• ${alerta}`, CONTENT_W - 10);
			doc.setFontSize(7.5);
			doc.setTextColor(...C.neutral700);
			doc.text(aLines, MARGIN + 6, y + syOffset);
			syOffset += aLines.length * 4;
		}
	}

	y += Math.max(30, semaforoH + 14);

	// ── Reporte de viabilidad ─────────────────────────────────────────────────
	checkPage(16);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(...C.neutral500);
	doc.text('REPORTE DE VIABILIDAD', MARGIN, y);
	doc.setDrawColor(...C.neutral200);
	doc.setLineWidth(0.3);
	doc.line(MARGIN + 56, y - 1, MARGIN + CONTENT_W, y - 1);
	y += 5;

	const bloques = parsearMd(resultado.reporte_markdown);
	for (const b of bloques) {
		if (b.tipo === 'h2') {
			checkPage(9);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(10);
			doc.setTextColor(...C.gob);
			doc.text(b.texto, MARGIN, y);
			y += 6;
		} else if (b.tipo === 'h3') {
			checkPage(7);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(9);
			doc.setTextColor(...C.neutral900);
			doc.text(b.texto, MARGIN, y);
			y += 5.5;
		} else if (b.tipo === 'p') {
			const lines = wrapText(doc, b.texto, CONTENT_W);
			checkPage(lines.length * 4.5 + 3);
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8.5);
			doc.setTextColor(...C.neutral700);
			doc.text(lines, MARGIN, y);
			y += lines.length * 4.5 + 2;
		} else if (b.tipo === 'ul' || b.tipo === 'ol') {
			for (let idx = 0; idx < b.items.length; idx++) {
				const prefijo = b.tipo === 'ol' ? `${idx + 1}.` : '•';
				const lines = wrapText(doc, b.items[idx], CONTENT_W - 7);
				checkPage(lines.length * 4.5 + 2);
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(8.5);
				doc.setTextColor(...C.neutral500);
				doc.text(prefijo, MARGIN + 2, y);
				doc.setTextColor(...C.neutral700);
				doc.text(lines, MARGIN + 7, y);
				y += lines.length * 4.5 + 1;
			}
			y += 1;
		}
	}

	y += 4;

	// ── Competencia considerada ───────────────────────────────────────────────
	if (resultado.competencia_considerada.length > 0) {
		checkPage(20);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(9);
		doc.setTextColor(...C.neutral500);
		doc.text('COMPETENCIA CONSIDERADA', MARGIN, y);
		doc.setDrawColor(...C.neutral200);
		doc.line(MARGIN + 72, y - 1, MARGIN + CONTENT_W, y - 1);
		y += 5;

		// Cabecera de tabla
		const cols = [
			{ label: 'Nombre', x: MARGIN, w: 60 },
			{ label: 'Clase de actividad', x: MARGIN + 61, w: 70 },
			{ label: 'Colonia', x: MARGIN + 132, w: 48 }
		];
		doc.setFillColor(...C.gob);
		doc.rect(MARGIN, y, CONTENT_W, 6, 'F');
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(7.5);
		doc.setTextColor(...C.white);
		for (const col of cols) doc.text(col.label, col.x + 2, y + 4);
		y += 6;

		// Filas
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(7.5);
		for (let i = 0; i < resultado.competencia_considerada.length; i++) {
			const e = resultado.competencia_considerada[i];
			checkPage(7);
			if (i % 2 === 0) {
				doc.setFillColor(...C.neutral50);
				doc.rect(MARGIN, y, CONTENT_W, 5.5, 'F');
			}
			doc.setTextColor(...C.neutral900);
			doc.text(doc.splitTextToSize(e.nombre || '—', cols[0].w - 3)[0], MARGIN + 2, y + 3.8);
			doc.setTextColor(...C.neutral700);
			doc.text(doc.splitTextToSize(e.clase_actividad || '—', cols[1].w - 3)[0], MARGIN + 63, y + 3.8);
			doc.setTextColor(...C.neutral500);
			doc.text(doc.splitTextToSize(e.colonia || '—', cols[2].w - 3)[0], MARGIN + 134, y + 3.8);
			// Separador
			doc.setDrawColor(...C.neutral200);
			doc.setLineWidth(0.2);
			doc.line(MARGIN, y + 5.5, MARGIN + CONTENT_W, y + 5.5);
			y += 5.5;
		}
		y += 4;
	}

	// ── Footer ────────────────────────────────────────────────────────────────
	const totalPages = doc.getNumberOfPages();
	for (let p = 1; p <= totalPages; p++) {
		doc.setPage(p);
		doc.setFillColor(...C.neutral50);
		doc.rect(0, PAGE_H - 12, PAGE_W, 12, 'F');
		doc.setDrawColor(...C.neutral200);
		doc.setLineWidth(0.3);
		doc.line(0, PAGE_H - 12, PAGE_W, PAGE_H - 12);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(7);
		doc.setTextColor(...C.neutral500);
		doc.text(
			'Generado por NegociaCDMX · Los datos provienen de DENUE–INEGI y análisis con IA. No constituye asesoría legal.',
			PAGE_W / 2,
			PAGE_H - 5,
			{ align: 'center' }
		);
		doc.text(`Página ${p} de ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
	}

	// Descargar
	const slug = negocio.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
	doc.save(`viabilidad-${slug}-${new Date().getFullYear()}.pdf`);
}
