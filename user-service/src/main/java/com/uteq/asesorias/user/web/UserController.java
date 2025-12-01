package com.uteq.asesorias.user.web;

import com.uteq.asesorias.user.domain.User;
import com.uteq.asesorias.user.repo.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository repo;

    public UserController(UserRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<User> all() {
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody User u) {
        if (!u.getEmail().toLowerCase().endsWith("@uteq.edu.mx")) {
            return ResponseEntity.badRequest().body("Email debe ser institucional @uteq.edu.mx");
        }
        if (u.getPassword() == null || u.getPassword().isBlank()) {
            u.setPassword("password");
            u.setMustChangePassword(true);
        } else {
            u.setMustChangePassword(true); // siempre exigir cambio inicial
        }
        return ResponseEntity.ok(repo.save(u));
    }

    @GetMapping("/by-email")
    public ResponseEntity<?> byEmail(@RequestParam String email) {
        return repo.findByEmail(email)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> byId(@PathVariable Long id) {
        Optional<User> u = repo.findById(id);
        return u.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-id")
    public ResponseEntity<?> byIdParam(@RequestParam Long id) {
        Optional<User> u = repo.findById(id);
        return u.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody User partial) {
        return repo.findById(id).map(ex -> {
            if (partial.getNombre() != null && !partial.getNombre().isBlank()) ex.setNombre(partial.getNombre());
            if (partial.getEmail() != null && !partial.getEmail().isBlank()) ex.setEmail(partial.getEmail());
            if (partial.getRol() != null && !partial.getRol().isBlank()) ex.setRol(partial.getRol());
            if (partial.getDivisionId() != null) ex.setDivisionId(partial.getDivisionId());
            if (partial.getProgramaId() != null) ex.setProgramaId(partial.getProgramaId());
            ex.setActivo(partial.isActivo());
            return ResponseEntity.ok(repo.save(ex));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String,String> body, org.springframework.security.core.Authentication auth) {
        if (body == null || !body.containsKey("password")) {
            return ResponseEntity.badRequest().body("Nueva contraseña requerida");
        }
        String newPass = body.get("password");
        if (newPass == null || newPass.length() < 8) {
            return ResponseEntity.badRequest().body("Contraseña debe tener al menos 8 caracteres");
        }
        return repo.findById(id).map(user -> {
            String requester = auth != null ? String.valueOf(auth.getPrincipal()) : null;
            boolean isOwner = requester != null && requester.equalsIgnoreCase(user.getEmail());
            boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMINISTRADOR"));
            if (!isOwner && !isAdmin) {
                return ResponseEntity.status(403).body("No autorizado para cambiar esta contraseña");
            }
            user.setPassword(newPass);
            user.setMustChangePassword(false);
            repo.save(user);
            return ResponseEntity.ok(java.util.Map.of("status","ok"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
