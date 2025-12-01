package com.uteq.asesorias.user.repo;

import com.uteq.asesorias.user.domain.ProfesorMateria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfesorMateriaRepository extends JpaRepository<ProfesorMateria, Long> {
    List<ProfesorMateria> findByProfesorId(Long profesorId);
    void deleteByProfesorId(Long profesorId);
}
