import { LoadingOutlined } from "@ant-design/icons";
import { Button, Space, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./PlaylistWindow.css";
import "./Window.css";
import EntryCard from "./EntryCard";

const PlaylistWindow = (props) => {
  const { className, addr, visibility } = props;

  const { t } = useTranslation("playlist");

  const [isLoading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState([]);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${addr}/playlist`);
    const json = await res.json();

    setPlaylist(json);
    setLoading(false);
  }, [addr]);

  const onShuffle = useCallback(async () => {
    setLoading(true);
    await fetch(`${addr}/shuffle`, { method: "POST" });

    await onRefresh();
  }, [addr, onRefresh]);

  const onTopmost = useCallback(
    async (sequence) => {
      setLoading(true);
      await fetch(`${addr}/topmost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequence: sequence }),
      });

      await onRefresh();
    },
    [addr, onRefresh]
  );

  const onRemove = useCallback(
    async (sequence) => {
      setLoading(true);
      await fetch(`${addr}/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequence: sequence }),
      });

      await onRefresh();
    },
    [addr, onRefresh]
  );

  useEffect(() => {
    if (visibility) {
      onRefresh();
    }
  }, [visibility, onRefresh]);

  return (
    <Space
      className={`playlist-window-space ${className}`}
      direction="vertical"
    >
      <Space className="window-buttons-wrapper">
        <Button block disabled={isLoading} onClick={onShuffle}>
          {t("shuffle")}
        </Button>
      </Space>
      {isLoading ? (
        <div className="window-spin-wrapper">
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      ) : (
        <Space className="window-list" direction="vertical">
          {playlist.map((value, index) => {
            return (
              <EntryCard
                key={index}
                sequence={value.sequence}
                title={value.lyrics.title}
                artist={value.lyrics.artist}
                status={value.status}
                onTopmost={onTopmost}
                onRemove={onRemove}
              />
            );
          })}
        </Space>
      )}
    </Space>
  );
};

export default PlaylistWindow;
