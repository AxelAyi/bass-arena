import type { DayTask } from './program30days';

export interface PentatonicTaskConfig {
  rootName: string;
  rootMidi: number;
  quality: 'major' | 'minor';
  shapeNumber: 1 | 2 | 3 | 4 | 5;
  shapeName: string;
  shapeName_fr: string;
  shapeName_es: string;
  relativePairNote: string;
  relativePairQuality: 'major' | 'minor';
  theoryTip: string;
  theoryTip_fr: string;
  theoryTip_es: string;
  musicalValue: string;
  musicalValue_fr: string;
  musicalValue_es: string;
}

const G = 0, D = 1, A = 2, E = 3;

interface KeySpec {
  rootName: string;
  rootMidi: number;
  anchor: 'E' | 'A';
  fretRange: [number, number];
  rootFretLabel: string;
  rootFretLabel_fr: string;
  rootFretLabel_es: string;
  relativeNote: string;
}

const MAJOR_KEYS: KeySpec[] = [
  {
    rootName: 'G',
    rootMidi: 31,
    anchor: 'E',
    fretRange: [2, 5],
    rootFretLabel: 'E string, fret 3',
    rootFretLabel_fr: 'corde E, frette 3',
    rootFretLabel_es: 'cuerda E, traste 3',
    relativeNote: 'E',
  },
  {
    rootName: 'A',
    rootMidi: 33,
    anchor: 'E',
    fretRange: [4, 7],
    rootFretLabel: 'E string, fret 5',
    rootFretLabel_fr: 'corde E, frette 5',
    rootFretLabel_es: 'cuerda E, traste 5',
    relativeNote: 'F#',
  },
  {
    rootName: 'C',
    rootMidi: 36,
    anchor: 'A',
    fretRange: [2, 5],
    rootFretLabel: 'A string, fret 3',
    rootFretLabel_fr: 'corde A, frette 3',
    rootFretLabel_es: 'cuerda A, traste 3',
    relativeNote: 'A',
  },
  {
    rootName: 'D',
    rootMidi: 38,
    anchor: 'A',
    fretRange: [4, 7],
    rootFretLabel: 'A string, fret 5',
    rootFretLabel_fr: 'corde A, frette 5',
    rootFretLabel_es: 'cuerda A, traste 5',
    relativeNote: 'B',
  },
];

const MINOR_KEYS: KeySpec[] = [
  {
    rootName: 'A',
    rootMidi: 33,
    anchor: 'E',
    fretRange: [5, 8],
    rootFretLabel: 'E string, fret 5',
    rootFretLabel_fr: 'corde E, frette 5',
    rootFretLabel_es: 'cuerda E, traste 5',
    relativeNote: 'C',
  },
  {
    rootName: 'G',
    rootMidi: 31,
    anchor: 'E',
    fretRange: [3, 6],
    rootFretLabel: 'E string, fret 3',
    rootFretLabel_fr: 'corde E, frette 3',
    rootFretLabel_es: 'cuerda E, traste 3',
    relativeNote: 'A#',
  },
  {
    rootName: 'D',
    rootMidi: 38,
    anchor: 'A',
    fretRange: [5, 8],
    rootFretLabel: 'A string, fret 5',
    rootFretLabel_fr: 'corde A, frette 5',
    rootFretLabel_es: 'cuerda A, traste 5',
    relativeNote: 'F',
  },
  {
    rootName: 'E',
    rootMidi: 40,
    anchor: 'A',
    fretRange: [7, 10],
    rootFretLabel: 'A string, fret 7',
    rootFretLabel_fr: 'corde A, frette 7',
    rootFretLabel_es: 'cuerda A, traste 7',
    relativeNote: 'G',
  },
];

