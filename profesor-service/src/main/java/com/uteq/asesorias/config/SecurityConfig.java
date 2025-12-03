package com.uteq.asesorias.config;
// JWT security config for profesor-service
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {
    private final String secret = System.getenv().getOrDefault("JWT_SECRET","dev-secret-please-change-32-bytes-minimum-please-ensure-length-64");
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.httpBasic(b -> b.disable());
        http.formLogin(f -> f.disable());
        http.sessionManagement(sm -> sm.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS));
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/actuator/**","/profesores/ping").permitAll()
                .anyRequest().authenticated());
        http.addFilterBefore(new JwtFilter(secret), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    static class JwtFilter extends OncePerRequestFilter {
        private final String secret; JwtFilter(String secret){this.secret=secret;}
        @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
            String auth = request.getHeader("Authorization");
            if (auth!=null && auth.startsWith("Bearer ")){
                try{
                    var claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).build().parseSignedClaims(auth.substring(7)).getPayload();
                    Object rolesObj = claims.get("roles");
                    List<String> roles = rolesObj instanceof List<?> l? l.stream().map(String::valueOf).collect(Collectors.toList()): List.of();
                    var authorities = roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(claims.getSubject(), null, authorities));
                }catch(Exception ignored){}
            }
            chain.doFilter(request,response);
        }
    }
}