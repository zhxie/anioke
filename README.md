# Anioke

Karaoki your anime songs.

## Usage

```sh
npm install
npm run electron
```

## Build

```sh
npm install
npm build
npm exec electron-builder -- -p never
```

## Configuration

Please refer to [the example config](/config/example.jsonc) for detailed configuration.

## Troubleshoot

- Loss of details in the karaoke track

  You may face with heavy loss of details in the karaoke track using delivered method `remove_center_channel` for vocal removal. Therefore, we recommend to use 3rd party vocal removal application like [Spleeter](https://github.com/deezer/spleeter), [vocal-remover](https://github.com/tsurumeso/vocal-remover) and [Open-Unmix](https://github.com/sigsep/open-unmix-pytorch). You have to follow their instructions to download files, setup environment, and change the vocal removal method to `custom` and fill scripts as the following examples.

  ```sh
  # The following scripts are based on Windows.
  # Open-Unmix
  powershell mv -force "${input}" $env:TEMP/audio.wav && cd %TEMP% && <PATH_TO_OPEN_UNMIX> audio.wav --targets vocals --residual 1 && powershell mv -force ./audio_umxl/residual.wav "${output}"

  # The following scripts are based on macOS.
  # Spleeter
  mv "${input}" /tmp/audio.wav && <PATH_TO_SPLEETER> separate -p spleeter:2stems -o /tmp /tmp/audio.wav && mv /tmp/audio/accompaniment.wav "${output}"

  # vocal-remover
  mv "${input}" /tmp/audio.wav && <PATH_TO_PYTHON> <PATH_TO_VOCAL_REMOVER>/inference.py -P <PATH_TO_VOCAL_REMOVER>/models/baseline.pth -i /tmp/audio.wav -o /tmp && mv /tmp/audio_Instruments.wav "${output}"

  # Open-Unmix
  mv "${input}" /tmp/audio.wav && cd /tmp && <PATH_TO_OPEN_UNMIX> audio.wav --targets vocals --residual 1 && mv ./audio_umxl/residual.wav "${output}"
  ```

- Cannot be opened on macOS

  If macOS tells you Anioke is damaged and cannot be opened, please execute the following script in terminal to fix.

  ```sh
  sudo xattr -d com.apple.quarantine /Applications/Anioke.app
  ```

## License

Anioke is licensed under [the MIT License](/LICENSE).

The releases of Anioke deliver executables of [FFmpeg](https://github.com/FFmpeg/FFmpeg) and [yt-dlp](https://github.com/yt-dlp/yt-dlp).
