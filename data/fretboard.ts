
export interface FretPosition {
  string: number;
  stringName: string;
  fret: number;
  noteName: string;
  midi: number;
}

export const BASS_STRINGS = [
  { name: 'G', openMidi: 43 },
  { name: 'D', openMidi: 38 },
  { name: 'A', openMidi: 33 },
  { name: 'E', openMidi: 28 },
  { name: 'B', openMidi: 23 }, // Low B for 5-string basses
];

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function getFretInfo(stringIdx: number, fret: number): FretPosition {
  const string = BASS_STRINGS[stringIdx];
  const midi = string.openMidi + fret;
  return {
    string: stringIdx,
    stringName: string.name,
    fret,
    midi,
    noteName: NOTE_NAMES[midi % 12],
  };
}

export function getAllPositionsInRanges(fretMax: number = 12, strings: number[] = [0, 1, 2, 3]): FretPosition[] {
  const positions: FretPosition[] = [];
  strings.forEach(sIdx => {
    // Safety check for 5-string mode index
    if (BASS_STRINGS[sIdx]) {
      for (let f = 0; f <= fretMax; f++) {
        positions.push(getFretInfo(sIdx, f));
      }
    }
  });
  return positions;
}
