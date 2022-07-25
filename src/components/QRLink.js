import { message, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

const { Link } = Typography;

const QRLink = (props) => {
  const { t } = useTranslation("player");

  const { placement, value } = props;

  return (
    <Tooltip
      overlayInnerStyle={{
        padding: "8px",
        lineHeight: 1,
      }}
      placement={placement}
      title={
        <QRCode
          bgColor="transparent"
          fgColor="white"
          size={128}
          value={value}
        />
      }
    >
      <Link
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            message.open({ content: t("copied_to_clipboard") });
          } catch (e) {
            console.error(e);
          }
        }}
      >
        {value}
      </Link>
    </Tooltip>
  );
};

export default QRLink;
