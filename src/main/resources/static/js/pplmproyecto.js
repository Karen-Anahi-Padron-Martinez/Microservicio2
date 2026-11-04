/** Aplica la validación visual de Bootstrap e impide enviar formularios inválidos. */
function activarValidacionFormularios() {
	const forms = document.querySelectorAll('.needs-validation');
	Array.from(forms).forEach(form => {
		form.addEventListener('submit', event => {
			if (!form.checkValidity()) {
				event.preventDefault();
				event.stopPropagation();
			}
			form.classList.add('was-validated');
		}, false);
	});
}

$(document).ready(activarValidacionFormularios);

/** Asigna al usuario un color de avatar aleatorio en formato #RRGGBB. */
function getRandomColor() {
	const letras = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letras[Math.floor(Math.random() * 16)];
	}
	document.getElementById("imagenUsuario").value = color;
	return color;
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = { activarValidacionFormularios, getRandomColor };
}
