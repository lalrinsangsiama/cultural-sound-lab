# Demo Audio Files

This directory contains demo audio files used by the MockGenerationService for testing the complete generation flow without requiring the AI service.

## Files

- `sound-logo-demo.mp3` - 10-second demo sound logo
- `social-clip-demo.mp3` - 30-second demo social media clip  
- `long-form-demo.mp3` - 2-minute demo long-form content
- `playlist-demo.m3u8` - Demo playlist with 3 tracks

## Usage

These files are served by the API when the MockGenerationService is active (when AI_SERVICE_URL is not configured or AI service is unavailable).

The files simulate realistic generation outputs for each type of content.