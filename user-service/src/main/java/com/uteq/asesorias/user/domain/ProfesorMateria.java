package com.uteq.asesorias.user.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "profesor_materias", uniqueConstraints = @UniqueConstraint(columnNames = {"profesor_id", "materia_id"}))
public class ProfesorMateria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "profesor_id", nullable = false)
    private Long profesorId;

    @Column(name = "materia_id", nullable = false)
    private Long materiaId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProfesorId() { return profesorId; }
    public void setProfesorId(Long profesorId) { this.profesorId = profesorId; }

    public Long getMateriaId() { return materiaId; }
    public void setMateriaId(Long materiaId) { this.materiaId = materiaId; }
}
