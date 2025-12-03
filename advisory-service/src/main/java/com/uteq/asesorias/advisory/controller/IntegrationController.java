package com.uteq.asesorias.advisory.controller;

import com.uteq.asesorias.advisory.client.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/integration")
public class IntegrationController {

    private final MateriaClient materiaClient;
    private final DivisionClient divisionClient;
    private final ProfesorClient profesorClient;
    private final ProgramaClient programaClient;
    private final NotificacionClient notificacionClient;

    public IntegrationController(MateriaClient materiaClient,
                                 DivisionClient divisionClient,
                                 ProfesorClient profesorClient,
                                 ProgramaClient programaClient,
                                 NotificacionClient notificacionClient) {
        this.materiaClient = materiaClient;
        this.divisionClient = divisionClient;
        this.profesorClient = profesorClient;
        this.programaClient = programaClient;
        this.notificacionClient = notificacionClient;
    }

    @GetMapping("/ping-all")
    public String pingAll() {
        return String.join(",",
                materiaClient.ping(),
                divisionClient.ping(),
                profesorClient.ping(),
                programaClient.ping(),
                notificacionClient.ping()
        );
    }
}
