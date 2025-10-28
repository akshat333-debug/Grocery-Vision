import { useState, useEffect } from "react";
import CameraComponent from "./components/CameraComponent";
import ItemsTable from "./components/ItemsTable";
import FreshnessTable from "./components/FreshnessTable";
import FileUpload from "./components/FileUpload";
import {
  Sun,
  Moon,
  ShoppingCart,
  Leaf,
  Info,
  AlertTriangle,
  Camera,
  Upload,
  Sparkles,
  Box,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [items, setItems] = useState([]);
  const [freshProduce, setFreshProduce] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [activeTab, setActiveTab] = useState("camera"); // camera, upload
  const [isBackendRunning, setIsBackendRunning] = useState(true);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Check if backend is running
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        await axios.get(API_URL);
        setIsBackendRunning(true);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          setIsBackendRunning(false);
          setError(
            "Backend server is not running. Please start the backend server."
          );
        }
      }
    };

    checkBackendStatus();
  }, []);

  const onImageCapture = async (imageSrc) => {
    if (!isBackendRunning) {
      setError(
        "Backend server is not running. Please start the backend server."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await processImage(imageSrc);
    } catch (err) {
      setError(`Error processing image: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processImage = async (imageSrc) => {
    try {
      // Convert data URL to blob more reliably
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();

      // Add the image with a unique name including timestamp to avoid caching issues
      const timestamp = new Date().getTime();
      formData.append("image", blob, `image_${timestamp}.jpg`);

      console.log("📦 FormData created with image:", blob.size, "bytes");

      // Process in sequence to avoid overwhelming the backend
      await detectItems(formData);
      await detectFreshness(formData);
    } catch (err) {
      console.error("❌ Error in processImage:", err);
      setError(`Error processing image: ${err.message}`);
    }
  };

  const detectItems = async (formData) => {
    try {
      console.log("🚀 Sending item detection request to API...");
      setError(null);

      // Use API URL from environment variables
      const url = `${API_URL}/api/detect-items`;
      console.log("📡 Sending request to:", url);

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60-second timeout for API processing
        withCredentials: false,
      });

      console.log("📊 Response status:", response.status);

      if (response.data && response.data.message === "Success") {
        if (Array.isArray(response.data.result)) {
          console.log(
            "✅ Received",
            response.data.result.length,
            "items from API"
          );
          setItems(response.data.result);
        } else if (typeof response.data.result === "string") {
          // Parse string response
          const text = response.data.result;
          console.log("📝 Parsing text response");
          const items = parseTextToItems(text);
          console.log("✅ Parsed", items.length, "items");
          setItems(items);
        } else {
          console.warn("⚠️ Unknown response format");
          setItems([]);
        }
      } else if (response.data && response.data.error) {
        throw new Error(response.data.error);
      } else {
        console.warn("⚠️ Invalid response format");
        setItems([]);
      }
    } catch (error) {
      console.error("❌ Error detecting items:", error);

      // Set appropriate error message based on error type
      if (error.code === "ERR_NETWORK") {
        setError(
          "Cannot connect to backend server. Please make sure the backend is running on port 5000."
        );
      } else if (error.code === "ECONNABORTED") {
        setError("Request timed out. The server took too long to respond.");
      } else if (error.response?.data?.error) {
        setError(`API Error: ${error.response.data.error}`);
      } else if (error.response?.status === 500) {
        setError(
          "Server error (500). This might be due to an invalid API key or server configuration issue."
        );
      } else {
        setError(`Error: ${error.message}`);
      }

      setItems([]);
    }
  };

  const detectFreshness = async (formData) => {
    try {
      console.log("🚀 Sending freshness detection request to API...");
      setError(null);

      // Use API URL from environment variables
      const url = `${API_URL}/api/detect-freshness`;
      console.log("📡 Sending request to:", url);

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60-second timeout for API processing
        withCredentials: false,
      });

      console.log("📊 Response status:", response.status);

      if (response.data && response.data.message === "Success") {
        if (Array.isArray(response.data.result)) {
          console.log(
            "✅ Received",
            response.data.result.length,
            "produce items from API"
          );
          setFreshProduce(response.data.result);
        } else if (typeof response.data.result === "string") {
          // Parse string response
          const text = response.data.result;
          console.log("📝 Parsing text response");
          const produce = parseTextToProduce(text);
          console.log("✅ Parsed", produce.length, "produce items");
          setFreshProduce(produce);
        } else {
          console.warn("⚠️ Unknown response format");
          setFreshProduce([]);
        }
      } else if (response.data && response.data.error) {
        throw new Error(response.data.error);
      } else {
        console.warn("⚠️ Invalid response format");
        setFreshProduce([]);
      }
    } catch (error) {
      console.error("❌ Error detecting freshness:", error);

      // Set appropriate error message based on error type
      if (error.code === "ERR_NETWORK") {
        setError(
          "Cannot connect to backend server. Please make sure the backend is running on port 5000."
        );
      } else if (error.code === "ECONNABORTED") {
        setError("Request timed out. The server took too long to respond.");
      } else if (error.response?.data?.error) {
        setError(`API Error: ${error.response.data.error}`);
      } else if (error.response?.status === 500) {
        setError(
          "Server error (500). This might be due to an invalid API key or server configuration issue."
        );
      } else {
        setError(`Error: ${error.message}`);
      }

      setFreshProduce([]);
    }
  };

  const onFileUpload = async (file) => {
    if (!isBackendRunning) {
      setError(
        "Backend server is not running. Please start the backend server."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      await detectItems(formData);
      await detectFreshness(formData);
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDEydjZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bS0yNCAxMnY2aDZ2LTZoLTZ6bTAtMTJ2Nmg2di02aC02em0xMiAwdjZoNnYtNmgtNnptMCAxMnY2aDZ2LTZoLTZ6bS0xMi0yNHY2aDZ2LTZoLTZ6bTEyIDB2Nmg2di02aC02em0xMiAwdjZoNnYtNmgtNnptMCAxMnY2aDZ2LTZoLTZ6bS0yNCAwdjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-60 dark:opacity-20 pointer-events-none"></div>

      <div className="container relative z-10 mx-auto px-4 py-8">
        {/* Modern Hero Header */}
        <header className="relative overflow-hidden mb-12">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-3xl blur-3xl animate-pulse"></div>
          
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {/* Enhanced logo with glow effect */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-2xl p-4 shadow-xl">
                    <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                    <Sparkles className="h-4 w-4 text-yellow-900" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-4xl font-black flex items-center gap-3">
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-pulse">
                      Grocery Vision
                    </span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                    Smart inventory assistant powered by 
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold"> AI Vision Technology</span>
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time analysis • Instant results • Smart detection</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Enhanced dark mode toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="relative p-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  aria-label="Toggle dark mode"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    {darkMode ? (
                      <Sun className="h-6 w-6 text-yellow-500" />
                    ) : (
                      <Moon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {!isBackendRunning && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-600 text-amber-800 dark:text-amber-200 rounded-xl shadow-lg flex items-start">
            <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5 text-amber-500 dark:text-amber-400 animate-pulse" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Backend Not Running
              </h3>
              <p className="text-sm mb-3">
                The backend server is not running. Please start it with:
              </p>
              <div className="bg-amber-100/80 dark:bg-amber-900/40 p-4 rounded-lg shadow-inner font-mono text-sm border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 mr-1.5"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1.5"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-3 text-amber-700 dark:text-amber-300 opacity-70">
                    Terminal
                  </span>
                </div>
                <code className="block text-amber-800 dark:text-amber-300">
                  cd backend
                  <br />
                  npm run dev
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Modern Main Content Area */}
        <div className="relative overflow-hidden mb-12">
          {/* Subtle animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-3xl"></div>
          
          <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 border border-white/30 dark:border-gray-700/50 shadow-2xl">
            {/* Modern Tab Navigation */}
            <div className="flex mb-8 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setActiveTab("camera")}
                className={`relative flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-3 rounded-xl transition-all duration-300 ${
                  activeTab === "camera"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <Camera
                  className={`h-5 w-5 ${
                    activeTab === "camera"
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
                <span>Live Camera</span>
                {activeTab === "camera" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl animate-pulse"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`relative flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-3 rounded-xl transition-all duration-300 ${
                  activeTab === "upload"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <Upload
                  className={`h-5 w-5 ${
                    activeTab === "upload"
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
                <span>Upload Image</span>
                {activeTab === "upload" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl animate-pulse"></div>
                )}
              </button>
            </div>

          {activeTab === "camera" && (
            <CameraComponent
              onCapture={onImageCapture}
              isLoading={isLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === "upload" && (
            <FileUpload
              onFileUpload={onFileUpload}
              isLoading={isLoading}
              darkMode={darkMode}
            />
          )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl shadow-lg my-6 overflow-hidden transition-all duration-300">
            <div className="px-4 py-3 bg-red-100/50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium">Error</span>
            </div>
            <div className="p-4 flex items-start">
              <div className="w-full">
                <p className="font-medium">{error}</p>
                {error &&
                  (error.includes("API key not valid") ||
                    error.includes("API key") ||
                    error.includes("Gemini API")) && (
                    <div className="mt-3 text-sm bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-red-100 dark:border-red-900">
                      <p className="font-semibold mb-2">
                        Fix the API key issues:
                      </p>
                      <ol className="list-decimal ml-5 mt-1 space-y-2">
                        <li>
                          Get a free API key from{" "}
                          <a
                            href="https://makersuite.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline"
                          >
                            Google MakerSuite
                          </a>
                        </li>
                        <li>Open the backend/.env file</li>
                        <li>Update the GOOGLE_API_KEY with your API key</li>
                        <li>
                          Restart the backend server:{" "}
                          <code className="bg-red-50 dark:bg-red-900/50 px-2 py-1 rounded font-mono">
                            npm run dev
                          </code>
                        </li>
                      </ol>
                    </div>
                  )}

                {error && error.includes("backend server") && (
                  <div className="mt-3 text-sm bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-red-100 dark:border-red-900">
                    <p className="font-semibold mb-2">
                      Start the backend server:
                    </p>
                    <ol className="list-decimal ml-5 mt-1 space-y-2">
                      <li>Open a new terminal</li>
                      <li>
                        Navigate to the backend directory:{" "}
                        <code className="bg-red-50 dark:bg-red-900/50 px-2 py-1 rounded font-mono">
                          cd backend
                        </code>
                      </li>
                      <li>
                        Start the server:{" "}
                        <code className="bg-red-50 dark:bg-red-900/50 px-2 py-1 rounded font-mono">
                          npm run dev
                        </code>
                      </li>
                    </ol>
                  </div>
                )}

                {error && error.includes("timed out") && (
                  <div className="mt-3 text-sm bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-red-100 dark:border-red-900">
                    <p className="font-semibold mb-2">
                      The request timed out. Try these steps:
                    </p>
                    <ol className="list-decimal ml-5 mt-1 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>Check your internet connection</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>
                          Try again with a smaller image or a clearer photo
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>The API might be experiencing high traffic</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>Restart the backend server and try again</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modern Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Item Detection Card */}
          <div className="group relative">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/30 dark:border-gray-700/50 transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
              {/* Modern Header */}
              <div className="relative px-8 py-6 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-3 shadow-xl">
                        <Box className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Item Detection
                        </span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                        AI-powered analysis of grocery items
                      </p>
                    </div>
                  </div>
                  
                  {/* Modern Counter */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl px-4 py-2 shadow-xl">
                      <span className="text-white font-black text-lg">
                        {items.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-0">
                <ItemsTable items={items} darkMode={darkMode} />
              </div>
            </div>
          </div>

          {/* Fresh Produce Card */}
          <div className="group relative">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20 dark:from-green-500/10 dark:via-emerald-500/10 dark:to-teal-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/30 dark:border-gray-700/50 transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
              {/* Modern Header */}
              <div className="relative px-8 py-6 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 dark:from-green-500/5 dark:via-emerald-500/5 dark:to-teal-500/5 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-lg opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-3 shadow-xl">
                        <Leaf className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          Fresh Produce
                        </span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                        Smart freshness assessment
                      </p>
                    </div>
                  </div>
                  
                  {/* Modern Counter */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl px-4 py-2 shadow-xl">
                      <span className="text-white font-black text-lg">
                        {freshProduce.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-0">
                <FreshnessTable
                  freshProduce={freshProduce}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
          <div className="flex items-center mb-2">
            <ShoppingCart className="h-4 w-4 mr-1" />
            <p>Smart Grocery Assistant</p>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Grocery Vision - Smart inventory
            made simple
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

// Helper function to parse text response into structured items
const parseTextToItems = (text) => {
  try {
    // Try to find a JSON array in the text first
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log("Failed to parse JSON from text");
      }
    }

    // Otherwise, try to parse as a table
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Find header row and identify columns
    const headerRowIndex = lines.findIndex(
      (line) =>
        line.includes("Item Name") ||
        line.includes("Count") ||
        line.includes("Freshness")
    );

    if (headerRowIndex === -1) {
      console.log("Could not find header row in text response");
      return [];
    }

    // Parse the table rows
    const items = [];
    const timestamp = new Date().toISOString();

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.endsWith("|")) {
        const columns = line
          .split("|")
          .map((col) => col.trim())
          .filter(Boolean);
        if (columns.length >= 2) {
          const itemName = columns[0];
          const countStr = columns[1];
          const count = parseInt(countStr) || 1;

          items.push({
            itemName,
            count,
            timestamp,
          });
        }
      }
    }

    return items;
  } catch (error) {
    console.error("Error parsing text to items:", error);
    return [];
  }
};

// Helper function to parse text response into structured produce items
const parseTextToProduce = (text) => {
  try {
    // Try to find a JSON array in the text first
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log("Failed to parse JSON from text");
      }
    }

    // Otherwise, try to parse as a table
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Find header row and identify columns
    const headerRowIndex = lines.findIndex(
      (line) =>
        line.includes("Produce") ||
        line.includes("Freshness") ||
        line.includes("Expected Life") ||
        line.includes("Lifespan")
    );

    if (headerRowIndex === -1) {
      console.log("Could not find header row in text response");
      return [];
    }

    // Parse the table rows
    const produceItems = [];
    const timestamp = new Date().toISOString();

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.endsWith("|")) {
        const columns = line
          .split("|")
          .map((col) => col.trim())
          .filter(Boolean);
        if (columns.length >= 3) {
          const produce = columns[0];
          const freshness = columns[1];
          const expectedLifespan = columns[2];

          if (
            produce !== "N/A" &&
            produce !== "-" &&
            !produce.toLowerCase().includes("packaged")
          ) {
            produceItems.push({
              produce,
              freshness,
              expectedLifespan,
              timestamp,
            });
          }
        }
      }
    }

    return produceItems;
  } catch (error) {
    console.error("Error parsing text to produce:", error);
    return [];
  }
};
