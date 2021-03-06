import { PlaySquareOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Space } from "antd";
import React, { useState } from "react";
import "./App.css";
import "antd/dist/antd.dark.min.css";
import "../antd-overrides.css";
import {
  DrawerWidget,
  PlayControlWindow,
  PlaylistWindow,
  SearchWindow,
} from "../components";

const App = () => {
  const [showPlaylist, setPlaylist] = useState(false);

  return (
    <div className="wrapper">
      <SearchWindow className="fixed-window" addr="" />
      <div className="drawer-widgets-wrapper">
        <Space direction="vertical">
          <DrawerWidget
            icon={<UnorderedListOutlined />}
            height={480}
            afterVisibleChange={setPlaylist}
          >
            <PlaylistWindow
              className="window"
              addr=""
              visibility={showPlaylist}
            />
          </DrawerWidget>
          <DrawerWidget icon={<PlaySquareOutlined />} height={104}>
            <PlayControlWindow className="window" addr="" />
          </DrawerWidget>
        </Space>
      </div>
    </div>
  );
};

export default App;
