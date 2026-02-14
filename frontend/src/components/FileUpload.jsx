import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Loader, AlertCircle } from "lucide-react";

const FileUpload = ({ onFileUpload, isLoading, darkMode }) => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      setUploadError(null);
      const file = acceptedFiles[0];

      if (!file) {
        return;
      }

      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File too large. Maximum size is 10MB.");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please upload an image file (JPEG, PNG, etc.)");
        return;
      }

      console.log(
        `Selected file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`
      );

      setUploadedImage(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);

      // Pass the file to the parent component
      onFileUpload(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
    disabled: isLoading,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-8">
      {uploadError && (
        <div className="relative overflow-hidden asymmetric-rounded animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 breathe"></div>
          <div
            className={`relative p-4 asymmetric-rounded border-2 ${
              darkMode ? "bg-red-900/30 text-red-200 border-red-700/50" : "bg-red-50 text-red-800 border-red-200"
            } flex items-start organic-shadow`}
          >
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{uploadError}</p>
          </div>
        </div>
      )}

      <div className="relative group">
        {/* Animated border glow with organic shape */}
        <div className={`absolute -inset-2 blob-shape opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
          isDragActive ? 'opacity-100' : ''
        } ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-xl' 
            : 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-xl'
        }`}></div>
        
        <div
          {...getRootProps()}
          className={`relative border-3 border-dashed asymmetric-rounded p-14 text-center cursor-pointer transition-all duration-500 transform
            ${
              isDragActive
                ? "border-blue-500 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 smooth-scale"
                : darkMode
                ? "border-gray-600 hover:border-purple-500 bg-gray-800/50 hover:bg-gray-800/70"
                : "border-gray-300 hover:border-purple-400 bg-white/50 hover:bg-white/70"
            }
            ${isLoading ? "opacity-50 cursor-not-allowed scale-100" : "tilt-hover"}
            backdrop-blur-xl organic-shadow
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-6">
                    <Loader className="h-10 w-10 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                  Processing image...
                </p>
                <div className="flex gap-2 mt-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-6 animate-bounce">
                    <Upload className="h-12 w-12 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Drop the image here! 🎯
                </p>
              </div>
            ) : (
              <div>
                <div className="relative mb-6">
                  <div className={`absolute inset-0 ${
                    darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-400 to-purple-400'
                  } rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`}></div>
                  <div className={`relative ${
                    darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  } rounded-full p-6 transform group-hover:scale-110 transition-transform duration-300`}>
                    <Upload className="h-12 w-12 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold mb-2 text-gray-800 dark:text-white flex items-center gap-2 justify-center">
                  <span className="text-2xl">🍎</span>
                  Drag & drop your fruit image here
                  <span className="text-2xl">🍊</span>
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2 justify-center">
                  <span className="text-xl">👆</span>
                  or click to browse
                </p>
                <div className="flex gap-3 mb-3 justify-center text-2xl">
                  <span className="animate-bounce">🍌</span>
                  <span className="animate-bounce" style={{animationDelay: '0.1s'}}>🍇</span>
                  <span className="animate-bounce" style={{animationDelay: '0.2s'}}>🍓</span>
                  <span className="animate-bounce" style={{animationDelay: '0.3s'}}>🥝</span>
                  <span className="animate-bounce" style={{animationDelay: '0.4s'}}>🍉</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 dark:border-red-500/20">
                  <ImageIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    JPEG, PNG, GIF, WEBP (max 10MB)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewUrl && !isLoading && (
        <div className="animate-slide-up stagger-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              Preview
            </p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 blob-shape blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-700"></div>
            <div
              className="relative asymmetric-rounded-alt overflow-hidden shadow-2xl border-2 border-gray-200 dark:border-gray-700 tilt-hover organic-shadow"
              style={{ maxHeight: "400px" }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full object-contain bg-gray-900"
                style={{ maxHeight: "400px" }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate flex-1">
                    {uploadedImage?.name}
                  </p>
                  <span className="ml-3 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-bold text-green-300">
                    {Math.round(uploadedImage?.size / 1024)} KB
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 asymmetric-rounded text-xs font-bold flex items-center gap-2 shadow-xl smooth-scale">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
