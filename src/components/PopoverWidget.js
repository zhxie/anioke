import { Avatar, Popover } from "antd";
import "./Widget.css";

const PopoverWidget = (props) => {
  const { icon, onVisibleChange, children } = props;

  return (
    <Popover
      placement="leftTop"
      trigger="click"
      zIndex={1000}
      onVisibleChange={onVisibleChange}
      content={children}
    >
      <Avatar className="widget-avatar" icon={icon} />
    </Popover>
  );
};

export default PopoverWidget;
