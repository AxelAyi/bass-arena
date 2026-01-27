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
  durations?: number[]; // Rhythmic durations (1.0 = quarter note)
  isFiveStringOnly?: boolean;
  questionCount?: number; // Optional count of questions for this task
  isRhythm?: boolean;
  pattern?: number[];
  midiSequence?: number[];
  isEarTraining?: boolean;
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
  // --- PHASE 1: OPEN STRINGS & LOWER FRETS ---
  { 
    day: 1, 
    title: "Open Strings Awareness", 
    description: "Identify and play the open strings. Focus on the core tuning of your instrument.", 
    title_fr: "Conscience des cordes à vide",
    description_fr: "Identifiez et jouez les cordes à vide. Concentrez-vous sur l'accordage de base.",
    title_es: "Conciencia de cuerdas al aire",
    description_es: "Identifica y toca las cuerdas al aire. Concéntrate en la afinación básica.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 0],
    questionCount: 12
  },
  { 
    day: 2, 
    title: "E String: Frets 1-3", 
    description: "Learn the lowest notes: F, F#, and G.", 
    title_fr: "Corde Mi : Frettes 1-3",
    description_fr: "Apprenez les notes les plus graves : Fa, Fa# et Sol.",
    title_es: "Cuerda Mi: Trastes 1-3",
    description_es: "Aprende las notas más graves: Fa, Fa# y Sol.",
    strings: [E], 
    fretRange: [1, 3] 
  },
  { 
    day: 3, 
    title: "A String: Frets 1-3", 
    description: "Master Bb, B, and C on the A string.", 
    title_fr: "Corde La : Frettes 1-3",
    description_fr: "Maîtrisez Sib, Si et Do sur la corde La.",
    title_es: "Cuerda La: Trastes 1-3",
    description_es: "Domina Sib, Si y Do en la cuerda La.",
    strings: [A], 
    fretRange: [1, 3] 
  },
  { 
    day: 4, 
    title: "D String: Frets 1-3", 
    description: "Focus on Eb, E, and F on the D string.", 
    title_fr: "Corde Ré : Frettes 1-3",
    description_fr: "Concentrez-vous sur Mib, Mi et Fa sur la corde Ré.",
    title_es: "Cuerda Re: Trastes 1-3",
    description_es: "Céntrate en Mib, Mi y Fa en la cuerda Re.",
    strings: [D], 
    fretRange: [1, 3] 
  },
  { 
    day: 5, 
    title: "G String: Frets 1-3", 
    description: "Identify Ab, A, and Bb on the highest string.", 
    title_fr: "Corde Sol : Frettes 1-3",
    description_fr: "Identifiez Lab, La et Sib sur la corde la plus aiguë.",
    title_es: "Cuerda Sol: Trastes 1-3",
    description_es: "Identifica Lab, La y Sib en la cuerda más aguda.",
    strings: [G], 
    fretRange: [1, 3] 
  },
  { 
    day: 6, 
    title: "Low End Mix: E & A", 
    description: "Combined drill for the lower strings (Frets 0-3).", 
    title_fr: "Mix Graves : Mi & La",
    description_fr: "Exercice combiné pour les cordes graves (Frettes 0-3).",
    title_es: "Mezcla Grave: Mi y La",
    description_es: "Ejercicio combinado para las cuerdas graves (Trastes 0-3).",
    strings: [E, A], 
    fretRange: [0, 3] 
  },
  { 
    day: 7, 
    title: "High End Mix: D & G", 
    description: "Combined drill for the upper strings (Frets 0-3).", 
    title_fr: "Mix Aigus : Ré & Sol",
    description_fr: "Exercice combiné pour les cordes aiguës (Frettes 0-3).",
    title_es: "Mezcla Aguda: Re y Sol",
    description_es: "Ejercicio combinado para las cuerdas agudas (Trastes 0-3).",
    strings: [D, G], 
    fretRange: [0, 3] 
  },
  { 
    day: 8, 
    title: "First Position Mastery", 
    description: "All strings, Frets 0-4. The foundation of most basslines.", 
    title_fr: "Maîtrise de la 1ère Position",
    description_fr: "Toutes les cordes, Frettes 0-4. La base de la plupart des lignes de basse.",
    title_es: "Maestría en Primera Posición",
    description_es: "Todas las cuerdas, Trastes 0-4. La base de la mayoría de las líneas de bajo.",
    strings: [E, A, D, G], 
    fretRange: [0, 4] 
  },

  // --- PHASE 2: MOVING UP (FRETS 5-8) ---
  { 
    day: 9, 
    title: "E String: The Middle Section", 
    description: "Identify A, Bb, B, and C (Frets 5-8).", 
    title_fr: "Corde Mi : Section Milieu",
    description_fr: "Identifiez La, Sib, Si et Do (Frettes 5-8).",
    title_es: "Cuerda Mi: Sección Media",
    description_es: "Identifica La, Sib, Si y Do (Trastes 5-8).",
    strings: [E], 
    fretRange: [5, 8] 
  },
  { 
    day: 10, 
    title: "A String: The Middle Section", 
    description: "Focus on D, Eb, E, and F (Frets 5-8).", 
    title_fr: "Corde La : Section Milieu",
    description_fr: "Concentrez-vous sur Ré, Mib, Mi et Fa (Frettes 5-8).",
    title_es: "Cuerda La: Sección Media",
    description_es: "Céntrate en Re, Mib, Mi y Fa (Trastes 5-8).",
    strings: [A], 
    fretRange: [5, 8] 
  },
  { 
    day: 11, 
    title: "D String: The Middle Section", 
    description: "Master G, Ab, A, and Bb (Frets 5-8).", 
    title_fr: "Corde Ré : Section Milieu",
    description_fr: "Maîtrisez Sol, Lab, La et Sib (Frettes 5-8).",
    title_es: "Cuerda Re: Sección Media",
    description_es: "Domina Sol, Lab, La y Sib (Trastes 5-8).",
    strings: [D], 
    fretRange: [5, 8] 
  },
  { 
    day: 12, 
    title: "G String: The Middle Section", 
    description: "Identify C, Db, D, and Eb (Frets 5-8).", 
    title_fr: "Corde Sol : Section Milieu",
    description_fr: "Identifiez Do, Réb, Ré et Mib (Frettes 5-8).",
    title_es: "Cuerda Sol: Sección Media",
    description_es: "Identifica Do, Reb, Re y Mib (Trastes 5-8).",
    strings: [G], 
    fretRange: [5, 8] 
  },
  { 
    day: 13, 
    title: "Box Patterns: Frets 5-8", 
    description: "Navigation drill in the middle of the neck.", 
    title_fr: "Formes de Boîte : Frettes 5-8",
    description_fr: "Exercice de navigation au milieu du manche.",
    title_es: "Patrones de Caja: Trastes 5-8",
    description_es: "Ejercicio de navegación en la mitad del mástil.",
    strings: [E, A, D, G], 
    fretRange: [5, 8] 
  },

  // --- PHASE 3: HIGHER GROUND (FRETS 9-12) ---
  { 
    day: 14, 
    title: "The Octave Threshold", 
    description: "Learn notes on Frets 9-11 across all strings.", 
    title_fr: "Le Seuil de l'Octave",
    description_fr: "Apprenez les notes des frettes 9-11 sur toutes les cordes.",
    title_es: "El Umbral de la Octava",
    description_es: "Aprende las notas de los trastes 9-11 en todas las cuerdas.",
    strings: [E, A, D, G], 
    fretRange: [9, 11] 
  },
  { 
    day: 15, 
    title: "The 12th Fret Octaves", 
    description: "Master the 12th fret. It mirrors your open strings!", 
    title_fr: "Les Octaves de la 12ème Frette",
    description_fr: "Maîtrisez la 12ème frette. Elle reflète vos cordes à vide !",
    title_es: "Las Octavas del Traste 12",
    description_es: "Domina el traste 12. ¡Es un espejo de tus cuerdas al aire!",
    strings: [E, A, D, G], 
    fretRange: [12, 12] 
  },
  { 
    day: 16, 
    title: "Upper E & A strings", 
    description: "Identify notes between Frets 7 and 12 on the heavy strings.", 
    title_fr: "Cordes Mi & La Supérieures",
    description_fr: "Identifiez les notes entre les frettes 7 et 12 sur les cordes graves.",
    title_es: "Cuerdas Mi y La Superiores",
    description_es: "Identifica las notas entre los trastes 7 y 12 en las cuerdas graves.",
    strings: [E, A], 
    fretRange: [7, 12] 
  },
  { 
    day: 17, 
    title: "Upper D & G strings", 
    description: "Identify notes between Frets 7 and 12 on the melodic strings.", 
    title_fr: "Cordes Ré & Sol Supérieures",
    description_fr: "Identifiez les notes entre les frettes 7 et 12 sur les cordes aiguës.",
    title_es: "Cuerdas Re y Sol Superiores",
    description_es: "Identifica las notas entre los trastes 7 y 12 en las cuerdas melódicas.",
    strings: [D, G], 
    fretRange: [7, 12] 
  },

  // --- PHASE 4: HORIZONTAL MASTERY ---
  { 
    day: 18, 
    title: "Horizontal E String", 
    description: "Traverse the entire E string from Fret 0 to 12.", 
    title_fr: "Corde Mi Horizontale",
    description_fr: "Parcourez toute la corde Mi de la frette 0 à 12.",
    title_es: "Cuerda Mi Horizontal",
    description_es: "Recorre toda la cuerda Mi del traste 0 al 12.",
    strings: [E], 
    fretRange: [0, 12] 
  },
  { 
    day: 19, 
    title: "Horizontal A String", 
    description: "Traverse the entire A string from Fret 0 to 12.", 
    title_fr: "Corde La Horizontale",
    description_fr: "Parcourez toute la corde La de la frette 0 à 12.",
    title_es: "Cuerda La Horizontal",
    description_es: "Recorre toda la cuerda La del traste 0 al 12.",
    strings: [A], 
    fretRange: [0, 12] 
  },
  { 
    day: 20, 
    title: "Horizontal D String", 
    description: "Traverse the entire D string from Fret 0 to 12.", 
    title_fr: "Corde Ré Horizontale",
    description_fr: "Parcourez toute la corde Ré de la frette 0 à 12.",
    title_es: "Cuerda Re Horizontal",
    description_es: "Recorre toda la cuerda Re del traste 0 al 12.",
    strings: [D], 
    fretRange: [0, 12] 
  },
  { 
    day: 21, 
    title: "Horizontal G String", 
    description: "Traverse the entire G string from Fret 0 to 12.", 
    title_fr: "Corde Sol Horizontale",
    description_fr: "Parcourez toute la corde Sol de la frette 0 à 12.",
    title_es: "Cuerda Sol Horizontal",
    description_es: "Recorre toda la cuerda Sol del traste 0 al 12.",
    strings: [G], 
    fretRange: [0, 12] 
  },

  // --- PHASE 5: SHARPS & FLATS FOCUS ---
  { 
    day: 22, 
    title: "Natural Notes Only", 
    description: "Identify only C, D, E, F, G, A, B across the neck (0-12).", 
    title_fr: "Notes Naturelles Uniquement",
    description_fr: "Identifiez uniquement Do, Ré, Mi, Fa, Sol, La, Si sur le manche (0-12).",
    title_es: "Solo Notas Naturales",
    description_es: "Identifica solo Do, Re, Mi, Fa, Sol, La, Si en el mástil (0-12).",
    strings: [E, A, D, G], 
    fretRange: [0, 12], 
    focusNotes: ["C", "D", "E", "F", "G", "A", "B"] 
  },
  { 
    day: 23, 
    title: "Accidental Focus", 
    description: "Focus on sharps and flats: C#, Eb, F#, Ab, Bb.", 
    title_fr: "Focus Altérations",
    description_fr: "Concentrez-vous sur les dièses et bémols : Do#, Mib, Fa#, Lab, Sib.",
    title_es: "Enfoque en Accidentales",
    description_es: "Céntrate en sostenidos y bemoles: Do#, Mib, Fa#, Lab, Sib.",
    strings: [E, A, D, G], 
    fretRange: [0, 12], 
    focusNotes: ["C#", "D#", "F#", "G#", "A#"] 
  },

  // --- PHASE 6: FULL NECK CHALLENGES ---
  { 
    day: 24, 
    title: "Lower Neck Full Mix", 
    description: "Mixed strings and frets (0-7).", 
    title_fr: "Mix Bas du Manche",
    description_fr: "Mélange de cordes et de frettes (0-7).",
    title_es: "Mezcla Inferior del Mástil",
    description_es: "Mezcla de cuerdas y trastes (0-7).",
    strings: [E, A, D, G], 
    fretRange: [0, 7] 
  },
  { 
    day: 25, 
    title: "Upper Neck Full Mix", 
    description: "Mixed strings and frets (7-12).", 
    title_fr: "Mix Haut du Manche",
    description_fr: "Mélange de cordes et de frettes (7-12).",
    title_es: "Mezcla Superior del Mástil",
    description_es: "Mezcla de cuerdas y trastes (7-12).",
    strings: [E, A, D, G], 
    fretRange: [7, 12] 
  },
  { 
    day: 26, 
    title: "Vertical Alignment", 
    description: "Finding the same note across different strings.", 
    title_fr: "Alignement Vertical",
    description_fr: "Trouver la même note sur différentes cordes.",
    title_es: "Alineación Vertical",
    description_es: "Encontrar la misma note en diferentes cuerdas.",
    strings: [E, A, D, G], 
    fretRange: [0, 12], 
    questionCount: 15 
  },
  { 
    day: 27, 
    title: "The Speed Drill", 
    description: "Fast-paced identification across the whole neck.", 
    title_fr: "Exercice de Vitesse",
    description_fr: "Identification rapide sur tout le manche.",
    title_es: "Ejercicio de Velocidad",
    description_es: "Identificación rápida en todo el mástil.",
    strings: [E, A, D, G], 
    fretRange: [0, 12], 
    questionCount: 20 
  },
  { 
    day: 28, 
    title: "Dusty End: Above 12", 
    description: "Explore the frets between 13 and 17.", 
    title_fr: "Zone Poussiéreuse : Au-delà de 12",
    description_fr: "Explorez les frettes entre 13 et 17.",
    title_es: "El Final Polvoriento: Más allá de 12",
    description_es: "Explora los trastes entre 13 et 17.",
    strings: [E, A, D, G], 
    fretRange: [13, 17] 
  },
  { 
    day: 29, 
    title: "The Extreme End", 
    description: "Navigate frets 18 to 22. Maximum pitch tracking test!", 
    title_fr: "L'Extrémité",
    description_fr: "Naviguez des frettes 18 à 22. Test de détection maximum !",
    title_es: "El Extremo",
    description_es: "Navega por los trastes 18 a 22. ¡Prueba máxima de seguimiento!",
    strings: [E, A, D, G], 
    fretRange: [18, 22] 
  },
  { 
    day: 30, 
    title: "Full Mastery Graduation", 
    description: "Complete fretboard test (0-22). You are a master!", 
    title_fr: "Diplôme de Maîtrise Totale",
    description_fr: "Test complet du manche (0-22). Vous êtes un maître !",
    title_es: "Graduación de Maestría Completa",
    description_es: "Prueba completa del mástil (0-22). ¡Eres un maestro!",
    strings: [E, A, D, G], 
    fretRange: [0, 22], 
    questionCount: 30 
  },

  // --- PHASE 7: 5-STRING SPECIALS ---
  { 
    day: 31, 
    title: "B String: The Foundations", 
    description: "Focus on the low B string frets 0 to 4.", 
    title_fr: "Corde Si : Les Fondations",
    description_fr: "Concentrez-vous sur la corde Si grave, frettes 0 à 4.",
    title_es: "Cuerda Si: Los Cimientos",
    description_es: "Céntrate en la cuerda Si grave, trastes 0 a 4.",
    strings: [B], 
    fretRange: [0, 4], 
    isFiveStringOnly: true 
  },
  { 
    day: 32, 
    title: "B String: The Middle Section", 
    description: "Navigate frets 5 to 9 on the low B string.", 
    title_fr: "Corde Si : Section Milieu",
    description_fr: "Naviguez des frettes 5 à 9 sur la corde Si grave.",
    title_es: "Cuerda Si: Sección Media",
    description_es: "Navega por los trastes 5 a 9 en la cuerda Si grave.",
    strings: [B], 
    fretRange: [5, 9], 
    isFiveStringOnly: true 
  },
  { 
    day: 33, 
    title: "B String: Full Length", 
    description: "Traverse the entire B string (0-12).", 
    title_fr: "Corde Si : Toute la Longueur",
    description_fr: "Parcourez toute la corde Si (0-12).",
    title_es: "Cuerda Si: Longitud Completa",
    description_es: "Recorre toda la cuerda Si (0-12).",
    strings: [B], 
    fretRange: [0, 12], 
    isFiveStringOnly: true 
  },
  { 
    day: 34, 
    title: "Sub-Contra Mix: B & E", 
    description: "Combined drill for the two lowest strings.", 
    title_fr: "Mix Sub-Contra : Si & Mi",
    description_fr: "Exercice combiné pour les deux cordes les plus graves.",
    title_es: "Mezcla Sub-Contra: Si y Mi",
    description_es: "Ejercicio combinado para las dos cuerdas más graves.",
    strings: [B, E], 
    fretRange: [0, 12], 
    isFiveStringOnly: true 
  },

  // --- PHASE 8: ADVANCED DRILLS & SEQUENCES ---
  { 
    day: 35, 
    title: "The Fifth Interval", 
    description: "The most stable interval in bass playing. Root to Fifth.", 
    title_fr: "L'Intervalle de Quinte",
    description_fr: "L'intervalle le plus stable à la basse. Fondamentale à la Quinte.",
    title_es: "El Intervalo de Quinta",
    description_es: "El intervalo más estable en el bajo. Tónica a Quinta.",
    strings: [E, A, D, G], 
    fretRange: [0, 12], 
    questionCount: 15 
  },
  { 
    day: 36, 
    title: "The Chromatic Challenge", 
    description: "Moving in half-steps across strings.", 
    title_fr: "Le Défi Chromatique",
    description_fr: "Déplacement par demi-tons à travers les cordes.",
    title_es: "El Desafío Cromático",
    description_es: "Desplazamiento por semitonos a través de las cuerdas.",
    strings: [E, A, D, G], 
    fretRange: [0, 12], 
    questionCount: 20 
  },
  { 
    day: 37, 
    title: "Fifth Interval Drill", 
    description: "Finding fifths vertically across the fretboard.", 
    title_fr: "Exercice de Quintes",
    description_fr: "Trouver les quintes verticalement sur le manche.",
    title_es: "Ejercicio de Quintas",
    description_es: "Encontrar quintas verticalmente en el diapasón.",
    strings: [E, A, D, G], 
    fretRange: [0, 12] 
  },
  { 
    day: 38, 
    title: "Low Frequency Stability", 
    description: "Specialized drill for notes below A1.", 
    title_fr: "Stabilité Basse Fréquence",
    description_fr: "Exercice spécialisé pour les notes en dessous du La1.",
    title_es: "Estabilidad de Baja Frecuencia",
    description_es: "Ejercicio especializado para notas por debajo de La1.",
    strings: [E, B], 
    fretRange: [0, 5] 
  },
  { 
    day: 39, 
    title: "The High Range Soloist", 
    description: "Navigate notes above Fret 12 on upper strings.", 
    title_fr: "Le Soliste des Aigus",
    description_fr: "Naviguez les notes au-delà de la frette 12 sur les cordes aiguës.",
    title_es: "El Solista de Rango Alto",
    description_es: "Navega por las notas por encima del traste 12 en las cuerdas superiores.",
    strings: [D, G], 
    fretRange: [12, 22] 
  },
  { 
    day: 40, 
    title: "Final Marathon 1", 
    description: "50 notes as fast as possible. Lower neck.", 
    title_fr: "Marathon Final 1",
    description_fr: "50 notes le plus vite possible. Bas du manche.",
    title_es: "Maratón Final 1",
    description_es: "50 notas lo más rápido posible. Parte inferior del mástil.",
    strings: [E, A, D, G, B], 
    fretRange: [0, 7], 
    questionCount: 50 
  },
  { 
    day: 41, 
    title: "Final Marathon 2", 
    description: "50 notes as fast as possible. Upper neck.", 
    title_fr: "Marathon Final 2",
    description_fr: "50 notes le plus vite possible. Haut du manche.",
    title_es: "Maratón Final 2",
    description_es: "50 notas lo más rápido posible. Parte superior del mástil.",
    strings: [E, A, D, G, B], 
    fretRange: [8, 22], 
    questionCount: 50 
  }
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

