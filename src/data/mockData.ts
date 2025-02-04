import { Room, User } from '../types';

export const mockUsers: User[] = [
  {
    username: 'jsmith',
    name: 'John Smith'
  },
  {
    username: 'mgarcia',
    name: 'María García'
  }
];

const buildings = ['edwards', 'holland', 'peterson', 'wade'];

const createMockRooms = (): Room[] => {
  const rooms: Room[] = [];
  const suites = ['101', '102', '103'];

  buildings.forEach((building) => {
    suites.forEach((suiteNumber) => {
      ['A', 'B', 'C', 'D'].forEach((letter) => {
        rooms.push({
          id: `${building}-${suiteNumber}${letter}`,
          number: `${suiteNumber}${letter}`,
          letter: letter as 'A' | 'B' | 'C' | 'D',
          suiteId: `${building}-${suiteNumber}`,
          building,
          students: [
            {
              id: `${building}-${suiteNumber}${letter}-1`,
              name: `Estudiante ${suiteNumber}${letter}-1`,
              isPresent: null,
              lastCheckedBy: undefined,
              lastCheckedAt: undefined
            },
            {
              id: `${building}-${suiteNumber}${letter}-2`,
              name: `Estudiante ${suiteNumber}${letter}-2`,
              isPresent: null,
              lastCheckedBy: undefined,
              lastCheckedAt: undefined
            }
          ]
        });
      });
    });
  });

  return rooms;
};

export const mockRooms = createMockRooms();