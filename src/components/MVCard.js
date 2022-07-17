import { LinkOutlined, NumberOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Space, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import "./MVCard.css";

const { Link, Paragraph, Text } = Typography;

const MVCard = (props) => {
  const { t } = useTranslation();

  const { id, title, subtitle, uploader, url, onClick } = props;

  return (
    <Card className="mv-card" onClick={onClick.bind(id)} size="small">
      <Space className="mv-card-space" direction="vertical">
        <Paragraph className="mv-card-paragraph" strong ellipsis={{ rows: 2 }}>
          {title}
        </Paragraph>
        <Space className="mv-card-space" direction="vertical" size={0}>
          {subtitle && (
            <Space className="mv-card-space mv-card-space-inner">
              <NumberOutlined />
              <Text ellipsis>{subtitle}</Text>
            </Space>
          )}
          <Space className="mv-card-space mv-card-space-inner">
            <UserOutlined />
            <Text ellipsis>{uploader}</Text>
          </Space>
          <Space className="mv-card-space mv-card-space-inner">
            <LinkOutlined />
            <Link
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  message.open({ content: t("copied_to_clipboard") });
                } catch (e) {
                  console.error(e);
                }
              }}
              className="mv-card-text-ellipse-begin"
              ellipsis
            >
              {url}
            </Link>
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default MVCard;
