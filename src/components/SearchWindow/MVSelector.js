import { useCallback, useEffect, useState } from "react";
import { Segmented, Space } from "antd";
import MVCard from "./MVCard";
import { useLoading } from "./hooks";
import SearchInput from "./SearchInput";

const MVSelector = (props) => {
  const { providers, addr, onSelectMV, defaultSearchKey } = props;

  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.value);
  const [searchKey, setSearchKey] = useState(defaultSearchKey);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const loadingComp = useLoading(loading);

  useEffect(() => {
    setSelectedProvider(providers[0]?.value);
  }, [providers]);

  const onSearchKeyChange = useCallback((e) => {
    setSearchKey(e.target.value);
  }, []);

  const onSearch = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `${addr}/search?mv=${selectedProvider}&title=${searchKey}`
    );
    const json = await res.json();
    if (json.error) {
      console.error(json.error);
      setList([]);
    } else {
      setList(json.mv);
    }
    setLoading(false);
  }, [addr, searchKey, selectedProvider]);

  const renderContent = () => {
    return (
      <Space className="window-list" direction="vertical">
        {list.map((mv, index) => {
          return (
            <MVCard
              key={index}
              id={mv.id}
              title={mv.title}
              subtitle={mv.subtitle}
              uploader={mv.uploader}
              url={mv.url}
              onClick={() => onSelectMV(mv, searchKey)}
            />
          );
        })}
      </Space>
    );
  };

  return (
    <Space direction="vertical">
      <SearchInput
        searchKey={searchKey}
        disabled={loading}
        onInputChange={onSearchKeyChange}
        onSearch={onSearch}
      />
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

export default MVSelector;
