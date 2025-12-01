package com.uteq.asesorias.advisory.repo;

import com.uteq.asesorias.advisory.domain.Advisory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdvisoryRepository extends JpaRepository<Advisory, Long> {
    List<Advisory> findByAlumnoId(Long alumnoId);
    List<Advisory> findByProfesorId(Long profesorId);
    List<Advisory> findByIdIn(List<Long> ids);

    @Query("select a.estado as estado, count(a) as total from Advisory a group by a.estado")
    List<Object[]> countByEstado();

    @Query("select a.profesorId as profesorId, a.estado as estado, count(a) as total from Advisory a group by a.profesorId, a.estado")
    List<Object[]> countByProfesorAndEstado();

    @Query("select a.alumnoId as alumnoId, a.estado as estado, count(a) as total from Advisory a group by a.alumnoId, a.estado")
    List<Object[]> countByAlumnoAndEstado();
}
