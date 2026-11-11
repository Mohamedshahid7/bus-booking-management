CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       full_name VARCHAR(100) NOT NULL,
                       email VARCHAR(150) NOT NULL UNIQUE,
                       phone VARCHAR(20) UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER',
                       enabled BOOLEAN NOT NULL DEFAULT TRUE,
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE operators (
                           id BIGSERIAL PRIMARY KEY,
                           company_name VARCHAR(150) NOT NULL,
                           email VARCHAR(150) NOT NULL UNIQUE,
                           phone VARCHAR(20),
                           address VARCHAR(255),
                           verified BOOLEAN NOT NULL DEFAULT FALSE,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE buses (
                       id BIGSERIAL PRIMARY KEY,
                       operator_id BIGINT NOT NULL,
                       bus_number VARCHAR(50) NOT NULL UNIQUE,
                       bus_name VARCHAR(100),
                       bus_type VARCHAR(50) NOT NULL,
                       registration_number VARCHAR(50) NOT NULL UNIQUE,
                       total_seats INTEGER NOT NULL,
                       active BOOLEAN NOT NULL DEFAULT TRUE,

                       CONSTRAINT fk_bus_operator
                           FOREIGN KEY (operator_id)
                               REFERENCES operators(id)
);

CREATE TABLE routes (
                        id BIGSERIAL PRIMARY KEY,
                        source VARCHAR(100) NOT NULL,
                        destination VARCHAR(100) NOT NULL,
                        distance_km DECIMAL(10,2),
                        duration_minutes INTEGER,
                        active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE schedules (
                           id BIGSERIAL PRIMARY KEY,
                           bus_id BIGINT NOT NULL,
                           route_id BIGINT NOT NULL,
                           departure_time TIMESTAMP NOT NULL,
                           arrival_time TIMESTAMP NOT NULL,
                           fare DECIMAL(10,2) NOT NULL,
                           available_seats INTEGER NOT NULL,

                           CONSTRAINT fk_schedule_bus
                               FOREIGN KEY (bus_id)
                                   REFERENCES buses(id),

                           CONSTRAINT fk_schedule_route
                               FOREIGN KEY (route_id)
                                   REFERENCES routes(id)
);

CREATE INDEX idx_schedules_departure
    ON schedules(departure_time);

CREATE INDEX idx_routes_source_destination
    ON routes(source, destination);

CREATE INDEX idx_users_email
    ON users(email);