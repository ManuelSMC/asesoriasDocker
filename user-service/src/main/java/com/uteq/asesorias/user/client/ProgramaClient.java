package com.uteq.asesorias.user.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "programa-service")
public interface ProgramaClient {
    @GetMapping("/programas/ping")
    String ping();
}
