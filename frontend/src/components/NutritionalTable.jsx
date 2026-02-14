import React, { useState } from "react";
import {
  Calendar,
  Hash,
  Apple,
  Flame,
  Droplet,
  Wheat,
  Beef,
  Candy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  TrendingUp,
} from "lucide-react";

const NutritionalTable = ({ items, darkMode }) => {
  // Keep track of expanded rows
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

  // Nutritional data for common fruits (per 100g)
  const nutritionalDatabase = {
    apple: { calories: 52, protein: 0.3, carbs: 14, fiber: 2.4, sugar: 10, fat: 0.2, vitaminC: 4.6, emoji: "🍎" },
    banana: { calories: 89, protein: 1.1, carbs: 23, fiber: 2.6, sugar: 12, fat: 0.3, vitaminC: 8.7, emoji: "🍌" },
    orange: { calories: 47, protein: 0.9, carbs: 12, fiber: 2.4, sugar: 9, fat: 0.1, vitaminC: 53, emoji: "🍊" },
    strawberry: { calories: 32, protein: 0.7, carbs: 8, fiber: 2, sugar: 4.9, fat: 0.3, vitaminC: 59, emoji: "🍓" },
    grape: { calories: 69, protein: 0.7, carbs: 18, fiber: 0.9, sugar: 16, fat: 0.2, vitaminC: 3.2, emoji: "🍇" },
    watermelon: { calories: 30, protein: 0.6, carbs: 8, fiber: 0.4, sugar: 6, fat: 0.2, vitaminC: 8.1, emoji: "🍉" },
    mango: { calories: 60, protein: 0.8, carbs: 15, fiber: 1.6, sugar: 14, fat: 0.4, vitaminC: 36, emoji: "🥭" },
    pineapple: { calories: 50, protein: 0.5, carbs: 13, fiber: 1.4, sugar: 10, fat: 0.1, vitaminC: 48, emoji: "🍍" },
    kiwi: { calories: 61, protein: 1.1, carbs: 15, fiber: 3, sugar: 9, fat: 0.5, vitaminC: 93, emoji: "🥝" },
    peach: { calories: 39, protein: 0.9, carbs: 10, fiber: 1.5, sugar: 8, fat: 0.3, vitaminC: 6.6, emoji: "🍑" },
    pear: { calories: 57, protein: 0.4, carbs: 15, fiber: 3.1, sugar: 10, fat: 0.1, vitaminC: 4.3, emoji: "🍐" },
    cherry: { calories: 50, protein: 1, carbs: 12, fiber: 1.6, sugar: 8, fat: 0.3, vitaminC: 7, emoji: "🍒" },
    blueberry: { calories: 57, protein: 0.7, carbs: 14, fiber: 2.4, sugar: 10, fat: 0.3, vitaminC: 9.7, emoji: "🫐" },
    lemon: { calories: 29, protein: 1.1, carbs: 9, fiber: 2.8, sugar: 2.5, fat: 0.3, vitaminC: 53, emoji: "🍋" },
    avocado: { calories: 160, protein: 2, carbs: 9, fiber: 7, sugar: 0.7, fat: 15, vitaminC: 10, emoji: "🥑" },
  };

  // Get nutritional data for an item
  const getNutritionalData = (itemName) => {
    const name = itemName.toLowerCase().trim();
    
    // Try exact match first
    if (nutritionalDatabase[name]) {
      return { ...nutritionalDatabase[name], name: itemName };
    }
    
    // Try partial match
    for (const [key, value] of Object.entries(nutritionalDatabase)) {
      if (name.includes(key) || key.includes(name)) {
        return { ...value, name: itemName };
      }
    }
    
    // Default values if not found
    return {
      calories: "N/A",
      protein: "N/A",
      carbs: "N/A",
      fiber: "N/A",
      sugar: "N/A",
      fat: "N/A",
      vitaminC: "N/A",
      emoji: "🍽️",
      name: itemName,
    };
  };

  // Get calorie level color
  const getCalorieColor = (calories) => {
    if (calories === "N/A") return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    if (calories < 50) return "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50";
    if (calories < 80) return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50";
    return "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50";
  };

  return (
    <div className="overflow-hidden asymmetric-rounded shadow-2xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-500 organic-shadow">
      {/* Table header with animated gradient */}
      <div
        className={`py-4 px-6 ${
          darkMode
            ? "bg-gradient-to-r from-yellow-900/20 via-orange-900/20 to-red-900/20"
            : "bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50"
        }`}
      >
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
          <span className="text-2xl">🍎</span>
          <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Nutritional Values
          <span className="text-2xl">💪</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
          <span className="text-base">📊</span>
          Complete nutritional breakdown per 100g serving
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
                  <Apple className="h-4 w-4" />
                  <span>Item Name</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[10%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Flame className="h-4 w-4" />
                  <span>Calories</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[10%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Beef className="h-4 w-4" />
                  <span>Protein</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[10%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Wheat className="h-4 w-4" />
                  <span>Carbs</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[10%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Droplet className="h-4 w-4" />
                  <span>Fiber</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[10%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Candy className="h-4 w-4" />
                  <span>Sugar</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[15%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>Vitamin C</span>
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left w-[10%]">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Activity className="h-4 w-4" />
                  <span>Details</span>
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
              items.map((item, index) => {
                const nutrition = getNutritionalData(item.itemName);
                return (
                  <React.Fragment key={index}>
                    <tr
                      className={`transition-all duration-500 magnetic-hover ${
                        darkMode ? "hover:bg-gradient-to-r hover:from-yellow-900/20 hover:to-orange-900/20" : "hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50"
                      } stagger-fade-in`}
                      style={{animationDelay: `${index * 0.08}s`}}
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{nutrition.emoji}</span>
                          <span className="text-gray-900 dark:text-white text-base">
                            {item.itemName}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold smooth-scale ${getCalorieColor(nutrition.calories)}`}>
                          {nutrition.calories === "N/A" ? "N/A" : `${nutrition.calories} kcal`}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {nutrition.protein === "N/A" ? "N/A" : `${nutrition.protein}g`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {nutrition.carbs === "N/A" ? "N/A" : `${nutrition.carbs}g`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {nutrition.fiber === "N/A" ? "N/A" : `${nutrition.fiber}g`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {nutrition.sugar === "N/A" ? "N/A" : `${nutrition.sugar}g`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg">
                          <span>💊</span>
                          {nutrition.vitaminC === "N/A" ? "N/A" : `${nutrition.vitaminC}mg`}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <button
                          onClick={() => toggleRowExpanded(index)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg smooth-scale"
                        >
                          {expandedRows[index] ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              More
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[index] && (
                      <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 stagger-fade-in">
                        <td colSpan="9" className="px-6 py-5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 asymmetric-rounded p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 magnetic-hover organic-shadow">
                              <div className="flex items-center gap-2 mb-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Total Fat</span>
                              </div>
                              <p className="text-lg font-black text-gray-900 dark:text-white">
                                {nutrition.fat === "N/A" ? "N/A" : `${nutrition.fat}g`}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 asymmetric-rounded-alt p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 magnetic-hover organic-shadow">
                              <div className="flex items-center gap-2 mb-1">
                                <Activity className="h-4 w-4 text-green-500" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Serving Size</span>
                              </div>
                              <p className="text-lg font-black text-gray-900 dark:text-white">100g</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 asymmetric-rounded p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 magnetic-hover organic-shadow">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Health Score</span>
                              </div>
                              <p className="text-lg font-black text-green-600 dark:text-green-400">
                                {nutrition.calories === "N/A" ? "N/A" : nutrition.calories < 50 ? "⭐⭐⭐⭐⭐" : nutrition.calories < 80 ? "⭐⭐⭐⭐" : "⭐⭐⭐"}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 asymmetric-rounded-alt p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 magnetic-hover organic-shadow">
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Category</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">Fresh Fruit 🍎</p>
                            </div>
                          </div>
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 asymmetric-rounded border-2 border-green-200 dark:border-green-800 organic-shadow">
                            <p className="text-xs font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                              <span className="text-base">💡</span>
                              Health Benefit: Rich in vitamins, minerals, and antioxidants. Great for a healthy diet!
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className={`px-6 py-12 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-4">
                      <div className="text-6xl mb-4 animate-bounce">🍎</div>
                      <div className="absolute -top-2 -right-2 text-3xl animate-bounce" style={{animationDelay: '0.2s'}}>💪</div>
                      <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce" style={{animationDelay: '0.4s'}}>📊</div>
                    </div>
                    <p className="font-bold text-xl mb-2">No nutritional data available yet</p>
                    <p className="mt-2 text-sm max-w-md flex items-center gap-2 justify-center">
                      <span className="text-xl">🔍</span>
                      Detect fruits first to see their complete nutritional breakdown
                    </p>
                    <div className="mt-6 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 asymmetric-rounded p-5 text-xs text-left max-w-md border-2 border-orange-200 dark:border-orange-800 organic-shadow">
                      <p className="font-bold mb-2 flex items-center gap-2 text-orange-800 dark:text-orange-300">
                        <span className="text-lg">🍏</span> Nutritional Benefits
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-base">✨</span> Get detailed calorie information
                        <br/>
                        <span className="text-base">💪</span> Track protein, carbs, and fiber content
                        <br/>
                        <span className="text-base">🧪</span> View vitamin C and micronutrient data
                        <br/>
                        <span className="text-base">⭐</span> See health scores and ratings
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
          <p className="text-gray-500 dark:text-gray-400 flex items-center justify-end gap-2">
            <span className="text-base">📊</span>
            Showing nutritional values for {items.length} item{items.length === 1 ? "" : "s"} (per 100g serving)
          </p>
        </div>
      )}
    </div>
  );
};

export default NutritionalTable;

