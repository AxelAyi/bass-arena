
import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, LinearProgress, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PROGRAM_DAYS, DayTask } from '../data/program30days';
import { useStore } from '../state/store';
import SessionRunner from '../components/SessionRunner';
import { getAllPositionsInRanges, FretPosition } from '../data/fretboard';

const Program: React.FC = () => {
  const { history } = useStore();
  const [activeTask, setActiveTask] = useState<DayTask | null>(null);

  const completedDays = history.map(h => h.day).filter(d => d !== undefined) as number[];
  const progressPercent = (completedDays.length / 30) * 100;

  const handleStartTask = (task: DayTask) => {
    // Basic logic: only allow if previous day is completed or it's day 1
    const isLocked = task.day > 1 && !completedDays.includes(task.day - 1);
    if (!isLocked) {
      setActiveTask(task);
    }
  };

  const generateQuestions = (task: DayTask): FretPosition[] => {
    const pool = getAllPositionsInRanges(task.fretRange[1], task.strings)
      .filter(p => p.fret >= task.fretRange[0]);
    
    let filteredPool = pool;
    if (task.focusNotes && task.focusNotes.length > 0) {
      filteredPool = pool.filter(p => task.focusNotes!.includes(p.noteName));
    }

    // Pick 10 random from pool
    const shuffled = [...filteredPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  };

  if (activeTask) {
    return (
      <SessionRunner 
        questions={generateQuestions(activeTask)} 
        onFinish={() => setActiveTask(null)}
        day={activeTask.day}
      />
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">30-Day Program</Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Master the fretboard one day at a time.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 10, borderRadius: 5 }} />
          </Box>
          <Typography variant="body2">{completedDays.length}/30 Days</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {PROGRAM_DAYS.map((task) => {
          const isCompleted = completedDays.includes(task.day);
          const isLocked = task.day > 1 && !completedDays.includes(task.day - 1) && !isCompleted;
          
          return (
            /* Fix: Replaced individual breakpoint props with 'size' for MUI v6 Grid compatibility */
            <Grid key={task.day}>
              <Card 
                sx={{ 
                  height: '100%', 
                  opacity: isLocked ? 0.6 : 1,
                  bgcolor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'background.paper',
                  border: isCompleted ? '1px solid rgba(76, 175, 80, 0.3)' : 'none'
                }}
              >
                <CardActionArea onClick={() => handleStartTask(task)} disabled={isLocked} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="overline" color="primary" fontWeight="bold">Day {task.day}</Typography>
                      {isCompleted && <CheckCircleIcon color="success" fontSize="small" />}
                      {isLocked && <LockIcon color="disabled" fontSize="small" />}
                    </Box>
                    <Typography variant="h6" gutterBottom>{task.title}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={`Frets ${task.fretRange[0]}-${task.fretRange[1]}`} size="small" variant="outlined" />
                      {task.focusNotes && <Chip label={`Focus: ${task.focusNotes.join(',')}`} size="small" variant="outlined" color="secondary" />}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Program;