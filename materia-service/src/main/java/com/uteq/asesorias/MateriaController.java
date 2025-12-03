package com.uteq.asesorias;

import com.uteq.asesorias.domain.Materia;
import com.uteq.asesorias.repo.MateriaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/materias")
public class MateriaController {
    private final MateriaRepository repo;
    public MateriaController(MateriaRepository repo) { this.repo = repo; }

    @GetMapping("/ping")
    public String ping() { return "materia-ok"; }

    @GetMapping
    public List<Materia> all() { return repo.findAll(); }

    @GetMapping("/by-profesor")
    public List<Materia> byProfesor(@RequestParam Long profesorId) { return repo.findByProfesorId(profesorId); }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Materia create(@RequestBody Materia m) { return repo.save(m); }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Materia m) {
        return repo.findById(id).map(ex -> {
            if (m.getNombre() != null) ex.setNombre(m.getNombre());
            if (m.getProfesorId() != null) ex.setProfesorId(m.getProfesorId());
            ex.setActivo(m.isActivo());
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
