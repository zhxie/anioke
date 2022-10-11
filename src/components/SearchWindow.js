import { LeftOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Input, Segmented, Space, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./SearchWindow.css";
import "./Window.css";
import LyricsCard from "./LyricsCard";
import MVCard from "./MVCard";
import {
  getConnect,
  options,
  searchMV as requestSearchMV,
  searchLyrics as requestSearchLyrics,
  requestOrder,
} from "../utils";

const SearchWindow = (props) => {
  const { className } = props;

  const { t } = useTranslation("search");

  const [isLoading, setLoading] = useState(true);
  const [mvProviders, setMVProviders] = useState([]);
  const [lyricsProviders, setLyricsProviders] = useState([]);
  const [title, setTitle] = useState("");
  const [selectedMVProvider, setSelectedMVProvider] = useState("");
  const [mvList, setMVList] = useState([]);
  const [selectedMV, setSelectedMV] = useState(null);
  const [selectedLyricsProvider, setSelectedLyricsProvider] = useState("");
  const [lyricsList, setLyricsList] = useState([]);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const json = await getConnect();

      const mv = json["mv"];
      setMVProviders(mv.filter((provider) => provider !== "null"));
      setSelectedMVProvider(mv[0]);
      const lyrics = json["lyrics"];
      setLyricsProviders(lyrics.filter((provider) => provider !== "null"));
      setSelectedLyricsProvider(lyrics[0]);
      setLoading(false);
    };
    fetchProviders();
  }, []);

  const searchMV = useCallback(
    async (title) => {
      setLoading(true);
      const json = await requestSearchMV({
        mv: selectedMVProvider,
        title,
      });

      if ("error" in json) {
        console.error(json["error"]);
      } else {
        setMVList(json["mv"]);
      }
      setLoading(false);
    },
    [selectedMVProvider]
  );

  const searchLyrics = useCallback(
    async (title) => {
      setLoading(true);
      const json = await requestSearchLyrics({
        lyrics: selectedLyricsProvider,
        title,
      });

      if ("error" in json) {
        console.error(json["error"]);
      } else {
        setLyricsList(json["lyrics"]);
      }
      setLoading(false);
    },
    [selectedLyricsProvider]
  );

  const order = useCallback(async (mv, lyrics) => {
    setLoading(true);
    const json = await requestOrder({
      mv: mv,
      lyrics: lyrics,
    });

    if ("error" in json) {
      console.error(json["error"]);
    }

    // Clean up.
    setSelectedMV(null);
    setMVList([]);
    setLyricsList([]);
    setLoading(false);
  }, []);

  const onBack = useCallback(async (_e) => {
    setSelectedMV(null);
  }, []);

  const onInputChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  const onSearch = useCallback(
    async (_e) => {
      if (!selectedMV) {
        searchMV(title);
        return;
      }

      searchLyrics(title);
    },
    [selectedMV, searchMV, title, searchLyrics]
  );

  const onMVCardClick = useCallback(
    async (id) => {
      const mv = mvList.find((value) => value["id"] === id);
      setSelectedMV(mv);
      await searchLyrics(title);
    },
    [mvList, searchLyrics, title]
  );

  const onLyricsCardClick = useCallback(
    async (id) => {
      order(selectedMV["id"], id);
    },
    [order, selectedMV]
  );

  return (
    <Space className={`search-window-space ${className}`} direction="vertical">
      <Space className="search-window-input-wrapper">
        {selectedMV && (
          <Button type="text" icon={<LeftOutlined />} onClick={onBack} />
        )}
        <Input
          placeholder={t("title")}
          value={title}
          onChange={onInputChange}
          onPressEnter={onSearch}
        />
        <Button disabled={isLoading} onClick={onSearch}>
          {t("search")}
        </Button>
      </Space>
      {!selectedMV ? (
        <Segmented
          block
          disabled={isLoading}
          onChange={setSelectedMVProvider}
          options={mvProviders.map((value) => {
            return {
              label: t(value),
              value: value,
            };
          })}
          value={selectedMVProvider}
        />
      ) : (
        <Segmented
          block
          disabled={isLoading}
          onChange={setSelectedLyricsProvider}
          options={options(lyricsProviders, t)}
          value={selectedLyricsProvider}
        />
      )}
      {isLoading ? (
        <div className="window-spin-wrapper">
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      ) : (
        <Space className="window-list" direction="vertical">
          {selectedMV && selectedMV["lyrics"] && (
            <LyricsCard
              id={selectedMV["lyrics"]["id"]}
              title={selectedMV["lyrics"]["title"]}
              associated
              simplified
              onClick={onLyricsCardClick}
            />
          )}
          {selectedMV && (
            <LyricsCard
              id={`null..${title}`}
              title={t("no_lyrics")}
              simplified
              onClick={onLyricsCardClick}
            />
          )}
          {!selectedMV
            ? mvList.map((value, index) => {
                return (
                  <MVCard
                    key={index}
                    id={value["id"]}
                    title={value["title"]}
                    subtitle={value["subtitle"]}
                    uploader={value["uploader"]}
                    url={value["url"]}
                    lyrics={value["lyrics"]}
                    onClick={onMVCardClick}
                  />
                );
              })
            : lyricsList.map((value, index) => {
                return (
                  <LyricsCard
                    key={index}
                    id={value["id"]}
                    title={value["title"]}
                    artist={value["artist"]}
                    style={value["style"]}
                    onClick={onLyricsCardClick}
                  />
                );
              })}
        </Space>
      )}
    </Space>
  );
};

export default SearchWindow;
