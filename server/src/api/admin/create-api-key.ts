import { ApiEndpoint, AuthType, ErrorCode } from '@/types/api-types';
import { TokenService } from '@/services/token-service';

interface CreateApiKeyRequest {
    comment: string;
    is_admin: boolean;
}

interface CreateApiKeyResponse {
    token: string;
    is_admin: boolean;
    comment: string;
    created_at: string;
}

export const createApiKeyEndpoint: ApiEndpoint<CreateApiKeyRequest, CreateApiKeyResponse> = {
    method: 'post',
    path: '/api/admin/api-keys',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const { comment, is_admin } = req.body;

            if (!comment || typeof comment !== 'string' || comment.trim() === '') {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Comment is required',
                        code: ErrorCode.BAD_REQUEST,
                    },
                });
                return;
            }

            if (typeof is_admin !== 'boolean') {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'is_admin must be a boolean',
                        code: ErrorCode.BAD_REQUEST,
                    },
                });
                return;
            }

            const tokenService = TokenService.getInstance();
            const newToken = await tokenService.createToken(comment.trim(), is_admin);

            res.json({
                success: true,
                data: {
                    token: newToken.token,
                    is_admin: newToken.is_admin,
                    comment: newToken.comment,
                    created_at: newToken.created_at.toISOString(),
                }
            });
        } catch (error) {
            console.error('Error creating API key:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to create API key',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                },
            });
        }
    },
};