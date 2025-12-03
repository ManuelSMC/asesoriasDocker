package com.uteq.asesorias.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@FeignClient(name = "materia-service", configuration = com.uteq.asesorias.config.FeignAuthConfig.class)
public interface MateriaClient {
    @GetMapping("/materias/by-profesor")
    List<Object> getMateriasByProfesor(@RequestParam("profesorId") Long profesorId);

    @PostMapping("/materias")
    Object createMateria(@RequestBody java.util.Map<String, Object> materiaPayload);
}
