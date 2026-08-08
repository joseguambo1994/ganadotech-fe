import type {
  CSSProperties,
} from "react";

type StatusType =
  | "neutral"
  | "recording"
  | "success"
  | "error";

export const appInlineCss = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    overflow: hidden;
  }

  @keyframes handFloat {
    0%,
    100% {
      transform: translateY(-50%) translateY(4px) rotate(-7deg);
    }

    50% {
      transform: translateY(-50%) translateY(-8px) rotate(-2deg);
    }
  }

  @keyframes handFloatFree {
    0%,
    100% {
      transform: translateY(4px) rotate(-7deg);
    }

    50% {
      transform: translateY(-10px) rotate(-2deg);
    }
  }

  @keyframes micPulse {
    0% {
      box-shadow:
        0 0 0 0 rgba(66, 105, 60, 0.20),
        0 10px 26px rgba(45, 62, 40, 0.12);
    }

    70% {
      box-shadow:
        0 0 0 20px rgba(66, 105, 60, 0),
        0 10px 26px rgba(45, 62, 40, 0.12);
    }

    100% {
      box-shadow:
        0 0 0 0 rgba(66, 105, 60, 0),
        0 10px 26px rgba(45, 62, 40, 0.12);
    }
  }

  @keyframes recordingPulse {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.04);
    }
  }

  @keyframes loadingSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes loadingFade {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes arrowBounce {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.8;
    }

    50% {
      transform: translateY(8px);
      opacity: 1;
    }
  }

  @keyframes calendarFlip {
    0% {
      opacity: 0;
      transform:
        perspective(1200px)
        rotateX(-88deg)
        translateY(-18px);
      filter: brightness(1.08);
    }

    55% {
      opacity: 1;
      transform:
        perspective(1200px)
        rotateX(8deg)
        translateY(2px);
      filter: brightness(1);
    }

    100% {
      opacity: 1;
      transform:
        perspective(1200px)
        rotateX(0deg)
        translateY(0);
      filter: brightness(1);
    }
  }

  button {
    font-family: inherit;
  }

  table {
    font-family: inherit;
  }

  tbody tr[data-recent='false']:hover {
    background: #f5f7f1;
  }
