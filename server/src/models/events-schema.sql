-- UCSD Events Database Schema
-- Based on data analysis of 81,924 events from clubhive validator
-- Only storing the 25 variable properties + metadata

CREATE TABLE IF NOT EXISTS raw_events (
    -- Primary key - perfectly unique across all events
    id INT PRIMARY KEY,
    
    -- Event details
    event_name VARCHAR(500) NOT NULL COMMENT 'Max observed: 248 chars',
    event_start DATETIME NOT NULL COMMENT 'ISO 8601 format: YYYY-MM-DDTHH:mm:ss',
    event_end DATETIME NOT NULL,
    gmt_start DATETIME NOT NULL COMMENT 'GMT timezone version',
    gmt_end DATETIME NOT NULL,
    time_booking_start DATETIME NOT NULL COMMENT 'Booking time window',
    time_booking_end DATETIME NOT NULL,
    is_all_day_event BOOLEAN NOT NULL DEFAULT FALSE,
    timezone_abbreviation VARCHAR(10) NOT NULL DEFAULT 'PT' COMMENT 'PT or MT observed',
    
    -- Location details
    building VARCHAR(50) NOT NULL COMMENT 'Max observed: 19 chars',
    building_id INT NOT NULL COMMENT 'Range: -10 to 220',
    room VARCHAR(100) NOT NULL COMMENT 'Max observed: 46 chars', 
    room_id INT NOT NULL COMMENT 'Range: -10 to 1364',
    room_code VARCHAR(50) NOT NULL COMMENT 'Max observed: 25 chars',
    room_type VARCHAR(50) NOT NULL COMMENT 'Max observed: 28 chars',
    room_type_id INT NOT NULL COMMENT 'Range: 0 to 743',
    location VARCHAR(150) NOT NULL COMMENT 'Full location string, max: 61 chars',
    location_link VARCHAR(255) NOT NULL COMMENT 'URL path, max: 113 chars',
    
    -- Organization details  
    group_name VARCHAR(150) NOT NULL COMMENT 'Max observed: 56 chars',
    reservation_id INT NOT NULL COMMENT 'Range: 2391 to 246738, 30779 unique values',
    reservation_summary_url VARCHAR(255) NOT NULL COMMENT 'URL path, max: 82 chars',
    
    -- Status tracking
    status_id INT NOT NULL COMMENT 'Range: 1 to 791, 5 unique values',
    status_type_id INT NOT NULL COMMENT 'Range: -14 to -11, 2 unique values',
    web_user_is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata for change tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When first scraped',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When last modified',
    
    -- Indexes for common queries
    INDEX idx_event_start (event_start),
    INDEX idx_event_end (event_end),
    INDEX idx_building_id (building_id),
    INDEX idx_room_id (room_id),
    INDEX idx_reservation_id (reservation_id),
    INDEX idx_group_name (group_name),
    INDEX idx_date_range (event_start, event_end),
    INDEX idx_location_search (building, room)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table to store expected constant field values for monitoring
CREATE TABLE IF NOT EXISTS raw_constant_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    expected_value TEXT NOT NULL,
    
    UNIQUE KEY unique_field (field_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table to log constant field violations
CREATE TABLE IF NOT EXISTS raw_constant_violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    expected_value TEXT NOT NULL,
    actual_value TEXT NOT NULL,
    violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_id (event_id),
    INDEX idx_field_name (field_name),
    INDEX idx_violation_time (violation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert expected constant values for monitoring
INSERT INTO raw_constant_fields (field_name, expected_value) VALUES
('AllowCancel', 'false'),
('AllowCancelPamInstance', 'false'),
('AllowEdit', 'false'),
('AllowEndNow', 'false'),
('CanCheckIn', 'false'),
('ChangeHost', 'false'),
('CheckInMinutes', '0'),
('DefaultCancelReason', '0'),
('EventCount', '0'),
('FloorID', '0'),
('GroupId', '0'),
('HasServices', 'false'),
('ImageHeight', '0'),
('ImageId', '0'),
('ImageWidth', '0'),
('InternalId', '0'),
('IsCalendaringEnabled', 'false'),
('IsCheckedIn', 'false'),
('IsHoliday', 'false'),
('IsSkypeEnabled', 'false'),
('IsTeamsEnabled', 'false'),
('IsWebexEnabled', 'false'),
('IsZoomEnabled', 'false'),
('OccurrenceCount', '0'),
('RequiresCancelReason', 'false'),
('RequiresCheckIn', 'false'),
('ReserveType', '0'),
('ShowAddServices', 'false'),
('ShowCheckinButton', 'false'),
('ShowFloorMap', 'false'),
('StatusType', '0'),
('TotalNumberOfBookings', '0'),
('VideoConferenceHost', 'false'),
('EventGmtEnd', '0001-01-01T00:00:00'),
('EventGmtStart', '0001-01-01T00:00:00'),
('UserEventEnd', '0001-01-01T00:00:00'),
('UserEventStart', '0001-01-01T00:00:00')
ON DUPLICATE KEY UPDATE expected_value = VALUES(expected_value);