package com.mx.cbtis.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.InternalResourceViewResolver;

@ExtendWith(MockitoExtension.class)
class GestorControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GestorController gestorController;

    @BeforeEach
    void setUp() {
        gestorController.setRestTemplate(restTemplate);

        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
        viewResolver.setPrefix("/templates/");
        viewResolver.setSuffix(".html");

        mockMvc = MockMvcBuilders.standaloneSetup(gestorController)
                .setViewResolvers(viewResolver)
                .build();
    }

    @Test
    @DisplayName("AUT-E01: formulario con datos válidos")
    void autE01_formularioConDatosValidos() throws Exception {
        when(restTemplate.postForEntity(eq("http://localhost:8081/addUsuario"), any(), eq(Integer.class)))
                .thenReturn(new ResponseEntity<>(1, HttpStatus.OK));

        mockMvc.perform(post("/saveUsuario")
                .param("nombre", "Juan Perez")
                .param("correo_electronico", "juan@cbtis.edu.mx")
                .param("contrasena", "123456")
                .param("rol", "Estudiante")
                .param("imagen_usuario", "#33FF57"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/login"));

        verify(restTemplate, times(1)).postForEntity(eq("http://localhost:8081/addUsuario"), any(), eq(Integer.class));
    }

    @Test
    @DisplayName("AUT-E02: vista que muestra los datos")
    void autE02_vistaQueMuestraLosDatos() throws Exception {
        mockMvc.perform(get("/inicio"))
                .andExpect(status().isOk())
                .andExpect(view().name("inicio"))
                .andExpect(model().attributeExists("proyectos"));
    }

    @Test
    @DisplayName("AUT-F01: formulario con datos inválidos o incompletos")
    void autF01_formularioConDatosInvalidosOIncompletos() throws Exception {
        mockMvc.perform(post("/saveUsuario")
                .param("nombre", "")
                .param("correo_electronico", ""))
                .andExpect(status().isOk())
                .andExpect(view().name("register"))
                .andExpect(model().attributeExists("error"));
    }

    @Test
    @DisplayName("AUT-F02: recurso que no existe")
    void autF02_recursoQueNoExiste() throws Exception {
        mockMvc.perform(get("/recurso-que-no-existe"))
                .andExpect(status().isNotFound());
    }
}
