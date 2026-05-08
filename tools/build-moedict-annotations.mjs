import fs from "node:fs";

const apiBase = "https://www.moedict.tw/a/";
const source = "https://github.com/g0v/moedict.tw";
const termsPath = "reading-data/moedict-fetch-terms.json";
const overridesPath = "reading-data/mandarin-overrides.json";
const outputPath = "reading-data/moedict-annotations.json";
const reportPath = "reading-data/moedict-annotation-report.json";
const metadataPath = "metadata.json";
const storyDirectory = "docs/101twstories";
const concurrency = Number.parseInt(process.env.MOEDICT_CONCURRENCY || "12", 10);

function readJson(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function hanCharacters(value) {
  return [...String(value || "")].filter(character => /\p{Script=Han}/u.test(character));
}

function splitReading(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean);
}

function normalizeReadings(term, heteronyms) {
  const expectedLength = hanCharacters(term).length;
  const seen = new Set();
  const readings = [];

  for (const item of Array.isArray(heteronyms) ? heteronyms : []) {
    const zhuyin = splitReading(item.b);
    const pinyin = splitReading(item.p);
    if (zhuyin.length !== expectedLength || pinyin.length !== expectedLength) continue;

    const key = `${zhuyin.join(" ")}|${pinyin.join(" ")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    readings.push({ zhuyin, pinyin });
  }

  return readings;
}

function normalizeEntry(term, data) {
  const readings = normalizeReadings(term, data?.h);
  return readings.length ? { term, readings } : null;
}

function collectSegmentedTerms() {
  const terms = new Set();
  const segmenter = new Intl.Segmenter("zh-Hant", { granularity: "word" });
  const paths = [
    metadataPath,
    ...fs.readdirSync(storyDirectory)
      .filter(file => file.endsWith(".md"))
      .map(file => `${storyDirectory}/${file}`)
  ];

  // Suffixes for proper nouns extraction
  const properNounSuffixes = ["事件", "運動", "紀念館", "博物館", "學校", "族", "社", "庄", "街", "港", "山", "溪", "河"];

  for (const path of paths) {
    const text = fs.readFileSync(path, "utf8");

    if (path.endsWith("metadata.json")) {
      try {
        const metadata = JSON.parse(text);
        for (const item of metadata) {
          if (item.title) terms.add(item.title);
          if (item.author) terms.add(item.author);
          if (item.category) terms.add(item.category);
        }
      } catch (e) {}
      continue;
    }

    // Extract markdown headings
    const headingMatches = text.matchAll(/^#{1,6}\s+(.+)$/gm);
    for (const match of headingMatches) {
      terms.add(match[1].trim());
    }

    // Extract quoted terms
    const quoteMatches = text.matchAll(/[「『](.+?)[」』]/g);
    for (const match of quoteMatches) {
      terms.add(match[1]);
    }

    for (const segment of segmenter.segment(text)) {
      const term = segment.segment.trim();
      if (!segment.isWordLike || !term) continue;
      if (hanCharacters(term).length !== [...term].length) continue;
      if ([...term].length > 10) continue;
      terms.add(term);

      // Check for proper noun suffixes and try to extract larger context if needed?
      // Since segmenter already segments, it might segment "大分事件" into "大分" and "事件".
      // We can scan text for these suffixes
    }

    // Advanced suffix extraction (scan text directly for suffix patterns)
    for (const suffix of properNounSuffixes) {
      // Look for 1 to 4 Han characters before the suffix
      const regex = new RegExp(`([\\p{Script=Han}]{1,4})${suffix}`, "gu");
      for (const match of text.matchAll(regex)) {
        terms.add(match[1] + suffix);
      }
    }
  }

  return terms;
}

function normalizeOverride(item) {
  const term = String(item.term || "").trim();
  const zhuyin = Array.isArray(item.zhuyin) ? item.zhuyin : splitReading(item.zhuyin);
  const pinyin = Array.isArray(item.pinyin) ? item.pinyin : splitReading(item.pinyin);
  const expectedLength = hanCharacters(term).length;

  if (!term || zhuyin.length !== expectedLength || pinyin.length !== expectedLength) {
    return null;
  }

  return {
    term,
    readings: [{ zhuyin, pinyin }],
    override: true,
    note: item.note || ""
  };
}

async function fetchTerm(term) {
  const url = `${apiBase}${encodeURIComponent(term)}.json`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "Taiwanstories101 annotation builder"
        }
      });

      if (response.status === 404) return { term, status: "missing" };
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const entry = normalizeEntry(term, await response.json());
      return entry ? { term, status: "ok", entry } : { term, status: "unusable" };
    } catch (error) {
      if (attempt === 3) {
        return { term, status: "failed", error: String(error?.message || error) };
      }
      await new Promise(resolve => setTimeout(resolve, 350 * attempt));
    }
  }

  return { term, status: "failed", error: "unknown error" };
}

function sortEntries(entries) {
  return entries.sort((a, b) => [...b.term].length - [...a.term].length || a.term.localeCompare(b.term, "zh-Hant"));
}

async function main() {
  const baseTerms = readJson(termsPath, []);
  const segmentedTerms = collectSegmentedTerms();
  const terms = [...new Set([...baseTerms, ...segmentedTerms])]
    .map(term => String(term).trim())
    .filter(Boolean)
    .filter(term => hanCharacters(term).length === [...term].length);
  const cachedEntries = readJson(outputPath, { entries: [] }).entries || [];
  const overrides = readJson(overridesPath, { overrides: [] }).overrides
    .map(normalizeOverride)
    .filter(Boolean);
  const overrideTerms = new Set(overrides.map(entry => entry.term));
  const cached = cachedEntries
    .filter(entry => entry?.term && !overrideTerms.has(entry.term))
    .map(entry => [entry.term, entry]);
  const cachedTerms = new Set(cached.map(([term]) => term));
  const fetchTerms = terms.filter(term => !overrideTerms.has(term) && !cachedTerms.has(term));
  const entries = new Map(overrides.map(entry => [entry.term, entry]));
  cached.forEach(([term, entry]) => entries.set(term, entry));
  const report = {
    source,
    api: apiBase,
    generatedAt: new Date().toISOString(),
    termsRequested: terms.length,
    segmentedTerms: segmentedTerms.size,
    cached: cachedTerms.size,
    overridesApplied: overrides.length,
    ok: 0,
    missing: [],
    unusable: [],
    failed: []
  };
  let index = 0;
  let completed = 0;

  async function worker() {
    while (index < fetchTerms.length) {
      const term = fetchTerms[index];
      index += 1;
      const result = await fetchTerm(term);
      completed += 1;

      if (result.status === "ok") {
        entries.set(result.term, result.entry);
        report.ok += 1;
      } else if (result.status === "missing") {
        report.missing.push(result.term);
      } else if (result.status === "unusable") {
        report.unusable.push(result.term);
      } else {
        report.failed.push({ term: result.term, error: result.error });
      }

      if (completed % 100 === 0 || completed === fetchTerms.length) {
        process.stdout.write(`Moedict annotations ${completed}/${fetchTerms.length}\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

  const output = {
    source,
    api: apiBase,
    generatedAt: report.generatedAt,
    entries: sortEntries([...entries.values()])
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`Saved ${output.entries.length} entries to ${outputPath}\n`);
  process.stdout.write(`Saved report to ${reportPath}\n`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