function buildSequence(quality: 'major' | 'minor', shapeNumber: 1 | 2 | 3 | 4 | 5, key: KeySpec): number[] {
  const r = key.rootMidi;
  if (quality === 'major') {
    // Intervals: 1(0), 2(2), 3(4), 5(7), 6(9), 1(12), 2(14), 3(16) | low 6(-3), low 5(-5)
    switch (shapeNumber) {
      case 1:
        // Classic 1-octave closed box (2 notes per string)
        return [0, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0].map((v) => r + v);
      case 2:
        // Extended box staying strictly inside the same 4-fret closed window
        return key.anchor === 'E'
          ? [0, 2, 4, 7, 9, 12, 14, 12, 9, 7, 4, 2, 0].map((v) => r + v)
          : [0, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0, -3, 0].map((v) => r + v);
      case 3:
        // Motown / Country bass groove skips (1-3-5-6-1)
        return [0, 4, 7, 9, 12, 9, 7, 4, 0].map((v) => r + v);
      case 4:
        // Musical 3-note melodic sequences across strings
        return [0, 2, 4, 2, 4, 7, 4, 7, 9, 7, 9, 12].map((v) => r + v);
      case 5:
        // Full 4-string closed box mastery
        return key.anchor === 'E'
          ? [0, 4, 7, 9, 12, 14, 16, 14, 12, 9, 7, 4, 0].map((v) => r + v)
          : [0, -3, -5, -3, 0, 2, 4, 7, 9, 12, 9, 7, 0].map((v) => r + v);
    }
  } else {
    // Minor Pentatonic: 1(0), b3(3), 4(5), 5(7), b7(10), 1(12), b3(15), 4(17) | low b7(-2), low 5(-5)
    switch (shapeNumber) {
      case 1:
        // The iconic closed Minor Pentatonic box (1-b3-4-5-b7-1)
        return [0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0].map((v) => r + v);
      case 2:
        // Extended closed box staying inside the exact 4-fret window
        return key.anchor === 'E'
          ? [0, 3, 5, 7, 10, 12, 15, 12, 10, 7, 5, 3, 0].map((v) => r + v)
          : [0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0, -2, 0].map((v) => r + v);
      case 3:
        // Funk & rock groove intervals (1-b3-5-b7-1)
        return [0, 3, 7, 10, 12, 10, 7, 3, 0].map((v) => r + v);
      case 4:
        // Rock/blues 3-note melodic fills
        return [0, 3, 5, 3, 5, 7, 5, 7, 10, 7, 10, 12].map((v) => r + v);
      case 5:
        // Full 4-string closed box fluency
        return key.anchor === 'E'
          ? [0, 3, 5, 7, 10, 12, 15, 17, 15, 12, 10, 7, 0].map((v) => r + v)
          : [0, -2, -5, -2, 0, 3, 5, 7, 10, 12, 10, 7, 0].map((v) => r + v);
    }
  }
}

