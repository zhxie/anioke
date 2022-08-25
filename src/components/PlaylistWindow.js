import { LoadingOutlined } from "@ant-design/icons";
import { Button, Segmented, Space, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./PlaylistWindow.css";
import "./Window.css";
import EntryCard from "./EntryCard";
import {
  getPlaylist,
  options,
  removeSong,
  requestShuffle,
  retrySong,
  topmostSong,
} from "../utils";

const Filter = {
  WaitToPlay: "wait_to_play",
  Failed: "failed",
};

const PlaylistWindow = (props) => {
  const { className, visibility } = props;

  const { t } = useTranslation("playlist");

  const [isLoading, setLoading] = useState(true);
  const [filter, setFilter] = useState(Filter.WaitToPlay);
  const [playlist, setPlaylist] = useState([]);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    const json = await getPlaylist();

    setPlaylist(json);
    setLoading(false);
  }, []);

  const onShuffle = useCallback(async () => {
    setLoading(true);
    await requestShuffle();

    await onRefresh();
  }, [onRefresh]);

  const onTopmost = useCallback(
    async (sequence) => {
      setLoading(true);
      await topmostSong({ sequence: sequence });
      await onRefresh();
    },
    [onRefresh]
  );

  const onRetry = useCallback(
    async (sequence) => {
      setLoading(true);
      await retrySong({ sequence: sequence });
      await onRefresh();
    },
    [onRefresh]
  );

  const onRemove = useCallback(
    async (sequence) => {
      setLoading(true);
      await removeSong({ sequence: sequence });

      await onRefresh();
    },
    [onRefresh]
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
      <Segmented
        block
        onChange={setFilter}
        options={options([Filter.WaitToPlay, Filter.Failed], t)}
        value={filter}
      />
      {isLoading ? (
        <div className="window-spin-wrapper">
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      ) : (
        <Space className="window-list" direction="vertical">
          {playlist
            .filter((value) => {
              switch (filter) {
                case Filter.WaitToPlay:
                  return value["status"] !== "fail";
                case Filter.Failed:
                  return value["status"] === "fail";
                default:
                  throw new Error(`unexpected filter "${value}"`);
              }
            })
            .map((value, index) => {
              return (
                <EntryCard
                  key={index}
                  sequence={value["sequence"]}
                  title={value["lyrics"]["title"]}
                  artist={value["lyrics"]["artist"]}
                  status={value["status"]}
                  onTopmost={
                    value["status"] === "play_queue" ? onTopmost : undefined
                  }
                  onRetry={value["status"] === "fail" ? onRetry : undefined}
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
