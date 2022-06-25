import React from "react";
import "./App.css";

class App extends React.Component {
  render() {
    return (
      <div>
        <video className="video" />
        <p className="overlay">{`${window.ip}:${window.port}`}</p>
      </div>
    );
  }
}

export default App;