const EAR_TRAINING_TASKS: DayTask[] = [
  // --- BEGINNER: 2-3 NOTES ---
  { 
    day: 1, title: "Perfect Fourth", description: "The core interval of bass tuning.", 
    title_fr: "Quarte Juste", description_fr: "L'intervalle de base de l'accordage de la basse.",
    title_es: "Cuarta Justa", description_es: "El intervalo central de la afinación del bajo.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 33], durations: [1, 2], isEarTraining: true 
  },
  { 
    day: 2, title: "Perfect Fifth", description: "The anchor of bass. Root to Fifth jump.", 
    title_fr: "Quinte Juste", description_fr: "L'ancre de la basse. Saut de la tonique à la quinte.",
    title_es: "Quinta Justa", description_es: "El ancla del bajo. Salto de tónica a quinta.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 35], durations: [1, 2], isEarTraining: true 
  },
  { 
    day: 3, title: "Major Triad", description: "Bright and happy. Root, Major Third, Fifth.", 
    title_fr: "Triade Majeure", description_fr: "Brillant et joyeux. Tonique, Tierce Majeure, Quinte.",
    title_es: "Tríada Mayor", description_es: "Brillante y alegre. Tónica, Tercera Mayor, Quinta.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 32, 35], durations: [1, 1, 2], isEarTraining: true 
  },
  { 
    day: 4, title: "Minor Triad", description: "Dark and moody. Root, Minor Third, Fifth.", 
    title_fr: "Triade Mineure", description_fr: "Sombre et mélancolique. Tonique, Tierce Mineure, Quinte.",
    title_es: "Tríada Menor", description_es: "Oscura y melancólica. Tónica, Tercera Menor, Quinta.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 31, 35], durations: [1, 1, 2], isEarTraining: true 
  },
  { 
    day: 5, title: "Major Pentatonic Intro", description: "First 3 notes of the major pent.", 
    title_fr: "Intro Pentatonique Majeure", description_fr: "Les 3 premières notes de la pentatonique majeure.",
    title_es: "Intro Pentatónica Mayor", description_es: "Las primeras 3 notas de la pentatónica mayor.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 30, 32], durations: [1, 1, 2], isEarTraining: true 
  },
  
  // --- INTERMEDIATE: 4-5 NOTES ---
  { 
    day: 6, title: "Simple Walk-up", description: "A classic walking bass fragment.", 
    title_fr: "Ascension Simple", description_fr: "Un fragment classique de walking bass.",
    title_es: "Ascenso Simple", description_es: "Un fragmento clásico de walking bass.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 30, 32, 33], durations: [1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 7, title: "Descending Scale", description: "Coming back home. 4 notes down.", 
    title_fr: "Gamme Descendante", description_fr: "Retour à la maison. 4 notes vers le bas.",
    title_es: "Escala Descendente", description_es: "Regresando a casa. 4 notas hacia abajo.",
    strings: [E, A], fretRange: [0, 12], sequence: [35, 33, 32, 30], durations: [1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 8, title: "Root-Fifth-Fourth", description: "Common bass relationship.", 
    title_fr: "Tonique-Quinte-Quarte", description_fr: "Relation commune à la basse.",
    title_es: "Tónica-Quinta-Cuarta", description_es: "Relación común en el bajo.",
    strings: [E, A, D], fretRange: [0, 12], sequence: [28, 35, 33, 28], durations: [1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 9, title: "The Blues Fragment", description: "Flat fifth tension.", 
    title_fr: "Fragment Blues", description_fr: "Tension de la quinte diminuée (blue note).",
    title_es: "Fragmento de Blues", description_es: "Tensión de la quinta disminuida.",
    strings: [E, A], fretRange: [0, 12], sequence: [33, 36, 37, 38], durations: [0.5, 0.5, 0.5, 2], isEarTraining: true 
  },
  { 
    day: 10, title: "Arpeggio Skip", description: "Skipping notes in the triad.", 
    title_fr: "Saut d'Arpège", description_fr: "Sauter des notes dans la triade.",
    title_es: "Salto de Arpegio", description_es: "Saltando notas en la tríada.",
    strings: [E, A, D], fretRange: [0, 12], sequence: [28, 35, 32, 30], durations: [1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 11, title: "Chromatic Step-up", description: "Half-step movements.", 
    title_fr: "Montée Chromatique", description_fr: "Mouvements par demi-tons.",
    title_es: "Paso Cromático", description_es: "Movimientos por semitonos.",
    strings: [E], fretRange: [0, 12], sequence: [28, 29, 30, 31, 33], durations: [0.5, 0.5, 0.5, 0.5, 1], isEarTraining: true 
  },
  { 
    day: 12, title: "Syncopated Root", description: "Rhythmic challenge on one note.", 
    title_fr: "Tonique Syncopée", description_fr: "Défi rythmique sur une seule note.",
    title_es: "Tónica Sincopada", description_es: "Desafío rítmico en una sola nota.",
    strings: [E], fretRange: [0, 12], sequence: [28, 28, 28, 28, 28], durations: [0.75, 0.25, 1, 0.5, 0.5], isEarTraining: true 
  },
  { 
    day: 13, title: "Lydian Lift", description: "The sharp fourth jump.", 
    title_fr: "Élévation Lydienne", description_fr: "Le saut de quarte augmentée.",
    title_es: "Elevación Lidia", description_es: "El salto de cuarta aumentada.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 34, 35, 33, 28], durations: [1, 1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 14, title: "Minor Pentatonic Intro", description: "First 3 notes of the minor pent.", 
    title_fr: "Intro Pentatonique Mineure", description_fr: "Les 3 premières notes de la pentatonique mineure.",
    title_es: "Intro Pentatónica Menor", description_es: "Las primeras 3 notas de la pentatónica menor.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 31, 33, 35, 28], durations: [1, 1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 15, title: "The Box Pattern", description: "Geometric recognition.", 
    title_fr: "Motif en Boîte", description_fr: "Reconnaissance géométrique.",
    title_es: "Patrón de Caja", description_es: "Reconocimiento geométrico.",
    strings: [A, D], fretRange: [2, 5], sequence: [33, 35, 38, 37, 33], durations: [0.5, 0.5, 0.5, 0.5, 1], isEarTraining: true 
  },
  
  // --- ADVANCED SONG INSPIRED ---
  { 
    day: 16, 
    title: "Inspired: Seven Nation", 
    description: "Recognize the iconic riff structure (Minor 3rd and scale steps).", 
    title_fr: "Inspiré par : Seven Nation",
    description_fr: "Reconnaissez la structure du riff iconique (Tierce mineure et degrés de la gamme).",
    title_es: "Inspirado en: Seven Nation",
    description_es: "Reconoce la estructura del riff icónico (Tercera menor y pasos de escala).",
    strings: [E, A], fretRange: [0, 12], 
    sequence: [28, 28, 31, 28, 26, 24, 23], 
    durations: [1.5, 0.5, 0.75, 0.25, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 17, 
    title: "Inspired: Billie Jean", 
    description: "The classic F# minor pentatonic groove intervals.", 
    title_fr: "Inspiré par : Billie Jean",
    description_fr: "Les intervalles classiques du groove en Fa# mineur pentatonique.",
    title_es: "Inspirado en: Billie Jean",
    description_es: "Los intervalos clásicos del groove de Fa# menor pentatónico.",
    strings: [E, A, D], fretRange: [0, 12], 
    sequence: [30, 27, 25, 27, 30, 27, 25, 27], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    isEarTraining: true 
  },
  { 
    day: 18, 
    title: "Inspired: Feel Good", 
    description: "Focus on the minor third and the flat fifth tension.", 
    title_fr: "Inspiré par : Feel Good",
    description_fr: "Concentrez-vous sur la tierce mineure et la tension de la quinte diminuée.",
    title_es: "Inspirado en: Feel Good",
    description_es: "Céntrate en la tercera menor y la tensión de la quinta disminuida.",
    strings: [E, A], fretRange: [0, 12], 
    sequence: [28, 28, 31, 33, 34, 33, 31, 28], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    isEarTraining: true 
  },
  { 
    day: 19, 
    title: "Inspired: Sunshine Love", 
    description: "Descending blues scale fragment.", 
    title_fr: "Inspiré par : Sunshine Love",
    description_fr: "Fragment de gamme blues descendante.",
    title_es: "Inspirado en: Sunshine Love",
    description_es: "Fragmento de escala de blues descendente.",
    strings: [E, A, D], fretRange: [0, 12], 
    sequence: [38, 38, 36, 38, 33, 32, 31, 28], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 20, 
    title: "Inspired: Stand By Me", 
    description: "The major root movement (1 - 6 - 4 - 5).", 
    title_fr: "Inspiré par : Stand By Me",
    description_fr: "Le mouvement de tonique majeur classique (1 - 6 - 4 - 5).",
    title_es: "Inspirado en: Stand By Me",
    description_es: "El movimiento de tónica mayor clásico (1 - 6 - 4 - 5).",
    strings: [E, A], fretRange: [0, 12], 
    sequence: [28, 28, 37, 37, 33, 33, 35, 35], 
    durations: [1, 1, 1, 1, 1, 1, 1, 1],
    isEarTraining: true 
  },
  { 
    day: 21, 
    title: "Inspired: Come As You Are", 
    description: "Chromatic movement on the low string.", 
    title_fr: "Inspiré par : Come As You Are",
    description_fr: "Mouvement chromatique sur la corde grave.",
    title_es: "Inspirado en: Come As You Are",
    description_es: "Movimiento cromático en la cuerda grave.",
    strings: [E], fretRange: [0, 5], 
    sequence: [28, 28, 29, 30, 28, 30, 28, 30, 29, 28], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 22, 
    title: "Inspired: Money", 
    description: "Odd-time feel arpeggio (m3, 5, 1).", 
    title_fr: "Inspiré par : Money",
    description_fr: "Arpège au feeling asymétrique (m3, 5, 1).",
    title_es: "Inspirado en: Money",
    description_es: "Arpegio con aire de compás impar (m3, 5, 1).",
    strings: [E, A, D], fretRange: [0, 12], 
    sequence: [33, 37, 38, 33, 31, 28, 33, 31], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 23, 
    title: "Inspired: Under Pressure", 
    description: "Steady rhythm with a leap to the fourth.", 
    title_fr: "Inspiré par : Under Pressure",
    description_fr: "Rythme régulier avec un saut vers la quarte.",
    title_es: "Inspirado en: Under Pressure",
    description_es: "Ritmo constante con un salto a la cuarta.",
    strings: [E, A], fretRange: [0, 12], 
    sequence: [38, 38, 38, 38, 38, 38, 43, 38], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    isEarTraining: true 
  },
  { 
    day: 24, 
    title: "Inspired: Psycho Killer", 
    description: "Simple root-octave alternative (using Fifth/Fourth to avoid octaves).", 
    title_fr: "Inspiré par : Psycho Killer",
    description_fr: "Alternative simple tonique-octave (utilisant quinte/quarte pour éviter les octaves).",
    title_es: "Inspirado en: Psycho Killer",
    description_es: "Alternativa simple tónica-octava (usando quinta/cuarta para evitar octavas).",
    strings: [E, A], fretRange: [0, 12], 
    sequence: [33, 33, 33, 33, 33, 35, 33, 33], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 25, 
    title: "Inspired: Hysteria", 
    description: "Fast scalar movement in minor.", 
    title_fr: "Inspiré par : Hysteria",
    description_fr: "Mouvement scalaire rapide en mineur.",
    title_es: "Inspirado en: Hysteria",
    description_es: "Movimiento de escala rápido en menor.",
    strings: [E, A], fretRange: [0, 12], 
    sequence: [28, 30, 31, 30, 28, 33, 31, 28], 
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5],
    isEarTraining: true 
  },
  { 
    day: 26, title: "Phrygian Tension", description: "The dark flat second.", 
    title_fr: "Tension Phrygienne", description_fr: "La seconde mineure sombre.",
    title_es: "Tensión Frigia", description_es: "La segunda menor oscura.",
    strings: [E], fretRange: [0, 12], sequence: [28, 29, 28, 29, 28, 29, 28, 29], durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], isEarTraining: true 
  },
  { 
    day: 27, title: "Melodic Minor Scale", description: "Mixed flavor.", 
    title_fr: "Gamme Mineure Mélodique", description_fr: "Saveur mélangée.",
    title_es: "Escala Menor Melódica", description_es: "Sabor mezclado.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 31, 34, 36, 34, 31, 28, 28], durations: [1, 1, 1, 1, 1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 28, title: "Diminished Loop", description: "Tension and release.", 
    title_fr: "Boucle Diminuée", description_fr: "Tension et résolution.",
    title_es: "Bucle Disminuido", description_es: "Tensión y resolución.",
    strings: [E, A, D], fretRange: [0, 12], sequence: [28, 31, 34, 37, 34, 31, 28, 28], durations: [1, 1, 1, 1, 1, 1, 1, 1], isEarTraining: true 
  },
  { 
    day: 29, title: "Inspired: Roundabout", description: "Classic prog-rock scalar intro.", 
    title_fr: "Inspiré par : Roundabout", description_fr: "Intro scalaire de rock progressif classique.",
    title_es: "Inspirado en: Roundabout", description_es: "Intro de escala de rock progresivo clásico.",
    strings: [E, A], fretRange: [0, 12], sequence: [28, 33, 35, 33, 31, 30, 28, 30], durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1], isEarTraining: true 
  },
  { 
    day: 30, title: "Inspired: Longview", description: "Shuffle-feel minor third riffs.", 
    title_fr: "Inspiré par : Longview", description_fr: "Riffs de tierce mineure au feeling shuffle.",
    title_es: "Inspirado en: Longview", description_es: "Riffs de tercera menor con aire de shuffle.",
    strings: [E, A, D], fretRange: [0, 12], sequence: [38, 41, 38, 36, 33, 36, 38, 41], durations: [0.66, 0.33, 0.66, 0.33, 0.66, 0.33, 0.66, 1], isEarTraining: true 
  },

  // --- ELITE: 9+ NOTES ---
  { 
    day: 31, 
    title: "Inspired: Higher Ground", 
    description: "Stevie Wonder style funk. Root-Octave-b7-5 sequence.", 
    title_fr: "Inspiré par : Higher Ground",
    description_fr: "Funk style Stevie Wonder. Séquence Tonique-Octave-b7-5.",
    title_es: "Inspirado en: Higher Ground",
    description_es: "Funk al estilo Stevie Wonder. Secuencia Tónica-Octava-b7-5.",
    strings: [E, A], fretRange: [0, 12], 
    sequence: [28, 40, 38, 35, 28, 40, 38, 35, 28], 
    durations: [0.25, 0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.25, 1],
    isEarTraining: true 
  },
  { 
    day: 32, 
    title: "Inspired: Bridge Under", 
    description: "Chordal arpeggio approach on bass.", 
    title_fr: "Inspiré par : Bridge Under",
    description_fr: "Approche d'arpège d'accord sur la basse.",
    title_es: "Inspirado en: Bridge Under",
    description_es: "Enfoque de arpegio de acorde en el bajo.",
    strings: [E, A, D], fretRange: [0, 12], 
    sequence: [36, 40, 38, 41, 40, 36, 40, 38, 41, 40], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 33, 
    title: "Inspired: Message Bottle", 
    description: "Wide Add9 arpeggio shapes.", 
    title_fr: "Inspiré par : Message Bottle",
    description_fr: "Formes d'arpèges Add9 très larges.",
    title_es: "Inspirado en: Message Bottle",
    description_es: "Formas de arpegio Add9 muy amplias.",
    strings: [E, A, D], fretRange: [0, 12], 
    sequence: [37, 44, 50, 33, 40, 46, 31, 38, 44], 
    durations: [1, 1, 1, 1, 1, 1, 1, 1, 2],
    isEarTraining: true 
  },
  { 
    day: 34, 
    title: "Inspired: Schism", 
    description: "Tool style alternating intervals.", 
    title_fr: "Inspiré par : Schism",
    description_fr: "Intervalles alternés style Tool.",
    title_es: "Inspirado en: Schism",
    description_es: "Intervalos alternos al estilo Tool.",
    strings: [D, G], fretRange: [0, 12], 
    sequence: [38, 45, 43, 38, 45, 43, 35, 42, 40], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 35, 
    title: "Inspired: Teen Town", 
    description: "Jaco style chromatic movements and jumps.", 
    title_fr: "Inspiré par : Teen Town",
    description_fr: "Mouvements chromatiques et sauts style Jaco.",
    title_es: "Inspirado en: Teen Town",
    description_es: "Movimientos cromáticos y saltos al estilo Jaco.",
    strings: [A, D, G], fretRange: [0, 12], 
    sequence: [33, 34, 35, 40, 39, 38, 43, 42, 41], 
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 1],
    isEarTraining: true 
  },
  { 
    day: 36, 
    title: "Inspired: Sir Duke", 
    description: "The legendary chromatic unison run.", 
    title_fr: "Inspiré par : Sir Duke",
    description_fr: "La légendaire descente chromatique à l'unisson.",
    title_es: "Inspirado en: Sir Duke",
    description_es: "La legendaria bajada cromática al unísono.",
    strings: [A, D, G], fretRange: [0, 12], 
    sequence: [33, 35, 36, 37, 40, 38, 33, 31, 28, 31], 
    durations: [0.25, 0.25, 0.25, 0.25, 0.5, 0.5, 0.25, 0.25, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 37, 
    title: "Inspired: YYZ", 
    description: "The tritone-heavy technical riff.", 
    title_fr: "Inspiré par : YYZ",
    description_fr: "Le riff technique chargé en tritons.",
    title_es: "Inspirado en: YYZ",
    description_es: "El riff técnico cargado de tritonos.",
    strings: [A, D], fretRange: [0, 12], 
    sequence: [35, 35, 41, 40, 39, 38, 35, 41, 40, 39, 38], 
    durations: [0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 1],
    isEarTraining: true 
  },
  { 
    day: 38, 
    title: "Inspired: The Chicken", 
    description: "Standard jazz-funk scalar theme.", 
    title_fr: "Inspiré par : The Chicken",
    description_fr: "Thème scalaire jazz-funk standard.",
    title_es: "Inspirado en: The Chicken",
    description_es: "Tema de escala jazz-funk estándar.",
    strings: [A, D, G], fretRange: [0, 12], 
    sequence: [33, 38, 40, 41, 42, 43, 38, 33, 31, 33], 
    durations: [1, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 39, 
    title: "Inspired: Master Puppets", 
    description: "Tight chromatic descents.", 
    title_fr: "Inspiré par : Master Puppets",
    description_fr: "Descentes chromatiques serrées.",
    title_es: "Inspirado en: Master Puppets",
    description_es: "Descensos cromáticos ajustados.",
    strings: [E], fretRange: [0, 12], 
    sequence: [40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 28], 
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 1],
    isEarTraining: true 
  },
  { 
    day: 40, 
    title: "Inspired: Dark Necessity", 
    description: "Modern slap-style melodic sequence.", 
    title_fr: "Inspiré par : Dark Necessity",
    description_fr: "Séquence mélodique moderne style slap.",
    title_es: "Inspirado en: Dark Necessity",
    description_es: "Secuencia melódica moderna al estilo slap.",
    strings: [E, A, D, G], fretRange: [0, 12], 
    sequence: [28, 40, 38, 36, 35, 40, 38, 36, 35, 31, 28], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 41, 
    title: "Inspired: Tracy Portrait", 
    description: "Spaced melodic intervals.", 
    title_fr: "Inspiré par : Tracy Portrait",
    description_fr: "Intervalles mélodiques espacés.",
    title_es: "Inspirado en: Tracy Portrait",
    description_es: "Intervalos melódicos espaciados.",
    strings: [E, A, D, G], fretRange: [0, 12], 
    sequence: [43, 38, 33, 28, 43, 38, 33, 28, 43, 38, 33, 28], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 42, 
    title: "Elite Pentatonic Run", 
    description: "Rapid minor pentatonic descent.", 
    title_fr: "Elite : Course Pentatonique",
    description_fr: "Descente rapide en mineur pentatonique.",
    title_es: "Elite: Carrera Pentatónica",
    description_es: "Descenso rápido en menor pentatónico.",
    strings: [E, A, D, G], fretRange: [0, 12], 
    sequence: [40, 38, 35, 33, 31, 28, 31, 33, 35, 38, 40, 43], 
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 1],
    isEarTraining: true 
  },
  { 
    day: 43, 
    title: "Lydian Elite Theme", 
    description: "Extended sharp-fourth melodic line.", 
    title_fr: "Thème Elite Lydien",
    description_fr: "Ligne mélodique étendue avec quarte augmentée.",
    title_es: "Tema Elite Lidio",
    description_es: "Línea melódica extendida con cuarta aumentada.",
    strings: [E, A, D, G], fretRange: [0, 12], 
    sequence: [28, 30, 32, 34, 35, 37, 39, 40, 42, 44, 46, 47, 48], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  },
  { 
    day: 44, 
    title: "The Octave Ghost", 
    description: "Fast octave alternations with scale steps.", 
    title_fr: "L'Octave Fantôme",
    description_fr: "Alternances rapides d'octaves avec degrés de la gamme.",
    title_es: "La Octava Fantasma",
    description_es: "Alternancias rápidas de octavas con pasos de escala.",
    strings: [E, A, D, G], fretRange: [0, 12], 
    sequence: [28, 40, 30, 42, 32, 44, 33, 45, 35, 47, 37, 49, 38, 50], 
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 1],
    isEarTraining: true 
  },
  { 
    day: 45, 
    title: "Ultra Marathon Boss", 
    description: "The ultimate relative pitch and memory test.", 
    title_fr: "Ultra Marathon Boss",
    description_fr: "L'ultime test de l'oreille relative et de la mémoire.",
    title_es: "Ultra Maratón Boss",
    description_es: "La prueba definitiva de oído relativo y memoria.",
    strings: [E, A, D, G], fretRange: [0, 12], 
    sequence: [28, 31, 33, 34, 35, 38, 40, 43, 40, 38, 35, 34, 33, 31, 28, 23, 28, 33, 35], 
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 2],
    isEarTraining: true 
  },
  { 
    day: 46, 
    title: "Inspired: Plumbing Hero", 
    description: "The legendary platformer theme. A masterclass in rhythmic jumps and catchy intervals.", 
    title_fr: "Inspiré par : Le Héros Plombier",
    description_fr: "Le thème légendaire de plateforme. Une masterclass de sauts rythmiques et d'intervalles mémorisables.",
    title_es: "Inspirado en: El Héroe Fontanero",
    description_es: "El legendario tema de plataformas. Una clase magistral de saltos rítmicos e intervalos pegadizos.",
    strings: [E, A, D, G], fretRange: [0, 12], 
    sequence: [40, 40, 40, 36, 40, 43, 31, 36, 31, 28, 33, 35, 34, 33, 31, 40, 43, 45, 41, 43, 40, 36, 38, 35], 
    durations: [0.25, 0.5, 0.5, 0.25, 0.5, 1, 1, 0.75, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.33, 0.33, 0.33, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    isEarTraining: true 
  }
];

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
    description_es: 'Domina las formas essentielles en todo el mástil.',
    days: PENTATONIC_PROGRAM 
  },
  {
    id: 'eartraining',
    name: 'Ear Training',
    description: 'Train your ear to recognize intervals and melodies without visual aid.',
    name_fr: 'L\'Oreille',
    description_fr: 'Entraînez votre oreille à reconnaître les intervalles et mélodies sans aide visuelle.',
    name_es: 'El Oído',
    description_es: 'Entrena tu oído para reconocer intervalos y melodías sin ayuda visual.',
    days: EAR_TRAINING_TASKS
  }
];