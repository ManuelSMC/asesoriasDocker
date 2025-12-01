package com.uteq.asesorias.user.repo;

import com.uteq.asesorias.user.domain.Division;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DivisionRepository extends JpaRepository<Division, Long> {
}
