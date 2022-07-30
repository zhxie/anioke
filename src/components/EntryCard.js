import {
  DeleteOutlined,
  SettingOutlined,
  UserOutlined,
  VerticalAlignTopOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import "./Card.css";

const { Paragraph, Text } = Typography;

const EntryCard = (props) => {
  const { t } = useTranslation("playlist");

  const { sequence, title, artist, status, onTopmost, onRetry, onRemove } =
    props;

  return (
    <Card
      className="card"
      actions={[
        <VerticalAlignTopOutlined
          onClick={() => {
            onTopmost(sequence);
          }}
        />,
        <RedoOutlined
          onClick={() => {
            onRetry(sequence);
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
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default EntryCard;
