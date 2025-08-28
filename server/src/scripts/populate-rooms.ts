import { prisma } from '@/lib/prisma';
import { ScriptConfig } from '@/controllers/script-manager';

const customRoomTypeMap: Record<number, string> = {
    18: 'Large Space',
    19: 'Large Space',
    20: 'Large Space',
    79: 'Large Space',
    1112: 'Large Space',
    1141: 'Large Space',
    1142: 'Large Space',
    1114: 'Large Space',
    1091: 'Large Space',
    621: 'Large Space',
    622: 'Large Space',

    2: 'Medium Space',
    3: 'Medium Space',
    17: 'Medium Space',
    49: 'Medium Space',
    50: 'Medium Space',
    51: 'Medium Space',
    1246: 'Medium Space',
    1138: 'Medium Space',

    1084: 'Small Space/Meeting Room',
    1085: 'Small Space/Meeting Room',
    1086: 'Small Space/Meeting Room',
    1087: 'Small Space/Meeting Room',
    1088: 'Small Space/Meeting Room',
    1089: 'Small Space/Meeting Room',
    1090: 'Small Space/Meeting Room',
    16: 'Small Space/Meeting Room',
    1113: 'Small Space/Meeting Room',
    1069: 'Small Space/Meeting Room',
    1273: 'Small Space/Meeting Room',

    600: 'Tabling',
    601: 'Tabling',
    611: 'Tabling',
    612: 'Tabling',
    613: 'Tabling',
    614: 'Tabling',
    878: 'Tabling',
    879: 'Tabling',
    880: 'Tabling',
    881: 'Tabling',
    882: 'Tabling',
    884: 'Tabling',
    885: 'Tabling',
    886: 'Tabling',
    887: 'Tabling',
    888: 'Tabling',
    889: 'Tabling',
    890: 'Tabling',
    891: 'Tabling',
    892: 'Tabling',
    893: 'Tabling',
    894: 'Tabling',
    895: 'Tabling',
    896: 'Tabling',
    897: 'Tabling',
    898: 'Tabling',
    921: 'Tabling',
    922: 'Tabling',
    923: 'Tabling',
    924: 'Tabling',
    925: 'Tabling',
    926: 'Tabling',
    927: 'Tabling',
    928: 'Tabling',
    1294: 'Tabling',
    1295: 'Tabling',
    1296: 'Tabling',
    1297: 'Tabling',
    1298: 'Tabling',
    1299: 'Tabling',
    1300: 'Tabling',
    1301: 'Tabling',
    1302: 'Tabling',
    1303: 'Tabling',
    1304: 'Tabling',
    945: 'Tabling',
    946: 'Tabling',
    1062: 'Tabling',
    1359: 'Tabling',
    931: 'Tabling',
    932: 'Tabling',
    933: 'Tabling',
    934: 'Tabling',
    935: 'Tabling',
    1073: 'Tabling',
    1074: 'Tabling',
};

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
            const customRoomType = customRoomTypeMap[room.room_id] || null;

            await prisma.rel_rooms.upsert({
                where: { room_id: room.room_id },
                update: {
                    room_name: trimmedRoomName,
                    building_id: room.building_id,
                    room_type_id: room.room_type_id,
                    custom_room_type: customRoomType
                },
                create: {
                    room_id: room.room_id,
                    room_name: trimmedRoomName,
                    building_id: room.building_id,
                    room_type_id: room.room_type_id,
                    custom_room_type: customRoomType
                }
            });
        }

        console.log('Room population completed successfully');
    }
};