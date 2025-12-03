package com.uteq.asesorias.advisory.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "profesor-service")
public interface ProfesorClient {
    @GetMapping("/profesores/ping")
    String ping();
}
