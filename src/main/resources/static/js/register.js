/** Evita enviar el registro si falta algún campo obligatorio. */
function validarRegistro(event) {
	event.preventDefault();

	const formRegistro = document.getElementById('form-registro');
	const nombre = document.getElementById('nombre').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;

	if (!nombre || !email || !password) {
		document.getElementById('mensaje-error').innerText = "Por favor complete todos los campos.";
		return false;
	}

	formRegistro.submit();
	return true;
}

function inicializarRegistro() {
	const formRegistro = document.getElementById('form-registro');
	if (formRegistro) {
		formRegistro.addEventListener('submit', validarRegistro);
	}
}

document.addEventListener("DOMContentLoaded", inicializarRegistro);

if (typeof module !== "undefined" && module.exports) {
	module.exports = { validarRegistro, inicializarRegistro };
}
