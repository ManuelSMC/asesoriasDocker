package com.uteq.asesorias;

import com.uteq.asesorias.domain.Notificacion;
import com.uteq.asesorias.repo.NotificacionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notificaciones")
public class NotificacionController {
    private final NotificacionRepository repo;
    public NotificacionController(NotificacionRepository repo) { this.repo = repo; }

    @GetMapping("/ping")
    public String ping() { return "notificacion-ok"; }

    @GetMapping
    public List<Notificacion> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-user")
    public List<Notificacion> byUser(@RequestParam Long userId) { return repo.findByUserId(userId); }

    @PostMapping
    public Notificacion create(@RequestBody Notificacion n) { return repo.save(n); }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Notificacion n) {
        return repo.findById(id).map(ex -> {
            if (n.getTipo() != null) ex.setTipo(n.getTipo());
            if (n.getMensaje() != null) ex.setMensaje(n.getMensaje());
            if (n.getUserId() != null) ex.setUserId(n.getUserId());
            ex.setLeida(n.isLeida());
            return ResponseEntity.ok(repo.save(ex));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
