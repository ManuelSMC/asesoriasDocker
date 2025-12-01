package com.uteq.asesorias.user.web;

import com.uteq.asesorias.user.domain.Division;
import com.uteq.asesorias.user.domain.Programa;
import com.uteq.asesorias.user.domain.Materia;
import com.uteq.asesorias.user.repo.DivisionRepository;
import com.uteq.asesorias.user.repo.ProgramaRepository;
import com.uteq.asesorias.user.repo.MateriaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {
    private final DivisionRepository divisiones;
    private final ProgramaRepository programas;
    private final MateriaRepository materias;

    public CatalogController(DivisionRepository divisiones, ProgramaRepository programas, MateriaRepository materias) {
        this.divisiones = divisiones;
        this.programas = programas;
        this.materias = materias;
    }

    // Divisiones
    @GetMapping("/divisiones")
    public List<Division> allDivisiones() { return divisiones.findAll(); }

    @PostMapping("/divisiones")
    public ResponseEntity<?> createDivision(@RequestBody Division d) { return ResponseEntity.ok(divisiones.save(d)); }

    @PatchMapping("/divisiones/{id}")
    public ResponseEntity<?> updateDivision(@PathVariable Long id, @RequestBody Division partial) {
        return divisiones.findById(id).map(ex -> {
            if (partial.getNombre() != null && !partial.getNombre().isBlank()) ex.setNombre(partial.getNombre());
            ex.setActivo(partial.isActivo());
            return ResponseEntity.ok(divisiones.save(ex));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Programas
    @GetMapping("/programas")
    public List<Programa> allProgramas() { return programas.findAll(); }

    @PostMapping("/programas")
    public ResponseEntity<?> createPrograma(@RequestBody Programa p) { return ResponseEntity.ok(programas.save(p)); }

    @PatchMapping("/programas/{id}")
    public ResponseEntity<?> updatePrograma(@PathVariable Long id, @RequestBody Programa partial) {
        return programas.findById(id).map(ex -> {
            if (partial.getNombre() != null && !partial.getNombre().isBlank()) ex.setNombre(partial.getNombre());
            if (partial.getDivisionId() != null) ex.setDivisionId(partial.getDivisionId());
            ex.setActivo(partial.isActivo());
            return ResponseEntity.ok(programas.save(ex));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Materias
    @GetMapping("/materias")
    public List<Materia> allMaterias() { return materias.findAll(); }

    @PostMapping("/materias")
    public ResponseEntity<?> createMateria(@RequestBody Materia m) { return ResponseEntity.ok(materias.save(m)); }

    @PatchMapping("/materias/{id}")
    public ResponseEntity<?> updateMateria(@PathVariable Long id, @RequestBody Materia partial) {
        return materias.findById(id).map(ex -> {
            if (partial.getNombre() != null && !partial.getNombre().isBlank()) ex.setNombre(partial.getNombre());
            ex.setActivo(partial.isActivo());
            return ResponseEntity.ok(materias.save(ex));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}