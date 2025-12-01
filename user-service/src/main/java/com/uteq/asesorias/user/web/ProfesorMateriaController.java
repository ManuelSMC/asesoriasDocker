package com.uteq.asesorias.user.web;

import com.uteq.asesorias.user.domain.Materia;
import com.uteq.asesorias.user.domain.ProfesorMateria;
import com.uteq.asesorias.user.repo.MateriaRepository;
import com.uteq.asesorias.user.repo.ProfesorMateriaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class ProfesorMateriaController {

    private final ProfesorMateriaRepository profesorMaterias;
    private final MateriaRepository materias;

    public ProfesorMateriaController(ProfesorMateriaRepository profesorMaterias, MateriaRepository materias) {
        this.profesorMaterias = profesorMaterias;
        this.materias = materias;
    }

    @GetMapping("/profesores/{profesorId}/materias")
    public List<Materia> listarMaterias(@PathVariable Long profesorId) {
        var asignaciones = profesorMaterias.findByProfesorId(profesorId);
        var ids = asignaciones.stream().map(ProfesorMateria::getMateriaId).collect(Collectors.toList());
        return ids.isEmpty() ? List.of() : materias.findAllById(ids);
    }

    @PostMapping("/profesores/{profesorId}/materias")
    public ResponseEntity<?> asignarMaterias(@PathVariable Long profesorId, @RequestBody List<Long> materiaIds) {
        profesorMaterias.deleteByProfesorId(profesorId);
        if (materiaIds != null) {
            for (Long mid : materiaIds) {
                if (mid == null) continue;
                var pm = new ProfesorMateria();
                pm.setProfesorId(profesorId);
                pm.setMateriaId(mid);
                profesorMaterias.save(pm);
            }
        }
        return ResponseEntity.ok(listarMaterias(profesorId));
    }
}
