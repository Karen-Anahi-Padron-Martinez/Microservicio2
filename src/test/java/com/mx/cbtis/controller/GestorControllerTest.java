package com.mx.cbtis.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.InternalResourceViewResolver;

import jakarta.servlet.ServletException;


/**
 * Pruebas del controlador web. La API (Microservicio1) se simula con MockRestServiceServer,
 * así se verifica la URL, el método HTTP y el cuerpo que el cliente le envía.
 */
class GestorControllerTest {

    private static final String API = "http://api.test";
    private static final MediaType JSON = MediaType.APPLICATION_JSON;

    private MockMvc mockMvc;
    private MockRestServiceServer api;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        api = MockRestServiceServer.bindTo(restTemplate).build();

        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
        viewResolver.setPrefix("/templates/");
        viewResolver.setSuffix(".html");

        mockMvc = MockMvcBuilders.standaloneSetup(new GestorController(restTemplate, API))
                .setViewResolvers(viewResolver)
                .build();
    }

    @AfterEach
    void verificarLlamadasALaApi() {
        // Falla si se esperaba una llamada a la API que no ocurrió
        api.verify();
    }

    // ---------- vistas estáticas ----------

    @Test
    void paginasSinDatosDevuelvenSuVista() throws Exception {
        mockMvc.perform(get("/")).andExpect(view().name("home"));
        mockMvc.perform(get("/tutorial")).andExpect(view().name("tutorial"));
        mockMvc.perform(get("/manual")).andExpect(view().name("manual"));
        mockMvc.perform(get("/login")).andExpect(view().name("login"));
    }

    @Test
    void registroPreparaUnUsuarioVacio() throws Exception {
        mockMvc.perform(get("/register"))
                .andExpect(view().name("register"))
                .andExpect(model().attributeExists("usuario"));
    }

    @Test
    @DisplayName("AUT-E02: vista que muestra los datos")
    void inicioPreparaElFormularioDeProyecto() throws Exception {
        mockMvc.perform(get("/inicio"))
                .andExpect(status().isOk())
                .andExpect(view().name("inicio"))
                .andExpect(model().attributeExists("proyectos"));
    }

    @Test
    void tareaPreparaElFormularioDeTarea() throws Exception {
        mockMvc.perform(get("/tarea"))
                .andExpect(view().name("proyecto"))
                .andExpect(model().attributeExists("tareas"));
    }

    @Test
    @DisplayName("AUT-F02: recurso que no existe")
    void recursoInexistenteDevuelve404() throws Exception {
        mockMvc.perform(get("/recurso-que-no-existe")).andExpect(status().isNotFound());
    }

    // ---------- registro de usuario ----------

    @Test
    @DisplayName("AUT-E01: formulario con datos válidos")
    void registroValidoEnviaElUsuarioALaApiYRedirigeALogin() throws Exception {
        api.expect(requestTo(API + "/addUsuario"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"nombre\":\"Juan Perez\",\"correo_electronico\":\"juan@example.com\"}"))
                .andRespond(withSuccess("1", JSON));

        mockMvc.perform(post("/saveUsuario")
                        .param("nombre", "Juan Perez")
                        .param("correo_electronico", "juan@example.com")
                        .param("contrasena", "123456")
                        .param("rol", "Estudiante")
                        .param("imagen_usuario", "#33FF57"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/login"));
    }

    @Test
    @DisplayName("AUT-F01: formulario con datos inválidos o incompletos")
    void registroConCamposVaciosVuelveAlFormularioSinLlamarALaApi() throws Exception {
        mockMvc.perform(post("/saveUsuario").param("nombre", "").param("correo_electronico", ""))
                .andExpect(status().isOk())
                .andExpect(view().name("register"))
                .andExpect(model().attributeExists("error"));
    }

    @Test
    void registroSinNombreOSinCorreoOConEspaciosEsInvalido() throws Exception {
        mockMvc.perform(post("/saveUsuario").param("correo_electronico", "a@example.com"))
                .andExpect(model().attributeExists("error"));
        mockMvc.perform(post("/saveUsuario").param("nombre", "Ana"))
                .andExpect(model().attributeExists("error"));
        mockMvc.perform(post("/saveUsuario").param("nombre", "   ").param("correo_electronico", "a@example.com"))
                .andExpect(model().attributeExists("error"));
        mockMvc.perform(post("/saveUsuario").param("nombre", "Ana").param("correo_electronico", "  "))
                .andExpect(view().name("register"));
    }

    @Test
    void registroConUsuarioNuloMuestraErrorConUsuarioVacio() {
        GestorController controller = new GestorController(new RestTemplate(), API);

        var mav = controller.setSaveUsuario(null);

        assertEquals("register", mav.getViewName());
        assertNotNull(mav.getModel().get("usuario"));
        assertEquals("Datos de formulario inválidos o incompletos", mav.getModel().get("error"));
    }

    // ---------- login ----------

    @Test
    void loginReenviaCredencialesYDevuelveLaRespuestaDeLaApi() throws Exception {
        api.expect(requestTo(API + "/getUsuarioLogin"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"correo_electronico\":\"ana@example.com\",\"contrasena\":\"clave\"}"))
                .andRespond(withSuccess("{\"id_usuario\":1,\"nombre\":\"Ana\"}", JSON));

        mockMvc.perform(post("/verificarLogin").contentType(JSON)
                        .content("{\"correo_electronico\":\"ana@example.com\",\"contrasena\":\"clave\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Ana"));
    }

    @Test
    void loginFallidoDevuelveCodigo000() throws Exception {
        api.expect(requestTo(API + "/getUsuarioLogin"))
                .andRespond(withSuccess("{\"nombre\":\"000\"}", JSON));

        mockMvc.perform(post("/verificarLogin").contentType(JSON).content("{\"correo_electronico\":\"x\",\"contrasena\":\"y\"}"))
                .andExpect(jsonPath("$.nombre").value("000"));
    }

    // ---------- proyectos ----------

    @Test
    void guardarProyectoLoEnviaYRedirigeAInicio() throws Exception {
        api.expect(requestTo(API + "/addProyecto"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"nombre\":\"API\",\"fondo\":\"/Images/blanco.png\"}"))
                .andRespond(withSuccess("1", JSON));

        mockMvc.perform(post("/saveProyecto").param("nombre", "API").param("fondo", "/Images/blanco.png"))
                .andExpect(redirectedUrl("/inicio"));
    }

    @Test
    void consultarProyectosDevuelveLaListaDeLaApi() throws Exception {
        api.expect(requestTo(API + "/buscarProyectos"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Content-Type", "application/json"))
                .andRespond(withSuccess("[{\"id_proyecto\":1,\"nombre\":\"API\"},{\"id_proyecto\":2,\"nombre\":\"Web\"}]", JSON));

        mockMvc.perform(post("/consultarProyectos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[1].nombre").value("Web"));
    }

    @Test
    void consultarProyectosConRespuestaVaciaDevuelveListaVacia() throws Exception {
        api.expect(requestTo(API + "/buscarProyectos")).andRespond(withStatus(HttpStatus.OK));

        mockMvc.perform(post("/consultarProyectos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void eliminarProyectoUsaDeleteConElIdYRedirige() throws Exception {
        api.expect(requestTo(API + "/deleteProyecto"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(content().json("{\"id_proyecto\":7}"))
                .andRespond(withSuccess("1", JSON));

        mockMvc.perform(post("/eliminarProyecto").contentType(JSON).content("{\"id_proyecto\":7}"))
                .andExpect(redirectedUrl("/inicio"));
    }

    @Test
    void actualizarProyectoConsultaPorIdYDevuelveElProyecto() throws Exception {
        api.expect(requestTo(API + "/buscarProyecto?id_proyecto=7"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"id_proyecto\":7,\"nombre\":\"API\"}", JSON));

        mockMvc.perform(post("/actualizarProyecto").contentType(JSON).content("{\"id_proyecto\":7}"))
                .andExpect(jsonPath("$.id_proyecto").value(7))
                .andExpect(jsonPath("$.nombre").value("API"));
    }

    @Test
    void errorDeLaApiSePropagaComoExcepcion() {
        api.expect(requestTo(API + "/buscarProyecto?id_proyecto=99"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThrows(ServletException.class, () -> mockMvc.perform(
                post("/actualizarProyecto").contentType(JSON).content("{\"id_proyecto\":99}")));
    }

    // ---------- usuarios ----------

    @Test
    void consultarUsuariosDevuelveLaLista() throws Exception {
        api.expect(requestTo(API + "/buscarUsuarios"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("[{\"id_usuario\":1,\"nombre\":\"Ana\"}]", JSON));

        mockMvc.perform(post("/consultarUsuarios"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Ana"));
    }

    @Test
    void vistaProyectoCargaLosMiembrosDesdeLaApi() throws Exception {
        api.expect(requestTo(API + "/buscarUsuarios"))
                .andRespond(withSuccess("[{\"id_usuario\":1,\"nombre\":\"Ana\"},{\"id_usuario\":2,\"nombre\":\"Beto\"}]", JSON));

        mockMvc.perform(get("/proyecto"))
                .andExpect(view().name("proyecto"))
                .andExpect(model().attributeExists("tarea", "comentarios"))
                .andExpect(model().attribute("listaUsuarios", hasSize(2)));
    }

    // ---------- tareas ----------

    @Test
    void obtenerTareasEnviaElIdDelProyecto() throws Exception {
        api.expect(requestTo(API + "/getTarea"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"id_proyecto\":3}"))
                .andRespond(withSuccess("[{\"id_tarea\":1,\"lista\":\"pendientes\"}]", JSON));

        mockMvc.perform(post("/obtenerTareas").contentType(JSON).content("{\"id_proyecto\":3}"))
                .andExpect(jsonPath("$[0].lista").value("pendientes"));
    }

    @Test
    void guardarTareaRedirigeAlProyectoConSuId() throws Exception {
        api.expect(requestTo(API + "/addTareas"))
                .andExpect(content().json("{\"nombre\":\"BD\",\"id_proyecto\":3}"))
                .andRespond(withSuccess("1", JSON));

        mockMvc.perform(post("/saveTarea").param("nombre", "BD").param("id_proyecto", "3"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/proyecto?id_proyecto=3"));
    }

    @Test
    void actualizarTareaConsultaPorId() throws Exception {
        api.expect(requestTo(API + "/buscarTarea?id_tarea=5"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"id_tarea\":5,\"nombre\":\"BD\"}", JSON));

        mockMvc.perform(post("/actualizarTarea").contentType(JSON).content("{\"id_tarea\":5}"))
                .andExpect(jsonPath("$.nombre").value("BD"));
    }

    @Test
    void eliminarTareaUsaDeleteYRedirige() throws Exception {
        api.expect(requestTo(API + "/deleteTareas"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(content().json("{\"id_tarea\":5}"))
                .andRespond(withSuccess("1", JSON));

        mockMvc.perform(post("/eliminarTarea").contentType(JSON).content("{\"id_tarea\":5}"))
                .andExpect(redirectedUrl("/proyecto"));
    }

    @Test
    void verificarYCambiarTareaDevuelvenElResultadoDeLaApi() throws Exception {
        api.expect(ExpectedCount.twice(), requestTo(API + "/addTareas"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.CREATED).contentType(JSON).body("1"));

        mockMvc.perform(post("/verificarTarea").contentType(JSON).content("{\"nombre\":\"Nueva\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$").value(1));
        mockMvc.perform(post("/cambiosTareas").contentType(JSON).content("{\"id_tarea\":5,\"lista\":\"terminado\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void consultarTareasDevuelveTodas() throws Exception {
        api.expect(requestTo(API + "/buscarTareas"))
                .andRespond(withSuccess("[{\"id_tarea\":1},{\"id_tarea\":2},{\"id_tarea\":3}]", JSON));

        mockMvc.perform(post("/consultarTareas")).andExpect(jsonPath("$", hasSize(3)));
    }

    // ---------- comentarios ----------

    @Test
    void obtenerComentariosEnviaElIdDeLaTarea() throws Exception {
        api.expect(requestTo(API + "/getComentario"))
                .andExpect(content().json("{\"id_tarea\":5}"))
                .andRespond(withSuccess("[{\"id_comentario\":1,\"texto_comentario\":\"Hola\"}]", JSON));

        mockMvc.perform(post("/obtenerComentarios").contentType(JSON).content("{\"id_tarea\":5}"))
                .andExpect(jsonPath("$[0].texto_comentario").value("Hola"));
    }

    @Test
    void guardarComentarioLoEnviaALaApi() throws Exception {
        api.expect(requestTo(API + "/addComentario"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"id_tarea\":5,\"texto_comentario\":\"Listo\"}"))
                .andRespond(withSuccess("1", JSON));

        mockMvc.perform(post("/saveComentario").contentType(JSON).content("{\"id_tarea\":5,\"texto_comentario\":\"Listo\"}"))
                .andExpect(view().name("proyecto"));
    }

    @Test
    void consultarComentariosDevuelveTodos() throws Exception {
        api.expect(requestTo(API + "/buscarComentarios"))
                .andRespond(withSuccess("[{\"id_comentario\":1}]", JSON));

        mockMvc.perform(post("/consultarComentarios")).andExpect(jsonPath("$", hasSize(1)));
    }
}
