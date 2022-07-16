import { Card } from "antd";

const MVCard = (props) => {
  const { id, title, subtitle, uploader, onClick } = props;

  return (
    <Card onClick={onClick.bind(id)}>
      <p>{title}</p>
      {subtitle && <p>{subtitle}</p>}
      <p>{uploader}</p>
    </Card>
  );
};

export default MVCard;
