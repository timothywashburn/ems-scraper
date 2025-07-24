import DatabaseManager from '@/controllers/database-manager';
import { Event, RawEventData, EventChanges } from '@/types/event-types';

export class EventModel {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  // Transform raw API data to database format
  private transformRawEvent(raw: RawEventData): Omit<Event, 'created_at' | 'updated_at'> {
    return {
      id: raw.Id,
      event_name: raw.EventName,
      event_start: new Date(raw.EventStart),
      event_end: new Date(raw.EventEnd),
      gmt_start: new Date(raw.GmtStart),
      gmt_end: new Date(raw.GmtEnd),
      time_booking_start: new Date(raw.TimeBookingStart),
      time_booking_end: new Date(raw.TimeBookingEnd),
      is_all_day_event: raw.IsAllDayEvent,
      timezone_abbreviation: raw.TimezoneAbbreviation,
      building: raw.Building,
      building_id: raw.BuildingId,
      room: raw.Room,
      room_id: raw.RoomId,
      room_code: raw.RoomCode,
      room_type: raw.RoomType,
      room_type_id: raw.RoomTypeId,
      location: raw.Location,
      location_link: raw.LocationLink,
      group_name: raw.GroupName,
      reservation_id: raw.ReservationId,
      reservation_summary_url: raw.ReservationSummaryUrl,
      status_id: raw.StatusId,
      status_type_id: raw.StatusTypeId,
      web_user_is_owner: raw.WebUserIsOwner
    };
  }

  // Insert new event
  async insertEvent(rawEvent: RawEventData): Promise<void> {
    const event = this.transformRawEvent(rawEvent);
    
    const sql = `
      INSERT INTO raw_events (
        id, event_name, event_start, event_end, gmt_start, gmt_end,
        time_booking_start, time_booking_end, is_all_day_event, timezone_abbreviation,
        building, building_id, room, room_id, room_code, room_type, room_type_id,
        location, location_link, group_name, reservation_id, reservation_summary_url,
        status_id, status_type_id, web_user_is_owner
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      event.id, event.event_name, event.event_start, event.event_end,
      event.gmt_start, event.gmt_end, event.time_booking_start, event.time_booking_end,
      event.is_all_day_event, event.timezone_abbreviation, event.building, event.building_id,
      event.room, event.room_id, event.room_code, event.room_type, event.room_type_id,
      event.location, event.location_link, event.group_name, event.reservation_id,
      event.reservation_summary_url, event.status_id, event.status_type_id, event.web_user_is_owner
    ];

    await this.db.query(sql, values);
  }

  // Check if event exists and get current data
  async getEventById(id: number): Promise<Event | null> {
    const sql = 'SELECT * FROM raw_events WHERE id = ?';
    const results = await this.db.query<Event>(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  // Update existing event and detect changes
  async updateEvent(rawEvent: RawEventData): Promise<EventChanges | null> {
    const existingEvent = await this.getEventById(rawEvent.Id);
    if (!existingEvent) {
      throw new Error(`Event with ID ${rawEvent.Id} not found`);
    }

    const newEvent = this.transformRawEvent(rawEvent);
    const changes: EventChanges['changes'] = [];

    // Compare all fields except metadata
    const fieldsToCompare: (keyof Omit<Event, 'created_at' | 'updated_at'>)[] = [
      'id', 'event_name', 'event_start', 'event_end', 'gmt_start', 'gmt_end',
      'time_booking_start', 'time_booking_end', 'is_all_day_event', 'timezone_abbreviation',
      'building', 'building_id', 'room', 'room_id', 'room_code', 'room_type', 'room_type_id',
      'location', 'location_link', 'group_name', 'reservation_id', 'reservation_summary_url',
      'status_id', 'status_type_id', 'web_user_is_owner'
    ];

    for (const field of fieldsToCompare) {
      const oldValue = existingEvent[field];
      const newValue = newEvent[field];
      
      // Handle date comparison
      if (oldValue instanceof Date && newValue instanceof Date) {
        if (oldValue.getTime() !== newValue.getTime()) {
          changes.push({ field, oldValue, newValue });
        }
      } else if (oldValue !== newValue) {
        changes.push({ field, oldValue, newValue });
      }
    }

    // If no changes, return null
    if (changes.length === 0) {
      return null;
    }

    // Update the event
    const sql = `
      UPDATE raw_events SET
        event_name = ?, event_start = ?, event_end = ?, gmt_start = ?, gmt_end = ?,
        time_booking_start = ?, time_booking_end = ?, is_all_day_event = ?, timezone_abbreviation = ?,
        building = ?, building_id = ?, room = ?, room_id = ?, room_code = ?, room_type = ?, room_type_id = ?,
        location = ?, location_link = ?, group_name = ?, reservation_id = ?, reservation_summary_url = ?,
        status_id = ?, status_type_id = ?, web_user_is_owner = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      newEvent.event_name, newEvent.event_start, newEvent.event_end,
      newEvent.gmt_start, newEvent.gmt_end, newEvent.time_booking_start, newEvent.time_booking_end,
      newEvent.is_all_day_event, newEvent.timezone_abbreviation, newEvent.building, newEvent.building_id,
      newEvent.room, newEvent.room_id, newEvent.room_code, newEvent.room_type, newEvent.room_type_id,
      newEvent.location, newEvent.location_link, newEvent.group_name, newEvent.reservation_id,
      newEvent.reservation_summary_url, newEvent.status_id, newEvent.status_type_id, 
      newEvent.web_user_is_owner, newEvent.id
    ];

