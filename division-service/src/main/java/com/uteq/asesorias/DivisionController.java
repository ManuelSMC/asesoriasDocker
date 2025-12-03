package com.uteq.asesorias;

import com.uteq.asesorias.domain.Division;
import com.uteq.asesorias.repo.DivisionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/divisiones")
public class DivisionController {
    private final DivisionRepository repo;
    public DivisionController(DivisionRepository repo) { this.repo = repo; }

    @GetMapping("/ping")
    public String ping() { return "division-ok"; }

    @GetMapping
    public List<Division> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Division create(@RequestBody Division d) { return repo.save(d); }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Division d) {
        return repo.findById(id).map(ex -> {
            if (d.getNombre() != null) ex.setNombre(d.getNombre());
            ex.setActivo(d.isActivo());
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
