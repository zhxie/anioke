import React from "react";
import "./App.css";

class App extends React.Component {
  register = false;
  state = {
    ip: "",
    port: 0,

    sequence: 0,
    mv: "",
    lyrics: "",
    offset: 0,
  };

  render() {
    return (
      <div>
        {this.state.mv && (
          <video
            id="video"
            className="video"
            autoPlay
            onEnded={() => {
              window.player.end();
            }}
            controls
          >
            <source src={this.state.mv} type="video/mp4" />
          </video>
        )}
        <p className="overlay">{`${this.state.ip}:${this.state.port}`}</p>
      </div>
    );
  }

  handleServerReady(ip, port) {
    this.setState({
      ip: ip,
      port: port,
    });
  }

  handlePlay(sequence, mv, lyrics, offset) {
    this.setState({
      sequence: sequence,
      mv: mv,
      lyrics: lyrics,
      offset: offset,
    });
  }

  handleStop() {
    this.setState({
      sequence: 0,
      mv: "",
      lyrics: "",
      offset: 0,
    });
  }

  handleSeek() {
    const video = document.getElementById("video");
    if (video) {
      video.currentTime = 0;
      video.play();
    }
  }

  handleSwitchTrack() {
    const video = document.getElementById("video");
    if (video) {
      video.audioTracks[0].enabled = !video.audioTracks[0].enabled;
      video.audioTracks[1].enabled = !video.audioTracks[1].enabled;
      video.currentTime = video.currentTime + 0.01;
      video.play();
    }
  }

  handleOffset(_offset) {}

  async ready() {
    const addr = await window.server.ready();
    this.setState({
      ip: addr.ip,
      port: addr.port,
    });
  }

  componentDidMount() {
    if (!this.register) {
      this.register = true;
      window.player.onPlay((_event, sequence, mv, lyrics, offset) => {
        this.handlePlay(sequence, mv, lyrics, offset);
      });
      window.player.onStop((_event) => {
        this.handleStop();
      });
      window.player.onSeek((_event, time) => {
        this.handleSeek(time);
      });
      window.player.onSwitchTrack((_event) => {
        this.handleSwitchTrack();
      });
      window.player.onOffset((_event, offset) => {
        this.handleOffset(offset);
      });
      this.ready();
    }
  }
}

export default App;
