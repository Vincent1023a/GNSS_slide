import { escapeHtml, map } from "./layout.mjs";
import { markdown } from "./markdown.mjs";

function svg(label, content, viewBox = "0 0 560 320") {
  return `<svg class="diagram-svg" viewBox="${viewBox}" role="img" aria-label="${escapeHtml(label)}">${content}</svg>`;
}

export function renderDiagram({ id, label, selected = 0, states }, draw) {
  const buttons = states.map(([name], index) =>
    `<button class="pill" type="button" aria-controls="${id}-view-${index}" aria-pressed="${index===selected}" data-diagram-choice="${index}">${escapeHtml(name)}</button>`
  ).join("");
  const panels = states.map(([name, caption], index) => `<div id="${id}-view-${index}" data-diagram-view="${index}"${index===selected ? "" : " hidden"}>
    ${draw(index)}
    <p class="diagram-caption">${markdown.renderInline(caption)}</p>
  </div>`).join("");
  return `<div class="diagram visual" id="${id}"><div class="diagram-controls" role="group" aria-label="${escapeHtml(label)}">${buttons}</div>
  <div aria-live="polite">${panels}</div></div>`;
}

export function codeAlignment(index) {
  const offsets = [-56, 0, 56];
  const shift = offsets[index];
  const pattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
  const waveform = (start, top, color) => {
    const points = pattern.map((bit, i) => {
      const x = start + i * 28;
      const y = top + (bit ? 0 : 23);
      return `${i === 0 ? "M" : "L"}${x} ${y}H${x + 28}`;
    }).join("");
    return `<path d="${points}" fill="none" stroke="${color}" stroke-width="3.8" stroke-linejoin="round"/>`;
  };
  const guides = Array.from({length: 15}, (_, i) => {
    const x = 84 + i * 28;
    return `<path d="M${x} 57v200" stroke="#dbe6e7" stroke-width="1"/>`;
  }).join("");
  const comparison = shift === 0
    ? `<circle cx="140" cy="257" r="5" fill="#155ac3"/>`
    : `<path d="M140 257h${shift}M140 250v14M${140+shift} 250v14" fill="none" stroke="#ae490d" stroke-width="2.4"/>`;
  return svg("上下兩列為同一個示意碼型。切換時只移動接收機產生的副本。", `
    ${guides}
    <path d="M140 64v200" stroke="#155ac3" stroke-width="1.5" stroke-dasharray="5 5"/>
    <path d="M${140+shift} 155v109" stroke="#ae490d" stroke-width="1.5" stroke-dasharray="5 5"/>
    ${waveform(140, 79, "#155ac3")}
    ${waveform(140 + shift, 179, "#ae490d")}
    ${comparison}
    <g class="diagram-label"><text x="25" y="43">收到的衛星碼</text><text x="25" y="146">接收機的副本</text></g>
    <text x="530" y="294" text-anchor="end" class="diagram-muted">時間順序</text>`);
}

export function satelliteObservations(index) {
  const count = index + 3;
  const positions = [[76,92],[177,66],[280,87],[383,66],[484,92]];
  const observations = positions.map(([x,y],i) => {
    const visible = i < count;
    return `<g data-observation="${visible ? "available" : "unavailable"}">
      <path d="M${x} ${y+22}L280 241" stroke="${visible ? "#2868af" : "#98a9ac"}" stroke-width="${visible ? 2.4 : 1.6}" ${visible?"":'stroke-dasharray="5 7"'}/>
      <rect x="${x-18}" y="${y-15}" width="36" height="32" rx="7" fill="${visible?"#e4eefb":"#f0f4f4"}" stroke="${visible?"#2868af":"#97a7ab"}" stroke-width="1.8"/>
      <text x="${x}" y="${y+6}" text-anchor="middle" class="diagram-label">S${i+1}</text>
    </g>`;
  }).join("");
  return svg(`同一接收機目前有 ${count} 筆碼距離觀測。每條實線代表一筆。`, `
    ${observations}<circle cx="280" cy="247" r="11" fill="#155ac3" stroke="#fff" stroke-width="3"/>
    <text x="280" y="281" text-anchor="middle" class="diagram-label">接收機</text>
    <text x="280" y="31" text-anchor="middle" class="diagram-label">${count} 筆觀測，4 個未知數</text>
  `);
}

function globe(position) {
  const earth = `<ellipse cx="280" cy="159" rx="128" ry="112" fill="#e3efe9" stroke="#8eafa9" stroke-width="1.8"/>
  <ellipse cx="280" cy="159" rx="128" ry="34" fill="none" stroke="#a6bdb7" stroke-width="1.3"/>
  <ellipse cx="280" cy="159" rx="58" ry="112" fill="none" stroke="#a6bdb7" stroke-width="1.3"/>`;
  const point = `<circle cx="366" cy="110" r="9" fill="#155ac3" stroke="white" stroke-width="3"/>
  <text x="382" y="95" class="diagram-label">同一位置</text>`;
  if (position === 0) return svg("以地球中心為原點的地固三軸，藍點是同一位置。", `
    ${earth}
    <path d="M280 159L131 235M280 159H434M280 159V25" stroke="#286283" stroke-width="2.6"/>
    <path d="M280 159L366 110" stroke="#155ac3" stroke-width="2" stroke-dasharray="5 5"/>
    <circle cx="280" cy="159" r="4" fill="#286283"/>
    <g class="diagram-label"><text x="115" y="248">X</text><text x="440" y="165">Y</text><text x="289" y="28">Z</text></g>
    <text x="283" y="181" class="diagram-muted">地球中心</text>${point}
  `);
  return svg("參考橢球的經線與緯線示意，藍點仍代表同一位置。", `
    ${earth}
    <path d="M366 110Q404 167 280 271" fill="none" stroke="#155ac3" stroke-width="2.6"/>
    <path d="M178 110Q277 154 366 110Q389 98 391 97" fill="none" stroke="#ae490d" stroke-width="2.6"/>
    <g class="diagram-muted"><text x="121" y="115">緯線</text><text x="393" y="207">經線</text></g>
    ${point}
  `);
}
export function mapProjection(prefix, index) {
  return index === 2 ? map(prefix,"coordinates") : globe(index);
}
export function streetSignals(prefix, index) {
  return map(prefix, ["direct", "blocked", "reflected"][index]);
}
