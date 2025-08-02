import { ApiEndpoint, AuthType, ErrorCode } from '@/types/api-types';
import { TokenService } from '@/services/token-service';

interface DeleteApiKeyRequest {
}

interface DeleteApiKeyResponse {
    message: string;
}

export const deleteApiKeyEndpoint: ApiEndpoint<DeleteApiKeyRequest, DeleteApiKeyResponse> = {
    method: 'delete',
    path: '/api/admin/api-keys/:token',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const { token } = req.params;

            if (!token) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Token is required',
                        code: ErrorCode.BAD_REQUEST,
                    },
                });
                return;
            }

            const tokenService = TokenService.getInstance();
            const deleted = await tokenService.deleteToken(token);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: 'Token not found',
                        code: ErrorCode.NOT_FOUND,
                    },
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    message: 'API key deleted successfully',
                }
            });
        } catch (error) {
            console.error('Error deleting API key:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to delete API key',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                },
            });
        }
    },
};