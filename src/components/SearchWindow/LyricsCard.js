import { AlignCenterOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import "../Card.css";

const { Paragraph, Text } = Typography;

const LyricsCard = (props) => {
  const { t } = useTranslation("search");

  const { id, title, artist, style, onClick } = props;

  return (
    <Card
      className="clickable-card"
      onClick={() => {
        onClick(id);
      }}
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
            <AlignCenterOutlined />
            <Text ellipsis>{t(style)}</Text>
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default LyricsCard;
