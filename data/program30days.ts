
export interface DayTask {
  day: number;
  title: string;
  description: string;
  title_fr?: string;
  description_fr?: string;
  title_es?: string;
  description_es?: string;
  strings: number[]; // 0=G, 1=D, 2=A, 3=E, 4=B
  fretRange: [number, number];
  focusNotes?: string[];
  sequence?: number[]; 
  isFiveStringOnly?: boolean;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  name_fr?: string;
  description_fr?: string;
  name_es?: string;
  description_es?: string;
  days: DayTask[];
}

const G = 0, D = 1, A = 2, E = 3, B = 4;

const FRETBOARD_MASTERY_DAYS: DayTask[] = [
  // --- PHASE 1: OPEN STRINGS ---
  { 
    day: 1, 
    title: "Open Strings Awareness", 
    description: "Identify and play the open strings. Focus on the core tuning of your instrument.", 
    title_fr: "Connaissance des cordes à vide",
    description_fr: "Identifiez et jouez les cordes à vide. Concentrez-vous sur l'accordage de base.",
    title_es: "Conciencia de cuerdas al aire",
    description_es: "Identifica y toca las cuerdas al aire. Concéntrate en la afinación básica.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 0] 
  },

  // --- PHASE 2: FIRST POSITION (0-5) - ONE STRING ---
  { 
    day: 2, 
    title: "B String: First Steps (0-5)", 
    description: "Focus exclusively on the first 5 frets of the low B string.", 
    title_fr: "Corde Si : Premiers pas (0-5)",
    description_fr: "Concentrez-vous exclusivement sur les 5 premières frettes de la corde de Si grave.",
    title_es: "Cuerda Si: Primeros pasos (0-5)",
    description_es: "Concéntrate exclusivamente en los primeros 5 trastes de la cuerda Si grave.",
    strings: [B], 
    fretRange: [0, 5], 
    isFiveStringOnly: true 
  },
  { 
    day: 3, 
    title: "E String: Linear 0-5", 
    description: "Learn the first 5 frets of the E string: F, F#, G, G#, A.", 
    title_fr: "Corde Mi : Linéaire 0-5",
    description_fr: "Apprenez les 5 premières frettes de la corde de Mi : Fa, Fa#, Sol, Sol#, La.",
    title_es: "Cuerda Mi: Lineal 0-5",
    description_es: "Aprende los primeros 5 trastes de la cuerda Mi: Fa, Fa#, Sol, Sol#, La.",
    strings: [E], 
    fretRange: [0, 5] 
  },
  { 
    day: 4, 
    title: "A String: Linear 0-5", 
    description: "Learn the first 5 frets of the A string: Bb, B, C, C#, D.", 
    title_fr: "Corde La : Linéaire 0-5",
    description_fr: "Apprenez les 5 premières frettes de la corde de La : Sib, Si, Do, Do#, Ré.",
    title_es: "Cuerda La: Lineal 0-5",
    description_es: "Aprende los primeros 5 trastes de la cuerda La: Sib, Si, Do, Do#, Re.",
    strings: [A], 
    fretRange: [0, 5] 
  },
  { 
    day: 5, 
    title: "D String: Linear 0-5", 
    description: "Learn the first 5 frets of the D string: Eb, E, F, F#, G.", 
    title_fr: "Corde Ré : Linéaire 0-5",
    description_fr: "Apprenez les 5 premières frettes de la corde de Ré : Mib, Mi, Fa, Fa#, Sol.",
    title_es: "Cuerda Re: Lineal 0-5",
    description_es: "Aprende los primeros 5 trastes de la cuerda Re: Mib, Mi, Fa, Fa#, Sol.",
    strings: [D], 
    fretRange: [0, 5] 
  },
  { 
    day: 6, 
    title: "G String: Linear 0-5", 
    description: "Learn the first 5 frets of the G string: Ab, A, Bb, B, C.", 
    title_fr: "Corde Sol : Linéaire 0-5",
    description_fr: "Apprenez les 5 premières frettes de la corde de Sol : Lab, La, Sib, Si, Do.",
    title_es: "Cuerda Sol: Lineal 0-5",
    description_es: "Aprende los primeros 5 trastes de la cuerda Sol: Lab, La, Sib, Si, Do.",
    strings: [G], 
    fretRange: [0, 5] 
  },

  // --- PHASE 3: FIRST POSITION (0-5) - TWO STRINGS ---
  { 
    day: 7, 
    title: "Low End Mix: B & E (0-5)", 
    description: "Switching between the B and E strings in the first position.", 
    title_fr: "Mélange Grave : Si & Mi (0-5)",
    description_fr: "Alternez entre les cordes de Si et Mi en première position.",
    title_es: "Mezcla Grave: Si y Mi (0-5)",
    description_es: "Alterna entre las cuerdas Si y Mi en la primera posición.",
    strings: [B, E], 
    fretRange: [0, 5], 
    isFiveStringOnly: true 
  },
  { 
    day: 8, 
    title: "Foundation Mix: E & A (0-5)", 
    description: "Navigating the most common range for bass lines: E and A strings.", 
    title_fr: "Mélange Fondamental : Mi & La (0-5)",
    description_fr: "Naviguez dans le registre le plus commun : les cordes de Mi et La.",
    title_es: "Mezcla Base: Mi y La (0-5)",
    description_es: "Navega por el rango más común: las cuerdas Mi y La.",
    strings: [E, A], 
    fretRange: [0, 5] 
  },
  { 
    day: 9, 
    title: "Middle Mix: A & D (0-5)", 
    description: "Connecting the middle register strings in first position.", 
    title_fr: "Mélange Médium : La & Ré (0-5)",
    description_fr: "Connectez les cordes du registre médium en première position.",
    title_es: "Mezcla Media: La y Re (0-5)",
    description_es: "Conecta las cuerdas del registro medio en la primera posición.",
    strings: [A, D], 
    fretRange: [0, 5] 
  },
  { 
    day: 10, 
    title: "High End Mix: D & G (0-5)", 
    description: "Navigating the highest strings in first position.", 
    title_fr: "Mélange Aigu : Ré & Sol (0-5)",
    description_fr: "Naviguez sur les cordes les plus aiguës en première position.",
    title_es: "Mezcla Aguda: Re y Sol (0-5)",
    description_es: "Navega por las cuerdas más agudas en la primera posición.",
    strings: [D, G], 
    fretRange: [0, 5] 
  },
  { 
    day: 11, 
    title: "Diagonal Jump: E & D (0-5)", 
    description: "Practice jumping across a string in the low register.", 
    title_fr: "Saut Diagonal : Mi & Ré (0-5)",
    description_fr: "Entraînez-vous à sauter une corde dans le registre grave.",
    title_es: "Salto Diagonal: Mi y Re (0-5)",
    description_es: "Practica saltar una cuerda en el registro grave.",
    strings: [E, D], 
    fretRange: [0, 5] 
  },
  { 
    day: 12, 
    title: "Diagonal Jump: A & G (0-5)", 
    description: "Practice jumping across a string in the mid-high register.", 
    title_fr: "Saut Diagonal : La & Sol (0-5)",
    description_fr: "Entraînez-vous à sauter une corde dans le registre médium-aigu.",
    title_es: "Salto Diagonal: La y Sol (0-5)",
    description_es: "Practica saltar una cuerda en el registro medio-agudo.",
    strings: [A, G], 
    fretRange: [0, 5] 
  },

  // --- PHASE 4: FIRST POSITION (0-5) - ALL STRINGS ---
  { 
    day: 13, 
    title: "Full Low Box Mastery (0-5)", 
    description: "Any note, any string, within the first 5 frets. The core of the instrument.", 
    title_fr: "Maîtrise du Bas du Manche (0-5)",
    description_fr: "Toute note, toute corde, dans les 5 premières frettes. Le cœur de l'instrument.",
    title_es: "Maestría del Traste 0-5",
    description_es: "Cualquier nota, cualquier cuerda, dentro de los primeros 5 trastes.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 5] 
  },

  // --- PHASE 5: MIDDLE POSITION (5-9) - ONE STRING ---
  { 
    day: 14, 
    title: "B String: Middle 5-9", 
    description: "Focus on the middle register of the B string.", 
    title_fr: "Corde Si : Médium 5-9",
    description_fr: "Concentrez-vous sur le registre médium de la corde de Si.",
    title_es: "Cuerda Si: Medio 5-9",
    description_es: "Concéntrate en el registro medio de la cuerda Si.",
    strings: [B], 
    fretRange: [5, 9], 
    isFiveStringOnly: true 
  },
  { 
    day: 15, 
    title: "E String: Middle 5-9", 
    description: "Focus on the middle register of the E string.", 
    title_fr: "Corde Mi : Médium 5-9",
    description_fr: "Concentrez-vous sur le registre médium de la corde de Mi.",
    title_es: "Cuerda Mi: Medio 5-9",
    description_es: "Concéntrate en el registro medio de la cuerda Mi.",
    strings: [E], 
    fretRange: [5, 9] 
  },
  { 
    day: 16, 
    title: "A String: Middle 5-9", 
    description: "Focus on the middle register of the A string.", 
    title_fr: "Corde La : Médium 5-9",
    description_fr: "Concentrez-vous sur le registre médium de la corde de La.",
    title_es: "Cuerda La: Medio 5-9",
    description_es: "Concéntrate en el registro medio de la cuerda La.",
    strings: [A], 
    fretRange: [5, 9] 
  },
  { 
    day: 17, 
    title: "D String: Middle 5-9", 
    description: "Focus on the middle register of the D string.", 
    title_fr: "Corde Ré : Médium 5-9",
    description_fr: "Concentrez-vous sur le registre médium de la corde de Ré.",
    title_es: "Cuerda Re: Medio 5-9",
    description_es: "Concéntrate en el registro medio de la cuerda Re.",
    strings: [D], 
    fretRange: [5, 9] 
  },
  { 
    day: 18, 
    title: "G String: Middle 5-9", 
    description: "Focus on the middle register of the G string.", 
    title_fr: "Corde Sol : Médium 5-9",
    description_fr: "Concentrez-vous sur le registre médium de la corde de Sol.",
    title_es: "Cuerda Sol: Medio 5-9",
    description_es: "Concéntrate en el registro medio de la cuerda Sol.",
    strings: [G], 
    fretRange: [5, 9] 
  },

  // --- PHASE 6: MIDDLE POSITION (5-9) - MIXED ---
  { 
    day: 19, 
    title: "E & A Middle Mix (5-9)", 
    description: "Combining the low strings in the middle position.", 
    title_fr: "Mélange Grave Médium (5-9)",
    description_fr: "Combinez les cordes graves dans la position centrale.",
    title_es: "Mezcla Grave Media (5-9)",
    description_es: "Combina las cuerdas graves en la posición central.",
    strings: [E, A], 
    fretRange: [5, 9] 
  },
  { 
    day: 20, 
    title: "D & G Middle Mix (5-9)", 
    description: "Combining the high strings in the middle position.", 
    title_fr: "Mélange Aigu Médium (5-9)",
    description_fr: "Combinez les cordes aiguës dans la position centrale.",
    title_es: "Mezcla Aguda Media (5-9)",
    description_es: "Combina las cuerdas agudas en la posición central.",
    strings: [D, G], 
    fretRange: [5, 9] 
  },
  { 
    day: 21, 
    title: "Full Middle Box (5-9)", 
    description: "Mastering the center of the neck across all strings.", 
    title_fr: "Maîtrise du Centre du Manche (5-9)",
    description_fr: "Maîtrisez le centre du manche sur toutes les cordes.",
    title_es: "Maestría del Centro del Mástil (5-9)",
    description_es: "Domina el centro del mástil en todas las cuerdas.",
    strings: [E, A, D, G, B], 
    fretRange: [5, 9] 
  },

  // --- PHASE 7: UPPER POSITION (9-12) - ONE STRING ---
  { 
    day: 22, 
    title: "B String: Upper 9-12", 
    description: "Focus on the upper register of the B string.", 
    title_fr: "Corde Si : Aigu 9-12",
    description_fr: "Concentrez-vous sur le registre aigu de la corde de Si.",
    title_es: "Cuerda Si: Agudo 9-12",
    description_es: "Concéntrate en el registro agudo de la cuerda Si.",
    strings: [B], 
    fretRange: [9, 12], 
    isFiveStringOnly: true 
  },
  { 
    day: 23, 
    title: "E String: Upper 9-12", 
    description: "Focus on the upper register of the E string (approaching the octave).", 
    title_fr: "Corde Mi : Aigu 9-12",
    description_fr: "Concentrez-vous sur le registre aigu de la corde de Mi (proche de l'octave).",
    title_es: "Cuerda Mi: Agudo 9-12",
    description_es: "Concéntrate en el registro agudo de la cuerda Mi (cerca de la octava).",
    strings: [E], 
    fretRange: [9, 12] 
  },
  { 
    day: 24, 
    title: "A String: Upper 9-12", 
    description: "Focus on the upper register of the A string.", 
    title_fr: "Corde La : Aigu 9-12",
    description_fr: "Concentrez-vous sur le registre aigu de la corde de La.",
    title_es: "Cuerda La: Agudo 9-12",
    description_es: "Concéntrate en el registro agudo de la cuerda La.",
    strings: [A], 
    fretRange: [9, 12] 
  },
  { 
    day: 25, 
    title: "D String: Upper 9-12", 
    description: "Focus on the upper register of the D string.", 
    title_fr: "Corde Ré : Aigu 9-12",
    description_fr: "Concentrez-vous sur le registre aigu de la corde de Ré.",
    title_es: "Cuerda Re: Agudo 9-12",
    description_es: "Concéntrate en el registro agudo de la cuerda Re.",
    strings: [D], 
    fretRange: [9, 12] 
  },
  { 
    day: 26, 
    title: "G String: Upper 9-12", 
    description: "Focus on the upper register of the G string.", 
    title_fr: "Corde Sol : Aigu 9-12",
    description_fr: "Concentrez-vous sur le registre aigu de la corde de Sol.",
    title_es: "Cuerda Sol: Agudo 9-12",
    description_es: "Concéntrate en el registro agudo de la cuerda Sol.",
    strings: [G], 
    fretRange: [9, 12] 
  },

  // --- PHASE 8: UPPER POSITION (9-12) - MIXED ---
  { 
    day: 27, 
    title: "Low Register Octave Mix (9-12)", 
    description: "B and E strings in the high register.", 
    title_fr: "Mélange Octave Grave (9-12)",
    description_fr: "Cordes de Si et Mi dans le registre aigu.",
    title_es: "Mezcla Octava Grave (9-12)",
    description_es: "Cuerdas Si y Mi en el registro agudo.",
    strings: [B, E], 
    fretRange: [9, 12], 
    isFiveStringOnly: true 
  },
  { 
    day: 28, 
    title: "A & D Upper Mix (9-12)", 
    description: "Switching between A and D strings near the 12th fret.", 
    title_fr: "Mélange La & Ré Aigu (9-12)",
    description_fr: "Alternez entre La et Ré près de la 12ème frette.",
    title_es: "Mezcla La y Re Agudo (9-12)",
    description_es: "Alterna entre La y Re cerca del traste 12.",
    strings: [A, D], 
    fretRange: [9, 12] 
  },
  { 
    day: 29, 
    title: "Full Upper Box (9-12)", 
    description: "Mastering the range leading up to the octave.", 
    title_fr: "Maîtrise du Haut du Manche (9-12)",
    description_fr: "Maîtrisez la zone précédant l'octave.",
    title_es: "Maestría del Alto Mástil (9-12)",
    description_es: "Domina la zona antes de la octava.",
    strings: [E, A, D, G, B], 
    fretRange: [9, 12] 
  },

  // --- PHASE 9: FULL STRING (0-12) ---
  { 
    day: 30, 
    title: "The Whole B String (0-12)", 
    description: "Full linear awareness from open to the octave on the B string.", 
    title_fr: "Toute la corde de Si (0-12)",
    description_fr: "Conscience linéaire totale de la corde de Si jusqu'à l'octave.",
    title_es: "Toda la cuerda Si (0-12)",
    description_es: "Conciencia lineal total de la cuerda Si hasta la octava.",
    strings: [B], 
    fretRange: [0, 12], 
    isFiveStringOnly: true 
  },
  { 
    day: 31, 
    title: "The Whole E String (0-12)", 
    description: "Full linear awareness from open to the octave on the E string.", 
    title_fr: "Toute la corde de Mi (0-12)",
    description_fr: "Conscience linéaire totale de la corde de Mi jusqu'à l'octave.",
    title_es: "Toda la cuerda Mi (0-12)",
    description_es: "Conciencia lineal total de la cuerda Mi hasta la octava.",
    strings: [E], 
    fretRange: [0, 12] 
  },
  { 
    day: 32, 
    title: "The Whole A String (0-12)", 
    description: "Full linear awareness from open to the octave on the A string.", 
    title_fr: "Toute la corde de La (0-12)",
    description_fr: "Conscience linéaire totale de la corde de La jusqu'à l'octave.",
    title_es: "Toda la cuerda La (0-12)",
    description_es: "Conciencia lineal total de la cuerda La hasta la octava.",
    strings: [A], 
    fretRange: [0, 12] 
  },
  { 
    day: 33, 
    title: "The Whole D String (0-12)", 
    description: "Full linear awareness from open to the octave on the D string.", 
    title_fr: "Toute la corde de Ré (0-12)",
    description_fr: "Conscience linéaire totale de la corde de Ré jusqu'à l'octave.",
    title_es: "Toda la cuerda Re (0-12)",
    description_es: "Conciencia lineal total de la cuerda Re hasta la octava.",
    strings: [D], 
    fretRange: [0, 12] 
  },
  { 
    day: 34, 
    title: "The Whole G String (0-12)", 
    description: "Full linear awareness from open to the octave on the G string.", 
    title_fr: "Toute la corde de Sol (0-12)",
    description_fr: "Conscience linéaire totale de la corde de Sol jusqu'à l'octave.",
    title_es: "Toda la cuerda Sol (0-12)",
    description_es: "Conciencia lineal total de la cuerda Sol hasta la octava.",
    strings: [G], 
    fretRange: [0, 12] 
  },

  // --- PHASE 10: FULL NECK (0-12) ---
  { 
    day: 35, 
    title: "Natural Notes Everywhere (0-12)", 
    description: "Identify C, D, E, F, G, A, B anywhere on the neck up to fret 12.", 
    title_fr: "Notes naturelles partout (0-12)",
    description_fr: "Identifiez Do, Ré, Mi, Fa, Sol, La, Si partout jusqu'à la 12ème frette.",
    title_es: "Notas Naturales en Todo el Mástil (0-12)",
    description_es: "Identifica Do, Re, Mi, Fa, Sol, La, Si en todo el mástil hasta el traste 12.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 12], 
    focusNotes: ["C", "D", "E", "F", "G", "A", "B"] 
  },
  { 
    day: 36, 
    title: "Sharp & Flat Challenge (0-12)", 
    description: "Focus exclusively on accidentals across all strings.", 
    title_fr: "Les dièses & bémols (0-12)",
    description_fr: "Concentrez-vous exclusivement sur les altérations sur toutes les cordes.",
    title_es: "Desafío de Sostenidos y Bemoles (0-12)",
    description_es: "Concéntrate exclusivamente en las alteraciones en todas las cuerdas.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 12], 
    focusNotes: ["C#", "D#", "F#", "G#", "A#"] 
  },
  { 
    day: 37, 
    title: "Full Fretboard Fluency (0-12)", 
    description: "Complete identification drill across the first 12 frets.", 
    title_fr: "Fluidité Totale (0-12)",
    description_fr: "Exercice d'identification complet sur les 12 premières frettes.",
    title_es: "Fluidez Total (0-12)",
    description_es: "Ejercicio de identificación completo en los primeros 12 trastes.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 12] 
  },

  // --- PHASE 11: BEYOND THE 12th FRET ---
  { 
    day: 38, 
    title: "Upper Neck: 12-15", 
    description: "Learning the 'dusty' end of the neck. Notice the octave repetition.", 
    title_fr: "Haut du Manche : 12-15",
    description_fr: "Apprenez le bout du manche. Notez la répétition à l'octave.",
    title_es: "Alto Mástil: 12-15",
    description_es: "Aprende el final del mástil. Observa la repetición de octava.",
    strings: [E, A, D, G, B], 
    fretRange: [12, 15] 
  },
  { 
    day: 39, 
    title: "Upper Neck: 15-18", 
    description: "Moving further up the fretboard.", 
    title_fr: "Haut du Manche : 15-18",
    description_fr: "Montez encore plus haut sur le manche.",
    title_es: "Alto Mástil: 15-18",
    description_es: "Sube aún más por el mástil.",
    strings: [E, A, D, G, B], 
    fretRange: [15, 18] 
  },
  { 
    day: 40, 
    title: "The Final Frets: 18-24", 
    description: "Mastering the highest possible notes on your instrument.", 
    title_fr: "Les dernières frettes : 18-24",
    description_fr: "Maîtrisez les notes les plus aiguës de votre instrument.",
    title_es: "Los últimos trastes: 18-24",
    description_es: "Domina las notas más agudas de tu instrumento.",
    strings: [E, A, D, G, B], 
    fretRange: [18, 24] 
  },

  // --- PHASE 12: FINAL CHALLENGE ---
  { 
    day: 41, 
    title: "Fretboard Master Certification", 
    description: "The ultimate test. Any note, any string, full neck. Speed and accuracy are vital.", 
    title_fr: "Certification Maître du Manche",
    description_fr: "Le test ultime. Toute note, toute corde, tout le manche.",
    title_es: "Certificación Maestro del Mástil",
    description_es: "La prueba definitiva. Cualquier nota, cualquier cuerda, todo el mástil.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 24] 
  },
];

