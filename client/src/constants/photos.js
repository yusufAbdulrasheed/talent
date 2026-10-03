const UNSPLASH = 'https://images.unsplash.com/photo-';

export function photoUrl(id, width = 800, height) {
  const size = height ? `&w=${width}&h=${height}` : `&w=${width}`;
  return `${UNSPLASH}${id}?auto=format&fit=crop${size}&q=80`;
}

export const PHOTOS = Object.freeze({
  womanOfficeGlasses: '1573497161161-c3e73707e25c',
  womanYellowBlazer: '1611432579402-7037e3e2c1e4',
  womanBraidsConfident: '1573496799515-eebbb63814f2',
  womanAfricanPrint: '1531123414780-f74242c2b052',
  womanLaughing: '1508002366005-75a695ee2d17',
  womanSmilingWhite: '1611432579699-484f7990b127',
  womanPortrait: '1531123897727-8f129e1688ce',
  womanGlassesOutdoor: '1507152832244-10d45c7eda57',
  womanAfro: '1531727991582-cfd25ce79613',

  manBlueSuit: '1616805765352-beedbad46b2a',
  manBeret: '1531384441138-2736e62e0919',
  manTraditionalCap: '1533108344127-a586d2b02479',
  manBlackSweater: '1595211877493-41a4e5f236b3',
  manPlaidShirt: '1615813967515-e1838c1c5116',
  manGlasses: '1566492031773-4f4e44671857',
  manSmiling: '1522529599102-193c0d76b5b6',
  manNurse: '1622253692010-333f2da6031d',

  techPairServerRoom: '1573164713988-8665fc963095',
  womanCoding: '1531482615713-2afd69097998',
  meetingTwoWomen: '1573496267526-08a69e46a409',
  meetingLeader: '1573497701175-00c200fd57f0',
  studyGroupLaptops: '1573164713619-24c711fe7878',
  womanLaptopSofa: '1573166953836-06864dc70a21',
  manVideoCall: '1616587894289-86480e533129',
  handshake: '1521791136064-7986c2920216',
  boardroom: '1573497620053-ea5300f94f21',
  windowConversation: '1573497491208-6b1acb260507',
  teamMeeting: '1573166675921-076ea6b621ce',
  laptopMeeting: '1573164574397-dd250bc8a598',
  conferenceTable: '1573496130407-57329f01f769',
});

export const AVATAR_FACES = [
  PHOTOS.womanAfricanPrint,
  PHOTOS.manBlueSuit,
  PHOTOS.womanSmilingWhite,
  PHOTOS.manPlaidShirt,
];

const FALLBACK_SCENES = [
  PHOTOS.meetingTwoWomen,
  PHOTOS.techPairServerRoom,
  PHOTOS.studyGroupLaptops,
  PHOTOS.handshake,
  PHOTOS.womanCoding,
  PHOTOS.boardroom,
  PHOTOS.manVideoCall,
  PHOTOS.teamMeeting,
];

export function fallbackScene(key = '') {
  let hash = 0;
  for (const char of String(key)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return FALLBACK_SCENES[hash % FALLBACK_SCENES.length];
}
