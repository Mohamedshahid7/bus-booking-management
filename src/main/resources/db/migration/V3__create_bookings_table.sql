CREATE TABLE bookings (
                          id BIGSERIAL PRIMARY KEY,
                          user_id BIGINT NOT NULL,
                          trip_id BIGINT NOT NULL,
                          seats_booked INTEGER NOT NULL,
                          total_fare NUMERIC(10,2) NOT NULL,
                          status VARCHAR(30) DEFAULT 'CONFIRMED',
                          booking_time TIMESTAMP
);