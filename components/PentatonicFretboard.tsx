import React, { useMemo } from 'react';
import { Box, Typography, Stack, ToggleButton, ToggleButtonGroup, useTheme, alpha, keyframes } from '@mui/material';
import { BASS_STRINGS, NOTE_NAMES } from '../data/fretboard';
import { BassTabPosition, translateNoteName } from '../audio/noteUtils';
import { PentatonicTaskConfig } from '../data/pentatonicProgram';
import { translations } from '../localization/translations';
import { useStore } from '../state/store';

const targetPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.75); transform: translate(-50%, -50%) scale(1); }
  50% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); transform: translate(-50%, -50%) scale(1.18); }
  100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); transform: translate(-50%, -50%) scale(1); }
`;

interface PentatonicFretboardProps {
  config: PentatonicTaskConfig;
  shapePositions: BassTabPosition[];
  targetPosition?: BassTabPosition | null;
  detectedMidi?: number | null;
  isFiveString: boolean;
  noteNaming: 'english' | 'latin';
  labelMode: 'degrees' | 'notes';
  onLabelModeChange: (mode: 'degrees' | 'notes') => void;
  isFailure?: boolean;
  isSuccess?: boolean;
  compact?: boolean;
}

type PentRole = 'root' | 'chord' | 'color' | 'outside';

const MAJOR_PENT_INTERVALS = [0, 2, 4, 7, 9];
const MAJOR_PENT_DEGREES = ['1', '2', '3', '5', '6'];
const MINOR_PENT_INTERVALS = [0, 3, 5, 7, 10];
const MINOR_PENT_DEGREES = ['1', 'b3', '4', '5', 'b7'];

const PentatonicFretboard: React.FC<PentatonicFretboardProps> = ({
  config,
  shapePositions,
  targetPosition,
  detectedMidi,
  isFiveString,
  noteNaming,
  labelMode,
  onLabelModeChange,
  isFailure,
  isSuccess,
  compact = false,
}) => {
  const theme = useTheme();
  const { settings } = useStore();
  const pt = translations[settings.language].pentatonic;
  const isDark = theme.palette.mode === 'dark';
  const amber = '#ffb300';

  const strings = isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  const intervals = config.quality === 'major' ? MAJOR_PENT_INTERVALS : MINOR_PENT_INTERVALS;
  const degreeLabels = config.quality === 'major' ? MAJOR_PENT_DEGREES : MINOR_PENT_DEGREES;
  const chordIntervals = config.quality === 'major' ? [4, 7] : [3, 7];

  const { shapePosSet, minShapeFret, maxShapeFret } = useMemo(() => {
    const set = new Set<string>();
    let minF = 12;
    let maxF = 1;
    shapePositions.forEach((p) => {
      set.add(`${p.stringIndex}-${p.fret}`);
      if (p.fret > 0) {
        if (p.fret < minF) minF = p.fret;
        if (p.fret > maxF) maxF = p.fret;
      }
    });
    if (shapePositions.length === 0) {
      minF = 1;
      maxF = 5;
    }
    return { shapePosSet: set, minShapeFret: minF, maxShapeFret: maxF };
  }, [shapePositions]);

  const maxFret = Math.max(12, maxShapeFret + 1);
  const fretWidth = 64;
  const openColWidth = 44;
  const stringSpacing = compact ? 28 : 34;
  const topOffset = compact ? 20 : 26;
  const totalWidth = openColWidth + maxFret * fretWidth;
  const boardHeight = (strings.length - 1) * stringSpacing;
  const inlayFrets = [3, 5, 7, 9, 12];

  const analyzeNote = (midi: number): { role: PentRole; degree: string; noteName: string } => {
    const interval = ((midi - config.rootMidi) % 12 + 12) % 12;
    const noteName = NOTE_NAMES[midi % 12];
    const idx = intervals.indexOf(interval);
    if (idx === -1) return { role: 'outside', degree: '', noteName };
    if (interval === 0) return { role: 'root', degree: '1', noteName };
    if (chordIntervals.includes(interval)) return { role: 'chord', degree: degreeLabels[idx], noteName };
    return { role: 'color', degree: degreeLabels[idx], noteName };
  };

  const getRoleColors = (role: PentRole) => {
    switch (role) {
      case 'root':
        return {
          bg: theme.palette.primary.main,
          fg: theme.palette.primary.contrastText,
          border: theme.palette.primary.main,
        };
      case 'chord':
        return {
          bg: theme.palette.success.main,
          fg: '#ffffff',
          border: theme.palette.success.main,
        };
      case 'color':
        return {
          bg: amber,
          fg: '#111111',
          border: amber,
        };
      default:
        return { bg: 'transparent', fg: 'transparent', border: 'transparent' };
    }
  };

  const qualityLabel =
    config.quality === 'major'
      ? translations[settings.language].theory.majorPent
      : translations[settings.language].theory.minorPent;

  const shapeLabel =
    settings.language === 'fr'
      ? config.shapeName_fr
      : settings.language === 'es'
      ? config.shapeName_es
      : config.shapeName;

  return (
    <Box
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 3,
        border: '2px solid',
        borderColor: isFailure ? 'error.main' : isSuccess ? 'success.main' : 'divider',
        bgcolor: 'background.paper',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Top Bar: Scale Info + Legend + Toggle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          mb: compact ? 0.5 : 1,
        }}
      >
        <Box>
          <Typography variant={compact ? 'body2' : 'subtitle1'} fontWeight={900}>
            {translateNoteName(config.rootName, noteNaming)} {qualityLabel}{' '}
            <Typography component="span" variant="caption" color="primary" fontWeight={800}>
              • {shapeLabel} ({pt.fretsLabel} {minShapeFret}–{maxShapeFret})
            </Typography>
          </Typography>
          {!compact && (
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {pt.shapeToPlayHint}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: 'primary.main' }} />
              <Typography variant="caption" fontWeight={700}>{pt.roleRoot}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption" fontWeight={700}>{pt.roleChord}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 11, height: 11, borderRadius: '3px', bgcolor: amber }} />
              <Typography variant="caption" fontWeight={700}>{pt.roleColor}</Typography>
            </Stack>
          </Stack>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={labelMode}
            onChange={(_, v) => v && onLabelModeChange(v)}
          >
            <ToggleButton value="degrees" sx={{ fontWeight: 800, px: 1.25, py: 0.35, textTransform: 'none', fontSize: '0.72rem' }}>
              {pt.showDegrees}
            </ToggleButton>
            <ToggleButton value="notes" sx={{ fontWeight: 800, px: 1.25, py: 0.35, textTransform: 'none', fontSize: '0.72rem' }}>
              {pt.showNotes}
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Scrollable Bass Neck */}
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          py: compact ? 0.5 : 1,
          px: 0.5,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: totalWidth + 24,
            height: boardHeight + topOffset + (compact ? 24 : 32),
            mx: 'auto',
          }}
        >
          {/* Active Shape Zone Highlight Band */}
          {shapePositions.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                left: openColWidth + (minShapeFret - 1) * fretWidth + 2,
                top: topOffset - 8,
                width: (maxShapeFret - minShapeFret + 1) * fretWidth - 4,
                height: boardHeight + 16,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.08),
                border: '2px dashed',
                borderColor: alpha(theme.palette.primary.main, 0.45),
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Fret Numbers & Inlays */}
          {Array.from({ length: maxFret + 1 }, (_, fret) => {
            const x = fret === 0 ? openColWidth / 2 : openColWidth + (fret - 0.5) * fretWidth;
            const isInlay = inlayFrets.includes(fret);
            const inBox = fret >= minShapeFret && fret <= maxShapeFret;
            return (
              <React.Fragment key={`fret-${fret}`}>
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    left: x,
                    top: 0,
                    transform: 'translateX(-50%)',
                    fontWeight: inBox || isInlay ? 900 : 600,
                    fontSize: '0.72rem',
                    color: inBox ? 'primary.main' : 'text.secondary',
                    opacity: fret === 0 ? 0.45 : 1,
                  }}
                >
                  {fret}
                </Typography>
                {isInlay && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: x,
                      top: topOffset + boardHeight + 14,
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                    {fret === 12 && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                    )}
                  </Box>
                )}
              </React.Fragment>
            );
          })}

          {/* Fretboard Wood / Surface */}
          <Box
            sx={{
              position: 'absolute',
              left: openColWidth,
              top: topOffset,
              width: maxFret * fretWidth,
              height: boardHeight,
              bgcolor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)',
              borderRadius: 1,
            }}
          />

          {/* Fret Wires */}
          {Array.from({ length: maxFret + 1 }, (_, i) => (
            <Box
              key={`wire-${i}`}
              sx={{
                position: 'absolute',
                left: openColWidth + i * fretWidth,
                top: topOffset,
                height: boardHeight,
                width: i === 0 ? 4 : 1.5,
                bgcolor: i === 0 ? (isDark ? '#fff' : '#222') : 'divider',
                transform: 'translateX(-50%)',
                zIndex: 2,
              }}
            />
          ))}

          {/* Bass Strings */}
          {strings.map((sIdx, renderIdx) => {
            const y = topOffset + renderIdx * stringSpacing;
            const thickness = 1.4 + renderIdx * 0.45;
            return (
              <React.Fragment key={`str-${sIdx}`}>
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    left: 2,
                    top: y,
                    transform: 'translateY(-50%)',
                    fontWeight: 900,
                    fontSize: '0.7rem',
                    color: 'text.disabled',
                  }}
                >
                  {translateNoteName(BASS_STRINGS[sIdx].name, noteNaming)}
                </Typography>
                <Box
                  sx={{
                    position: 'absolute',
                    left: openColWidth,
                    top: y,
                    width: maxFret * fretWidth,
                    height: thickness,
                    bgcolor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.26)',
                    transform: 'translateY(-50%)',
                    zIndex: 3,
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Pentatonic Notes: Active Shape (Vivid) + Wider Neck Context (Subtle) */}
          {strings.map((sIdx, renderIdx) => {
            const y = topOffset + renderIdx * stringSpacing;
            const openMidi = BASS_STRINGS[sIdx].openMidi;

            return Array.from({ length: maxFret + 1 }, (_, fret) => {
              // Avoid cluttering fret 0 for closed-position pentatonic shapes unless actively detected
              const midi = openMidi + fret;
              const info = analyzeNote(midi);
              const inActiveShape = shapePosSet.has(`${sIdx}-${fret}`);
              const isTargetExact =
                !!targetPosition &&
                sIdx === targetPosition.stringIndex &&
                fret === targetPosition.fret;
              const isDetectedMatch =
                detectedMidi !== null &&
                detectedMidi !== undefined &&
                detectedMidi === midi;

              if (fret === 0 && !inActiveShape && !isTargetExact && !isDetectedMatch) {
                return null;
              }
              if (info.role === 'outside' && !inActiveShape && !isTargetExact && !isDetectedMatch) {
                return null;
              }

              const x = fret === 0 ? openColWidth / 2 + 4 : openColWidth + (fret - 0.5) * fretWidth;
              const colors = getRoleColors(info.role);
              const label =
                labelMode === 'degrees'
                  ? info.degree || translateNoteName(info.noteName, noteNaming)
                  : translateNoteName(info.noteName, noteNaming);

              const isOutsideDetected = info.role === 'outside' && isDetectedMatch;
              const size = isTargetExact ? 29 : inActiveShape ? 25 : 19;

              return (
                <Box
                  key={`p-${sIdx}-${fret}`}
                  sx={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                    borderRadius: info.role === 'color' ? '6px' : '50%',
                    bgcolor: isOutsideDetected
                      ? alpha(theme.palette.error.main, 0.25)
                      : inActiveShape || isTargetExact
                      ? colors.bg
                      : alpha(colors.bg, isDark ? 0.22 : 0.16),
                    color: isOutsideDetected
                      ? theme.palette.error.main
                      : inActiveShape || isTargetExact
                      ? colors.fg
                      : isDark
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(0,0,0,0.45)',
                    border: '2px solid',
                    borderColor: isTargetExact
                      ? '#ffffff'
                      : isDetectedMatch
                      ? theme.palette.secondary.main
                      : isOutsideDetected
                      ? theme.palette.error.main
                      : inActiveShape
                      ? colors.border
                      : alpha(colors.border, 0.35),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: inActiveShape || isTargetExact ? (label.length > 2 ? '0.6rem' : '0.7rem') : '0.58rem',
                    fontWeight: inActiveShape || isTargetExact ? 900 : 700,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isTargetExact ? 25 : isDetectedMatch ? 20 : inActiveShape ? 14 : 6,
                    animation: isTargetExact ? `${targetPulse} 1.3s infinite ease-in-out` : 'none',
                    boxShadow: isDetectedMatch
                      ? `0 0 0 4px ${alpha(theme.palette.secondary.main, 0.35)}`
                      : inActiveShape && !isTargetExact
                      ? `0 2px 6px ${alpha(colors.bg, 0.35)}`
                      : 'none',
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}
                >
                  {label}
                </Box>
              );
            });
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default PentatonicFretboard;
