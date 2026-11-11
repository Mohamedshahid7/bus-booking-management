package com.busbooking.backend.config;

import com.busbooking.backend.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .authorizeHttpRequests(auth -> auth

                        // Public endpoints
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/actuator",
                                "/actuator/**"
                        ).permitAll()

                        // Public route viewing
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/routes/**"
                        ).permitAll()

                        // Public trip viewing
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/trips/**"
                        ).permitAll()

                        // Trip management
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/trips/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/v1/trips/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/v1/trips/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/v1/trips/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        // Route management
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/routes/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/v1/routes/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/v1/routes/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        // Bus viewing
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/buses/**"
                        ).authenticated()

                        // Bus management
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/buses/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/v1/buses/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/v1/buses/**"
                        ).hasAnyRole("OPERATOR", "ADMIN")

                        // Admin dashboard and management
                        .requestMatchers("/api/v1/admin/**")
                        .hasRole("ADMIN")

                        // Operator dashboard
                        .requestMatchers("/api/v1/operator/dashboard")
                        .hasAnyRole("OPERATOR", "ADMIN")

                        // Other operator management endpoints: ADMIN only
                        .requestMatchers("/api/v1/operator/**")
                        .hasRole("ADMIN")

                        // Customer endpoints
                        .requestMatchers("/api/v1/customer/**")
                        .hasAnyRole("CUSTOMER", "ADMIN")

                        // Booking endpoints use controller-level role checks
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}