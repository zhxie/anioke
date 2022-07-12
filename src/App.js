import SubtitlesOctopus from "@jellyfin/libass-wasm";
import { Result, message } from "antd";
import React from "react";
import { withTranslation } from "react-i18next";
import "antd/dist/antd.dark.min.css";
import "./App.css";

class App extends React.Component {
  state = {
    ip: "",
    port: 0,

    sequence: 0,
    mv: "",
    lyrics: "",
    offset: 0,
  };

  register = false;
  videoRef = React.createRef();
  lyrics;

  componentDidMount() {
    if (!this.register) {
      this.register = true;
      window.player.onPlay(this.handlePlay);
      window.player.onStop(this.handleStop);
      window.player.onSeek(this.handleSeek);
      window.player.onSwitchTrack(this.handleSwitchTrack);
      window.player.onOffset(this.handleOffset);
      this.ready();
    }
  }

  componentDidUpdate() {
    this.refreshLyrics();
  }

  render() {
    return (
      <div className="video-wrapper">
        {this.state.mv ? (
          <video
            id="video"
            ref={this.videoRef}
            className="video"
            autoPlay
            onEnded={() => {
              window.player.end();
            }}
            onLoadedData={this.onVideoLoad}
          >
            <source src={this.state.mv} type="video/mp4" />
          </video>
        ) : (
          <div className="result-wrapper">
            <Result
              title="Anioke"
              subTitle={`${this.state.ip}:${this.state.port}`}
              icon={
                <svg
                  className="anticon"
                  viewBox="0 0 72 72"
                  width="1em"
                  height="1em"
                >
                  <circle cx="50%" cy="50%" r="50%" fill="#39c5bb" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    );
  }

  onVideoLoad = () => {
    this.refreshLyrics();
  };

  refreshLyrics = () => {
    this.destroyLyrics();
    if (!this.state.lyrics) {
      return;
    }
    const video = this.videoRef.current;
    const opts = {
      video: video,
      subUrl: this.state.lyrics,
      fonts: ["fonts/SourceHanSerif-Regular.ttc"],
      workerUrl: "subtitles-octopus-worker.js",
      timeOffset: this.state.offset,
      targetFps: 60,
    };
    this.lyrics = new SubtitlesOctopus(opts);
    this.refreshVideo();
  };

  destroyLyrics = () => {
    if (this.lyrics) {
      this.lyrics.dispose();
      this.lyrics = undefined;
    }
  };

  refreshVideo = () => {
    const video = this.videoRef.current;
    if (video) {
      video.currentTime = video.currentTime + 0.01;
      video.play();
    }
  };

  handlePlay = (_event, sequence, title, artist, mv, lyrics, offset) => {
    this.setState({
      sequence: sequence,
      mv: mv,
      lyrics: lyrics,
      offset: offset,
    });
    message.open({ content: `${title} - ${artist}` });
  };

  handleStop = (_event) => {
    this.destroyLyrics();
    this.setState({
      sequence: 0,
      mv: "",
      lyrics: "",
      offset: 0,
    });
  };

  handleSeek = (_event, time) => {
    const video = this.videoRef.current;
    if (video) {
      video.currentTime = time;
      video.play();
      if (time === 0) {
        message.open({ content: this.props.t("replay") });
      }
    }
  };

  handleSwitchTrack = (_event) => {
    const video = this.videoRef.current;
    if (video) {
      const prev = video.audioTracks[0].enabled;
      video.audioTracks[0].enabled = !prev;
      video.audioTracks[1].enabled = prev;
      this.refreshVideo();
      message.open({
        content: prev ? this.props.t("karaoke") : this.props.t("original"),
      });
    }
  };

  handleOffset = (_event, offset) => {
    const delta = offset - this.state.offset;
    this.setState({
      offset: offset,
    });
    message.open({
      content:
        delta > 0
          ? this.props.t("subtitles_advance", { val: delta })
          : this.props.t("subtitles_delay", { val: -delta }),
    });
  };

  ready = async () => {
    const addr = await window.server.ready();
    this.setState({
      ip: addr.ip,
      port: addr.port,
    });
  };
}

export default withTranslation()(App);
