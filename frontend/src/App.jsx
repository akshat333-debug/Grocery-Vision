import { useState, useEffect, useRef, useCallback } from "react";
import CameraComponent from "./components/CameraComponent";
import ItemsTable from "./components/ItemsTable";
import FreshnessTable from "./components/FreshnessTable";
import NutritionalTable from "./components/NutritionalTable";
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
  Volume2,
  VolumeX,
} from "lucide-react";
import axios from "axios";

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for scroll animations
  const mainContentRef = useRef(null);
  const itemsCardRef = useRef(null);
  const freshnessCardRef = useRef(null);
  const nutritionCardRef = useRef(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe elements
    const elements = [
      mainContentRef.current,
      itemsCardRef.current,
      freshnessCardRef.current,
      nutritionCardRef.current
    ].filter(Boolean);

    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

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

  // Announce results when both items and freshProduce are updated
  useEffect(() => {
    if (!isLoading && voiceEnabled && (items.length > 0 || freshProduce.length > 0)) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        announceResults(items, freshProduce);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [items, freshProduce, isLoading, voiceEnabled]);

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

      // Process in sequence with delay to avoid hitting per-minute rate limits
      await detectItems(formData);
      console.log("⏳ Waiting 5 seconds before next API call to avoid rate limits...");
      await new Promise(resolve => setTimeout(resolve, 5000));
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
      console.log("⏳ Waiting 5 seconds before next API call to avoid rate limits...");
      await new Promise(resolve => setTimeout(resolve, 5000));
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

  const toggleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Nutritional data database for voice announcements
  const getNutritionalData = (itemName) => {
    const nutritionalDatabase = {
      apple: { calories: 52, protein: 0.3, carbs: 14, fiber: 2.4, vitaminC: 4.6 },
      banana: { calories: 89, protein: 1.1, carbs: 23, fiber: 2.6, vitaminC: 8.7 },
      orange: { calories: 47, protein: 0.9, carbs: 12, fiber: 2.4, vitaminC: 53 },
      strawberry: { calories: 32, protein: 0.7, carbs: 8, fiber: 2, vitaminC: 59 },
      grape: { calories: 69, protein: 0.7, carbs: 18, fiber: 0.9, vitaminC: 3.2 },
      watermelon: { calories: 30, protein: 0.6, carbs: 8, fiber: 0.4, vitaminC: 8.1 },
      mango: { calories: 60, protein: 0.8, carbs: 15, fiber: 1.6, vitaminC: 36 },
      pineapple: { calories: 50, protein: 0.5, carbs: 13, fiber: 1.4, vitaminC: 48 },
      kiwi: { calories: 61, protein: 1.1, carbs: 15, fiber: 3, vitaminC: 93 },
      peach: { calories: 39, protein: 0.9, carbs: 10, fiber: 1.5, vitaminC: 6.6 },
      pear: { calories: 57, protein: 0.4, carbs: 15, fiber: 3.1, vitaminC: 4.3 },
      cherry: { calories: 50, protein: 1, carbs: 12, fiber: 1.6, vitaminC: 7 },
      blueberry: { calories: 57, protein: 0.7, carbs: 14, fiber: 2.4, vitaminC: 9.7 },
      lemon: { calories: 29, protein: 1.1, carbs: 9, fiber: 2.8, vitaminC: 53 },
      avocado: { calories: 160, protein: 2, carbs: 9, fiber: 7, vitaminC: 10 },
    };

    const name = itemName.toLowerCase().trim();

    // Try exact match first
    if (nutritionalDatabase[name]) {
      return nutritionalDatabase[name];
    }

    // Try partial match
    for (const [key, value] of Object.entries(nutritionalDatabase)) {
      if (name.includes(key) || key.includes(name)) {
        return value;
      }
    }

    return null;
  };

  // Voice announcement function
  const announceResults = (detectedItems, produceFreshness) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    let announcement = "";

    // Announce detected items
    if (detectedItems && detectedItems.length > 0) {
      const totalItems = detectedItems.reduce((sum, item) => sum + item.count, 0);
      announcement += `Detection complete! I found ${totalItems} item${totalItems > 1 ? 's' : ''} in total. `;

      detectedItems.forEach((item, index) => {
        if (index === 0) {
          announcement += `${item.count} ${item.itemName}`;
        } else if (index === detectedItems.length - 1) {
          announcement += `, and ${item.count} ${item.itemName}. `;
        } else {
          announcement += `, ${item.count} ${item.itemName}`;
        }
      });
    }

    // Announce freshness information
    if (produceFreshness && produceFreshness.length > 0) {
      announcement += ` Now for freshness analysis. `;

      produceFreshness.forEach((produce, index) => {
        const days = parseInt(produce.expectedLifespan?.match(/\d+/)?.[0] || "0");
        let freshnessLevel = "";

        if (days <= 1) {
          freshnessLevel = "urgent attention needed";
        } else if (days <= 3) {
          freshnessLevel = "moderate freshness";
        } else {
          freshnessLevel = "excellent condition";
        }

        announcement += `${produce.produce}: ${freshnessLevel}, expected lifespan ${produce.expectedLifespan}. `;
      });
    }

    // Announce nutritional information
    if (detectedItems && detectedItems.length > 0) {
      announcement += ` Now for nutritional values per 100 gram serving. `;

      detectedItems.forEach((item, index) => {
        const nutrition = getNutritionalData(item.itemName);

        if (nutrition) {
          announcement += `${item.itemName}: `;
          announcement += `${nutrition.calories} calories, `;
          announcement += `${nutrition.protein} grams protein, `;
          announcement += `${nutrition.carbs} grams carbohydrates, `;
          announcement += `${nutrition.fiber} grams fiber, `;

          // Add health rating based on calories
          if (nutrition.calories < 50) {
            announcement += `and ${nutrition.vitaminC} milligrams vitamin C. This is an excellent low calorie choice. `;
          } else if (nutrition.calories < 80) {
            announcement += `and ${nutrition.vitaminC} milligrams vitamin C. This provides moderate energy. `;
          } else {
            announcement += `and ${nutrition.vitaminC} milligrams vitamin C. This is an energy rich option. `;
          }
        } else {
          announcement += `${item.itemName}: Nutritional data not available in database. `;
        }
      });
    }

    if (announcement === "") {
      announcement = "No items detected in the image. Please try again with a clearer image of grocery items.";
    }

    // Speak the announcement
    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-all duration-500 ${darkMode ? "dark bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white" : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-900"
        }`}
    >
      {/* Animated grocery-colored background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Red apple color */}
        <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-blob ${darkMode ? 'bg-red-500' : 'bg-red-300'}`}></div>
        {/* Orange color */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000 ${darkMode ? 'bg-orange-500' : 'bg-orange-300'}`}></div>
        {/* Green kiwi/lime color */}
        <div className={`absolute bottom-0 left-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 animate-blob animation-delay-4000 ${darkMode ? 'bg-lime-500' : 'bg-lime-300'}`}></div>
        {/* Purple grape color */}
        <div className={`absolute top-1/2 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 animate-blob ${darkMode ? 'bg-purple-500' : 'bg-purple-300'}`} style={{ animationDelay: '1s' }}></div>
        {/* Yellow banana color */}
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 animate-blob ${darkMode ? 'bg-yellow-500' : 'bg-yellow-300'}`} style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Floating grocery emojis */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍑', '🥝', '🍍', '🥭', '🍒', '🍈', '🥥'].map((fruit, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            {fruit}
          </div>
        ))}
      </div>

      {/* Colorful particle effects to fill voids */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Color splash overlays */}
        <div className="color-splash absolute w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500" style={{ top: '10%', left: '5%', animationDelay: '0s' }}></div>
        <div className="color-splash absolute w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-500" style={{ top: '30%', right: '10%', animationDelay: '2s' }}></div>
        <div className="color-splash absolute w-72 h-72 bg-gradient-to-br from-purple-400 to-indigo-500" style={{ bottom: '20%', left: '15%', animationDelay: '4s' }}></div>
        <div className="color-splash absolute w-88 h-88 bg-gradient-to-br from-green-400 to-emerald-500" style={{ bottom: '15%', right: '8%', animationDelay: '1s' }}></div>
        <div className="color-splash absolute w-64 h-64 bg-gradient-to-br from-orange-400 to-amber-500" style={{ top: '50%', left: '50%', animationDelay: '3s' }}></div>
        <div className="color-splash absolute w-96 h-96 bg-gradient-to-br from-yellow-300 to-lime-400" style={{ top: '5%', right: '20%', animationDelay: '5s' }}></div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full particle-float"
            style={{
              background: `linear-gradient(45deg, ${['#ff6b9d', '#c44569', '#f8b500', '#38ada9', '#4834df', '#eb2f06'][i % 6]
                }, ${['#ee5a6f', '#f368e0', '#feca57', '#1dd1a1', '#5f27cd', '#fd7272'][i % 6]
                })`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${12 + Math.random() * 8}s`,
              boxShadow: `0 0 20px ${['#ff6b9d', '#c44569', '#f8b500', '#38ada9', '#4834df', '#eb2f06'][i % 6]
                }`
            }}
          ></div>
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8">
        {/* Modern Hero Header with organic shape - Responsive */}
        <header className="relative overflow-visible mb-8 md:mb-16 stagger-fade-in">
          {/* Animated background gradient with blob shape */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 blob-shape blur-3xl breathe"></div>

          <div className="relative bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl asymmetric-rounded p-4 md:p-8 border-2 border-white/30 dark:border-gray-700/50 organic-shadow">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Enhanced logo with grocery theme */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-lime-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-green-600 via-emerald-500 to-lime-500 rounded-2xl p-4 shadow-xl overflow-hidden">
                    <div className="absolute inset-0 opacity-20 text-4xl flex items-center justify-center">
                      🍎
                    </div>
                    <ShoppingCart className="h-8 w-8 text-white relative z-10" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full w-8 h-8 flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-xl">🍊</span>
                  </div>
                  <div className="absolute -bottom-1 -left-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.3s' }}>
                    <span className="text-sm">🍋</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="gradient-text-animated">
                      Grocery Vision
                    </span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-blue-500 rounded-full animate-ping shadow-lg shadow-blue-500/50"></div>
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-purple-500 rounded-full animate-ping shadow-lg shadow-purple-500/50" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-pink-500 rounded-full animate-ping shadow-lg shadow-pink-500/50" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </h1>
                  <p className="text-sm md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-semibold flex flex-wrap items-center gap-2">
                    <span className="text-xl md:text-2xl">🍎</span>
                    <span className="hidden sm:inline">Smart Grocery Detection powered by</span>
                    <span className="sm:hidden">AI-Powered Detection</span>
                    <span className="gradient-text-animated font-black hidden sm:inline"> AI Vision</span>
                    <span className="text-xl md:text-2xl">🍊</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🍓</span>
                      <span>Real-time analysis</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span>Instant results</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span>Smart detection</span>
                    </div>
                  </div>

                  {/* Stats badges - Responsive */}
                  <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
                    <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 dark:border-purple-500/20">
                      <span className="text-base md:text-lg">🤖</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">AI Powered</span>
                    </div>
                    <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 dark:border-emerald-500/20">
                      <span className="text-base md:text-lg">🌟</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hidden sm:inline">100% Accurate</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 sm:hidden">Accurate</span>
                    </div>
                    <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 dark:border-red-500/20">
                      <span className="text-base md:text-lg">🚀</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hidden sm:inline">Fast Processing</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 sm:hidden">Fast</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                {/* Voice announcer toggle with organic shape - Responsive */}
                <button
                  onClick={toggleVoice}
                  className={`relative p-2 md:p-4 asymmetric-rounded transition-all duration-300 shadow-lg hover:shadow-2xl smooth-scale ${voiceEnabled
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    : "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 hover:from-gray-400 hover:to-gray-500 dark:hover:from-gray-600 dark:hover:to-gray-500"
                    }`}
                  aria-label="Toggle voice announcer"
                  title={voiceEnabled ? "Voice Announcer ON" : "Voice Announcer OFF"}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 asymmetric-rounded opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    {voiceEnabled ? (
                      <Volume2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    ) : (
                      <VolumeX className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    )}
                  </div>
                  {isSpeaking && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </button>

                {/* Enhanced dark mode toggle with organic shape - Responsive */}
                <button
                  onClick={toggleDarkMode}
                  className="relative p-2 md:p-4 asymmetric-rounded-alt bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-2xl smooth-scale"
                  aria-label="Toggle dark mode"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 asymmetric-rounded-alt opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    {darkMode ? (
                      <Sun className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                    ) : (
                      <Moon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {isSpeaking && (
          <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 dark:border-green-600 asymmetric-rounded shadow-lg animate-slide-up organic-shadow">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Volume2 className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse" />
                <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
                  <span className="text-xl">🔊</span>
                  Voice Announcer Speaking...
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Reading out detection results, freshness analysis, and nutritional values
                </p>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>
            </div>
          </div>
        )}

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

        {/* Modern Main Content Area with organic design - Responsive */}
        <div ref={mainContentRef} className="relative overflow-visible mb-8 md:mb-16 scroll-fade-in">
          {/* Decorative background layers with organic shapes */}
          <div className="absolute -inset-2 md:-inset-6 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 blob-shape opacity-70"></div>
          <div className="absolute inset-0 pattern-dots opacity-30 asymmetric-rounded"></div>

          {/* Light beam effect */}
          <div className="absolute inset-0 light-beam asymmetric-rounded-alt"></div>

          {/* Decorative corner items with magnetic effect - Hidden on mobile */}
          <div className="hidden md:block absolute -top-12 -right-12 text-9xl opacity-10 animate-spin magnetic-hover" style={{ animationDuration: '20s' }}>🍎</div>
          <div className="hidden md:block absolute -bottom-12 -left-12 text-9xl opacity-10 animate-spin magnetic-hover" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>🍊</div>

          <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl asymmetric-rounded-alt p-4 md:p-8 border-2 border-white/30 dark:border-gray-700/50 organic-shadow hover-lift">
            {/* Modern Tab Navigation with organic shapes - Responsive */}
            <div className="flex mb-4 md:mb-8 bg-gray-100/80 dark:bg-gray-800/80 asymmetric-rounded p-1.5 md:p-2.5 border-2 border-gray-200/50 dark:border-gray-700/50 gap-1 md:gap-2">
              <button
                onClick={() => setActiveTab("camera")}
                className={`relative flex-1 px-3 md:px-6 py-3 md:py-4 font-semibold flex items-center justify-center gap-2 md:gap-3 asymmetric-rounded transition-all duration-300 text-sm md:text-base ${activeTab === "camera"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl smooth-scale"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 magnetic-hover"
                  }`}
              >
                <Camera
                  className={`h-4 w-4 md:h-5 md:w-5 ${activeTab === "camera"
                    ? "text-white"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                />
                <span className="hidden sm:inline">Live Camera</span>
                <span className="sm:hidden">Camera</span>
                {activeTab === "camera" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 asymmetric-rounded breathe"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`relative flex-1 px-3 md:px-6 py-3 md:py-4 font-semibold flex items-center justify-center gap-2 md:gap-3 asymmetric-rounded-alt transition-all duration-300 text-sm md:text-base ${activeTab === "upload"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl smooth-scale"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 magnetic-hover"
                  }`}
              >
                <Upload
                  className={`h-4 w-4 md:h-5 md:w-5 ${activeTab === "upload"
                    ? "text-white"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                />
                <span className="hidden sm:inline">Upload Image</span>
                <span className="sm:hidden">Upload</span>
                {activeTab === "upload" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 asymmetric-rounded-alt breathe"></div>
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

        {/* Modern Results Section with asymmetric layout - Responsive */}
        <div className="space-y-6 md:space-y-12 mt-6 md:mt-12">
          {/* First Row - Item Detection and Fresh Produce with stagger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            {/* Item Detection Card with organic shapes */}
            <div ref={itemsCardRef} className="group relative scroll-slide-left">
              {/* Animated background glow with organic shape */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 blob-shape blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              {/* Rainbow gradient accent */}
              <div className="absolute -inset-0.5 rainbow-glow opacity-0 group-hover:opacity-30 rounded-3xl blur-xl transition-opacity duration-500"></div>

              {/* Decorative floating items with magnetic effect - Smaller on mobile */}
              <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 text-4xl md:text-7xl opacity-10 animate-bounce magnetic-hover">🍎</div>
              <div className="absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 text-3xl md:text-6xl opacity-10 animate-bounce magnetic-hover" style={{ animationDelay: '0.5s' }}>🍌</div>

              <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl asymmetric-rounded shadow-2xl overflow-hidden border-2 border-white/30 dark:border-gray-700/50 tilt-hover organic-shadow hover-lift">
                {/* Pattern overlay */}
                <div className="absolute inset-0 pattern-diagonal opacity-30 pointer-events-none"></div>
                {/* Ripple effect on hover */}
                <div className="absolute inset-0 ripple pointer-events-none opacity-0 group-hover:opacity-100"></div>
                {/* Modern Header - Responsive */}
                <div className="relative px-4 md:px-8 py-4 md:py-6 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 border-b border-gray-200/50 dark:border-gray-700/50 light-beam">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75"></div>
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-3 shadow-xl">
                          <Box className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-lg md:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Item Detection
                          </span>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </h2>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium mt-1 hidden sm:block">
                          AI-powered grocery analysis
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

            {/* Fresh Produce Card with organic shapes */}
            <div ref={freshnessCardRef} className="group relative scroll-slide-right lg:mt-12">
              {/* Animated background glow with organic shape */}
              <div className="absolute -inset-4 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20 dark:from-green-500/10 dark:via-emerald-500/10 dark:to-teal-500/10 blob-shape blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ animationDelay: '2s' }}></div>

              {/* Rainbow gradient accent */}
              <div className="absolute -inset-0.5 rainbow-glow opacity-0 group-hover:opacity-30 rounded-3xl blur-xl transition-opacity duration-500"></div>

              {/* Decorative floating produce with magnetic effect */}
              <div className="absolute -top-6 -right-6 text-7xl opacity-10 animate-bounce magnetic-hover" style={{ animationDelay: '0.3s' }}>🍏</div>
              <div className="absolute -bottom-4 -left-4 text-6xl opacity-10 animate-bounce magnetic-hover" style={{ animationDelay: '0.7s' }}>🥝</div>

              <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl asymmetric-rounded-alt shadow-2xl overflow-hidden border-2 border-white/30 dark:border-gray-700/50 tilt-hover organic-shadow hover-lift">
                {/* Pattern overlay */}
                <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none"></div>
                {/* Ripple effect on hover */}
                <div className="absolute inset-0 ripple pointer-events-none opacity-0 group-hover:opacity-100"></div>
                {/* Modern Header */}
                <div className="relative px-8 py-6 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 dark:from-green-500/5 dark:via-emerald-500/5 dark:to-teal-500/5 border-b border-gray-200/50 dark:border-gray-700/50 light-beam">
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
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
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

          {/* Nutritional Values Section - Full Width with organic design */}
          <div ref={nutritionCardRef} className="group relative scroll-scale-up">
            {/* Animated background glow with organic shape */}
            <div className="absolute -inset-6 bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-red-600/20 dark:from-yellow-500/10 dark:via-orange-500/10 dark:to-red-500/10 blob-shape blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ animationDelay: '4s' }}></div>

            {/* Rainbow gradient accent */}
            <div className="absolute -inset-0.5 rainbow-glow opacity-0 group-hover:opacity-30 rounded-3xl blur-xl transition-opacity duration-500"></div>

            {/* Light beam effect */}
            <div className="absolute inset-0 light-beam asymmetric-rounded pointer-events-none"></div>

            {/* Decorative floating nutrition icons with magnetic effect */}
            <div className="absolute -top-8 -left-8 text-7xl opacity-10 micro-pulse magnetic-hover">💪</div>
            <div className="absolute -top-8 -right-8 text-7xl opacity-10 micro-pulse magnetic-hover" style={{ animationDelay: '1s' }}>🔥</div>
            <div className="absolute -bottom-6 left-1/4 text-6xl opacity-10 animate-bounce magnetic-hover" style={{ animationDelay: '0.5s' }}>🥗</div>
            <div className="absolute -bottom-6 right-1/4 text-6xl opacity-10 animate-bounce magnetic-hover" style={{ animationDelay: '1.5s' }}>📊</div>

            <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl asymmetric-rounded shadow-2xl overflow-hidden border-2 border-white/30 dark:border-gray-700/50 tilt-hover organic-shadow hover-lift">
              {/* Pattern overlay */}
              <div className="absolute inset-0 pattern-grid opacity-20 pointer-events-none"></div>
              {/* Ripple effect on hover */}
              <div className="absolute inset-0 ripple pointer-events-none opacity-0 group-hover:opacity-100"></div>
              {/* Modern Header */}
              <div className="relative px-8 py-6 bg-gradient-to-r from-yellow-600/10 via-orange-600/10 to-red-600/10 dark:from-yellow-500/5 dark:via-orange-500/5 dark:to-red-500/5 border-b border-gray-200/50 dark:border-gray-700/50 light-beam">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-lg opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-3 shadow-xl">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          Nutritional Values
                        </span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                        Complete nutritional breakdown per 100g serving
                      </p>
                    </div>
                  </div>

                  {/* Modern Counter */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl px-4 py-2 shadow-xl">
                      <span className="text-white font-black text-lg">
                        {items.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-0">
                <NutritionalTable items={items} darkMode={darkMode} />
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t-2 border-gradient-to-r from-red-500 via-orange-500 to-green-500 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 text-3xl">
              <span className="animate-bounce">🍎</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🍊</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🍋</span>
              <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>🍌</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🍉</span>
              <span className="animate-bounce" style={{ animationDelay: '0.5s' }}>🍇</span>
              <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>🍓</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5" />
              <p className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Grocery Vision
              </p>
            </div>
            <p className="text-sm font-medium mb-3">
              AI-Powered Grocery Detection & Freshness Analysis
            </p>
            <div className="flex gap-4 text-xs mb-4">
              <span className="flex items-center gap-1">
                <span className="text-base">🤖</span> Smart AI Detection
              </span>
              <span className="flex items-center gap-1">
                <span className="text-base">⚡</span> Real-time Analysis
              </span>
              <span className="flex items-center gap-1">
                <span className="text-base">🎯</span> Accurate Results
              </span>
            </div>
            <p className="text-xs opacity-75">
              &copy; {new Date().getFullYear()} Grocery Vision - Making grocery detection smart and simple
            </p>
          </div>
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
