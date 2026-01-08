import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Divider, List, ListItem, ListItemText, 
  ListItemButton, useTheme, useMediaQuery, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, Stack
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SchoolIcon from '@mui/icons-material/School';
import InfoIcon from '@mui/icons-material/Info';
import NavigationIcon from '@mui/icons-material/Navigation';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ConstructionIcon from '@mui/icons-material/Construction';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExploreIcon from '@mui/icons-material/Explore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TuneIcon from '@mui/icons-material/Tune';
import { useStore } from '../state/store';
import { translateTextWithNotes, translateNoteName, NOTE_NAMES_ENGLISH } from '../audio/noteUtils';
import { translations } from '../localization/translations';
import SheetMusic from '../components/SheetMusic';

const Theory: React.FC = () => {
  const { settings } = useStore();
  const theme = useTheme();
  // Fix: Cast theme to any to access breakpoints if standard Theme type is restricted
  const isMobile = useMediaQuery((theme as any).breakpoints.down('md'));
  const t = translations[settings.language].theory;
  
  const [explorerRoot, setExplorerRoot] = useState('C');
  const [explorerType, setExplorerType] = useState<'major' | 'minor'>('major');

  const translate = useMemo(() => (text: string) => {
    return translateTextWithNotes(text, settings.noteNaming);
  }, [settings.noteNaming]);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'detection', label: t.navDetection, icon: <TuneIcon fontSize="small" /> },
    { id: 'basics', label: t.navBasics, icon: <InfoIcon fontSize="small" /> },
    { id: 'reading', label: t.navReading, icon: <LibraryMusicIcon fontSize="small" /> },
    { id: 'geometry', label: t.navGeometry, icon: <NavigationIcon fontSize="small" /> },
    { id: 'construction', label: t.navConstruction, icon: <ConstructionIcon fontSize="small" /> },
    { id: 'pentatonic', label: t.navPentatonic, icon: <AutoAwesomeIcon fontSize="small" /> },
    { id: 'library', label: t.navLibrary, icon: <MenuBookIcon fontSize="small" /> },
    { id: 'memorizing', label: t.navMemorizing, icon: <PsychologyIcon fontSize="small" /> },
    { id: 'explorer', label: t.scaleExplorer, icon: <ExploreIcon fontSize="small" /> },
  ];

  const explorerMidiNotes = useMemo(() => {
    const rootIndex = NOTE_NAMES_ENGLISH.indexOf(explorerRoot);
    let startMidi = rootIndex + 24; 
    if (startMidi < 28) startMidi += 12;
    const majorIntervals = [0, 2, 4, 7, 9, 12];
    const minorIntervals = [0, 3, 5, 7, 10, 12];
    const intervals = explorerType === 'major' ? majorIntervals : minorIntervals;
    return intervals.map(v => startMidi + v);
  }, [explorerRoot, explorerType]);

  const getPentatonicNotes = (root: string, type: 'major' | 'minor') => {
    const rootIdx = NOTE_NAMES_ENGLISH.indexOf(root);
    const intervals = type === 'major' ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10];
    return intervals.map(i => translateNoteName(NOTE_NAMES_ENGLISH[(rootIdx + i) % 12], settings.noteNaming)).join(' - ');
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <SchoolIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1 }}>{t.title}</Typography>
      </Box>

      <Grid container spacing={3}>
        {!isMobile && (
          <Grid size={{ md: 3 }}>
            <Box sx={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <List component="nav" sx={{ p: 0 }}>
                  <ListItem sx={{ bgcolor: 'primary.main', py: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'primary.contrastText', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {t.modules}
                    </Typography>
                  </ListItem>
                  {navItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItemButton onClick={() => scrollTo(item.id)} sx={{ py: 1 }}>
                        <Box sx={{ mr: 1.5, display: 'flex', color: 'primary.main' }}>{item.icon}</Box>
                        <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'caption', fontWeight: 700 }} />
                      </ListItemButton>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 9 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <section id="detection">
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TuneIcon /> {t.navDetection}
                </Typography>
                <Typography variant="body2" paragraph color="textSecondary">
                  {t.detectionDesc}
                </Typography>

                <Grid container spacing={2}>
                  {[
                    { icon: <TuneIcon color="primary" />, text: t.tipTuner },
                    { icon: <InfoIcon color="primary" />, text: t.tipVolume },
                    { icon: <LibraryMusicIcon color="primary" />, text: t.tipMuting },
                    { icon: <LightbulbIcon color="primary" />, text: t.tipNoise },
                  ].map((tip, idx) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid divider', height: '100%', display: 'flex', gap: 2 }}>
                        <Box sx={{ mt: 0.5 }}>{tip.icon}</Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{tip.text}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </section>

            <section id="basics">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>{t.navBasics}</Typography>
                <Typography variant="body2" paragraph color="textSecondary">{t.basicsDesc}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid divider', height: '100%' }}>
                      <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>{t.stringsTitle}</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontWeight: 600 }}>
                        {settings.isFiveString ? (
                          `1. ${translateNoteName('G', settings.noteNaming)} (${settings.language === 'en' ? 'High' : (settings.language === 'fr' ? 'Aigu' : 'Aguda')})\n2. ${translateNoteName('D', settings.noteNaming)}\n3. ${translateNoteName('A', settings.noteNaming)}\n4. ${translateNoteName('E', settings.noteNaming)}\n5. ${translateNoteName('B', settings.noteNaming)} (${settings.language === 'en' ? 'Low' : (settings.language === 'fr' ? 'Grave' : 'Grave')})`
                        ) : (
                          `1. ${translateNoteName('G', settings.noteNaming)} (${settings.language === 'en' ? 'High' : (settings.language === 'fr' ? 'Aigu' : 'Aguda')})\n2. ${translateNoteName('D', settings.noteNaming)}\n3. ${translateNoteName('A', settings.noteNaming)}\n4. ${translateNoteName('E', settings.noteNaming)} (${settings.language === 'en' ? 'Low' : (settings.language === 'fr' ? 'Grave' : 'Grave')})`
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid divider', height: '100%' }}>
                      <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>{t.halfStepTitle}</Typography>
                      <Typography variant="caption" paragraph color="textSecondary">{t.halfStepDesc}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip label={translate("B-C")} size="small" color="secondary" sx={{ fontWeight: 700, borderRadius: 1 }} />
                        <Chip label={translate("E-F")} size="small" color="secondary" sx={{ fontWeight: 700, borderRadius: 1 }} />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </section>

            <section id="reading">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>{t.navReading}</Typography>
                <Typography variant="body2" paragraph color="textSecondary">{t.readingDesc}</Typography>
                <Box>
                  <Typography variant="subtitle2" fontWeight="800" gutterBottom>{t.exCMajor}</Typography>
                  <SheetMusic midiNotes={[28, 30, 32, 33, 35, 37, 39, 40]} currentIndex={-1} isFiveString={settings.isFiveString} />
                </Box>
              </Paper>
            </section>

            <section id="geometry">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>{t.navGeometry}</Typography>
                <Typography variant="body2" paragraph color="textSecondary">{t.geometryDesc}</Typography>
                <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                  <Typography variant="subtitle1" color="primary" fontWeight="800">{t.ruleOf5}</Typography>
                  <Typography variant="body2">{t.ruleOf5Desc}</Typography>
                </Box>
              </Paper>
            </section>

            <section id="construction">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>{t.constructionTitle}</Typography>
                <Typography variant="body2" paragraph color="textSecondary">{t.constructionDesc}</Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" fontWeight="800" color="secondary" gutterBottom>{t.majorPattern}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {['W', 'W', 'H', 'W', 'W', 'W', 'H'].map((step, idx) => (
                      <Chip key={idx} label={step} size="small" color={step === 'W' ? 'primary' : 'secondary'} sx={{ fontWeight: 800, width: 32, borderRadius: 1 }} />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>{t.exCMajorFull}</Typography>
                  <SheetMusic midiNotes={[36, 38, 40, 41, 43, 45, 47, 48]} currentIndex={-1} isFiveString={settings.isFiveString} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="800" color="secondary" gutterBottom>{t.minorPattern}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {['W', 'H', 'W', 'W', 'H', 'W', 'W'].map((step, idx) => (
                      <Chip key={idx} label={step} size="small" color={step === 'W' ? 'primary' : 'secondary'} sx={{ fontWeight: 800, width: 32, borderRadius: 1 }} />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>{t.exCMinorFull}</Typography>
                  <SheetMusic midiNotes={[36, 38, 39, 41, 43, 44, 46, 48]} currentIndex={-1} isFiveString={settings.isFiveString} />
                </Box>
              </Paper>
            </section>

            <section id="pentatonic">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>{t.navPentatonic}</Typography>
                <Typography variant="body2" paragraph color="textSecondary">{t.pentatonicDesc}</Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid divider', height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>{t.majorPentFormula}</Typography>
                      <Typography variant="body2" color="textSecondary">{t.majorPentLogic}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid divider', height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>{t.minorPentFormula}</Typography>
                      <Typography variant="body2" color="textSecondary">{t.minorPentLogic}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(156, 39, 176, 0.05)', borderRadius: 2, borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                  <Typography variant="subtitle2" color="secondary" fontWeight="800">{t.guessingTitle}</Typography>
                  <Typography variant="body2">{t.guessingMajor}</Typography>
                  <Typography variant="body2">{t.guessingMinor}</Typography>
                </Box>
              </Paper>
            </section>

            <section id="library">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>{t.navLibrary}</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mt: 1 }}>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{t.key}</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{t.majorPent}</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{t.minorPent}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {NOTE_NAMES_ENGLISH.slice(0, 12).map((note) => (
                        <TableRow key={note} hover><TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>{translateNoteName(note, settings.noteNaming)}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{getPentatonicNotes(note, 'major')}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{getPentatonicNotes(note, 'minor')}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </section>

            <section id="memorizing">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>
                  {t.navMemorizing}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {t.libraryDesc}
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <AutoAwesomeIcon color="secondary" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="800">{t.relativeHack}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {t.relativeHackDesc}
                    </Typography>
                    <Box sx={{ mt: 1.5, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed divider' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>{t.navBasics} (Example):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {translate("C")} {t.majorPent} = {translate("A")} {t.minorPent}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">Notes: {translate("C - D - E - G - A")}</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <NavigationIcon color="secondary" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="800">{t.visualBoxShapes}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {t.visualBoxShapesDesc}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <LightbulbIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ color: '#e65100', fontWeight: 800 }}>{t.proTipTitle}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#e65100' }}>
                      {t.proTipDesc}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </section>

            <section id="explorer">
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="800" sx={{ mb: 2 }}>
                  {t.scaleExplorer}
                </Typography>
                <Typography variant="body2" paragraph color="textSecondary">
                  {t.scaleExplorerDesc}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t.rootNote}</InputLabel>
                      <Select
                        value={explorerRoot}
                        label={t.rootNote}
                        onChange={(e) => setExplorerRoot(e.target.value)}
                        sx={{ fontWeight: 700 }}
                      >
                        {NOTE_NAMES_ENGLISH.map(note => (
                          <MenuItem key={note} value={note}>
                            {translateNoteName(note, settings.noteNaming)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t.scaleType}</InputLabel>
                      <Select
                        value={explorerType}
                        label={t.scaleType}
                        onChange={(e) => setExplorerType(e.target.value as 'major' | 'minor')}
                        sx={{ fontWeight: 700 }}
                      >
                        <MenuItem value="major">{t.majorPent}</MenuItem>
                        <MenuItem value="minor">{t.minorPent}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <SheetMusic 
                  midiNotes={explorerMidiNotes} 
                  currentIndex={-1} 
                  isFiveString={settings.isFiveString} 
                />
              </Paper>
            </section>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Theory;
