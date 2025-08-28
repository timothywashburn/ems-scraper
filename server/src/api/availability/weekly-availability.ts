import { ApiEndpoint, AuthType } from '@/types/api-types';
import { GetDailyAvailabilityResponse, GetWeeklyAvailabilityResponse } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';
import { decodeText } from '@/utils/decoding-utils';

export const getWeeklyAvailabilityEndpoint: ApiEndpoint<undefined, GetWeeklyAvailabilityResponse> = {
    method: 'get',
    path: '/api/availability/weekly',
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

            const startDate = new Date(date as string);
            if (isNaN(startDate.getTime())) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid date format. Use YYYY-MM-DD',
                        code: 'INVALID_DATE'
                    }
                });
                return;
            }

            // Calculate week start (Monday)
            const dayOfWeek = startDate.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + mondayOffset);

            // Generate week dates (7 days starting from Monday)
            const weekDates = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                return date;
            });

            const weeklyData: GetDailyAvailabilityResponse[] = [];

            // Process each day
            for (const targetDate of weekDates) {
                const dateStr = targetDate.toISOString().split('T')[0];
                const nextDay = new Date(targetDate);
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
                        room_name: decodeText(room.room_name),
                        room_type: decodeText(room.roomTypeRel.room_type_name),
                        custom_room_type: room.custom_room_type,
                        building_name: decodeText(room.buildingRel.building_name),
                        availability
                    };
                });

                weeklyData.push({
                    date: dateStr,
                    rooms: roomAvailability
                });
            }

            res.json({
                success: true,
                data: {
                    week_start: weekStart.toISOString().split('T')[0],
                    days: weeklyData
                }
            });
        } catch (error) {
            console.error('Error fetching weekly availability:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch weekly availability',
                    code: 'FETCH_WEEKLY_AVAILABILITY_ERROR'
                }
            });
        }
    }
};