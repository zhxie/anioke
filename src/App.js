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

  handleSwitchTrack() {
    const video = document.getElementById("video");
    video.audioTracks[0].enabled = !video.audioTracks[0].enabled;
    video.audioTracks[1].enabled = !video.audioTracks[1].enabled;
    video.currentTime = video.currentTime + 0.01;
    video.play();
  }

  handleStop() {
    this.setState({
      sequence: 0,
      mv: "",
      lyrics: "",
      offset: 0,
    });
  }

  componentDidMount() {
    if (!this.register) {
      this.register = true;
      window.server.onServerReady((_event, ip, port) => {
        this.handleServerReady(ip, port);
      });
      window.player.onPlay((_event, sequence, mv, lyrics, offset) => {
        this.handlePlay(sequence, mv, lyrics, offset);
      });
      window.player.onSwitchTrack((_event) => {
        this.handleSwitchTrack();
      });
      window.player.onStop((_event) => {
        this.handleStop();
      });
      window.server.ready();
    }
  }
}

export default App;
