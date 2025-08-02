import { prisma } from '@/lib/prisma';
import { ScriptConfig } from '@/controllers/script-manager';

export const populateBuildingsScript: ScriptConfig = {
    name: 'populate-buildings',
    tableName: 'rel_buildings',
    handler: async () => {
        console.log('Starting building population...');

        const distinctBuildings = await prisma.raw_events.findMany({
            select: {
                building_id: true,
                building: true
            },
            distinct: ['building_id']
        });

        console.log(`Found ${distinctBuildings.length} unique buildings`);

        for (const building of distinctBuildings) {
            const trimmedBuildingName = building.building.trim();

            await prisma.rel_buildings.upsert({
                where: { building_id: building.building_id },
                update: {
                    building_name: trimmedBuildingName
                },
                create: {
                    building_id: building.building_id,
                    building_name: trimmedBuildingName
                }
            });
        }

        console.log('Building population completed successfully');
    }
};