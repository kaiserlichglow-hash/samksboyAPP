
export type RunShareData = {
  id: string;
  date: string;
  distance: number;
  duration: number;
  route?: { lat: number; lng: number }[];
};

type ImageStyle = "black" | "transparent";

function formatTime(totalSeconds: number) {
  const seconds = Math.round(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function formatPace(duration: number, distance: number) {
  if (distance <= 0) return "--:--";

  return formatTime(duration / distance);
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  try {
    const image = new Image();
    image.src = "/icon-512.png";
    await image.decode();

    const temp = document.createElement("canvas");
    temp.width = 512;
    temp.height = 512;

    const tempCtx = temp.getContext("2d");
    if (!tempCtx) return;

    tempCtx.drawImage(image, 0, 0, 512, 512);

    // Transforma o símbolo branco em uma logo
    // com fundo realmente transparente.
    const pixels = tempCtx.getImageData(0, 0, 512, 512);
    const data = pixels.data;

    for (let i = 0; i < data.length; i += 4) {
      const brightness =
        (data[i] + data[i + 1] + data[i + 2]) / 3;

      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(
        (data[i + 3] * brightness) / 255
      );
    }

    tempCtx.putImageData(pixels, 0, 0);
    ctx.drawImage(temp, x, y, size, size);
  } catch {
    // A arte continua mesmo se a logo não carregar.
  }
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  route: { lat: number; lng: number }[],
  x: number,
  y: number,
  width: number,
  height: number
) {
  const points = route.filter(
    (point) =>
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180
  );

  if (points.length < 2) return;

  const averageLat =
    points.reduce((sum, point) => sum + point.lat, 0) /
    points.length;

  const longitudeScale =
    Math.cos((averageLat * Math.PI) / 180);

  const longitudes = points.map(
    (point) => point.lng * longitudeScale
  );

  const latitudes = points.map((point) => point.lat);

  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);

  const rangeX = Math.max(maxLng - minLng, 0.000001);
  const rangeY = Math.max(maxLat - minLat, 0.000001);

  const scale = Math.min(
    width / rangeX,
    height / rangeY
  );

  const drawnWidth = rangeX * scale;
  const drawnHeight = rangeY * scale;

  const offsetX = x + (width - drawnWidth) / 2;
  const offsetY = y + (height - drawnHeight) / 2;

  ctx.save();
  ctx.beginPath();

  points.forEach((point, index) => {
    const px =
      offsetX +
      (point.lng * longitudeScale - minLng) * scale;

    const py =
      offsetY +
      (maxLat - point.lat) * scale;

    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

export async function exportRunShareImage(
  run: RunShareData,
  style: ImageStyle
) {
  if (
    !Number.isFinite(run.distance) ||
    run.distance <= 0 ||
    !Number.isFinite(run.duration) ||
    run.duration <= 0
  ) {
    throw new Error("Dados da corrida inválidos.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível criar a imagem.");
  }

  const isBlack = style === "black";

  if (isBlack) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";

  // Identidade SAMKS BOY
  await drawLogo(ctx, 295, 78, 110);

  ctx.font = "italic bold 58px Arial";
  ctx.fillText("samks boy", 660, 155);

  ctx.font = "italic 36px Georgia";
  ctx.fillText("Running performance", 540, 235);

  // Distância em destaque
  const distance = run.distance.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  ctx.font = "italic bold 170px Arial";
  ctx.fillText(distance, 485, 495, 770);

  ctx.font = "italic bold 65px Arial";
  ctx.fillText("KM", 910, 490);

  // Pace e tempo mais discretos
  ctx.font = "26px Arial";
  ctx.fillText("PACE", 275, 610);
  ctx.fillText("TIME", 805, 610);

  ctx.font = "italic bold 47px Arial";
  ctx.fillText(
    `${formatPace(run.duration, run.distance)}/km`,
    275,
    680,
    450
  );

  ctx.fillText(
    formatTime(run.duration),
    805,
    680,
    390
  );

  // Trajeto GPS real, quando existir
  if (run.route && run.route.length >= 2) {
    drawRoute(
      ctx,
      run.route,
      145,
      760,
      790,
      420
    );
  }

  // Exportação PNG
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Não foi possível exportar o PNG.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `samks-boy-${style}-${run.date}.png`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
