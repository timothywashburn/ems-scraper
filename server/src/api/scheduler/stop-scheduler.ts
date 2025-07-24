import { ApiEndpoint, AuthType } from '@/types/api-types';
import { getSchedulerInstance } from './scheduler-status';

interface StopSchedulerResponse {
  message: string;
  status: 'stopped' | 'already_stopped';
}

export const stopSchedulerEndpoint: ApiEndpoint<{}, StopSchedulerResponse> = {
  method: 'post',
  path: '/api/scheduler/stop',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const scheduler = getSchedulerInstance();
      const currentStatus = scheduler.getStatus();

      if (!currentStatus.isRunning) {
        res.json({
          success: true,
          data: {
            message: 'Scheduler is already stopped',
            status: 'already_stopped'
          }
        });
        return;
      }

      scheduler.stopRoutineSchedule();

      res.json({
        success: true,
        data: {
          message: 'Scheduler stopped successfully',
          status: 'stopped'
        }
      });

    } catch (error) {
      console.error('Stop scheduler failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to stop scheduler',
          code: 'SCHEDULER_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },
};