import { Button, Input, Space } from "antd";
import { useTranslation } from "react-i18next";
import debounce from "lodash/debounce";

const SearchInput = (props) => {
  const { searchKey, disabled, onInputChange, onSearch } = props;

  const { t } = useTranslation("search");

  const debouncedSearch = debounce(onSearch, 300);

  return (
    <Space className="search-window-input-wrapper">
      <Input
        placeholder={t("title")}
        value={searchKey}
        onChange={onInputChange}
        onPressEnter={debouncedSearch}
      />
      <Button disabled={disabled} onClick={debouncedSearch}>
        {t("search")}
      </Button>
    </Space>
  );
};

export default SearchInput;
