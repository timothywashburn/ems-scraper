import { ApiEndpoint, AuthType } from '@/types/api-types';
import { SchedulerService } from '@/services/scheduler-service';

interface SchedulerStatusResponse {
  isRunning: boolean;
  nextRun?: string; // ISO date string
  message: string;
}

// Global scheduler instance
let schedulerInstance: SchedulerService | null = null;

export const getSchedulerInstance = (): SchedulerService => {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
};

export const schedulerStatusEndpoint: ApiEndpoint<{}, SchedulerStatusResponse> = {
  method: 'get',
  path: '/api/scheduler/status',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const scheduler = getSchedulerInstance();
      const status = scheduler.getStatus();

      res.json({
        success: true,
        data: {
          isRunning: status.isRunning,
          nextRun: status.nextRun?.toISOString(),
          message: status.isRunning 
            ? 'Scheduler is running - scraping twice daily'
            : 'Scheduler is stopped'
        }
      });

    } catch (error) {
      console.error('Get scheduler status failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get scheduler status',
          code: 'SCHEDULER_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },
};