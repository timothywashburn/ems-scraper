import { ApiEndpoint, AuthType } from '@/types/api-types';
import { EventModel } from '@/models/event-model';
import { Event } from '@/types/event-types';

interface GetEventsQuery {
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  buildingId?: string;
  limit?: string;
  offset?: string;
}

interface GetEventsResponse {
  events: Event[];
  total: number;
  hasMore: boolean;
  filters: {
    startDate?: string;
    endDate?: string;
    buildingId?: number;
  };
}

export const getEventsEndpoint: ApiEndpoint<GetEventsQuery, GetEventsResponse> = {
  method: 'get',
  path: '/api/events',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const { startDate, endDate, buildingId, limit = '100', offset = '0' } = req.query as GetEventsQuery;
      
      const eventModel = new EventModel();
      const limitNum = Math.min(parseInt(limit) || 100, 1000); // Max 1000 events per request
      const offsetNum = parseInt(offset) || 0;

      let events: Event[] = [];

      if (startDate && endDate) {
        // Date range query
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              message: 'Invalid date format. Use ISO date strings (YYYY-MM-DD)',
              code: 'INVALID_DATE_FORMAT'
            }
          });
          return;
        }

        events = await eventModel.getEventsByDateRange(start, end);
        
      } else if (buildingId) {
        // Building filter
        const buildingIdNum = parseInt(buildingId);
        if (isNaN(buildingIdNum)) {
          res.status(400).json({
            success: false,
            error: {
              message: 'Invalid buildingId. Must be a number',
              code: 'INVALID_BUILDING_ID'
            }
          });
          return;
        }

        events = await eventModel.getEventsByBuilding(buildingIdNum);
        
      } else {
        // Get recent events if no filters specified
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        events = await eventModel.getEventsByDateRange(thirtyDaysAgo, today);
      }

      // Apply pagination
      const total = events.length;
      const paginatedEvents = events.slice(offsetNum, offsetNum + limitNum);
      const hasMore = offsetNum + limitNum < total;

      res.json({
        success: true,
        data: {
          events: paginatedEvents,
          total,
          hasMore,
          filters: {
            startDate,
            endDate,
            buildingId: buildingId ? parseInt(buildingId) : undefined
          }
        }
      });

    } catch (error) {
      console.error('Get events failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve events',
          code: 'DATABASE_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },
};