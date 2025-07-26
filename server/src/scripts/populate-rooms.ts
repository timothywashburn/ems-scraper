import { prisma } from '@/lib/prisma';
import { ScriptConfig } from '@/controllers/script-manager';

export const populateRoomsScript: ScriptConfig = {
  name: 'populate-rooms',
  tableName: 'rel_rooms',
  handler: async () => {
    console.log('Starting room population...');
    
    const distinctRooms = await prisma.raw_events.findMany({
      select: {
        room_id: true,
        room: true,
        building_id: true,
        room_type_id: true
      },
      distinct: ['room_id']
    });

    console.log(`Found ${distinctRooms.length} unique rooms`);

    for (const room of distinctRooms) {
      const trimmedRoomName = room.room.trim();
      
      await prisma.rel_rooms.upsert({
        where: { room_id: room.room_id },
        update: {
          room_name: trimmedRoomName,
          building_id: room.building_id,
          room_type_id: room.room_type_id
        },
        create: {
          room_id: room.room_id,
          room_name: trimmedRoomName,
          building_id: room.building_id,
          room_type_id: room.room_type_id
        }
      });
    }

    console.log('Room population completed successfully');
  }
};