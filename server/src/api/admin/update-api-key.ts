import { ApiEndpoint, AuthType, ErrorCode } from '@/types/api-types';
import { TokenService } from '@/services/token-service';

interface UpdateApiKeyRequest {
    token: string;
    is_admin?: boolean;
    comment?: string;
}

interface UpdateApiKeyResponse {
    token: string;
    is_admin: boolean;
    comment: string;
    created_at: string;
    last_used: string | null;
}

export const updateApiKeyEndpoint: ApiEndpoint<UpdateApiKeyRequest, UpdateApiKeyResponse> = {
    method: 'put',
    path: '/api/admin/api-keys/:token',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const { token } = req.params;
            const { is_admin, comment } = req.body;

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

            if (is_admin !== undefined && typeof is_admin !== 'boolean') {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'is_admin must be a boolean',
                        code: ErrorCode.BAD_REQUEST,
                    },
                });
                return;
            }

            if (comment !== undefined && (typeof comment !== 'string' || comment.trim() === '')) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Comment must be a non-empty string',
                        code: ErrorCode.BAD_REQUEST,
                    },
                });
                return;
            }

            const tokenService = TokenService.getInstance();
            const updatedToken = await tokenService.updateToken(token, {
                is_admin,
                comment: comment?.trim(),
            });

            if (!updatedToken) {
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
                    token: updatedToken.token,
                    is_admin: updatedToken.is_admin,
                    comment: updatedToken.comment,
                    created_at: updatedToken.created_at.toISOString(),
                    last_used: updatedToken.last_used?.toISOString() || null,
                }
            });
        } catch (error) {
            console.error('Error updating API key:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to update API key',
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                },
            });
        }
    },
};