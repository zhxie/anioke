import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

const Hint = (props) => {
  const { title } = props;

  return (
    <Tooltip title={title}>
      <InfoCircleOutlined style={{ color: "#ffffff7f" }} />
    </Tooltip>
  );
};

export default Hint;
