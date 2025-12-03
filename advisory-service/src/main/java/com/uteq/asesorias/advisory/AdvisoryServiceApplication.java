package com.uteq.asesorias.advisory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class AdvisoryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdvisoryServiceApplication.class, args);
    }
}
