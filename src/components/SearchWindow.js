import { LoadingOutlined } from "@ant-design/icons";
import { Button, Input, Segmented, Space, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./SearchWindow.css";
import "./Window.css";
import LyricsCard from "./LyricsCard";
import MVCard from "./MVCard";

const SearchWindow = (props) => {
  const { className, addr } = props;

  const { t } = useTranslation("search");

  const [isLoading, setLoading] = useState(true);
  const [mvProviders, setMVProviders] = useState([]);
  const [lyricsProviders, setLyricsProviders] = useState([]);
  const [title, setTitle] = useState("");
  const [selectedMVProvider, setSelectedMVProvider] = useState("");
  const [mvList, setMVList] = useState([]);
  const [selectedMV, setSelectedMV] = useState("");
  const [selectedLyricsProvider, setSelectedLyricsProvider] = useState("");
  const [lyricsList, setLyricsList] = useState([]);

  useEffect(() => {
    const fetchProviders = async () => {
      if (addr) {
        setLoading(true);
        const res = await fetch(`http://${addr}/connect`);
        const json = await res.json();

        const mv = json["mv"];
        setMVProviders(mv);
        setSelectedMVProvider(mv[0]);
        const lyrics = json["lyrics"];
        setLyricsProviders(lyrics);
        setSelectedLyricsProvider(lyrics[0]);
        setLoading(false);
      }
    };
    fetchProviders();
  }, [addr]);

  const onInputChange = useCallback((e) => {
    setSelectedMV("");
    setMVList([]);
    setLyricsList([]);
    setTitle(e.target.value);
  }, []);

  const onSearch = useCallback(
    async (_e, forceLyrics) => {
      if (!selectedMV && !forceLyrics) {
        // Search MV.
        setLoading(true);
        const res = await fetch(
          `http://${addr}/search?mv=${selectedMVProvider}&title=${title}`
        );
        const json = await res.json();

        if ("error" in json) {
          console.error(json["error"]);
        } else {
          setMVList(json["mv"]);
        }
        setLoading(false);
        return;
      }

      // Search lyrics.
      setLoading(true);
      const res = await fetch(
        `http://${addr}/search?lyrics=${selectedLyricsProvider}&title=${title}`
      );
      const json = await res.json();

      if ("error" in json) {
        console.error(json["error"]);
      } else {
        setLyricsList(json["lyrics"]);
      }
      setLoading(false);
    },
    [selectedMV, addr, selectedMVProvider, title, selectedLyricsProvider]
  );

  const onLyricsCardClick = useCallback(
    async (id, forceMV) => {
      // Order.
      setLoading(true);
      const res = await fetch(
        `http://${addr}/order?mv=${forceMV ?? selectedMV}&lyrics=${id}`
      );
      const json = await res.json();

      if ("error" in json) {
        console.error(json["error"]);
      }

      // Clean up.
      onInputChange({ target: { value: "" } });
      setLoading(false);
    },
    [addr, selectedMV, onInputChange]
  );

  const onMVCardClick = useCallback(
    async (id) => {
      setSelectedMV(id);
      const mv = mvList.find((value) => value.id === id);
      if ("lyrics" in mv) {
        // Order MV with lyrics.
        await onLyricsCardClick(mv["lyrics"]["id"], id);
        return;
      }

      // Search lyrics.
      await onSearch(undefined, true);
    },
    [mvList, onLyricsCardClick, onSearch]
  );

  return (
    <Space className={`search-window-space ${className}`} direction="vertical">
      <Space className="search-window-input-wrapper">
        <Input
          placeholder={t("title")}
          disabled={isLoading}
          value={title}
          onChange={onInputChange}
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
          options={lyricsProviders.map((value) => {
            return {
              label: t(value),
              value: value,
            };
          })}
          value={selectedLyricsProvider}
        />
      )}
      {isLoading ? (
        <div className="window-spin-wrapper">
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      ) : (
        <Space className="window-list" direction="vertical">
          {!selectedMV
            ? mvList.map((value, index) => {
                return (
                  <MVCard
                    key={index}
                    id={value.id}
                    title={value.title}
                    subtitle={value.subtitle}
                    uploader={value.uploader}
                    url={value.url}
                    onClick={onMVCardClick}
                  />
                );
              })
            : lyricsList.map((value, index) => {
                return (
                  <LyricsCard
                    key={index}
                    id={value.id}
                    title={value.title}
                    artist={value.artist}
                    style={value.style}
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
