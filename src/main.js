const publicData = {
  vatRate: 0.25,
  frameWaste: 20,
  glassWaste: 20,
  boardWaste: 20,
  frameAllowanceCmPerSide: 3,
  markupMultiplier: 3,
  rounding: 5,
  frames: [
    { id: "1425-102", name: "Rammeliste sort mat", price: 38 },
    { id: "105-303", name: "Rammeliste sølv", price: 35 },
    { id: "1530-365", name: "Rammeliste brun espresso", price: 53 },
    { id: "1530-600", name: "Rammeliste massiv ask", price: 59 },
    { id: "1530-RØG", name: "Rammeliste røget eg mørk", price: 86 },
    { id: "461", name: "Rammeliste eg", price: 53 },
    { id: "32RAA", name: "Rammeliste rå nr. 32", price: 34 },
    { id: "448", name: "Rammeliste sæbebehandlet eg", price: 46 }
  ],
  floatFrames: [
    { id: "1685-11", name: "Svæveliste sort mat", price: 58 },
    { id: "1247-115", name: "Svæveliste ege finer (til dybe lærreder)", price: 202 }
  ],
  glass: [
    { id: "2-FL", name: "2 mm float glas", price: 105 },
    { id: "UV-70", name: "UV70 / museumsglas", price: 425 }
  ],
  surfaces: [
    { id: "backboard", name: "Syrefri museumspap 3 mm", price: 168.57 },
    { id: "foam-3mm", name: "Foam board syrefri 3 mm", price: 164.29 },
    { id: "foam-5mm", name: "Foam board syrefri 5 mm", price: 101.4 }
  ],
  spacers: [
    { id: "10X5DIW", name: "Distanceliste hvid mat 10 x 5", price: 14 },
    { id: "1711-1020", name: "Distanceliste hvid malet", price: 19 }
  ],
  fixedAddons: [
    { id: "passepartout", name: "Passepartout", price: 200 },
    { id: "supplies", name: "Småmaterialer", price: 35 }
  ]
};

const els = {
  form: document.getElementById("publicCalculatorForm"),
  sizePreset: document.getElementById("sizePreset"),
  frameProfile: document.getElementById("frameProfile"),
  floatProfile: document.getElementById("floatProfile"),
  glassType: document.getElementById("glassType"),
  usePassepartout: document.getElementById("usePassepartout"),
  totalIncVat: document.getElementById("totalIncVat")
};

function money(value) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(value);
}

function byId(list, id) {
  return list.find((item) => item.id === id) || list[0];
}

function fixedAddon(id) {
  return byId(publicData.fixedAddons, id);
}

function numeric(id) {
  return Number.parseFloat(document.getElementById(id).value) || 0;
}

function selectedFrameType() {
  return document.querySelector("input[name='frameType']:checked").value;
}

function populateSelect(select, list) {
  select.innerHTML = "";
  list.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = publicName(item.name);
    select.appendChild(option);
  });
}

function publicName(name) {
  return name
    .replace(/^Rammeliste\s+/i, "")
    .replace(/^Svæveliste\s+/i, "")
    .replace(/\s+nr\..*$/i, "")
    .trim();
}

function updateMode() {
  document.body.dataset.publicMode = selectedFrameType();
}

function applySizePreset() {
  if (!els.sizePreset.value) return;

  const [width, height] = els.sizePreset.value.split(",").map(Number);
  document.getElementById("frameWidth").value = width;
  document.getElementById("frameHeight").value = height;
}

function markCustomSize(event) {
  if (event.target.id === "frameWidth" || event.target.id === "frameHeight") {
    els.sizePreset.value = "";
  }
}

function calculate() {
  updateMode();

  const frameType = selectedFrameType();
  const quantity = Math.max(1, Math.round(numeric("quantity")));
  const frameWidth = numeric("frameWidth") + publicData.frameAllowanceCmPerSide * 2;
  const frameHeight = numeric("frameHeight") + publicData.frameAllowanceCmPerSide * 2;
  const perimeter = 2 * (frameWidth + frameHeight) / 100;
  const area = frameWidth * frameHeight / 10000;
  const frameMeters = perimeter * (1 + publicData.frameWaste / 100);
  const glassArea = area * (1 + publicData.glassWaste / 100);
  const boardArea = area * (1 + publicData.boardWaste / 100);

  const frame = frameType === "float"
    ? byId(publicData.floatFrames, els.floatProfile.value)
    : byId(publicData.frames, els.frameProfile.value);

  const materialLines = [
    { cost: frameMeters * frame.price }
  ];

  if (frameType !== "float") {
    const glass = byId(publicData.glass, els.glassType.value);
    const backboard = publicData.surfaces[0];
    materialLines.push(
      { cost: glassArea * glass.price },
      { cost: boardArea * backboard.price }
    );

    if (frameType === "aquarium") {
      materialLines.push({ cost: frameMeters * publicData.spacers[0].price });
    }
  }

  const fixedLines = [
    { cost: fixedAddon("supplies").price },
    frameType !== "float" && els.usePassepartout.checked
      ? { cost: fixedAddon("passepartout").price }
      : null
  ].filter(Boolean);

  const materialSubtotal = materialLines.reduce((sum, line) => {
    return sum + line.cost * publicData.markupMultiplier;
  }, 0);
  const fixedSubtotal = fixedLines.reduce((sum, line) => sum + line.cost, 0);
  const subtotal = (materialSubtotal + fixedSubtotal) * quantity;
  const roundedSubtotal = Math.ceil(subtotal / publicData.rounding) * publicData.rounding;

  els.totalIncVat.textContent = money(roundedSubtotal * (1 + publicData.vatRate));
}

populateSelect(els.frameProfile, publicData.frames);
populateSelect(els.floatProfile, publicData.floatFrames);
populateSelect(els.glassType, publicData.glass);
els.sizePreset.addEventListener("change", applySizePreset);
els.form.addEventListener("input", markCustomSize);
els.form.addEventListener("input", calculate);
els.form.addEventListener("change", calculate);
calculate();
