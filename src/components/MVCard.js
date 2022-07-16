import { LinkOutlined, NumberOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";

const { Link, Text } = Typography;

const MVCard = (props) => {
  const { id, title, subtitle, uploader, url, onClick } = props;

  return (
    <Card onClick={onClick.bind(id)} size="small">
      <Space direction="vertical">
        <Space>
          <Text strong level={5} ellipsis={{ rows: 2 }}>
            {title}
          </Text>
        </Space>
        <Space direction="vertical" size={0}>
          {subtitle && (
            <Space>
              <NumberOutlined />
              <Text ellipsis>{subtitle}</Text>
            </Space>
          )}
          <Space>
            <UserOutlined />
            <Text ellipsis>{uploader}</Text>
          </Space>
          <Space>
            <LinkOutlined />
            <Link ellipsis>{url}</Link>
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default MVCard;
