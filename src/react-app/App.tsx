import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import logo from "./assets/ganadotech-logo.png";

type StatusType =
  | "neutral"
  | "recording"
  | "success"
  | "error";

type ApiResponse = {
  success?: boolean;
  error?: string;
  missing_field?: string;
  transcription?: string;

  id?: number;
  name?: string;
  last_heat_date?: string;
  created_at?: string;

  status?: number;
  details?: string;
};

type CattleRecord = {
  id: number;
  name: string;
  last_heat_date: string;
  created_at: string;
};

type CattleResponse = {
  success?: boolean;
  cattle?: CattleRecord[];
  error?: string;
};

type RecentRecordMatch = {
  id?: number;
  name?: string;
  last_heat_date?: string;
};

const monthNames = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

function App() {
  const [isRecording, setIsRecording] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [statusType, setStatusType] =
    useState<StatusType>("neutral");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    showInstruction,
    setShowInstruction,
  ] = useState(false);

  const [
    showMicrophone,
    setShowMicrophone,
  ] = useState(false);

  /*
   * =====================================================
   * CATTLE TABLE STATE
   * =====================================================
   */

  const [cattle, setCattle] =
    useState<CattleRecord[]>([]);

  const [
    isLoadingCattle,
    setIsLoadingCattle,
  ] = useState(false);

  const [
    cattleError,
    setCattleError,
  ] = useState("");

  const [
    recentRecordId,
    setRecentRecordId,
  ] = useState<number | null>(
    null,
  );

  /*
   * =====================================================
   * MEDIA RECORDER REFERENCES
   * =====================================================
   */

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const timeoutRef =
    useRef<number | null>(null);

  /*
   * =====================================================
   * LOAD CATTLE FROM API
   * =====================================================
   */

  const loadCattle =
    useCallback(async () => {
      setIsLoadingCattle(true);
      setCattleError("");

      try {
        const response =
          await fetch("/api/cattle");

        const responseText =
          await response.text();

        let result: CattleResponse = {};

        try {
          result =
            JSON.parse(responseText);
        } catch {
          throw new Error(
            "The cattle service returned an invalid response.",
          );
        }

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Could not load cattle records.",
          );
        }

        const records =
          Array.isArray(result.cattle)
            ? result.cattle
            : [];

        setCattle(records);

        return records;
      } catch (error) {
        console.error(
          "Cattle loading error:",
          error,
        );

        setCattleError(
          error instanceof Error
            ? error.message
            : "Could not load cattle records.",
        );

        return [];
      } finally {
        setIsLoadingCattle(false);
      }
    }, []);

  /*
   * =====================================================
   * INITIAL EFFECTS
   * =====================================================
   */

  useEffect(() => {
    const instructionTimer =
      window.setTimeout(() => {
        setShowInstruction(true);
      }, 450);

    const microphoneTimer =
      window.setTimeout(() => {
        setShowMicrophone(true);
      }, 1600);

    return () => {
      clearTimeout(
        instructionTimer,
      );

      clearTimeout(
        microphoneTimer,
      );

      if (
        timeoutRef.current !== null
      ) {
        clearTimeout(
          timeoutRef.current,
        );
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop(),
        );
    };
  }, []);

  /*
   * Load cattle when application opens.
   */

  useEffect(() => {
    loadCattle();
  }, [loadCattle]);

  /*
   * =====================================================
   * START RECORDING
   * =====================================================
   */

  const startRecording =
    async () => {
      try {
        setErrorMessage("");

        setStatus(
          "Preparing microphone...",
        );

        setStatusType(
          "neutral",
        );

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            },
          );

        streamRef.current =
          stream;

        const chunks: Blob[] =
          [];

        const mediaRecorder =
          new MediaRecorder(
            stream,
          );

        mediaRecorderRef.current =
          mediaRecorder;

        mediaRecorder.ondataavailable =
          (event) => {
            if (
              event.data.size > 0
            ) {
              chunks.push(
                event.data,
              );
            }
          };

        mediaRecorder.onstop =
          async () => {
            const audioBlob =
              new Blob(
                chunks,
                {
                  type:
                    mediaRecorder.mimeType,
                },
              );

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop(),
              );

            streamRef.current =
              null;

            mediaRecorderRef.current =
              null;

            setIsRecording(
              false,
            );

            console.log(
              "Recorded audio:",
              {
                type:
                  audioBlob.type,

                size:
                  audioBlob.size,
              },
            );

            await uploadAudio(
              audioBlob,
            );
          };

        mediaRecorder.start();

        setIsRecording(
          true,
        );

        setStatus(
          "Listening...",
        );

        setStatusType(
          "recording",
        );

        /*
         * Maximum recording:
         * 20 seconds.
         */

        timeoutRef.current =
          window.setTimeout(
            () => {
              stopRecording();
            },
            20_000,
          );
      } catch (error) {
        console.error(
          "Microphone error:",
          error,
        );

        setIsRecording(
          false,
        );

        setStatus(
          "Microphone unavailable.",
        );

        setStatusType(
          "error",
        );

        setErrorMessage(
          "We could not access your microphone. Please check your browser permissions and try again.",
        );
      }
    };

  /*
   * =====================================================
   * STOP RECORDING
   * =====================================================
   */

  const stopRecording =
    () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !== "inactive"
      ) {
        setStatus(
          "Processing...",
        );

        setStatusType(
          "neutral",
        );

        mediaRecorderRef.current.stop();
      }

      if (
        timeoutRef.current !==
        null
      ) {
        clearTimeout(
          timeoutRef.current,
        );

        timeoutRef.current =
          null;
      }
    };

  /*
   * =====================================================
   * JSON PARSER
   * =====================================================
   */

  const parseJson = (
    value: string,
  ): ApiResponse | null => {
    try {
      return JSON.parse(
        value,
      );
    } catch {
      return null;
    }
  };

  /*
   * =====================================================
   * EXPLICIT 400 ERRORS
   * =====================================================
   */

  const map400Error = (
    response: ApiResponse,
  ) => {
    if (
      response.missing_field ===
      "name"
    ) {
      return (
        "Cow name missing. " +
        "Please try again and clearly say the animal's name."
      );
    }

    if (
      response.missing_field ===
      "last_heat_date"
    ) {
      return (
        "Last heat date missing. " +
        "Please try again and include the complete date."
      );
    }

    if (
      response.error ===
      "No audio received"
    ) {
      return (
        "No audio was received. " +
        "Please press the microphone and record again."
      );
    }

    return (
      response.error ||
      "I couldn't understand all the required information. Please try again."
    );
  };

  /*
   * =====================================================
   * UPLOAD AUDIO
   * =====================================================
   */

  const uploadAudio =
    async (
      audioBlob: Blob,
    ) => {
      setIsLoading(true);

      try {
        setErrorMessage(
          "",
        );

        setStatus(
          "Processing audio...",
        );

        setStatusType(
          "neutral",
        );

        const response =
          await fetch(
            "/api/audio",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  audioBlob.type ||
                  "application/octet-stream",
              },

              body:
                audioBlob,
            },
          );

        const responseText =
          await response.text();

        const result =
          parseJson(
            responseText,
          ) || {};

        /*
         * =================================================
         * DIRECT 400
         * =================================================
         */

        if (
          response.status ===
          400
        ) {
          const message =
            map400Error(
              result,
            );

          setStatus(
            "Please try again.",
          );

          setStatusType(
            "error",
          );

          setErrorMessage(
            message,
          );

          return;
        }

        /*
         * =================================================
         * 400 WRAPPED BY HONO
         * =================================================
         */

        if (
          result.status ===
          400
        ) {
          let originalError:
            ApiResponse =
            result;

          if (
            typeof result.details ===
            "string"
          ) {
            const parsedDetails =
              parseJson(
                result.details,
              );

            if (
              parsedDetails
            ) {
              originalError =
                parsedDetails;
            }
          }

          const message =
            map400Error(
              originalError,
            );

          setStatus(
            "Please try again.",
          );

          setStatusType(
            "error",
          );

          setErrorMessage(
            message,
          );

          return;
        }

        /*
         * =================================================
         * OTHER HTTP ERRORS
         * =================================================
         */

        if (
          !response.ok
        ) {
          console.error(
            "API error:",
            response.status,
            result,
          );

          setStatus(
            "Unable to process recording.",
          );

          setStatusType(
            "error",
          );

          setErrorMessage(
            result.error ||
              "Something went wrong while processing the recording. Please try again.",
          );

          return;
        }

        /*
         * =================================================
         * SUCCESS
         * =================================================
         */

        console.log(
          "Speech response:",
          result,
        );

        setStatus(
          "Record saved successfully.",
        );

        setStatusType(
          "success",
        );

        setErrorMessage(
          "",
        );

        /*
         * Refresh cattle table
         * immediately after INSERT.
         */

        const refreshedCattle =
          await loadCattle();

        setRecentRecordId(
          findRecentRecordId(
            refreshedCattle,
            {
              id: result.id,
              name: result.name,
              last_heat_date:
                result.last_heat_date,
            },
          ),
        );
      } catch (error) {
        console.error(
          "Audio upload error:",
          error,
        );

        setStatus(
          "Unable to process recording.",
        );

        setStatusType(
          "error",
        );

        setErrorMessage(
          "We could not connect to the service. Please try again.",
        );
      } finally {
        setIsLoading(
          false,
        );
      }
    };

  /*
   * =====================================================
   * STATUS COLORS
   * =====================================================
   */

  const statusBackground =
    () => {
      if (
        statusType ===
        "error"
      ) {
        return "#f7ebe8";
      }

      if (
        statusType ===
        "success"
      ) {
        return "#edf4e8";
      }

      if (
        statusType ===
        "recording"
      ) {
        return "#edf4e8";
      }

      return "#f4f5f0";
    };

  const statusColor =
    () => {
      if (
        statusType ===
        "error"
      ) {
        return "#9b4034";
      }

      if (
        statusType ===
          "success" ||
        statusType ===
          "recording"
      ) {
        return "#315a31";
      }

      return "#697164";
    };

  const findRecentRecordId =
    (
      records: CattleRecord[],
      match: RecentRecordMatch,
    ) => {
      if (
        typeof match.id ===
        "number"
      ) {
        return match.id;
      }

      const matchingRecords =
        records.filter(
          (record) =>
            (!match.name ||
              record.name ===
                match.name) &&
            (!match.last_heat_date ||
              record.last_heat_date ===
                match.last_heat_date),
        );

      if (
        matchingRecords.length ===
        0
      ) {
        return records.reduce(
          (
            latestId,
            record,
          ) =>
            record.id > latestId
              ? record.id
              : latestId,
          0,
        );
      }

      return matchingRecords.reduce(
        (
          latestId,
          record,
        ) =>
          record.id > latestId
            ? record.id
            : latestId,
        0,
      );
    };

  const formatHeatDate =
    (value: string) => {
      const isoDateMatch =
        value.match(
          /^(\d{4})-(\d{2})-(\d{2})$/,
        );

      if (isoDateMatch) {
        const [
          ,
          year,
          month,
          day,
        ] = isoDateMatch;

        return `${day} ${monthNames[Number(month) - 1]} ${year}`;
      }

      const parsedDate =
        new Date(value);

      if (
        Number.isNaN(
          parsedDate.getTime(),
        )
      ) {
        return value;
      }

      const day =
        String(
          parsedDate.getDate(),
        ).padStart(2, "0");

      const month =
        monthNames[
          parsedDate.getMonth()
        ];

      const year =
        parsedDate.getFullYear();

      return `${day} ${month} ${year}`;
    };

  const visibleCattle =
    [...cattle]
      .sort(
        (left, right) => {
          const leftTime =
            Date.parse(
              left.created_at,
            );

          const rightTime =
            Date.parse(
              right.created_at,
            );

          if (
            !Number.isNaN(
              leftTime,
            ) &&
            !Number.isNaN(
              rightTime,
            ) &&
            leftTime !== rightTime
          ) {
            return (
              rightTime -
              leftTime
            );
          }

          return (
            right.id - left.id
          );
        },
      )
      .slice(0, 5);

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
          }

          @keyframes handFloat {
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

          button {
            font-family: inherit;
          }

          table {
            font-family: inherit;
          }

          tbody tr {
            transition: background 0.15s ease;
          }

          tbody tr:hover {
            background: #f5f7f1;
          }
        `}
      </style>

      <main
        style={{
          minHeight:
            "100vh",

          background:
            "#eef2e8",

          padding:
            "18px",

          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

          display:
            "flex",

          flexDirection:
            "column",

          justifyContent:
            "flex-start",

          alignItems:
            "center",

          gap:
            "22px",
        }}
      >
        {/*
         * ==================================================
         * VOICE REGISTRATION CARD
         * ==================================================
         */}

        <section
          style={{
            width:
              "100%",

            maxWidth:
              "500px",

            background:
              "#fbfcf8",

            border:
              "1px solid #d8decf",

            borderRadius:
              "36px",

            padding:
              "24px 24px 30px",

            boxShadow:
              "0 18px 50px rgba(54, 68, 48, 0.07)",

            overflow:
              "hidden",
          }}
        >
          {/*
           * HEADER
           * Loader never covers this.
           */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "18px",

              marginBottom:
                "24px",

              position:
                "relative",

              zIndex:
                30,
            }}
          >
            <div
              style={{
                width:
                  "108px",

                height:
                  "108px",

                borderRadius:
                  "26px",

                background:
                  "#eef0eb",

                border:
                  "1px solid #e1e5db",

                display:
                  "flex",

                justifyContent:
                  "center",

                alignItems:
                  "center",

                flexShrink:
                  0,
              }}
            >
              <img
                src={logo}
                alt="GanadoTech"
                style={{
                  width:
                    "92px",

                  height:
                    "92px",

                  objectFit:
                    "contain",
                }}
              />
            </div>

            <div
              style={{
                textAlign:
                  "left",

                minWidth:
                  0,
              }}
            >
              <div
                style={{
                  color:
                    "#315a31",

                  fontSize:
                    "12px",

                  fontWeight:
                    800,

                  letterSpacing:
                    "1.8px",

                  textTransform:
                    "uppercase",

                  marginBottom:
                    "5px",
                }}
              >
                GANADOTECH SPA
              </div>

              <h1
                style={{
                  margin:
                    0,

                  color:
                    "#10140e",

                  fontFamily:
                    "Georgia, 'Times New Roman', serif",

                  fontSize:
                    "31px",

                  lineHeight:
                    1.05,

                  fontWeight:
                    700,
                }}
              >
                Livestock Farmer
                <br />
                Assistant
              </h1>
            </div>
          </div>

          {/*
           * BODY
           */}

          <div
            style={{
              position:
                "relative",

              minHeight:
                "410px",
            }}
          >
            {/*
             * LOADING OVERLAY
             */}

            {isLoading && (
              <div
                role="status"
                aria-live="polite"
                aria-label="Processing recording"
                style={{
                  position:
                    "absolute",

                  inset:
                    0,

                  zIndex:
                    25,

                  borderRadius:
                    "26px",

                  background:
                    "rgba(251, 252, 248, 0.94)",

                  backdropFilter:
                    "blur(4px)",

                  WebkitBackdropFilter:
                    "blur(4px)",

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  animation:
                    "loadingFade 0.2s ease-out",
                }}
              >
                <div
                  style={{
                    width:
                      "62px",

                    height:
                      "62px",

                    borderRadius:
                      "50%",

                    border:
                      "6px solid #dfe6d8",

                    borderTopColor:
                      "#315a31",

                    animation:
                      "loadingSpin 0.8s linear infinite",
                  }}
                />

                <p
                  style={{
                    margin:
                      "18px 0 0",

                    color:
                      "#263222",

                    fontSize:
                      "16px",

                    fontWeight:
                      800,
                  }}
                >
                  Processing
                  audio...
                </p>

                <p
                  style={{
                    margin:
                      "6px 0 0",

                    color:
                      "#747d6e",

                    fontSize:
                      "12px",

                    lineHeight:
                      1.45,
                  }}
                >
                  Reading the
                  cattle name and
                  last heat date.
                </p>
              </div>
            )}

            {/*
             * INSTRUCTION
             */}

            <div
              style={{
                padding:
                  "4px 8px 8px",

                textAlign:
                  "center",

                opacity:
                  showInstruction
                    ? 1
                    : 0,

                transform:
                  showInstruction
                    ? "translateY(0)"
                    : "translateY(12px)",

                transition:
                  "opacity 0.8s ease, transform 0.8s ease",
              }}
            >
              <p
                style={{
                  margin:
                    0,

                  color:
                    "#172016",

                  fontSize:
                    "14px",

                  lineHeight:
                    1.4,

                  fontWeight:
                    700,
                }}
              >
                Say the cattle
                name and the last
                heat date.
              </p>

              <p
                style={{
                  margin:
                    "5px 0 0",

                  color:
                    "#65705f",

                  fontSize:
                    "12px",

                  lineHeight:
                    1.45,
                }}
              >
                Example: “Cow
                Martha had her last
                heat on August 7,
                2026.”
              </p>
            </div>

            {/*
             * MICROPHONE AREA
             */}

            <div
              style={{
                marginTop:
                  "18px",

                border:
                  "1px solid #dce2d4",

                borderRadius:
                  "25px",

                background:
                  "#fbfcf8",

                padding:
                  "28px 20px 20px",

                opacity:
                  showMicrophone
                    ? 1
                    : 0,

                transform:
                  showMicrophone
                    ? "translateY(0)"
                    : "translateY(18px)",

                transition:
                  "opacity 0.7s ease, transform 0.7s ease",

                pointerEvents:
                  showMicrophone &&
                  !isLoading
                    ? "auto"
                    : "none",
              }}
            >
              {!isRecording ? (
                <>
                  <div
                    style={{
                      position:
                        "relative",

                      width:
                        "100%",

                      minHeight:
                        "178px",

                      display:
                        "flex",

                      justifyContent:
                        "center",

                      alignItems:
                        "center",
                    }}
                  >
                    <button
                      onClick={
                        startRecording
                      }
                      disabled={
                        !showMicrophone ||
                        isLoading
                      }
                      aria-label="Press to record"
                      style={{
                        width:
                          "156px",

                        height:
                          "156px",

                        borderRadius:
                          "50%",

                        border:
                          "1px solid #cdd7c6",

                        background:
                          "#e8eee1",

                        color:
                          "#315a31",

                        cursor:
                          "pointer",

                        fontSize:
                          "64px",

                        lineHeight:
                          1,

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        animation:
                          "micPulse 1.8s ease-out infinite",
                      }}
                    >
                      🎙️
                    </button>

                    <div
                      aria-hidden="true"
                      style={{
                        position:
                          "absolute",

                        left:
                          "calc(50% + 76px)",

                        top:
                          "70px",

                        fontSize:
                          "52px",

                        lineHeight:
                          1,

                        animation:
                          "handFloat 1.5s ease-in-out infinite",

                        userSelect:
                          "none",

                        pointerEvents:
                          "none",
                      }}
                    >
                      👈
                    </div>
                  </div>

                  <p
                    style={{
                      margin:
                        "14px 0 0",

                      color:
                        "#263222",

                      fontSize:
                        "15px",

                      fontWeight:
                        700,

                      textAlign:
                        "center",
                    }}
                  >
                    Press here to
                    speak
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width:
                        "100%",

                      minHeight:
                        "178px",

                      display:
                        "flex",

                      justifyContent:
                        "center",

                      alignItems:
                        "center",
                    }}
                  >
                    <button
                      onClick={
                        stopRecording
                      }
                      aria-label="Stop recording"
                      style={{
                        width:
                          "156px",

                        height:
                          "156px",

                        borderRadius:
                          "50%",

                        border:
                          "1px solid #e1c9c3",

                        background:
                          "#f3e8e4",

                        color:
                          "#a34534",

                        cursor:
                          "pointer",

                        fontSize:
                          "54px",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        animation:
                          "recordingPulse 1.2s ease-in-out infinite",
                      }}
                    >
                      ⏹
                    </button>
                  </div>

                  <p
                    style={{
                      margin:
                        "14px 0 0",

                      color:
                        "#8d3d30",

                      fontSize:
                        "15px",

                      fontWeight:
                        700,

                      textAlign:
                        "center",
                    }}
                  >
                    Press to finish
                  </p>
                </>
              )}

              {/*
               * STATUS
               */}

              <div
                style={{
                  marginTop:
                    "18px",

                  minHeight:
                    "47px",

                  background:
                    statusBackground(),

                  border:
                    statusType ===
                    "error"
                      ? "1px solid #e4cbc5"
                      : "1px solid #e0e4d9",

                  borderRadius:
                    "15px",

                  padding:
                    "12px 14px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",
                }}
              >
                <span
                  style={{
                    color:
                      statusColor(),

                    fontSize:
                      "14px",

                    fontWeight:
                      600,

                    lineHeight:
                      1.4,

                    textAlign:
                      "center",
                  }}
                >
                  {status ||
                    "The microphone is ready."}
                </span>
              </div>

              {/*
               * API ERROR
               */}

              {errorMessage && (
                <div
                  style={{
                    marginTop:
                      "12px",

                    padding:
                      "14px 16px",

                    background:
                      "#f8eeeb",

                    border:
                      "1px solid #e6cec8",

                    borderRadius:
                      "15px",

                    color:
                      "#8d3d30",

                    fontSize:
                      "14px",

                    fontWeight:
                      600,

                    lineHeight:
                      1.5,

                    textAlign:
                      "left",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {isRecording && (
                <p
                  style={{
                    margin:
                      "12px 0 0",

                    color:
                      "#7b8275",

                    fontSize:
                      "12px",

                    textAlign:
                      "center",
                  }}
                >
                  Recording will
                  stop automatically
                  after 20 seconds.
                </p>
              )}
            </div>
          </div>
        </section>

        {/*
         * ==================================================
         * CATTLE REGISTRY TABLE
         * BELOW CURRENT UI
         * ==================================================
         */}

        <section
          style={{
            width:
              "100%",

            maxWidth:
              "900px",

            background:
              "#fbfcf8",

            border:
              "1px solid #d8decf",

            borderRadius:
              "28px",

            padding:
              "24px",

            boxShadow:
              "0 18px 50px rgba(54, 68, 48, 0.07)",
          }}
        >
          {/*
           * TABLE HEADER
           */}

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                "16px",

              marginBottom:
                "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin:
                    0,

                  color:
                    "#10140e",

                  fontFamily:
                    "Georgia, 'Times New Roman', serif",

                  fontSize:
                    "25px",

                  lineHeight:
                    1.1,
                }}
              >
                Cattle Registry
              </h2>

              <p
                style={{
                  margin:
                    "6px 0 0",

                  color:
                    "#747d6e",

                  fontSize:
                    "13px",
                }}
              >
                Showing{" "}
                {
                  visibleCattle.length
                }{" "}
                of{" "}
                {
                  cattle.length
                }{" "}
                {cattle.length ===
                1
                  ? "registration"
                  : "registrations"}
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadCattle
              }
              disabled={
                isLoadingCattle
              }
              style={{
                border:
                  "1px solid #cdd7c6",

                background:
                  "#e8eee1",

                color:
                  "#315a31",

                borderRadius:
                  "12px",

                padding:
                  "10px 15px",

                fontSize:
                  "13px",

                fontWeight:
                  700,

                cursor:
                  isLoadingCattle
                    ? "default"
                    : "pointer",

                opacity:
                  isLoadingCattle
                    ? 0.65
                    : 1,
              }}
            >
              {isLoadingCattle
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          {/*
           * TABLE ERROR
           */}

          {cattleError && (
            <div
              style={{
                padding:
                  "12px 14px",

                marginBottom:
                  "14px",

                background:
                  "#f8eeeb",

                border:
                  "1px solid #e6cec8",

                borderRadius:
                  "12px",

                color:
                  "#8d3d30",

                fontSize:
                  "13px",

                fontWeight:
                  600,
              }}
            >
              {cattleError}
            </div>
          )}

          {/*
           * FIRST LOAD
           */}

          {isLoadingCattle &&
          cattle.length ===
            0 ? (
            <div
              style={{
                minHeight:
                  "120px",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                color:
                  "#747d6e",

                fontSize:
                  "14px",
              }}
            >
              <div
                style={{
                  width:
                    "34px",

                  height:
                    "34px",

                  borderRadius:
                    "50%",

                  border:
                    "4px solid #dfe6d8",

                  borderTopColor:
                    "#315a31",

                  marginBottom:
                    "12px",

                  animation:
                    "loadingSpin 0.8s linear infinite",
                }}
              />

              Loading cattle
              records...
            </div>
          ) : cattle.length ===
            0 ? (
            <div
              style={{
                padding:
                  "34px 18px",

                textAlign:
                  "center",

                color:
                  "#747d6e",

                fontSize:
                  "14px",

                border:
                  "1px dashed #d8decf",

                borderRadius:
                  "16px",
              }}
            >
              No cattle
              registrations yet.
            </div>
          ) : (
            /*
             * TABLE
             */

            <div
              style={{
                width:
                  "100%",

                overflowX:
                  "auto",

                WebkitOverflowScrolling:
                  "touch",

                border:
                  "1px solid #e0e4d9",

                borderRadius:
                  "16px",
              }}
            >
              <table
                style={{
                  width:
                    "100%",

                  tableLayout:
                    "fixed",

                  borderCollapse:
                    "collapse",

                  background:
                    "#ffffff",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#f1f4eb",
                    }}
                  >
                    <th
                      style={{
                        width:
                          "52px",

                        padding:
                          "13px 10px",

                        textAlign:
                          "left",

                        color:
                          "#65705f",

                        fontSize:
                          "11px",

                        fontWeight:
                          800,

                        letterSpacing:
                          "0.7px",

                        textTransform:
                          "uppercase",

                        borderBottom:
                          "1px solid #dce2d4",
                      }}
                    >
                      ID
                    </th>

                    <th
                      style={{
                        padding:
                          "13px 14px",

                        textAlign:
                          "left",

                        color:
                          "#65705f",

                        fontSize:
                          "11px",

                        fontWeight:
                          800,

                        letterSpacing:
                          "0.7px",

                        textTransform:
                          "uppercase",

                        borderBottom:
                          "1px solid #dce2d4",
                      }}
                    >
                      Cow name
                    </th>

                    <th
                      style={{
                        padding:
                          "13px 14px",

                        textAlign:
                          "left",

                        color:
                          "#65705f",

                        fontSize:
                          "11px",

                        fontWeight:
                          800,

                        letterSpacing:
                          "0.7px",

                        textTransform:
                          "uppercase",

                        borderBottom:
                          "1px solid #dce2d4",
                      }}
                    >
                      Last heat date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCattle.map(
                    (cow) => {
                      const isRecentRecord =
                        cow.id ===
                        recentRecordId;

                      return (
                        <tr
                          key={
                            cow.id
                          }
                          style={{
                            background:
                              isRecentRecord
                                ? "#b42318"
                                : "#ffffff",
                          }}
                        >
                        <td
                          style={{
                            width:
                              "52px",

                            padding:
                              "14px 10px",

                            borderBottom:
                              isRecentRecord
                                ? "1px solid rgba(255, 255, 255, 0.28)"
                                : "1px solid #e8ebe3",

                            color:
                              isRecentRecord
                                ? "#ffffff"
                                : "#747d6e",

                            fontSize:
                              "13px",

                            fontWeight:
                              isRecentRecord
                                ? 800
                                : 600,

                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            cow.id
                          }
                        </td>

                        <td
                          style={{
                            position:
                              "relative",

                            padding:
                              "14px 48px 14px 14px",

                            borderBottom:
                              isRecentRecord
                                ? "1px solid rgba(255, 255, 255, 0.28)"
                                : "1px solid #e8ebe3",

                            color:
                              isRecentRecord
                                ? "#ffffff"
                                : "#263222",

                            fontSize:
                              "14px",

                            fontWeight:
                              isRecentRecord
                                ? 800
                                : 700,

                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {isRecentRecord && (
                            <span
                              aria-hidden="true"
                              style={{
                                position:
                                  "absolute",

                                right:
                                  "12px",

                                top:
                                  "50%",

                                transform:
                                  "translateY(-50%)",

                                fontSize:
                                  "26px",

                                lineHeight:
                                  1,

                                animation:
                                  "handFloat 1.5s ease-in-out infinite",

                                pointerEvents:
                                  "none",

                                userSelect:
                                  "none",
                              }}
                            >
                              👉
                            </span>
                          )}

                          {
                            cow.name
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "14px",

                            borderBottom:
                              isRecentRecord
                                ? "1px solid rgba(255, 255, 255, 0.28)"
                                : "1px solid #e8ebe3",

                            color:
                              isRecentRecord
                                ? "#ffffff"
                                : "#263222",

                            fontSize:
                              "14px",

                            fontWeight:
                              isRecentRecord
                                ? 700
                                : 500,
                          }}
                        >
                          {
                            formatHeatDate(
                              cow.last_heat_date,
                            )
                          }
                        </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default App;
