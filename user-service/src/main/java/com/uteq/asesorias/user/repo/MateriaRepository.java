package com.uteq.asesorias.user.repo;

import com.uteq.asesorias.user.domain.Materia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MateriaRepository extends JpaRepository<Materia, Long> {
}
