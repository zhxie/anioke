import SubtitlesOctopus from "@jellyfin/libass-wasm";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const App = () => {
  const [ip, setIp] = useState("");
  const [port, setPort] = useState(0);
  const [sequence, setSequence] = useState(0);
  const [mv, setMv] = useState("");
  const [mvLoaded, setMvLoaded] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [offset, setOffset] = useState(0);

  const videoRef = useRef();
  const subtitleRef = useRef();

  const ready = useCallback(async () => {
    const addr = await window.server.ready();
    setIp(addr.ip);
    setPort(addr.port);
  }, []);

  const refreshVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = video.currentTime + 0.01;
      video.play();
    }
  }, []);

  const destroySubtitle = useCallback(() => {
    if (subtitleRef.current) {
      subtitleRef.current.dispose();
      subtitleRef.current = undefined;
    }
  }, []);

  const refreshSubtitle = useCallback(() => {
    destroySubtitle();
    if (!lyrics || !mvLoaded) {
      return;
    }
    const video = videoRef.current;
    const opts = {
      video: video,
      subUrl: lyrics,
      fonts: ["fonts/SourceHanSerif-Regular.ttc"],
      workerUrl: "subtitles-octopus-worker.js",
      timeOffset: offset,
      targetFps: 60,
    };
    subtitleRef.current = new SubtitlesOctopus(opts);
    refreshVideo();
  }, [destroySubtitle, lyrics, mvLoaded, offset, refreshVideo]);

  const handlePlay = useCallback((_event, sequence, mv, lyrics, offset) => {
    setSequence(sequence);
    setMv(mv);
    setMvLoaded(false);
    setLyrics(lyrics);
    setOffset(offset);
  }, []);

  const handleStop = useCallback(
    (_event) => {
      setSequence(0);
      setMv("");
      setMvLoaded(false);
      setLyrics("");
      setOffset(0);
      destroySubtitle();
    },
    [destroySubtitle]
  );

  const handleSeek = useCallback((_event, time) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      video.play();
    }
  }, []);

  const handleSwitchTrack = useCallback(
    (_event) => {
      const video = videoRef.current;
      if (video) {
        video.audioTracks[0].enabled = !video.audioTracks[0].enabled;
        video.audioTracks[1].enabled = !video.audioTracks[1].enabled;
        refreshVideo();
      }
    },
    [refreshVideo]
  );

  const handleOffset = useCallback((_event, offset) => {
    setOffset(offset);
  }, []);

  const onVideoLoad = useCallback(() => {
    setMvLoaded(true);
  }, []);

  useEffect(() => {
    window.player.onPlay(handlePlay);
    window.player.onStop(handleStop);
    window.player.onSeek(handleSeek);
    window.player.onSwitchTrack(handleSwitchTrack);
    window.player.onOffset(handleOffset);
    ready();
    return () => {
      window.player.removeAllControllerBinds();
    };
  }, [
    handleOffset,
    handlePlay,
    handleSeek,
    handleStop,
    handleSwitchTrack,
    ready,
  ]);

  useEffect(() => {
    if (!mv || !lyrics) {
      destroySubtitle();
    } else {
      refreshSubtitle();
    }
  }, [mv, lyrics, destroySubtitle, refreshSubtitle]);

  return (
    <div className="wrapper">
      {mv && (
        <video
          id="video"
          key={sequence}
          ref={videoRef}
          className="video"
          autoPlay
          onEnded={() => {
            window.player.end();
          }}
          onLoadedData={onVideoLoad}
        >
          <source src={mv} type="video/mp4" />
        </video>
      )}
      <p className="overlay">{`${ip}:${port}`}</p>
    </div>
  );
};

export default App;
