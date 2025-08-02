import { ApiEndpoint, AuthType } from '@/types/api-types';
import { RawConstantViolation } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';

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
    auth: AuthType.AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const { eventId, fieldName, limit = '100', offset = '0' } = req.query as GetViolationsQuery;

            const limitNum = Math.min(parseInt(limit) || 100, 1000);
            const offsetNum = parseInt(offset) || 0;

            const whereClause: any = {};

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
                whereClause.event_id = eventIdNum;
            }

            if (fieldName) {
                whereClause.field_name = fieldName;
            }

            const [violations, total] = await Promise.all([
                prisma.raw_constant_violations.findMany({
                    where: whereClause,
                    orderBy: {
                        violation_time: 'desc'
                    },
                    skip: offsetNum,
                    take: limitNum
                }),
                prisma.raw_constant_violations.count({
                    where: whereClause
                })
            ]);

            const hasMore = offsetNum + limitNum < total;

            res.json({
                success: true,
                data: {
                    violations: violations as RawConstantViolation[],
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