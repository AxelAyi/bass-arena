
export interface DayTask {
  day: number;
  title: string;
  description: string;
  strings: number[]; // Index of strings 0=G, 1=D, 2=A, 3=E
  fretRange: [number, number];
  focusNotes?: string[];
}

export const PROGRAM_DAYS: DayTask[] = [
  // Week 1: E & A strings focus
  { day: 1, title: "Open E & A", description: "Learn the location of open strings E and A.", strings: [3, 2], fretRange: [0, 0] },
  { day: 2, title: "E String: 1-5", description: "Focus on the first 5 frets of the E string.", strings: [3], fretRange: [0, 5] },
  { day: 3, title: "A String: 1-5", description: "Focus on the first 5 frets of the A string.", strings: [2], fretRange: [0, 5] },
  { day: 4, title: "E & A: 1-5", description: "Mix it up on the lower two strings.", strings: [3, 2], fretRange: [0, 5] },
  { day: 5, title: "The Note C", description: "Find all C notes on E and A strings.", strings: [3, 2], fretRange: [0, 12], focusNotes: ["C"] },
  { day: 6, title: "E String: 0-12", description: "Master the full length of the E string.", strings: [3], fretRange: [0, 12] },
  { day: 7, title: "A String: 0-12", description: "Master the full length of the A string.", strings: [2], fretRange: [0, 12] },
  
  // Week 2: D & G strings + Mixed
  { day: 8, title: "Open D & G", description: "Introduction to the higher strings.", strings: [1, 0], fretRange: [0, 0] },
  { day: 9, title: "D String: 1-5", description: "First 5 frets of the D string.", strings: [1], fretRange: [0, 5] },
  { day: 10, title: "G String: 1-5", description: "First 5 frets of the G string.", strings: [0], fretRange: [0, 5] },
  { day: 11, title: "D & G: 1-5", description: "Mixing the high strings.", strings: [1, 0], fretRange: [0, 5] },
  { day: 12, title: "The Note G", description: "Find all G notes across all strings.", strings: [0, 1, 2, 3], fretRange: [0, 12], focusNotes: ["G"] },
  { day: 13, title: "D String: 0-12", description: "Master the D string.", strings: [1], fretRange: [0, 12] },
  { day: 14, title: "G String: 0-12", description: "Master the G string.", strings: [0], fretRange: [0, 12] },

  // Week 3: Octaves and Scales logic
  { day: 15, title: "Octave Drill: E to D", description: "Practice octave jumps between E and D strings.", strings: [3, 1], fretRange: [0, 10] },
  { day: 16, title: "Octave Drill: A to G", description: "Practice octave jumps between A and G strings.", strings: [2, 0], fretRange: [0, 10] },
  { day: 17, title: "Low Box (0-5)", description: "All strings, first 5 frets.", strings: [0, 1, 2, 3], fretRange: [0, 5] },
  { day: 18, title: "Mid Box (5-9)", description: "Focus on the middle of the neck.", strings: [0, 1, 2, 3], fretRange: [5, 9] },
  { day: 19, title: "High Box (9-12)", description: "Focus on the dusty end of the neck.", strings: [0, 1, 2, 3], fretRange: [9, 12] },
  { day: 20, title: "C Major Scale Notes", description: "Find C, D, E, F, G, A, B everywhere.", strings: [0, 1, 2, 3], fretRange: [0, 12], focusNotes: ["C", "D", "E", "F", "G", "A", "B"] },
  { day: 21, title: "The 7th Fret", description: "Special drill focusing on the 7th fret across strings.", strings: [0, 1, 2, 3], fretRange: [7, 7] },

  // Week 4: Final Consolidation
  { day: 22, title: "Random Notes: Set 1", description: "A, D, G, C drills.", strings: [0, 1, 2, 3], fretRange: [0, 12], focusNotes: ["A", "D", "G", "C"] },
  { day: 23, title: "Random Notes: Set 2", description: "E, B, F#, G# drills.", strings: [0, 1, 2, 3], fretRange: [0, 12], focusNotes: ["E", "B", "F#", "G#"] },
  { day: 24, title: "The Sharp Edge", description: "Focusing on sharps and flats.", strings: [0, 1, 2, 3], fretRange: [0, 12], focusNotes: ["C#", "D#", "F#", "G#", "A#"] },
  { day: 25, title: "Horizontal Mastery", description: "Low to high movement.", strings: [0, 1, 2, 3], fretRange: [0, 12] },
  { day: 26, title: "Position I", description: "Frets 0 to 4 focus.", strings: [0, 1, 2, 3], fretRange: [0, 4] },
  { day: 27, title: "Position II", description: "Frets 5 to 8 focus.", strings: [0, 1, 2, 3], fretRange: [5, 8] },
  { day: 28, title: "Position III", description: "Frets 9 to 12 focus.", strings: [0, 1, 2, 3], fretRange: [9, 12] },
  { day: 29, title: "The Full Monty", description: "Random note selection across the whole neck.", strings: [0, 1, 2, 3], fretRange: [0, 12] },
  { day: 30, title: "Final Certification", description: "Test your speed and accuracy on the entire fretboard.", strings: [0, 1, 2, 3], fretRange: [0, 12] },
];
