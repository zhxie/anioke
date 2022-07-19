import { Avatar, Drawer } from "antd";
import { useState } from "react";

const DrawerWidget = (props) => {
  const { icon, height, afterVisibleChange, children } = props;

  const [visible, setVisible] = useState(false);

  return (
    <>
      <div
        onClick={() => {
          setVisible(true);
        }}
      >
        <Avatar className="widget-avatar" icon={icon} />
      </div>
      <Drawer
        afterVisibleChange={afterVisibleChange}
        bodyStyle={{ padding: "16px" }}
        closable={false}
        height={height}
        placement="bottom"
        visible={visible}
        forceRender={true}
        onClose={() => {
          setVisible(false);
        }}
      >
        {children}
      </Drawer>
    </>
  );
};

export default DrawerWidget;
