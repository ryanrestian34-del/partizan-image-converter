"use client";

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Home() {
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  // RESIZE IMAGE
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = 720;
        canvas.height = 960;

        const ctx = canvas.getContext("2d");

        if (ctx) {
          // BACKGROUND
          ctx.fillStyle = "#1e1e1e";
          ctx.fillRect(0, 0, 720, 960);

          // RESIZE PROPORTIONAL
          const scale = Math.min(
            720 / img.width,
            960 / img.height
          );

          const newWidth = img.width * scale;
          const newHeight = img.height * scale;

          const x = (720 - newWidth) / 2;
          const y = (960 - newHeight) / 2;

          ctx.drawImage(
            img,
            x,
            y,
            newWidth,
            newHeight
          );
        }

        // COMPRESS JPG
        canvas.toBlob(
          (blob) => {
            resolve(blob as Blob);
          },
          "image/jpeg",
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // HANDLE FILES
  const handleFiles = async (e: any) => {
    const files = Array.from(e.target.files);

    const processed = await Promise.all(
      files.map(async (file: any) => {
        const resizedBlob = await resizeImage(file);

        const resizedFile = new File(
          [resizedBlob],
          file.name.replace(/\.[^/.]+$/, "") + "_Converted.jpg",
          {
            type: "image/jpeg",
          }
        );

        return {
          original: file,
          file: resizedFile,
          preview: URL.createObjectURL(resizedBlob),
        };
      })
    );

    setImages((prev) => [...prev, ...processed]);
  };

  // REMOVE IMAGE
  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  // EXPORT EXCEL
  const exportExcel = async () => {
    const ExcelJS = await import("exceljs");

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Employees");

    // PARTIZAN TEMPLATE
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "User ID", key: "userid", width: 20 },
      { header: "Gender", key: "gender", width: 15 },
      { header: "ID Number", key: "idnumber", width: 20 },
      { header: "Telephone", key: "telephone", width: 20 },
      { header: "IC card 1", key: "ic1", width: 20 },
      { header: "IC card 2", key: "ic2", width: 20 },
      { header: "IC card 3", key: "ic3", width: 20 },
      { header: "Picture Name", key: "picture", width: 25 },
      { header: "Address", key: "address", width: 25 },
      { header: "Remarks", key: "remarks", width: 20 },
      { header: "Nation", key: "nation", width: 20 },
      { header: "Birthday", key: "birthday", width: 20 },
      { header: "Native place", key: "native", width: 20 },
      { header: "Person Type", key: "ptype", width: 20 },
      { header: "Person Attributes", key: "pattr", width: 25 },
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

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // DATA
    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      const rowNumber = i + 2;

      worksheet.addRow({
        name: img.file.name.replace("_Converted.jpg", ""),
        userid: "",
        gender: "",
        idnumber: "",
        telephone: "",
        ic1: "",
        ic2: "",
        ic3: "",
        address: "",
        remarks: "",
        nation: "",
        birthday: "",
        native: "",
        ptype: "",
        pattr: "",
      });

      // ROW STYLE
      const row = worksheet.getRow(rowNumber);

      row.height = 120;

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
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

      // INSERT IMAGE TO COLUMN I
      worksheet.addImage(imageId, {
        tl: {
          col: 8.25,
          row: rowNumber - 1 + 0.18,
        },
        ext: {
          width: 95,
          height: 95,
        },
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

  // DOWNLOAD ZIP
  const downloadZip = async () => {
    const zip = new JSZip();

    images.forEach((img) => {
      zip.file(img.file.name, img.file);
    });

    const content = await zip.generateAsync({
      type: "blob",
    });

    saveAs(content, "converted-images.zip");
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-5xl font-bold mb-3">
        Online Image Converter
      </h1>

      <p className="text-gray-600 mb-10">
        Auto Resize 720x960 (3:4) & Compress &lt;1MB
      </p>

      {/* ACTION BUTTONS */}
      {images.length > 0 && (
        <div className="flex gap-4 mb-6">

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
            onClick={() => setImages([])}
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

          handleFiles({
            target: {
              files,
            },
          });
        }}
        className={`rounded-3xl shadow-xl p-10 border-2 border-dashed text-center transition-all duration-300 ${
          dragActive
            ? "bg-blue-50 border-blue-500 scale-[1.01]"
            : "bg-white border-gray-300"
        }`}
      >
        <h2 className="text-3xl font-semibold mb-3">
          Upload Face Photos
        </h2>

        <p className="text-gray-500 mb-6">
          {dragActive
            ? "Drop Images Here"
            : "Click or Drag & Drop Images Here"}
        </p>

        <input
          type="file"
          multiple
          onChange={handleFiles}
          className="mb-8"
        />

        {/* GRID */}
        <div className="grid grid-cols-3 gap-6">
          {images.map((img, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl shadow overflow-hidden relative"
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
                className="w-full h-64 object-contain bg-[#1e1e1e]"
              />

              {/* FOOTER */}
              <div className="p-4">
                <p className="font-semibold truncate mb-2">
                  {img.file.name}
                </p>

                <p className="text-sm text-gray-500 mb-3">
                  {(img.file.size / 1024).toFixed(0)} KB
                </p>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2">

                  {/* VIEW */}
                  <button
                    onClick={() => setSelectedImage(img)}
                    className="w-1/2 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition"
                  >
                    View
                  </button>

                  {/* DOWNLOAD */}
                  <button
                    onClick={() =>
                      saveAs(img.file, img.file.name)
                    }
                    className="w-1/2 bg-black text-white py-3 rounded-xl hover:opacity-80 transition"
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

          <div className="relative bg-white p-4 rounded-2xl shadow-2xl">

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
              className="w-[500px] h-[500px] object-contain rounded-xl bg-[#1e1e1e]"
            />

            {/* NAME */}
            <p className="text-center mt-4 font-semibold">
              {selectedImage.file.name}
            </p>

          </div>

        </div>
      )}
    </main>
  );
  
}