package com.uteq.asesorias.advisory.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "materia-service")
public interface MateriaClient {
    @GetMapping("/materias/ping")
    String ping();
}
