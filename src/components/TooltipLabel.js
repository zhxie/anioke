import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import "./TooltipLabel.css";

const TooltipLabel = (props) => {
  const { className, tooltip, label } = props;

  return (
    <Tooltip className={className} title={tooltip}>
      <span>{label}</span>
      <InfoCircleOutlined className="tooltip-label-icon" />
    </Tooltip>
  );
};

export default TooltipLabel;
