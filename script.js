document.addEventListener("DOMContentLoaded", () => {
  const csvInput = document.getElementById("csvInput");
  const status = document.getElementById("status");
  const tableArea = document.getElementById("tableArea");
  const listArea = document.getElementById("listArea");
  const authorArea = document.getElementById("authorArea");
  const startYearInput = document.getElementById("startYear");
  const endYearInput = document.getElementById("endYear");
  const authorFilterInput = document.getElementById("authorFilter");

  let allRows = [];
  let allAuthors = [];
  let selectedAuthors = [];
  let authorFilterText = "";
  let highlightStyle = "bold"; // "bold" | "underline" | "both"

if (authorFilterInput) {
  authorFilterInput.addEventListener("input", () => {
    authorFilterText = authorFilterInput.value.trim().toLowerCase();
    renderAuthorList(allRows);   // ← 著者一覧だけ再描画
  });
}

document
  .querySelectorAll('input[name="highlightStyle"]')
  .forEach(radio => {
    radio.addEventListener("change", () => {
      highlightStyle = radio.value;
      renderYearList(filterByYear(allRows)); // 見た目だけ再描画
    });
  });

  /* ===============================
     CSV 読み込み
  =============================== */

  csvInput.addEventListener("change", () => {
    const file = csvInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      allRows = parseCSV(reader.result);
      status.textContent = `CSVを読み込みました。件数：${allRows.length} 件`;

      renderAuthorList(allRows);
      renderAll();
    };
    reader.readAsText(file);
  });

  /* ===============================
     年範囲変更 → 再描画
  =============================== */

  [startYearInput, endYearInput].forEach(input => {
    if (!input) return;
    input.addEventListener("input", renderAll);
  });

  function renderAll() {
    const filteredRows = filterByYear(allRows);
    const yearly = aggregateByYearAndAuthor(filteredRows, selectedAuthors);

    renderYearTable(yearly, selectedAuthors);
    renderBarChart(filteredRows);   // ← ★復活
    renderYearList(filteredRows);
  }

  /* ===============================
     年フィルタ
  =============================== */

  function filterByYear(rows) {
    const start = parseInt(startYearInput?.value, 10);
    const end = parseInt(endYearInput?.value, 10);

    return rows.filter(r => {
      const y = parseInt(r["Publication Year"], 10);
      if (isNaN(y)) return false;
      if (!isNaN(start) && y < start) return false;
      if (!isNaN(end) && y > end) return false;
      return true;
    });
  }

  /* ===============================
     著者一覧（チェック）
  =============================== */

  function renderAuthorList(rows) {
    const set = new Set();

    rows.forEach(r => {
      const authors = r["Authors"] || "";
      authors.split(",").forEach(a => {
        const name = a.trim().replace(/\.$/, "");
        if (name) set.add(name);
      });
    });

    allAuthors = Array.from(set).sort();
    selectedAuthors = [];
    authorArea.innerHTML = "";

allAuthors.forEach(name => {
  // ★ 絞り込み判定
  if (
    authorFilterText &&
    !name.toLowerCase().includes(authorFilterText)
  ) {
    return; // 表示しない
  }

  const label = document.createElement("label");
  label.className = "authorItem";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = name;

  // ★ 既存のチェック状態を復元
  cb.checked = selectedAuthors.includes(name);

  cb.addEventListener("change", () => {
    selectedAuthors = Array.from(
      authorArea.querySelectorAll("input:checked")
    ).map(cb => cb.value);

    renderAll();
  });

  label.appendChild(cb);
  label.append(" " + name);
  authorArea.appendChild(label);
});

  }

  /* ===============================
     年次集計表
  =============================== */

  function renderYearTable(data, authors) {
    const years = Object.keys(data).sort();
    if (years.length === 0) {
      tableArea.textContent = "該当する年のデータがありません。";
      return;
    }

    let html = "<table>";
    html += "<tr><th>著者 / 年</th>";
    years.forEach(y => html += `<th>${y}</th>`);
    html += "<th>合計</th></tr>";

    // 全体
    html += "<tr><td class='year'>全体</td>";
    let grand = 0;
    years.forEach(y => {
      html += `<td>${data[y].total}</td>`;
      grand += data[y].total;
    });
    html += `<td class="total">${grand}</td></tr>`;

    // 著者別
    authors.forEach(name => {
      html += `<tr><td class="year">${name}</td>`;
      let sum = 0;
      years.forEach(y => {
        const v = data[y].authors[name] || 0;
        sum += v;
        html += `<td>${v}</td>`;
      });
      html += `<td>${sum}</td></tr>`;
    });

    html += "</table>";
    tableArea.innerHTML = html;
  }

  /* ===============================
     年別一覧（著者強調）
  =============================== */

  function renderYearList(rows) {
    listArea.innerHTML = "";

    const byYear = {};
    rows.forEach(r => {
      const y = r["Publication Year"];
      if (!y) return;
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(r);
    });

    const years = Object.keys(byYear).sort((a, b) => b - a);

    years.forEach(y => {
      const block = document.createElement("div");
      block.className = "yearBlock";

      const h3 = document.createElement("h3");
      h3.textContent = `${y}年（${byYear[y].length}件）`;
      block.appendChild(h3);

      const ol = document.createElement("ol");

      byYear[y].forEach(p => {
        let authors = p["Authors"] || "";
        const title = p["Title"] || "";
        const citation = p["Citation"] || "";

        selectedAuthors.forEach(name => {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\b${escaped}\\b`, "g");

        let cls = "bold";
        if (highlightStyle === "underline") cls = "underline";
        if (highlightStyle === "both") cls = "bold underline";

        authors = authors.replace(
            re,
            `<span class="${cls}">${name}</span>`
        );
        });


        const li = document.createElement("li");
        li.innerHTML = `${authors} ${title}. ${citation}`;
        ol.appendChild(li);
      });

      block.appendChild(ol);
      listArea.appendChild(block);
    });
  }
// ===============================
// section 切り替え（nav）
// ===============================
const navButtons = document.querySelectorAll("#navButtons button");
const sections = {
  main: document.getElementById("main"),
  input: document.getElementById("input"),
  output: document.getElementById("output"),
  howtouse: document.getElementById("howtouse"),
};

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;

    Object.keys(sections).forEach(key => {
      if (!sections[key]) return;
      sections[key].style.display =
        key === target ? "block" : "none";
    });
  });
});

});

/* ===============================
   集計ロジック
=============================== */

function aggregateByYearAndAuthor(rows, authors) {
  const map = {};

  rows.forEach(r => {
    const y = r["Publication Year"];
    if (!y) return;

    if (!map[y]) {
      map[y] = { total: 0, authors: {} };
      authors.forEach(a => map[y].authors[a] = 0);
    }

    map[y].total++;

    const rowAuthors = (r["Authors"] || "")
      .split(",")
      .map(a => a.trim().replace(/\.$/, ""));

    authors.forEach(a => {
      if (rowAuthors.includes(a)) {
        map[y].authors[a]++;
      }
    });
  });

  return map;
}

/* ===============================
   CSV パーサ
=============================== */

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length <= 1) return [];

  const header = splitCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = cols[idx] || "";
    });
    data.push(obj);
  }
  return data;
}

function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function renderBarChart(rows) {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 年ごとの件数（全体）
  const counts = {};
  rows.forEach(r => {
    const y = r["Publication Year"];
    if (!y) return;
    counts[y] = (counts[y] || 0) + 1;
  });

  const years = Object.keys(counts).sort();
  if (years.length === 0) return;

  const max = Math.max(...years.map(y => counts[y]));
  const padding = 40;
  const w = (canvas.width - padding * 2) / years.length;

  // 軸
  ctx.strokeStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  years.forEach((y, i) => {
    const value = counts[y];
    const h = (value / max) * (canvas.height - padding * 2);

    const x = padding + i * w + w * 0.1;
    const y0 = canvas.height - padding - h;

    // 棒
    ctx.fillStyle = "#4a7bd0";
    ctx.fillRect(x, y0, w * 0.8, h);

    // 件数
    ctx.fillStyle = "#111";
    ctx.font = "12px system-ui";
    ctx.fillText(value, x + 4, y0 - 6);

    // 年
    ctx.fillText(
      y,
      x + 4,
      canvas.height - padding + 14
    );
  });
}
