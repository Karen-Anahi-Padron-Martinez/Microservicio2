package com.mx.cbtis.controller;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.ModelAndView;

import com.mx.cbtis.modelo.Comentarios;
import com.mx.cbtis.modelo.Proyectos;
import com.mx.cbtis.modelo.Tareas;
import com.mx.cbtis.modelo.Usuario;

@Controller
public class GestorController {

	private static final String VISTA_PROYECTO = "proyecto";
	private static final String REDIRECT_INICIO = "redirect:/inicio";
	private static final String REDIRECT_PROYECTO = "redirect:/proyecto";
	private static final String API_ADD_TAREAS = "/addTareas";

	private final RestTemplate restTemplate;
	private final String apiBaseUrl;

	// El RestTemplate y la URL de la API se inyectan para poder configurarlos por entorno y probarlos
	public GestorController(RestTemplate restTemplate,
			@Value("${api.base-url:http://localhost:8081}") String apiBaseUrl) {
		this.restTemplate = restTemplate;
		this.apiBaseUrl = apiBaseUrl;
	}

	private String url(String ruta) {
		return apiBaseUrl + ruta;
	}

	/** Petición JSON sin cuerpo para los endpoints de consulta de la API. */
	private static HttpEntity<Void> peticionJson() {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		return new HttpEntity<>(headers);
	}

	/** La API puede responder sin cuerpo; en ese caso se devuelve una lista vacía en lugar de fallar. */
	private static <T> List<T> aLista(T[] arreglo) {
		return (arreglo == null) ? Collections.emptyList() : Arrays.asList(arreglo);
	}

	@GetMapping("/")
	public String getHome() {
		return "home";
	}

	@GetMapping("/tutorial")
	public String getTutorial() {
		return "tutorial";
	}

	@GetMapping("/manual")
	public String getManual() {
		return "manual";
	}

	@GetMapping("/login")
	public String getLogin() {
		return "login";
	}

	@GetMapping("/register")
	public String getRegister(Model modelo) {
		modelo.addAttribute("usuario", new Usuario());
		return "register";
	}

	@PostMapping("/saveUsuario")
	public ModelAndView setSaveUsuario(@ModelAttribute Usuario usuario) {
		if (usuario == null || usuario.getNombre() == null || usuario.getNombre().trim().isEmpty()
				|| usuario.getCorreo_electronico() == null || usuario.getCorreo_electronico().trim().isEmpty()) {
			ModelAndView mav = new ModelAndView("register");
			mav.addObject("usuario", usuario != null ? usuario : new Usuario());
			mav.addObject("error", "Datos de formulario inválidos o incompletos");
			return mav;
		}

		restTemplate.postForEntity(url("/addUsuario"), usuario, Integer.class);
		return new ModelAndView("redirect:/login");
	}

	@GetMapping("/inicio")
	public String getInicio(Model modelo) {
		modelo.addAttribute("proyectos", new Proyectos());
		return "inicio";
	}

	@PostMapping("/saveProyecto")
	public ModelAndView setSaveProyecto(@ModelAttribute Proyectos proyecto) {
		restTemplate.postForEntity(url("/addProyecto"), proyecto, Integer.class);
		return new ModelAndView(REDIRECT_INICIO);
	}

	@PostMapping("/consultarProyectos")
	public ResponseEntity<Object> consultarProyectos(Model modelo) {
		List<Proyectos> proyectos = aLista(
				restTemplate.postForObject(url("/buscarProyectos"), peticionJson(), Proyectos[].class));
		modelo.addAttribute("listaProyectos", proyectos);
		return ResponseEntity.ok(proyectos);
	}

	@PostMapping("/eliminarProyecto")
	public ModelAndView eliminarProyecto(@RequestBody Proyectos proyecto) {
		restTemplate.exchange(url("/deleteProyecto"), HttpMethod.DELETE, new HttpEntity<>(proyecto), Integer.class);
		return new ModelAndView(REDIRECT_INICIO);
	}

	@PostMapping ("/actualizarProyecto")
	public ResponseEntity<Object> updateProyecto(@RequestBody Proyectos proyecto) {
		Proyectos encontrado = restTemplate.getForObject(url("/buscarProyecto?id_proyecto={id_proyecto}"),
				Proyectos.class, Map.of("id_proyecto", proyecto.getId_proyecto()));
		return ResponseEntity.ok(encontrado);
	}

