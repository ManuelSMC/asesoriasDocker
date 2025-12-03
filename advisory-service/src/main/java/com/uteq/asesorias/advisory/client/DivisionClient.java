package com.uteq.asesorias.advisory.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "division-service")
public interface DivisionClient {
    @GetMapping("/divisiones/ping")
    String ping();
}
