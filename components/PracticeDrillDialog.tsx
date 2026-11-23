import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { getAllPositionsInRanges, FretPosition } from '../data/fretboard';
import { translateNoteName } from '../audio/noteUtils';

export interface DrillConfig {
  questions: FretPosition[];
  title: string;
}

interface PracticeDrillDialogProps {
  open: boolean;
  onClose: () => void;
  onLaunchDrill: (config: DrillConfig) => void;
}

const PracticeDrillDialog: React.FC<PracticeDrillDialogProps> = ({
  open,
  onClose,
  onLaunchDrill,
}) => {
  const { settings, mastery } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].training;
  const pt = translations[settings.language].profile;
  const isDark = theme.palette.mode === 'dark';

  const [fretRange, setFretRange] = useState<number[]>([0, 12]);
  const [selectedStrings, setSelectedStrings] = useState({
    G: true,
    D: true,
    A: true,
    E: true,
    B: settings.isFiveString,
  });
  const [questionCount, setQuestionCount] = useState<number>(10);

  const availableStrings = useMemo(() => {
    const base = ['G', 'D', 'A', 'E'];
    if (settings.isFiveString) base.push('B');
    return base;
  }, [settings.isFiveString]);

  const handleStringChange = (name: string) => {
    setSelectedStrings((prev) => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev],
    }));
  };

  const isMastered = (stats: FretboardItemStats | undefined): boolean => {
    if (!stats || stats.attempts < 3) return false;
    return stats.corrects / stats.attempts > 0.8;
  };

  const getWeaknessScore = (stats: FretboardItemStats | undefined) => {
    if (!stats || stats.attempts === 0) return 1.0;
    const accuracy = stats.corrects / stats.attempts;
    const avgTime = stats.totalTime / stats.attempts;
    const accScore = 1 - accuracy;
    const speedScore = Math.min(1, avgTime / settings.timeLimit);
    const hoursSinceLast = (Date.now() - stats.lastAttempt) / (1000 * 60 * 60);
    const recencyBoost = Math.min(0.2, hoursSinceLast / 168);
    return accScore * 0.6 + speedScore * 0.3 + recencyBoost * 0.1;
  };

  const unmasteredCount = useMemo(() => {
    const stringIndices = settings.isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
    const fullPool = getAllPositionsInRanges(12, stringIndices);
    return fullPool.filter((pos) => !isMastered(mastery[`s${pos.string}f${pos.fret}`])).length;
  }, [mastery, settings.isFiveString]);

  const handleStartWeakSpots = () => {
    const stringIndices = settings.isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
    const fullPool = getAllPositionsInRanges(12, stringIndices);

    const scoredPool = fullPool
      .map((pos) => {
        const stats = mastery[`s${pos.string}f${pos.fret}`];
        return { pos, stats, score: getWeaknessScore(stats), mastered: isMastered(stats) };
      })
      .filter((item) => !item.mastered)
      .sort((a, b) => b.score - a.score);

    const weakItems = scoredPool.slice(0, 20);
    const finalWeakQs: FretPosition[] = [];
    let lastMidi: number | null = null;

    for (const item of weakItems) {
      if (finalWeakQs.length >= 10) break;
      if (item.pos.midi !== lastMidi) {
        finalWeakQs.push(item.pos);
        lastMidi = item.pos.midi;
      }
    }

    if (finalWeakQs.length === 0) {
      const maintenanceQs = fullPool
        .map((pos) => ({ pos, stats: mastery[`s${pos.string}f${pos.fret}`] }))
        .sort((a, b) => (a.stats?.lastAttempt || 0) - (b.stats?.lastAttempt || 0))
        .slice(0, 10)
        .map((i) => i.pos);
      onLaunchDrill({ questions: maintenanceQs, title: t.maintenanceDrill });
      return;
    }

    onLaunchDrill({ questions: finalWeakQs, title: t.fixWeakSpots });
  };

  const handleStartCustom = () => {
    const stringIndices: number[] = [];
    if (selectedStrings.G) stringIndices.push(0);
    if (selectedStrings.D) stringIndices.push(1);
    if (selectedStrings.A) stringIndices.push(2);
    if (selectedStrings.E) stringIndices.push(3);
    if (settings.isFiveString && selectedStrings.B) stringIndices.push(4);

    const pool = getAllPositionsInRanges(fretRange[1], stringIndices).filter(
      (p) => p.fret >= fretRange[0]
    );
    if (pool.length === 0) return;

    const finalQuestions: FretPosition[] = [];
    let lastMidi: number | null = null;
    while (finalQuestions.length < questionCount) {
      const candidates = pool.filter((p) => p.midi !== lastMidi);
      const source = candidates.length > 0 ? candidates : pool;
      const pick = source[Math.floor(Math.random() * source.length)];
      finalQuestions.push(pick);
      lastMidi = pick.midi;
    }

    onLaunchDrill({ questions: finalQuestions, title: t.customSessionSetup });
  };

  const noStringsSelected = availableStrings.every(
    (s) => !selectedStrings[s as keyof typeof selectedStrings]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {pt.drillDialogTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
            {pt.drillDialogSubtitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Grid container spacing={2.5} alignItems="stretch">
          {/* Option 1: Fix My Weak Spots */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                height: '100%',
                p: 2.75,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.35),
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.07 : 0.04),
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 2.5,
              }}
            >
              <Box>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                  <PsychologyOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t.fixWeakSpots}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 2 }}>
                  {t.weakSpotsDesc}
                </Typography>
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {unmasteredCount > 0
                    ? pt.weakSpotsPoolCount.replace('{count}', String(unmasteredCount))
                    : pt.maintenancePoolReady}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleStartWeakSpots}
                startIcon={<PsychologyOutlinedIcon />}
                sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.25 }}
              >
                {t.analyzeAndStart}
              </Button>
            </Box>
          </Grid>

          {/* Option 2: Custom Session Setup */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                height: '100%',
                p: 2.75,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 2.5,
              }}
            >
              <Box>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                  <TuneRoundedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t.customSessionSetup}
                  </Typography>
                </Stack>

                <Stack spacing={2.25}>
                  {/* Fret Range */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t.fretRange}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fretRange[0]} – {fretRange[1]}
                      </Typography>
                    </Stack>
                    <Box sx={{ px: 1 }}>
                      <Slider
                        value={fretRange}
                        onChange={(_, val) => setFretRange(val as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={24}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {/* Strings */}
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}
                    >
                      {t.strings}
                    </Typography>
                    <FormGroup row>
                      {availableStrings.map((s) => (
                        <FormControlLabel
                          key={s}
                          control={
                            <Checkbox
                              checked={selectedStrings[s as keyof typeof selectedStrings]}
                              onChange={() => handleStringChange(s)}
                              size="small"
                            />
                          }
                          label={
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}
                            >
                              {translateNoteName(s, settings.noteNaming)}
                            </Typography>
                          }
                          sx={{ mr: 2 }}
                        />
                      ))}
                    </FormGroup>
                  </Box>

                  {/* Questions */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t.numQuestions}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {questionCount}
                      </Typography>
                    </Stack>
                    <Box sx={{ px: 1 }}>
                      <Slider
                        value={questionCount}
                        onChange={(_, val) => setQuestionCount(val as number)}
                        min={5}
                        max={50}
                        step={5}
                        marks
                        valueLabelDisplay="auto"
                        size="small"
                      />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                size="large"
                disabled={noStringsSelected}
                onClick={handleStartCustom}
                startIcon={<TrackChangesRoundedIcon />}
                sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.25 }}
              >
                {t.deployCustom}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeDrillDialog;
