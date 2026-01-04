
export interface FretPosition {
  string: number; // 0=G, 1=D, 2=A, 3=E (standard 4-string)
  stringName: string;
  fret: number;
  noteName: string;
  midi: number;
}

// Added export to BASS_STRINGS to fix "Module '...data/fretboard' declares 'BASS_STRINGS' locally, but it is not exported"
// Also added the low B string (index 4) to support 5-string bass settings used in FretboardHeatmap
export const BASS_STRINGS = [
  { name: 'G', openMidi: 43 }, // G2
  { name: 'D', openMidi: 38 }, // D2
  { name: 'A', openMidi: 33 }, // A1
  { name: 'E', openMidi: 28 }, // E1
  { name: 'B', openMidi: 23 }, // B1 (Low B)
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
    // Added safety check for string index validity
    if (BASS_STRINGS[sIdx]) {
      for (let f = 0; f <= fretMax; f++) {
        positions.push(getFretInfo(sIdx, f));
      }
    }
  });
  return positions;
}