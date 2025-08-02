import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export interface ApiToken {
    id: number;
    token: string;
    is_admin: boolean;
    comment: string;
    created_at: Date;
    last_used: Date | null;
}

export class TokenService {
    private static instance: TokenService;

    private constructor() {
    }

    static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    generateToken(): string {
        return randomBytes(32).toString('hex');
    }

    async createToken(comment: string, isAdmin: boolean): Promise<ApiToken> {
        const token = this.generateToken();

        return prisma.api_tokens.create({
            data: {
                token,
                is_admin: isAdmin,
                comment,
            },
        });
    }

    async validateToken(token: string): Promise<ApiToken | null> {
        const apiToken = await prisma.api_tokens.findFirst({
            where: {
                token,
            },
        });

        if (apiToken) {
            // Update last_used timestamp
            await prisma.api_tokens.update({
                where: { id: apiToken.id },
                data: { last_used: new Date() },
            });
        }

        return apiToken;
    }

    async getAllTokens(): Promise<ApiToken[]> {
        return prisma.api_tokens.findMany({
            orderBy: {
                id: 'asc',
            },
        });
    }

    async updateToken(token: string, updates: { is_admin?: boolean; comment?: string }): Promise<ApiToken | null> {
        try {
            const existingToken = await prisma.api_tokens.findFirst({
                where: { token },
            });

            if (!existingToken) {
                return null;
            }

            const updateData: any = {};
            if (updates.is_admin !== undefined) {
                updateData.is_admin = updates.is_admin;
            }
            if (updates.comment !== undefined) {
                updateData.comment = updates.comment;
            }

            return prisma.api_tokens.update({
                where: { id: existingToken.id },
                data: updateData,
            });
        } catch (error) {
            console.error('Error updating token:', error);
            return null;
        }
    }

    async deleteToken(token: string): Promise<boolean> {
        try {
            const existingToken = await prisma.api_tokens.findFirst({
                where: { token },
            });

            if (!existingToken) {
                return false;
            }

            await prisma.api_tokens.delete({
                where: { id: existingToken.id },
            });

            return true;
        } catch (error) {
            console.error('Error deleting token:', error);
            return false;
        }
    }

    async ensureInitialTokenExists(): Promise<void> {
        const tokenCount = await prisma.api_tokens.count();

        if (tokenCount === 0) {
            const token = await this.createToken('admin', true);
            console.log('🔑 Created initial admin token:', token.token);
            console.log('⚠️  Save this token securely - it will not be shown again!');
        }
    }
}