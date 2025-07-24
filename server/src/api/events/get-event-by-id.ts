import { ApiEndpoint, AuthType } from '@/types/api-types';
import { EventModel } from '@/models/event-model';
import { Event } from '@/types/event-types';

interface GetEventByIdResponse {
  event: Event | null;
}

export const getEventByIdEndpoint: ApiEndpoint<{}, GetEventByIdResponse> = {
  method: 'get',
  path: '/api/events/:id',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid event ID. Must be a number',
            code: 'INVALID_EVENT_ID'
          }
        });
        return;
      }

      const eventModel = new EventModel();
      const event = await eventModel.getEventById(eventId);

      if (!event) {
        res.status(404).json({
          success: false,
          error: {
            message: `Event with ID ${eventId} not found`,
            code: 'EVENT_NOT_FOUND'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          event
        }
      });

    } catch (error) {
      console.error('Get event by ID failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve event',
          code: 'DATABASE_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },
};