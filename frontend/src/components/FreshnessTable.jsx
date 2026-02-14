import React, { useState } from "react";
import {
  Calendar,
  Hash,
  Leaf,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
} from "lucide-react";

const FreshnessTable = ({ freshProduce, darkMode }) => {
  // Keep track of expanded descriptions
  const [expandedRows, setExpandedRows] = useState({});

  // Toggle expanded state for a row
  const toggleRowExpanded = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp || "N/A";
    }
  };

  // Function to determine freshness badge color with gradients
  const getFreshnessBadgeColors = (lifespan) => {
    if (!lifespan)
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg";

    const days = parseInt(lifespan.match(/\d+/)?.[0] || "0");

    if (days <= 1) {
      return "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50 animate-pulse";
    } else if (days <= 3) {
      return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50";
    } else {
      return "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50";
    }
  };

  // Get a gradient background for the row based on freshness
  const getRowGradient = (lifespan) => {
    if (!lifespan) return "";

    const days = parseInt(lifespan.match(/\d+/)?.[0] || "0");

    if (days <= 1) {
      return darkMode
        ? "bg-gradient-to-r from-transparent to-red-950/10"
        : "bg-gradient-to-r from-transparent to-red-50";
    } else if (days <= 3) {
      return darkMode
        ? "bg-gradient-to-r from-transparent to-yellow-950/10"
        : "bg-gradient-to-r from-transparent to-yellow-50";
    } else {
      return darkMode
        ? "bg-gradient-to-r from-transparent to-green-950/10"
        : "bg-gradient-to-r from-transparent to-green-50";
    }
  };

  // Get the freshness emoji based on expected lifespan
  const getFreshnessEmoji = (lifespan) => {
    if (!lifespan) return "🔍";

    const days = parseInt(lifespan.match(/\d+/)?.[0] || "0");

    if (days <= 1) {
      return "⚠️";
    } else if (days <= 3) {
      return "⏳";
    } else {
      return "✅";
    }
  };

  return (
    <div className="overflow-hidden asymmetric-rounded-alt shadow-2xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-500 organic-shadow">
      {/* Table header with animated gradient */}
      <div
        className={`py-4 px-6 ${
          darkMode
            ? "bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-lime-900/20"
            : "bg-gradient-to-r from-green-50 via-emerald-50 to-lime-50"
        }`}
      >
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
          <span className="text-2xl">🍏</span>
          <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
          Fresh Produce Analysis
          <span className="text-2xl">🥗</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
          <span className="text-base">🔍</span>
          AI-powered freshness assessment and shelf life prediction
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
          <thead className={`${darkMode ? "bg-gray-800/80" : "bg-gray-50"}`}>
            <tr>
              <th scope="col" className="px-4 py-3 text-left w-[5%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Hash className="h-4 w-4" />
                  <span>ID</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[15%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Timestamp</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[15%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Leaf className="h-4 w-4" />
                  <span>Produce</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[50%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Freshness</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[15%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Expected Lifespan</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-200 dark:divide-gray-700 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {freshProduce && freshProduce.length > 0 ? (
              freshProduce.map((item, index) => (
                <tr
                  key={index}
                  className={`transition-all duration-500 magnetic-hover ${
                    darkMode ? "hover:bg-gradient-to-r hover:from-green-900/20 hover:to-emerald-900/20" : "hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50"
                  } ${getRowGradient(item.expectedLifespan)} stagger-fade-in`}
                  style={{animationDelay: `${index * 0.08}s`}}
                >
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 font-medium">
                    {formatTimestamp(item.timestamp)}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl animate-bounce" aria-hidden="true">
                        {getFreshnessEmoji(item.expectedLifespan)}
                      </span>
                      <span className="text-gray-900 dark:text-white text-base">
                        {item.produce}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <p
                        className={`leading-relaxed ${
                          expandedRows[index]
                            ? "whitespace-normal break-words"
                            : "line-clamp-2"
                        }`}
                      >
                        {item.freshness}
                      </p>
                      {item.freshness && item.freshness.length > 60 && (
                        <button
                          onClick={() => toggleRowExpanded(index)}
                          className="mt-2 flex items-center text-xs font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-500 hover:to-purple-500 transition-all duration-200 smooth-scale"
                        >
                          {expandedRows[index] ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1 text-blue-600" />
                              See less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1 text-purple-600" />
                              See more
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <span
                      className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold smooth-scale ${getFreshnessBadgeColors(
                        item.expectedLifespan
                      )}`}
                    >
                      {item.expectedLifespan}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className={`px-6 py-12 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-4">
                      <div className="text-6xl mb-4 animate-bounce">🍓</div>
                      <div className="absolute -top-2 -right-2 text-3xl animate-bounce" style={{animationDelay: '0.2s'}}>🍇</div>
                      <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce" style={{animationDelay: '0.4s'}}>🥝</div>
                      <div className="absolute top-0 -left-4 text-2xl animate-bounce" style={{animationDelay: '0.6s'}}>🍑</div>
                    </div>
                    <p className="font-bold text-xl mb-2">
                      No fresh produce detected yet
                    </p>
                    <p className="mt-2 text-sm max-w-md flex items-center gap-2 justify-center">
                      <span className="text-xl">📸</span>
                      Capture an image with fruits or vegetables to begin your freshness analysis
                    </p>
                    <div className="mt-6 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 asymmetric-rounded-alt p-5 text-xs text-left max-w-md border-2 border-green-200 dark:border-green-800 organic-shadow">
                      <p className="font-bold mb-2 flex items-center gap-2 text-green-800 dark:text-green-300">
                        <span className="text-lg">🌟</span> Freshness Detection Tips
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-base">☀️</span> Good lighting helps detect color changes
                        <br/>
                        <span className="text-base">📐</span> Show multiple angles for accurate assessment
                        <br/>
                        <span className="text-base">🍎</span> Works best with whole fruits and vegetables
                        <br/>
                        <span className="text-base">⏱️</span> Get instant shelf-life predictions!
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {freshProduce && freshProduce.length > 0 && (
        <div
          className={`p-4 text-xs text-right border-t border-gray-200 dark:border-gray-700 ${
            darkMode ? "bg-gray-800" : "bg-gray-50"
          }`}
        >
          <p className="text-gray-500 dark:text-gray-400">
            Showing {freshProduce.length} produce{" "}
            {freshProduce.length === 1 ? "item" : "items"}
          </p>
        </div>
      )}
    </div>
  );
};

export default FreshnessTable;
