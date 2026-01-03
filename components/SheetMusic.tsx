
import React, { useEffect, useRef } from 'react';
import { Box, Paper, CircularProgress, Typography, useTheme } from '@mui/material';
import * as OSMDNamespace from 'opensheetmusicdisplay';
import { generateMusicXML } from '../audio/noteUtils';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

interface SheetMusicProps {
  midiNotes: number[];
  currentIndex: number;
  isFiveString?: boolean;
}

const SheetMusic: React.FC<SheetMusicProps> = ({ midiNotes, currentIndex, isFiveString = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<any>(null);
  const [loading, setLoading] = React.useState(true);
  const { settings } = useStore();
  const t = translations[settings.language].session;
  const theme = useTheme();

  useEffect(() => {
    const initOSMD = async () => {
      if (!containerRef.current) return;

      try {
        // Handle various ESM/CJS export patterns from CDNs
        const OSMDClass = (OSMDNamespace as any).OpenSheetMusicDisplay || 
                          (OSMDNamespace as any).default?.OpenSheetMusicDisplay || 
                          (OSMDNamespace as any).default;

        if (typeof OSMDClass !== 'function') {
          throw new Error("OpenSheetMusicDisplay constructor not found in imported module.");
        }

        if (osmdRef.current) {
          try {
            osmdRef.current.cursor?.hide();
          } catch (e) {}
          containerRef.current.innerHTML = '';
        }

        osmdRef.current = new OSMDClass(containerRef.current, {
          autoResize: true,
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawMetronomeMarks: false,
          renderBackend: 'svg',
          cursorsOptions: [{ 
            type: 1, 
            color: theme.palette.primary.main, 
            alpha: 0.6, 
            follow: true 
          }]
        });

        if (midiNotes.length > 0) {
          const xml = generateMusicXML(midiNotes, isFiveString, settings.noteNaming);
          await osmdRef.current.load(xml);
          osmdRef.current.render();
          
          setTimeout(() => {
            if (osmdRef.current && osmdRef.current.cursor) {
              const cursor = osmdRef.current.cursor;
              cursor.show();
              cursor.reset();
              for (let i = 0; i < currentIndex; i++) {
                cursor.next();
              }
            }
          }, 400);
        }
        setLoading(false);
      } catch (err) {
        console.error("OSMD Init/Load Error:", err);
        setLoading(false);
      }
    };

    initOSMD();

    return () => {
      if (osmdRef.current) {
        try {
          osmdRef.current.cursor?.hide();
        } catch (e) {}
      }
    };
  }, [midiNotes, isFiveString, settings.noteNaming, theme.palette.primary.main]);

  useEffect(() => {
    if (osmdRef.current && osmdRef.current.cursor && !loading) {
      try {
        const cursor = osmdRef.current.cursor;
        cursor.reset();
        for (let i = 0; i < currentIndex; i++) {
          cursor.next();
        }
        cursor.show();
      } catch (e) {
        console.warn("OSMD Cursor sync error:", e);
      }
    }
  }, [currentIndex, loading]);

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 1, 
        bgcolor: '#fff', 
        borderRadius: 2, 
        overflow: 'hidden', 
        minHeight: 280, 
        mb: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        width: '100%'
      }}
    >
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.9)',
            zIndex: 10
          }}
        >
          <CircularProgress size={32} sx={{ mb: 1 }} />
          <Typography variant="caption" color="textSecondary">{t.loadingNotation}</Typography>
        </Box>
      )}
      
      <Box 
        sx={{ 
          width: '100%', 
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: '6px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '10px' },
        }}
      >
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%',
            minWidth: '600px', 
            minHeight: '240px',
            display: 'block'
          }} 
        />
      </Box>
    </Paper>
  );
};

export default SheetMusic;
