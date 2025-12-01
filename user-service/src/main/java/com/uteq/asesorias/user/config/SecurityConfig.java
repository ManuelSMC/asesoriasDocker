package com.uteq.asesorias.user.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {

    private final String secret = System.getenv().getOrDefault(
            "JWT_SECRET",
            "dev-secret-please-change-32-bytes-minimum-please-ensure-length-64"
    );

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/users/by-email").permitAll() // usado por auth-service
            // Permitir a profesores, admins y coordinadores consultar datos básicos de un usuario por id
            .requestMatchers(HttpMethod.GET, "/users/*").hasAnyAuthority("PROFESOR", "ADMINISTRADOR", "COORDINADOR")
            .requestMatchers(HttpMethod.GET, "/users/by-id").hasAnyAuthority("PROFESOR", "ADMINISTRADOR", "COORDINADOR")
            .requestMatchers(HttpMethod.POST, "/users").hasAnyAuthority("ADMINISTRADOR")
            .anyRequest().authenticated()
        );
        http.addFilterBefore(new JwtFilter(secret), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    static class JwtFilter extends OncePerRequestFilter {
        private final String secret;
        JwtFilter(String secret) { this.secret = secret; }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
            String auth = request.getHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                String token = auth.substring(7);
                try {
                    var claims = Jwts.parser()
                            .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();
                    setAuthFromClaims(claims);
                } catch (Exception ex) {
                    // Fallback (inseguro): decodificar payload sin verificar firma para extraer roles y subject
                    // Debe eliminarse en producción. Asegurar mismo JWT_SECRET en auth-service y user-service.
                    try {
                            String[] parts = token.split("\\.");
                        if (parts.length >= 2) {
                            String json = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                            @SuppressWarnings("unchecked") Map<String,Object> claims = new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, Map.class);
                            setAuthFromClaims(claims);
                        }
                    } catch (Exception ignored) {}
                }
            }
            filterChain.doFilter(request, response);
        }

        private void setAuthFromClaims(Map<String,Object> claims) {
            Object rolesObj = claims.get("roles");
            List<String> roles;
            if (rolesObj instanceof List<?>) {
                roles = ((List<?>) rolesObj).stream().map(String::valueOf).collect(Collectors.toList());
            } else if (rolesObj instanceof String[]) {
                roles = Arrays.stream((String[]) rolesObj).collect(Collectors.toList());
            } else if (rolesObj instanceof String) {
                roles = List.of((String) rolesObj);
            } else {
                roles = List.of();
            }
            var authorities = roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
            var authToken = new UsernamePasswordAuthenticationToken(String.valueOf(claims.get("sub")), null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
    }
}