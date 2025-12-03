package com.uteq.asesorias.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {
    // Remove WebFlux security to avoid compilation errors; gateway remains permissive.
}
