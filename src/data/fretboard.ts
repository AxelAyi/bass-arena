
export interface FretPosition {
  string: number; // 0=G, 1=D, 2=A, 3=E (standard 4-string)
  stringName: string;
  fret: number;
  noteName: string;
  midi: number;
}

const BASS_STRINGS = [
  { name: 'G', openMidi: 43 }, // G2
  { name: 'D', openMidi: 38 }, // D2
  { name: 'A', openMidi: 33 }, // A1
  { name: 'E', openMidi: 28 }, // E1
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
    for (let f = 0; f <= fretMax; f++) {
      positions.push(getFretInfo(sIdx, f));
    }
  });
  return positions;
}
