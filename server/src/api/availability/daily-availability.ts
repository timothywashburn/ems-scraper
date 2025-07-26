import { ApiEndpoint, AuthType, ApiRequest, ApiResponse } from '@/types/api-types';
import { GetDailyAvailabilityResponse } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';

export const getDailyAvailabilityEndpoint: ApiEndpoint<undefined, GetDailyAvailabilityResponse> = {
  method: 'get',
  path: '/api/availability/daily',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          error: {
            message: 'date parameter is required (format: YYYY-MM-DD)',
            code: 'MISSING_DATE'
          }
        });
        return;
      }

      // Parse the date and create date range for the day
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid date format. Use YYYY-MM-DD',
            code: 'INVALID_DATE'
          }
        });
        return;
      }

      const dateStr = targetDate.toISOString().split('T')[0];
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      // Get all events for the day
      const events = await prisma.raw_events.findMany({
        where: {
          event_start: {
            gte: dateStr,
            lt: nextDayStr
          }
        },
        orderBy: [
          { room_id: 'asc' },
          { time_booking_start: 'asc' }
        ]
      });

      // Get all unique rooms that have events on this day
      const roomsWithEvents = await prisma.raw_events.findMany({
        where: {
          event_start: {
            gte: dateStr,
            lt: nextDayStr
          }
        },
        select: {
          room_id: true,
          room: true,
          room_code: true,
          building_id: true,
          building: true,
          room_type_id: true,
          room_type: true
        },
        distinct: ['room_id']
      });

      // Also get rooms that might be available but don't have events today
      // (This would require a rooms table, but for now we'll just show rooms with events)
      
      const roomAvailability = roomsWithEvents.map(room => {
        // Get all bookings for this room on this day
        const roomBookings = events.filter(event => event.room_id === room.room_id);
        
        // Sort bookings by time_booking_start
        const sortedBookings = roomBookings.sort((a, b) => 
          a.time_booking_start.localeCompare(b.time_booking_start)
        );

        // Calculate availability windows
        const availabilityWindows: Array<{ start_time: string; end_time: string }> = [];
        
        // Define operating hours (6 AM to 11 PM PST)
        const dayStart = `${dateStr}T06:00:00`;
        const dayEnd = `${dateStr}T23:00:00`;
        
        if (sortedBookings.length === 0) {
          // Room is completely available
          availabilityWindows.push({
            start_time: dayStart,
            end_time: dayEnd
          });
        } else {
          // Check for availability before first booking
          if (sortedBookings[0].time_booking_start > dayStart) {
            availabilityWindows.push({
              start_time: dayStart,
              end_time: sortedBookings[0].time_booking_start
            });
          }

          // Check for gaps between bookings
          for (let i = 0; i < sortedBookings.length - 1; i++) {
            const currentEnd = sortedBookings[i].time_booking_end;
            const nextStart = sortedBookings[i + 1].time_booking_start;
            
            if (currentEnd < nextStart) {
              availabilityWindows.push({
                start_time: currentEnd,
                end_time: nextStart
              });
            }
          }

          // Check for availability after last booking
          const lastBookingEnd = sortedBookings[sortedBookings.length - 1].time_booking_end;
          if (lastBookingEnd < dayEnd) {
            availabilityWindows.push({
              start_time: lastBookingEnd,
              end_time: dayEnd
            });
          }
        }

        // Format bookings for response
        const formattedBookings = sortedBookings.map(booking => ({
          event_id: booking.id,
          event_name: booking.event_name,
          start_time: booking.time_booking_start,
          end_time: booking.time_booking_end,
          group_name: booking.group_name
        }));

        return {
          room_id: room.room_id,
          room_name: room.room,
          room_code: room.room_code,
          building_id: room.building_id,
          building_name: room.building,
          room_type_id: room.room_type_id,
          room_type: room.room_type,
          availability_windows: availabilityWindows,
          bookings: []
          // bookings: formattedBookings
        };
      });

      res.json({
        success: true,
        data: {
          date: dateStr,
          rooms: roomAvailability
        }
      });
    } catch (error) {
      console.error('Error fetching daily availability:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch daily availability',
          code: 'FETCH_AVAILABILITY_ERROR'
        }
      });
    }
  }
};