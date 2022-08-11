# Anioke

Karaoki your anime songs.

## Usage

```sh
npm install
npm run electron
```

## Configuration

Please refer to [the example config](/config/example.jsonc) for detailed configuration.

## Troubleshoot

- Loss of details in the karaoke track

  If you are using delivered method `remove_center_channel` for vocal removal, you may face with heavy loss of details in the karaoke track. We recommend to use 3rd party vocal removal application like [vocal-remover](https://github.com/tsurumeso/vocal-remover) and [Spleeter](https://github.com/deezer/spleeter). You have to follow their instructions to download files, setup environment, and change the vocal removal method to `custom`. For the custom script, you may change to

  ```sh
  # Windows
  powershell mv -force "${input}" $env:TEMP/audio.wav && powershell <PATH_TO_PYTHON> <PATH_TO_VOCAL_REMOVER>/inference.py -P <PATH_TO_VOCAL_REMOVER>/models/baseline.pth -i $env:TEMP/audio.wav -o $env:TEMP && powershell mv -force $env:TEMP/audio_Instruments.wav "${output}"

  # macOS
  mv "${input}" /tmp/audio.wav && <PATH_TO_PYTHON> <PATH_TO_VOCAL_REMOVER>/inference.py -P <PATH_TO_VOCAL_REMOVER>/models/baseline.pth -i /tmp/audio.wav -o /tmp && mv /tmp/audio_Instruments.wav "${output}"
  ```

  if you are using vocal-remover.

## License

Anioke is licensed under [the MIT License](/LICENSE).

The releases of Anioke deliver executables of [FFmpeg](https://github.com/FFmpeg/FFmpeg) and [yt-dlp](https://github.com/yt-dlp/yt-dlp).
