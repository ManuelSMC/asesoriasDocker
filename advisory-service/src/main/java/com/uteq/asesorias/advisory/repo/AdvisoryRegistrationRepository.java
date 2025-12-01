package com.uteq.asesorias.advisory.repo;

import com.uteq.asesorias.advisory.domain.AdvisoryRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdvisoryRegistrationRepository extends JpaRepository<AdvisoryRegistration, Long> {
    List<AdvisoryRegistration> findByAdvisoryId(Long advisoryId);
    List<AdvisoryRegistration> findByAlumnoId(Long alumnoId);
    boolean existsByAdvisoryIdAndAlumnoId(Long advisoryId, Long alumnoId);
}
