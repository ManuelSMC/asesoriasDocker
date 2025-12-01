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
}
