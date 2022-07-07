import SubtitlesOctopus from "libass-wasm";
import React from "react";
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
      <div className="wrapper">
        {this.state.mv && (
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
        )}
        <p className="overlay">{`${this.state.ip}:${this.state.port}`}</p>
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

  handlePlay = (_event, sequence, mv, lyrics, offset) => {
    this.setState({
      sequence: sequence,
      mv: mv,
      lyrics: lyrics,
      offset: offset,
    });
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
    }
  };

  handleSwitchTrack = (_event) => {
    const video = this.videoRef.current;
    if (video) {
      video.audioTracks[0].enabled = !video.audioTracks[0].enabled;
      video.audioTracks[1].enabled = !video.audioTracks[1].enabled;
      this.refreshVideo();
    }
  };

  handleOffset = (_event, offset) => {
    this.setState({
      offset: offset,
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

export default App;