export const PENTATONIC_PROGRAM: DayTask[] = Array.from({ length: 40 }, (_, i) => {
  const day = i + 1;
  const isMinor = day > 20;
  const rootMidies = [28, 33, 38, 43, 36, 31, 26]; 
  const root = rootMidies[i % rootMidies.length];
  const NOTE_NAMES_ENG = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rootName = NOTE_NAMES_ENG[root % 12];
  
  const majorIntervals = [0, 2, 4, 7, 9, 12];
  const minorIntervals = [0, 3, 5, 7, 10, 12];
  const intervals = isMinor ? minorIntervals : majorIntervals;
  
  const asc = intervals.map(v => root + v);
  const desc = [...asc].reverse().slice(1);
  const sequence = [...asc, ...desc];
  
  const shapeNum = ((day - 1) % 5) + 1;
  const keyType = isMinor ? "Minor" : "Major";
  const keyTypeFr = isMinor ? "Mineure" : "Majeure";
  const keyTypeEs = isMinor ? "Menor" : "Mayor";

  return {
    day,
    title: `${rootName} ${keyType} Pentatonic Shape ${shapeNum}`,
    description: `Ascending and descending drill focusing on key shapes.`,
    title_fr: `${rootName} Gamme Pentatonique ${keyTypeFr} Forme ${shapeNum}`,
    description_fr: `Exercice ascendant et descendant concentré sur les formes clés.`,
    title_es: `${rootName} Escala Pentatónica ${keyTypeEs} Forma ${shapeNum}`,
    description_es: `Ejercicio ascendente y descendente centrado en las formas clave.`,
    strings: [0, 1, 2, 3, 4],
    fretRange: [0, 15],
    sequence
  };
});

export const PROGRAMS: TrainingProgram[] = [
  { 
    id: 'fretboard', 
    name: 'Fretboard Mastery', 
    description: 'Learn every note on the neck with a granular progression.', 
    name_fr: 'Maîtrise du Manche',
    description_fr: 'Apprenez chaque note du manche avec une progression granulaire.',
    name_es: 'Maestría del Mástil',
    description_es: 'Aprende cada nota del mástil con una progresión detallada.',
    days: FRETBOARD_MASTERY_DAYS 
  },
  { 
    id: 'pentatonic', 
    name: 'Pentatonic Power', 
    description: 'Master essential shapes across the neck.', 
    name_fr: 'Puissance Pentatonique',
    description_fr: 'Maîtrisez les formes essentielles sur tout le manche.',
    name_es: 'Poder Pentatónico',
    description_es: 'Domina las formas esenciales en todo el mástil.',
    days: PENTATONIC_PROGRAM 
  }
];
