/* ===============================
  Output functions
  - HTML
  - PDF (print)
  - Word compatible (doc.html)
  - TXT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExport);
  }
});

function handleExport() {
  const outputName =
    document.getElementById("outputName")?.value?.trim() || "publications";

  const fmtHtml = document.getElementById("fmtHtml")?.checked;
  const fmtPdf  = document.getElementById("fmtPdf")?.checked;
  const fmtDocx = document.getElementById("fmtDocx")?.checked;
  const fmtTxt  = document.getElementById("fmtTxt")?.checked;

  if (!fmtHtml && !fmtPdf && !fmtDocx && !fmtTxt) {
    alert("出力形式を1つ以上選択してください。");
    return;
  }

  const main = document.getElementById("main");
  if (!main) {
    alert("出力対象が見つかりません。");
    return;
  }

  // clone main section
  const clone = main.cloneNode(true);

  // canvas → image（重要）
  replaceCanvasWithImage(clone);

  const html = buildHtmlDocument(clone.innerHTML);

  if (fmtHtml) {
    exportHtml(html, outputName);
  }
  if (fmtPdf) {
    exportPdf(html);
  }
  if (fmtDocx) {
    exportWord(html, outputName);
  }
  if (fmtTxt) {
    exportTxt(main, outputName);
  }
}

/* ===============================
  Canvas → Image
================================ */
function replaceCanvasWithImage(container) {
  const canvases = container.querySelectorAll("canvas");
  canvases.forEach(canvas => {
    try {
      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      canvas.replaceWith(img);
    } catch (e) {
      console.warn("Canvas image conversion failed", e);
    }
  });
}

/* ===============================
  HTML document builder
================================ */
function buildHtmlDocument(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>Publications</title>
<style>
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 24px;
}
table {
  border-collapse: collapse;
}
th, td {
  border: 1px solid #888;
  padding: 4px 8px;
}
.bold {
  font-weight: 700;
}
.underline {
  text-decoration: underline;
}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/* ===============================
  HTML export
================================ */
function exportHtml(html, outputName) {
  downloadBlob(html, "text/html;charset=utf-8", `${outputName}.html`);
}

/* ===============================
  PDF export (print)
================================ */
function exportPdf(html) {
  const w = window.open("", "_blank");
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
}

/* ===============================
  Word compatible export (NOT real docx)
================================ */
function exportWord(html, outputName) {
  // Word / LibreOffice / Google Docs compatible
  downloadBlob(
    html,
    "text/html;charset=utf-8",
    `${outputName}.doc.html`
  );
}

/* ===============================
  TXT export
================================ */
function exportTxt(main, outputName) {
  let text = "";

  // title
  const h2 = main.querySelector("h2");
  if (h2) text += h2.textContent + "\n\n";

  // tables
  main.querySelectorAll("table").forEach(table => {
    table.querySelectorAll("tr").forEach(tr => {
      const cells = Array.from(tr.children).map(td =>
        td.textContent.replace(/\s+/g, " ").trim()
      );
      text += cells.join("\t") + "\n";
    });
    text += "\n";
  });

  // lists
  main.querySelectorAll(".yearBlock").forEach(block => {
    const title = block.querySelector("h3");
    if (title) text += title.textContent + "\n";

    block.querySelectorAll("li").forEach(li => {
      text += "- " + li.textContent.replace(/\s+/g, " ").trim() + "\n";
    });
    text += "\n";
  });

  downloadBlob(text, "text/plain;charset=utf-8", `${outputName}.txt`);
}

/* ===============================
  Utility
================================ */
function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
