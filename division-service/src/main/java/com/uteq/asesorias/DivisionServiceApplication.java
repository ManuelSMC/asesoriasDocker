package com.uteq.asesorias;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class DivisionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DivisionServiceApplication.class, args);
    }
}
