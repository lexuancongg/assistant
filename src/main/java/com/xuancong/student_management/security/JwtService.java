package com.xuancong.student_management.security;

import com.xuancong.student_management.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

@Component
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-minutes:15}")
    private long accessTokenExpirationMinutes;

    @Value("${jwt.refresh-token-expiration-days:30}")
    private long refreshTokenExpirationDays;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            signingKey = Keys.hmacShaKeyFor(padded);
        } else {
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
    }

    /** Subject = email của entity/User */
    public String createAccessToken(User user) {
        Instant now = Instant.now();
        String role = user.getRole() != null ? "ROLE_" + user.getRole().name() : "ROLE_USER";
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", role)
                .claim("name", user.getName())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(accessTokenExpirationMinutes, ChronoUnit.MINUTES)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Instant calculateRefreshTokenExpiry() {
        return Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS);
    }

    public Optional<String> getEmailFromToken(String token) {
        try {
            return Optional.ofNullable(parseClaims(token).getSubject());
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(Date.from(Instant.now()));
        } catch (Exception ex) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Backward-compat alias for JwtAuthenticationFilter
    public Optional<String> getUsernameFromToken(String token) {
        return getEmailFromToken(token);
    }

    public boolean isTokenValid(String token, org.springframework.security.core.userdetails.UserDetails userDetails) {
        return getEmailFromToken(token)
                .map(email -> email.equals(userDetails.getUsername()) && validateToken(token))
                .orElse(false);
    }
}
