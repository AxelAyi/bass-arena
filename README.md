
# BassArena: 30-Day Fretboard Trainer

An interactive, real-time pitch-tracking application designed to help bassists memorize the fretboard.

## Features
- **30-Day Guided Curriculum**: Progressively learn the neck from open strings to chromatic patterns.
- **Real-time Pitch Detection**: Uses a high-performance YIN algorithm implemented in TypeScript.
- **Customizable Engine**: Fine-tune RMS thresholds (noise gate), pitch stability, and tolerances for your specific instrument and room.
- **Progress Tracking**: All history and settings are stored locally in your browser.

## How to use
1. Connect your bass to an audio interface (recommended) or use a high-quality microphone.
2. Go to **Settings** and click **Enable Microphone**.
3. Select your audio interface from the dropdown.
4. Play a note to test the VU meter. Adjust the "Noise Gate" if the indicator flickers when you aren't playing.
5. Start a Day from the **Program** tab or set up a custom drill in **Free Training**.

## Tech Stack
- React 19 & TypeScript
- Material UI (MUI) v6
- Zustand (Global State)
- Web Audio API (Native browser audio processing)
- OpenSheetMusicDisplay (Music notation rendering)

## Troubleshooting
- **Safari Support**: Safari requires an explicit user interaction (button click) to resume the AudioContext. If audio doesn't work, ensure you've clicked a button on the screen.
- **Latency**: Audio interfaces provide much better results than built-in laptop mics.
- **Noise**: If the "Detected Note" jumps around, increase the "Noise Gate" in Settings or ensure you are in a quiet room.
- **Octave Errors**: Bass frequencies are very low (E1 = ~41Hz). BassArena handles this by prioritizing fundamental detection, but you can turn off "Strict Octave" in settings if you want to practice regardless of octave position.

---

Made with ❤️ by Axel A.
