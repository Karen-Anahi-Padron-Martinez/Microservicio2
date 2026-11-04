const { prepararEntorno, cargarScript, ultimaPeticion } = require("./entorno");

const HTML = `
  <input id="exampleInputEmail1" type="email">
  <input id="exampleInputPassword1" type="password">
  <div id="alerta1"></div><div id="alerta2"></div><div id="alerta3"></div>
  <div id="alerta4"></div><div id="alerta5"></div>
`;

let login;
let toastsMostrados;

function escribir(correo, contrasena) {
  document.getElementById("exampleInputEmail1").value = correo;
  document.getElementById("exampleInputPassword1").value = contrasena;
}

beforeEach(() => {
  prepararEntorno(HTML);
  toastsMostrados = [];
  global.bootstrap = {
    Toast: jest.fn(function Toast(elemento) {
      this.show = () => toastsMostrados.push(elemento.id);
    }),
  };
  login = cargarScript("login.js");
});

test("sin correo ni contraseña muestra la alerta 1 y no llama al servidor", () => {
  escribir("", "");
  login.validarLogin();

  expect(toastsMostrados).toEqual(["alerta1"]);
  expect($.ajax).not.toHaveBeenCalled();
});

test("sin correo muestra la alerta 2", () => {
  escribir("", "clave");
  login.validarLogin();

  expect(toastsMostrados).toEqual(["alerta2"]);
  expect(document.activeElement.id).toBe("exampleInputEmail1");
});

test("correo con formato inválido muestra la alerta 3", () => {
  escribir("no-es-correo", "clave");
  login.validarLogin();

  expect(toastsMostrados).toEqual(["alerta3"]);
  expect($.ajax).not.toHaveBeenCalled();
});

test("sin contraseña muestra la alerta 4", () => {
  escribir("ana@example.com", "");
  login.validarLogin();

  expect(toastsMostrados).toEqual(["alerta4"]);
});

test("credenciales válidas se envían a /verificarLogin", () => {
  escribir("ana@example.com", "clave");
  login.validarLogin();

  const peticion = ultimaPeticion();
  expect(peticion.url).toBe("/verificarLogin");
  expect(peticion.type).toBe("POST");
  expect(JSON.parse(peticion.data)).toEqual({ correo_electronico: "ana@example.com", contrasena: "clave" });
});

test("login correcto guarda el usuario en sesión y entra a inicio", () => {
  escribir("ana@example.com", "clave");
  login.validarLogin();
  ultimaPeticion().success({ id_usuario: 1, nombre: "Ana" });

  expect(JSON.parse(localStorage.getItem("usuario"))).toEqual({ id_usuario: 1, nombre: "Ana" });
  expect(navegarA).toHaveBeenCalledWith("inicio");
});

test("login rechazado (000) muestra la alerta 5 y no guarda sesión", () => {
  escribir("ana@example.com", "mala");
  login.validarLogin();
  ultimaPeticion().success({ nombre: "000" });

  expect(toastsMostrados).toEqual(["alerta5"]);
  expect(localStorage.getItem("usuario")).toBeNull();
  expect(navegarA).not.toHaveBeenCalled();
});
