import { useEffect, useRef, useState } from "react";
import logo from "./assets/ganadotech-logo.png";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");

  const [showInstruction, setShowInstruction] = useState(false);
  const [showMicrophone, setShowMicrophone] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const instructionTimer = window.setTimeout(() => {
      setShowInstruction(true);
    }, 500);

    const microphoneTimer = window.setTimeout(() => {
      setShowMicrophone(true);
    }, 1700);

    return () => {
      clearTimeout(instructionTimer);
      clearTimeout(microphoneTimer);
    };
  }, []);

  const startRecording = async () => {
    try {
      setStatus("Preparando micrófono...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, {
          type: mediaRecorder.mimeType,
        });

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        setIsRecording(false);

        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();

      setIsRecording(true);
      setStatus("Escuchando...");

      timeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, 20_000);
    } catch (error) {
      console.error("Microphone error:", error);

      setIsRecording(false);
      setStatus("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      setStatus("Procesando...");
      mediaRecorderRef.current.stop();
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      setStatus("Procesando audio...");

      const response = await fetch("/api/audio", {
        method: "POST",
        headers: {
          "Content-Type":
            audioBlob.type || "application/octet-stream",
        },
        body: audioBlob,
      });

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          `Upload failed: ${response.status} ${text}`,
        );
      }

      const result = await response.json();

      console.log("Speech response:", result);

      setStatus("Registro guardado.");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo procesar el audio.");
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fingerBounce {
            0%,
            100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(12px);
            }
          }

          @keyframes micPulse {
            0% {
              box-shadow: 0 0 0 0 rgba(28, 112, 61, 0.35);
            }

            70% {
              box-shadow: 0 0 0 20px rgba(28, 112, 61, 0);
            }

            100% {
              box-shadow: 0 0 0 0 rgba(28, 112, 61, 0);
            }
          }
        `}
      </style>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(180deg, #ffffff 0%, #f1f6ef 100%)",
          fontFamily:
            "Inter, Arial, Helvetica, sans-serif",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            textAlign: "center",
          }}
        >
          {/* LOGO */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <img
              src={logo}
              alt="GanadoTech"
              style={{
                width: "240px",
                maxWidth: "75vw",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <p
            style={{
              margin: "0 0 48px",
              color: "#657066",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.2px",
            }}
          >
            Asistente para ganaderos
          </p>

          {/* TEXT FADES IN AND STAYS */}
          <div
            style={{
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                maxWidth: "360px",
                fontSize: "27px",
                lineHeight: 1.35,
                fontWeight: 700,
                color: "#1f2b21",

                opacity: showInstruction ? 1 : 0,

                transform: showInstruction
                  ? "translateY(0)"
                  : "translateY(18px)",

                transition:
                  "opacity 0.9s ease, transform 0.9s ease",
              }}
            >
              Di el nombre del ganado
              <br />
              y la última fecha de celo.
            </h2>
          </div>

          {/* MICROPHONE */}
          <div
            style={{
              marginTop: "25px",
              opacity: showMicrophone ? 1 : 0,
              transform: showMicrophone
                ? "translateY(0)"
                : "translateY(20px)",
              transition:
                "opacity 0.7s ease, transform 0.7s ease",
              pointerEvents: showMicrophone
                ? "auto"
                : "none",
            }}
          >
            {/* MOVING FINGER */}
            {!isRecording && (
              <div
                style={{
                  marginBottom: "8px",
                  fontSize: "52px",
                  lineHeight: 1,
                  animation:
                    "fingerBounce 0.9s ease-in-out infinite",
                  userSelect: "none",
                }}
              >
                👇
              </div>
            )}

            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!showMicrophone}
                aria-label="Presiona para grabar"
                style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  border: "none",
                  background:
                    "linear-gradient(145deg, #24834c, #176b3a)",
                  color: "white",
                  fontSize: "52px",
                  cursor: "pointer",
                  animation:
                    "micPulse 1.8s infinite",
                  boxShadow:
                    "0 10px 25px rgba(23, 107, 58, 0.25)",
                }}
              >
                🎙️
              </button>
            ) : (
              <button
                onClick={stopRecording}
                aria-label="Detener grabación"
                style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  border: "none",
                  background:
                    "linear-gradient(145deg, #df3b3b, #b91c1c)",
                  color: "white",
                  fontSize: "46px",
                  cursor: "pointer",
                  boxShadow:
                    "0 10px 25px rgba(185, 28, 28, 0.25)",
                }}
              >
                ⏹
              </button>
            )}

            {!isRecording && (
              <p
                style={{
                  marginTop: "16px",
                  color: "#667066",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                Presiona aquí para hablar
              </p>
            )}
          </div>

          <p
            style={{
              marginTop: "24px",
              minHeight: "24px",
              fontSize: "17px",
              fontWeight: 600,
              color: isRecording
                ? "#176b3a"
                : "#4b554d",
            }}
          >
            {status}
          </p>

          {isRecording && (
            <p
              style={{
                marginTop: "8px",
                color: "#777",
                fontSize: "14px",
              }}
            >
              Presiona el botón rojo cuando termines.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

export default App;