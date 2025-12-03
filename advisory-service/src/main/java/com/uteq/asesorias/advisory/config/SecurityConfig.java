package com.uteq.asesorias.advisory.config;

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
            // Creation allowed to ALUMNO or PROFESOR
            .requestMatchers(HttpMethod.POST, "/advisories", "/advisories/**").hasAnyAuthority("ALUMNO", "PROFESOR")
            // Update advisory by id (PATCH on /advisories/{id} and specific estado endpoint)
            .requestMatchers(HttpMethod.PATCH, "/advisories/*", "/advisories/*/estado").hasAnyAuthority("PROFESOR", "ADMINISTRADOR")
            // Registrations
            .requestMatchers(HttpMethod.POST, "/advisories/*/registrations").hasAuthority("ALUMNO")
            .requestMatchers(HttpMethod.GET, "/advisories/*/registrations").authenticated()
            .requestMatchers(HttpMethod.GET, "/advisories/registered/**").authenticated()
            // Estado change may be POST or PATCH on /advisories/*/estado
            .requestMatchers(HttpMethod.POST, "/advisories/*/estado").hasAuthority("PROFESOR")
            // Reports
            .requestMatchers(HttpMethod.GET, "/advisories/reports/**").hasAuthority("COORDINADOR")
            // Other gets
            .requestMatchers(HttpMethod.GET, "/advisories/**").authenticated()
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
                    Object rolesObj = claims.get("roles");
                    List<String> roles;
                    if (rolesObj instanceof List<?>) {
                        roles = ((List<?>) rolesObj).stream().map(String::valueOf).collect(Collectors.toList());
                    } else if (rolesObj instanceof String[]) {
                        roles = Arrays.asList((String[]) rolesObj);
                    } else if (rolesObj instanceof String) {
                        roles = List.of((String) rolesObj);
                    } else {
                        // fallback: try single role under different key names
                        Object singleRole = claims.get("rol");
                        if (singleRole == null) singleRole = claims.get("role");
                        if (singleRole == null) singleRole = claims.get("authority");
                        if (singleRole == null) singleRole = claims.get("authorities");
                        roles = singleRole != null ? List.of(String.valueOf(singleRole)) : List.of();
                    }
                    System.out.println("JWT subject=" + claims.getSubject() + " roles=" + roles);
                    var authorities = roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
                    var authToken = new UsernamePasswordAuthenticationToken(claims.getSubject(), null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    var authCtx = SecurityContextHolder.getContext().getAuthentication();
                    if (authCtx != null) {
                        System.out.println("Auth set: principal=" + authCtx.getPrincipal() + " authorities=" + authCtx.getAuthorities());
                    }
                } catch (Exception ignored) {}
            }
            filterChain.doFilter(request, response);
        }
    }
}
