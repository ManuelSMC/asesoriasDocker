package com.uteq.asesorias.advisory.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "advisory_registrations", uniqueConstraints = @UniqueConstraint(columnNames = {"advisoryId", "alumnoId"}))
public class AdvisoryRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long advisoryId;

    @NotNull
    private Long alumnoId;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAdvisoryId() { return advisoryId; }
    public void setAdvisoryId(Long advisoryId) { this.advisoryId = advisoryId; }
    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
