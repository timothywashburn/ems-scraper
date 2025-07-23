import { ApiEndpoint, AuthType } from '@/types/api-types';
import DatabaseManager from '@/controllers/database-manager';

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
    const dbManager = DatabaseManager.getInstance();
    let databaseConnected = false;
    let testQuerySuccess = false;

    try {
      await dbManager.query('SELECT 1 as test');
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