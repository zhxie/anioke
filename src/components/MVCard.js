import { LinkOutlined, NumberOutlined, UserOutlined } from "@ant-design/icons";
import { Card, message, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import "./Card.css";

const { Link, Paragraph, Text } = Typography;

const MVCard = (props) => {
  const { t } = useTranslation("search");

  const { id, title, subtitle, uploader, url, lyrics, onClick } = props;

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
          {lyrics && <Tag>{t("in_library")}</Tag>}
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
          {url && (
            <Space className="card-space card-space-inner">
              <LinkOutlined />
              <Link
                onClick={async (e) => {
                  try {
                    e.stopPropagation();
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
          )}
        </Space>
      </Space>
    </Card>
  );
};

export default MVCard;
