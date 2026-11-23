import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import * as ReactRouterDOM from 'react-router-dom';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';

import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { PROGRAMS } from '../data/program30days';
import { getFretInfo, NOTE_NAMES } from '../data/fretboard';
import { translateNoteName } from '../audio/noteUtils';
import FretboardHeatmap, { ScaleType } from '../components/FretboardHeatmap';
import PracticeDrillDialog, { DrillConfig } from '../components/PracticeDrillDialog';
import SessionRunner from '../components/SessionRunner';
import MicPermissionDialog from '../components/MicPermissionDialog';

const { Link } = ReactRouterDOM as any;

const Profile: React.FC = () => {
  const { settings, history, mastery, srsProgress, isMicEnabled } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].profile;
  const trainT = translations[settings.language].training;
  const isDark = theme.palette.mode === 'dark';

  const [scaleType, setScaleType] = useState<ScaleType>('none');
  const [rootNote, setRootNote] = useState<string>('C');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [drillDialogOpen, setDrillDialogOpen] = useState<boolean>(false);
  const [micDialogOpen, setMicDialogOpen] = useState<boolean>(false);
  const [pendingDrill, setPendingDrill] = useState<DrillConfig | null>(null);
  const [activeDrill, setActiveDrill] = useState<DrillConfig | null>(null);
  const [sessionKey, setSessionKey] = useState<number>(0);

  const handleLaunchDrill = (config: DrillConfig) => {
    setDrillDialogOpen(false);
    if (isMicEnabled) {
      setActiveDrill(config);
      setSessionKey((k) => k + 1);
    } else {
      setPendingDrill(config);
      setMicDialogOpen(true);
    }
  };

  const handleMicSuccess = () => {
    if (pendingDrill) {
      setActiveDrill(pendingDrill);
      setPendingDrill(null);
      setSessionKey((k) => k + 1);
    }
  };

  // 1. Core KPI metrics derived truthfully from real store data
  const kpis = useMemo(() => {
    const totalSessions = history.length;
    const activeDaysSet = new Set(
      history.map((h) => {
        const d = new Date(h.date);
        return Number.isNaN(d.getTime()) ? h.date : d.toISOString().slice(0, 10);
      })
    );

    const avgAccuracy =
      totalSessions > 0
        ? Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / totalSessions)
        : null;
    const bestAccuracy =
      totalSessions > 0 ? Math.round(Math.max(...history.map((h) => h.accuracy))) : null;

    const stringCount = settings.isFiveString ? 5 : 4;
    const totalNeckPositions = stringCount * 13; // Frets 0..12
    let practicedPositions = 0;
    let masteredPositions = 0;
    let totalAttempts = 0;
    let totalTime = 0;

    for (let s = 0; s < stringCount; s++) {
      for (let f = 0; f <= 12; f++) {
        const stats = mastery[`s${s}f${f}`];
        if (stats && stats.attempts > 0) {
          practicedPositions++;
          totalAttempts += stats.attempts;
          totalTime += stats.totalTime;
          if (stats.attempts >= 3 && stats.corrects / stats.attempts > 0.8) {
            masteredPositions++;
          }
        }
      }
    }

    const avgResponseSec =
      totalAttempts > 0
        ? (totalTime / totalAttempts).toFixed(2)
        : totalSessions > 0
        ? (history.reduce((sum, h) => sum + (h.avgTime || 0), 0) / totalSessions).toFixed(2)
        : null;

    const coveragePct = Math.round((practicedPositions / totalNeckPositions) * 100);

    return {
      totalSessions,
      activeDays: activeDaysSet.size,
      avgAccuracy,
      bestAccuracy,
      avgResponseSec,
      totalAttempts,
      coveragePct,
      masteredPositions,
      totalNeckPositions,
    };
  }, [history, mastery, settings.isFiveString]);

  // 2. Per-program progress breakdown
  const programSummaries = useMemo(() => {
    const now = Date.now();
    return PROGRAMS.map((prog) => {
      const name =
        settings.language === 'fr'
          ? prog.name_fr || prog.name
          : settings.language === 'es'
          ? prog.name_es || prog.name
          : prog.name;

      const availableDays = prog.days.filter((d) => settings.isFiveString || !d.isFiveStringOnly);
      const total = availableDays.length;

      const progHistory = history.filter((h) => h.programId === prog.id);
      const passedDays = new Set<number>();
      progHistory.forEach((h) => {
        if (h.day !== undefined && h.accuracy >= settings.minUnlockAccuracy) {
          passedDays.add(h.day);
        }
      });

      const done = availableDays.filter((d) => passedDays.has(d.day)).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const avgAcc =
        progHistory.length > 0
          ? Math.round(progHistory.reduce((s, h) => s + h.accuracy, 0) / progHistory.length)
          : null;

      let dueCount = 0;
      if (settings.srsEnabled) {
        availableDays.forEach((d) => {
          const srs = srsProgress[`${prog.id}-day${d.day}`];
          if (srs && srs.nextReview && new Date(srs.nextReview).getTime() <= now) {
            dueCount++;
          }
        });
      }

      return {
        id: prog.id,
        name,
        done,
        total,
        pct,
        avgAcc,
        dueCount,
      };
    });
  }, [history, srsProgress, settings.language, settings.isFiveString, settings.minUnlockAccuracy, settings.srsEnabled]);

  // 3. Recent accuracy trend (last 15 sessions)
  const trendPoints = useMemo(() => {
    const slice = history.slice(-15);
    return slice.map((item, idx) => ({
      idx,
      accuracy: Math.max(0, Math.min(100, Math.round(item.accuracy))),
      date: item.date,
    }));
  }, [history]);

  // 4. Top focus areas (weakest practiced fretboard positions)
  const weakSpots = useMemo(() => {
    const maxStrings = settings.isFiveString ? 5 : 4;
    const rows: {
      key: string;
      noteLabel: string;
      stringLabel: string;
      fret: number;
      accuracy: number;
      avgSpeed: number;
      attempts: number;
      score: number;
    }[] = [];

    Object.entries(mastery).forEach(([key, stats]) => {
      const s = stats as FretboardItemStats;
      if (!s || s.attempts === 0) return;
      const match = /^s(\d+)f(\d+)$/.exec(key);
      if (!match) return;
      const sIdx = Number(match[1]);
      const fret = Number(match[2]);
      if (sIdx >= maxStrings || fret > 12) return;

      const info = getFretInfo(sIdx, fret);
      const octave = Math.floor(info.midi / 12) - 1;
      const accuracy = Math.round((s.corrects / s.attempts) * 100);
      const avgSpeed = s.totalTime / s.attempts;
      // Rank by low accuracy first, then slow recall
      const weaknessScore = (100 - accuracy) * 2 + avgSpeed * 12;

      if (accuracy < 85 || s.attempts < 3 || avgSpeed > 2.2) {
        rows.push({
          key,
          noteLabel: `${translateNoteName(info.noteName, settings.noteNaming)}${octave}`,
          stringLabel: translateNoteName(info.stringName, settings.noteNaming),
          fret,
          accuracy,
          avgSpeed,
          attempts: s.attempts,
          score: weaknessScore,
        });
      }
    });

    return rows.sort((a, b) => b.score - a.score).slice(0, 6);
  }, [mastery, settings.isFiveString, settings.noteNaming]);

  // 5. Filtered recent session history (newest first)
  const programNameById = useMemo(() => {
    const map: Record<string, string> = {};
    PROGRAMS.forEach((p) => {
      map[p.id] =
        settings.language === 'fr'
          ? p.name_fr || p.name
          : settings.language === 'es'
          ? p.name_es || p.name
          : p.name;
    });
    return map;
  }, [settings.language]);

  const filteredHistory = useMemo(() => {
    const reversed = [...history].reverse();
    if (historyFilter === 'all') return reversed.slice(0, 14);
    return reversed.filter((h) => h.programId === historyFilter).slice(0, 14);
  }, [history, historyFilter]);

  const formatSessionDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const locale = settings.language === 'fr' ? 'fr-FR' : settings.language === 'es' ? 'es-ES' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  const rigSummary = [
    settings.isFiveString ? t.rig5String : t.rig4String,
    settings.noteNaming === 'latin' ? t.namingLatin : t.namingEnglish,
    settings.srsEnabled ? t.srsActive : t.srsOff,
  ].join(' · ');

  if (activeDrill) {
    return (
      <SessionRunner
        key={sessionKey}
        questions={activeDrill.questions}
        title={activeDrill.title}
        onFinish={() => setActiveDrill(null)}
        onReplay={() => setSessionKey((k) => k + 1)}
      />
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        spacing={2.5}
        sx={{ pb: 3.5, mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 600, mb: 0.75 }}
          >
            {rigSummary}
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.9rem', md: '2.35rem' },
              lineHeight: 1.12,
              textWrap: 'balance',
              mb: 0.75,
            }}
          >
            {t.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '62ch', lineHeight: 1.6 }}>
            {t.subtitle}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.25} sx={{ flexShrink: 0 }}>
          <Button
            component={Link}
            to="/program"
            variant="contained"
            color="primary"
            startIcon={<PlayArrowRoundedIcon />}
            sx={{ whiteSpace: 'nowrap', fontWeight: 700, px: 2.25 }}
          >
            {t.startPracticing}
          </Button>
          <Button
            component={Link}
            to="/settings"
            variant="outlined"
            color="inherit"
            startIcon={<SettingsOutlinedIcon fontSize="small" />}
            sx={{ whiteSpace: 'nowrap', fontWeight: 600, borderColor: 'divider', px: 2 }}
          >
            {t.settingsBtn}
          </Button>
        </Stack>
      </Stack>

      {/* 1. 4-Column KPI Summary Strip */}
      <Grid container spacing={2} sx={{ mb: 4.5 }}>
        {[
          {
            label: t.kpiSessions,
            value: String(kpis.totalSessions),
            sub:
              kpis.totalSessions > 0
                ? t.kpiSessionsSub.replace('{days}', String(kpis.activeDays))
                : t.kpiSessionsEmpty,
          },
          {
            label: t.kpiAccuracy,
            value: kpis.avgAccuracy !== null ? `${kpis.avgAccuracy}%` : '—',
            sub:
              kpis.bestAccuracy !== null
                ? t.kpiAccuracySub.replace('{best}', String(kpis.bestAccuracy))
                : t.kpiAccuracyEmpty,
          },
          {
            label: t.kpiSpeed,
            value: kpis.avgResponseSec !== null ? `${kpis.avgResponseSec}s` : '—',
            sub:
              kpis.totalAttempts > 0
                ? t.kpiSpeedSub.replace('{attempts}', String(kpis.totalAttempts))
                : t.kpiSpeedEmpty,
          },
          {
            label: t.kpiCoverage,
            value: `${kpis.coveragePct}%`,
            sub: t.kpiCoverageSub
              .replace('{mastered}', String(kpis.masteredPositions))
              .replace('{total}', String(kpis.totalNeckPositions)),
          },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                {kpi.label}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                  mb: 0.75,
                }}
              >
                {kpi.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {kpi.sub}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* 2. Interactive Neck Mastery Map Section */}
      <Box
        component="section"
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 4.5,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontSize: '1.2rem', fontWeight: 800, mb: 0.4 }}>
              {t.neckSectionTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.neckSectionDesc}
            </Typography>
          </Box>

          {/* Mastery Legend */}
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {[
              { color: '#22c55e', label: trainT.masteredLabel },
              { color: '#eab308', label: trainT.improvingLabel },
              { color: '#ef4444', label: trainT.weakSpotLabel },
              { color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)', label: trainT.unpracticedLabel },
            ].map((item) => (
              <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <FretboardHeatmap scaleType={scaleType} rootNote={rootNote} />

        {/* Overlay Controls + Action Row */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                {t.overlayScale}
              </Typography>
              <FormControl size="small" variant="standard">
                <Select
                  value={scaleType}
                  onChange={(e) => setScaleType(e.target.value as ScaleType)}
                  disableUnderline
                  sx={{ fontSize: '0.82rem', fontWeight: 700, minWidth: 110 }}
                >
                  <MenuItem value="none" sx={{ fontSize: '0.82rem' }}>{t.overlayNone}</MenuItem>
                  <MenuItem value="major_pent" sx={{ fontSize: '0.82rem' }}>{t.overlayMajorPent}</MenuItem>
                  <MenuItem value="minor_pent" sx={{ fontSize: '0.82rem' }}>{t.overlayMinorPent}</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {scaleType !== 'none' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {t.overlayRoot}
                </Typography>
                <FormControl size="small" variant="standard">
                  <Select
                    value={rootNote}
                    onChange={(e) => setRootNote(e.target.value)}
                    disableUnderline
                    sx={{ fontSize: '0.82rem', fontWeight: 700, minWidth: 48 }}
                  >
                    {NOTE_NAMES.map((n) => (
                      <MenuItem key={n} value={n} sx={{ fontSize: '0.82rem' }}>
                        {translateNoteName(n, settings.noteNaming)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Stack>

          <Button
            onClick={() => setDrillDialogOpen(true)}
            size="small"
            variant="contained"
            color="primary"
            startIcon={<FitnessCenterRoundedIcon fontSize="small" />}
            sx={{ whiteSpace: 'nowrap', fontWeight: 700, px: 2 }}
          >
            {t.trainWeakSpots}
          </Button>
        </Stack>
      </Box>

      {/* 3. Program Progress Grid */}
      <Box component="section" sx={{ mb: 4.5 }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h5" sx={{ fontSize: '1.2rem', fontWeight: 800, mb: 0.4 }}>
            {t.programsTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.programsSubtitle.replace('{threshold}', String(settings.minUnlockAccuracy))}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {programSummaries.map((prog) => (
            <Grid key={prog.id} size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  p: 2.75,
                  height: '100%',
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1.5} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>
                      {prog.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 700,
                        color: 'primary.main',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {prog.pct}%
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={prog.pct}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.07),
                      mb: 1.5,
                    }}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {t.exercisesDone
                      .replace('{done}', String(prog.done))
                      .replace('{total}', String(prog.total))}
                    {prog.avgAcc !== null && ` · ${t.programAvgAccuracy.replace('{acc}', String(prog.avgAcc))}`}
                    {prog.dueCount > 0 && ` · ${t.programDueReviews.replace('{count}', String(prog.dueCount))}`}
                  </Typography>
                </Box>

                <Box>
                  <Button
                    component={Link}
                    to={`/program/${prog.id}`}
                    size="small"
                    variant="text"
                    color="primary"
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                    sx={{ px: 0, fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {prog.done > 0 ? t.programOpen : t.programStart}
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 4. Two-Column Analytics (Accuracy Trend & Focus Areas) + Recent Session History */}
      <Grid container spacing={2.5} alignItems="stretch">
        {/* Left: Accuracy Trend + Weakest Positions */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2.5} sx={{ height: '100%' }}>
            {/* Accuracy Trend */}
            <Box
              sx={{
                p: 2.75,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {t.trendTitle}
                </Typography>
                {trendPoints.length >= 2 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {t.trendSubtitle.replace('{count}', String(trendPoints.length))}
                  </Typography>
                )}
              </Stack>

              {trendPoints.length >= 2 ? (
                <Box
                  component="svg"
                  viewBox="0 0 380 120"
                  role="img"
                  aria-label={t.trendTitle}
                  sx={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
                >
                  {[20, 60, 100].map((y, idx) => (
                    <g key={y}>
                      <line
                        x1="28"
                        y1={y}
                        x2="372"
                        y2={y}
                        stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y={y + 4}
                        fill={theme.palette.text.secondary}
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {idx === 0 ? '100' : idx === 1 ? '50' : '0'}
                      </text>
                    </g>
                  ))}

                  {(() => {
                    const coords = trendPoints.map((pt, i) => {
                      const x = 34 + (i / (trendPoints.length - 1)) * 332;
                      const y = 100 - (pt.accuracy / 100) * 80;
                      return { x, y, accuracy: pt.accuracy };
                    });
                    const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
                    return (
                      <>
                        <polyline
                          points={polyline}
                          fill="none"
                          stroke={theme.palette.primary.main}
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {coords.map((c, idx) => (
                          <circle
                            key={idx}
                            cx={c.x}
                            cy={c.y}
                            r="3.5"
                            fill={theme.palette.background.paper}
                            stroke={theme.palette.primary.main}
                            strokeWidth="2"
                          />
                        ))}
                      </>
                    );
                  })()}
                </Box>
              ) : (
                <Box sx={{ py: 2.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {t.trendEmptyTitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
                    {t.trendEmptyDesc}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Top Focus Areas (Weakest Positions) */}
            <Box
              sx={{
                p: 2.75,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                flex: 1,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.5 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {t.weakSpotsTitle}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  onClick={() => setDrillDialogOpen(true)}
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', px: 0.75 }}
                >
                  {t.trainWeakSpots}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {t.weakSpotsSubtitle}
              </Typography>

              {weakSpots.length > 0 ? (
                <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
                  {weakSpots.map((item) => (
                    <Stack
                      key={item.key}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 1.25 }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}
                        >
                          {item.noteLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trainT.stringShort.replace('{string}', item.stringLabel)} ·{' '}
                          {item.fret === 0
                            ? trainT.openString
                            : trainT.fretShort.replace('{fret}', String(item.fret))}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: 700,
                            color: item.accuracy < 60 ? 'error.main' : 'warning.main',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {item.accuracy}%
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {item.avgSpeed.toFixed(2)}s · {item.attempts}x
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, lineHeight: 1.6 }}>
                  {t.weakSpotsEmpty}
                </Typography>
              )}
            </Box>
          </Stack>
        </Grid>

        {/* Right: Filterable Recent Session History */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Box
            sx={{
              p: 2.75,
              height: '100%',
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {t.historyTitle}
              </Typography>

              {/* Segmented Filter Control */}
              <Box
                role="tablist"
                aria-label={t.historyTitle}
                sx={{
                  display: 'inline-flex',
                  flexWrap: 'wrap',
                  p: '3px',
                  borderRadius: 1.75,
                  bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.045),
                  border: '1px solid',
                  borderColor: 'divider',
                  gap: 0.25,
                }}
              >
                {[
                  { id: 'all', label: t.filterAll },
                  ...PROGRAMS.map((p) => ({
                    id: p.id,
                    label: programNameById[p.id]?.split(' ')[0] || p.name,
                  })),
                ].map((tab) => {
                  const active = historyFilter === tab.id;
                  return (
                    <Box
                      key={tab.id}
                      component="button"
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setHistoryFilter(tab.id)}
                      sx={{
                        border: 'none',
                        cursor: 'pointer',
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 1.25,
                        fontFamily: 'inherit',
                        fontSize: '0.75rem',
                        fontWeight: active ? 700 : 500,
                        whiteSpace: 'nowrap',
                        color: active ? 'text.primary' : 'text.secondary',
                        bgcolor: active ? 'background.paper' : 'transparent',
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                        '&:hover': { color: 'text.primary' },
                      }}
                    >
                      {tab.label}
                    </Box>
                  );
                })}
              </Box>
            </Stack>

            {filteredHistory.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{t.colDate}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{t.colProgram}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{t.colExercise}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{t.colAccuracy}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{t.colSpeed}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{t.colScore}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredHistory.map((row, idx) => (
                      <TableRow
                        key={`${row.date}-${idx}`}
                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                      >
                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          {formatSessionDate(row.date)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {programNameById[row.programId] || t.freeSessionLabel}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {row.day !== undefined
                            ? t.dayLabel.replace('{day}', String(row.day))
                            : t.freeSessionLabel}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            color:
                              row.accuracy >= settings.minUnlockAccuracy
                                ? 'success.main'
                                : 'text.primary',
                          }}
                        >
                          {Math.round(row.accuracy)}%
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.8rem',
                            color: 'text.secondary',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {row.avgTime ? `${row.avgTime.toFixed(2)}s` : '—'}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {row.score}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  py: 4,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>
                  {t.historyEmptyTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: '48ch', lineHeight: 1.6 }}>
                  {t.historyEmptyDesc}
                </Typography>
                <Button
                  component={Link}
                  to="/program"
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<PlayArrowRoundedIcon />}
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  {t.startFirstSession}
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      <PracticeDrillDialog
        open={drillDialogOpen}
        onClose={() => setDrillDialogOpen(false)}
        onLaunchDrill={handleLaunchDrill}
      />

      <MicPermissionDialog
        open={micDialogOpen}
        onClose={() => {
          setMicDialogOpen(false);
          setPendingDrill(null);
        }}
        onSuccess={handleMicSuccess}
      />
    </Box>
  );
};

export default Profile;