function getShapeCopy(quality: 'major' | 'minor', shapeNumber: 1 | 2 | 3 | 4 | 5, key: KeySpec) {
  const isMajor = quality === 'major';
  const relQuality = isMajor ? 'Minor' : 'Major';
  const relQualityFr = isMajor ? 'Mineure' : 'Majeure';
  const relQualityEs = isMajor ? 'Menor' : 'Mayor';

  const shapeNames: Record<1 | 2 | 3 | 4 | 5, { en: string; fr: string; es: string }> = {
    1: { en: 'Classic Box', fr: 'Boîte Classique', es: 'Caja Clásica' },
    2: { en: 'Extended Box', fr: 'Boîte Étendue', es: 'Caja Extendida' },
    3: { en: 'Groove Skips', fr: 'Sauts de Groove', es: 'Saltos de Groove' },
    4: { en: '3-Note Melodic Runs', fr: 'Groupes de 3 Notes', es: 'Frases de 3 Notas' },
    5: { en: 'Full 4-String Box', fr: 'Boîte 4 Cordes Complète', es: 'Caja Completa 4 Cuerdas' },
  };

  if (isMajor) {
    const tips: Record<1 | 2 | 3 | 4 | 5, { en: string; fr: string; es: string; valEn: string; valFr: string; valEs: string }> = {
      1: {
        en: `The Major Pentatonic (1–2–3–5–6) removes the 4th and 7th from the Major scale so there are ZERO clashing half-steps! Start with your middle finger on ${key.rootName} (${key.rootFretLabel}) — notice how every note stays cleanly inside frets ${key.fretRange[0]}–${key.fretRange[1]} with no open strings.`,
        fr: `La Pentatonique Majeure (1–2–3–5–6) retire la 4te et la 7e de la gamme Majeure pour éliminer toute dissonance ! Démarrez majeur sur ${key.rootName} (${key.rootFretLabel_fr}) : tout reste dans les frettes ${key.fretRange[0]}–${key.fretRange[1]} sans corde à vide.`,
        es: `La Pentatónica Mayor (1–2–3–5–6) quita la 4ª y la 7ª de la escala Mayor para evitar disonancias. Empieza con el dedo medio en ${key.rootName} (${key.rootFretLabel_es}): todo queda en los trastes ${key.fretRange[0]}–${key.fretRange[1]} sin cuerdas al aire.`,
        valEn: `Because this closed 4-fret shape uses no open strings, you can slide this exact fingering anywhere on the neck to play in all 12 major keys!`,
        valFr: `Comme cette boîte fermée n'utilise aucune corde à vide, vous pouvez glisser exactement ce doigté partout sur le manche pour jouer dans les 12 tonalités !`,
        valEs: `Como esta caja cerrada no usa cuerdas al aire, puedes deslizar exactamente la misma digitación por todo el mástil para tocar en las 12 tonalidades.`,
      },
      2: {
        en: `Now expand your ${key.rootName} Major box without moving your hand! Reaching the extra neighboring pentatonic note inside frets ${key.fretRange[0]}–${key.fretRange[1]} connects all 4 strings under one hand position.`,
        fr: `Élargissez maintenant votre boîte de ${key.rootName} Majeur sans déplacer la main ! Ajouter la note voisine dans les frettes ${key.fretRange[0]}–${key.fretRange[1]} relie vos 4 cordes dans une seule position.`,
        es: `Ahora amplía tu caja de ${key.rootName} Mayor sin mover la mano. Añadir la nota vecina dentro de los trastes ${key.fretRange[0]}–${key.fretRange[1]} conecta tus 4 cuerdas en una sola posición.`,
        valEn: `Real basslines rarely stop neatly at the octave — knowing the neighbor notes above and below your root lets your grooves flow seamlessly.`,
        valFr: `Les vraies lignes de basse ne s'arrêtent pas pile à l'octave : connaître les notes voisines au-dessus et en dessous fluidifie instantanément vos grooves.`,
        valEs: `Las líneas de bajo reales no se detienen en la octava: dominar las notas vecinas arriba y abajo hace que tus grooves fluyan sin cortes.`,
      },
      3: {
        en: `Skip the 2nd and jump straight through the juicy chord tones: 1 → 3 → 5 → 6 → 1! Fun fact: ${key.rootName} Major Pentatonic shares the exact same notes as ${key.relativeNote} ${relQuality} Pentatonic.`,
        fr: `Sautez la 2de et passez directement sur les notes d'accord : 1 → 3 → 5 → 6 → 1 ! Astuce : ${key.rootName} Pentatonique Majeure utilise exactement les mêmes notes que ${key.relativeNote} Pentatonique ${relQualityFr}.`,
        es: `Salta la 2ª y ve directo a las notas clave del acorde: 1 → 3 → 5 → 6 → 1. Dato clave: ${key.rootName} Pentatónica Mayor usa las mismas notas que ${key.relativeNote} Pentatónica ${relQualityEs}.`,
        valEn: `This 1–3–5–6–1 contour is the backbone of Motown, soul, country, and pop basslines — you will hear it in classic hits immediately.`,
        valFr: `Ce contour 1–3–5–6–1 est la colonne vertébrale de la Motown, de la soul, de la country et de la pop — un classique absolu à la basse.`,
        valEs: `Este contorno 1–3–5–6–1 es la columna vertebral del Motown, soul, country y pop — lo reconocerás al instante en cientos de clásicos.`,
      },
      4: {
        en: `Break out of robotic up-and-down scales! This drill groups the ${key.rootName} Major Pentatonic into overlapping 3-note phrases (1-2-3, 2-3-5, 3-5-6, 5-6-1) inside frets ${key.fretRange[0]}–${key.fretRange[1]}.`,
        fr: `Sortez des gammes mécaniques ! Cet exercice regroupe la pentatonique de ${key.rootName} Majeur en motifs de 3 notes qui se chevauchent (1-2-3, 2-3-5, 3-5-6, 5-6-1) dans les frettes ${key.fretRange[0]}–${key.fretRange[1]}.`,
        es: `Sal de las escalas mecánicas: este ejercicio agrupa ${key.rootName} Pentatónica Mayor en frases encadenadas de 3 notas (1-2-3, 2-3-5, 3-5-6, 5-6-1) en los trastes ${key.fretRange[0]}–${key.fretRange[1]}.`,
        valEn: `Melodic 3-note sequences train your fingers to cross strings cleanly and turn a simple scale box into instant bass fills and solos.`,
        valFr: `Les séquences de 3 notes entraînent vos changements de cordes et transforment une simple boîte en vrais breaks et solos de basse.`,
        valEs: `Las secuencias de 3 notas entrenan tus cruces de cuerda y convierten una simple caja en rellenos y solos musicales al instante.`,
      },
      5: {
        en: `Final boss for ${key.rootName} Major! Use the ENTIRE 4-string closed box across frets ${key.fretRange[0]}–${key.fretRange[1]} without ever lifting out of position or touching an open string.`,
        fr: `Défi complet en ${key.rootName} Majeur ! Exploitez toute la boîte fermée sur 4 cordes (frettes ${key.fretRange[0]}–${key.fretRange[1]}) sans jamais quitter la position ni jouer de corde à vide.`,
        es: `Desafío completo en ${key.rootName} Mayor: recorre toda la caja cerrada de 4 cuerdas (trastes ${key.fretRange[0]}–${key.fretRange[1]}) sin salir de posición ni usar cuerdas al aire.`,
        valEn: `Mastering all 4 strings in one locked hand position lets you jump effortlessly between deep root grooves and bright high-register fills.`,
        valFr: `Maîtriser les 4 cordes dans une seule position verrouillée permet de passer sans effort d'un groove grave à un fill lumineux dans les aigus.`,
        valEs: `Dominar las 4 cuerdas en una sola posición te permite saltar sin esfuerzo entre grooves graves y adornos brillantes en el registro agudo.`,
      },
    };
    return {
      shapeName: shapeNames[shapeNumber].en,
      shapeName_fr: shapeNames[shapeNumber].fr,
      shapeName_es: shapeNames[shapeNumber].es,
      theoryTip: tips[shapeNumber].en,
      theoryTip_fr: tips[shapeNumber].fr,
      theoryTip_es: tips[shapeNumber].es,
      musicalValue: tips[shapeNumber].valEn,
      musicalValue_fr: tips[shapeNumber].valFr,
      musicalValue_es: tips[shapeNumber].valEs,
    };
  } else {
    const tips: Record<1 | 2 | 3 | 4 | 5, { en: string; fr: string; es: string; valEn: string; valFr: string; valEs: string }> = {
      1: {
        en: `Meet the #1 bass box in rock, blues, and funk: ${key.rootName} Minor Pentatonic (1–b3–4–5–b7)! Plant your index finger on ${key.rootName} (${key.rootFretLabel}) — your index and pinky/ring fingers handle the entire frets ${key.fretRange[0]}–${key.fretRange[1]} box cleanly.`,
        fr: `Voici la boîte n°1 du rock, du blues et du funk : ${key.rootName} Pentatonique Mineure (1–b3–4–5–b7) ! Posez votre index sur ${key.rootName} (${key.rootFretLabel_fr}) : tout le motif tient dans les frettes ${key.fretRange[0]}–${key.fretRange[1]}.`,
        es: `Conoce la caja n.º 1 del rock, blues y funk: ${key.rootName} Pentatónica Menor (1–b3–4–5–b7). Coloca tu índice en ${key.rootName} (${key.rootFretLabel_es}): toda la forma cabe limpiamente en los trastes ${key.fretRange[0]}–${key.fretRange[1]}.`,
        valEn: `This single closed shape unlocks thousands of rock, hip-hop, blues, and funk basslines — and because there are no open strings, you can slide it to any key!`,
        valFr: `Cette unique forme fermée ouvre la porte à des milliers de lignes rock, hip-hop, blues et funk — et sans corde à vide, elle se transpose dans toutes les tonalités !`,
        valEs: `Esta sola forma cerrada desbloquea miles de líneas de rock, hip-hop, blues y funk, ¡y sin cuerdas al aire puedes moverla a cualquier tonalidad!`,
      },
      2: {
        en: `Extend your ${key.rootName} Minor box by adding the next pentatonic neighbor right inside frets ${key.fretRange[0]}–${key.fretRange[1]}. Notice how your index finger stays anchored at fret ${key.fretRange[0]}!`,
        fr: `Étendez votre boîte de ${key.rootName} Mineur en ajoutant la note voisine dans les frettes ${key.fretRange[0]}–${key.fretRange[1]}. Votre index reste bien ancré à la frette ${key.fretRange[0]} !`,
        es: `Extiende tu caja de ${key.rootName} Menor añadiendo la nota vecina dentro de los trastes ${key.fretRange[0]}–${key.fretRange[1]}. ¡Tu dedo índice se mantiene anclado en el traste ${key.fretRange[0]}!`,
        valEn: `Reaching that extra b3 or low b7 without shifting hand position makes your grooves sound tight, deep, and effortless.`,
        valFr: `Atteindre cette b3 ou b7 grave sans bouger la main rend vos grooves beaucoup plus solides, profonds et fluides.`,
        valEs: `Alcanzar esa b3 aguda o b7 grave sin desplazar la mano hace que tus grooves suenen compactos y profesionales.`,
      },
      3: {
        en: `Drop the 4th and lock onto the punchiest bass tones: Root (1), Minor 3rd (b3), 5th (5), and Flat-7th (b7)! Shortcut: ${key.rootName} Minor Pentatonic shares the exact same notes as ${key.relativeNote} ${relQuality} Pentatonic.`,
        fr: `Sautez la 4te pour cibler les notes les plus percutantes : Tonique (1), b3, 5te et b7 ! Raccourci : ${key.rootName} Pentatonique Mineure partage exactement les mêmes notes que ${key.relativeNote} Pentatonique ${relQualityFr}.`,
        es: `Omite la 4ª y apunta a las notas con más pegada: Tónica (1), b3, 5ª y b7. Atajo: ${key.rootName} Pentatónica Menor comparte las mismas notas que ${key.relativeNote} Pentatónica ${relQualityEs}.`,
        valEn: `The 1–b3–5–b7 arpeggio is a minor 7th chord! Playing it inside the pentatonic box gives you instant funk, R&B, and jazz pocket.`,
        valFr: `L'arpège 1–b3–5–b7 forme un accord mineur 7 ! Le maîtriser dans cette boîte donne instantanément du groove funk, R&B et jazz.`,
        valEs: `El arpegio 1–b3–5–b7 forma un acorde menor 7: dominarlo dentro de la caja te da groove inmediato de funk, R&B y jazz.`,
      },
      4: {
        en: `Turn the ${key.rootName} Minor box into real music with climbing 3-note phrases (1-b3-4, b3-4-5, 4-5-b7, 5-b7-1) locked inside frets ${key.fretRange[0]}–${key.fretRange[1]}.`,
        fr: `Transformez la boîte de ${key.rootName} Mineur en vraie musique avec des montées de 3 notes (1-b3-4, b3-4-5, 4-5-b7, 5-b7-1) verrouillées sur les frettes ${key.fretRange[0]}–${key.fretRange[1]}.`,
        es: `Convierte la caja de ${key.rootName} Menor en música real con grupos ascendentes de 3 notas (1-b3-4, b3-4-5, 4-5-b7, 5-b7-1) en los trastes ${key.fretRange[0]}–${key.fretRange[1]}.`,
        valEn: `These exact 3-note pentatonic licks are used everywhere in classic rock and funk bass fills between song sections.`,
        valFr: `Ces exacts plans pentatoniques de 3 notes servent partout pour créer des breaks rock et funk entre deux parties d'un morceau.`,
        valEs: `Estos mismos giros de 3 notas se usan en todo el rock y el funk para conectar secciones con rellenos memorables.`,
      },
      5: {
        en: `Complete 4-string mastery in ${key.rootName} Minor! Sweep across every string inside the frets ${key.fretRange[0]}–${key.fretRange[1]} closed box with zero open strings.`,
        fr: `Maîtrise totale des 4 cordes en ${key.rootName} Mineur ! Parcourez toute la boîte fermée (frettes ${key.fretRange[0]}–${key.fretRange[1]}) sans aucune corde à vide.`,
        es: `Dominio total de las 4 cuerdas en ${key.rootName} Menor: recorre toda la caja cerrada (trastes ${key.fretRange[0]}–${key.fretRange[1]}) sin ninguna cuerda al aire.`,
        valEn: `Owning the full 4-string minor pentatonic box gives you total freedom to jam, solo, and lock in with any drummer on the spot.`,
        valFr: `Posséder toute la boîte mineure sur 4 cordes vous donne une liberté totale pour jammer et improviser avec n'importe quel batteur.`,
        valEs: `Dominar la caja menor completa en 4 cuerdas te da libertad total para improvisar y conectar al instante con cualquier batería.`,
      },
    };
    return {
      shapeName: shapeNames[shapeNumber].en,
      shapeName_fr: shapeNames[shapeNumber].fr,
      shapeName_es: shapeNames[shapeNumber].es,
      theoryTip: tips[shapeNumber].en,
      theoryTip_fr: tips[shapeNumber].fr,
      theoryTip_es: tips[shapeNumber].es,
      musicalValue: tips[shapeNumber].valEn,
      musicalValue_fr: tips[shapeNumber].valFr,
      musicalValue_es: tips[shapeNumber].valEs,
    };
  }
}

