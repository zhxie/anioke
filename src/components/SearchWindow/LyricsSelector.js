import { useState, useEffect, useCallback } from "react";
import { Space, Segmented, Button } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { useLoading } from "./hooks";
import LyricsCard from "./LyricsCard";
import SearchInput from "./SearchInput";

const LyricsSelector = (props) => {
  const { providers, onSelectLyrics, addr, defaultSearchKey, onClickBack } =
    props;

  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.value);
  const [searchKey, setSearchKey] = useState(defaultSearchKey);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const loadingComp = useLoading(loading);

  useEffect(() => {
    if (!defaultSearchKey) {
      return;
    }
    onSearch(defaultSearchKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedProvider(providers[0]?.value);
  }, [providers]);

  const onSearchKeyChange = useCallback((e) => {
    setSearchKey(e.target.value);
  }, []);

  const onSearch = useCallback(
    async (key) => {
      setLoading(true);
      const res = await fetch(
        `${addr}/search?lyrics=${selectedProvider}&title=${key || searchKey}`
      );
      const json = await res.json();
      if (json.error) {
        console.error(json.error);
        setList([]);
      } else {
        setList(json.lyrics);
      }
      setLoading(false);
    },
    [addr, searchKey, selectedProvider]
  );

  const renderContent = () => {
    return (
      <Space className="window-list" direction="vertical">
        {list.map((lyrics, index) => {
          return (
            <LyricsCard
              key={index}
              id={lyrics.id}
              title={lyrics.title}
              artist={lyrics.artist}
              style={lyrics.style}
              onClick={onSelectLyrics}
            />
          );
        })}
      </Space>
    );
  };

  return (
    <Space direction="vertical">
      <Space>
        <Button type="text" size="small" onClick={onClickBack}>
          <LeftOutlined />
        </Button>
        <SearchInput
          searchKey={searchKey}
          disabled={loading}
          onInputChange={onSearchKeyChange}
          onSearch={onSearch}
        />
      </Space>
      <Segmented
        block
        disabled={loading}
        onChange={setSelectedProvider}
        options={providers}
        value={selectedProvider}
      />
      {loading ? loadingComp : renderContent()}
    </Space>
  );
};

export default LyricsSelector;
