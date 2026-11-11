CREATE TABLE trips (
                       id BIGSERIAL PRIMARY KEY,
                       bus_id BIGINT NOT NULL,
                       route_id BIGINT NOT NULL,
                       departure_time TIMESTAMP NOT NULL,
                       arrival_time TIMESTAMP NOT NULL,
                       fare NUMERIC(10,2) NOT NULL,
                       available_seats INTEGER NOT NULL,
                       status VARCHAR(30) DEFAULT 'SCHEDULED'
);