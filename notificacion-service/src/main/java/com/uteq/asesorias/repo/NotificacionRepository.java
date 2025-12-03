package com.uteq.asesorias.repo;

import com.uteq.asesorias.domain.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUserId(Long userId);
}
