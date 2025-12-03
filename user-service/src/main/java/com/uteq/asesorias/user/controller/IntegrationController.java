package com.uteq.asesorias.user.controller;

import com.uteq.asesorias.user.client.DivisionClient;
import com.uteq.asesorias.user.client.ProgramaClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/integration")
public class IntegrationController {

    private final DivisionClient divisionClient;
    private final ProgramaClient programaClient;

    public IntegrationController(DivisionClient divisionClient, ProgramaClient programaClient) {
        this.divisionClient = divisionClient;
        this.programaClient = programaClient;
    }

    @GetMapping("/ping-meta")
    public String pingMeta() {
        return String.join(",", divisionClient.ping(), programaClient.ping());
    }
}
