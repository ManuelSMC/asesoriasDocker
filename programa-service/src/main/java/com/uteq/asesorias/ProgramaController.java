package com.uteq.asesorias;

import com.uteq.asesorias.domain.Programa;
import com.uteq.asesorias.repo.ProgramaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/programas")
public class ProgramaController {
    private final ProgramaRepository repo;
    public ProgramaController(ProgramaRepository repo) { this.repo = repo; }

    @GetMapping("/ping")
    public String ping() { return "programa-ok"; }

    @GetMapping
    public List<Programa> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-division")
    public List<Programa> byDivision(@RequestParam Long divisionId) { return repo.findByDivisionId(divisionId); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Programa p) {
        if (p.getDivisionId() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "error", "divisionId requerido",
                    "message", "El programa debe pertenecer a una división"
            ));
        }
        if (p.getNombre() == null || p.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "error", "nombre requerido"
            ));
        }
        Programa saved = repo.save(p);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Programa p) {
        return repo.findById(id).map(ex -> {
            if (p.getNombre() != null) ex.setNombre(p.getNombre());
            if (p.getDivisionId() != null) ex.setDivisionId(p.getDivisionId());
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