    await this.db.query(sql, values);

    return {
      eventId: rawEvent.Id,
      changes,
      changeCount: changes.length
    };
  }

  // Upsert event (insert or update)
  async upsertEvent(rawEvent: RawEventData): Promise<{ action: 'inserted' | 'updated'; changes?: EventChanges }> {
    const existingEvent = await this.getEventById(rawEvent.Id);
    
    if (!existingEvent) {
      await this.insertEvent(rawEvent);
      return { action: 'inserted' };
    } else {
      const changes = await this.updateEvent(rawEvent);
      return { action: 'updated', changes: changes || undefined };
    }
  }

  // Bulk upsert for performance
  async bulkUpsertEvents(rawEvents: RawEventData[]): Promise<{
    inserted: number;
    updated: number;
    totalChanges: number;
  }> {
    let inserted = 0;
    let updated = 0;
    let totalChanges = 0;

    for (const rawEvent of rawEvents) {
      const result = await this.upsertEvent(rawEvent);
      if (result.action === 'inserted') {
        inserted++;
      } else {
        updated++;
        if (result.changes) {
          totalChanges += result.changes.changeCount;
        }
      }
    }

    return { inserted, updated, totalChanges };
  }

  // Monitor constant fields for violations and log them
  async checkConstantFields(rawEvent: RawEventData): Promise<string[]> {
    const violations: string[] = [];
    
    // Fetch expected constant values from database
    const constantFields = await this.db.query<{ field_name: string; expected_value: string }>(
      'SELECT field_name, expected_value FROM raw_constant_fields'
    );

    for (const constantField of constantFields) {
      const fieldName = constantField.field_name;
      
      // Safely parse expected value - handle both JSON strings and primitive values
      let expectedValue: any;
      try {
        expectedValue = JSON.parse(constantField.expected_value);
      } catch (error) {
        // If JSON.parse fails, treat as primitive value
        expectedValue = constantField.expected_value;
      }
      
      const actualValue = (rawEvent as any)[fieldName];

      if (actualValue !== expectedValue) {
        const violationMsg = `${fieldName}: expected ${expectedValue}, got ${actualValue}`;
        violations.push(violationMsg);
        
        // Log the violation to raw_constant_violations table
        await this.db.query(
          `INSERT INTO raw_constant_violations (event_id, field_name, expected_value, actual_value) 
           VALUES (?, ?, ?, ?)`,
          [rawEvent.Id, fieldName, JSON.stringify(expectedValue), JSON.stringify(actualValue)]
        );
      }
    }

    return violations;
  }

  // Get events by date range
  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const sql = `
      SELECT * FROM raw_events 
      WHERE event_start >= ? AND event_start <= ?
      ORDER BY event_start ASC
    `;
    return await this.db.query<Event>(sql, [startDate, endDate]);
  }

  // Get events by building
  async getEventsByBuilding(buildingId: number): Promise<Event[]> {
    const sql = 'SELECT * FROM raw_events WHERE building_id = ? ORDER BY event_start ASC';
    return await this.db.query<Event>(sql, [buildingId]);
  }


  // Initialize database schema
  async initializeSchema(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaPath = path.join(__dirname, 'events-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    for (const statement of statements) {
      await this.db.query(statement);
    }
  }
}