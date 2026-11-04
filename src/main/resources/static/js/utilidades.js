/*
 * Utilidades compartidas por las vistas.
 * Todo dato que venga de la API se escapa antes de insertarlo como HTML para evitar XSS almacenado
 * (por ejemplo, un proyecto o comentario cuyo texto contenga <script> o atributos on*).
 */

/** Escapa un valor para insertarlo como texto o como valor de atributo HTML. */
function escapeHtml(valor) {
	if (valor === null || valor === undefined) {
		return "";
	}
	return String(valor)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * Convierte un valor en un literal de JavaScript seguro para usarlo como argumento dentro de un
 * atributo onclick="...": JSON.stringify protege el contexto JS y escapeHtml el contexto del atributo.
 */
function jsArg(valor) {
	return escapeHtml(JSON.stringify(valor === undefined ? null : valor));
}

/** Navegación centralizada (permite verificarla en las pruebas, donde jsdom no implementa la navegación). */
function navegarA(url) {
	window.location.href = url;
}

/** Los identificadores deben ser numéricos; cualquier otro valor se descarta. */
function idSeguro(valor) {
	const numero = Number(valor);
	return Number.isFinite(numero) ? numero : 0;
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = { escapeHtml, jsArg, idSeguro, navegarA };
}
