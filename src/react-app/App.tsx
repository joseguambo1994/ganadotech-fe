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
  const [isLoading, setIsLoading] = useState(false);

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

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
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

  const uploadAudio = async (
    audioBlob: Blob,
  ) => {
    setIsLoading(true);

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

      /* OTHER HTTP ERRORS */

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

      /* SUCCESS */

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
    } finally {
      // Loading stays visible for the entire backend request
      // and disappears only after the response/error is handled.
      setIsLoading(false);
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
            border: "1px solid #d8decf",
            borderRadius: "36px",
            padding: "24px 24px 30px",
            boxShadow:
              "0 18px 50px rgba(54, 68, 48, 0.07)",
            overflow: "hidden",
          }}
        >
          {/* HEADER — loader never covers this area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginBottom: "24px",
              position: "relative",
              zIndex: 30,
            }}
          >
            <div
              style={{
                width: "108px",
                height: "108px",
                borderRadius: "26px",
                background: "#eef0eb",
                border: "1px solid #e1e5db",
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
                  width: "92px",
                  height: "92px",
                  objectFit: "contain",
                }}
              />
            </div>

            <div
              style={{
                textAlign: "left",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  color: "#315a31",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
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

          {/* BODY — loading overlay covers everything in here */}
          <div
            style={{
              position: "relative",
              minHeight: "410px",
            }}
          >
            {/* LOADING WHILE BACKEND RETURNS */}
            {isLoading && (
              <div
                role="status"
                aria-live="polite"
                aria-label="Processing recording"
                style={{
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
                }}
              >
                <div
                  style={{
                    width: "62px",
                    height: "62px",
                    borderRadius: "50%",
                    border: "6px solid #dfe6d8",
                    borderTopColor: "#315a31",
                    animation: "loadingSpin 0.8s linear infinite",
                  }}
                />

                <p
                  style={{
                    margin: "18px 0 0",
                    color: "#263222",
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  Processing audio...
                </p>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#747d6e",
                    fontSize: "12px",
                    lineHeight: 1.45,
                  }}
                >
                  Reading the cattle name and last heat date.
                </p>
              </div>
            )}

            {/* INSTRUCTION — smaller text, no different background */}
            <div
              style={{
                padding: "4px 8px 8px",
                textAlign: "center",
                opacity: showInstruction ? 1 : 0,
                transform: showInstruction
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
                  fontSize: "14px",
                  lineHeight: 1.4,
                  fontWeight: 700,
                }}
              >
                Say the cattle name and the last heat date.
              </p>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#65705f",
                  fontSize: "12px",
                  lineHeight: 1.45,
                }}
              >
                Example: “Cow Martha had her last heat on August 7, 2026.”
              </p>
            </div>

            {/* MICROPHONE AREA */}
            <div
              style={{
                marginTop: "18px",
                border: "1px solid #dce2d4",
                borderRadius: "25px",
                background: "#fbfcf8",
                padding: "28px 20px 20px",
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
              }}
            >
              {!isRecording ? (
                <>
                  {/* Mic is truly centered; hand floats independently */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      minHeight: "178px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={startRecording}
                      disabled={!showMicrophone || isLoading}
                      aria-label="Press to record"
                      style={{
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
                        animation:
                          "micPulse 1.8s ease-out infinite",
                      }}
                    >
                      🎙️
                    </button>

                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: "calc(50% + 76px)",
                        top: "70px",
                        fontSize: "52px",
                        lineHeight: 1,
                        animation:
                          "handFloat 1.5s ease-in-out infinite",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    >
                      👈
                    </div>
                  </div>

                  <p
                    style={{
                      margin: "14px 0 0",
                      color: "#263222",
                      fontSize: "15px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Press here to speak
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      minHeight: "178px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={stopRecording}
                      aria-label="Stop recording"
                      style={{
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
                      }}
                    >
                      ⏹
                    </button>
                  </div>

                  <p
                    style={{
                      margin: "14px 0 0",
                      color: "#8d3d30",
                      fontSize: "15px",
                      fontWeight: 700,
                      textAlign: "center",
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
                  background: statusBackground(),
                  border:
                    statusType === "error"
                      ? "1px solid #e4cbc5"
                      : "1px solid #e0e4d9",
                  borderRadius: "15px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: statusColor(),
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.4,
                    textAlign: "center",
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
                    padding: "14px 16px",
                    background: "#f8eeeb",
                    border: "1px solid #e6cec8",
                    borderRadius: "15px",
                    color: "#8d3d30",
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    textAlign: "left",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {isRecording && (
                <p
                  style={{
                    margin: "12px 0 0",
                    color: "#7b8275",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  Recording will stop automatically after 20 seconds.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
