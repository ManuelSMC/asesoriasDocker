package com.uteq.asesorias.repo;

import com.uteq.asesorias.domain.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MateriaRepository extends JpaRepository<Materia, Long> {
	List<Materia> findByProfesorId(Long profesorId);
}
