package com.uteq.asesorias.repo;

import com.uteq.asesorias.domain.Programa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProgramaRepository extends JpaRepository<Programa, Long> {
    List<Programa> findByDivisionId(Long divisionId);
}
