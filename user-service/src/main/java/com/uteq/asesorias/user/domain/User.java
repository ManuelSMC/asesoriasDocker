package com.uteq.asesorias.user.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String nombre;

    @Email
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank
    private String rol; // ALUMNO, PROFESOR, ADMINISTRADOR, COORDINADOR

    private boolean activo = true;

    private Long divisionId;
    private Long programaId;

    @Column(nullable = false)
    private String password = "password"; // contraseña inicial temporal

    private boolean mustChangePassword = true; // exige cambio después del primer login

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public Long getProgramaId() { return programaId; }
    public void setProgramaId(Long programaId) { this.programaId = programaId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }
}