`;

export const appStyles = {
  parallaxViewport: {
    width: "100%",
    height: "100vh",
    background:
      "linear-gradient(180deg, #eef2e8 0%, #edf1e6 38%, #e7efe5 100%)",
  },
  parallaxInner: {
    background: "transparent",
  },
  backgroundLayer: {
    display: "flex",
    justifyContent: "center",
    overflow: "hidden",
  },
  backgroundShell: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  backgroundOrbPrimary: {
    position: "absolute",
    top: "7%",
    left: "-9%",
    width: "340px",
    height: "340px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(163, 69, 52, 0.13) 0%, rgba(163, 69, 52, 0) 72%)",
  },
  backgroundOrbSecondary: {
    position: "absolute",
    right: "-10%",
    top: "46%",
    width: "380px",
    height: "380px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(49, 90, 49, 0.12) 0%, rgba(49, 90, 49, 0) 70%)",
  },
  layerFrame: {
    display: "flex",
    justifyContent: "center",
    padding: "20px 18px",
  },
  layerInner: {
    width: "100%",
    maxWidth: "980px",
    display: "flex",
    justifyContent: "center",
  },
  voiceSection: {
    width: "100%",
    maxWidth: "500px",
    minHeight: "calc(100vh - 48px)",
    background: "#fbfcf8",
    border: "1px solid #d8decf",
    borderRadius: "36px",
    padding: "24px 24px 30px",
    boxShadow:
      "0 18px 50px rgba(54, 68, 48, 0.07)",
    overflow: "hidden",
  },
  voiceHeader: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "24px",
    position: "relative",
    zIndex: 30,
  },
  logoCard: {
    width: "108px",
    height: "108px",
    borderRadius: "26px",
    background: "#eef0eb",
    border: "1px solid #e1e5db",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  logoImage: {
    width: "92px",
    height: "92px",
    objectFit: "contain",
  },
  headerTextWrap: {
    textAlign: "left",
    minWidth: 0,
  },
  eyebrow: {
    color: "#315a31",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.8px",
    textTransform: "uppercase",
    marginBottom: "5px",
  },
  title: {
    margin: 0,
    color: "#10140e",
    fontFamily:
      "Georgia, 'Times New Roman', serif",
    fontSize: "31px",
    lineHeight: 1.05,
    fontWeight: 700,
  },
  body: {
    position: "relative",
    minHeight: "410px",
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 25,
    borderRadius: "26px",
    background: "rgba(251, 252, 248, 0.94)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    animation: "loadingFade 0.2s ease-out",
  },
  largeSpinner: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    border: "6px solid #dfe6d8",
    borderTopColor: "#315a31",
    animation: "loadingSpin 0.8s linear infinite",
  },
  loadingTitle: {
    margin: "18px 0 0",
    color: "#263222",
    fontSize: "16px",
    fontWeight: 800,
  },
  loadingText: {
    margin: "6px 0 0",
    color: "#747d6e",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  instructionTitle: {
    margin: 0,
    color: "#172016",
    fontSize: "14px",
    lineHeight: 1.4,
    fontWeight: 700,
  },
  instructionExample: {
    margin: "5px 0 0",
    color: "#65705f",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  micCard: {
    marginTop: "18px",
    border: "1px solid #dce2d4",
    borderRadius: "25px",
    background: "#fbfcf8",
    padding: "28px 20px 20px",
  },
  micArea: {
    position: "relative",
    width: "100%",
    minHeight: "178px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  microphoneButton: {
    width: "156px",
    height: "156px",
    borderRadius: "50%",
    border: "1px solid #cdd7c6",
    background: "#e8eee1",
    color: "#315a31",
    cursor: "pointer",
    fontSize: "64px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "micPulse 1.8s ease-out infinite",
  },
  microphoneFinger: {
    position: "absolute",
    left: "calc(50% + 76px)",
    top: "70px",
    fontSize: "52px",
    lineHeight: 1,
    animation:
      "handFloatFree 1.5s ease-in-out infinite",
    userSelect: "none",
    pointerEvents: "none",
  },
  microphoneLabel: {
    margin: "14px 0 0",
    color: "#263222",
    fontSize: "15px",
    fontWeight: 700,
    textAlign: "center",
  },
  stopButtonArea: {
    width: "100%",
    minHeight: "178px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  stopButton: {
    width: "156px",
    height: "156px",
    borderRadius: "50%",
    border: "1px solid #e1c9c3",
    background: "#f3e8e4",
    color: "#a34534",
    cursor: "pointer",
    fontSize: "54px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation:
      "recordingPulse 1.2s ease-in-out infinite",
  },
  stopLabel: {
    margin: "14px 0 0",
    color: "#8d3d30",
    fontSize: "15px",
    fontWeight: 700,
    textAlign: "center",
  },
  statusBox: {
    marginTop: "18px",
    minHeight: "47px",
    borderRadius: "15px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.4,
    textAlign: "center",
  },
  errorBox: {
    marginTop: "12px",
    padding: "14px 16px",
    background: "#f8eeeb",
    border: "1px solid #e6cec8",
    borderRadius: "15px",
    color: "#8d3d30",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.5,
    textAlign: "left",
  },
  recordingHint: {
    margin: "12px 0 0",
    color: "#7b8275",
    fontSize: "12px",
    textAlign: "center",
  },
  tableSection: {
    width: "100%",
    maxWidth: "900px",
    background: "#fbfcf8",
    border: "1px solid #d8decf",
    borderRadius: "28px",
    padding: "24px",
    boxShadow:
      "0 18px 50px rgba(54, 68, 48, 0.07)",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },
  tableActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  tableTitle: {
    margin: 0,
    color: "#10140e",
    fontFamily:
      "Georgia, 'Times New Roman', serif",
    fontSize: "25px",
    lineHeight: 1.1,
  },
  tableMeta: {
    margin: "6px 0 0",
    color: "#747d6e",
    fontSize: "13px",
  },
  refreshButton: {
    border: "1px solid #cdd7c6",
    background: "#e8eee1",
    color: "#315a31",
    borderRadius: "12px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 700,
  },
  calendarNavButton: {
    border: "1px solid #315a31",
    background:
      "linear-gradient(180deg, #416b3b 0%, #315a31 100%)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 800,
    boxShadow:
      "0 10px 20px rgba(49, 90, 49, 0.16)",
  },
  tableError: {
    padding: "12px 14px",
    marginBottom: "14px",
    background: "#f8eeeb",
    border: "1px solid #e6cec8",
    borderRadius: "12px",
    color: "#8d3d30",
    fontSize: "13px",
    fontWeight: 600,
  },
  firstLoad: {
    minHeight: "120px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#747d6e",
    fontSize: "14px",
  },
  smallSpinner: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "4px solid #dfe6d8",
    borderTopColor: "#315a31",
    marginBottom: "12px",
    animation: "loadingSpin 0.8s linear infinite",
  },
  emptyState: {
    padding: "34px 18px",
    textAlign: "center",
    color: "#747d6e",
    fontSize: "14px",
    border: "1px dashed #d8decf",
    borderRadius: "16px",
  },
  tableWrap: {
    width: "100%",
    overflowX: "hidden",
    border: "1px solid #e0e4d9",
    borderRadius: "16px",
  },
  table: {
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    background: "#ffffff",
  },
  tableHeadRow: {
    background: "#f1f4eb",
  },
  idHeaderCell: {
    width: "52px",
    padding: "13px 10px",
    textAlign: "left",
    color: "#65705f",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.7px",
    textTransform: "uppercase",
    borderBottom: "1px solid #dce2d4",
  },
  headerCell: {
    padding: "13px 14px",
    textAlign: "left",
    color: "#65705f",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.7px",
    textTransform: "uppercase",
    borderBottom: "1px solid #dce2d4",
  },
  rowNameCell: {
    position: "relative",
    padding: "14px 48px 14px 14px",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },
  recentRowFinger: {
    position: "absolute",
    right: "12px",
    top: "50%",
    fontSize: "26px",
    lineHeight: 1,
    animation:
      "handFloat 1.5s ease-in-out infinite",
    pointerEvents: "none",
    userSelect: "none",
  },
  rowDateCell: {
    padding: "14px",
    fontSize: "14px",
  },
  downCueWrap: {
    marginTop: "18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  downCueText: {
    color: "#5e6a59",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  downCueButton: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "1px solid #c8d3c1",
    background:
      "linear-gradient(180deg, #ffffff 0%, #edf2e8 100%)",
    color: "#315a31",
    cursor: "pointer",
    fontSize: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "arrowBounce 1.5s ease-in-out infinite",
    boxShadow:
      "0 12px 24px rgba(51, 75, 46, 0.10)",
  },
  calendarSection: {
    width: "100%",
    maxWidth: "760px",
    background:
      "linear-gradient(180deg, #fdfcf5 0%, #f4f2e7 100%)",
    border: "1px solid #ddd7c0",
    borderRadius: "32px",
    padding: "28px",
    boxShadow:
      "0 22px 56px rgba(90, 86, 60, 0.10)",
  },
  calendarEyebrow: {
    color: "#65705f",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    marginBottom: "10px",
  },
  calendarTitle: {
    margin: 0,
    color: "#1b1f15",
    fontFamily:
      "Georgia, 'Times New Roman', serif",
    fontSize: "30px",
    lineHeight: 1.08,
  },
  calendarLead: {
    margin: "10px 0 0",
    color: "#59624d",
    fontSize: "14px",
    lineHeight: 1.55,
    maxWidth: "620px",
  },
  calendarControlWrap: {
    marginTop: "22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },
  calendarButton: {
    minWidth: "200px",
    maxWidth: "100%",
    border: "1px solid #2f5f32",
    borderRadius: "999px",
    background:
      "linear-gradient(180deg, #416b3b 0%, #315a31 100%)",
    color: "#ffffff",
    padding: "13px 22px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 14px 24px rgba(49, 90, 49, 0.18)",
  },
  calendarRunningText: {
    color: "#65705f",
    fontSize: "13px",
    fontWeight: 700,
  },
  calendarShell: {
    marginTop: "10px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  calendarFrame: {
    width: "100%",
    maxWidth: "380px",
    perspective: "1200px",
  },
  calendarCard: {
    width: "100%",
    borderRadius: "28px",
    overflow: "hidden",
    border: "1px solid #d8d3bf",
    boxShadow:
      "0 22px 36px rgba(74, 84, 57, 0.14)",
    background: "#fffef8",
  },
  calendarTop: {
    background:
      "linear-gradient(180deg, #477340 0%, #315a31 100%)",
    padding: "16px 16px 14px",
    position: "relative",
  },
  calendarTopLabel: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    textAlign: "center",
  },
  calendarBindingRow: {
    position: "absolute",
    left: "50%",
    bottom: "-9px",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "16px",
  },
  calendarBindingDot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#ecf3e7",
    border: "3px solid #d2decb",
    boxShadow:
      "inset 0 2px 4px rgba(62, 88, 55, 0.10)",
  },
  calendarPageStage: {
    padding: "28px 18px 22px",
    background:
      "linear-gradient(180deg, #fffef7 0%, #f7f3e7 100%)",
  },
  calendarPage: {
    minHeight: "290px",
    width: "100%",
    borderRadius: "22px",
    background:
      "linear-gradient(180deg, #fffefc 0%, #fbf6ea 100%)",
    border: "1px solid #e5dcc7",
    boxShadow:
      "inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 16px 28px rgba(89, 83, 57, 0.08)",
    transformOrigin: "top center",
    animation:
      "calendarFlip 132ms cubic-bezier(0.2, 0.75, 0.2, 1) both",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "28px 18px",
  },
  calendarDayLabel: {
    color: "#5d6a58",
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "3px",
    textTransform: "uppercase",
  },
  calendarDayNumber: {
    marginTop: "18px",
    color: "#1f281c",
    fontSize: "clamp(96px, 28vw, 148px)",
    fontWeight: 800,
    lineHeight: 0.9,
  },
  calendarDayFooter: {
    marginTop: "20px",
    color: "#74806f",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.7px",
    textTransform: "uppercase",
  },
  calendarComplete: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid #b4cfb4",
    background:
      "linear-gradient(180deg, #edf7ed 0%, #e4f1e4 100%)",
    color: "#315a31",
    fontSize: "15px",
    fontWeight: 800,
    textAlign: "center",
  },
  calendarHint: {
    marginTop: "12px",
    color: "#66715f",
    fontSize: "12px",
    lineHeight: 1.45,
    textAlign: "center",
  },
  calendarFooterDays: {
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  calendarFooterChip: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#eef2e8",
    color: "#52604f",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },
  chatSection: {
    marginTop: "22px",
    width: "100%",
    maxWidth: "920px",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid #cfe2d6",
    boxShadow:
      "0 16px 30px rgba(24, 67, 50, 0.10)",
  },
  chatHeader: {
    background: "#075e54",
    color: "#ffffff",
    padding: "14px 16px",
  },
  chatHeaderTitle: {
    fontSize: "15px",
    fontWeight: 800,
  },
  chatHeaderSubtitle: {
    marginTop: "2px",
    fontSize: "11px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  chatBody: {
    position: "relative",
    padding: "20px 16px 22px",
    background:
      "linear-gradient(180deg, #dcefe7 0%, #e7f3ed 100%)",
  },
  chatPattern: {
    position: "absolute",
    inset: 0,
    opacity: 0.2,
    backgroundImage:
      "radial-gradient(circle at 18px 18px, #b8d8c7 2px, transparent 0), radial-gradient(circle at 58px 58px, #b8d8c7 2px, transparent 0)",
    backgroundSize: "76px 76px",
    pointerEvents: "none",
  },
  chatBubbleRow: {
    position: "relative",
    display: "flex",
    justifyContent: "flex-start",
  },
  chatBubbleRowRight: {
    position: "relative",
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "12px",
  },
  chatBubble: {
    position: "relative",
    width: "min(100%, 640px)",
    background: "#dcf8c6",
    color: "#18261b",
    borderRadius: "18px 18px 18px 6px",
    padding: "14px 16px 12px",
    boxShadow:
      "0 8px 18px rgba(21, 52, 39, 0.12)",
  },
  chatBubbleReply: {
    position: "relative",
    width: "min(100%, 240px)",
    background: "#ffffff",
    color: "#1f2a22",
    borderRadius: "18px 18px 6px 18px",
    padding: "12px 14px 10px",
    boxShadow:
      "0 8px 18px rgba(21, 52, 39, 0.08)",
  },
  chatBubbleVet: {
    position: "relative",
    width: "min(100%, 640px)",
    background: "#f4e5d7",
    color: "#3b2a1d",
    borderRadius: "18px 18px 18px 6px",
    padding: "14px 16px 12px",
    boxShadow:
      "0 8px 18px rgba(83, 57, 31, 0.10)",
  },
  chatSender: {
    color: "#075e54",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "6px",
  },
  chatSenderVet: {
    color: "#8b4f1d",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "6px",
  },
  chatSenderReply: {
    color: "#547744",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "6px",
    textAlign: "right",
  },
  chatMessage: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.6,
    minHeight: "48px",
  },
  chatReplyMessage: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.5,
  },
  chatWord: {
    display: "inline-block",
    marginRight: "0.32em",
  },
  chatCowName: {
    color: "#b42318",
    fontWeight: 800,
  },
  chatNeedle: {
    display: "inline-block",
    marginRight: "8px",
    fontSize: "18px",
    verticalAlign: "middle",
  },
  chatMeta: {
    marginTop: "10px",
    color: "#57715f",
    fontSize: "11px",
    textAlign: "right",
  },
} satisfies Record<
  string,
  CSSProperties
>;

export const getInstructionWrapStyle =
  (
    showInstruction: boolean,
  ): CSSProperties => ({
    padding: "4px 8px 8px",
    textAlign: "center",
    opacity: showInstruction ? 1 : 0,
    transform: showInstruction
      ? "translateY(0)"
      : "translateY(12px)",
    transition:
      "opacity 0.8s ease, transform 0.8s ease",
  });

export const getMicCardStyle =
  (
    showMicrophone: boolean,
    isLoading: boolean,
  ): CSSProperties => ({
    ...appStyles.micCard,
    opacity: showMicrophone ? 1 : 0,
    transform: showMicrophone
      ? "translateY(0)"
      : "translateY(18px)",
    transition:
      "opacity 0.7s ease, transform 0.7s ease",
    pointerEvents:
      showMicrophone && !isLoading
        ? "auto"
        : "none",
  });

export const getStatusBoxStyle =
  (
    statusType: StatusType,
  ): CSSProperties => ({
    ...appStyles.statusBox,
    background:
      statusType === "error"
        ? "#f7ebe8"
        : statusType === "success" ||
            statusType ===
              "recording"
          ? "#edf4e8"
          : "#f4f5f0",
    border:
      statusType === "error"
        ? "1px solid #e4cbc5"
        : "1px solid #e0e4d9",
  });

export const getStatusTextStyle =
  (
    statusType: StatusType,
  ): CSSProperties => ({
    ...appStyles.statusText,
    color:
      statusType === "error"
        ? "#9b4034"
        : statusType === "success" ||
            statusType ===
              "recording"
          ? "#315a31"
          : "#697164",
  });

export const getRefreshButtonStyle =
  (
    isLoadingCattle: boolean,
  ): CSSProperties => ({
    ...appStyles.refreshButton,
    cursor: isLoadingCattle
      ? "default"
      : "pointer",
    opacity: isLoadingCattle
      ? 0.65
      : 1,
  });

export const getRowStyle =
  (
    isRecentRecord: boolean,
  ): CSSProperties => ({
    backgroundColor: isRecentRecord
      ? "#b42318"
      : "#ffffff",
  });

export const getIdCellStyle =
  (
    isRecentRecord: boolean,
  ): CSSProperties => ({
    width: "52px",
    padding: "14px 10px",
    borderBottom: isRecentRecord
      ? "1px solid rgba(255, 255, 255, 0.28)"
      : "1px solid #e8ebe3",
    color: isRecentRecord
      ? "#ffffff"
      : "#747d6e",
    fontSize: "13px",
    fontWeight: isRecentRecord
      ? 800
      : 600,
    whiteSpace: "nowrap",
  });

export const getNameCellStyle =
  (
    isRecentRecord: boolean,
  ): CSSProperties => ({
    ...appStyles.rowNameCell,
    borderBottom: isRecentRecord
      ? "1px solid rgba(255, 255, 255, 0.28)"
      : "1px solid #e8ebe3",
    color: isRecentRecord
      ? "#ffffff"
      : "#263222",
    fontWeight: isRecentRecord
      ? 800
      : 700,
  });

export const getDateCellStyle =
  (
    isRecentRecord: boolean,
  ): CSSProperties => ({
    ...appStyles.rowDateCell,
    borderBottom: isRecentRecord
      ? "1px solid rgba(255, 255, 255, 0.28)"
      : "1px solid #e8ebe3",
    color: isRecentRecord
      ? "#ffffff"
      : "#263222",
    fontWeight: isRecentRecord
      ? 700
      : 500,
  });
