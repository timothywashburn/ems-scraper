import { z } from "zod";

// Event-related IDs
export const eventIdSchema = z.number().transform((val): EventId => val as EventId);
export type EventId = number & { readonly __brand: "EventId" };

export const reservationIdSchema = z.number().transform((val): ReservationId => val as ReservationId);
export type ReservationId = number & { readonly __brand: "ReservationId" };

// Location-related IDs
export const buildingIdSchema = z.number().transform((val): BuildingId => val as BuildingId);
export type BuildingId = number & { readonly __brand: "BuildingId" };

export const roomIdSchema = z.number().transform((val): RoomId => val as RoomId);
export type RoomId = number & { readonly __brand: "RoomId" };

export const roomTypeIdSchema = z.number().transform((val): RoomTypeId => val as RoomTypeId);
export type RoomTypeId = number & { readonly __brand: "RoomTypeId" };

// Status-related IDs
export const statusIdSchema = z.number().transform((val): StatusId => val as StatusId);
export type StatusId = number & { readonly __brand: "StatusId" };

export const statusTypeIdSchema = z.number().transform((val): StatusTypeId => val as StatusTypeId);
export type StatusTypeId = number & { readonly __brand: "StatusTypeId" };

// Group-related IDs
export const groupIdSchema = z.number().transform((val): GroupId => val as GroupId);
export type GroupId = number & { readonly __brand: "GroupId" };

// API Token IDs
export const tokenIdSchema = z.number().transform((val): TokenId => val as TokenId);
export type TokenId = number & { readonly __brand: "TokenId" };