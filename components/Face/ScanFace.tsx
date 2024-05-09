import {
  FaceDetection,
  FaceLandmarks68,
  FaceMatch,
  FaceMatcher,
  LabeledFaceDescriptors,
  TinyFaceDetectorOptions,
  WithFaceDescriptor,
  WithFaceLandmarks,
  createCanvasFromMedia,
  detectSingleFace,
  draw,
  matchDimensions,
  nets,
  resizeResults,
} from "face-api.js";
import { TDrawDetectionsInput } from "face-api.js/build/commonjs/draw";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from "react";

const MODEL_URL = "/face-api-models";
const SUCCESS_THRESHOLD = 0.3;

export default function ScanFace({
  state,
  faceMatcher,
  setFaceMatcher,
}: {
  state: "login" | "register";
  faceMatcher?: FaceMatcher | null;
  setFaceMatcher: Dispatch<SetStateAction<FaceMatcher | null>>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  let intervalId: NodeJS.Timeout;

  const loadModels = async () => {
    await nets.tinyFaceDetector.load(MODEL_URL);
    await nets.faceLandmark68Net.load(MODEL_URL);
    await nets.faceRecognitionNet.load(MODEL_URL);
  };

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {},
      });

      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (error: any) {
      alert(`Error starting video stream: ${error.message}`);
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop()); // Stop each track

      videoRef.current.srcObject = null;
    }
  };

  const drawDetections = () => {
    const canvas = createCanvas();

    // match canvas dimensions to video dimensions
    const displaySize = {
      width: videoRef?.current?.width || 0,
      height: videoRef?.current?.height || 0,
    };
    matchDimensions(canvas, displaySize);

    // draw detections on canvas every 1s
    intervalId = setInterval(async () => {
      const detection = await detectSingleFace(
        videoRef?.current as HTMLVideoElement,
        new TinyFaceDetectorOptions()
      )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const resizedDetection = resizeResults(detection, displaySize);
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        draw.drawDetections(canvas, resizedDetection as TDrawDetectionsInput);
        draw.drawFaceLandmarks(canvas, resizedDetection);
      }
    }, 1000);
  };

  const startDrawingDetections = () => {
    if (videoRef?.current?.width && videoRef?.current?.height) {
      videoRef?.current?.addEventListener("play", drawDetections);
    }
  };

  const stopDrawingDetections = () => {
    if (videoRef?.current?.width && videoRef?.current?.height) {
      videoRef?.current?.removeEventListener("play", drawDetections);
    }
  };

  const createCanvas = () => {
    // create canvas from media
    const canvas = createCanvasFromMedia(videoRef?.current as HTMLVideoElement);
    const videoParent = document.getElementById("face-scan-parent");
    videoParent?.append(canvas);

    return canvas;
  };

  const removeCanvasFromDOM = () => {
    if (document.querySelector("canvas"))
      document.body.removeChild(
        document.querySelector("canvas") as HTMLCanvasElement
      );
  };

  const clearIntervals = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };

  const registerFace = useCallback(async () => {
    let bestDetection: WithFaceDescriptor<
      WithFaceLandmarks<
        {
          detection: FaceDetection;
        },
        FaceLandmarks68
      >
    > | null = null;

    const maxAttempts = 10; // maximum number of attempts
    let attempts = 0;

    const detectionInterval = setInterval(async () => {
      if (attempts < maxAttempts && videoRef?.current) {
        const detection = await detectSingleFace(
          videoRef.current,
          new TinyFaceDetectorOptions()
        )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          // Evaluate the quality of the detection
          const score = detection.detection.score;
          if (
            score >= SUCCESS_THRESHOLD &&
            (!bestDetection || score > bestDetection.detection.score)
          ) {
            bestDetection = detection;
          }
        }

        attempts++;
      } else {
        clearInterval(detectionInterval);

        if (
          bestDetection &&
          bestDetection.detection.score >= SUCCESS_THRESHOLD
        ) {
          const faceDescriptors = new LabeledFaceDescriptors("user", [
            bestDetection.descriptor,
          ]);
          setFaceMatcher(new FaceMatcher([faceDescriptors]));
          alert("Face registered successfully.");
        } else {
          alert("No satisfactory face detected for registration.");
        }
      }
    }, 1000); // detection interval in milliseconds
  }, [setFaceMatcher]);

  const loginFace = useCallback(async () => {
    let bestMatch: FaceMatch | null = null;
    const maxAttempts = 10; // maximum number of attempts
    let attempts = 0;

    const detectionInterval = setInterval(async () => {
      if (attempts < maxAttempts && videoRef?.current) {
        const detection = await detectSingleFace(
          videoRef.current,
          new TinyFaceDetectorOptions()
        )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const newBestMatch = faceMatcher?.findBestMatch(detection.descriptor);
          if (
            newBestMatch &&
            (!bestMatch || newBestMatch.distance < bestMatch.distance)
          ) {
            bestMatch = newBestMatch;
          }

          // Check if match is satisfactory
          if (bestMatch && bestMatch.distance < SUCCESS_THRESHOLD) {
            alert("Satisfactory match found");
            clearInterval(detectionInterval);
            // Proceed with login
          }
        }

        attempts++;
      } else {
        clearInterval(detectionInterval);
        if (!bestMatch || bestMatch.distance >= SUCCESS_THRESHOLD) {
          alert("No satisfactory face match found for login.");
        }
      }
    }, 1000); // detection interval in milliseconds
  }, [faceMatcher]);

  // handles the loading of models and starting of video
  useEffect(() => {
    loadModels().then(() => startVideo());

    return () => {
      stopVideo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handles the drawing of detections
  useEffect(() => {
    startDrawingDetections();

    return () => {
      stopDrawingDetections();

      removeCanvasFromDOM();

      clearIntervals();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handles sign up and sign in of face
  useEffect(() => {
    if (videoRef?.current) {
      if (state === "register") {
        registerFace();
      } else if (state === "login") {
        loginFace();
      }
    }
  }, [loginFace, registerFace, state]);

  return (
    <div className="relative" id="face-scan-parent">
      <video
        width={700}
        height={700}
        className="mx-auto"
        ref={videoRef}
        autoPlay={true}
        muted
      />
    </div>
  );
}
