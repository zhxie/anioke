import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tabs,
} from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./SettingsWindow.css";
import "./Window.css";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SettingsWindow = (props) => {
  const { className, config, onSave } = props;

  const { t } = useTranslation("settings");

  const [isLoading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    setLoading(false);
  }, [config]);

  const onFinish = useCallback(
    (values) => {
      onSave(values);
    },
    [onSave]
  );

  const onClick = useCallback(() => {
    form.submit();
  }, [form]);

  return (
    <Space
      className={`settings-window-space ${className}`}
      direction="vertical"
    >
      <Form
        className="settings-window-form"
        form={form}
        initialValues={config}
        layout="vertical"
        onFinish={onFinish}
      >
        <Tabs>
          <TabPane tab={t("server")} key="server" forceRender>
            <Form.Item label={t("port")} name={["server", "port"]}>
              <InputNumber max={65535} min={0} precision={0} />
            </Form.Item>
          </TabPane>
          <TabPane tab={t("database")} key="database" forceRender>
            <Form.Item label={t("location")} name={["database", "location"]}>
              <Input placeholder={t("default_path")} />
            </Form.Item>
          </TabPane>
          <TabPane tab={t("download")} key="download" forceRender>
            <Form.Item label={t("yt-dlp_path")} name={["download", "ytDlp"]}>
              <Input placeholder={t("use_internal_yt-dlp")} />
            </Form.Item>
            <Form.Item label={t("location")} name={["download", "location"]}>
              <Input placeholder={t("default_path")} />
            </Form.Item>
          </TabPane>
          <TabPane tab={t("encode")} key="encode" forceRender>
            <Form.Item label={t("ffmpeg_path")} name={["encode", "ffmpeg"]}>
              <Input placeholder={t("use_internal_ffmpeg")} />
            </Form.Item>
            <Form.Item
              label={t("vocal_removal_method")}
              name={["encode", "method"]}
            >
              <Select>
                <Option value="remove_center_channel">
                  {t("remove_center_channel")}
                </Option>
                <Option value="custom">{t("custom")}</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={t("vocal_removal_custom_script")}
              name={["encode", "script"]}
            >
              <TextArea autoSize />
            </Form.Item>
          </TabPane>
          <TabPane tab={t("providers")} key="providers" forceRender>
            <Divider plain orientation="left" style={{ marginTop: 0 }}>
              {t("bilibili")}
            </Divider>
            <Form.Item
              label={t("hidden")}
              name={["providers", "mv", "bilibili", "hidden"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Divider plain orientation="left">
              {t("youtube")}
            </Divider>
            <Form.Item
              label={t("hidden")}
              name={["providers", "mv", "youtube", "hidden"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label={t("api_key")}
              name={["providers", "mv", "youtube", "key"]}
            >
              <Input.Password />
            </Form.Item>
            <Divider plain orientation="left">
              {t("petit_lyrics")}
            </Divider>
            <Form.Item
              label={t("hidden")}
              name={["providers", "lyrics", "petitLyrics", "hidden"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
      <Space className="window-buttons-wrapper">
        <Button block disabled={isLoading} onClick={onClick}>
          {t("save")}
        </Button>
      </Space>
    </Space>
  );
};

export default SettingsWindow;