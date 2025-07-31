import { ApiEndpoint, AuthType, ApiRequest, ApiResponse } from '@/types/api-types';
import { GetMonthlyAvailabilityResponse, GetDailyAvailabilityResponse } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';

export const getMonthlyAvailabilityEndpoint: ApiEndpoint<undefined, GetMonthlyAvailabilityResponse> = {
  method: 'get',
  path: '/api/availability/monthly',
  auth: AuthType.AUTHENTICATED,
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

      // Calculate month boundaries
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Generate month dates
      const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
        return new Date(year, month, i + 1);
      });

      const monthlyData: GetDailyAvailabilityResponse[] = [];

      // Process each day
      for (const currentDate of monthDates) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];

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

        const allRooms = await prisma.rel_rooms.findMany({
          orderBy: { room_id: 'asc' },
          include: {
            buildingRel: true,
            roomTypeRel: true
          }
        });
        
        const roomAvailability = allRooms.map(room => {
          const roomBookings = events.filter(event => event.room_id === room.room_id);
          const sortedBookings = roomBookings.sort((a, b) => 
            a.time_booking_start.localeCompare(b.time_booking_start)
          );

          const availability: Array<{ start_time: string; end_time: string }> = [];
          const dayStart = `${dateStr}T08:00:00`;
          const dayEnd = `${dateStr}T23:00:00`;
          
          if (sortedBookings.length === 0) {
            availability.push({
              start_time: dayStart,
              end_time: dayEnd
            });
          } else {
            // Check for availability before first booking
            if (sortedBookings[0].time_booking_start > dayStart) {
              availability.push({
                start_time: dayStart,
                end_time: sortedBookings[0].time_booking_start
              });
            }

            // Check for gaps between bookings
            for (let i = 0; i < sortedBookings.length - 1; i++) {
              const currentEnd = sortedBookings[i].time_booking_end;
              const nextStart = sortedBookings[i + 1].time_booking_start;
              
              if (currentEnd < nextStart) {
                availability.push({
                  start_time: currentEnd,
                  end_time: nextStart
                });
              }
            }

            // Check for availability after last booking
            const lastBookingEnd = sortedBookings[sortedBookings.length - 1].time_booking_end;
            if (lastBookingEnd < dayEnd) {
              availability.push({
                start_time: lastBookingEnd,
                end_time: dayEnd
              });
            }
          }

          return {
            room_name: room.room_name,
            room_type: room.roomTypeRel.room_type_name,
            building_name: room.buildingRel.building_name,
            availability
          };
        });

        monthlyData.push({
          date: dateStr,
          rooms: roomAvailability
        });
      }

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      res.json({
        success: true,
        data: {
          month: monthNames[month],
          year: year,
          days: monthlyData
        }
      });
    } catch (error) {
      console.error('Error fetching monthly availability:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch monthly availability',
          code: 'FETCH_MONTHLY_AVAILABILITY_ERROR'
        }
      });
    }
  }
};