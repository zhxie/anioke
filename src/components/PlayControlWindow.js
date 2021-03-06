import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, Menu, Space } from "antd";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./Window.css";
import "./PlayControlWindow.css";
import QRLink from "./QRLink";

const PlayControlWindow = (props) => {
  const { className, addr } = props;

  const { t } = useTranslation("playControl");

  const onSkip = useCallback(async () => {
    await fetch(`${addr}/skip`, { method: "POST" });
  }, [addr]);

  const onReplay = useCallback(async () => {
    await fetch(`${addr}/replay`, { method: "POST" });
  }, [addr]);

  const onSwitch = useCallback(async () => {
    await fetch(`${addr}/switch`, { method: "POST" });
  }, [addr]);

  const onOffset = useCallback(
    async (time) => {
      await fetch(`${addr}/offset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ time: time }),
      });
    },
    [addr]
  );

  return (
    <Space
      className={`play-control-window-space ${className}`}
      direction="vertical"
    >
      {addr && (
        <div className="play-control-link-wrapper">
          <QRLink value={`${addr}/web-ui`} />
        </div>
      )}
      <Space className="window-buttons-wrapper">
        <Button block onClick={onSkip}>
          {t("skip")}
        </Button>
        <Button block onClick={onReplay}>
          {t("replay")}
        </Button>
        <Button block onClick={onSwitch}>
          {t("switch")}
        </Button>
      </Space>
      <Space className="window-buttons-wrapper">
        <Dropdown
          className="play-control-dropdown"
          block
          overlay={
            <Menu
              onClick={(e) => {
                onOffset(e.key);
              }}
              items={[
                {
                  label: t("offset_1"),
                  key: 0.1,
                },
                {
                  label: t("offset_5"),
                  key: 0.5,
                },
                {
                  label: t("offset_10"),
                  key: 1,
                },
                {
                  label: t("offset_50"),
                  key: 5,
                },
              ]}
            />
          }
        >
          <Button>
            <Space>
              {t("lyrics_advance")}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
        <Dropdown
          className="play-control-dropdown"
          overlay={
            <Menu
              onClick={(e) => {
                onOffset(e.key);
              }}
              items={[
                {
                  label: t("offset_1"),
                  key: -0.1,
                },
                {
                  label: t("offset_5"),
                  key: -0.5,
                },
                {
                  label: t("offset_10"),
                  key: -1,
                },
                {
                  label: t("offset_50"),
                  key: -5,
                },
              ]}
            />
          }
        >
          <Button>
            <Space>
              {t("lyrics_delay")}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      </Space>
    </Space>
  );
};

export default PlayControlWindow;
