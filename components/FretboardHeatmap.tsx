import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Box, Typography, Tooltip, Divider, Stack, Button, useTheme, alpha } from '@mui/material';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined';

import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { getFretInfo, BASS_STRINGS, NOTE_NAMES } from '../data/fretboard';
import { translateNoteName } from '../audio/noteUtils';
import { EarTrainingPlayer } from '../audio/earTrainingAudio';

export type ScaleType = 'none' | 'major_pent' | 'minor_pent';

interface FretboardHeatmapProps {
  onSelectPosition?: (s: number, f: number) => void;
  scaleType?: ScaleType;
  rootNote?: string;
  defaultSoundEnabled?: boolean;
}

const FRET_MAX = 12;
const SINGLE_INLAY_FRETS = [3, 5, 7, 9];
const DOUBLE_INLAY_FRET = 12;

// Realistic progressive fret widths from fret 1 (widest) to fret 12 (narrowest)
const FRET_WEIGHTS = [1.22, 1.17, 1.12, 1.08, 1.04, 1.0, 0.96, 0.92, 0.89, 0.86, 0.83, 0.80];
const STRING_GAUGES = [1.8, 2.4, 3.0, 3.8, 4.5]; // G, D, A, E, B

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const FretboardHeatmap: React.FC<FretboardHeatmapProps> = ({
  onSelectPosition,
  scaleType = 'none',
  rootNote = 'C',
  defaultSoundEnabled = true,
}) => {
  const { settings, mastery } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].training;
  const isDark = theme.palette.mode === 'dark';

  const [soundEnabled, setSoundEnabled] = useState<boolean>(defaultSoundEnabled);
  const [selectedPos, setSelectedPos] = useState<{ s: number; f: number } | null>(null);
  const playerRef = useRef<EarTrainingPlayer | null>(null);

  useEffect(() => {
    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  const getPlayer = () => {
    if (!playerRef.current) {
      playerRef.current = new EarTrainingPlayer();
    }
    return playerRef.current;
  };

  const stringsToRender = useMemo(() => {
    return settings.isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  }, [settings.isFiveString]);

  const scaleNotes = useMemo(() => {
    if (scaleType === 'none') return new Set<string>();
    const rootIdx = NOTE_NAMES.indexOf(rootNote);
    const intervals = scaleType === 'major_pent' ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10];
    return new Set(intervals.map((i) => NOTE_NAMES[(rootIdx + i) % 12]));
  }, [scaleType, rootNote]);

  const getMasteryTier = (stats?: FretboardItemStats): 'unpracticed' | 'mastered' | 'improving' | 'weak' => {
    if (!stats || stats.attempts === 0) return 'unpracticed';
    if (stats.attempts < 3) return 'weak';
    const accuracy = stats.corrects / stats.attempts;
    if (accuracy > 0.8) return 'mastered';
    if (accuracy > 0.5) return 'improving';
    return 'weak';
  };

  const getMarkerStyles = (tier: 'unpracticed' | 'mastered' | 'improving' | 'weak') => {
    switch (tier) {
      case 'mastered':
        return { bg: '#22c55e', color: '#052e16', border: 'rgba(255,255,255,0.45)' };
      case 'improving':
        return { bg: '#eab308', color: '#1c1917', border: 'rgba(255,255,255,0.45)' };
      case 'weak':
        return { bg: '#ef4444', color: '#ffffff', border: 'rgba(255,255,255,0.45)' };
      default:
        return { bg: '#2e2b29', color: '#f5f5f4', border: 'rgba(255, 255, 255, 0.24)' };
    }
  };

  const handleFretClick = (sIdx: number, fret: number) => {
    setSelectedPos({ s: sIdx, f: fret });
    if (soundEnabled) {
      const info = getFretInfo(sIdx, fret);
      getPlayer().playSingleNote(info.midi, 'bass', 0.85);
    }
    onSelectPosition?.(sIdx, fret);
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      if (prev) {
        playerRef.current?.stop();
      }
      return !prev;
    });
  };

  const gridTemplateColumns = useMemo(
    () => `54px ${FRET_WEIGHTS.map((w) => `${w}fr`).join(' ')}`,
    []
  );

  const selectedInfo = useMemo(() => {
    if (!selectedPos) return null;
    const info = getFretInfo(selectedPos.s, selectedPos.f);
    const stats = mastery[`s${selectedPos.s}f${selectedPos.f}`];
    const octave = Math.floor(info.midi / 12) - 1;
    const noteLabel = `${translateNoteName(info.noteName, settings.noteNaming)}${octave}`;
    const stringLabel = translateNoteName(info.stringName, settings.noteNaming);
    const freq = midiToFrequency(info.midi).toFixed(1);
    return { info, stats, noteLabel, stringLabel, freq };
  }, [selectedPos, mastery, settings.noteNaming]);

  return (
    <Box>
      {/* Top Control & Live Readout Bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 1.75 }}
      >
        {/* Selected Note Live Readout */}
        <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
          {selectedInfo ? (
            <>
              <Typography
                component="span"
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: 'primary.main',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {selectedInfo.noteLabel}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums' }}
              >
                {selectedInfo.freq} Hz · {t.stringShort.replace('{string}', selectedInfo.stringLabel)} ·{' '}
                {selectedInfo.info.fret === 0
                  ? t.openString
                  : t.fretShort.replace('{fret}', String(selectedInfo.info.fret))}
              </Typography>
              {selectedInfo.stats ? (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums' }}
                >
                  · {Math.round((selectedInfo.stats.corrects / selectedInfo.stats.attempts) * 100)}% (
                  {selectedInfo.stats.attempts}) ·{' '}
                  {(selectedInfo.stats.totalTime / selectedInfo.stats.attempts).toFixed(2)}s
                </Typography>
              ) : (
                <Typography component="span" variant="caption" color="text.secondary">
                  · {t.notPracticed}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {soundEnabled ? t.clickFretHint : t.clickFretMutedHint}
            </Typography>
          )}
        </Box>

        {/* Sound Toggle Control */}
        <Button
          size="small"
          variant={soundEnabled ? 'outlined' : 'text'}
          color={soundEnabled ? 'primary' : 'inherit'}
          onClick={handleToggleSound}
          startIcon={soundEnabled ? <VolumeUpOutlinedIcon fontSize="small" /> : <VolumeOffOutlinedIcon fontSize="small" />}
          aria-pressed={soundEnabled}
          sx={{
            whiteSpace: 'nowrap',
            flexShrink: 0,
            fontWeight: 700,
            fontSize: '0.78rem',
            px: 1.5,
            py: 0.5,
            color: soundEnabled ? 'primary.main' : 'text.secondary',
            borderColor: soundEnabled ? alpha(theme.palette.primary.main, 0.45) : 'divider',
          }}
        >
          {soundEnabled ? t.soundOn : t.soundOff}
        </Button>
      </Stack>

      {/* Realistic Bass Neck Container */}
      <Box
        sx={{
          overflowX: 'auto',
          pb: 0.5,
        }}
      >
        <Box sx={{ minWidth: 820 }}>
          {/* Fret Numbers Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns,
              mb: 0.75,
              px: 0.5,
            }}
          >
            {Array.from({ length: FRET_MAX + 1 }).map((_, f) => {
              const isMarker = SINGLE_INLAY_FRETS.includes(f) || f === DOUBLE_INLAY_FRET;
              return (
                <Typography
                  key={f}
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.72rem',
                    fontWeight: isMarker || f === 0 ? 700 : 500,
                    color: isMarker || f === 0 ? 'text.primary' : 'text.secondary',
                    opacity: isMarker || f === 0 ? 0.95 : 0.55,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {f}
                </Typography>
              );
            })}
          </Box>

          {/* Fingerboard Wood Plate (Rosewood / Ebony) */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              background: isDark
                ? 'linear-gradient(180deg, #1e1b18 0%, #151311 55%, #191614 100%)'
                : 'linear-gradient(180deg, #2d2520 0%, #221c18 55%, #28201c 100%)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.22)',
              boxShadow: isDark
                ? 'inset 0 2px 10px rgba(0,0,0,0.55)'
                : 'inset 0 2px 10px rgba(0,0,0,0.35)',
              py: 1.5,
            }}
          >
            {/* Background Fret Wires, Ivory Nut & Pearloid Inlays */}
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                gridTemplateColumns,
                pointerEvents: 'none',
              }}
            >
              {/* Headstock / Open String Zone */}
              <Box
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.28)',
                  borderRight: '4px solid #ebe3d0', // Bone/Ivory Nut
                  boxShadow: '2px 0 6px rgba(0,0,0,0.35)',
                }}
              />

              {/* Frets 1..12 */}
              {Array.from({ length: FRET_MAX }, (_, idx) => idx + 1).map((fret) => {
                const isSingleInlay = SINGLE_INLAY_FRETS.includes(fret);
                const isDoubleInlay = fret === DOUBLE_INLAY_FRET;
                return (
                  <Box
                    key={fret}
                    sx={{
                      position: 'relative',
                      borderRight:
                        fret === FRET_MAX
                          ? 'none'
                          : '2px solid rgba(226, 232, 240, 0.22)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: isDoubleInlay ? 'space-evenly' : 'center',
                    }}
                  >
                    {isSingleInlay && (
                      <Box
                        sx={{
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          bgcolor: 'rgba(248, 244, 232, 0.18)',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.16)',
                        }}
                      />
                    )}
                    {isDoubleInlay && (
                      <>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'rgba(248, 244, 232, 0.2)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.16)',
                          }}
                        />
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'rgba(248, 244, 232, 0.2)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.16)',
                          }}
                        />
                      </>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Strings & Clickable Note Positions */}
            <Stack spacing={0}>
              {stringsToRender.map((sIdx) => {
                const gauge = STRING_GAUGES[sIdx] || 3;
                const openStringName = translateNoteName(BASS_STRINGS[sIdx].name, settings.noteNaming);

                return (
                  <Box
                    key={sIdx}
                    sx={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns,
                      height: settings.isFiveString ? 38 : 44,
                      alignItems: 'center',
                    }}
                  >
                    {/* Metallic Wound Bass String */}
                    <Box
                      aria-hidden="true"
                      sx={{
                        position: 'absolute',
                        left: 54,
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: `${gauge}px`,
                        background:
                          'linear-gradient(180deg, rgba(241,245,249,0.78) 0%, rgba(148,163,184,0.45) 60%, rgba(71,85,105,0.6) 100%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Cells for Open String (0) + Frets 1..12 */}
                    {Array.from({ length: FRET_MAX + 1 }).map((_, f) => {
                      const info = getFretInfo(sIdx, f);
                      const stats = mastery[`s${sIdx}f${f}`];
                      const tier = getMasteryTier(stats);
                      const markerStyle = getMarkerStyles(tier);
                      const displayNote = translateNoteName(info.noteName, settings.noteNaming);
                      const octave = Math.floor(info.midi / 12) - 1;

                      const isScaleFiltered = scaleType !== 'none';
                      const isInScale = scaleNotes.has(info.noteName);
                      const isScaleRoot = isScaleFiltered && isInScale && info.noteName === rootNote;
                      const isSelected = selectedPos?.s === sIdx && selectedPos?.f === f;

                      const tooltipContent = (
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.4 }}>
                            {displayNote}
                            {octave} · {t.stringShort.replace('{string}', openStringName)} ·{' '}
                            {f === 0 ? t.openString : t.fretShort.replace('{fret}', String(f))}
                          </Typography>
                          <Divider sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.2)' }} />
                          {stats ? (
                            <>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {t.attempts}: {stats.attempts}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {t.accuracy}: {Math.round((stats.corrects / stats.attempts) * 100)}%
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {t.avgSpeed}: {(stats.totalTime / stats.attempts).toFixed(2)}s
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              {t.notPracticed}
                            </Typography>
                          )}
                        </Box>
                      );

                      const dimmed = isScaleFiltered && !isInScale && !isSelected;

                      return (
                        <Tooltip
                          key={f}
                          title={tooltipContent}
                          arrow
                          enterDelay={220}
                          children={
                            <Box
                              component="button"
                              type="button"
                              onClick={() => handleFretClick(sIdx, f)}
                              aria-label={`${displayNote}${octave}, ${openStringName} ${f === 0 ? t.openString : `Fret ${f}`}`}
                              sx={{
                                position: 'relative',
                                zIndex: isSelected ? 3 : isInScale ? 2 : 1,
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 0,
                                '&:hover .neck-note-dot': {
                                  transform: 'scale(1.12)',
                                  opacity: 1,
                                  borderColor: '#ffffff',
                                },
                                '&:focus-visible': {
                                  outline: `2px solid ${theme.palette.primary.main}`,
                                  outlineOffset: -2,
                                },
                              }}
                            >
                              <Box
                                className="neck-note-dot"
                                sx={{
                                  width: isSelected ? 31 : f === 0 ? 30 : 28,
                                  height: isSelected ? 31 : f === 0 ? 30 : 28,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontFamily: '"JetBrains Mono", monospace',
                                  fontSize: displayNote.length > 2 ? '0.62rem' : '0.7rem',
                                  fontWeight: 700,
                                  lineHeight: 1,
                                  transition: 'transform 0.14s ease, opacity 0.14s ease, box-shadow 0.14s ease',
                                  opacity: dimmed ? 0.22 : 1,
                                  bgcolor:
                                    isSelected && tier === 'unpracticed'
                                      ? theme.palette.primary.main
                                      : isScaleRoot && tier === 'unpracticed'
                                      ? theme.palette.primary.main
                                      : isInScale && tier === 'unpracticed'
                                      ? theme.palette.primary.dark
                                      : markerStyle.bg,
                                  color:
                                    (isSelected || isScaleRoot) && tier === 'unpracticed'
                                      ? theme.palette.primary.contrastText
                                      : isInScale && tier === 'unpracticed'
                                      ? '#ffffff'
                                      : markerStyle.color,
                                  border: isSelected
                                    ? '2px solid #ffffff'
                                    : isScaleRoot
                                    ? `2px solid ${theme.palette.primary.light}`
                                    : isInScale
                                    ? `1.5px solid ${theme.palette.primary.light}`
                                    : `1px solid ${markerStyle.border}`,
                                  boxShadow: isSelected
                                    ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.45)}`
                                    : isScaleRoot
                                    ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`
                                    : '0 2px 5px rgba(0,0,0,0.45)',
                                }}
                              >
                                {displayNote}
                              </Box>
                            </Box>
                          }
                        />
                      );
                    })}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FretboardHeatmap;