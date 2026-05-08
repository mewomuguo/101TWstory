const copy = {
  zh: {
    brand: "101 台灣小故事",
    eyebrow: "島嶼、人物、記憶與文化",
    heroTitle: "用 101 則故事閱讀臺灣",
    heroText: "從自然地景、族群歷史、本土藝文到打拼精神，探索這座島嶼如何被一代又一代的人說成故事。",
    searchLabel: "搜尋故事",
    searchPlaceholder: "輸入標題、作者或主題",
    stories: "則故事",
    themes: "個主題",
    images: "張圖像",
    catalogEyebrow: "故事架構",
    catalogTitle: "依主題進入故事",
    all: "全部",
    author: "作者",
    results: count => `顯示 ${count} 則故事`,
    empty: "沒有找到符合條件的故事",
    categories: {
      "島國意象": "島國意象",
      "族群歷史": "族群歷史",
      "本土藝文": "本土藝文",
      "打拼精神": "打拼精神"
    }
  },
  en: {
    brand: "101 Taiwan Stories",
    eyebrow: "Island, people, memory, and culture",
    heroTitle: "Read Taiwan Through 101 Stories",
    heroText: "Explore landscapes, communities, local arts, and public spirit through a collection shaped by generations of Taiwanese memory.",
    searchLabel: "Search stories",
    searchPlaceholder: "Search title, author, or theme",
    stories: "stories",
    themes: "themes",
    images: "images",
    catalogEyebrow: "Collection Structure",
    catalogTitle: "Browse by Theme",
    all: "All",
    author: "Author",
    results: count => `${count} stories shown`,
    empty: "No stories match your search",
    categories: {
      "島國意象": "Island Impressions",
      "族群歷史": "Communities and History",
      "本土藝文": "Local Arts and Literature",
      "打拼精神": "Striving Spirit"
    }
  }
};

const categoryOrder = ["島國意象", "族群歷史", "本土藝文", "打拼精神"];
const languageKeys = ["zh", "en", "annotated"];
const state = {
  lang: normalizeLanguage(localStorage.getItem("site-language")),
  category: "all",
  query: "",
  stories: []
};

const grid = document.querySelector("#story-grid");
const filters = document.querySelector("#filters");
const searchInput = document.querySelector("#story-search");
const clearSearch = document.querySelector("#clear-search");
const resultCount = document.querySelector("#result-count");
const template = document.querySelector("#story-card-template");

function storyNumber(story) {
  const match = story.url.match(/main_(\d+)_(\d+)\.html/);
  return match ? { theme: match[1], index: match[2] } : { theme: "1", index: "1" };
}

function readerPath(story) {
  const params = new URLSearchParams({
    title: story.title,
    category: story.category
  });
  return `reader.html?${params.toString()}`;
}

function applyLanguage() {
  const dictionary = activeCopy();
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-Hant";
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = dictionary[element.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    element.placeholder = dictionary[element.dataset.i18nPlaceholder];
  });
  document.querySelectorAll(".lang-button").forEach(button => {
    button.classList.toggle("is-active", button.dataset.lang === state.lang);
  });
  renderFilters();
  renderStories();
}

function renderFilters() {
  const dictionary = activeCopy();
  filters.innerHTML = "";
  const buttons = ["all", ...categoryOrder];
  buttons.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.classList.toggle("is-active", state.category === category);
    button.textContent = category === "all" ? dictionary.all : dictionary.categories[category];
    button.addEventListener("click", () => {
      state.category = category;
      renderFilters();
      renderStories();
    });
    filters.append(button);
  });
}

function filteredStories() {
  const query = state.query.trim().toLowerCase();
  return state.stories.filter(story => {
    const inCategory = state.category === "all" || story.category === state.category;
    const searchable = `${story.title} ${story.author} ${story.category}`.toLowerCase();
    return inCategory && (!query || searchable.includes(query));
  });
}

function renderStories() {
  const dictionary = activeCopy();
  const stories = filteredStories();
  grid.innerHTML = "";
  resultCount.textContent = dictionary.results(stories.length);

  if (!stories.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = dictionary.empty;
    grid.append(empty);
    return;
  }

  stories.forEach(story => {
    const card = template.content.firstElementChild.cloneNode(true);
    const link = card.querySelector(".story-link");
    const category = card.querySelector(".story-category");
    const title = card.querySelector(".story-title");
    const author = card.querySelector(".story-author");

    link.href = readerPath(story);
    category.textContent = dictionary.categories[story.category] || story.category;
    title.textContent = story.title;
    author.textContent = `${dictionary.author}: ${story.author}`;
    grid.append(card);
  });
}

function activeCopy() {
  return copy[state.lang === "en" ? "en" : "zh"];
}

function normalizeLanguage(value) {
  if (value === "zhuyin" || value === "pinyin") return "annotated";
  return languageKeys.includes(value) ? value : "zh";
}

async function loadStories() {
  const response = await fetch("metadata.json");
  state.stories = await response.json();
  document.querySelector("#total-count").textContent = state.stories.length;
  applyLanguage();
}

document.querySelectorAll(".lang-button").forEach(button => {
  button.addEventListener("click", () => {
    state.lang = normalizeLanguage(button.dataset.lang);
    localStorage.setItem("site-language", state.lang);
    applyLanguage();
  });
});

searchInput.addEventListener("input", event => {
  state.query = event.target.value;
  renderStories();
});

clearSearch.addEventListener("click", () => {
  state.query = "";
  searchInput.value = "";
  searchInput.focus();
  renderStories();
});

loadStories().catch(() => {
  grid.innerHTML = `<p class="empty-state">${activeCopy().empty}</p>`;
});
