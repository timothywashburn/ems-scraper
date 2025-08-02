import { ApiEndpoint, AuthType } from '@/types/api-types';

interface StatusResponse {
    status: string;
    timestamp: string;
    service: string;
}

export const statusEndpoint: ApiEndpoint<undefined, StatusResponse> = {
    method: 'get',
    path: '/api/status',
    auth: AuthType.NONE,
    handler: async (req, res) => {
        res.json({
            success: true,
            data: {
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'ems-scraper',
            },
        });
    },
};