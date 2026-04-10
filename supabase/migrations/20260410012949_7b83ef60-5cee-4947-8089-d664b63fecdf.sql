
-- 6 test bookings on Apr 12 ride, all under Ali Ehab (only real user)
-- Different pickup/dropoff to test map visualization

INSERT INTO bookings (user_id, shuttle_id, route_id, scheduled_date, scheduled_time, seats, total_price, status, custom_pickup_lat, custom_pickup_lng, custom_pickup_name, custom_dropoff_lat, custom_dropoff_lng, custom_dropoff_name)
VALUES
-- 1. Pickup Madinaty Gate 2, dropoff Smart Village
('8cae77ab-3d55-4a69-b316-90ec593d2a81', '486c0914-db13-48e2-a96b-ecc9fbd686f8', 'c73cbdc3-e753-4eaa-8a49-9c37c57d29c2', '2026-04-12', '08:00', 1, 35, 'confirmed', 30.105, 31.635, 'Madinaty Gate 2', 30.0712, 31.0167, 'Smart Village'),
-- 2. Pickup Rehab City, dropoff 6th October Entry
('8cae77ab-3d55-4a69-b316-90ec593d2a81', '486c0914-db13-48e2-a96b-ecc9fbd686f8', 'c73cbdc3-e753-4eaa-8a49-9c37c57d29c2', '2026-04-12', '08:00', 2, 70, 'confirmed', 30.063, 31.490, 'Rehab City', 30.068, 31.100, '6th October Entry'),
-- 3. Pickup Fifth Settlement AUC, dropoff Smart Village
('8cae77ab-3d55-4a69-b316-90ec593d2a81', '486c0914-db13-48e2-a96b-ecc9fbd686f8', 'c73cbdc3-e753-4eaa-8a49-9c37c57d29c2', '2026-04-12', '08:00', 1, 35, 'confirmed', 30.008, 31.430, 'Fifth Settlement - AUC', 30.0712, 31.0167, 'Smart Village'),
-- 4. Pickup New Cairo Waterway, dropoff Ring Road Mehwar
('8cae77ab-3d55-4a69-b316-90ec593d2a81', '486c0914-db13-48e2-a96b-ecc9fbd686f8', 'c73cbdc3-e753-4eaa-8a49-9c37c57d29c2', '2026-04-12', '08:00', 1, 35, 'confirmed', 30.030, 31.470, 'New Cairo - Waterway', 30.065, 31.200, 'Ring Road - Mehwar'),
-- 5. Pickup Nasr City CityStars, dropoff Smart Village
('8cae77ab-3d55-4a69-b316-90ec593d2a81', '486c0914-db13-48e2-a96b-ecc9fbd686f8', 'c73cbdc3-e753-4eaa-8a49-9c37c57d29c2', '2026-04-12', '08:00', 1, 35, 'confirmed', 30.060, 31.340, 'Nasr City - City Stars', 30.0712, 31.0167, 'Smart Village'),
-- 6. Pickup Heliopolis Triumph, dropoff Mall of Arabia
('8cae77ab-3d55-4a69-b316-90ec593d2a81', '486c0914-db13-48e2-a96b-ecc9fbd686f8', 'c73cbdc3-e753-4eaa-8a49-9c37c57d29c2', '2026-04-12', '08:00', 1, 35, 'confirmed', 30.085, 31.320, 'Heliopolis - Triumph', 30.070, 31.050, '6th October - Mall of Arabia');
