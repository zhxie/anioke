import { LoadingOutlined } from "@ant-design/icons";
import { Button, Input, Segmented, Space, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./SearchWindow.css";
import MVCard from "./MVCard";

const SearchWindow = (props) => {
  const { className, addr } = props;

  const { t } = useTranslation();

  const [isLoading, setLoading] = useState(false);
  const [mvProviders, setMVProviders] = useState([]);
  const [lyricsProviders, setLyricsProviders] = useState([]);
  const [searchInput, setSearchInput] = useState("");
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
  }, [addr, setLoading]);

  const onInputChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  const onSearchMV = useCallback(async () => {
    setSelectedMV("");

    // Search MV
    setLoading(true);
    const res = await fetch(
      `http://${addr}/search?mv=${selectedMVProvider}&title=${searchInput}`
    );
    const json = await res.json();

    if ("error" in json) {
      console.error(json["error"]);
    } else {
      console.log(json["mv"]);
    setMVList(json["mv"]);
    }
    setLoading(false);
  }, [addr, searchInput, selectedMVProvider]);

  const onSearchLyrics = useCallback(async () => {}, []);

  const onMVCardClick = useCallback(
    async (id) => {
      setSelectedMV(id);
      const mv = mvList.find((value) => value.id === id);
      if ("lyrics" in mv) {
        return;
      }

      setMVList([]);
      await onSearchLyrics();
    },
    [mvList, onSearchLyrics]
  );

  return (
    <Space className={`search-space ${className}`} direction="vertical">
      <Space>
        <Input
          placeholder={t("title")}
          disabled={isLoading}
          value={searchInput}
          onChange={onInputChange}
        />
        <Button disabled={isLoading} onClick={onSearchMV}>
          {t("search")}
        </Button>
      </Space>
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
      {isLoading ? (
        <div className="spin-wrapper">
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      ) : (
        <Space direction="vertical">
          {mvList.map((value, index) => {
            return (
              <MVCard
                key={index}
                id={value.id}
                title={value.title}
                subtitle={value.subtitle}
                uploader={value.uploader}
                onClick={onMVCardClick}
              />
            );
          })}
        </Space>
      )}
    </Space>
  );
};

export default SearchWindow;
