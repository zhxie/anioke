import { LoadingOutlined } from "@ant-design/icons";
import { Input, Space, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./LibraryWindow.css";
import MVCard from "./MVCard";
import "./Window.css";

const LibraryWindow = (props) => {
  const { className, addr } = props;

  const { t } = useTranslation("library");

  const [isLoading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      const res = await fetch(`${addr}/library`);
      const json = await res.json();

      setList(json);
      setLoading(false);
    };
    refresh();
  }, [addr]);

  const onInputChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  const onCardClick = useCallback(
    async (id) => {
      const record = list.find((value) => value.mv === id);
      // Order.
      setLoading(true);
      const res = await fetch(`${addr}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mv: record.mv,
          lyrics: record.lyrics,
        }),
      });
      const json = await res.json();

      if ("error" in json) {
        console.error(json["error"]);
      }

      setLoading(false);
    },
    [list, addr]
  );

  return (
    <Space className={`library-window-space ${className}`} direction="vertical">
      <Input placeholder={t("title")} value={title} onChange={onInputChange} />
      {isLoading ? (
        <div className="window-spin-wrapper">
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      ) : (
        <Space className="window-list" direction="vertical">
          {list
            .filter((value) => value.title.includes(title))
            .map((value, index) => {
              return (
                <MVCard
                  key={index}
                  id={value.mv}
                  title={value.title}
                  uploader={value.artist}
                  onClick={onCardClick}
                />
              );
            })}
        </Space>
      )}
    </Space>
  );
};

export default LibraryWindow;
