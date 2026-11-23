import { escapeHtml, map, shell } from "./layout.mjs";
import { markdown } from "./markdown.mjs";
import { renderDiagram, codeAlignment, satelliteObservations, mapProjection, streetSignals } from "./diagrams.mjs";

const sat = [[115,105],[306,107],[211,253]];
const point = [211,153];
const drawings = {
  3: (_prefix,state) => codeAlignment(state),
  5: (_prefix,state) => satelliteObservations(state),
  6: mapProjection,
  7: streetSignals
};

function clockGraphic() {
  const colors = ["#125bb1","#27766d","#704b92"];
  const circles = sat.map(([x,y],i) => {
    const radius = Math.hypot(point[0]-x, point[1]-y);
    return `<circle data-radius="${radius}" data-stroke="${colors[i]}" cx="${x}" cy="${y}" r="${radius}" stroke="${colors[i]}" stroke-width="2.5" fill="none"/>`;
  }).join("");
  const satellites = sat.map(([x,y],i) => `<rect x="${x-5}" y="${y-5}" width="10" height="10" rx="2" fill="#1d3448"/><text x="${x+9}" y="${y-8}">S${i+1}</text>`).join("");
  return `<svg class="measure-display" viewBox="-26 -30 485 425" role="img" aria-labelledby="clock-graphic-caption">
  <title id="clock-graphic-caption">三個固定圓心與接收機示例點。切換共用鐘差後三個距離圓一起變大。</title>
  ${circles}<g fill="#1d3448" font-size="14" font-weight="750">${satellites}</g>
  <circle cx="${point[0]}" cy="${point[1]}" r="6.5" fill="#125dcb" stroke="white" stroke-width="2"/>
  <text x="222" y="151" fill="#15476b" font-size="13" font-weight="700">接收機示例點</text></svg>`;
}

function flow(steps) {
  const controls = steps.map(([label],index) => `<button type="button" class="pill" data-flow="${index}" aria-pressed="${index===0}">${index+1}. ${escapeHtml(label)}</button>`).join("");
  const details = steps.map(([label,input,output],index) => `<div data-flow-detail="${index}"${index===0?"":" hidden"}>
    <p><strong>${escapeHtml(label)}</strong></p>
    <p><strong>輸入</strong>　${markdown.renderInline(input)}</p><p><strong>產出</strong>　${markdown.renderInline(output)}</p></div>`).join("");
  return `<div class="flow-controls" role="group" aria-label="四步定位流程">${controls}</div><div class="flow-result" aria-live="polite">${details}</div>`;
}

function quiz(questions) {
  return questions.map(([prompt,answers]) => `<fieldset class="quiz"><legend>${escapeHtml(prompt)}</legend><div class="answers">${answers.map(([label,feedback]) => `<button type="button" aria-pressed="false" data-feedback="${escapeHtml(feedback)}">${escapeHtml(label)}</button>`).join("")}</div><p class="feedback" role="status"></p></fieldset>`).join("");
}

export function renderDeck(data, prefix, draft = false) {
  const contents = data.pages.map((page, i) => {
    const index = i+1;
    const heading = i === 0 ? "h1" : "h2";
    const title = `<${heading} id="slide-title-${index}" tabindex="-1">${escapeHtml(page.title)}</${heading}>`;
    const paragraphs = (page.paragraphs ?? []).map((text,index) =>
      `<p class="${index === 0 ? "lead" : ""}">${markdown.renderInline(text)}</p>`).join("");
    let body = title+paragraphs;
    if (index === 1) body = `<div class="columns"><div>${body}${flow(data.steps)}</div><div class="visual">${map(prefix,"intro")}</div></div>`;
    if (index === 4) body = `<div class="columns"><div>${body}<button class="switch" type="button" id="clock-toggle" aria-pressed="false">加入正鐘差</button><p class="clock-details" role="status"><span id="clock-zero">${markdown.renderInline("$b=0$。三個幾何距離圓都通過藍點。")}</span><span id="clock-biased" hidden>${markdown.renderInline("$b=+1.2$ 示意單位。三個半徑都增加 1.2，圓心與藍點位置固定。")}</span></p></div><div class="visual">${clockGraphic()}</div></div>`;
    if (index === 5) body += `<div class="term-grid">${[["$X$","地固坐標"],["$Y$","地固坐標"],["$Z$","地固坐標"],[String.raw`$\delta t_r$`,"接收機鐘差"]].map(([key,label])=>`<div><strong>${markdown.renderInline(key)}</strong>${label}</div>`).join("")}</div>`;
    const diagram = data.diagrams?.[index];
    if (diagram) {
      body = `<div class="columns"><div>${body}</div>${renderDiagram(diagram,state => drawings[index](prefix,state))}</div>`;
    }
    if (index === 8) body += quiz(data.quiz);
    if (index === 9) body += `<ul class="mini-list"><li><a href="${prefix}wiki/index.html">GNSS Wiki 入口</a></li>
    <li>主要來源　<a href="${prefix}wiki/sources/GNSS-13.html">GPS 介面規格</a>、<a href="${prefix}wiki/sources/GNSS-04.html">ESA 單點定位教材</a>、<a href="${prefix}wiki/sources/GNSS-07.html">Google 地圖藍點說明</a>，以及<a href="${prefix}raw/catalog.html">完整來源清冊</a>。</li>
    <li><a href="${prefix}wiki/topics/between-receiver.html">延伸閱讀：地面一次差</a></li><li><a href="${prefix}reports/claims.html">投影片、Wiki 與原文對照表</a></li></ul>`;
    const evidence = page.wiki.map(([id,label]) => `<a href="${prefix}wiki/topics/${id}.html">${escapeHtml(label)}</a>`).join("");
    return `<section class="deck-page" aria-labelledby="slide-title-${index}" id="page-${index}">${body}<div class="evidence">Wiki 概念頁 ${evidence}</div></section>`;
  }).join("\n");
  const status = draft ? `<p class="deck-shell doc-note">第一輪封存初稿，技術核對見<a href="${prefix}reports/round-1.html">初稿逐頁審查</a>。</p>` : "";
  return shell(data.pages[0].title, prefix, `${status}<main class="deck-shell">${contents}</main>
  <nav class="deck-nav" aria-label="投影片翻頁"><div class="deck-shell"><button id="previous" type="button">上一頁</button><output id="page-count" aria-live="polite"></output><button id="next" type="button">下一頁</button></div></nav><script src="${prefix}assets/deck.js"></script>`);
}
