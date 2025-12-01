package com.uteq.asesorias.advisory.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "advisories")
public class Advisory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private Long alumnoId;

    @NotNull
    private Long profesorId;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Estado estado = Estado.PENDIENTE;

    private LocalDateTime fecha;

    private String tema;

    public enum Estado { PENDIENTE, APROBADA, RECHAZADA, PROGRAMADA, FINALIZADA }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }
    public Long getProfesorId() { return profesorId; }
    public void setProfesorId(Long profesorId) { this.profesorId = profesorId; }
    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public String getTema() { return tema; }
    public void setTema(String tema) { this.tema = tema; }
}
