package com.xuancong.student_management.security;

import com.xuancong.student_management.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
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

    @Value("${jwt.secret:change-me-this-secret-key-please-1234567890}")
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

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getRole() != null ? user.getRole().getName() : "ROLE_USER")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(accessTokenExpirationMinutes, ChronoUnit.MINUTES)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Optional<String> getUsernameFromToken(String token) {
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

    public Instant calculateRefreshTokenExpiry() {
        return Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS);
    }
}
