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

function getBassFretForMidi(midi: number, isFiveString: boolean): { string: number, fret: number } {
  const tunings = isFiveString ? [43, 38, 33, 28, 23] : [43, 38, 33, 28];
  for (let i = 0; i < tunings.length; i++) {
    const fret = midi - tunings[i];
    if (fret >= 0 && fret <= 22) {
      return { string: i + 1, fret };
    }
  }
  return { string: tunings.length, fret: Math.max(0, midi - tunings[tunings.length - 1]) };
}

// Fix: Corrected voice tag syntax and implemented generateRhythmXML for 16th note grids
export function generateMusicXML(midiNotes: number[], isFiveString: boolean = false, naming: 'english' | 'latin' = 'english'): string {
  const stringsCount = isFiveString ? 5 : 4;
  
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

  const tabNotes = midiNotes.map((midi) => {
    const rawName = NOTE_NAMES_ENGLISH[midi % 12];
    const step = rawName.charAt(0);
    const alter = rawName.includes('#') ? 1 : 0;
    const octave = Math.floor(midi / 12) - 1;
    const pos = getBassFretForMidi(midi, isFiveString);
    
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