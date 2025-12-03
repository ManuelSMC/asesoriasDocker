package com.uteq.asesorias.advisory.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "notificacion-service")
public interface NotificacionClient {
    @GetMapping("/notificaciones/ping")
    String ping();
}
