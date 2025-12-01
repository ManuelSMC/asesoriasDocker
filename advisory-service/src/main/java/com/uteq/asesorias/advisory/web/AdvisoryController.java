package com.uteq.asesorias.advisory.web;

import com.uteq.asesorias.advisory.domain.Advisory;
import com.uteq.asesorias.advisory.repo.AdvisoryRepository;
import com.uteq.asesorias.advisory.repo.AdvisoryRegistrationRepository;
import com.uteq.asesorias.advisory.domain.AdvisoryRegistration;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/advisories")
public class AdvisoryController {

    private final AdvisoryRepository repo;
    private final AdvisoryRegistrationRepository regRepo;

    public AdvisoryController(AdvisoryRepository repo, AdvisoryRegistrationRepository regRepo) {
        this.repo = repo;
        this.regRepo = regRepo;
    }

    @GetMapping
    public List<Advisory> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        return repo.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, org.springframework.security.core.Authentication auth) {
        try {
            Advisory adv = new Advisory();
            // profesorId: use payload if present (accept number or string), else resolve from auth principal email
            Long profesorId = toLong(body.get("profesorId"));
            if (profesorId == null) {
                try {
                    String email = auth != null ? String.valueOf(auth.getPrincipal()) : null;
                    if (email != null && !email.isBlank()) {
                        RestTemplate rt = new RestTemplate();
                        var user = rt.getForObject("http://localhost:8082/users/by-email?email=" + email, java.util.Map.class);
                        if (user != null && user.get("id") != null) {
                            profesorId = toLong(user.get("id"));
                        }
                    }
                } catch (Exception ignored) {}
            }
            if (profesorId == null) return ResponseEntity.badRequest().body("profesorId is required or could not be resolved from token");
            adv.setProfesorId(profesorId);

            // alumnoId optional, can be provided as id or via alumnoEmail, or derived from auth if ALUMNO
            Long alumnoId = toLong(body.get("alumnoId"));
            if (alumnoId == null && body.get("alumnoEmail") != null) {
                String email = String.valueOf(body.get("alumnoEmail"));
                try {
                    RestTemplate rt = new RestTemplate();
                    var user = rt.getForObject("http://localhost:8082/users/by-email?email=" + email, java.util.Map.class);
                    if (user != null && user.get("id") != null) {
                        alumnoId = toLong(user.get("id"));
                    }
                } catch (Exception ignored) {}
            }
            if (alumnoId == null && auth != null && auth.getAuthorities().stream().anyMatch(a -> "ALUMNO".equals(a.getAuthority()))) {
                try {
                    String email = String.valueOf(auth.getPrincipal());
                    if (email != null && !email.isBlank()) {
                        RestTemplate rt = new RestTemplate();
                        var user = rt.getForObject("http://localhost:8082/users/by-email?email=" + email, java.util.Map.class);
                        if (user != null && user.get("id") != null) {
                            alumnoId = toLong(user.get("id"));
                        }
                    }
                } catch (Exception ignored) {}
            }
            if (alumnoId != null) adv.setAlumnoId(alumnoId);

            if (body.get("tema") != null) adv.setTema(String.valueOf(body.get("tema")));
            if (body.get("fecha") != null) {
                try {
                    adv.setFecha(parseDateTime(String.valueOf(body.get("fecha"))));
                } catch (Exception ignored) {}
            }
            // If creator is PROFESOR, auto-approve
            boolean isProfesor = auth != null && auth.getAuthorities().stream().anyMatch(a -> "PROFESOR".equals(a.getAuthority()));
            if (isProfesor) {
                adv.setEstado(Advisory.Estado.APROBADA);
            }
            return ResponseEntity.ok(repo.save(adv));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }
    }

    private static Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try {
            String s = String.valueOf(v).trim();
            if (s.isEmpty()) return null;
            return Long.parseLong(s);
        } catch (Exception e) { return null; }
    }

    private static java.time.LocalDateTime parseDateTime(String s) {
        if (s == null) return null;
        try {
            return java.time.LocalDateTime.parse(s);
        } catch (Exception ignored) {}
        // try without seconds by appending :00 if needed
        try {
            if (s.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}")) {
                return java.time.LocalDateTime.parse(s + ":00");
            }
        } catch (Exception ignored) {}
        // try custom formatter with optional seconds
        try {
            var fmt = new java.time.format.DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM-dd'T'HH:mm")
                    .optionalStart().appendPattern(":ss").optionalEnd()
                    .optionalStart().appendPattern(".SSS").optionalEnd()
                    .toFormatter();
            return java.time.LocalDateTime.parse(s, fmt);
        } catch (Exception ignored) {}
        return null;
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body, org.springframework.security.core.Authentication auth) {
        return repo.findById(id).map(adv -> {
            try {
                // ownership or admin
                boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> "ADMINISTRADOR".equals(a.getAuthority()));
                Long profesorId = adv.getProfesorId();
                Long authUserId = null;
                if (auth != null) {
                    try {
                        String email = String.valueOf(auth.getPrincipal());
                        RestTemplate rt = new RestTemplate();
                        var user = rt.getForObject("http://localhost:8082/users/by-email?email=" + email, java.util.Map.class);
                        if (user != null && user.containsKey("id")) {
                            authUserId = ((Number) user.get("id")).longValue();
                        }
                    } catch (Exception ignored) {}
                }
                if (!isAdmin && (authUserId == null || !authUserId.equals(profesorId))) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not owner professor");
                }
                if (body.containsKey("tema")) adv.setTema(String.valueOf(body.get("tema")));
                if (body.containsKey("fecha")) {
                    try { adv.setFecha(java.time.LocalDateTime.parse(String.valueOf(body.get("fecha")))); } catch (Exception ignored) {}
                }
                return ResponseEntity.ok(repo.save(adv));
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
            }
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-alumno")
    public List<Advisory> byAlumno(@RequestParam Long alumnoId) { return repo.findByAlumnoId(alumnoId); }

    @GetMapping("/by-profesor")
    public List<Advisory> byProfesor(@RequestParam Long profesorId) { return repo.findByProfesorId(profesorId); }

    // Registrations
    @GetMapping("/{id}/registrations")
    public List<AdvisoryRegistration> registrations(@PathVariable Long id) {
        return regRepo.findByAdvisoryId(id);
    }

    @PostMapping("/{id}/registrations")
    public ResponseEntity<?> register(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Number alumnoId = (Number) body.get("alumnoId");
        if (alumnoId == null) return ResponseEntity.badRequest().body("alumnoId is required");
        if (regRepo.existsByAdvisoryIdAndAlumnoId(id, alumnoId.longValue())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Already registered");
        }
        AdvisoryRegistration reg = new AdvisoryRegistration();
        reg.setAdvisoryId(id);
        reg.setAlumnoId(alumnoId.longValue());
        return ResponseEntity.ok(regRepo.save(reg));
    }

    @GetMapping("/registered/by-alumno")
    public List<Advisory> registeredByAlumno(@RequestParam Long alumnoId) {
        var regs = regRepo.findByAlumnoId(alumnoId);
        var ids = regs.stream().map(AdvisoryRegistration::getAdvisoryId).distinct().toList();
        return ids.isEmpty() ? List.of() : repo.findByIdIn(ids);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> updateEstado(@PathVariable Long id, @RequestParam Advisory.Estado estado, Authentication auth) {
        return repo.findById(id)
                .map(adv -> {
                    // Enforce ownership: authenticated professor must match advisory.profesorId
                    try {
                        String email = auth != null ? String.valueOf(auth.getPrincipal()) : null;
                        if (email == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No authentication principal");
                        RestTemplate rt = new RestTemplate();
                        var user = rt.getForObject("http://localhost:8082/users/by-email?email=" + email, java.util.Map.class);
                        if (user == null || !user.containsKey("id")) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User not found");
                        }
                        Number profId = (Number) user.get("id");
                        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> "ADMINISTRADOR".equals(a.getAuthority()));
                        if (!isAdmin) {
                            if (profId == null || adv.getProfesorId() == null || profId.longValue() != adv.getProfesorId()) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not owner professor");
                            }
                        }
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Ownership check failed");
                    }
                    adv.setEstado(estado);
                    var saved = repo.save(adv);
                    // If approving a student's request, auto-register the requesting alumno
                    if (estado == Advisory.Estado.APROBADA) {
                        Long alumnoId = saved.getAlumnoId();
                        if (alumnoId != null && !regRepo.existsByAdvisoryIdAndAlumnoId(saved.getId(), alumnoId)) {
                            AdvisoryRegistration reg = new AdvisoryRegistration();
                            reg.setAdvisoryId(saved.getId());
                            reg.setAlumnoId(alumnoId);
                            regRepo.save(reg);
                        }
                    }
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<?> updateEstadoPost(@PathVariable Long id, @RequestParam Advisory.Estado estado, Authentication auth) {
        return updateEstado(id, estado, auth);
    }

    // Reports for coordinator
    @GetMapping("/reports/estado")
    public ResponseEntity<?> reportByEstado() {
        var rows = repo.countByEstado();
        return ResponseEntity.ok(rows.stream().map(r -> Map.of(
                "estado", String.valueOf(r[0]),
                "total", ((Number) r[1]).longValue()
        )).toList());
    }

    @GetMapping("/reports/profesor-estado")
    public ResponseEntity<?> reportByProfesorEstado() {
        var rows = repo.countByProfesorAndEstado();
        return ResponseEntity.ok(rows.stream().map(r -> Map.of(
                "profesorId", ((Number) r[0]).longValue(),
                "estado", String.valueOf(r[1]),
                "total", ((Number) r[2]).longValue()
        )).toList());
    }

    @GetMapping("/reports/alumno-estado")
    public ResponseEntity<?> reportByAlumnoEstado() {
        var rows = repo.countByAlumnoAndEstado();
        return ResponseEntity.ok(rows.stream().map(r -> Map.of(
                "alumnoId", ((Number) r[0]).longValue(),
                "estado", String.valueOf(r[1]),
                "total", ((Number) r[2]).longValue()
        )).toList());
    }
}
