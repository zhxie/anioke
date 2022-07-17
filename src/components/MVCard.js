import { LinkOutlined, NumberOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import "./MVCard.css";

const { Link, Paragraph, Text } = Typography;

const MVCard = (props) => {
  const { id, title, subtitle, uploader, url, onClick } = props;

  return (
    <Card onClick={onClick.bind(id)} size="small">
      <Space className="mv-card-space" direction="vertical">
        <Paragraph className="mv-card-paragraph" strong ellipsis={{ rows: 2 }}>
          {title}
        </Paragraph>
        <Space className="mv-card-space" direction="vertical" size={0}>
          {subtitle && (
            <Space className="mv-card-space">
              <NumberOutlined />
              <Text ellipsis>{subtitle}</Text>
            </Space>
          )}
          <Space className="mv-card-space">
            <UserOutlined />
            <Text ellipsis>{uploader}</Text>
          </Space>
          <Space className="mv-card-space">
            <LinkOutlined />
            <Link ellipsis>{url}</Link>
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default MVCard;
