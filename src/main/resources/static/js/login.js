function mostrarAlerta(idAlerta) {
	const toast = new bootstrap.Toast(document.querySelector(idAlerta));
	toast.show();
}

/** Valida el formulario de acceso y, si es correcto, consulta las credenciales en el servidor. */
function validarLogin() {
	const email = document.getElementById("exampleInputEmail1");
	const correo = $("#exampleInputEmail1").val();
	const contrasena = $("#exampleInputPassword1").val();

	if (correo === "" && contrasena === "") {
		mostrarAlerta('#alerta1');
	} else if (correo === "") {
		email.focus();
		mostrarAlerta('#alerta2');
	} else if (!email.checkValidity()) {
		email.focus();
		mostrarAlerta('#alerta3');
	} else if (contrasena === "") {
		email.focus();
		mostrarAlerta('#alerta4');
	} else {
		$.ajax({
			url: "/verificarLogin",
			contentType: "application/json",
			data: JSON.stringify({ correo_electronico: correo, contrasena: contrasena }),
			type: "POST",
			success: function(data) {
				if (data.nombre === '000') {
					email.focus();
					mostrarAlerta('#alerta5');
				} else {
					localStorage.setItem("usuario", JSON.stringify(data));
					navegarA('inicio');
				}
			}
		});
	}
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = { validarLogin, mostrarAlerta };
}
