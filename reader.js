const categoryFiles = {
  "島國意象": "docs/101twstories/101台灣小故事島國意象.md",
  "族群歷史": "docs/101twstories/101台灣小故事族群歷史.md",
  "本土藝文": "docs/101twstories/101台灣小故事本土藝文.md",
  "打拼精神": "docs/101twstories/101台灣小故事打拼精神.md"
};

const params = new URLSearchParams(window.location.search);
const storyTitle = params.get("title") || "";
const storyCategory = params.get("category") || "";
const body = document.querySelector("#markdown-body");
const title = document.querySelector("#reader-title");
const category = document.querySelector("#reader-category");
const meta = document.querySelector("#reader-meta");
const backLink = document.querySelector("#back-link");
const languageKeys = ["zh", "en", "annotated"];
const state = {
  lang: normalizeLanguage(localStorage.getItem("site-language")),
  annotations: null,
  annotationTerms: [],
  annotationTermsByFirstCharacter: {},
  singleCharacterAnnotations: {},
  polyphonicCharacters: new Set(),
  markdown: "",
  story: null
};

const readerCopy = {
  zh: {
    back: "← 回首頁",
    author: "作者",
    loading: "故事載入中",
    missing: "缺少故事資訊，請回首頁重新選擇。",
    notFound: "讀不到這篇故事的 Markdown 內容。",
    failed: "故事載入失敗，請確認本機預覽服務仍在執行。"
  },
  en: {
    back: "← Home",
    author: "Author",
    loading: "Loading story",
    missing: "Story information is missing. Please return home and choose again.",
    notFound: "The Markdown content for this story could not be found.",
    failed: "The story could not be loaded. Please check that the local preview server is running."
  }
};
const manualAmbiguousCharacters = new Set([
  "地", "得", "行", "長", "重", "樂", "會", "曾", "便", "種",
  "分", "少", "好", "都", "更", "只", "還", "藏", "朝", "降", "調", "應", "供", "任", "要",
  "間", "量", "數", "難", "傳", "處", "相", "華", "率", "空", "幾", "當", "倒",
  "強", "假", "塞", "盛", "興", "轉", "載", "露", "薄", "差", "曲", "喝", "看", "給", "將"
]);

