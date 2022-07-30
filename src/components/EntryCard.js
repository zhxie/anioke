import {
  DeleteOutlined,
  SettingOutlined,
  UserOutlined,
  VerticalAlignTopOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./Card.css";

const { Paragraph, Text } = Typography;

const EntryCard = (props) => {
  const { t } = useTranslation("playlist");

  const { sequence, title, artist, status, onTopmost, onRetry, onRemove } =
    props;

  const actions = useCallback(() => {
    let result = [];
    if (onTopmost) {
      result.push(
        <VerticalAlignTopOutlined
          onClick={() => {
            onTopmost(sequence);
          }}
        />
      );
    }
    if (onRetry) {
      result.push(
        <RedoOutlined
          onClick={() => {
            onRetry(sequence);
          }}
        />
      );
    }
    result.push(
      <DeleteOutlined
        onClick={() => {
          onRemove(sequence);
        }}
      />
    );

    return result;
  }, [sequence, onTopmost, onRetry, onRemove]);

  return (
    <Card className="card" actions={actions()} size="small">
      <Space className="card-space" direction="vertical">
        <Paragraph className="card-paragraph" strong ellipsis={{ rows: 2 }}>
          {title}
        </Paragraph>
        <Space className="card-space" direction="vertical" size={0}>
          <Space className="card-space card-space-inner">
            <UserOutlined />
            <Text ellipsis>{artist}</Text>
          </Space>
          <Space className="card-space card-space-inner">
            <SettingOutlined />
            <Text ellipsis>{t(status)}</Text>
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default EntryCard;
