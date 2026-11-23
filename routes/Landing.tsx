import React, { useMemo } from 'react';
import { Box, Typography, Button, Stack, useTheme, alpha } from '@mui/material';
import Grid from '@mui/material/Grid2';
import * as ReactRouterDOM from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';

import { useStore } from '../state/store';
import { translations } from '../localization/translations';
import { PROGRAMS } from '../data/program30days';

const { Link } = ReactRouterDOM as any;

const SRS_DAYS = [1, 3, 7, 14, 30];

const Landing: React.FC = () => {
  const { settings } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].landing;
  const navT = translations[settings.language].nav;
  const profileT = translations[settings.language].profile;
  const isDark = theme.palette.mode === 'dark';

  const totalExercises = useMemo(
    () =>
      PROGRAMS.reduce(
        (sum, prog) =>
          sum + prog.days.filter((d) => settings.isFiveString || !d.isFiveStringOnly).length,
        0
      ),
    [settings.isFiveString]
  );

  const programMetaMap: Record<string, string> = {
    fretboard: t.programMetaFretboard,
    pentatonic: t.programMetaPentatonic,
    eartraining: t.programMetaEar,
    modes: t.programMetaModes,
  };

  const toolkitItems = [
    {
      title: profileT.title,
      desc: profileT.subtitle,
      to: '/profile',
      icon: <PersonOutlineRoundedIcon fontSize="small" />,
    },
    {
      title: t.toolkitTheoryTitle,
      desc: t.toolkitTheoryDesc,
      to: '/theory',
      icon: <SchoolOutlinedIcon fontSize="small" />,
    },
    {
      title: t.toolkitSettingsTitle,
      desc: t.toolkitSettingsDesc,
      to: '/settings',
      icon: <SettingsOutlinedIcon fontSize="small" />,
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* 1. FULL-WIDTH CENTERED HERO SECTION */}
      <Box
        component="section"
        sx={{
          pt: { xs: 3, md: 7 },
          pb: { xs: 6, md: 9 },
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            mb: 2,
          }}
        >
          {t.heroEyebrow}
        </Typography>

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.4rem', sm: '3.25rem', md: '4rem' },
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            textWrap: 'balance',
            maxWidth: '22ch',
            mx: 'auto',
            mb: 2.5,
          }}
        >
          {t.heroTitle}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '1.02rem', md: '1.15rem' },
            lineHeight: 1.65,
            maxWidth: '64ch',
            mx: 'auto',
            mb: 4,
          }}
        >
          {t.heroSubtitle}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="center"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={Link}
            to="/program"
            startIcon={<PlayArrowRoundedIcon />}
            sx={{
              px: 3.5,
              py: 1.4,
              fontSize: '1rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.ctaPrimary}
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            size="large"
            component={Link}
            to="/theory"
            sx={{
              px: 2.75,
              py: 1.4,
              fontSize: '0.96rem',
              fontWeight: 600,
              borderColor: 'divider',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
              },
            }}
          >
            {t.ctaTheory}
          </Button>

          <Button
            component={Link}
            to="/settings"
            size="medium"
            startIcon={<TuneRoundedIcon sx={{ fontSize: 17 }} />}
            sx={{
              px: 1.5,
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.88rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'transparent',
              },
            }}
          >
            {t.ctaSetup}
          </Button>
        </Stack>

        {/* Quiet Full-Width Fact Strip (Unboxed, Hairline Separated) */}
        <Box
          sx={{
            mt: { xs: 5, md: 7 },
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: { xs: 2, sm: 4 },
            width: '100%',
            maxWidth: 720,
            mx: 'auto',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: { xs: '1.3rem', sm: '1.5rem' },
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {PROGRAMS.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
              {t.statPrograms}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: { xs: '1.3rem', sm: '1.5rem' },
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totalExercises}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
              {t.statExercises}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: { xs: '1.3rem', sm: '1.5rem' },
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              4 / 5
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
              {t.statStrings}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. FOUR STRUCTURED PROGRAMS */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 8 },
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ maxWidth: 680, mx: 'auto', textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.75rem', md: '2.15rem' },
              lineHeight: 1.15,
              textWrap: 'balance',
              mb: 1.25,
            }}
          >
            {t.programsTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            {t.programsSubtitle}
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {PROGRAMS.map((prog, index) => {
            const name =
              settings.language === 'fr'
                ? prog.name_fr || prog.name
                : settings.language === 'es'
                ? prog.name_es || prog.name
                : prog.name;
            const description =
              settings.language === 'fr'
                ? prog.description_fr || prog.description
                : settings.language === 'es'
                ? prog.description_es || prog.description
                : prog.description;

            const availableDays = prog.days.filter(
              (d) => settings.isFiveString || !d.isFiveStringOnly
            ).length;
            const indexLabel = `0${index + 1}.`;

            return (
              <Grid key={prog.id} size={{ xs: 12, md: 6 }}>
                <Box
                  component={Link}
                  to={`/program/${prog.id}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    p: { xs: 2.75, sm: 3.5 },
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.18s ease, transform 0.18s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                    },
                    '&:hover .program-arrow': {
                      transform: 'translateX(4px)',
                      color: theme.palette.primary.main,
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="baseline"
                      spacing={2}
                      sx={{ mb: 1.5 }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          lineHeight: 1.25,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            color: 'primary.main',
                            fontWeight: 700,
                            mr: 1,
                            fontSize: '0.95rem',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {indexLabel}
                        </Box>
                        {name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {t.programExercisesUnit.replace('{count}', String(availableDays))}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.65, mb: 2.5 }}
                    >
                      {description}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {programMetaMap[prog.id] || ''}
                    </Typography>

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      className="program-arrow"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'transform 0.18s ease, color 0.18s ease',
                      }}
                    >
                      <span>{t.programOpenBtn}</span>
                      <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* 3. HOW IT WORKS + RETENTION CURVE & PRACTICE TOOLKIT */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 8 },
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container spacing={{ xs: 5, md: 6 }} alignItems="flex-start">
          {/* Left Column: 3-Step Workflow + Real SRS Retention Curve */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.7rem', md: '2.05rem' },
                lineHeight: 1.15,
                textWrap: 'balance',
                mb: 1.25,
              }}
            >
              {t.howItWorksTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, mb: 4 }}>
              {t.howItWorksSubtitle}
            </Typography>

            <Stack spacing={3} sx={{ mb: 5 }}>
              {[
                { num: '01', title: t.step1Title, desc: t.step1Desc },
                { num: '02', title: t.step2Title, desc: t.step2Desc },
                { num: '03', title: t.step3Title, desc: t.step3Desc },
              ].map((step) => (
                <Box
                  key={step.num}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr',
                    gap: 2,
                    alignItems: 'start',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'primary.main',
                      pt: 0.35,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {step.num}
                  </Typography>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 0.5 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            {/* Clean Vector SRS Retention Graph */}
            <Box
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.srsCurveTitle}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 14, height: 2.5, bgcolor: 'primary.main', borderRadius: 1 }} />
                    <span>{t.srsCurveLegendRetention}</span>
                  </Stack>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box
                      sx={{
                        width: 14,
                        height: 0,
                        borderTop: '2px dashed',
                        borderColor: 'text.disabled',
                      }}
                    />
                    <span>{t.srsCurveLegendDecay}</span>
                  </Stack>
                </Stack>
              </Stack>

              <Box
                component="svg"
                viewBox="0 0 520 132"
                role="img"
                aria-label={t.srsCurveTitle}
                sx={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
              >
                {[24, 62, 100].map((y) => (
                  <line
                    key={y}
                    x1="12"
                    y1={y}
                    x2="508"
                    y2={y}
                    stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}
                    strokeWidth="1"
                  />
                ))}

                <path
                  d="M 24 26 Q 115 96, 260 105 T 496 112"
                  fill="none"
                  stroke={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.26)'}
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />

                <path
                  d="M 24 26 Q 68 58, 96 62 L 96 24 Q 152 46, 196 50 L 196 22 Q 262 39, 316 42 L 316 20 Q 402 32, 496 34"
                  fill="none"
                  stroke={theme.palette.primary.main}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {[
                  { x: 24, y: 26, day: SRS_DAYS[0] },
                  { x: 96, y: 24, day: SRS_DAYS[1] },
                  { x: 196, y: 22, day: SRS_DAYS[2] },
                  { x: 316, y: 20, day: SRS_DAYS[3] },
                  { x: 496, y: 34, day: SRS_DAYS[4] },
                ].map((pt) => (
                  <g key={pt.day}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={theme.palette.background.paper}
                      stroke={theme.palette.primary.main}
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y="126"
                      textAnchor={pt.x === 24 ? 'start' : pt.x === 496 ? 'end' : 'middle'}
                      fill={theme.palette.text.secondary}
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {t.srsDayLabel.replace('{day}', String(pt.day))}
                    </text>
                  </g>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Right Column: Practice Room Toolkit Links */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography
              variant="h5"
              sx={{
                fontSize: '1.25rem',
                fontWeight: 800,
                mb: 2.5,
              }}
            >
              {t.toolkitTitle}
            </Typography>

            <Box
              sx={{
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                overflow: 'hidden',
              }}
            >
              {toolkitItems.map((item, idx) => (
                <Box
                  key={item.to}
                  component={Link}
                  to={item.to}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    p: 2.5,
                    textDecoration: 'none',
                    color: 'inherit',
                    borderTop: idx === 0 ? 'none' : '1px solid',
                    borderColor: 'divider',
                    transition: 'background-color 0.16s ease',
                    '&:hover': {
                      bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.025),
                    },
                    '&:hover .toolkit-arrow': {
                      transform: 'translateX(3px)',
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.75,
                      bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.09),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.98rem' }}>
                        {item.title}
                      </Typography>
                      <ArrowForwardRoundedIcon
                        className="toolkit-arrow"
                        sx={{
                          fontSize: 17,
                          color: 'text.secondary',
                          flexShrink: 0,
                          transition: 'transform 0.16s ease, color 0.16s ease',
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mt: 0.4 }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 4. FOCUSED CLOSING CALL TO ACTION */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 8 },
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            p: { xs: 3.5, md: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          <Box sx={{ maxWidth: 560 }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.55rem', md: '1.9rem' },
                lineHeight: 1.2,
                textWrap: 'balance',
                mb: 1,
              }}
            >
              {t.readyTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {t.readyDesc}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={Link}
              to="/program"
              startIcon={<PlayArrowRoundedIcon />}
              sx={{ px: 3.5, py: 1.35, fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {t.ctaPrimary}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              component={Link}
              to="/settings"
              sx={{
                px: 2.75,
                py: 1.35,
                fontWeight: 600,
                borderColor: 'divider',
                whiteSpace: 'nowrap',
              }}
            >
              {t.ctaSetup}
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* 5. QUIET STUDIO FOOTER */}
      <Box
        component="footer"
        sx={{
          pt: 4,
          pb: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t.footerTagline}
        </Typography>

        <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
          {[
            { label: navT.program, to: '/program' },
            { label: navT.theory, to: '/theory' },
            { label: navT.profile, to: '/profile' },
            { label: navT.settings, to: '/settings' },
            { label: navT.about, to: '/about' },
          ].map((link) => (
            <Typography
              key={link.to}
              component={Link}
              to={link.to}
              variant="caption"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                '&:hover': {
                  color: 'text.primary',
                  textDecoration: 'underline',
                },
              }}
            >
              {link.label}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Landing;