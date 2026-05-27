"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as faceapi from "face-api.js";

export default function Home() {
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  // NEW STATES
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  // INTERNET STATUS
const [networkStatus, setNetworkStatus] =
useState("Checking...");
  const [showGuide, setShowGuide] = useState(false);

  // DARK MODE
const [darkMode, setDarkMode] =
useState(false);

  // CONVERT MODAL
const [showConvertModal, setShowConvertModal] =
useState(false);

const [pendingFiles, setPendingFiles] =
useState<any[]>([]);

  // CONVERSION SETTINGS
const [useCustomResize, setUseCustomResize] =
useState(false);

const [customWidth, setCustomWidth] =
useState(720);

const [customHeight, setCustomHeight] =
useState(960);

const [targetSizeMB, setTargetSizeMB] =
useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 100;
  const APP_VERSION = "v1.0.0";
  useEffect(() => {

    const loadModels = async () => {
  
      await faceapi.nets.tinyFaceDetector.loadFromUri(
        "/models"
      );
  
      setModelsLoaded(true);
  
      console.log("Face AI Loaded");
    };
  
    loadModels();
  
  }, []);

  useEffect(() => {

    const updateNetworkStatus = () => {
  
      if (!navigator.onLine) {
  
        setNetworkStatus("🔴 Network Offline");
  
        return;
      }
  
      // @ts-ignore
      const start =
      performance.now();
    
    fetch(
      "https://www.google.com/favicon.ico",
      {
        mode: "no-cors",
      }
    )
      .then(() => {
    
        const latency =
          performance.now() - start;
    
        if (latency < 80) {
    
          setNetworkStatus(
            "🟢 Network Excellent"
          );
    
        } else if (latency < 150) {
    
          setNetworkStatus(
            "🟡 Network Good"
          );
    
        } else if (latency < 300) {
    
          setNetworkStatus(
            "🟠 Network Moderate"
          );
    
        } else {
    
          setNetworkStatus(
            "🔴 Network Slow"
          );
        }
    
      })
      .catch(() => {
    
        setNetworkStatus(
          "🔴 Network Offline"
        );
    
      });
    };
  
    updateNetworkStatus();
    const interval =
  setInterval(
    updateNetworkStatus,
    5000
  );
  
    window.addEventListener(
      "online",
      updateNetworkStatus
    );
  
    window.addEventListener(
      "offline",
      updateNetworkStatus
    );
  
    return () => {

      clearInterval(interval);
  
      window.removeEventListener(
        "online",
        updateNetworkStatus
      );
  
      window.removeEventListener(
        "offline",
        updateNetworkStatus
      );
  
    };
  
  }, []);

  const [modelsLoaded, setModelsLoaded] =
  useState(false);

  // AI FACE CENTER RESIZE
const resizeImage = async (
  file: File
): Promise<Blob> => {

  return new Promise(async (resolve) => {

    const img = new Image();

    img.onload = async () => {

      const canvas =
        document.createElement("canvas");

        const finalWidth =
        useCustomResize
          ? customWidth
          : 720;
      
      const finalHeight =
        useCustomResize
          ? customHeight
          : 960;
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) return;

      // BACKGROUND
      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(
        0,
        0,
        finalWidth,
        finalHeight
      );

      let cropX = 0;
      let cropY = 0;
      let cropWidth = img.width;
      let cropHeight = img.height;

      // AI FACE DETECT
      if (modelsLoaded) {

        const detection =
          await faceapi.detectSingleFace(
            img,
            new faceapi.TinyFaceDetectorOptions()
          );

        if (detection) {

          const box =
            detection.box;

          // FACE CENTER
          const centerX =
            box.x + box.width / 2;

          const centerY =
            box.y + box.height / 2;

          // ZOOM LEVEL
          const zoom =
            1;

          cropWidth =
            box.width * zoom;

          cropHeight =
            cropWidth * (4 / 3);

          // POSITION
          cropX =
            centerX -
            cropWidth / 2;

          cropY =
            centerY -
            cropHeight / 2;

          // LIMIT
          if (cropX < 0) cropX = 0;
          if (cropY < 0) cropY = 0;

          if (
            cropX + cropWidth >
            img.width
          ) {
            cropX =
              img.width -
              cropWidth;
          }

          if (
            cropY + cropHeight >
            img.height
          ) {
            cropY =
              img.height -
              cropHeight;
          }
        }
      }

// FULL IMAGE FIT
const scale = Math.min(
  finalWidth / img.width,
  finalHeight / img.height
);

const drawWidth =
  img.width * scale;

const drawHeight =
  img.height * scale;

const offsetX =
  (finalWidth - drawWidth) / 2;

const offsetY =
  (finalHeight - drawHeight) / 2;

// DRAW FULL IMAGE
ctx.drawImage(
  img,
  offsetX,
  offsetY,
  drawWidth,
  drawHeight
);

      // EXPORT JPG
      let quality = 0.95;

const targetBytes =
  targetSizeMB * 1024 * 1024;

const compressImage = () => {

  canvas.toBlob(
    async (blob) => {

      if (!blob) return;

      // CHECK SIZE
      if (
        blob.size <= targetBytes ||
        quality <= 0.1
      ) {

        resolve(blob);

        return;
      }

      // REDUCE QUALITY
      quality -= 0.05;

      compressImage();

    },
    "image/jpeg",
    useCustomResize
      ? quality
      : 0.8
  );
};

compressImage();

}; // <- penutup img.onload

img.src =
  URL.createObjectURL(file);

});

};

  // IMAGE QUALITY CHECK
  const checkImageQuality = (
    file: File
  ): Promise<string[]> => {

    return new Promise((resolve) => {

      const warnings: string[] = [];

      const img = new Image();

      img.onload = () => {

        const canvas =
          document.createElement("canvas");

        const ctx =
          canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          resolve(warnings);
          return;
        }

        ctx.drawImage(
          img,
          0,
          0
        );

        const imageData =
          ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

        const data = imageData.data;

        // BRIGHTNESS
        let brightness = 0;

        for (
          let i = 0;
          i < data.length;
          i += 4
        ) {
          brightness +=
            (data[i] +
              data[i + 1] +
              data[i + 2]) / 3;
        }

        brightness =
          brightness /
          (data.length / 4);

        if (brightness < 50) {
          warnings.push(
            "Too Dark"
          );
        }

        // SIMPLE BLUR CHECK
        let edgeCount = 0;

        for (
          let i = 0;
          i < data.length;
          i += 16
        ) {
          const diff =
            Math.abs(
              data[i] -
              data[i + 4]
            );

          if (diff > 25) {
            edgeCount++;
          }
        }

        if (edgeCount < 500) {
          warnings.push(
            "Too Blurry"
          );
        }

        resolve(warnings);
      };

      img.src =
        URL.createObjectURL(file);
    });
  };

  // FACE DETECTION
  const detectFaceWarnings = async (
    file: File
  ): Promise<string[]> => {

    const warnings: string[] = [];

    if (!modelsLoaded) {
      return warnings;
    }

    const img = new Image();

    img.src =
      URL.createObjectURL(file);

    await new Promise(
      (resolve) => {
        img.onload = resolve;
      }
    );

    const detections =
      await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions()
      );

    // NO FACE
    if (detections.length === 0) {
      warnings.push(
        "No Face Detected"
      );
    }

    // MULTIPLE FACE
    if (detections.length > 1) {
      warnings.push(
        "Multiple Faces"
      );
    }

    // FACE SIZE CHECK
    if (detections.length === 1) {

      const face =
        detections[0].box;

      const faceArea =
        face.width * face.height;

      const imageArea =
        img.width * img.height;

      const ratio =
        faceArea / imageArea;

      // TOO FAR
      if (ratio < 0.08) {
        warnings.push(
          "Face Too Far"
        );
      }

      // TOO CLOSE
      if (ratio > 0.55) {
        warnings.push(
          "Face Too Close"
        );
      }
    }

    return warnings;
  };

  // HANDLE FILES
  const handleFiles = async (e: any) => {
    try {
      setLoading(true);
      setProgress(0);
      setMessage("");

      const files = pendingFiles;

      // LIMIT CHECK
      if (files.length > MAX_FILES) {

        // RESET FILE INPUT
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      
        setMessage(
          `Maximum upload limit is ${MAX_FILES} photos`
        );
      
        setTimeout(() => {
          setMessage("");
        }, 3000);
      
        setLoading(false);
      
        return;
      }

      // VALIDATE FILE TYPES
const invalidFiles = files.filter(
  (file: any) =>
    !file.type.startsWith("image/")
);

if (invalidFiles.length > 0) {

  // RESET INPUT
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }

  setMessage(
    "Only image files are allowed"
  );

  setTimeout(() => {
    setMessage("");
  }, 3000);

  setLoading(false);

  return;
}

const processed: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file: any = files[i];

        try {
          const resizedBlob = await resizeImage(file);
          const qualityWarnings =
  await checkImageQuality(file);

const faceWarnings =
  await detectFaceWarnings(file);

const warnings = [
  ...qualityWarnings,
  ...faceWarnings,
];

          const resizedFile = new File(
            [resizedBlob],
            file.name.replace(/\.[^/.]+$/, "") +
              "_Converted.jpg",
            {
              type: "image/jpeg",
            }
          );

          processed.push({
            original: file,
            file: resizedFile,
            preview: URL.createObjectURL(resizedBlob),warnings,
          });

          // UPDATE PROGRESS
          setProgress(
            Math.round(((i + 1) / files.length) * 100)
          );

        } catch (err: any) {

  // USER CANCEL SAVE
  if (err?.name === "AbortError") {
    return;
  }

  console.error(err);
}
      }

      setImages((prev) => [...prev, ...processed]);

      // RESET FILE INPUT
      if (fileInputRef.current) {
      fileInputRef.current.value = "";
      }

      setMessage(
        `Successfully converted ${processed.length} photos`
      );
      
      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (err) {
      console.error(err);

      setMessage(
        "Failed to process images"
      );
      
      setTimeout(() => {
        setMessage("");
      }, 3000);

    } finally {
      setLoading(false);
    }
  };

  // REMOVE IMAGE
  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  // EXPORT EXCEL
  const exportExcel = async () => {
    if (!confirmWithWarnings()) {
      return;
    }
    const ExcelJS = await import("exceljs");

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Employees");

    // PARTIZAN TEMPLATE
    worksheet.columns = [
      {
        header: "No",
        key: "no",
        width: 10,
      },
    
      {
        header: "Name Picture",
        key: "pictureName",
        width: 40,
      },
    
      {
        header: "Photo",
        key: "photo",
        width: 25,
      },
    ];

    // HEADER STYLE
    worksheet.getRow(1).height = 25;

    worksheet.getRow(1).eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      cell.font = {
        bold: true,
      };

    
    });

    // DATA
    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      const rowNumber = i + 2;

      worksheet.addRow({

        no: i + 1,
      
        pictureName:
          img.file.name,
      
      });

      // ROW STYLE
      const row = worksheet.getRow(rowNumber);

      row.height = 85;

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };

        
      });

      // FETCH IMAGE
      const response = await fetch(img.preview);

      const blob = await response.blob();

      const buffer = await blob.arrayBuffer();

      // ADD IMAGE
      const imageId = workbook.addImage({
        buffer,
        extension: "jpeg",
      });

      // INSERT IMAGE
