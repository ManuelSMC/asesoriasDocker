package com.uteq.asesorias.auth.web;

import com.uteq.asesorias.auth.web.dto.LoginRequest;
import com.uteq.asesorias.auth.web.dto.TokenResponse;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

        private final String secret = System.getenv().getOrDefault(
            "JWT_SECRET",
            "dev-secret-please-change-32-bytes-minimum-please-ensure-length-64"
        );

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        System.out.println("/auth/login payload: email=" + req.getEmail());
        if (!StringUtils.hasText(req.getEmail()) || !StringUtils.hasText(req.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email y contraseña requeridos"));
        }
        if (!req.getEmail().toLowerCase().endsWith("@uteq.edu.mx")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Solo correos institucionales @uteq.edu.mx"));
        }
        // Buscar usuario en user-service y obtener rol
        Map user;
        try {
            RestTemplate rt = new RestTemplate();
            String url = "http://localhost:8082/users/by-email?email=" + req.getEmail();
            var resp = rt.getForEntity(url, Map.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no encontrado"));
            }
            user = resp.getBody();
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound nf) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no encontrado"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Fallo al consultar user-service", "message", ex.getMessage()));
        }

        // Validación básica de contraseña temporal
        boolean valid = "password".equals(req.getPassword());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales incorrectas"));
        }

        try {
            Instant now = Instant.now();
            String role = String.valueOf(user.getOrDefault("rol", "ALUMNO"));
            String token = Jwts.builder()
                .subject(req.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .claim("roles", new String[]{role})
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();
            return ResponseEntity.ok(new TokenResponse(token));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Token generation failed", "message", e.getMessage()));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestHeader(name = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
        }
        String token = authHeader.substring(7);
        try {
            Jwts.parser().verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).build().parseSignedClaims(token);
            return ResponseEntity.ok(Map.of("valid", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
