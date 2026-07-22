import {
  Joyride,
  type EventData,
  type Step,
} from "react-joyride";

export type BrandTourEvent = {
  status?: string;
  type?: string;
  index?: number;
  action?: string;
};

type BrandTourProps = {
  steps: Step[];
  run: boolean;
  onCallback: (data: BrandTourEvent) => void;
};

const locale = {
  back: "ກັບ",
  close: "ປິດ",
  last: "ສິ້ນສຸດ",
  next: "ຕໍ່",
  open: "ເປີດ",
  skip: "ຂ້າມ",
};

export function BrandTour({ steps, run, onCallback }: BrandTourProps) {
  const handleEvent = (data: EventData) => {
    onCallback({
      status: data.status,
      type: data.type,
      index: data.index,
      action: data.action,
    });
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      locale={locale}
      options={{
        primaryColor: "#00A896",
        textColor: "#1A1A1A",
        overlayColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 10000,
        showProgress: true,
        skipBeacon: true,
        spotlightRadius: 0,
        buttons: ["back", "close", "primary", "skip"],
      }}
      styles={{
        tooltip: {
          borderRadius: 0,
          border: "1px solid #00A896",
          padding: "24px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "16px",
          fontWeight: 600,
          color: "#1A1A1A",
          marginBottom: "8px",
        },
        tooltipContent: {
          fontSize: "14px",
          color: "#1A1A1A",
          lineHeight: "1.5",
          padding: 0,
        },
        buttonPrimary: {
          borderRadius: 0,
          backgroundColor: "#00A896",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 500,
          padding: "8px 16px",
          border: "1px solid #00A896",
        },
        buttonBack: {
          borderRadius: 0,
          color: "#1A1A1A",
          fontSize: "14px",
          fontWeight: 500,
          padding: "8px 16px",
          border: "1px solid #00A896",
          backgroundColor: "transparent",
        },
        buttonSkip: {
          borderRadius: 0,
          color: "#717171",
          fontSize: "14px",
          fontWeight: 400,
          padding: "8px 16px",
        },
      }}
    />
  );
}
