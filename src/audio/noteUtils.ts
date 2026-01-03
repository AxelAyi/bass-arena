
export const NOTE_NAMES_ENGLISH = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const NOTE_NAMES_LATIN = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

export interface NoteInfo {
  frequency: number;
  midi: number;
  noteName: string;
  octave: number;
  cents: number;
  displayName?: string;
}

export function translateNoteName(englishName: string, naming: 'english' | 'latin'): string {
  if (naming === 'english') return englishName;
  const idx = NOTE_NAMES_ENGLISH.indexOf(englishName);
  if (idx === -1) return englishName;
  return NOTE_NAMES_LATIN[idx];
}

export function translateTextWithNotes(text: string, naming: 'english' | 'latin'): string {
  if (naming === 'english') return text;
  let result = text;
  const sortedNotes = [...NOTE_NAMES_ENGLISH].sort((a, b) => b.length - a.length);
  for (const engNote of sortedNotes) {
    const latinNote = translateNoteName(engNote, 'latin');
    const regex = new RegExp(`\\b${engNote.replace('#', '\\#')}\\b`, 'g');
    result = result.replace(regex, latinNote);
  }
  return result;
}

export function frequencyToNote(freq: number): NoteInfo {
  const midi = 12 * (Math.log2(freq / 440)) + 69;
  const roundedMidi = Math.round(midi);
  const cents = Math.floor((midi - roundedMidi) * 100);
  const noteName = NOTE_NAMES_ENGLISH[roundedMidi % 12];
  const octave = Math.floor(roundedMidi / 12) - 1;
  return { frequency: freq, midi: roundedMidi, noteName, octave, cents };
}

export function validateNote(detectedMidi: number, targetMidi: number, strictOctave: boolean): boolean {
  if (strictOctave) return detectedMidi === targetMidi;
  return (detectedMidi % 12) === (targetMidi % 12);
}
