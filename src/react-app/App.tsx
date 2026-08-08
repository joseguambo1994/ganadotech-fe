import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Parallax,
  ParallaxLayer,
  type IParallax,
} from "@react-spring/parallax";

import {
  appInlineCss,
  appStyles,
  getDateCellStyle,
  getIdCellStyle,
  getInstructionWrapStyle,
  getMicCardStyle,
  getNameCellStyle,
  getRefreshButtonStyle,
  getRowStyle,
  getStatusBoxStyle,
  getStatusTextStyle,
} from "./appStyles";
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

const PARALLAX_PAGES = 3.12;
const TABLE_OFFSET = 1.06;
const CALENDAR_OFFSET = 1.82;
const CHAT_OFFSET = 2.50;
const SIMULATION_LAST_DAY = 21;

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
  const [showInstruction, setShowInstruction] =
    useState(false);
  const [showMicrophone, setShowMicrophone] =
    useState(false);
  const [cattle, setCattle] = useState<
    CattleRecord[]
  >([]);
  const [isLoadingCattle, setIsLoadingCattle] =
    useState(false);
  const [cattleError, setCattleError] =
    useState("");
  const [recentRecordId, setRecentRecordId] =
    useState<number | null>(null);
  const [latestRegisteredCow, setLatestRegisteredCow] =
    useState<CattleRecord | null>(null);
  const [simulatedDay, setSimulatedDay] =
    useState(1);
  const [isSimulating, setIsSimulating] =
    useState(false);
  const [simulationFinished, setSimulationFinished] =
    useState(false);
  const [typedWordCount, setTypedWordCount] =
    useState(0);
  const [farmerTypedWordCount, setFarmerTypedWordCount] =
    useState(0);
  const [vetTypedWordCount, setVetTypedWordCount] =
    useState(0);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);
  const streamRef =
    useRef<MediaStream | null>(null);
  const timeoutRef =
    useRef<number | null>(null);
  const parallaxRef =
    useRef<IParallax | null>(null);
  const simulationTimerRef =
    useRef<number | null>(null);
  const typingTimerRef =
    useRef<number | null>(null);
  const chatScrollTimerRef =
    useRef<number | null>(null);
  const tableTransitionTimerRef =
    useRef<number | null>(null);

  const loadCattle = useCallback(
    async () => {
      setIsLoadingCattle(true);
      setCattleError("");

      try {
        const response =
          await fetch("/api/cattle");
        const responseText =
          await response.text();

        let result: CattleResponse = {};

        try {
          result = JSON.parse(responseText);
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
    },
    [],
  );

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
      clearTimeout(instructionTimer);
      clearTimeout(microphoneTimer);

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      if (
        simulationTimerRef.current !==
        null
      ) {
        clearTimeout(
          simulationTimerRef.current,
        );
      }

      if (
        typingTimerRef.current !==
        null
      ) {
        clearTimeout(
          typingTimerRef.current,
        );
      }

      if (
        chatScrollTimerRef.current !==
        null
      ) {
        clearTimeout(
          chatScrollTimerRef.current,
        );
      }

      if (
        tableTransitionTimerRef.current !==
        null
      ) {
        clearTimeout(
          tableTransitionTimerRef.current,
        );
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop(),
        );
    };
  }, []);

  useEffect(() => {
    loadCattle();
  }, [loadCattle]);

  useEffect(() => {
    if (recentRecordId === null) {
      return;
    }

    if (
      tableTransitionTimerRef.current !==
      null
    ) {
      clearTimeout(
        tableTransitionTimerRef.current,
      );
      tableTransitionTimerRef.current =
        null;
    }

    const scrollTimer =
      window.setTimeout(() => {
        parallaxRef.current?.scrollTo(
          TABLE_OFFSET,
        );

        tableTransitionTimerRef.current =
          window.setTimeout(() => {
            tableTransitionTimerRef.current =
              null;
            scrollToCalendar();
          }, 3000);
      }, 160);

    return () => {
      clearTimeout(scrollTimer);

      if (
        tableTransitionTimerRef.current !==
        null
      ) {
        clearTimeout(
          tableTransitionTimerRef.current,
        );
        tableTransitionTimerRef.current =
          null;
      }
    };
  }, [recentRecordId]);

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

  const clearSimulationTimer =
    () => {
      if (
        simulationTimerRef.current !==
        null
      ) {
        clearTimeout(
          simulationTimerRef.current,
        );
        simulationTimerRef.current =
          null;
      }
    };

  const clearTypingTimer =
    () => {
      if (
        typingTimerRef.current !==
        null
      ) {
        clearTimeout(
          typingTimerRef.current,
        );
        typingTimerRef.current =
          null;
      }
    };

  const clearChatScrollTimer =
    () => {
      if (
        chatScrollTimerRef.current !==
        null
      ) {
        clearTimeout(
          chatScrollTimerRef.current,
        );
        chatScrollTimerRef.current =
          null;
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
    if (response.missing_field === "name") {
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

    if (response.error === "No audio received") {
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

  const findRecentRecordId = (
    records: CattleRecord[],
    match: RecentRecordMatch,
  ) => {
    if (typeof match.id === "number") {
      return match.id;
    }

    const matchingRecords =
      records.filter(
        (record) =>
          (!match.name ||
            record.name === match.name) &&
          (!match.last_heat_date ||
            record.last_heat_date ===
              match.last_heat_date),
      );

    if (matchingRecords.length === 0) {
      return records.reduce(
        (latestId, record) =>
          record.id > latestId
            ? record.id
            : latestId,
        0,
      );
    }

    return matchingRecords.reduce(
      (latestId, record) =>
        record.id > latestId
          ? record.id
          : latestId,
      0,
    );
  };

  const formatHeatDate = (
    value: string,
  ) => {
    const isoDateMatch = value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

    if (isoDateMatch) {
      const [, year, month, day] =
        isoDateMatch;

      return `${day} ${monthNames[Number(month) - 1]} ${year}`;
    }

    const parsedDate =
      new Date(value);

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return value;
    }

    return formatDateObject(parsedDate);
  };

  const formatDateObject = (
    date: Date,
  ) => {
    const day = String(
      date.getDate(),
    ).padStart(2, "0");
    const month =
      monthNames[date.getMonth()];
    const year =
      date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const startRecording = async () => {
    try {
      setErrorMessage("");
      setStatus("Preparing microphone...");
      setStatusType("neutral");

      const stream =
        await navigator.mediaDevices.getUserMedia(
          { audio: true },
        );

      streamRef.current = stream;

      const chunks: Blob[] = [];
      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      mediaRecorder.ondataavailable =
        (event) => {
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

        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("Listening...");
      setStatusType("recording");

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

      if (response.status === 400) {
        const message =
          map400Error(result);

        setStatus("Please try again.");
        setStatusType("error");
        setErrorMessage(message);
        return;
      }

      if (result.status === 400) {
        let originalError: ApiResponse =
          result;

        if (
          typeof result.details ===
          "string"
        ) {
          const parsedDetails =
            parseJson(result.details);

          if (parsedDetails) {
            originalError = parsedDetails;
          }
        }

        const message =
          map400Error(originalError);

        setStatus("Please try again.");
        setStatusType("error");
        setErrorMessage(message);
        return;
      }

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

      setStatus(
        "Record saved successfully.",
      );
      setStatusType("success");
      setErrorMessage("");

      const refreshedCattle =
        await loadCattle();

      const matchedRecordId =
        findRecentRecordId(
          refreshedCattle,
          {
            id: result.id,
            name: result.name,
            last_heat_date:
            result.last_heat_date,
          },
        );

      const matchedRecord =
        refreshedCattle.find(
          (record) =>
            record.id === matchedRecordId,
        ) ||
        refreshedCattle.find(
          (record) =>
            record.name === result.name &&
            record.last_heat_date ===
              result.last_heat_date,
        ) ||
        null;

      setRecentRecordId(matchedRecordId);
      setLatestRegisteredCow(
        matchedRecord,
      );
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
      setIsLoading(false);
    }
  };

  const visibleCattle = [...cattle]
    .sort((left, right) => {
      const leftTime = Date.parse(
        left.created_at,
      );
      const rightTime = Date.parse(
        right.created_at,
      );

      if (
        !Number.isNaN(leftTime) &&
        !Number.isNaN(rightTime) &&
        leftTime !== rightTime
      ) {
        return rightTime - leftTime;
      }

      return right.id - left.id;
    })
    .slice(0, 5);

  const recentCow =
    latestRegisteredCow ||
    cattle.find(
      (record) =>
        record.id === recentRecordId,
    ) ||
    visibleCattle.find(
      (record) =>
        record.id === recentRecordId,
    ) ||
    null;

  const chatWords = [
    "Hi",
    "Farmer,",
    "the",
    "cow",
    recentCow?.name ||
      "lastnameofthecow",
    "is",
    "ready",
    "to",
    "be",
    "inseminated",
    "tomorrow.",
  ];
  const farmerChatWords = [
    "Okay",
    "👍,",
    "working",
    "on",
    "it.",
  ];
  const vetChatWords = [
    "💉",
    "Preparing",
    "insemination",
    "materials.",
  ];

  const scrollToCalendar = () => {
    parallaxRef.current?.scrollTo(
      CALENDAR_OFFSET,
    );

    window.setTimeout(() => {
      startSimulation();
    }, 520);
  };

  const startSimulation = () => {
    clearSimulationTimer();
    clearTypingTimer();
    clearChatScrollTimer();
    setSimulatedDay(1);
    setSimulationFinished(false);
    setIsSimulating(true);
    setTypedWordCount(0);
    setFarmerTypedWordCount(0);
    setVetTypedWordCount(0);

    runSimulationStep(1);
  };

  const getSimulationDelay = (
    currentDay: number,
  ) => {
    if (currentDay <= 3) {
      return 170;
    }

    if (currentDay <= 6) {
      return 120;
    }

    if (currentDay <= 19) {
      return 68;
    }

    return 190;
  };

  const runSimulationStep = (
    currentDay: number,
  ) => {
    if (
      currentDay >=
      SIMULATION_LAST_DAY
    ) {
      clearSimulationTimer();
      setSimulatedDay(
        SIMULATION_LAST_DAY,
      );
      setIsSimulating(false);
      setSimulationFinished(true);
      return;
    }

    simulationTimerRef.current =
      window.setTimeout(() => {
        const nextDay =
          currentDay + 1;

        setSimulatedDay(nextDay);
        runSimulationStep(nextDay);
      }, getSimulationDelay(currentDay));
  };

  useEffect(() => {
    clearTypingTimer();
    clearChatScrollTimer();

    if (!simulationFinished) {
      return;
    }

    chatScrollTimerRef.current =
      window.setTimeout(() => {
        parallaxRef.current?.scrollTo(
          CHAT_OFFSET,
        );
      }, 520);

    let nextWordIndex = 0;
    let activeSpeaker:
      | "ganado"
      | "farmer"
      | "vet" = "ganado";

    setTypedWordCount(0);
    setFarmerTypedWordCount(0);
    setVetTypedWordCount(0);

    const typeNextWord = () => {
      nextWordIndex += 1;

      if (activeSpeaker === "ganado") {
        setTypedWordCount(nextWordIndex);

        if (
          nextWordIndex >=
          chatWords.length
        ) {
          activeSpeaker = "farmer";
          nextWordIndex = 0;
          typingTimerRef.current =
            window.setTimeout(
              typeNextWord,
              420,
            );
          return;
        }

        typingTimerRef.current =
          window.setTimeout(
            typeNextWord,
            150,
          );
        return;
      }

      if (activeSpeaker === "farmer") {
        setFarmerTypedWordCount(
          nextWordIndex,
        );

        if (
          nextWordIndex >=
          farmerChatWords.length
        ) {
          activeSpeaker = "vet";
          nextWordIndex = 0;
          typingTimerRef.current =
            window.setTimeout(
              typeNextWord,
              420,
            );
          return;
        }

        typingTimerRef.current =
          window.setTimeout(
            typeNextWord,
            135,
          );
        return;
      }

      setVetTypedWordCount(nextWordIndex);

      if (
        nextWordIndex >=
        vetChatWords.length
      ) {
        typingTimerRef.current =
          null;
        return;
      }

      typingTimerRef.current =
        window.setTimeout(
          typeNextWord,
          140,
        );
    };

    typingTimerRef.current =
      window.setTimeout(
        typeNextWord,
        980,
      );

    return () => {
      clearTypingTimer();
      clearChatScrollTimer();
    };
  }, [simulationFinished, recentCow?.name]);

  return (
    <>
      <style>{appInlineCss}</style>

      <Parallax
        ref={parallaxRef}
        pages={PARALLAX_PAGES}
        style={appStyles.parallaxViewport}
        innerStyle={appStyles.parallaxInner}
      >
        <ParallaxLayer
          offset={0}
          speed={0}
          factor={PARALLAX_PAGES}
          style={appStyles.backgroundLayer}
        >
          <div style={appStyles.backgroundShell}>
            <div
              style={
                appStyles.backgroundOrbPrimary
              }
            />
            <div
              style={
                appStyles.backgroundOrbSecondary
              }
            />
          </div>
        </ParallaxLayer>

        <ParallaxLayer
          offset={0.04}
          speed={0.18}
          factor={0.96}
          style={appStyles.layerFrame}
        >
          <div style={appStyles.layerInner}>
            <section
              style={appStyles.voiceSection}
            >
              <div
                style={appStyles.voiceHeader}
              >
                <div
                  style={appStyles.logoCard}
                >
                  <img
                    src={logo}
                    alt="GanadoTech"
                    style={
                      appStyles.logoImage
                    }
                  />
                </div>

                <div
                  style={
                    appStyles.headerTextWrap
                  }
                >
                  <div
                    style={
                      appStyles.eyebrow
                    }
                  >
                    GANADOTECH SPA
                  </div>

                  <h1
                    style={appStyles.title}
                  >
                    Livestock Farmer
                    <br />
                    Assistant
                  </h1>
                </div>
              </div>

              <div style={appStyles.body}>
                {isLoading && (
                  <div
                    role="status"
                    aria-live="polite"
                    aria-label="Processing recording"
                    style={
                      appStyles.loadingOverlay
                    }
                  >
                    <div
                      style={
                        appStyles.largeSpinner
                      }
                    />

                    <p
                      style={
                        appStyles.loadingTitle
                      }
                    >
                      Processing audio...
                    </p>

                    <p
                      style={
                        appStyles.loadingText
                      }
                    >
                      Reading the cattle name
                      and last heat date.
                    </p>
                  </div>
                )}

                <div
                  style={getInstructionWrapStyle(
                    showInstruction,
                  )}
                >
                  <p
                    style={
                      appStyles.instructionTitle
                    }
                  >
                    Say the cattle name and
                    the last heat date.
                  </p>

                  <p
                    style={
                      appStyles.instructionExample
                    }
                  >
                    Example: "Cow Martha had
                    her last heat on August
                    7, 2026."
                  </p>
                </div>

                <div
                  style={getMicCardStyle(
                    showMicrophone,
                    isLoading,
                  )}
                >
                  {!isRecording ? (
                    <>
                      <div
                        style={appStyles.micArea}
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
                          style={
                            appStyles.microphoneButton
                          }
                        >
                          🎙️
                        </button>

                        <div
                          aria-hidden="true"
                          style={
                            appStyles.microphoneFinger
                          }
                        >
                          👈
                        </div>
                      </div>

                      <p
                        style={
                          appStyles.microphoneLabel
                        }
                      >
                        Press here to speak
                      </p>
                    </>
                  ) : (
                    <>
                      <div
                        style={
                          appStyles.stopButtonArea
                        }
                      >
                        <button
                          onClick={
                            stopRecording
                          }
                          aria-label="Stop recording"
                          style={
                            appStyles.stopButton
                          }
                        >
                          ⏹
                        </button>
                      </div>

                      <p
                        style={
                          appStyles.stopLabel
                        }
                      >
                        Press to finish
                      </p>
                    </>
                  )}

                  <div
                    style={getStatusBoxStyle(
                      statusType,
                    )}
                  >
                    <span
                      style={getStatusTextStyle(
                        statusType,
                      )}
                    >
                      {status ||
                        "The microphone is ready."}
                    </span>
                  </div>

                  {errorMessage && (
                    <div
                      style={
                        appStyles.errorBox
                      }
                    >
                      {errorMessage}
                    </div>
                  )}

                  {isRecording && (
                    <p
                      style={
                        appStyles.recordingHint
                      }
                    >
                      Recording will stop
                      automatically after 20
                      seconds.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </ParallaxLayer>

        <ParallaxLayer
          offset={TABLE_OFFSET}
          speed={0.14}
          factor={0.78}
          style={appStyles.layerFrame}
        >
          <div style={appStyles.layerInner}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <section
                style={appStyles.tableSection}
              >
                <div
                  style={
                    appStyles.tableHeader
                  }
                >
                  <div>
                    <h2
                      style={
                        appStyles.tableTitle
                      }
                    >
                      Cattle Registry
                    </h2>

                    <p
                      style={
                        appStyles.tableMeta
                      }
                    >
                      Showing{" "}
                      {
                        visibleCattle.length
                      }{" "}
                      of {cattle.length}{" "}
                      {cattle.length === 1
                        ? "registration"
                        : "registrations"}
                    </p>
                  </div>

                  <div
                    style={
                      appStyles.tableActions
                    }
                  >
                    <button
                      type="button"
                      hidden
                      style={{
                        ...appStyles.calendarNavButton,
                        cursor: "pointer",
                      }}
                    >
                      Calendar ↓
                    </button>

                    <button
                      type="button"
                      onClick={loadCattle}
                      disabled={
                        isLoadingCattle
                      }
                      style={getRefreshButtonStyle(
                        isLoadingCattle,
                      )}
                    >
                      {isLoadingCattle
                        ? "Loading..."
                        : "Refresh"}
                    </button>
                  </div>
                </div>

                {cattleError && (
                  <div
                    style={
                      appStyles.tableError
                    }
                  >
                    {cattleError}
                  </div>
                )}

                {isLoadingCattle &&
                cattle.length === 0 ? (
                  <div
                    style={
                      appStyles.firstLoad
                    }
                  >
                    <div
                      style={
                        appStyles.smallSpinner
                      }
                    />
                    Loading cattle
                    records...
                  </div>
                ) : cattle.length ===
                  0 ? (
                  <div
                    style={
                      appStyles.emptyState
                    }
                  >
                    No cattle
                    registrations yet.
                  </div>
                ) : (
                  <div
                    style={
                      appStyles.tableWrap
                    }
                  >
                    <table
                      style={
                        appStyles.table
                      }
                    >
                      <thead>
                        <tr
                          style={
                            appStyles.tableHeadRow
                          }
                        >
                          <th
                            style={
                              appStyles.idHeaderCell
                            }
                          >
                            ID
                          </th>
                          <th
                            style={
                              appStyles.headerCell
                            }
                          >
                            Cow name
                          </th>
                          <th
                            style={
                              appStyles.headerCell
                            }
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
                                key={cow.id}
                                data-recent={
                                  isRecentRecord
                                    ? "true"
                                    : "false"
                                }
                                style={getRowStyle(
                                  isRecentRecord,
                                )}
                              >
                                <td
                                  style={getIdCellStyle(
                                    isRecentRecord,
                                  )}
                                >
                                  {cow.id}
                                </td>

                                <td
                                  style={getNameCellStyle(
                                    isRecentRecord,
                                  )}
                                >
                                  {isRecentRecord && (
                                    <span
                                      aria-hidden="true"
                                      style={
                                        appStyles.recentRowFinger
                                      }
                                    >
                                      👉
                                    </span>
                                  )}

                                  {cow.name}
                                </td>

                                <td
                                  style={getDateCellStyle(
                                    isRecentRecord,
                                  )}
                                >
                                  {formatHeatDate(
                                    cow.last_heat_date,
                                  )}
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

            </div>
          </div>
        </ParallaxLayer>

        <ParallaxLayer
          offset={CALENDAR_OFFSET}
          speed={0.1}
          factor={0.66}
          style={appStyles.layerFrame}
        >
          <div style={appStyles.layerInner}>
            <section
              style={appStyles.calendarSection}
            >
              {isSimulating && (
                <div
                  style={
                    appStyles.calendarRunningText
                  }
                >
                  Time passing...
                </div>
              )}

              <div
                style={appStyles.calendarShell}
              >
                <div
                  style={appStyles.calendarFrame}
                >
                  <div
                    style={appStyles.calendarCard}
                  >
                    <div
                      style={appStyles.calendarTop}
                    >
                        <div
                          style={
                            appStyles.calendarTopLabel
                          }
                        >
                          GanadoTech
                        </div>

                      <div
                        style={
                          appStyles.calendarBindingRow
                        }
                      >
                        <span
                          style={
                            appStyles.calendarBindingDot
                          }
                        />
                        <span
                          style={
                            appStyles.calendarBindingDot
                          }
                        />
                        <span
                          style={
                            appStyles.calendarBindingDot
                          }
                        />
                      </div>
                    </div>

                    <div
                      style={
                        appStyles.calendarPageStage
                      }
                    >
                      <div
                        key={simulatedDay}
                        style={
                          appStyles.calendarPage
                        }
                      >
                        <div
                          style={
                            appStyles.calendarDayLabel
                          }
                        >
                          Day
                        </div>
                        <div
                          style={
                            appStyles.calendarDayNumber
                          }
                        >
                          {simulatedDay}
                        </div>
                        <div
                          style={
                            appStyles.calendarDayFooter
                          }
                        >
                          Cycle progression
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {simulationFinished && (
                <div
                  style={
                    appStyles.calendarComplete
                  }
                >
                  Day 21 reached
                </div>
              )}
            </section>
          </div>
        </ParallaxLayer>

        <ParallaxLayer
          offset={CHAT_OFFSET}
          speed={0.08}
          factor={0.58}
          style={appStyles.layerFrame}
        >
          <div style={appStyles.layerInner}>
            <section
              style={appStyles.chatSection}
            >
              <div style={appStyles.chatHeader}>
                <div
                  style={
                    appStyles.chatHeaderTitle
                  }
                >
                  GanadoTech
                </div>
                <div
                  style={
                    appStyles.chatHeaderSubtitle
                  }
                >
                  Farmer follow-up
                </div>
              </div>

              <div style={appStyles.chatBody}>
                <div
                  style={appStyles.chatPattern}
                />

                <div
                  style={
                    appStyles.chatBubbleRow
                  }
                >
                  <div
                    style={
                      appStyles.chatBubble
                    }
                  >
                    <div
                      style={
                        appStyles.chatSender
                      }
                    >
                      GanadoTech
                    </div>

                    <p
                      style={
                        appStyles.chatMessage
                      }
                    >
                      {chatWords
                        .slice(
                          0,
                          typedWordCount,
                        )
                        .map(
                          (
                            word,
                            index,
                          ) => (
                            <span
                              key={`${word}-${index}`}
                              style={
                                word ===
                                (recentCow?.name ||
                                  "lastnameofthecow")
                                  ? {
                                      ...appStyles.chatWord,
                                      ...appStyles.chatCowName,
                                    }
                                  : appStyles.chatWord
                              }
                            >
                              {word}
                            </span>
                          ),
                        )}
                    </p>

                    <div
                      style={
                        appStyles.chatMeta
                      }
                    >
                      Tomorrow
                    </div>
                  </div>
                </div>

                {farmerTypedWordCount >
                  0 && (
                  <>
                    <div
                      style={
                        appStyles.chatBubbleRowRight
                      }
                    >
                      <div
                        style={
                          appStyles.chatBubbleReply
                        }
                      >
                        <div
                          style={
                            appStyles.chatSenderReply
                          }
                        >
                          Farmer 🤠
                        </div>

                        <p
                          style={
                            appStyles.chatReplyMessage
                          }
                        >
                          {farmerChatWords
                            .slice(
                              0,
                              farmerTypedWordCount,
                            )
                            .map(
                              (
                                word,
                                index,
                              ) => (
                                <span
                                  key={`${word}-${index}`}
                                  style={
                                    appStyles.chatWord
                                  }
                                >
                                  {word}
                                </span>
                              ),
                            )}
                        </p>
                      </div>
                    </div>

                    {vetTypedWordCount >
                      0 && (
                      <div
                        style={{
                          ...appStyles.chatBubbleRow,
                          marginTop: "12px",
                        }}
                      >
                        <div
                          style={
                            appStyles.chatBubbleVet
                          }
                        >
                          <div
                            style={
                              appStyles.chatSenderVet
                            }
                          >
                            Vet 👨‍⚕️
                          </div>

                          <p
                            style={
                              appStyles.chatReplyMessage
                            }
                          >
                            {vetChatWords
                              .slice(
                                0,
                                vetTypedWordCount,
                              )
                              .map(
                                (
                                  word,
                                  index,
                                ) => (
                                  <span
                                    key={`${word}-${index}`}
                                    style={
                                      word ===
                                      "💉"
                                        ? {
                                            ...appStyles.chatWord,
                                            ...appStyles.chatNeedle,
                                          }
                                        : appStyles.chatWord
                                    }
                                  >
                                    {word}
                                  </span>
                                ),
                              )}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </ParallaxLayer>
      </Parallax>
    </>
  );
}

export default App;
