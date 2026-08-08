import { useEffect, useRef, useState } from "react";
import logo from "./assets/ganadotech-logo.png";

type StatusType = "neutral" | "recording" | "success" | "error";

type ApiResponse = {
  success?: boolean;
  error?: string;
  missing_field?: string;
  transcription?: string;

  id?: number;
  name?: string;
  last_heat_date?: string;
  created_at?: string;

  // These two can come from your Hono proxy
  status?: number;
  details?: string;
};

function App() {
  const [isRecording, setIsRecording] = useState(false);

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] =
    useState<StatusType>("neutral");

  const [errorMessage, setErrorMessage] = useState("");

  const [showInstruction, setShowInstruction] =
    useState(false);

  const [showMicrophone, setShowMicrophone] =
    useState(false);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const timeoutRef =
    useRef<number | null>(null);

  useEffect(() => {
    const instructionTimer = window.setTimeout(() => {
      setShowInstruction(true);
    }, 450);

    const microphoneTimer = window.setTimeout(() => {
      setShowMicrophone(true);
    }, 1600);

    return () => {
      clearTimeout(instructionTimer);
      clearTimeout(microphoneTimer);
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMessage("");
      setStatus("Preparing microphone...");
      setStatusType("neutral");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const chunks: Blob[] = [];

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, {
          type: mediaRecorder.mimeType,
        });

        stream
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
        mediaRecorderRef.current = null;

        setIsRecording(false);

        console.log("Recorded audio:", {
          type: audioBlob.type,
          size: audioBlob.size,
        });

        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();

      setIsRecording(true);

      setStatus("Listening...");
      setStatusType("recording");

      // Maximum recording time: 20 seconds
      timeoutRef.current =
        window.setTimeout(() => {
          stopRecording();
        }, 20_000);
    } catch (error) {
      console.error(
        "Microphone error:",
        error,
      );

      setIsRecording(false);

      setStatus("Microphone unavailable.");
      setStatusType("error");

      setErrorMessage(
        "We could not access your microphone. Please check your browser permissions and try again.",
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      setStatus("Processing...");
      setStatusType("neutral");

      mediaRecorderRef.current.stop();
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const parseJson = (
    value: string,
  ): ApiResponse | null => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const map400Error = (
    response: ApiResponse,
  ) => {
    if (
      response.missing_field === "name"
    ) {
      return (
        "I couldn't identify the cattle name. " +
        "Please try again and clearly say the animal's name."
      );
    }

    if (
      response.missing_field ===
      "last_heat_date"
    ) {
      return (
        "I couldn't identify the last heat date. " +
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

  const uploadAudio = async (
    audioBlob: Blob,
  ) => {
    try {
      setErrorMessage("");

      setStatus("Processing audio...");
      setStatusType("neutral");

      const response = await fetch(
        "/api/audio",
        {
          method: "POST",

          headers: {
            "Content-Type":
              audioBlob.type ||
              "application/octet-stream",
          },

          body: audioBlob,
        },
      );

      const responseText =
        await response.text();

      const result =
        parseJson(responseText) || {};

      /*
       * ------------------------------------------------
       * HANDLE DIRECT 400
       * ------------------------------------------------
       *
       * Worker returns:
       *
       * HTTP 400
       * {
       *   success: false,
       *   error: "Cow name missing",
       *   missing_field: "name"
       * }
       *
       */

      if (response.status === 400) {
        const message =
          map400Error(result);

        setStatus("Please try again.");
        setStatusType("error");
        setErrorMessage(message);

        return;
      }

      /*
       * ------------------------------------------------
       * HANDLE 400 WRAPPED BY YOUR HONO PROXY
       * ------------------------------------------------
       *
       * Your proxy may return:
       *
       * HTTP 502
       *
       * {
       *   error: "Speech-to-text request failed",
       *   status: 400,
       *   details: "{...original Worker JSON...}"
       * }
       *
       */

      if (
        result.status === 400
      ) {
        let originalError: ApiResponse =
          result;

        if (
          typeof result.details ===
          "string"
        ) {
          const parsedDetails =
            parseJson(result.details);

          if (parsedDetails) {
            originalError =
              parsedDetails;
          }
        }

        const message =
          map400Error(originalError);

        setStatus("Please try again.");
        setStatusType("error");
        setErrorMessage(message);

        return;
      }

      /*
       * OTHER HTTP ERRORS
       */

      if (!response.ok) {
        console.error(
          "API error:",
          response.status,
          result,
        );

        setStatus(
          "Unable to process recording.",
        );

        setStatusType("error");

        setErrorMessage(
          result.error ||
            "Something went wrong while processing the recording. Please try again.",
        );

        return;
      }

      /*
       * SUCCESS
       */

      console.log(
        "Speech response:",
        result,
      );

      setStatus(
        "Record saved successfully.",
      );

      setStatusType("success");

      setErrorMessage("");
    } catch (error) {
      console.error(
        "Audio upload error:",
        error,
      );

      setStatus(
        "Unable to process recording.",
      );

      setStatusType("error");

      setErrorMessage(
        "We could not connect to the service. Please try again.",
      );
    }
  };

  const statusBackground = () => {
    if (statusType === "error") {
      return "#f7ebe8";
    }

    if (statusType === "success") {
      return "#edf4e8";
    }

    if (statusType === "recording") {
      return "#edf4e8";
    }

    return "#f4f5f0";
  };

  const statusColor = () => {
    if (statusType === "error") {
      return "#9b4034";
    }

    if (
      statusType === "success" ||
      statusType === "recording"
    ) {
      return "#315a31";
    }

    return "#697164";
  };

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

          @keyframes fingerSlide {
            0%,
            100% {
              transform: translateX(10px);
            }

            50% {
              transform: translateX(-8px);
            }
          }

          @keyframes micPulse {
            0% {
              box-shadow:
                0 0 0 0 rgba(66, 105, 60, 0.18),
                0 8px 22px rgba(45, 62, 40, 0.10);
            }

            70% {
              box-shadow:
                0 0 0 15px rgba(66, 105, 60, 0),
                0 8px 22px rgba(45, 62, 40, 0.10);
            }

            100% {
              box-shadow:
                0 0 0 0 rgba(66, 105, 60, 0),
                0 8px 22px rgba(45, 62, 40, 0.10);
            }
          }

          @keyframes recordingPulse {
            0%,
            100% {
              transform: scale(1);
            }

            50% {
              transform: scale(1.035);
            }
          }

          button {
            font-family: inherit;
          }
        `}
      </style>

      <main
        style={{
          minHeight: "100vh",

          background: "#eef2e8",

          padding: "18px",

          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "500px",

            background: "#fbfcf8",

            border:
              "1px solid #d8decf",

            borderRadius: "36px",

            padding:
              "26px 24px 32px",

            boxShadow:
              "0 18px 50px rgba(54, 68, 48, 0.07)",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",

              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "82px",
                height: "82px",

                borderRadius: "22px",

                background: "#eef0eb",

                border:
                  "1px solid #e1e5db",

                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                flexShrink: 0,
              }}
            >
              <img
                src={logo}
                alt="GanadoTech"
                style={{
                  width: "64px",
                  height: "64px",
                  objectFit: "contain",
                }}
              />
            </div>

            <div
              style={{
                textAlign: "left",
              }}
            >
              <div
                style={{
                  color: "#315a31",

                  fontSize: "12px",

                  fontWeight: 800,

                  letterSpacing:
                    "1.8px",

                  textTransform:
                    "uppercase",

                  marginBottom: "5px",
                }}
              >
                GANADOTECH SPA
              </div>

              <h1
                style={{
                  margin: 0,

                  color: "#10140e",

                  fontFamily:
                    "Georgia, 'Times New Roman', serif",

                  fontSize: "31px",

                  lineHeight: 1.05,

                  fontWeight: 700,
                }}
              >
                Livestock Farmer
                <br />
                Assistant
              </h1>
            </div>
          </div>

          {/* INSTRUCTION CARD */}

          <div
            style={{
              border:
                "1px solid #dce2d4",

              background: "#f1f4eb",

              borderRadius: "25px",

              padding: "22px 20px",

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
                margin: 0,

                color: "#172016",

                fontSize: "18px",

                lineHeight: 1.45,

                fontWeight: 700,
              }}
            >
              Say the cattle name and
              the last heat date.
            </p>

            <div
              style={{
                width: "42px",
                height: "2px",

                background:
                  "#cdd6c5",

                margin:
                  "17px auto",

                borderRadius: "2px",
              }}
            />

            <p
              style={{
                margin: 0,

                color: "#65705f",

                fontSize: "14px",

                lineHeight: 1.55,
              }}
            >
              Example: “Cow Martha
              had her last heat on
              August 7, 2026.”
            </p>
          </div>

          {/* MICROPHONE CARD */}

          <div
            style={{
              marginTop: "18px",

              border:
                "1px solid #dce2d4",

              borderRadius: "25px",

              background: "#fbfcf8",

              padding:
                "24px 20px 20px",

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
                showMicrophone
                  ? "auto"
                  : "none",
            }}
          >
            {!isRecording ? (
              <>
                <div
                  style={{
                    display: "flex",

                    justifyContent:
                      "center",

                    alignItems:
                      "center",

                    gap: "18px",
                  }}
                >
                  {/* MICROPHONE */}

                  <button
                    onClick={
                      startRecording
                    }
                    disabled={
                      !showMicrophone
                    }
                    aria-label="Press to record"
                    style={{
                      width: "116px",
                      height: "116px",

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
                        "46px",

                      display: "flex",

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

                  {/* MOVING FINGER */}

                  <div
                    style={{
                      fontSize:
                        "47px",

                      lineHeight: 1,

                      animation:
                        "fingerSlide 0.85s ease-in-out infinite",

                      userSelect:
                        "none",
                    }}
                  >
                    👈
                  </div>
                </div>

                <p
                  style={{
                    margin:
                      "18px 0 0",

                    color:
                      "#263222",

                    fontSize:
                      "15px",

                    fontWeight:
                      700,
                  }}
                >
                  Press here to speak
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={
                    stopRecording
                  }
                  aria-label="Stop recording"
                  style={{
                    width: "116px",
                    height: "116px",

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
                      "42px",

                    animation:
                      "recordingPulse 1.2s ease-in-out infinite",
                  }}
                >
                  ⏹
                </button>

                <p
                  style={{
                    margin:
                      "18px 0 0",

                    color:
                      "#8d3d30",

                    fontSize:
                      "15px",

                    fontWeight:
                      700,
                  }}
                >
                  Press to finish
                </p>
              </>
            )}

            {/* STATUS */}

            <div
              style={{
                marginTop: "18px",

                minHeight: "47px",

                background:
                  statusBackground(),

                border:
                  statusType ===
                  "error"
                    ? "1px solid #e4cbc5"
                    : "1px solid #e0e4d9",

                borderRadius: "15px",

                padding:
                  "12px 14px",

                display: "flex",

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

                  fontSize: "14px",

                  fontWeight: 600,

                  lineHeight: 1.4,
                }}
              >
                {status ||
                  "The microphone is ready."}
              </span>
            </div>

            {/* 400 / API ERROR MESSAGE */}

            {errorMessage && (
              <div
                style={{
                  marginTop: "12px",

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
                }}
              >
                Recording will stop
                automatically after 20
                seconds.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default App;