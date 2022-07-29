import {
  DeleteOutlined,
  SettingOutlined,
  UserOutlined,
  VerticalAlignTopOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { Card, Space, Typography, Button } from "antd";
import { useTranslation } from "react-i18next";
import "./Card.css";

const { Paragraph, Text } = Typography;

const EntryCard = (props) => {
  const { t } = useTranslation("playlist");

  const { sequence, title, artist, status, onTopmost, onRemove, onRetry } =
    props;

  const renderRetryBtn = () => {
    // TODO: Put constants of status together (server/components/entry)
    if (status !== "fail") {
      return;
    }
    return (
      <Button className="card-action-btn" onClick={() => onRetry(sequence)}>
        <RedoOutlined />
        {t("retry")}
      </Button>
    );
  };

  return (
    <Card
      className="card"
      actions={[
        <VerticalAlignTopOutlined
          onClick={() => {
            onTopmost(sequence);
          }}
        />,
        <DeleteOutlined
          onClick={() => {
            onRemove(sequence);
          }}
        />,
      ]}
      size="small"
    >
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
            {renderRetryBtn()}
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default EntryCard;
