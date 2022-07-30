import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

export const useLoading = (isLoading) => {
  return isLoading ? (
    <div className="window-spin-wrapper">
      <Spin indicator={<LoadingOutlined spin />} />
    </div>
  ) : null;
};
