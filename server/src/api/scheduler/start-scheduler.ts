import { ApiEndpoint, AuthType } from '@/types/api-types';
import { getSchedulerInstance } from './scheduler-status';

interface StartSchedulerResponse {
  message: string;
  status: 'started' | 'already_running';
}

export const startSchedulerEndpoint: ApiEndpoint<{}, StartSchedulerResponse> = {
  method: 'post',
  path: '/api/scheduler/start',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const scheduler = getSchedulerInstance();
      const currentStatus = scheduler.getStatus();

      if (currentStatus.isRunning) {
        res.json({
          success: true,
          data: {
            message: 'Scheduler is already running',
            status: 'already_running'
          }
        });
        return;
      }

      await scheduler.startRoutineSchedule();

      res.json({
        success: true,
        data: {
          message: 'Scheduler started successfully - will scrape twice daily',
          status: 'started'
        }
      });

    } catch (error) {
      console.error('Start scheduler failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to start scheduler',
          code: 'SCHEDULER_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },
};