package com.mx.cbtis.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import com.mx.cbtis.modelo.Usuario;

/** Renderiza las plantillas reales de Thymeleaf para detectar errores de sintaxis o de atributos. */
@WebMvcTest(GestorController.class)
class VistasThymeleafTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RestTemplate restTemplate;

    @Test
    void paginasPublicasSeRenderizan() throws Exception {
        for (String ruta : new String[] {"/", "/login", "/register", "/tutorial", "/manual", "/inicio"}) {
            mockMvc.perform(get(ruta))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith("text/html"))
                    .andExpect(content().string(containsString("</html>")));
        }
    }

    @Test
    void paginaDeProyectoSeRenderizaConLosMiembros() throws Exception {
        when(restTemplate.postForObject(eq("http://localhost:8081/buscarUsuarios"), any(HttpEntity.class), eq(Usuario[].class)))
                .thenReturn(new Usuario[] {new Usuario(1, "Ana Demo", "ana@example.com", null, "Estudiante", "#111111")});

        mockMvc.perform(get("/proyecto"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("</html>")));
    }
}
