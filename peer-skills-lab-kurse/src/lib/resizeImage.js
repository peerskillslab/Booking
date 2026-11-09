// Verkleinert ein Bild im Browser, bevor es hochgeladen wird. Ein Handyfoto
// mit mehreren MB wird so zu rund 60 KB. Die Ausrichtung aus den EXIF-Daten
// wenden aktuelle Browser beim Laden des <img> bereits an.
//
// format: "jpeg" für Fotos, "png" für Logos (Transparenz bleibt erhalten).
export async function resizeImage(file, { maxSize = 600, format = "jpeg", quality = 0.85 } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("unreadable_image"));
      el.src = url;
    });

    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (format === "jpeg") {
      // JPEG kennt keine Transparenz: sonst würden transparente Stellen schwarz.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    const mime = format === "png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) throw new Error("unreadable_image");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
