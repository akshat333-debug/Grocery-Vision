import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  RefreshCw,
  Camera as CameraIcon,
  Power,
  Clock,
  Smartphone,
} from "lucide-react";

const CameraComponent = ({ onCapture, isLoading, darkMode }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const webcamRef = useRef(null);
  const autoCaptureTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Get available camera devices
  const handleDevices = useCallback(
    (mediaDevices) => {
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === "videoinput"
      );
      setDevices(videoDevices);

      // Select a default device if available
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    },
    [selectedDeviceId]
  );

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then(handleDevices)
      .catch((err) => console.error("Error getting media devices:", err));

    return () => {
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [handleDevices]);

  const toggleCamera = () => {
    if (isCameraOn) {
      // Turn off camera and clear auto-capture
      setIsCameraOn(false);
      setAutoCapture(false);
      setCountdown(null);
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    } else {
      // Turn on camera
      setIsCameraOn(true);
    }
  };

  const startCountdown = () => {
    // Disable auto capture during manual countdown
    if (autoCapture) {
      setAutoCapture(false);
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
    }
    
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          captureImage();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    countdownTimerRef.current = timer;
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current && !isLoading) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      onCapture(imageSrc);
      setCountdown(null);
    }
  }, [onCapture, isLoading]);

  // Handle auto-capture with improved timer management
  useEffect(() => {
    // Clear any existing timer first
    if (autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }

    if (autoCapture && isCameraOn && !isLoading) {
      // Initial capture after a short delay to ensure camera is ready
      const initialTimer = setTimeout(() => {
        if (autoCapture && isCameraOn && !isLoading) {
          captureImage();
        }
      }, 1000);

      // Set up interval for subsequent captures
      autoCaptureTimerRef.current = setInterval(() => {
        if (autoCapture && isCameraOn && !isLoading) {
          captureImage();
        }
      }, 10000); // Capture every 10 seconds to reduce API load

      return () => {
        clearTimeout(initialTimer);
        if (autoCaptureTimerRef.current) {
          clearInterval(autoCaptureTimerRef.current);
          autoCaptureTimerRef.current = null;
        }
      };
    }

    return () => {
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
    };
  }, [autoCapture, isCameraOn, isLoading, captureImage]);

  const toggleAutoCapture = () => {
    if (!isCameraOn) {
      return; // Don't allow auto capture if camera is off
    }
    
    setAutoCapture((prev) => {
      const newValue = !prev;
      
      // If turning off auto capture, clear any existing timers
      if (!newValue) {
        if (autoCaptureTimerRef.current) {
          clearInterval(autoCaptureTimerRef.current);
          autoCaptureTimerRef.current = null;
        }
      }
      
      return newValue;
    });
  };

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "environment",
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap gap-4">
          {/* Modern Camera Toggle Button */}
          <button
            className={`relative group flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              isCameraOn
                ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
            } ${isLoading ? "opacity-50 cursor-not-allowed scale-100" : ""}`}
            onClick={toggleCamera}
            disabled={isLoading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Power className="h-5 w-5 mr-3 relative z-10" />
            <span className="relative z-10">{isCameraOn ? "Turn Off Camera" : "Turn On Camera"}</span>
            {isCameraOn && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            )}
          </button>

          {isCameraOn && (
            <>
              {/* Modern Capture Button */}
              <button
                className={`relative group flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isLoading || countdown 
                    ? "opacity-50 cursor-not-allowed scale-100 bg-gray-400" 
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                }`}
                onClick={startCountdown}
                disabled={isLoading || countdown !== null}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Camera className="h-5 w-5 mr-3 relative z-10" />
                <span className="relative z-10">{isLoading ? "Processing..." : "Capture"}</span>
                {countdown && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </button>

              {/* Modern Auto Capture Button */}
              <button
                className={`relative group flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  autoCapture
                    ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl"
                    : darkMode
                    ? "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white shadow-lg hover:shadow-xl"
                    : "bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 shadow-lg hover:shadow-xl"
                } ${isLoading ? "opacity-50 cursor-not-allowed scale-100" : ""}`}
                onClick={toggleAutoCapture}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <RefreshCw
                  className={`h-5 w-5 mr-3 relative z-10 ${
                    autoCapture ? "animate-spin" : ""
                  }`}
                />
                <span className="relative z-10">Auto-Capture {autoCapture ? "ON" : "OFF"}</span>
                {autoCapture && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
              </button>
            </>
          )}
        </div>

        {devices.length > 1 && (
          <div className="flex items-center">
            <Smartphone className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            <select
              className={`px-3 py-2 rounded-md border text-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={isLoading}
            >
              {devices.map((device, key) => (
                <option value={device.deviceId} key={device.deviceId}>
                  {device.label || `Camera ${key + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {isCameraOn && (
          <div className="group relative">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div
              className="relative bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700/50 transform transition-all duration-500 group-hover:scale-105"
              style={{ height: "400px" }}
            >
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover rounded-3xl"
              />

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white text-6xl font-black rounded-full w-24 h-24 flex items-center justify-center shadow-2xl">
                    {countdown}
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
                      <RefreshCw className="h-8 w-8 animate-spin text-white" />
                    </div>
                  </div>
                  <p className="text-white font-semibold text-lg">Processing...</p>
                  <div className="flex gap-1 mt-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}

            {autoCapture && !isLoading && (
              <div className="absolute top-4 right-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-xl">
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Auto-Capture On
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {!isCameraOn && !capturedImage && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 to-gray-600/20 dark:from-gray-500/10 dark:to-gray-700/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div
              className={`relative flex items-center justify-center rounded-3xl border-2 border-dashed backdrop-blur-xl ${
                darkMode
                  ? "border-gray-600/50 text-gray-400 bg-gray-900/20"
                  : "border-gray-300/50 text-gray-500 bg-white/20"
              }`}
              style={{ height: "400px" }}
            >
              <div className="text-center p-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-gray-400 to-gray-600 rounded-full p-6">
                    <CameraIcon className="h-16 w-16 text-white opacity-80" />
                  </div>
                </div>
                <p className="text-xl font-bold mb-2">Camera is turned off</p>
                <p className="text-sm opacity-75">Click "Turn On Camera" to start</p>
              </div>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20 dark:from-green-500/10 dark:via-emerald-500/10 dark:to-teal-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div
              className="relative bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700/50 transform transition-all duration-500 group-hover:scale-105"
              style={{ height: "400px" }}
            >
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover rounded-3xl"
              />
              <div className="absolute bottom-4 left-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur-lg opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-xl">
                    ✓ Captured Image
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {autoCapture && (
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 dark:from-yellow-400/10 dark:via-orange-400/10 dark:to-red-400/10 animate-pulse"></div>
          
          <div className="relative bg-gradient-to-r from-yellow-50/90 to-orange-50/90 dark:from-yellow-900/20 dark:to-orange-900/20 backdrop-blur-xl border border-yellow-200/50 dark:border-yellow-700/50 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-3">
                  <Clock className="h-6 w-6 text-white animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 mb-1">
                  Auto-Capture Mode Active
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                  Images will be automatically analyzed every 10 seconds
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Live Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraComponent;
