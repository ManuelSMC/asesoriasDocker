package com.uteq.asesorias;

import com.uteq.asesorias.domain.Profesor;
import com.uteq.asesorias.repo.ProfesorRepository;
import com.uteq.asesorias.client.MateriaClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/profesores")
public class ProfesorController {
    private final ProfesorRepository repo;
    private final MateriaClient materiaClient;
    public ProfesorController(ProfesorRepository repo, MateriaClient materiaClient) { this.repo = repo; this.materiaClient = materiaClient; }

    @GetMapping("/ping")
    public String ping() { return "profesor-ok"; }

    @GetMapping
    public List<Profesor> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-email")
    public ResponseEntity<?> byEmail(@RequestParam String email) {
        return repo.findByEmail(email).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Profesor create(@RequestBody Profesor p) { return repo.save(p); }

    // Crear profesor y asignar una o varias materias en una sola llamada
    @PostMapping("/full")
    public ResponseEntity<?> createWithMaterias(@RequestBody java.util.Map<String, Object> payload) {
        // Espera { profesor: {nombre, email, activo}, materias: [{nombre, activo}, ...] }
        if (payload == null) payload = new java.util.HashMap<>();
        Object profObj = payload.get("profesor");
        if (!(profObj instanceof java.util.Map)) return ResponseEntity.badRequest().body(java.util.Map.of("error","profesor requerido"));
        java.util.Map<String,Object> profMap = (java.util.Map<String,Object>) profObj;
        Profesor p = new Profesor();
        p.setNombre(String.valueOf(profMap.getOrDefault("nombre","")));
        p.setEmail(String.valueOf(profMap.getOrDefault("email","")));
        Object activoObj = profMap.get("activo");
        boolean activo = activoObj == null ? true : Boolean.parseBoolean(String.valueOf(activoObj));
        p.setActivo(activo);
        Profesor saved = repo.save(p);

        Object materiasObj = payload.get("materias");
        java.util.List<java.util.Map<String,Object>> materias = new java.util.ArrayList<>();
        if (materiasObj instanceof java.util.List<?>) {
            for (Object o : (java.util.List<?>) materiasObj) {
                if (o instanceof java.util.Map<?,?> raw) {
                    java.util.Map<String,Object> normalized = new java.util.HashMap<>();
                    for (java.util.Map.Entry<?,?> e : raw.entrySet()) {
                        String key = String.valueOf(e.getKey());
                        normalized.put(key, e.getValue());
                    }
                    materias.add(normalized);
                }
            }
        }
        java.util.List<Object> creadas = new java.util.ArrayList<>();
        for (java.util.Map<String,Object> m : materias) {
            m.put("profesorId", saved.getId());
            if (!m.containsKey("activo")) m.put("activo", true);
            Object creada = materiaClient.createMateria(m);
            creadas.add(creada);
        }
        return ResponseEntity.ok(java.util.Map.of("profesor", saved, "materias", creadas));
    }

    @GetMapping("/{id}/materias")
    public ResponseEntity<?> materias(@PathVariable Long id) {
        return ResponseEntity.ok(materiaClient.getMateriasByProfesor(id));
    }

    @PostMapping("/{id}/materias")
    public ResponseEntity<?> asignarMateria(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        body = body == null ? new java.util.HashMap<>() : new java.util.HashMap<>(body);
        body.put("profesorId", id);
        Object creada = materiaClient.createMateria(body);
        return ResponseEntity.ok(creada);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Profesor p) {
        return repo.findById(id).map(ex -> {
            if (p.getNombre() != null) ex.setNombre(p.getNombre());
            if (p.getEmail() != null) ex.setEmail(p.getEmail());
            ex.setActivo(p.isActivo());
            return ResponseEntity.ok(repo.save(ex));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
