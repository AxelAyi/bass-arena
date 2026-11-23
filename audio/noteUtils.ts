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

const ENGLISH_TO_LATIN_BASE: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
};

const MUSICAL_FOLLOW_WORDS =
  /^\s+(?:major|minor|natural|pentatonic|ionian|dorian|phrygian|lydian|mixolydian|aeolian|locrian|string|strings|note|notes|root|chord|scale|key|box|flat|sharp|octave|majeur|majeure|mineur|mineure|naturel|naturelle|pentatonique|ionien|dorien|phrygien|lydien|mixolydien|éolien|locrien|corde|cordes|tonique|gamme|accord|bémol|dièse|mayor|menor|pentatónica|jónico|dórico|frigio|lidio|mixolidio|eólico|locrio|cuerda|cuerdas|tónica|escala|acorde|bemol|sostenido)(?![\p{L}\p{M}])/iu;

const ENGLISH_NOTE_TOKEN_REGEX =
  /(?<![\p{L}\p{M}])([A-G])([#b♯♭])?(maj7#11|maj9|maj7|maj|min7|min|m7\(b9\)|m7\(b6\)|m7b5|m7b9|m7|dim7|dim|aug|sus2|sus4|sus|add9|13|11|9|7|[0-8])?(?![\p{L}\p{M}\d])/gu;

export function translateNoteName(englishName: string, naming: 'english' | 'latin'): string {
  if (naming === 'english') return englishName;
  const idx = NOTE_NAMES_ENGLISH.indexOf(englishName);
  if (idx !== -1) return NOTE_NAMES_LATIN[idx];
  const match = /^([A-G])([#b♯♭]?)$/.exec(englishName);
  if (!match) return englishName;
  return `${ENGLISH_TO_LATIN_BASE[match[1]]}${match[2]}`;
}

export function translateTextWithNotes(text: string, naming: 'english' | 'latin'): string {
  if (naming === 'english' || !text) return text;

  const trimmed = text.trim();

  return text.replace(
    ENGLISH_NOTE_TOKEN_REGEX,
    (
      match: string,
      letter: string,
      accidental: string = '',
      suffix: string = '',
      offset: number,
      fullText: string
    ) => {
      const latinBase = ENGLISH_TO_LATIN_BASE[letter];
      if (!latinBase) return match;

      const before = fullText.slice(0, offset);
      const after = fullText.slice(offset + match.length);

      // Explicit accidental (F#, Bb), chord symbol (Cmaj7, Dm7, G7), or octave note (A1, E2)
      if (accidental || suffix) {
        return `${latinBase}${accidental}${suffix}`;
      }

      // Never replace single letters that are part of contractions/elisions (C'est, D'une, D'abord, l'...)
      if (/^['’][\p{L}\p{M}]/u.test(after) || /[\p{L}\p{M}]['’]$/u.test(before)) {
        return match;
      }

      // Never replace "B" inside "R&B"
      if (letter === 'B' && /(?:^|[^\p{L}\p{M}])R\s*&\s*$/u.test(before)) {
        return match;
      }

      // Never replace a person's middle/last initial (e.g., "Axel A.")
      if (/^\./.test(after) && /\p{Lu}\p{Ll}+\s+$/u.test(before)) {
        return match;
      }

      const isSentenceStart = /(?:^|[.!?¡¿:"«»“”]\s*)$/.test(before);

      // Extra context guard for "A" (English article / Spanish preposition)
      if (letter === 'A') {
        const isStandalone = trimmed === 'A';
        const followedByMusicalWord = MUSICAL_FOLLOW_WORDS.test(after);
        const insideParens = /\(\s*$/.test(before) && /^\s*\)/.test(after);
        const hasMusicalSeparator =
          /[,&/\-–—→]\s*$/.test(before) || /^\s*[,)&/\]\-–—→★:(]/.test(after);
        const midSentencePreposition =
          !isSentenceStart &&
          /\b(?:on|in|to|from|of|the|get|for|than|below|above|around|with|or|and|hit|play|touch|sur|en|de|du|vers|par|que|le|la|el|y|o|sobre|hasta|desde|con)\s+$/i.test(
            before
          );

        if (
          !isStandalone &&
          !followedByMusicalWord &&
          !insideParens &&
          !hasMusicalSeparator &&
          !midSentencePreposition
        ) {
          return match;
        }
      }

      // Extra guard for Spanish conjunction "E" before words starting with i/hi (e.g., "E improvisa...")
      if (letter === 'E' && isSentenceStart && /^\s+h?[ií]\p{L}/iu.test(after)) {
        return match;
      }

      return latinBase;
    }
  );
}

export function frequencyToNote(freq: number): NoteInfo {
  const midi = 12 * (Math.log2(freq / 440)) + 69;
  const roundedMidi = Math.round(midi);
  const cents = Math.floor((midi - roundedMidi) * 100);
  const noteName = NOTE_NAMES_ENGLISH[roundedMidi % 12];
  const octave = Math.floor(roundedMidi / 12) - 1;
  return { frequency: freq, midi: roundedMidi, noteName, octave, cents };
}

export interface BassTabPosition {
  string: number; // 1-indexed for MusicXML (1 = G, 2 = D, 3 = A, 4 = E, 5 = B)
  stringIndex: number; // 0-indexed matching BASS_STRINGS (0 = G, 1 = D, 2 = A, 3 = E, 4 = B)
  fret: number;
}

function getBassFretForMidi(
  midi: number,
  isFiveString: boolean,
  preferNoOpenStrings: boolean = false
): BassTabPosition {
  const tunings = isFiveString ? [43, 38, 33, 28, 23] : [43, 38, 33, 28];
  if (preferNoOpenStrings) {
    for (let i = 0; i < tunings.length; i++) {
      const fret = midi - tunings[i];
      if (fret >= 1 && fret <= 20) {
        return { string: i + 1, stringIndex: i, fret };
      }
    }
  }
  for (let i = 0; i < tunings.length; i++) {
    const fret = midi - tunings[i];
    if (fret >= 0 && fret <= 22) {
      return { string: i + 1, stringIndex: i, fret };
    }
  }
  return {
    string: tunings.length,
    stringIndex: tunings.length - 1,
    fret: Math.max(0, midi - tunings[tunings.length - 1]),
  };
}

/**
 * Computes comfortable, compact bass TAB positions for a sequence of MIDI notes.
 * When preferNoOpenStrings is true, selects a cohesive closed-position fret box
 * and avoids open strings (fret 0) unless a pitch cannot be fretted anywhere else.
 */
export function getBassPositionsForSequence(
  midiNotes: number[],
  isFiveString: boolean = false,
  preferNoOpenStrings: boolean = true
): BassTabPosition[] {
  if (midiNotes.length === 0) return [];
  if (!preferNoOpenStrings) {
    return midiNotes.map((m) => getBassFretForMidi(m, isFiveString, false));
  }

  const tunings = isFiveString ? [43, 38, 33, 28, 23] : [43, 38, 33, 28];
  const candidatesPerNote: BassTabPosition[][] = midiNotes.map((midi) => {
    const cands: BassTabPosition[] = [];
    for (let i = 0; i < tunings.length; i++) {
      const fret = midi - tunings[i];
      if (fret >= 0 && fret <= 20) {
        cands.push({ string: i + 1, stringIndex: i, fret });
      }
    }
    if (cands.length === 0) {
      cands.push(getBassFretForMidi(midi, isFiveString, true));
    }
    return cands;
  });

  let bestTotalCost = Infinity;
  let bestPath: BassTabPosition[] = [];

  for (let windowStart = 1; windowStart <= 12; windowStart++) {
    const n = candidatesPerNote.length;
    const dp: number[][] = [];
    const parent: number[][] = [];

    const noteCost = (pos: BassTabPosition): number => {
      if (pos.fret === 0) return 1000;
      let cost = pos.fret * 0.08;
      if (pos.fret >= windowStart && pos.fret <= windowStart + 3) {
        cost += 0;
      } else if (pos.fret === windowStart + 4) {
        cost += 3;
      } else {
        const dist =
          pos.fret < windowStart ? windowStart - pos.fret : pos.fret - (windowStart + 4);
        cost += 14 * dist;
      }
      // Slight preference against muddy low-B string when an equivalent E-string box exists
      if (isFiveString && pos.stringIndex === 4) {
        cost += 1.5;
      }
      return cost;
    };

    dp[0] = candidatesPerNote[0].map((c) => noteCost(c));
    parent[0] = candidatesPerNote[0].map(() => -1);

    for (let t = 1; t < n; t++) {
      const currCands = candidatesPerNote[t];
      const prevCands = candidatesPerNote[t - 1];
      dp[t] = new Array(currCands.length).fill(Infinity);
      parent[t] = new Array(currCands.length).fill(0);

      for (let j = 0; j < currCands.length; j++) {
        const curr = currCands[j];
        const base = noteCost(curr);
        for (let k = 0; k < prevCands.length; k++) {
          const prev = prevCands[k];
          const trans =
            0.35 * Math.abs(curr.fret - prev.fret) +
            0.45 * Math.abs(curr.stringIndex - prev.stringIndex);
          const candidateCost = dp[t - 1][k] + base + trans;
          if (candidateCost < dp[t][j]) {
            dp[t][j] = candidateCost;
            parent[t][j] = k;
          }
        }
      }
    }

    let endIdx = 0;
    let endCost = dp[n - 1][0];
    for (let j = 1; j < dp[n - 1].length; j++) {
      if (dp[n - 1][j] < endCost) {
        endCost = dp[n - 1][j];
        endIdx = j;
      }
    }

    if (endCost < bestTotalCost) {
      bestTotalCost = endCost;
      const path: BassTabPosition[] = new Array(n);
      let idx = endIdx;
      for (let t = n - 1; t >= 0; t--) {
        path[t] = candidatesPerNote[t][idx];
        idx = parent[t][idx];
      }
      bestPath = path;
    }
  }

  return bestPath;
}

// Fix: Corrected voice tag syntax and implemented generateRhythmXML for 16th note grids
export function generateMusicXML(
  midiNotes: number[],
  isFiveString: boolean = false,
  naming: 'english' | 'latin' = 'english',
  preferNoOpenStrings: boolean = true
): string {
  const stringsCount = isFiveString ? 5 : 4;
  const tabPositions = getBassPositionsForSequence(midiNotes, isFiveString, preferNoOpenStrings);
  
  const notationNotes = midiNotes.map((midi) => {
    const rawName = NOTE_NAMES_ENGLISH[midi % 12];
    const displayNote = translateNoteName(rawName, naming);
    const step = rawName.charAt(0);
    const alter = rawName.includes('#') ? 1 : 0;
    const octave = Math.floor(midi / 12) - 1;
    
    return `
      <note>
        <pitch>
          <step>${step}</step>
          ${alter ? `<alter>${alter}</alter>` : ''}
          <octave>${octave}</octave>
        </pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
        <lyric number="1">
          <text>${displayNote}</text>
        </lyric>
      </note>`;
  }).join('');

  const tabNotes = midiNotes.map((midi, idx) => {
    const rawName = NOTE_NAMES_ENGLISH[midi % 12];
    const step = rawName.charAt(0);
    const alter = rawName.includes('#') ? 1 : 0;
    const octave = Math.floor(midi / 12) - 1;
    const pos = tabPositions[idx] || getBassFretForMidi(midi, isFiveString, preferNoOpenStrings);
    
    return `
      <note>
        <pitch>
          <step>${step}</step>
          ${alter ? `<alter>${alter}</alter>` : ''}
          <octave>${octave}</octave>
        </pitch>
        <duration>1</duration>
        <voice>2</voice>
        <type>quarter</type>
        <staff>2</staff>
        <notations>
          <technical>
            <string>${pos.string}</string>
            <fret>${pos.fret}</fret>
          </technical>
        </notations>
      </note>`;
  }).join('');

  const tuningXml = isFiveString 
    ? `<staff-tuning line="1"><tuning-step>B</tuning-step><tuning-octave>0</tuning-octave></staff-tuning><staff-tuning line="2"><tuning-step>E</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="3"><tuning-step>A</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="4"><tuning-step>D</tuning-step><tuning-octave>2</tuning-octave></staff-tuning><staff-tuning line="5"><tuning-step>G</tuning-step><tuning-octave>2</tuning-octave></staff-tuning>`
    : `<staff-tuning line="1"><tuning-step>E</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="2"><tuning-step>A</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="3"><tuning-step>D</tuning-step><tuning-octave>2</tuning-octave></staff-tuning><staff-tuning line="4"><tuning-step>G</tuning-step><tuning-octave>2</tuning-octave></staff-tuning>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
    <score-partwise version="3.1">
      <part-list><score-part id="P1"><part-name>Bass</part-name></score-part></part-list>
      <part id="P1">
        <measure number="1">
          <attributes>
            <divisions>1</divisions>
            <key><fifths>0</fifths></key>
            <time><beats>${midiNotes.length}</beats><beat-type>4</beat-type></time>
            <staves>2</staves>
            <clef number="1"><sign>F</sign><line>4</line></clef>
            <clef number="2"><sign>TAB</sign></clef>
            <staff-details number="2"><staff-lines>${stringsCount}</staff-lines>${tuningXml}</staff-details>
          </attributes>
          ${notationNotes}
          <backup><duration>${midiNotes.length}</duration></backup>
          ${tabNotes}
        </measure>
      </part>
    </score-partwise>`;
}

export function generateRhythmXML(pattern: number[], midiSequence: number[], isFiveString: boolean = false): string {
  const stringsCount = isFiveString ? 5 : 4;
  const divisions = 4; // 16th notes
  
  const generateMeasure = (measureIdx: number) => {
    let notesXml = '';
    let tabsXml = '';
    const offset = measureIdx * 16;

    for (let i = 0; i < 16; i++) {
      const idx = offset + i;
      const isHit = pattern[idx] === 1;
      const midi = midiSequence[idx] || 0;

      if (isHit && midi > 0) {
        const rawName = NOTE_NAMES_ENGLISH[midi % 12];
        const step = rawName.charAt(0);
        const alter = rawName.includes('#') ? 1 : 0;
        const octave = Math.floor(midi / 12) - 1;
        const pos = getBassFretForMidi(midi, isFiveString);

        notesXml += `
          <note>
            <pitch>
              <step>${step}</step>
              ${alter ? `<alter>${alter}</alter>` : ''}
              <octave>${octave}</octave>
            </pitch>
            <duration>1</duration>
            <voice>1</voice>
            <type>16th</type>
            <staff>1</staff>
          </note>`;

        tabsXml += `
          <note>
            <pitch>
              <step>${step}</step>
              ${alter ? `<alter>${alter}</alter>` : ''}
              <octave>${octave}</octave>
            </pitch>
            <duration>1</duration>
            <voice>2</voice>
            <type>16th</type>
            <staff>2</staff>
            <notations>
              <technical>
                <string>${pos.string}</string>
                <fret>${pos.fret}</fret>
              </technical>
            </notations>
          </note>`;
      } else {
        notesXml += `
          <note>
            <rest/>
            <duration>1</duration>
            <voice>1</voice>
            <type>16th</type>
            <staff>1</staff>
          </note>`;

        tabsXml += `
          <note>
            <rest/>
            <duration>1</duration>
            <voice>2</voice>
            <type>16th</type>
            <staff>2</staff>
          </note>`;
      }
    }
    return { notesXml, tabsXml };
  };

  const measure1 = generateMeasure(0);
  const measure2 = generateMeasure(1);

  const tuningXml = isFiveString 
    ? `<staff-tuning line="1"><tuning-step>B</tuning-step><tuning-octave>0</tuning-octave></staff-tuning><staff-tuning line="2"><tuning-step>E</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="3"><tuning-step>A</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="4"><tuning-step>D</tuning-step><tuning-octave>2</tuning-octave></staff-tuning><staff-tuning line="5"><tuning-step>G</tuning-step><tuning-octave>2</tuning-octave></staff-tuning>`
    : `<staff-tuning line="1"><tuning-step>E</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="2"><tuning-step>A</tuning-step><tuning-octave>1</tuning-octave></staff-tuning><staff-tuning line="3"><tuning-step>D</tuning-step><tuning-octave>2</tuning-octave></staff-tuning><staff-tuning line="4"><tuning-step>G</tuning-step><tuning-octave>2</tuning-octave></staff-tuning>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
    <score-partwise version="3.1">
      <part-list><score-part id="P1"><part-name>Bass</part-name></score-part></part-list>
      <part id="P1">
        <measure number="1">
          <attributes>
            <divisions>${divisions}</divisions>
            <key><fifths>0</fifths></key>
            <time><beats>4</beats><beat-type>4</beat-type></time>
            <staves>2</staves>
            <clef number="1"><sign>F</sign><line>4</line></clef>
            <clef number="2"><sign>TAB</sign></clef>
            <staff-details number="2"><staff-lines>${stringsCount}</staff-lines>${tuningXml}</staff-details>
          </attributes>
          ${measure1.notesXml}
          <backup><duration>16</duration></backup>
          ${measure1.tabsXml}
        </measure>
        <measure number="2">
          ${measure2.notesXml}
          <backup><duration>16</duration></backup>
          ${measure2.tabsXml}
        </measure>
      </part>
    </score-partwise>`;
}

export function validateNote(detectedMidi: number, targetMidi: number, strictOctave: boolean): boolean {
  if (strictOctave) return detectedMidi === targetMidi;
  return (detectedMidi % 12) === (targetMidi % 12);
}