import { LoadingOutlined } from "@ant-design/icons";
import { Input, Space, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./LibraryWindow.css";
import MVCard from "./MVCard";
import "./Window.css";
import { alphabetic, getLibrary, requestOrder } from "../utils";

const LibraryWindow = (props) => {
  const { className } = props;

  const { t } = useTranslation("library");

  const [isLoading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      const json = await getLibrary();

      setList(json);
      setLoading(false);
    };
    refresh();
  }, []);

  const onInputChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  const onCardClick = useCallback(
    async (id) => {
      const record = list.find((value) => value["mv"] === id);
      // Order.
      setLoading(true);
      const json = await requestOrder({
        mv: record["mv"],
        lyrics: record["lyrics"],
      });

      if ("error" in json) {
        console.error(json["error"]);
      }

      setLoading(false);
    },
    [list]
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
            .filter((value) =>
              value["title"].toUpperCase().includes(title.toUpperCase())
            )
            .sort((a, b) => alphabetic(a, b, "title"))
            .map((value, index) => {
              return (
                <MVCard
                  key={index}
                  id={value["mv"]}
                  title={value["title"]}
                  uploader={value["artist"]}
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
