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

  If you are using delivered method `remove_center_channel` for vocal removal, you may face with heavy loss of details in the karaoke track. We recommend to use 3rd party vocal removal application like [Spleeter](https://github.com/deezer/spleeter), [vocal-remover](https://github.com/tsurumeso/vocal-remover) and [Open-Unmix](https://github.com/sigsep/open-unmix-pytorch). You have to follow their instructions to download files, setup environment, and change the vocal removal method to `custom`. For the custom script, if you are using macOS, you may change to the following scripts.

  ```sh
  # All the following scripts are based on macOS.
  # Spleeter
  mv "${input}" /tmp/audio.wav && <PATH_TO_SPLEETER> separate -p spleeter:2stems -o /tmp /tmp/audio.wav && mv /tmp/audio/accompaniment.wav "${output}"

  # vocal-remover
  mv "${input}" /tmp/audio.wav && <PATH_TO_PYTHON> <PATH_TO_VOCAL_REMOVER>/inference.py -P <PATH_TO_VOCAL_REMOVER>/models/baseline.pth -i /tmp/audio.wav -o /tmp && mv /tmp/audio_Instruments.wav "${output}"

  # Open-Unmix
  mv "${input}" /tmp/audio.wav && cd /tmp && <PATH_TO_OPEN_UNMIX> /tmp/audio.wav --targets vocals --residual 1 && mv /tmp/audio_umxl/residual.wav "${output}"
  ```

- Cannot open on macOS

  If macOS tells you the application is broken and needs to be deleted, please follow the steps below:

  1. Open your terminal
  2. Execute `sudo xattr -d com.apple.quarantine /Applications/Anioke.app`
  3. Reopen Anioke

## License

Anioke is licensed under [the MIT License](/LICENSE).

The releases of Anioke deliver executables of [FFmpeg](https://github.com/FFmpeg/FFmpeg) and [yt-dlp](https://github.com/yt-dlp/yt-dlp).
