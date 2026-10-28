export type RoomLighting = 'classic' | 'blood-red';

/** Static art direction: no random changes, screen tint, camera or audio side effects. */
export const BLOOD_RED = {
  lamp: '#ff1424', rearLamp: '#ff0920', key: '#ff3940',
  fill: '#a53643', ground: '#24070e', rim: '#d90c25',
  wall: '#4a3236', leather: '#5e1c28', cushion: '#7c2732',
  floor: '#584044', wood: '#302123', shade: '#b89b94',
} as const;