	@PostMapping("/verificarLogin")
	public ResponseEntity<Usuario> verificarUsuario(@RequestBody Usuario paramUser) {
		return restTemplate.postForEntity(url("/getUsuarioLogin"), paramUser, Usuario.class);
	}

	@PostMapping("/consultarUsuarios")
	public ResponseEntity<Object> consultarUsuarios(Model modelo) {
		List<Usuario> usuarios = aLista(
				restTemplate.postForObject(url("/buscarUsuarios"), peticionJson(), Usuario[].class));
		modelo.addAttribute("listaUsuarios", usuarios);
		return ResponseEntity.ok(usuarios);
	}

	@PostMapping("/obtenerTareas")
	public ResponseEntity<List<Tareas>> obtenerTareas(@RequestBody Tareas idProyecto, Model modelo) {
		List<Tareas> listaTareas = aLista(
				restTemplate.postForObject(url("/getTarea"), idProyecto, Tareas[].class));
		modelo.addAttribute("tareas", listaTareas);
		return ResponseEntity.ok(listaTareas);
	}

	@PostMapping("/obtenerComentarios")
	public ResponseEntity<List<Comentarios>> obtenerComentarios(@RequestBody Comentarios idComentario, Model modelo) {
		List<Comentarios> listaComentarios = aLista(
				restTemplate.postForObject(url("/getComentario"), idComentario, Comentarios[].class));
		modelo.addAttribute("comentarios", listaComentarios);
		return ResponseEntity.ok(listaComentarios);
	}

	@GetMapping("/proyecto")
	public String getProyecto(Model modelo) {
		modelo.addAttribute("tarea", new Tareas());
		modelo.addAttribute("comentarios", new Comentarios());
		List<Usuario> usuarios = aLista(
				restTemplate.postForObject(url("/buscarUsuarios"), peticionJson(), Usuario[].class));
		modelo.addAttribute("listaUsuarios", usuarios);
		return VISTA_PROYECTO;
	}

	@GetMapping("/tarea")
	public String getTarea(Model modelo) {
		modelo.addAttribute("tareas", new Tareas());
		return VISTA_PROYECTO;
	}

	@PostMapping("/saveTarea")
	public ModelAndView setSaveTareas(@ModelAttribute Tareas tareas) {
		restTemplate.postForEntity(url(API_ADD_TAREAS), tareas, Integer.class);
		ModelAndView mav = new ModelAndView(REDIRECT_PROYECTO);
		mav.addObject("id_proyecto", tareas.getId_proyecto());
		return mav;
	}

	@PostMapping("/saveComentario")
	public String setSaveComentario(@RequestBody Comentarios comentarios) {
		restTemplate.postForEntity(url("/addComentario"), comentarios, Integer.class);
		return VISTA_PROYECTO;
	}

	@PostMapping("/actualizarTarea")
	public ResponseEntity<Object> updateTarea(@RequestBody Tareas tarea) {
		Tareas encontrada = restTemplate.getForObject(url("/buscarTarea?id_tarea={id_tarea}"),
				Tareas.class, Map.of("id_tarea", tarea.getId_tarea()));
		return ResponseEntity.ok(encontrada);
	}

	@PostMapping("/eliminarTarea")
	public ModelAndView eliminarTarea(@RequestBody Tareas tareas) {
		restTemplate.exchange(url("/deleteTareas"), HttpMethod.DELETE, new HttpEntity<>(tareas), Integer.class);
		return new ModelAndView(REDIRECT_PROYECTO);
	}

	@PostMapping("/verificarTarea")
	public ResponseEntity<Integer> verificarTarea(@RequestBody Tareas paramName) {
		return restTemplate.postForEntity(url(API_ADD_TAREAS), paramName, Integer.class);
	}

	@PostMapping("/cambiosTareas")
	public ResponseEntity<Integer> cambiosTareas(@RequestBody Tareas paramDatos) {
		return restTemplate.postForEntity(url(API_ADD_TAREAS), paramDatos, Integer.class);
	}

	@PostMapping("/consultarTareas")
	public ResponseEntity<Object> consultarTareas() {
		List<Tareas> tareas = aLista(
				restTemplate.postForObject(url("/buscarTareas"), peticionJson(), Tareas[].class));
		return ResponseEntity.ok(tareas);
	}

	@PostMapping("/consultarComentarios")
	public ResponseEntity<Object> consultarComentarios() {
		List<Comentarios> comentarios = aLista(
				restTemplate.postForObject(url("/buscarComentarios"), peticionJson(), Comentarios[].class));
		return ResponseEntity.ok(comentarios);
	}
}