worksheet.addImage(imageId, {

  tl: {
    col: 2.35,
    row: rowNumber - 1 + 0.12,
  },

  ext: {
    width: 75,
    height: 75,
  },

  editAs: "oneCell",
});
    }

    // EXPORT FILE
    const buffer = await workbook.xlsx.writeBuffer();

    // DATE FORMAT
    const today = new Date();

    const formattedDate =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

      saveAs(
        new Blob([buffer]),
        `Partizan_FR_Import_${formattedDate}.xlsx`
      );
  };

  // SAVE FILE WITH DIALOG
  const saveFileWithDialog = async (
    blob: Blob,
    filename: string
  ) => {

    // MODERN BROWSER
    if ("showSaveFilePicker" in window) {

      try {

        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
        });

        const writable =
          await handle.createWritable();

        await writable.write(blob);

        await writable.close();

            } catch (err: any) {

        // USER CANCEL SAVE
        if (err?.name === "AbortError") {
          return;
        }

        console.error(err);
      }

    } else {

      // FALLBACK
      saveAs(blob, filename);

    }
  };

    // CHECK WARNINGS
    const hasWarnings = () => {

      return images.some(
        (img) =>
          img.warnings &&
          img.warnings.length > 0
      );
    };
  
    // CONFIRM EXPORT
    const confirmWithWarnings = () => {
  
      if (hasWarnings()) {
  
        return window.confirm(
          "Some photos have quality warnings.\n\nDo you want to continue?"
        );
      }
  
      return true;
    };

  // DOWNLOAD ZIP
  const downloadZip = async () => {
    if (!confirmWithWarnings()) {
      return;
    }
    const zip = new JSZip();

    images.forEach((img) => {
      zip.file(img.file.name, img.file);
    });

    const content = await zip.generateAsync({
      type: "blob",
    });

    saveAs(
      content,
      "converted-images.zip"
    );
  };

  return (
    <main
      className={`min-h-screen p-4 md:p-10 transition-all duration-300 ${
        darkMode
          ? "bg-[#121212] text-white"
          : "bg-gray-100 text-black"
      }`}
    >

      <h1 className="text-3xl md:text-5xl font-bold mb-3">
        Online Image Converter
      </h1>

      <p
  className={`mb-6 ${
    darkMode
      ? "text-gray-300"
      : "text-gray-600"
  }`}
>
AI Face Auto Center • Default 720x960 (3:4) • Custom Resize & Compression Supported • {APP_VERSION}
</p>


 {/* RECOMMENDED BROWSER */}
 <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

 <div className="flex flex-col md:flex-row gap-3">
  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-xl text-sm md:text-base">
    🌐 Recommended Browser:
    <span className={`font-semibold ${
  darkMode
    ? "text-yellow-900"
    : "text-black"
}`}>
      {" "}Google Chrome / Microsoft Edge
    </span>
  </div>

  <a
    href="mailto:ryanrestian34@gmail.com"
    className={`transition px-4 py-3 rounded-xl flex items-center gap-2 text-sm md:text-base font-medium shadow-sm ${
      darkMode
        ? "bg-[#1e1e1e] text-white border border-gray-700 hover:bg-[#333333]"
        : "bg-white text-black border border-gray-300 hover:bg-gray-100"
    }`}
  >
    📧 Send Feedback / Suggestion
    </a>

</div>

{/* DARK MODE BUTTON */}
<button
  onClick={() =>
    setDarkMode(!darkMode)
  }
  className={`px-5 py-3 rounded-xl shadow font-semibold transition ${
    darkMode
      ? "bg-yellow-400 text-black"
      : "bg-black text-white"
  }`}
>
  {darkMode
    ? "☀ Light Mode"
    : "🌙 Dark Mode"}
</button>

</div>

{/* GUIDE + NETWORK */}
<div className="mb-6 flex items-center justify-between" >

  <button
    onClick={() =>
      setShowGuide(true)
    }
    className={`transition px-5 py-3 rounded-xl shadow font-semibold ${
      darkMode
        ? "bg-[#1e1e1e] text-white border border-gray-700 hover:bg-[#2a2a2a]"
        : "bg-white text-black border border-gray-300 hover:bg-gray-100"
    }`}
  >
    📷 View Face Photo Guideline
  </button>
  <div
  className={`text-sm font-semibold ${
    darkMode
      ? "text-gray-300"
      : "text-gray-700"
  }`}
>
  {networkStatus}
</div>

</div>

      {/* TOTAL PHOTOS */}
{images.length > 0 && (
  <div className="mb-6 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold shadow">
    
    <span>Converted Photos:</span>

    <span className="bg-white text-blue-600 px-3 py-1 rounded-lg">
      {images.length}
    </span>

  </div>
)}

      {/* STATUS MESSAGE */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-white font-semibold ${
            message.includes("Failed") ||
            message.includes("Maximum") ||
            message.includes("Only")
              ? "bg-red-500"
              : "bg-green-600"
          }`}
        >
          {message}
        </div>
      )}

      {/* ACTION BUTTONS */}
      {images.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">

          {/* DOWNLOAD ZIP */}
          <button
            onClick={downloadZip}
            className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-80 transition"
          >
            Download All ZIP
          </button>

          {/* EXPORT EXCEL */}
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition"
          >
            Export Excel
          </button>

          {/* DELETE ALL */}
          <button
            onClick={() => {
              setImages([]);
            
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition"
          >
            Delete All
          </button>

        </div>
      )}

      {/* UPLOAD AREA */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => {
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();

          setDragActive(false);

          const files = Array.from(e.dataTransfer.files);

          setPendingFiles(files);

setShowConvertModal(true);
        }}
        className={`rounded-3xl shadow-xl p-4 md:p-10 border-2 border-dashed text-center transition-all duration-300 ${
          dragActive
            ? "bg-blue-50 border-blue-500 scale-[1.01]"
            : darkMode
? "bg-[#1e1e1e] border-gray-600 text-white"
: "bg-white border-gray-300"
        }`}
      >

        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
          Upload Face Photos
        </h2>

        <p
  className={`mb-6 ${
    darkMode
      ? "text-gray-400"
      : "text-gray-500"
  }`}
>
          {dragActive
            ? "Drop Images Here"
            : "Click or Drag & Drop Images Here"}
        </p>

        {/* LOADING */}
        {loading && (
          <div className="mb-6">

            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-blue-600 h-6 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className={`mt-3 font-semibold ${
  darkMode
    ? "text-blue-400"
    : "text-blue-700"
}`}>
              Converting Photos... {progress}%
            </p>

          </div>
        )}

        <input
         ref={fileInputRef}
         type="file"
          multiple
          onChange={(e: any) => {

  const files =
    Array.from(e.target.files);

  setPendingFiles(files);

  setShowConvertModal(true);

}}
          className="mb-8"
        />

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {images.map((img, index) => (
            <div
              key={index}
              className={`rounded-2xl shadow-xl overflow-hidden relative border transition-all duration-300 hover:scale-[1.01] ${
                darkMode
                  ? "bg-[#1f1f1f] text-white border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >

              {/* REMOVE BUTTON */}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition"
              >
                ×
              </button>

              {/* IMAGE */}
              <img
                src={img.preview}
                alt=""
                className="w-full h-72 object-contain bg-[#1e1e1e]"
              />

              {/* FOOTER */}
              <div className="p-4">

                <p className="font-semibold truncate mb-2">
                  {img.file.name}
                </p>

                <p
  className={`text-sm mb-3 ${
    darkMode
      ? "text-gray-400"
      : "text-gray-500"
  }`}
>
                  {(img.file.size / 1024).toFixed(0)} KB
                </p>

                {/* WARNINGS */}
{img.warnings?.length > 0 && (

<div className="mb-3 flex flex-wrap gap-2">

  {img.warnings.map(
    (
      warning: string,
      idx: number
    ) => (

      <div
        key={idx}
        className="bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs px-3 py-1 rounded-full font-semibold"
      >
        ⚠ {warning}
      </div>

    )
  )}

</div>
)}

                {/* ACTION BUTTONS */}
                <div className="flex flex-col md:flex-row gap-2">

                  {/* VIEW */}
                  <button
                    onClick={() => setSelectedImage(img)}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition"
                  >
                    View
                  </button>

                  {/* DOWNLOAD */}
                  <button
                    onClick={() => {

                      if (!confirmWithWarnings()) {
                        return;
                      }
                    
                      saveFileWithDialog(
                        img.file,
                        img.file.name
                      );
                    }}
                    className="w-full bg-black text-white py-3 rounded-xl hover:opacity-80 transition"
                  >
                    Download
                  </button>

                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL VIEW */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

<div
  className={`relative p-4 rounded-2xl shadow-2xl ${
    darkMode
      ? "bg-[#1e1e1e] text-white"
      : "bg-white text-black"
  }`}
>

            {/* CLOSE */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 bg-red-500 text-white w-10 h-10 rounded-full text-xl"
            >
              ×
            </button>

            {/* IMAGE */}
            <img
              src={selectedImage.preview}
              alt=""
              className="w-[90vw] md:w-[500px] h-[70vh] md:h-[500px] object-contain rounded-xl bg-[#1e1e1e]"
            />

            {/* NAME */}
            <p className="text-center mt-4 font-semibold">
              {selectedImage.file.name}
            </p>

          </div>

        </div>
      )}

    {/* GUIDE MODAL */}
{showGuide && (

<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

<div
  className={`shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative rounded-3xl ${
    darkMode
      ? "bg-[#1e1e1e] text-white"
      : "bg-white text-black"
  }`}
>

    {/* CLOSE */}
    <button
      onClick={() =>
        setShowGuide(false)
      }
      className="absolute top-4 right-4 bg-red-500 text-white w-10 h-10 rounded-full text-xl"
    >
      ×
    </button>

    {/* TITLE */}
    <h2 className="text-3xl font-bold mb-8 text-center">
      📷 Face Photo Guideline
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* GOOD */}
      <div className="border-2 border-green-400 bg-green-50 rounded-3xl p-6">

        <h3 className="text-2xl font-bold text-green-700 mb-5">
          ✅ GOOD PHOTO
        </h3>

        <div className="space-y-3 text-black mb-6">

          <div>✔ Bright & Clear Face</div>

          <div>✔ Single Face Only</div>

          <div>✔ Face Positioned Center</div>

          <div>✔ Neutral Expression</div>

          <div>✔ Good Lighting</div>

        </div>

        {/* REAL SAMPLE */}
        <div className="flex justify-center">

          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
            className="w-56 h-72 object-cover rounded-2xl shadow-lg"
          />

        </div>

      </div>

      {/* BAD */}
      <div className="border-2 border-red-400 bg-red-50 rounded-3xl p-6">

        <h3 className="text-2xl font-bold text-red-700 mb-5">
          ❌ BAD PHOTO
        </h3>

        <div className="space-y-3 text-black mb-6">

          <div>✖ Too Dark</div>

          <div>✖ Too Blurry</div>

          <div>✖ Multiple Faces</div>

          <div>✖ Face Too Close</div>

          <div>✖ Face Too Far</div>

        </div>

        {/* BAD SAMPLES */}
        <div className="grid grid-cols-2 gap-4">

          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
            className="w-full h-40 object-cover rounded-2xl brightness-50"
          />

          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
            className="w-full h-40 object-cover rounded-2xl blur-sm"
          />

        </div>

      </div>

    </div>

  </div>

</div>
)}

{/* CONVERT MODAL */}
{showConvertModal && (

<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

<div
  className={`rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative ${
    darkMode
      ? "bg-[#1e1e1e] text-white"
      : "bg-white text-black"
  }`}
>

    {/* TITLE */}
    <h2 className="text-3xl font-bold mb-6 text-center">
      ⚙ Conversion Settings
    </h2>

    {/* MODE */}
    <div className="flex flex-col gap-4 mb-6">

      <label className="flex items-center gap-3">

        <input
          type="radio"
          checked={!useCustomResize}
          onChange={() =>
            setUseCustomResize(false)
          }
        />

        Default
        (720x960 &lt;1MB)

      </label>

      <label className="flex items-center gap-3">

        <input
          type="radio"
          checked={useCustomResize}
          onChange={() =>
            setUseCustomResize(true)
          }
        />

        Custom Resize

      </label>

    </div>

    {/* CUSTOM FORM */}
    {useCustomResize && (

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* WIDTH */}
        <div>

          <label className={`font-semibold ${
  darkMode
    ? "text-white"
    : "text-black"
}`}>
            Width
          </label>

          <input
            type="number"
            value={customWidth}
            onChange={(e) =>
              setCustomWidth(
                Number(e.target.value)
              )
            }
            className={`w-full border rounded-xl px-4 py-3 mt-2 ${
              darkMode
                ? "bg-[#2a2a2a] text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
          />

        </div>

        {/* HEIGHT */}
        <div>

          <label className={`font-semibold ${
  darkMode
    ? "text-white"
    : "text-black"
}`}>
            Height
          </label>

          <input
            type="number"
            value={customHeight}
            onChange={(e) =>
              setCustomHeight(
                Number(e.target.value)
              )
            }
            className={`w-full border rounded-xl px-4 py-3 mt-2 ${
              darkMode
                ? "bg-[#2a2a2a] text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
          />

        </div>

        {/* TARGET FILE SIZE */}
<div>

<label className={`font-semibold ${
  darkMode
    ? "text-white"
    : "text-black"
}`}>
  Target Max File Size (MB)
</label>

<input
  type="number"
  step="0.1"
  min="0.1"
  value={targetSizeMB}
  onChange={(e) =>
    setTargetSizeMB(
      Number(e.target.value)
    )
  }
  className={`w-full border rounded-xl px-4 py-3 mt-2 ${
    darkMode
      ? "bg-[#2a2a2a] text-white border-gray-600"
      : "bg-white text-black border-gray-300"
  }`}
/>

</div>

      </div>

    )}

    {/* ACTION */}
    <div className="flex justify-end gap-4">

      {/* CANCEL */}
      <button
        onClick={() => {

          setShowConvertModal(false);

          setPendingFiles([]);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

        }}
        className={`px-6 py-3 rounded-xl transition ${
          darkMode
            ? "bg-gray-700 text-white hover:bg-gray-600"
            : "bg-gray-300 hover:bg-gray-400 text-black"
        }`}
      >
        Cancel
      </button>

      {/* START */}
      <button
        onClick={async () => {

          setShowConvertModal(false);

          await handleFiles({});

        }}
        className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Start Convert
      </button>

    </div>

  </div>

</div>
)}

    </main>
  );
}