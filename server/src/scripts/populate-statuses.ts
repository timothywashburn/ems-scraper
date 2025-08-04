import { prisma } from '@/lib/prisma';
import { ScriptConfig } from '@/controllers/script-manager';

export const populateStatusesScript: ScriptConfig = {
    name: 'populate-statuses',
    tableName: 'rel_statuses',
    handler: async () => {
        console.log('Starting status population...');

        const statusMappings = [
            { status_id: 1, status_name: 'confirmed (info session)' },
            { status_id: 106, status_name: 'tentative' },
            { status_id: 367, status_name: 'info only' },
            { status_id: 778, status_name: 'confirmed (conference)' },
            { status_id: 781, status_name: 'WEB CONFIRMED' },
            { status_id: 791, status_name: 'venue setup/teardown' }
        ];

        console.log(`Creating ${statusMappings.length} status records`);

        for (const status of statusMappings) {
            await prisma.rel_statuses.upsert({
                where: { status_id: status.status_id },
                update: {
                    status_name: status.status_name
                },
                create: {
                    status_id: status.status_id,
                    status_name: status.status_name
                }
            });
        }

        console.log('Status population completed successfully');
    }
};