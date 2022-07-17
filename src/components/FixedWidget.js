import { Avatar, Popover } from "antd";
import "./FixedWidget.css";

const FixedWidget = (props) => {
  const { icon, children, onVisibleChange } = props;

  return (
    <Popover
      placement="leftTop"
      trigger="click"
      onVisibleChange={onVisibleChange}
      content={children}
    >
      <Avatar className="fixed-widget-avatar" icon={icon} />
    </Popover>
  );
};

export default FixedWidget;
