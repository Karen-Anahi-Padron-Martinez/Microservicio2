package com.mx.cbtis.bromitas;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.client.RestTemplate;

import com.mx.cbtis.controller.GestorController;

@SpringBootTest
class Ejercicio5ClienteApplicationTests {

	@Autowired
	private ApplicationContext context;

	@Test
	void contextLoads() {
		// El contexto arranca y el controlador recibe el RestTemplate definido en RestClientConfig
		assertNotNull(context.getBean(RestTemplate.class));
		assertNotNull(context.getBean(GestorController.class));
	}

}