function buildPentatonicTasks(): DayTask[] {
  const tasks: DayTask[] = [];
  let day = 1;

  const appendBlock = (keys: KeySpec[], quality: 'major' | 'minor') => {
    const qEn = quality === 'major' ? 'Major' : 'Minor';
    const qFr = quality === 'major' ? 'Majeure' : 'Mineure';
    const qEs = quality === 'major' ? 'Mayor' : 'Menor';
    const relQual: 'major' | 'minor' = quality === 'major' ? 'minor' : 'major';

    for (const key of keys) {
      for (let s = 1; s <= 5; s++) {
        const shapeNum = s as 1 | 2 | 3 | 4 | 5;
        const copy = getShapeCopy(quality, shapeNum, key);
        const sequence = buildSequence(quality, shapeNum, key);

        tasks.push({
          day,
          title: `${key.rootName} ${qEn} Pentatonic — ${copy.shapeName}`,
          description: `Closed box (frets ${key.fretRange[0]}–${key.fretRange[1]}, no open strings). Shape ${shapeNum} of 5.`,
          title_fr: `${key.rootName} Pentatonique ${qFr} — ${copy.shapeName_fr}`,
          description_fr: `Boîte fermée (frettes ${key.fretRange[0]}–${key.fretRange[1]}, sans corde à vide). Forme ${shapeNum} sur 5.`,
          title_es: `${key.rootName} Pentatónica ${qEs} — ${copy.shapeName_es}`,
          description_es: `Caja cerrada (trastes ${key.fretRange[0]}–${key.fretRange[1]}, sin cuerdas al aire). Forma ${shapeNum} de 5.`,
          strings: [G, D, A, E],
          fretRange: key.fretRange,
          sequence,
          pentatonicConfig: {
            rootName: key.rootName,
            rootMidi: key.rootMidi,
            quality,
            shapeNumber: shapeNum,
            shapeName: copy.shapeName,
            shapeName_fr: copy.shapeName_fr,
            shapeName_es: copy.shapeName_es,
            relativePairNote: key.relativeNote,
            relativePairQuality: relQual,
            theoryTip: copy.theoryTip,
            theoryTip_fr: copy.theoryTip_fr,
            theoryTip_es: copy.theoryTip_es,
            musicalValue: copy.musicalValue,
            musicalValue_fr: copy.musicalValue_fr,
            musicalValue_es: copy.musicalValue_es,
          },
        });
        day++;
      }
    }
  };

  appendBlock(MAJOR_KEYS, 'major'); // Days 1-20
  appendBlock(MINOR_KEYS, 'minor'); // Days 21-40

  return tasks;
}

export const PENTATONIC_PROGRAM: DayTask[] = buildPentatonicTasks();
