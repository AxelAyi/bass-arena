
export interface RhythmExercise {
  day: number;
  title: string;
  description: string;
  title_fr?: string;
  description_fr?: string;
  title_es?: string;
  description_es?: string;
  pattern: number[]; // 32 slots for 2 bars of 16th notes (1 = note, 0 = rest)
  midiSequence: number[]; // Midi notes for the 32 slots (root, octaves, etc)
}

// Helper to create a pattern from a string of 16 chars per bar (x = hit, . = rest)
function parsePattern(bar1: string, bar2: string): number[] {
  return (bar1 + bar2).split('').map(c => (c === 'x' ? 1 : 0));
}

export const RHYTHM_CURRICULUM: RhythmExercise[] = [
  {
    day: 1,
    title: "Quarter Note Pulse",
    description: "The heartbeat of music. Play steady quarter notes on the root.",
    title_fr: "Pulsation en Noires",
    description_fr: "Le cœur de la musique. Jouez des noires régulières sur la tonique.",
    title_es: "Pulso de Negras",
    description_es: "El latido de la música. Toca negras constantes en la tónica.",
    pattern: parsePattern("x...x...x...x...", "x...x...x...x..."),
    midiSequence: Array(32).fill(0).map((_, i) => (i % 4 === 0 ? 28 : 0)) // Low E
  },
  {
    day: 2,
    title: "Steady Eighths",
    description: "Rock foundation. Keep the eighth notes driving forward.",
    title_fr: "Croches Régulières",
    description_fr: "La base du rock. Gardez un flux continu de croches.",
    title_es: "Corcheas Constantes",
    description_es: "La base del rock. Mantén el impulso con corcheas.",
    pattern: parsePattern("x.x.x.x.x.x.x.x.", "x.x.x.x.x.x.x.x."),
    midiSequence: Array(32).fill(0).map((_, i) => (i % 2 === 0 ? 33 : 0)) // Low A
  },
  {
    day: 3,
    title: "The Walking Gap",
    description: "Precision rests. Play on beats 1 and 3, rest on 2 and 4.",
    title_fr: "Le Silence Précis",
    description_fr: "Travail des silences. Jouez sur 1 et 3, taisez-vous sur 2 et 4.",
    title_es: "Silencios de Precisión",
    description_es: "Práctica de silencios. Toca en 1 y 3, descansa en 2 y 4.",
    pattern: parsePattern("x.......x.......", "x.......x......."),
    midiSequence: Array(32).fill(0).map((_, i) => (i % 8 === 0 ? 36 : 0)) // Low C
  },
  {
    day: 4,
    title: "Off-beat Syncopation",
    description: "Anticipating the beat. Focus on the 'and' of each count.",
    title_fr: "Contretemps et Syncope",
    description_fr: "Anticipez le temps. Concentrez-vous sur le 'et' de chaque compte.",
    title_es: "Síncopa a Contratiempo",
    description_es: "Anticipando el pulso. Céntrate en el 'y' de cada tiempo.",
    pattern: parsePattern(".x..x...x...x...", ".x..x...x...x..."),
    midiSequence: Array(32).fill(0).map((_, i) => ([2, 4, 8, 12].includes(i % 16) ? 31 : 0)) // Low G
  },
  {
    day: 5,
    title: "The Funky Skank",
    description: "Sixteenth note emphasis. A short staccato pop on the 'e' and 'a'.",
    title_fr: "Le Skank Funky",
    description_fr: "Accentuation en doubles croches. Un pop staccato sur les subdivisions.",
    title_es: "El Skank Funky",
    description_es: "Énfasis en semicorcheas. Un pop corto en las subdivisiones.",
    pattern: parsePattern("x.x.x.x.x.x.xx.x", "x.x.x.x.x.x.xx.x"),
    midiSequence: Array(32).fill(0).map((_, i) => {
        const p = i % 16;
        if ([0, 2, 4, 6, 8, 10, 12, 13, 15].includes(p)) return 38; // D
        return 0;
    })
  },
  {
    day: 6,
    title: "Classic Gallop",
    description: "Common in metal and hard rock. One eighth followed by two sixteenths.",
    title_fr: "Le Galop Classique",
    description_fr: "Commun dans le métal. Une croche suivie de deux doubles.",
    title_es: "Galope Clásico",
    description_es: "Común en el metal. Una corchea seguida de dos semicorcheas.",
    pattern: parsePattern("x.xxx.xxx.xxx.xx", "x.xxx.xxx.xxx.xx"),
    midiSequence: Array(32).fill(0).map((_, i) => {
        const p = i % 4;
        if ([0, 2, 3].includes(p)) return 28; // E
        return 0;
    })
  },
  {
    day: 7,
    title: "Mixed Grid Drill",
    description: "Combining 8ths and 16ths in a syncopated groove.",
    title_fr: "Mélange Rythmique",
    description_fr: "Combinaison de croches et doubles dans un groove syncopé.",
    title_es: "Mezcla de Ritmos",
    description_es: "Combinando corcheas y semicorcheas en un groove sincopado.",
    pattern: parsePattern("x..x.x..x..x.x..", "x..x.x..x..x.xx."),
    midiSequence: Array(32).fill(0).map((_, i) => {
        const hits = [0, 3, 5, 8, 11, 13, 16, 19, 21, 24, 27, 29, 30];
        return hits.includes(i) ? 33 : 0; // A
    })
  },
  {
    day: 8,
    title: "The Anticipation Groove",
    description: "Pushing into the next measure with a 16th note anticipation.",
    title_fr: "Groove d'Anticipation",
    description_fr: "Poussez vers la mesure suivante avec une anticipation.",
    title_es: "Groove de Anticipación",
    description_es: "Impulsando hacia el siguiente compás con anticipación.",
    pattern: parsePattern("x...x...x...x..x", "....x...x...x..."),
    midiSequence: Array(32).fill(0).map((_, i) => {
        if (i === 15) return 40; // G (high)
        if ([0, 4, 8, 12, 20, 24, 28].includes(i)) return 28; // E
        return 0;
    })
  },
  {
    day: 9,
    title: "Funky Loop Pattern",
    description: "A professional-level repeating groove with syncopated octaves.",
    title_fr: "Motif Funky en Boucle",
    description_fr: "Un groove professionnel avec des octaves syncopées.",
    title_es: "Patrón Funky Circular",
    description_es: "Un groove de nivel profesional con octavas sincopadas.",
    pattern: parsePattern("x..x..x.x.x..x.x", "x..x..x.x.x..x.x"),
    midiSequence: Array(32).fill(0).map((_, i) => {
        const hits = [0, 3, 6, 8, 10, 13, 15];
        const p = i % 16;
        if (!hits.includes(p)) return 0;
        if ([3, 10, 15].includes(p)) return 45; // High A
        return 33; // Low A
    })
  }
];
