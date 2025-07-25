import { ApiEndpoint, AuthType } from '@/types/api-types';
import { prisma } from '@/lib/prisma';

interface ScraperTestResponse {
  message: string;
  database_connected: boolean;
  test_query_success: boolean;
}

export const scraperTestEndpoint: ApiEndpoint<{}, ScraperTestResponse> = {
  method: 'get',
  path: '/api/test/scraper',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    let databaseConnected = false;
    let testQuerySuccess = false;

    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      databaseConnected = true;
      testQuerySuccess = true;
    } catch (error) {
      console.error('Database test failed:', error);
    }

    res.json({
      success: true,
      data: {
        message: 'EMS Scraper test endpoint',
        database_connected: databaseConnected,
        test_query_success: testQuerySuccess,
      },
    });
  },
};