const defaultSingleCharacterReadings = {
  "的": { zhuyin: "˙ㄉㄜ", pinyin: "de" },
  "了": { zhuyin: "˙ㄌㄜ", pinyin: "le" },
  "他": { zhuyin: "ㄊㄚ", pinyin: "tā" },
  "為": { zhuyin: "ㄨㄟˋ", pinyin: "wèi" },
  "與": { zhuyin: "ㄩˇ", pinyin: "yǔ" },
  "有": { zhuyin: "ㄧㄡˇ", pinyin: "yǒu" },
  "著": { zhuyin: "˙ㄓㄜ", pinyin: "zhe" },
  "和": { zhuyin: "ㄏㄢˋ", pinyin: "hàn" },
  "這": { zhuyin: "ㄓㄜˋ", pinyin: "zhè" },
  "上": { zhuyin: "ㄕㄤˋ", pinyin: "shàng" },
  "中": { zhuyin: "ㄓㄨㄥ", pinyin: "zhōng" },
  "來": { zhuyin: "ㄌㄞˊ", pinyin: "lái" },
  "於": { zhuyin: "ㄩˊ", pinyin: "yú" },
  "大": { zhuyin: "ㄉㄚˋ", pinyin: "dà" },
  "被": { zhuyin: "ㄅㄟˋ", pinyin: "bèi" }
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function interfaceLang() {
  return state.lang === "en" ? "en" : "zh";
}

function annotationMode() {
  return state.lang === "annotated" ? state.lang : "";
}

function normalizeLanguage(value) {
  if (value === "zhuyin" || value === "pinyin") return "annotated";
  return languageKeys.includes(value) ? value : "zh";
}

function isHanCharacter(value) {
  return /\p{Script=Han}/u.test(value);
}

function isAmbiguousCharacter(value) {
  return manualAmbiguousCharacters.has(value) || state.polyphonicCharacters.has(value);
}

function splitZhuyinReading(reading) {
  const value = String(reading || "");
  const leadingTone = value.match(/^˙/);
  if (leadingTone) {
    return { symbols: value.slice(1), tone: leadingTone[0] };
  }

  const trailingTone = value.match(/[ˊˇˋ˙]$/u);
  if (trailingTone) {
    return { symbols: value.slice(0, -1), tone: trailingTone[0] };
  }

  return { symbols: value, tone: "" };
}

function renderAnnotatedCharacter(character, readings) {
  const escapedCharacter = escapeHtml(character);
  const zhuyin = readings?.zhuyin || "";
  const pinyin = readings?.pinyin || "";
  const { symbols, tone } = splitZhuyinReading(zhuyin);
  const toneClass = tone ? "zhuyin-tone" : "zhuyin-tone is-empty";

  return [
    `<span class="mandarin-unit">`,
    `<span class="mandarin-top">`,
    `<span class="mandarin-base">${escapedCharacter}</span>`,
    `<span class="zhuyin-annotation" aria-label="${escapeHtml(zhuyin)}">`,
    `<span class="zhuyin-symbols">${escapeHtml(symbols)}</span>`,
    `<span class="${toneClass}">${tone ? escapeHtml(tone) : "˙"}</span>`,
    `</span>`,
    `</span>`,
    `<span class="pinyin-annotation">${escapeHtml(pinyin)}</span>`,
    `</span>`
  ].join("");
}

function renderUnknownCharacter(character) {
  const escapedCharacter = escapeHtml(character);
  return [
    `<span class="mandarin-unit is-unknown">`,
    `<span class="mandarin-top">`,
    `<span class="mandarin-base">${escapedCharacter}</span>`,
    `<span class="zhuyin-annotation" aria-hidden="true">&#8203;</span>`,
    `</span>`,
    `<span class="pinyin-annotation" aria-hidden="true">&#8203;</span>`,
    `</span>`
  ].join("");
}

function annotateText(value) {
  const mode = annotationMode();
  if (!mode) return escapeHtml(value);

  const characters = [...value];
  let output = "";
  let index = 0;

  while (index < characters.length) {
    const match = findAnnotationTerm(characters, index);
    if (match) {
      output += renderAnnotatedTerm(match.term, match.entry);
      index += [...match.term].length;
      continue;
    }

    const character = characters[index];
    
    if (/[a-zA-Z0-9]/.test(character)) {
      let word = character;
      let j = index + 1;
      while (j < characters.length && /[a-zA-Z0-9]/.test(characters[j])) {
        word += characters[j];
        j++;
      }
      output += renderUnknownCharacter(word);
      index = j;
      continue;
    }

    const escaped = escapeHtml(character);
    if (!isHanCharacter(character)) {
      if (/\s/.test(character)) {
        output += escaped;
      } else {
        output += renderUnknownCharacter(character);
      }
      index += 1;
      continue;
    }

    if (isAmbiguousCharacter(character)) {
      output += renderUnknownCharacter(character);
      index += 1;
      continue;
    }

    const readings = state.singleCharacterAnnotations[character] || defaultSingleCharacterReadings[character];
    output += readings ? renderAnnotatedCharacter(character, readings) : renderUnknownCharacter(character);
    index += 1;
  }

  return output;
}

function findAnnotationTerm(characters, start) {
  const current = characters[start];
  if (!isHanCharacter(current)) return null;
  const candidates = state.annotationTermsByFirstCharacter?.[current] || [];

  for (const entry of candidates) {
    const termCharacters = [...entry.term];
    if (termCharacters.length <= 1) continue;
    let matched = true;
    for (let offset = 0; offset < termCharacters.length; offset += 1) {
      if (characters[start + offset] !== termCharacters[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return { term: entry.term, entry };
  }

  return null;
}

function renderAnnotatedTerm(term, entry) {
  let readingIndex = 0;
  return [...term].map(character => {
    if (!isHanCharacter(character)) return escapeHtml(character);
    const readings = {
      zhuyin: entry.zhuyin[readingIndex],
      pinyin: entry.pinyin[readingIndex]
    };
    readingIndex += 1;
    return readings.zhuyin && readings.pinyin ? renderAnnotatedCharacter(character, readings) : escapeHtml(character);
  }).join("");
}

function inlineMarkdown(value) {
  let output = "";
  let cursor = 0;
  const tokenPattern = /(\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\))/g;
  let match;

  while ((match = tokenPattern.exec(value)) !== null) {
    output += annotateText(value.slice(cursor, match.index));
    if (match[2]) {
      output += `<strong>${annotateText(match[2])}</strong>`;
    } else {
      output += `<a href="${escapeHtml(match[4])}">${annotateText(match[3])}</a>`;
    }
    cursor = match.index + match[0].length;
  }

  output += annotateText(value.slice(cursor));
  return output;
}

function imageSource(src) {
  return src.startsWith("/images/") ? `docs${src}` : src;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  const figures = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  lines.forEach(line => {
    const trimmed = line.trim();
    const image = trimmed.match(/^!\[(.*)]\((.+)\)$/);
    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);

    if (!trimmed) {
      flushParagraph();
      return;
    }

    if (trimmed === "---") {
      flushParagraph();
      html.push("<hr />");
      return;
    }

    if (image) {
      flushParagraph();
      figures.push(`<figure><img src="${escapeHtml(imageSource(image[2]))}" alt="${escapeHtml(image[1])}" loading="lazy" /></figure>`);
      return;
    }

    if (heading) {
      flushParagraph();
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  return [...html, ...figures].join("\n");
}

function extractStory(markdown, wantedTitle) {
  const escaped = wantedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const startPattern = new RegExp(`(^|\\n)## ${escaped}\\s*\\n`);
  const startMatch = markdown.match(startPattern);
  if (!startMatch || startMatch.index === undefined) return "";

  const start = startMatch.index + startMatch[1].length;
  const rest = markdown.slice(start);
  const nextMatch = rest.match(/\n---\s*\n\n## /);
  return nextMatch && nextMatch.index !== undefined ? rest.slice(0, nextMatch.index) : rest;
}

function cleanStoryMarkdown(markdown, story) {
  const lines = markdown.split(/\r?\n/);
  const cleaned = [];
  let skipStoryBodyIntro = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isTopTitle = trimmed === `## ${story.title}`;
    const isAuthorMeta = trimmed === `**作者**：${story.author}`;
    const isCategoryMeta = trimmed === `**主題**：${story.category}`;
    const isImagesHeading = trimmed === "### 圖片";
    const isStoryBodyHeading = trimmed === "### 故事正文";

    if (isTopTitle || isAuthorMeta || isCategoryMeta || isImagesHeading) continue;

    if (isStoryBodyHeading) {
      skipStoryBodyIntro = true;
      continue;
    }

    if (skipStoryBodyIntro) {
      if (!trimmed || trimmed === story.title || trimmed === `文：${story.author}`) continue;
      skipStoryBodyIntro = false;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
}

async function loadStory() {
  applyLanguageChrome();

  const file = categoryFiles[storyCategory];
  if (!file || !storyTitle) {
    body.innerHTML = `<p>${readerCopy[interfaceLang()].missing}</p>`;
    return;
  }

  const [metadata, markdown] = await Promise.all([
    fetch("metadata.json").then(response => response.json()),
    fetch(file).then(response => response.text())
  ]);

  const story = metadata.find(item => item.title === storyTitle && item.category === storyCategory);
  state.story = story;
  if (!story) {
    body.innerHTML = `<p>${readerCopy[interfaceLang()].notFound}</p>`;
    return;
  }

  const storyMarkdown = extractStory(markdown, storyTitle);
  if (!storyMarkdown) {
    body.innerHTML = `<p>${readerCopy[interfaceLang()].notFound}</p>`;
    return;
  }

  state.markdown = cleanStoryMarkdown(storyMarkdown, story);
  document.title = `${storyTitle} | 101 台灣小故事`;
  await renderStory();
}

async function ensureAnnotations() {
  if (state.annotations || !annotationMode()) return;
  let data;
  try {
    data = await fetch("reading-data/moedict-annotations.json").then(response => {
      if (!response.ok) throw new Error("missing moedict annotations");
      return response.json();
    });
  } catch {
    data = await fetch("reading-data/mandarin-annotations.json").then(response => response.json());
  }

  const entries = Array.isArray(data) ? data.map(entry => ({
    term: entry.char,
    zhuyin: [entry.zhuyin],
    pinyin: [entry.pinyin],
    readingsCount: 1
  })) : data.entries.map(entry => {
    const readings = Array.isArray(entry.readings) ? entry.readings : [];
    const usableReadings = readings.filter(reading => reading.zhuyin?.length && reading.pinyin?.length);
    const reading = usableReadings[0];
    if (!reading) return null;
    return {
      term: entry.term,
      zhuyin: reading.zhuyin,
      pinyin: reading.pinyin,
      readingsCount: usableReadings.length
    };
  }).filter(Boolean);

  state.annotationTerms = entries
    .filter(entry => entry.term && entry.zhuyin?.length && entry.pinyin?.length)
    .sort((a, b) => [...b.term].length - [...a.term].length || a.term.localeCompare(b.term, "zh-Hant"));
  state.polyphonicCharacters = new Set(
    state.annotationTerms
      .filter(entry => [...entry.term].length === 1 && entry.readingsCount > 1)
      .map(entry => entry.term)
  );
  state.singleCharacterAnnotations = Object.fromEntries(
    state.annotationTerms
      .filter(entry => [...entry.term].length === 1 && entry.readingsCount === 1 && !manualAmbiguousCharacters.has(entry.term))
      .map(entry => [entry.term, {
        zhuyin: entry.zhuyin[0],
        pinyin: entry.pinyin[0]
      }])
  );
  state.annotationTermsByFirstCharacter = state.annotationTerms.reduce((groups, entry) => {
    const first = [...entry.term][0];
    groups[first] ||= [];
    groups[first].push(entry);
    return groups;
  }, {});
  state.annotations = data;
}

function applyLanguageChrome() {
  const dictionary = readerCopy[interfaceLang()];
  const canAnnotate = Boolean(annotationMode() && state.annotations);
  const displayTitle = storyTitle || dictionary.loading;
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-Hant";
  document.body.dataset.lang = state.lang;
  backLink.textContent = dictionary.back;
  title.innerHTML = canAnnotate ? annotateText(displayTitle) : escapeHtml(displayTitle);
  category.textContent = storyCategory;
  meta.innerHTML = state.story
    ? `${escapeHtml(dictionary.author)}：${canAnnotate ? annotateText(state.story.author) : escapeHtml(state.story.author)}`
    : "";
  document.querySelectorAll(".lang-button").forEach(button => {
    button.classList.toggle("is-active", button.dataset.lang === state.lang);
  });
}

async function renderStory() {
  applyLanguageChrome();
  await ensureAnnotations();
  applyLanguageChrome();
  body.classList.toggle("is-annotated", Boolean(annotationMode()));
  body.dataset.annotation = annotationMode() || "none";
  body.innerHTML = markdownToHtml(state.markdown);
}

loadStory().catch(() => {
  body.innerHTML = `<p>${readerCopy[interfaceLang()].failed}</p>`;
});

document.querySelectorAll(".lang-button").forEach(button => {
  button.addEventListener("click", async () => {
    state.lang = normalizeLanguage(button.dataset.lang);
    localStorage.setItem("site-language", state.lang);
    await renderStory();
  });
});
