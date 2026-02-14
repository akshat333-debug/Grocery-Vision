import React from "react";
import {
  Calendar,
  Hash,
  ShoppingBag,
  Calculator,
  Sparkles,
  Badge,
} from "lucide-react";

const ItemsTable = ({ items, darkMode }) => {
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp || "N/A";
    }
  };

  // Get item count color with gradient
  const getCountBadgeColor = (count) => {
    if (count >= 5) {
      return "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50";
    } else if (count >= 3) {
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50";
    } else {
      return "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50";
    }
  };

  return (
    <div className="overflow-hidden asymmetric-rounded shadow-2xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-500 organic-shadow">
      {/* Table header with animated gradient */}
      <div
        className={`py-4 px-6 ${
          darkMode
            ? "bg-gradient-to-r from-red-900/20 via-orange-900/20 to-yellow-900/20"
            : "bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50"
        }`}
      >
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
          <span className="text-2xl">🍎</span>
          <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Fruit Analysis
          <span className="text-2xl">🍊</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
          <span className="text-base">📊</span>
          Detailed inventory of detected fruits and grocery items
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
              <th scope="col" className="px-4 py-3 text-left w-[20%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Timestamp</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[60%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Item Name</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[15%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Calculator className="h-4 w-4" />
                  <span>Count</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-200 dark:divide-gray-700 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {items && items.length > 0 ? (
              items.map((item, index) => (
                <tr
                  key={index}
                  className={`transition-all duration-500 magnetic-hover ${
                    darkMode ? "hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-purple-900/20" : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                  } stagger-fade-in`}
                  style={{animationDelay: `${index * 0.08}s`}}
                >
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 font-medium">
                    {formatTimestamp(item.timestamp)}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
                      <span className="text-gray-900 dark:text-white text-base">
                        {item.itemName}
                      </span>
                      {item.count > 1 && (
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-black leading-none rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30">
                          ×{item.count}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <span
                      className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold smooth-scale ${getCountBadgeColor(
                        item.count
                      )}`}
                    >
                      {item.count}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className={`px-6 py-12 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-4">
                      <div className="text-6xl mb-4 animate-bounce">🍎</div>
                      <div className="absolute -top-2 -right-2 text-3xl animate-bounce" style={{animationDelay: '0.2s'}}>🍊</div>
                      <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce" style={{animationDelay: '0.4s'}}>🍋</div>
                    </div>
                    <p className="font-bold text-xl mb-2">No items detected yet</p>
                    <p className="mt-2 text-sm max-w-md flex items-center gap-2 justify-center">
                      <span className="text-xl">📸</span>
                      Capture an image with fruits to begin your inventory analysis
                    </p>
                    <div className="mt-6 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 asymmetric-rounded p-5 text-xs text-left max-w-md border-2 border-orange-200 dark:border-orange-800 organic-shadow">
                      <p className="font-bold mb-2 flex items-center gap-2 text-orange-800 dark:text-orange-300">
                        <span className="text-lg">💡</span> Pro tip for best results
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-base">🍏</span> Ensure your fruits are clearly visible and well-lit
                        <br/>
                        <span className="text-base">📏</span> Keep fruits separated for accurate counting
                        <br/>
                        <span className="text-base">🎯</span> Position camera directly above for better detection
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {items && items.length > 0 && (
        <div
          className={`p-4 text-xs text-right border-t border-gray-200 dark:border-gray-700 ${
            darkMode ? "bg-gray-800" : "bg-gray-50"
          }`}
        >
          <p className="text-gray-500 dark:text-gray-400">
            Showing {items.length} item{items.length === 1 ? "" : "s"} with a
            total of {items.reduce((sum, item) => sum + item.count, 0)} units
          </p>
        </div>
      )}
    </div>
  );
};

export default ItemsTable;
