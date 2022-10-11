import { PlaySquareOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Segmented, Space } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import "antd/dist/antd.dark.min.css";
import "../antd-overrides.css";
import {
  DrawerWidget,
  LibraryWindow,
  PlayControlWindow,
  PlaylistWindow,
  SearchWindow,
} from "../components";
import { options } from "../utils";
import { initService } from "../utils";

const Tab = {
  Library: "library",
  Search: "search",
};

initService({
  baseUrl: "",
});

const App = () => {
  const { t } = useTranslation(["webUI"]);

  const [tab, setTab] = useState(Tab.Library);
  const [showPlaylist, setPlaylist] = useState(false);

  return (
    <div className="wrapper">
      <Segmented
        block
        onChange={setTab}
        options={options([Tab.Library, Tab.Search], t)}
        value={tab}
      />
      {tab === Tab.Library && <LibraryWindow className="fixed-window" />}
      {tab === Tab.Search && <SearchWindow className="fixed-window" />}
      <div className="drawer-widgets-wrapper">
        <Space direction="vertical">
          <DrawerWidget
            icon={<UnorderedListOutlined />}
            height={480}
            afterVisibleChange={setPlaylist}
          >
            <PlaylistWindow className="window" visibility={showPlaylist} />
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
