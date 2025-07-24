import { ApiEndpoint, AuthType } from '@/types/api-types';
import DatabaseManager from '@/controllers/database-manager';
import { RawConstantViolation } from '@/types/event-types';

interface GetViolationsQuery {
  eventId?: string;
  fieldName?: string;
  limit?: string;
  offset?: string;
}

interface GetViolationsResponse {
  violations: RawConstantViolation[];
  total: number;
  hasMore: boolean;
  filters: {
    eventId?: number;
    fieldName?: string;
  };
}

export const getViolationsEndpoint: ApiEndpoint<GetViolationsQuery, GetViolationsResponse> = {
  method: 'get',
  path: '/api/monitor/violations',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const { eventId, fieldName, limit = '100', offset = '0' } = req.query as GetViolationsQuery;
      
      const db = DatabaseManager.getInstance();
      const limitNum = Math.min(parseInt(limit) || 100, 1000);
      const offsetNum = parseInt(offset) || 0;

      let sql = 'SELECT * FROM raw_constant_violations WHERE 1=1';
      const params: any[] = [];

      if (eventId) {
        const eventIdNum = parseInt(eventId);
        if (isNaN(eventIdNum)) {
          res.status(400).json({
            success: false,
            error: {
              message: 'Invalid eventId. Must be a number',
              code: 'INVALID_EVENT_ID'
            }
          });
          return;
        }
        sql += ' AND event_id = ?';
        params.push(eventIdNum);
      }

      if (fieldName) {
        sql += ' AND field_name = ?';
        params.push(fieldName);
      }

      sql += ' ORDER BY violation_time DESC';
      
      const violations = await db.query<RawConstantViolation>(sql, params);
      
      // Apply pagination
      const total = violations.length;
      const paginatedViolations = violations.slice(offsetNum, offsetNum + limitNum);
      const hasMore = offsetNum + limitNum < total;

      res.json({
        success: true,
        data: {
          violations: paginatedViolations,
          total,
          hasMore,
          filters: {
            eventId: eventId ? parseInt(eventId) : undefined,
            fieldName
          }
        }
      });

    } catch (error) {
      console.error('Get violations failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve violations',
          code: 'DATABASE_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },
};