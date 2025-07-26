import { ApiEndpoint, AuthType, ApiRequest, ApiResponse } from '@/types/api-types';
import { GetGroupsResponse } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';

export const getGroupsEndpoint: ApiEndpoint<undefined, GetGroupsResponse> = {
  method: 'get',
  path: '/api/groups',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      // Get unique group names with event counts
      const groups = await prisma.raw_events.groupBy({
        by: ['group_name'],
        _count: {
          group_name: true
        },
        orderBy: {
          group_name: 'asc'
        }
      });

      const formattedGroups = groups.map(group => ({
        name: group.group_name,
        event_count: group._count.group_name
      }));

      // TODO: remove later
      formattedGroups.sort((a, b) => b.event_count - a.event_count);

      res.json({
        success: true,
        data: {
          groups: formattedGroups
        }
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch groups',
          code: 'FETCH_GROUPS_ERROR'
        }
      });
    }
  }
};