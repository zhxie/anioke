import {
  PlaySquareOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import SubtitlesOctopus from "@jellyfin/libass-wasm";
import { Result, Space, Typography, message } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import "antd/dist/antd.dark.min.css";
import "../antd-overrides.css";
import icon from "../assets/Icon.png";
import PopoverWidget from "../components/PopoverWidget";
import SearchWindow from "../components/SearchWindow";
import PlayControlWindow from "../components/PlayControlWindow";
import PlaylistWindow from "../components/PlaylistWindow";

const { Text, Link } = Typography;

const App = () => {
  const { t } = useTranslation(["player"]);

  const [ip, setIp] = useState("");
  const [port, setPort] = useState(0);
  const [sequence, setSequence] = useState(0);
  const [mv, setMV] = useState("");
  const [mvLoaded, setMVLoaded] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [offset, setOffset] = useState(0);
  const [audioMode, setAudioMode] = useState("original");

  const [showPlaylist, setPlaylist] = useState(false);

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

  const handlePlay = useCallback(
    (_event, sequence, title, artist, mv, lyrics, offset) => {
      setSequence(sequence);
      setMV(mv);
      setMVLoaded(false);
      setLyrics(lyrics);
      setOffset(offset);
      message.open({ content: `${artist} - ${title}` });
    },
    []
  );

  const handleStop = useCallback(
    (_event) => {
      setSequence(0);
      setMV("");
      setMVLoaded(false);
      setLyrics("");
      setOffset(0);
      destroySubtitle();
    },
    [destroySubtitle]
  );

  const handleSeek = useCallback(
    (_event, time) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        video.play();
        if (time === 0) {
          message.open({ content: t("replay") });
        }
      }
    },
    [t]
  );

  const handleSwitchTrack = useCallback(
    (_event) => {
      const video = videoRef.current;
      if (video) {
        const newMode = audioMode === "original" ? "karaoke" : "original";
        setAudioMode(newMode);
        message.open({
          content: t(newMode),
        });
      }
    },
    [audioMode, t]
  );

  const handleOffset = useCallback(
    (_event, newOffset) => {
      const delta = newOffset - offset;
      setOffset(newOffset);
      message.open({
        content:
          delta > 0
            ? t("lyrics_advance", { val: delta })
            : t("lyrics_delay", { val: -delta }),
      });
    },
    [offset, t]
  );

  const onVideoLoad = useCallback(() => {
    setMVLoaded(true);
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

  useEffect(() => {
    if (!mvLoaded) {
      return;
    }
    const video = videoRef.current;
    const targetTrack = audioMode === "original" ? 0 : 1;
    Array.prototype.forEach.call(video.audioTracks, (track, index) => {
      track.enabled = index === targetTrack;
    });
    refreshVideo();
  }, [mvLoaded, audioMode, refreshVideo]);

  return (
    <div className="wrapper">
      {mv ? (
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
      ) : (
        <div className="result-wrapper">
          <Result
            title="Anioke"
            subTitle={
              <Space>
                <Text>{t("order_songs_from_1")}</Text>
                <Link
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `http://${ip}:${port}/web-ui`
                      );
                      message.open({ content: t("copied_to_clipboard") });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >{`http://${ip}:${port}/web-ui`}</Link>
                <Text>{t("order_songs_from_2")}</Text>
              </Space>
            }
            icon={
              <img
                className="anticon"
                src={icon}
                alt={icon}
                width="72px"
                height="72px"
              />
            }
          />
        </div>
      )}
      <div className="popover-widgets-wrapper">
        <Space direction="vertical">
          <PopoverWidget icon={<SearchOutlined />}>
            <SearchWindow
              className="fixed-window"
              addr={`http://${ip}:${port}`}
            />
          </PopoverWidget>
          <PopoverWidget
            icon={<UnorderedListOutlined />}
            onVisibleChange={setPlaylist}
          >
            <PlaylistWindow
              className="fixed-window"
              addr={`http://${ip}:${port}`}
              visibility={showPlaylist}
            />
          </PopoverWidget>
          <PopoverWidget icon={<PlaySquareOutlined />}>
            <PlayControlWindow
              className="window"
              addr={`http://${ip}:${port}`}
            />
          </PopoverWidget>
        </Space>
      </div>
    </div>
  );
};

export default App;
