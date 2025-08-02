import { ApiEndpoint, AuthType, ErrorCode } from '@/types/api-types';
import { TokenService } from '@/services/token-service';

interface GetApiKeysRequest {
}

interface GetApiKeysResponse {
    tokens: Array<{
        token: string;
        is_admin: boolean;
        comment: string;
        created_at: string;
        last_used: string | null;
    }>;
}

export const getApiKeysEndpoint: ApiEndpoint<GetApiKeysRequest, GetApiKeysResponse> = {
    method: 'get',
    path: '/api/admin/api-keys',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const tokenService = TokenService.getInstance();
            const tokens = await tokenService.getAllTokens();

            res.json({
                success: true,
                data: {
                    tokens: tokens.map(token => ({
                        token: token.token,
                        is_admin: token.is_admin,
                        comment: token.comment,
                        created_at: token.created_at.toISOString(),
                        last_used: token.last_used?.toISOString() || null,
                    }))
                }
            });
        } catch (error) {
            console.error('Error fetching API keys:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch API keys',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                },
            });
        }
    },
};