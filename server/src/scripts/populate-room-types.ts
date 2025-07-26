import { prisma } from '@/lib/prisma';
import { ScriptConfig } from '@/controllers/script-manager';

export const populateRoomTypesScript: ScriptConfig = {
  name: 'populate-room-types',
  tableName: 'rel_room_types',
  handler: async () => {
    console.log('Starting room type population...');
    
    const distinctRoomTypes = await prisma.raw_events.findMany({
      select: {
        room_type_id: true,
        room_type: true
      },
      distinct: ['room_type_id']
    });

    console.log(`Found ${distinctRoomTypes.length} unique room types`);

    for (const roomType of distinctRoomTypes) {
      const trimmedRoomTypeName = roomType.room_type.trim();
      
      await prisma.rel_room_types.upsert({
        where: { room_type_id: roomType.room_type_id },
        update: {
          room_type_name: trimmedRoomTypeName
        },
        create: {
          room_type_id: roomType.room_type_id,
          room_type_name: trimmedRoomTypeName
        }
      });
    }

    console.log('Room type population completed successfully');
  }
};