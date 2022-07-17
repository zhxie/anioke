import { LinkOutlined, NumberOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Space, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import "./Card.css";

const { Link, Paragraph, Text } = Typography;

const MVCard = (props) => {
  const { t } = useTranslation("search");

  const { id, title, subtitle, uploader, url, onClick } = props;

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
          {subtitle && (
            <Space className="card-space card-space-inner">
              <NumberOutlined />
              <Text ellipsis>{subtitle}</Text>
            </Space>
          )}
          <Space className="card-space card-space-inner">
            <UserOutlined />
            <Text ellipsis>{uploader}</Text>
          </Space>
          <Space className="card-space card-space-inner">
            <LinkOutlined />
            <Link
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  message.open({
                    content: t("copied_to_clipboard", { ns: "player" }),
                  });
                } catch (e) {
                  console.error(e);
                }
              }}
              className="card-text-ellipse-begin"
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
