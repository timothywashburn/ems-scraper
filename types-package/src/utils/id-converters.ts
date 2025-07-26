import {
  EventId,
  ReservationId,
  BuildingId,
  RoomId,
  RoomTypeId,
  StatusId,
  StatusTypeId,
  GroupId,
  TokenId
} from '../types/id-types';

// Type-safe ID conversion utilities
export class IdConverters {
  
  // Event IDs
  static toEventId(id: number): EventId {
    return id as EventId;
  }
  
  static fromEventId(id: EventId): number {
    return id as number;
  }
  
  // Reservation IDs
  static toReservationId(id: number): ReservationId {
    return id as ReservationId;
  }
  
  static fromReservationId(id: ReservationId): number {
    return id as number;
  }
  
  // Building IDs
  static toBuildingId(id: number): BuildingId {
    return id as BuildingId;
  }
  
  static fromBuildingId(id: BuildingId): number {
    return id as number;
  }
  
  // Room IDs
  static toRoomId(id: number): RoomId {
    return id as RoomId;
  }
  
  static fromRoomId(id: RoomId): number {
    return id as number;
  }
  
  // Room Type IDs
  static toRoomTypeId(id: number): RoomTypeId {
    return id as RoomTypeId;
  }
  
  static fromRoomTypeId(id: RoomTypeId): number {
    return id as number;
  }
  
  // Status IDs
  static toStatusId(id: number): StatusId {
    return id as StatusId;
  }
  
  static fromStatusId(id: StatusId): number {
    return id as number;
  }
  
  // Status Type IDs
  static toStatusTypeId(id: number): StatusTypeId {
    return id as StatusTypeId;
  }
  
  static fromStatusTypeId(id: StatusTypeId): number {
    return id as number;
  }
  
  // Group IDs
  static toGroupId(id: number): GroupId {
    return id as GroupId;
  }
  
  static fromGroupId(id: GroupId): number {
    return id as number;
  }
  
  // Token IDs
  static toTokenId(id: number): TokenId {
    return id as TokenId;
  }
  
  static fromTokenId(id: TokenId): number {
    return id as number;
  }
}