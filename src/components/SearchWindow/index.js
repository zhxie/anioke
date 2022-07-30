import React, { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import "./index.scss";
import "../Window.css";
import MVSelector from "./MVSelector";
import LyricsSelector from "./LyricsSelector";
import { useTranslation } from "react-i18next";
import { useLoading } from "./hooks";

const SearchWindow = (props) => {
  const { className, addr } = props;

  const { t } = useTranslation("search");

  const [isLoading, setLoading] = useState(true);
  const [mvProviders, setMVProviders] = useState([]);
  const [lyricsProviders, setLyricsProviders] = useState([]);
  const [mvId, setMVId] = useState("");
  const [lyricsId, setLyricsId] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [step, setStep] = useState(0);

  const loadingComp = useLoading(isLoading);

  // Clean up.
  const cleanUp = useCallback(() => {
    setLoading(false);
    setMVId("");
    setLyricsId("");
    setSearchKey("");
    setStep(0);
  }, []);

  // Init providers of mv and lyrics
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const res = await fetch(`${addr}/connect`);
      const json = await res.json();

      const mv = json["mv"];
      setMVProviders(
        mv.map((v) => ({
          label: t(v),
          value: v,
        }))
      );
      const lyrics = json["lyrics"];
      setLyricsProviders(
        lyrics.map((v) => ({
          label: t(v),
          value: v,
        }))
      );
      setLoading(false);
    };
    fetchProviders();
  }, [addr, t]);

  // Do order when mvId and lyricsId are both set
  useEffect(() => {
    const checkDoOrder = async () => {
      if (!mvId || !lyricsId) {
        return;
      }
      setLoading(true);
      const res = await fetch(`${addr}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mv: mvId,
          lyrics: lyricsId,
        }),
      });
      const json = await res.json();

      if ("error" in json) {
        console.error(json["error"]);
      } else {
        message.open({
          content: t("order_success"),
        });
      }

      cleanUp();
    };
    checkDoOrder();
  }, [addr, cleanUp, lyricsId, mvId, t]);

  const onMVCardClick = useCallback(
    (mv, searchKey) => {
      setMVId(mv.id);
      if ("lyrics" in mv) {
        setLyricsId(mv["lyrics"]["id"]);
      }
      setSearchKey(searchKey);
      setStep(step + 1);
    },
    [step]
  );

  const renderContent = () => {
    if (isLoading) {
      return loadingComp;
    }
    if (step === 0) {
      return (
        <MVSelector
          providers={mvProviders}
          onSelectMV={onMVCardClick}
          addr={addr}
        />
      );
    }
    return (
      <LyricsSelector
        providers={lyricsProviders}
        onSelectLyrics={setLyricsId}
        addr={addr}
        defaultSearchKey={searchKey}
        onClickBack={() => setStep(step - 1)}
      />
    );
  };

  return (
    <div className={`search-window-space ${className}`}>{renderContent()}</div>
  );
};

export default SearchWindow;
