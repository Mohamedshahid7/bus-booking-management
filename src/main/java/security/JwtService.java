package com.busbooking.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Set;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expirationTime;

    private static final Set<String> ALLOWED_ROLES =
            Set.of("CUSTOMER", "OPERATOR", "ADMIN");

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );
    }

    public String generateToken(
            Long userId,
            String email,
            String role) {

        if (role == null ||
                !ALLOWED_ROLES.contains(role.toUpperCase())) {
            throw new IllegalArgumentException("Invalid user role");
        }

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role.toUpperCase())
                .issuedAt(new Date())
                .expiration(
                        new Date(System.currentTimeMillis() + expirationTime)
                )
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);

            String email = claims.getSubject();
            String role = claims.get("role", String.class);

            return email != null
                    && !email.isBlank()
                    && role != null
                    && ALLOWED_ROLES.contains(role.toUpperCase());

        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}