import fs from "node:fs";

const storyDirectory = "docs/101twstories";
const annotationsPath = "reading-data/moedict-annotations.json";
const reportPath = "reading-data/v2-annotation-report.json";

function isHanCharacter(value) {
  return /\p{Script=Han}/u.test(value);
}

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
  "都": { zhuyin: "ㄉㄡ", pinyin: "dōu" },
  "家": { zhuyin: "ㄐㄧㄚ", pinyin: "jiā" },
  "日": { zhuyin: "ㄖˋ", pinyin: "rì" },
  "地": { zhuyin: "ㄉㄧˋ", pinyin: "dì" },
  "多": { zhuyin: "ㄉㄨㄛ", pinyin: "duō" },
  "並": { zhuyin: "ㄅㄧㄥˋ", pinyin: "bìng" },
  "要": { zhuyin: "ㄧㄠˋ", pinyin: "yào" },
  "陳": { zhuyin: "ㄔㄣˊ", pinyin: "chén" },
  "從": { zhuyin: "ㄘㄨㄥˊ", pinyin: "cóng" },
  "文": { zhuyin: "ㄨㄣˊ", pinyin: "wén" },
  "更": { zhuyin: "ㄍㄥˋ", pinyin: "gèng" },
  "說": { zhuyin: "ㄕㄨㄛ", pinyin: "shuō" },
  "會": { zhuyin: "ㄏㄨㄟˋ", pinyin: "huì" },
  "三": { zhuyin: "ㄙㄢ", pinyin: "sān" },
  "不": { zhuyin: "ㄅㄨˋ", pinyin: "bù" },
  "將": { zhuyin: "ㄐㄧㄤ", pinyin: "jiāng" },
  "北": { zhuyin: "ㄅㄟˇ", pinyin: "běi" },
  "們": { zhuyin: "˙ㄇㄣ", pinyin: "men" },
  "還": { zhuyin: "ㄏㄞˊ", pinyin: "hái" },
  "我": { zhuyin: "ㄨㄛˇ", pinyin: "wǒ" },
  "過": { zhuyin: "ㄍㄨㄛˋ", pinyin: "guò" },
  "南": { zhuyin: "ㄋㄢˊ", pinyin: "nán" },
  "個": { zhuyin: "˙ㄍㄜ", pinyin: "ge" },
  "好": { zhuyin: "ㄏㄠˇ", pinyin: "hǎo" },
  "種": { zhuyin: "ㄓㄨㄥˇ", pinyin: "zhǒng" },
  "其": { zhuyin: "ㄑㄧˊ", pinyin: "qí" },
  "石": { zhuyin: "ㄕˊ", pinyin: "shí" },
  "次": { zhuyin: "ㄘˋ", pinyin: "cì" },
  "看": { zhuyin: "ㄎㄢˋ", pinyin: "kàn" },
  "那": { zhuyin: "ㄋㄚˋ", pinyin: "nà" },
  "化": { zhuyin: "ㄏㄨㄚˋ", pinyin: "huà" },
  "作": { zhuyin: "ㄗㄨㄛˋ", pinyin: "zuò" },
  "給": { zhuyin: "ㄍㄟˇ", pinyin: "gěi" },
  "把": { zhuyin: "ㄅㄚˇ", pinyin: "bǎ" },
  "六": { zhuyin: "ㄌㄧㄡˋ", pinyin: "liù" },
  "曾": { zhuyin: "ㄘㄥˊ", pinyin: "céng" },
  "丁": { zhuyin: "ㄉㄧㄥ", pinyin: "dīng" },
  "治": { zhuyin: "ㄓˋ", pinyin: "zhì" },
  "雨": { zhuyin: "ㄩˇ", pinyin: "yǔ" },
  "許": { zhuyin: "ㄒㄩˇ", pinyin: "xǔ" },
  "寫": { zhuyin: "ㄒㄧㄝˇ", pinyin: "xiě" },
  "無": { zhuyin: "ㄨˊ", pinyin: "wú" },
  "當": { zhuyin: "ㄉㄤ", pinyin: "dāng" },
  "達": { zhuyin: "ㄉㄚˊ", pinyin: "dá" },
  "仔": { zhuyin: "ㄗˇ", pinyin: "zǐ" },
  "稱": { zhuyin: "ㄔㄥ", pinyin: "chēng" },
  "可": { zhuyin: "ㄎㄜˇ", pinyin: "kě" },
  "內": { zhuyin: "ㄋㄟˋ", pinyin: "nèi" },
  "葉": { zhuyin: "ㄧㄝˋ", pinyin: "yè" },
  "子": { zhuyin: "˙ㄗ", pinyin: "zi" },
  "語": { zhuyin: "ㄩˇ", pinyin: "yǔ" },
  "入": { zhuyin: "ㄖㄨˋ", pinyin: "rù" },
  "先": { zhuyin: "ㄒㄧㄢ", pinyin: "xiān" },
  "它": { zhuyin: "ㄊㄚ", pinyin: "tā" },
  "鄉": { zhuyin: "ㄒㄧㄤ", pinyin: "xiāng" },
  "便": { zhuyin: "ㄅㄧㄢˋ", pinyin: "biàn" },
  "溪": { zhuyin: "ㄒㄧ", pinyin: "xī" },
  "白": { zhuyin: "ㄅㄞˊ", pinyin: "bái" },
  "跑": { zhuyin: "ㄆㄠˇ", pinyin: "pǎo" },
  "區": { zhuyin: "ㄑㄩ", pinyin: "qū" },
  "夏": { zhuyin: "ㄒㄧㄚˋ", pinyin: "xià" },
  "耕": { zhuyin: "ㄍㄥ", pinyin: "gēng" },
  "數": { zhuyin: "ㄕㄨˋ", pinyin: "shù" },
  "頭": { zhuyin: "ㄊㄡˊ", pinyin: "tóu" },
  "打": { zhuyin: "ㄉㄚˇ", pinyin: "dǎ" },
  "埔": { zhuyin: "ㄆㄨˇ", pinyin: "pǔ" },
  "庫": { zhuyin: "ㄎㄨˋ", pinyin: "kù" },
  "張": { zhuyin: "ㄓㄤ", pinyin: "zhāng" },
  "雖": { zhuyin: "ㄙㄨㄟ", pinyin: "suī" },
  "正": { zhuyin: "ㄓㄥˋ", pinyin: "zhèng" },
  "落": { zhuyin: "ㄌㄨㄛˋ", pinyin: "luò" },
  "身": { zhuyin: "ㄕㄣ", pinyin: "shēn" },
  "且": { zhuyin: "ㄑㄧㄝˇ", pinyin: "qiě" },
  "吃": { zhuyin: "ㄔ", pinyin: "chī" },
  "感": { zhuyin: "ㄍㄢˇ", pinyin: "gǎn" },
  "遠": { zhuyin: "ㄩㄢˇ", pinyin: "yuǎn" },
  "亮": { zhuyin: "ㄌㄧㄤˋ", pinyin: "liàng" },
  "景": { zhuyin: "ㄐㄧㄥˇ", pinyin: "jǐng" },
  "戲": { zhuyin: "ㄒㄧˋ", pinyin: "xì" },
  "只": { zhuyin: "ㄓˇ", pinyin: "zhǐ" },
  "枝": { zhuyin: "ㄓ", pinyin: "zhī" },
  "捕": { zhuyin: "ㄅㄨˇ", pinyin: "bǔ" },
  "曼": { zhuyin: "ㄇㄢˋ", pinyin: "màn" },
  "朱": { zhuyin: "ㄓㄨ", pinyin: "zhū" },
  "紅": { zhuyin: "ㄏㄨㄥˊ", pinyin: "hóng" },
  "業": { zhuyin: "ㄧㄝˋ", pinyin: "yè" },
  "較": { zhuyin: "ㄐㄧㄠˋ", pinyin: "jiào" },
  "共": { zhuyin: "ㄍㄨㄥˋ", pinyin: "gòng" },
  "微": { zhuyin: "ㄨㄟˊ", pinyin: "wéi" },
  "父": { zhuyin: "ㄈㄨˋ", pinyin: "fù" },
  "平": { zhuyin: "ㄆㄧㄥˊ", pinyin: "píng" },
  "風": { zhuyin: "ㄈㄥ", pinyin: "fēng" },
  "使": { zhuyin: "ㄕˇ", pinyin: "shǐ" },
  "呢": { zhuyin: "˙ㄋㄜ", pinyin: "ne" },
  "澄": { zhuyin: "ㄔㄥˊ", pinyin: "chéng" },
  "波": { zhuyin: "ㄅㄛ", pinyin: "bō" },
  "女": { zhuyin: "ㄋㄩˇ", pinyin: "nǚ" },
  "阿": { zhuyin: "ㄚ", pinyin: "ā" },
  "若": { zhuyin: "ㄖㄨㄛˋ", pinyin: "ruò" },
  "原": { zhuyin: "ㄩㄢˊ", pinyin: "yuán" },
  "見": { zhuyin: "ㄐㄧㄢˋ", pinyin: "jiàn" },
  "偕": { zhuyin: "ㄒㄧㄝˊ", pinyin: "xié" },
  "場": { zhuyin: "ㄔㄤˇ", pinyin: "chǎng" },
  "施": { zhuyin: "ㄕ", pinyin: "shī" },
  "賢": { zhuyin: "ㄒㄧㄢˊ", pinyin: "xián" },
  "校": { zhuyin: "ㄒㄧㄠˋ", pinyin: "xiào" },
  "蔡": { zhuyin: "ㄘㄞˋ", pinyin: "cài" },
  "百": { zhuyin: "ㄅㄞˇ", pinyin: "bǎi" },
  "法": { zhuyin: "ㄈㄚˇ", pinyin: "fǎ" },
  "聽": { zhuyin: "ㄊㄧㄥ", pinyin: "tīng" },
  "期": { zhuyin: "ㄑㄧˊ", pinyin: "qí" },
  "沒": { zhuyin: "ㄇㄟˊ", pinyin: "méi" },
  "號": { zhuyin: "ㄏㄠˋ", pinyin: "hào" },
  "莫": { zhuyin: "ㄇㄛˋ", pinyin: "mò" },
  "亞": { zhuyin: "ㄧㄚˋ", pinyin: "yà" },
  "省": { zhuyin: "ㄕㄥˇ", pinyin: "shěng" },
  "藉": { zhuyin: "ㄐㄧㄝˋ", pinyin: "jiè" },
  "比": { zhuyin: "ㄅㄧˇ", pinyin: "bǐ" },
  "濤": { zhuyin: "ㄊㄠ", pinyin: "tāo" },
  "度": { zhuyin: "ㄉㄨˋ", pinyin: "dù" },
  "同": { zhuyin: "ㄊㄨㄥˊ", pinyin: "tóng" },
  "茂": { zhuyin: "ㄇㄠˋ", pinyin: "mào" },
  "句": { zhuyin: "ㄐㄩˋ", pinyin: "jù" },
  "華": { zhuyin: "ㄏㄨㄚˊ", pinyin: "huá" },
  "隘": { zhuyin: "ㄞˋ", pinyin: "ài" },
  "哪": { zhuyin: "ㄋㄚˇ", pinyin: "nǎ" },
  "音": { zhuyin: "ㄧㄣ", pinyin: "yīn" },
  "居": { zhuyin: "ㄐㄩ", pinyin: "jū" },
  "般": { zhuyin: "ㄅㄢ", pinyin: "bān" },
  "言": { zhuyin: "ㄧㄢˊ", pinyin: "yán" },
  "莎": { zhuyin: "ㄕㄚ", pinyin: "shā" },
  "祭": { zhuyin: "ㄐㄧˋ", pinyin: "jì" },
  "苑": { zhuyin: "ㄩㄢˋ", pinyin: "yuàn" },
  "片": { zhuyin: "ㄆㄧㄢˋ", pinyin: "piàn" },
  "僅": { zhuyin: "ㄐㄧㄣˇ", pinyin: "jǐn" },
  "沿": { zhuyin: "ㄧㄢˊ", pinyin: "yán" },
  "雙": { zhuyin: "ㄕㄨㄤ", pinyin: "shuāng" },
  "思": { zhuyin: "ㄙ", pinyin: "sī" },
  "殺": { zhuyin: "ㄕㄚ", pinyin: "shā" },
  "閩": { zhuyin: "ㄇㄧㄣˇ", pinyin: "mǐn" },
  "拓": { zhuyin: "ㄊㄨㄛˋ", pinyin: "tuò" },
  "合": { zhuyin: "ㄏㄜˊ", pinyin: "hé" },
  "夫": { zhuyin: "ㄈㄨ", pinyin: "fū" },
  "蛇": { zhuyin: "ㄕㄜˊ", pinyin: "shé" },
  "吧": { zhuyin: "˙ㄅㄚ", pinyin: "ba" },
  "啊": { zhuyin: "˙ㄚ", pinyin: "a" },
  "嗎": { zhuyin: "˙ㄇㄚ", pinyin: "ma" },
  "兒": { zhuyin: "ㄦˊ", pinyin: "ér" },
  "甚": { zhuyin: "ㄕㄣˋ", pinyin: "shèn" },
  "氏": { zhuyin: "ㄕˋ", pinyin: "shì" },
  "幅": { zhuyin: "ㄈㄨˊ", pinyin: "fú" },
  "勒": { zhuyin: "ㄌㄜˋ", pinyin: "lè" },
  "放": { zhuyin: "ㄈㄤˋ", pinyin: "fàng" },
  "青": { zhuyin: "ㄑㄧㄥ", pinyin: "qīng" },
  "綠": { zhuyin: "ㄌㄩˋ", pinyin: "lǜ" },
  "獲": { zhuyin: "ㄏㄨㄛˋ", pinyin: "huò" },
  "鮭": { zhuyin: "ㄍㄨㄟ", pinyin: "guī" },
  "反": { zhuyin: "ㄈㄢˇ", pinyin: "fǎn" },
  "虎": { zhuyin: "ㄏㄨˇ", pinyin: "hǔ" },
  "非": { zhuyin: "ㄈㄟ", pinyin: "fēi" },
  "湯": { zhuyin: "ㄊㄤ", pinyin: "tāng" },
  "番": { zhuyin: "ㄈㄢ", pinyin: "fān" },
  "雅": { zhuyin: "ㄧㄚˇ", pinyin: "yǎ" },
  "艘": { zhuyin: "ㄙㄠ", pinyin: "sāo" },
  "親": { zhuyin: "ㄑㄧㄣ", pinyin: "qīn" },
  "錢": { zhuyin: "ㄑㄧㄢˊ", pinyin: "qián" },
  "屬": { zhuyin: "ㄕㄨˇ", pinyin: "shǔ" },
  "王": { zhuyin: "ㄨㄤˊ", pinyin: "wáng" },
  "份": { zhuyin: "ㄈㄣˋ", pinyin: "fèn" },
  "肉": { zhuyin: "ㄖㄡˋ", pinyin: "ròu" },
  "員": { zhuyin: "ㄩㄢˊ", pinyin: "yuán" },
  "旁": { zhuyin: "ㄆㄤˊ", pinyin: "páng" },
  "請": { zhuyin: "ㄑㄧㄥˇ", pinyin: "qǐng" },
  "讀": { zhuyin: "ㄉㄨˊ", pinyin: "dú" },
  "甲": { zhuyin: "ㄐㄧㄚˇ", pinyin: "jiǎ" },
  "車": { zhuyin: "ㄔㄜ", pinyin: "chē" },
  "知": { zhuyin: "ㄓ", pinyin: "zhī" },
  "屏": { zhuyin: "ㄆㄧㄥˊ", pinyin: "píng" },
  "背": { zhuyin: "ㄅㄟˋ", pinyin: "bèi" },
  "頁": { zhuyin: "ㄧㄝˋ", pinyin: "yè" },
  "排": { zhuyin: "ㄆㄞˊ", pinyin: "pái" },
  "荷": { zhuyin: "ㄏㄜˊ", pinyin: "hé" },
  "喔": { zhuyin: "˙ㄛ", pinyin: "o" },
  "復": { zhuyin: "ㄈㄨˋ", pinyin: "fù" },
  "費": { zhuyin: "ㄈㄟˋ", pinyin: "fèi" },
  "腳": { zhuyin: "ㄐㄧㄠˇ", pinyin: "jiǎo" },
  "均": { zhuyin: "ㄐㄩㄣ", pinyin: "jūn" },
  "尾": { zhuyin: "ㄨㄟˇ", pinyin: "wěi" },
  "弟": { zhuyin: "ㄉㄧˋ", pinyin: "dì" },
  "待": { zhuyin: "ㄉㄞˋ", pinyin: "dài" },
  "益": { zhuyin: "ㄧˋ", pinyin: "yì" },
  "提": { zhuyin: "ㄊㄧˊ", pinyin: "tí" },
  "觀": { zhuyin: "ㄍㄨㄢ", pinyin: "guān" },
  "扛": { zhuyin: "ㄎㄤˊ", pinyin: "káng" },
  "色": { zhuyin: "ㄙㄜˋ", pinyin: "sè" },
  "衣": { zhuyin: "ㄧ", pinyin: "yī" },
  "妻": { zhuyin: "ㄑㄧ", pinyin: "qī" },
  "岡": { zhuyin: "ㄍㄤ", pinyin: "gāng" },
  "鳥": { zhuyin: "ㄋㄧㄠˇ", pinyin: "niǎo" },
  "黑": { zhuyin: "ㄏㄟ", pinyin: "hēi" },
  "標": { zhuyin: "ㄅㄧㄠ", pinyin: "biāo" },
  "歸": { zhuyin: "ㄍㄨㄟ", pinyin: "guī" },
  "守": { zhuyin: "ㄕㄡˇ", pinyin: "shǒu" },
  "冠": { zhuyin: "ㄍㄨㄢ", pinyin: "guān" },
  "創": { zhuyin: "ㄔㄨㄤˋ", pinyin: "chuàng" },
  "橫": { zhuyin: "ㄏㄥˊ", pinyin: "héng" },
  "濕": { zhuyin: "ㄕ", pinyin: "shī" },
  "谷": { zhuyin: "ㄍㄨˇ", pinyin: "gǔ" },
  "信": { zhuyin: "ㄒㄧㄣˋ", pinyin: "xìn" },
  "食": { zhuyin: "ㄕˊ", pinyin: "shí" },
  "追": { zhuyin: "ㄓㄨㄟ", pinyin: "zhuī" },
  "槍": { zhuyin: "ㄑㄧㄤ", pinyin: "qiāng" },
  "聞": { zhuyin: "ㄨㄣˊ", pinyin: "wén" },
  "劇": { zhuyin: "ㄐㄩˋ", pinyin: "jù" },
  "卡": { zhuyin: "ㄎㄚˇ", pinyin: "kǎ" },
  "囝": { zhuyin: "ㄐㄧㄢˇ", pinyin: "jiǎn" },
  "沈": { zhuyin: "ㄕㄣˇ", pinyin: "shěn" },
  "奇": { zhuyin: "ㄑㄧˊ", pinyin: "qí" },
  "底": { zhuyin: "ㄉㄧˇ", pinyin: "dǐ" },
  "哈": { zhuyin: "ㄏㄚ", pinyin: "hā" },
  "挖": { zhuyin: "ㄨㄚ", pinyin: "wā" },
  "洗": { zhuyin: "ㄒㄧˇ", pinyin: "xǐ" },
  "炮": { zhuyin: "ㄆㄠˋ", pinyin: "pào" },
  "振": { zhuyin: "ㄓㄣˋ", pinyin: "zhèn" },
  "圈": { zhuyin: "ㄑㄩㄢ", pinyin: "quān" },
  "暖": { zhuyin: "ㄋㄨㄢˇ", pinyin: "nuǎn" },
  "漸": { zhuyin: "ㄐㄧㄢˋ", pinyin: "jiàn" },
  "歐": { zhuyin: "ㄡ", pinyin: "ōu" },
  "誰": { zhuyin: "ㄕㄟˊ", pinyin: "shéi" },
  "遮": { zhuyin: "ㄓㄜ", pinyin: "zhē" },
  "騎": { zhuyin: "ㄑㄧˊ", pinyin: "qí" },
  "宅": { zhuyin: "ㄓㄞˊ", pinyin: "zhái" },
  "血": { zhuyin: "ㄒㄧㄝˇ", pinyin: "xiě" },
  "含": { zhuyin: "ㄏㄢˊ", pinyin: "hán" },
  "吹": { zhuyin: "ㄔㄨㄟ", pinyin: "chuī" },
  "些": { zhuyin: "ㄒㄧㄝ", pinyin: "xiē" },
  "始": { zhuyin: "ㄕˇ", pinyin: "shǐ" },
  "咬": { zhuyin: "ㄧㄠˇ", pinyin: "yǎo" },
  "任": { zhuyin: "ㄖㄣˋ", pinyin: "rèn" },
  "挑": { zhuyin: "ㄊㄧㄠ", pinyin: "tiāo" },
  "娶": { zhuyin: "ㄑㄩˇ", pinyin: "qǔ" },
  "奧": { zhuyin: "ㄠˋ", pinyin: "ào" },
  "頗": { zhuyin: "ㄆㄛˇ", pinyin: "pǒ" },
  "樣": { zhuyin: "ㄧㄤˋ", pinyin: "yàng" },
  "顆": { zhuyin: "ㄎㄜ", pinyin: "kē" },
  "占": { zhuyin: "ㄓㄢˋ", pinyin: "zhàn" },
  "足": { zhuyin: "ㄗㄨˊ", pinyin: "zú" },
  "京": { zhuyin: "ㄐㄧㄥ", pinyin: "jīng" },
  "拍": { zhuyin: "ㄆㄞ", pinyin: "pāi" },
  "泥": { zhuyin: "ㄋㄧˊ", pinyin: "ní" },
  "肯": { zhuyin: "ㄎㄣˇ", pinyin: "kěn" },
  "俠": { zhuyin: "ㄒㄧㄚˊ", pinyin: "xiá" },
  "扁": { zhuyin: "ㄅㄧㄢˇ", pinyin: "biǎn" },
  "禁": { zhuyin: "ㄐㄧㄣˋ", pinyin: "jìn" },
  "宿": { zhuyin: "ㄙㄨˋ", pinyin: "sù" },
  "造": { zhuyin: "ㄗㄠˋ", pinyin: "zào" },
  "結": { zhuyin: "ㄐㄧㄝˊ", pinyin: "jié" },
  "診": { zhuyin: "ㄓㄣˇ", pinyin: "zhěn" },
  "縱": { zhuyin: "ㄗㄨㄥˋ", pinyin: "zòng" },
  "臨": { zhuyin: "ㄌㄧㄣˊ", pinyin: "lín" },
  "麗": { zhuyin: "ㄌㄧˋ", pinyin: "lì" },
  "繫": { zhuyin: "ㄒㄧˋ", pinyin: "xì" },
  "尺": { zhuyin: "ㄔˇ", pinyin: "chǐ" },
  "冊": { zhuyin: "ㄘㄜˋ", pinyin: "cè" },
  "羊": { zhuyin: "ㄧㄤˊ", pinyin: "yáng" },
  "告": { zhuyin: "ㄍㄠˋ", pinyin: "gào" },
  "抓": { zhuyin: "ㄓㄨㄚ", pinyin: "zhuā" },
  "角": { zhuyin: "ㄐㄧㄠˇ", pinyin: "jiǎo" },
  "供": { zhuyin: "ㄍㄨㄥ", pinyin: "gōng" },
  "刻": { zhuyin: "ㄎㄜˋ", pinyin: "kè" },
  "迎": { zhuyin: "ㄧㄥˊ", pinyin: "yíng" },
  "冒": { zhuyin: "ㄇㄠˋ", pinyin: "mào" },
  "洞": { zhuyin: "ㄉㄨㄥˋ", pinyin: "dòng" },
  "紀": { zhuyin: "ㄐㄧˋ", pinyin: "jì" },
  "降": { zhuyin: "ㄐㄧㄤˋ", pinyin: "jiàng" },
  "埋": { zhuyin: "ㄇㄞˊ", pinyin: "mái" },
  "射": { zhuyin: "ㄕㄜˋ", pinyin: "shè" },
  "索": { zhuyin: "ㄙㄨㄛˇ", pinyin: "suǒ" },
  "啦": { zhuyin: "˙ㄌㄚ", pinyin: "la" },
  "淺": { zhuyin: "ㄑㄧㄢˇ", pinyin: "qiǎn" },
  "票": { zhuyin: "ㄆㄧㄠˋ", pinyin: "piào" },
  "喬": { zhuyin: "ㄑㄧㄠˊ", pinyin: "qiáo" },
  "堡": { zhuyin: "ㄅㄠˇ", pinyin: "bǎo" },
  "惡": { zhuyin: "ㄜˋ", pinyin: "è" },
  "遂": { zhuyin: "ㄙㄨㄟˋ", pinyin: "suì" },
  "遍": { zhuyin: "ㄅㄧㄢˋ", pinyin: "biàn" },
  "齊": { zhuyin: "ㄑㄧˊ", pinyin: "qí" },
  "導": { zhuyin: "ㄉㄠˇ", pinyin: "dǎo" },
  "澎": { zhuyin: "ㄆㄥˊ", pinyin: "péng" },
  "論": { zhuyin: "ㄌㄨㄣˋ", pinyin: "lùn" },
  "養": { zhuyin: "ㄧㄤˇ", pinyin: "yǎng" },
  "縣": { zhuyin: "ㄒㄧㄢˋ", pinyin: "xiàn" },
  "耀": { zhuyin: "ㄧㄠˋ", pinyin: "yào" },
  "佃": { zhuyin: "ㄉㄧㄢˋ", pinyin: "diàn" },
  "免": { zhuyin: "ㄇㄧㄢˇ", pinyin: "miǎn" },
  "忘": { zhuyin: "ㄨㄤˋ", pinyin: "wàng" },
  "芎": { zhuyin: "ㄑㄩㄥ", pinyin: "qiōng" },
  "招": { zhuyin: "ㄓㄠ", pinyin: "zhāo" },
  "怨": { zhuyin: "ㄩㄢˋ", pinyin: "yuàn" },
  "耶": { zhuyin: "ㄧㄝ", pinyin: "yē" },
  "害": { zhuyin: "ㄏㄞˋ", pinyin: "hài" },
  "浪": { zhuyin: "ㄌㄤˋ", pinyin: "làng" },
  "純": { zhuyin: "ㄔㄨㄣˊ", pinyin: "chún" },
  "側": { zhuyin: "ㄘㄜˋ", pinyin: "cè" },
  "廈": { zhuyin: "ㄒㄧㄚˋ", pinyin: "xià" },
  "署": { zhuyin: "ㄕㄨˇ", pinyin: "shǔ" },
  "頌": { zhuyin: "ㄙㄨㄥˋ", pinyin: "sòng" },
  "摘": { zhuyin: "ㄓㄞ", pinyin: "zhāi" },
  "摸": { zhuyin: "ㄇㄛ", pinyin: "mō" },
  "徵": { zhuyin: "ㄓㄥ", pinyin: "zhēng" },
  "賜": { zhuyin: "ㄘˋ", pinyin: "cì" },
  "廨": { zhuyin: "ㄒㄧㄝˋ", pinyin: "xiè" },
  "蕃": { zhuyin: "ㄈㄢ", pinyin: "fān" },
  "謎": { zhuyin: "ㄇㄧˊ", pinyin: "mí" },
  "壞": { zhuyin: "ㄏㄨㄞˋ", pinyin: "huài" },
  "凹": { zhuyin: "ㄠ", pinyin: "āo" },
  "召": { zhuyin: "ㄓㄠˋ", pinyin: "zhào" },
  "佰": { zhuyin: "ㄅㄞˇ", pinyin: "bǎi" },
  "宛": { zhuyin: "ㄨㄢˇ", pinyin: "wǎn" },
  "抵": { zhuyin: "ㄉㄧˇ", pinyin: "dǐ" },
  "怎": { zhuyin: "ㄗㄣˇ", pinyin: "zěn" },
  "洩": { zhuyin: "ㄒㄧㄝˋ", pinyin: "xiè" },
  "研": { zhuyin: "ㄧㄢˊ", pinyin: "yán" },
  "孫": { zhuyin: "ㄙㄨㄣ", pinyin: "sūn" },
  "秘": { zhuyin: "ㄇㄧˋ", pinyin: "mì" },
  "脫": { zhuyin: "ㄊㄨㄛ", pinyin: "tuō" },
  "雪": { zhuyin: "ㄒㄩㄝˇ", pinyin: "xuě" },
  "頃": { zhuyin: "ㄑㄧㄥˇ", pinyin: "qǐng" },
  "搶": { zhuyin: "ㄑㄧㄤˇ", pinyin: "qiǎng" },
  "劃": { zhuyin: "ㄏㄨㄚˋ", pinyin: "huà" },
  "監": { zhuyin: "ㄐㄧㄢ", pinyin: "jiān" },
  "遜": { zhuyin: "ㄒㄩㄣˋ", pinyin: "xùn" },
  "需": { zhuyin: "ㄒㄩ", pinyin: "xū" },
  "撒": { zhuyin: "ㄙㄚ", pinyin: "sā" },
  "遺": { zhuyin: "ㄧˊ", pinyin: "yí" },
  "嚇": { zhuyin: "ㄒㄧㄚˋ", pinyin: "xià" },
  "賺": { zhuyin: "ㄓㄨㄢˋ", pinyin: "zhuàn" },
  "趨": { zhuyin: "ㄑㄩ", pinyin: "qū" },
  "蹲": { zhuyin: "ㄉㄨㄣ", pinyin: "dūn" },
  "霸": { zhuyin: "ㄅㄚˋ", pinyin: "bà" },
  "鹽": { zhuyin: "ㄧㄢˊ", pinyin: "yán" },
  "勾": { zhuyin: "ㄍㄡ", pinyin: "gōu" },
  "午": { zhuyin: "ㄨˇ", pinyin: "wǔ" },
  "屯": { zhuyin: "ㄊㄨㄣˊ", pinyin: "tún" },
  "爿": { zhuyin: "ㄆㄢˊ", pinyin: "pán" },
  "乎": { zhuyin: "ㄏㄨ", pinyin: "hū" },
  "扒": { zhuyin: "ㄆㄚˊ", pinyin: "pá" },
  "扔": { zhuyin: "ㄖㄥ", pinyin: "rēng" },
  "穴": { zhuyin: "ㄒㄩㄝˊ", pinyin: "xué" },
  "帆": { zhuyin: "ㄈㄢˊ", pinyin: "fán" },
  "并": { zhuyin: "ㄅㄧㄥˋ", pinyin: "bìng" },
  "艾": { zhuyin: "ㄞˋ", pinyin: "ài" },
  "伯": { zhuyin: "ㄅㄛˊ", pinyin: "bó" },
  "刨": { zhuyin: "ㄆㄠˊ", pinyin: "páo" },
  "巫": { zhuyin: "ㄨ", pinyin: "wū" },
  "牠": { zhuyin: "ㄊㄚ", pinyin: "tā" },
  "卒": { zhuyin: "ㄗㄨˊ", pinyin: "zú" },
  "奔": { zhuyin: "ㄅㄣ", pinyin: "bēn" },
  "帖": { zhuyin: "ㄊㄧㄝˇ", pinyin: "tiě" },
  "怯": { zhuyin: "ㄑㄩㄝˋ", pinyin: "què" },
  "披": { zhuyin: "ㄆㄧ", pinyin: "pī" },
  "押": { zhuyin: "ㄧㄚ", pinyin: "yā" },
  "拂": { zhuyin: "ㄈㄨˊ", pinyin: "fú" },
  "沸": { zhuyin: "ㄈㄟˋ", pinyin: "fèi" },
  "泛": { zhuyin: "ㄈㄢˋ", pinyin: "fàn" },
  "玩": { zhuyin: "ㄨㄢˊ", pinyin: "wán" },
  "勁": { zhuyin: "ㄐㄧㄥˋ", pinyin: "jìng" },
  "哆": { zhuyin: "ㄉㄨㄛ", pinyin: "duō" },
  "哇": { zhuyin: "ㄨㄚ", pinyin: "wā" },
  "契": { zhuyin: "ㄑㄧˋ", pinyin: "qì" },
  "峒": { zhuyin: "ㄊㄨㄥˊ", pinyin: "tóng" },
  "括": { zhuyin: "ㄍㄨㄚ", pinyin: "guā" },
  "砌": { zhuyin: "ㄑㄧˋ", pinyin: "qì" },
  "苔": { zhuyin: "ㄊㄞˊ", pinyin: "tái" },
  "苛": { zhuyin: "ㄎㄜ", pinyin: "kē" },
  "赳": { zhuyin: "ㄐㄧㄡ", pinyin: "jiū" },
  "郇": { zhuyin: "ㄏㄨㄢˊ", pinyin: "huán" },
  "倆": { zhuyin: "ㄌㄧㄚˇ", pinyin: "liǎ" },
  "剝": { zhuyin: "ㄅㄛ", pinyin: "bō" },
  "娜": { zhuyin: "ㄋㄚˋ", pinyin: "nà" },
  "晃": { zhuyin: "ㄏㄨㄤˋ", pinyin: "huàng" },
  "殷": { zhuyin: "ㄧㄣ", pinyin: "yīn" },
  "烙": { zhuyin: "ㄌㄠˋ", pinyin: "lào" },
  "脈": { zhuyin: "ㄇㄞˋ", pinyin: "mài" },
  "脊": { zhuyin: "ㄐㄧˇ", pinyin: "jǐ" },
  "茲": { zhuyin: "ㄗ", pinyin: "zī" },
  "衰": { zhuyin: "ㄕㄨㄞ", pinyin: "shuāi" },
  "郝": { zhuyin: "ㄏㄠˇ", pinyin: "hǎo" },
  "釘": { zhuyin: "ㄉㄧㄥ", pinyin: "dīng" },
  "副": { zhuyin: "ㄈㄨˋ", pinyin: "fù" },
  "匙": { zhuyin: "ㄔˊ", pinyin: "chí" },
  "唯": { zhuyin: "ㄨㄟˊ", pinyin: "wéi" },
  "埤": { zhuyin: "ㄆㄧˊ", pinyin: "pí" },
  "堇": { zhuyin: "ㄐㄧㄣˇ", pinyin: "jǐn" },
  "婁": { zhuyin: "ㄌㄡˊ", pinyin: "lóu" },
  "御": { zhuyin: "ㄩˋ", pinyin: "yù" },
  "掃": { zhuyin: "ㄙㄠˇ", pinyin: "sǎo" },
  "掙": { zhuyin: "ㄓㄥˋ", pinyin: "zhèng" },
  "斜": { zhuyin: "ㄒㄧㄝˊ", pinyin: "xié" },
  "液": { zhuyin: "ㄧㄝˋ", pinyin: "yè" },
  "盛": { zhuyin: "ㄕㄥˋ", pinyin: "shèng" },
  "責": { zhuyin: "ㄗㄜˊ", pinyin: "zé" },
  "陰": { zhuyin: "ㄧㄣ", pinyin: "yīn" },
  "麥": { zhuyin: "ㄇㄞˋ", pinyin: "mài" },
  "勞": { zhuyin: "ㄌㄠˊ", pinyin: "láo" },
  "悶": { zhuyin: "ㄇㄣˋ", pinyin: "mèn" },
  "揭": { zhuyin: "ㄐㄧㄝ", pinyin: "jiē" },
  "斐": { zhuyin: "ㄈㄟˇ", pinyin: "fěi" },
  "棋": { zhuyin: "ㄑㄧˊ", pinyin: "qí" },
  "椅": { zhuyin: "ㄧˇ", pinyin: "yǐ" },
  "椎": { zhuyin: "ㄓㄨㄟ", pinyin: "zhuī" },
  "渾": { zhuyin: "ㄏㄨㄣˊ", pinyin: "hún" },
  "疏": { zhuyin: "ㄕㄨ", pinyin: "shū" },
  "稍": { zhuyin: "ㄕㄠ", pinyin: "shāo" },
  "菸": { zhuyin: "ㄧㄢ", pinyin: "yān" },
  "閒": { zhuyin: "ㄒㄧㄢˊ", pinyin: "xián" },
  "嗟": { zhuyin: "ㄐㄧㄝ", pinyin: "jiē" },
  "價": { zhuyin: "ㄐㄧㄚˋ", pinyin: "jià" },
  "弄": { zhuyin: "ㄋㄨㄥˋ", pinyin: "nòng" },
  "泡": { zhuyin: "ㄆㄠˋ", pinyin: "pào" },
  "軋": { zhuyin: "ㄧㄚˋ", pinyin: "yà" },
  "幹": { zhuyin: "ㄍㄢˋ", pinyin: "gàn" },
  "慌": { zhuyin: "ㄏㄨㄤ", pinyin: "huāng" },
  "硼": { zhuyin: "ㄆㄥˊ", pinyin: "péng" },
  "葛": { zhuyin: "ㄍㄜˇ", pinyin: "gě" },
  "衙": { zhuyin: "ㄧㄚˊ", pinyin: "yá" },
  "賈": { zhuyin: "ㄍㄨˇ", pinyin: "gǔ" },
  "零": { zhuyin: "ㄌㄧㄥˊ", pinyin: "líng" },
  "馱": { zhuyin: "ㄊㄨㄛˊ", pinyin: "tuó" },
  "嶄": { zhuyin: "ㄓㄢˇ", pinyin: "zhǎn" },
  "榜": { zhuyin: "ㄅㄤˇ", pinyin: "bǎng" },
  "漫": { zhuyin: "ㄇㄢˋ", pinyin: "màn" },
  "鄙": { zhuyin: "ㄅㄧˇ", pinyin: "bǐ" },
  "墮": { zhuyin: "ㄉㄨㄛˋ", pinyin: "duò" },
  "摩": { zhuyin: "ㄇㄛˊ", pinyin: "mó" },
  "撕": { zhuyin: "ㄙ", pinyin: "sī" },
  "暫": { zhuyin: "ㄓㄢˋ", pinyin: "zhàn" },
  "暴": { zhuyin: "ㄅㄠˋ", pinyin: "bào" },
  "磅": { zhuyin: "ㄆㄤ", pinyin: "pāng" },
  "緣": { zhuyin: "ㄩㄢˊ", pinyin: "yuán" },
  "蝦": { zhuyin: "ㄒㄧㄚ", pinyin: "xiā" },
  "質": { zhuyin: "ㄓˊ", pinyin: "zhí" },
  "魄": { zhuyin: "ㄆㄛˋ", pinyin: "pò" },
  "擁": { zhuyin: "ㄩㄥˇ", pinyin: "yǒng" },
  "燕": { zhuyin: "ㄧㄢˋ", pinyin: "yàn" },
  "鋼": { zhuyin: "ㄍㄤ", pinyin: "gāng" },
  "頸": { zhuyin: "ㄐㄧㄥˇ", pinyin: "jǐng" },
  "擰": { zhuyin: "ㄋㄧㄥˊ", pinyin: "níng" },
  "濟": { zhuyin: "ㄐㄧˋ", pinyin: "jì" },
  "癌": { zhuyin: "ㄞˊ", pinyin: "ái" },
  "瞭": { zhuyin: "ㄌㄧㄠˇ", pinyin: "liǎo" },
  "禧": { zhuyin: "ㄒㄧ", pinyin: "xī" },
  "蟄": { zhuyin: "ㄓˊ", pinyin: "zhí" },
  "叢": { zhuyin: "ㄘㄨㄥˊ", pinyin: "cóng" },
  "瀕": { zhuyin: "ㄅㄧㄣ", pinyin: "bīn" },
  "簿": { zhuyin: "ㄅㄨˋ", pinyin: "bù" },
  "蟹": { zhuyin: "ㄒㄧㄝˋ", pinyin: "xiè" },
  "鶴": { zhuyin: "ㄏㄜˋ", pinyin: "hè" },
  "籠": { zhuyin: "ㄌㄨㄥˊ", pinyin: "lóng" },
  "臠": { zhuyin: "ㄌㄨㄢˊ", pinyin: "luán" },
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

function extractStoryText(path) {
  let markdown = fs.readFileSync(path, "utf8");
  markdown = markdown.replace(/^[\s\S]*?\n---\s*\n\n## /, "## ");

  const lines = markdown.split(/\r?\n/);
  const cleaned = [];
  let skipStoryBodyIntro = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      cleaned.push(line);
      continue;
    }
    if (
      trimmed === "### 圖片" ||
      trimmed === "### 故事正文" ||
      trimmed.startsWith("**作者**：") ||
      trimmed.startsWith("**主題**：") ||
      trimmed.startsWith("![")
    ) {
      skipStoryBodyIntro = trimmed === "### 故事正文";
      continue;
    }
    if (skipStoryBodyIntro) {
      if (trimmed.startsWith("文：") || trimmed.startsWith("作者：")) continue;
      skipStoryBodyIntro = false;
    }
    cleaned.push(line);
  }

  return cleaned.join("\n").replace(/[#*`_\[\]()!]/g, "");
}

function phraseAround(characters, index, before = 4, after = 4) {
  const start = Math.max(0, index - before);
  const end = Math.min(characters.length, index + after + 1);
  return characters.slice(start, end).join("");
}

function hasAnyPhrase(characters, index, phrases) {
  const context = phraseAround(characters, index, 6, 6);
  return phrases.some(phrase => context.includes(phrase));
}

function contextualCharacterReading(characters, index) {
  const character = characters[index];

  if (character === "長") {
    if (hasAnyPhrase(characters, index, ["又長", "長榮", "長春", "長才", "陳長順", "長房", "長髮", "長長", "長矛", "長聲", "長片", "長辮", "長頸", "長存", "長治", "長興", "長蛇", "體圓長", "長鬚鯨", "長82", "堤長", "各長", "長約", "長達", "長久", "長期", "長度", "漫長", "悠長", "狹長", "修長", "長途", "長年", "綿長"])) {
      return { zhuyin: "ㄔㄤˊ", pinyin: "cháng" };
    }
    if (hasAnyPhrase(characters, index, ["長得", "長高", "長進", "市長", "縣長", "長在", "長相", "長大", "成長", "生長", "長成", "長老", "族長", "局長", "校長", "年長", "兄長", "長官", "所長", "院長", "部長", "長子", "長女", "長輩"])) {
      return { zhuyin: "ㄓㄤˇ", pinyin: "zhǎng" };
    }
  }

  if (character === "得") {
    if (hasAnyPhrase(characters, index, ["考得上", "哭得", "活得", "了解得", "分得", "表達得", "寫得", "賣得", "腐蝕得", "長得", "拿得動", "搬得", "高興得", "興奮得", "描寫得", "詮釋得", "畫得", "忙得", "懂得", "世得早", "刮得", "下得", "掃得", "撈捕得", "形容得", "叫得", "簽得吃", "覺得", "顯得", "變得", "使得", "看得", "聽得", "走得", "跑得", "吃得", "住得", "免得"])) {
      return { zhuyin: "˙ㄉㄜ", pinyin: "de" };
    }
    if (hasAnyPhrase(characters, index, ["保得", "得合", "得主", "得不到", "得力", "可得", "會得", "以得", "得粗金", "徵得", "募得", "奪得", "拔得", "求得", "李仙得", "掙得", "測得", "得以", "得到", "得名", "得知", "獲得", "取得", "贏得", "值得", "難得", "所得", "得來"])) {
      return { zhuyin: "ㄉㄜˊ", pinyin: "dé" };
    }
    if (hasAnyPhrase(characters, index, ["溫飽得", "恐得", "得回", "得先", "得要", "得靠", "得等", "得花", "得由", "得把"])) {
      return { zhuyin: "ㄉㄟˇ", pinyin: "děi" };
    }
  }

  if (character === "處") {
    if (hasAnyPhrase(characters, index, ["處以", "處極刑", "被處", "身處", "位處", "地處", "處理", "處置", "處罰", "相處", "處在", "處於", "處境"])) {
      return { zhuyin: "ㄔㄨˇ", pinyin: "chǔ" };
    }
    if (hasAnyPhrase(characters, index, ["入口處", "14處", "近頂處", "無處", "細微處", "落腳處", "交界處", "館處", "等處", "36處", "存放處", "這處", "掃處", "入門處", "管理處", "深處", "各處", "到處", "之處", "此處", "住處", "去處", "所處", "遠處", "近處", "處處"])) {
      return { zhuyin: "ㄔㄨˋ", pinyin: "chù" };
    }
  }

  if (character === "幾") {
    if (hasAnyPhrase(characters, index, ["幾乎"])) {
      return { zhuyin: "ㄐㄧ", pinyin: "jī" };
    }
    return { zhuyin: "ㄐㄧˇ", pinyin: "jǐ" };
  }

  if (character === "分") {
    if (hasAnyPhrase(characters, index, ["天分", "萬分", "輩分", "身分", "名分", "分量", "水分", "養分", "成分"])) {
      return { zhuyin: "ㄈㄣˋ", pinyin: "fèn" };
    }
    if (hasAnyPhrase(characters, index, ["二分", "分教場", "分、支線", "分三路", "五分", "時分", "四分", "要分", "分作", "分福佬", "分得", "分家", "分東", "30分", "兵分", "分線", "幾分", "追分", "高分", "百分", "六分", "三分", "點47分", "點30分", "9點30分", "五分仔車", "分仔車", "分開", "分成", "分為", "分別", "分布", "分配", "分攤", "分析", "分類", "分離", "分兩", "分支", "分鐘", "部分"])) {
      return { zhuyin: "ㄈㄣ", pinyin: "fēn" };
    }
  }

  if (character === "間") {
    if (hasAnyPhrase(characters, index, ["間接", "間隔", "間斷"])) {
      return { zhuyin: "ㄐㄧㄢˋ", pinyin: "jiàn" };
    }
    if (hasAnyPhrase(characters, index, ["倏地間", "粵間", "突然間", "宇宙間", "山群間", "族群間", "林木間", "集團間", "4月間", "山間", "流行間", "學院間", "藝旦間", "人士間", "行距間", "9月間", "縫隙間", "巷弄間", "這間", "一線間", "開間", "山嶺間", "彼此間", "媽祖間", "田間", "起伏間", "站間", "部落間", "林間", "國際間", "廿八間", "休息間", "聲間之", "之間", "中間", "房間", "期間", "年間", "時間", "空間", "民間", "人間", "鄉間", "其間", "世間"])) {
      return { zhuyin: "ㄐㄧㄢ", pinyin: "jiān" };
    }
  }

  if (character === "興") {
    if (hasAnyPhrase(characters, index, ["高興", "興趣", "興致", "即興", "助興", "掃興"])) {
      return { zhuyin: "ㄒㄧㄥˋ", pinyin: "xìng" };
    }
    if (hasAnyPhrase(characters, index, ["興工", "吳湯興", "湯興", "王文興", "進興閣", "興南", "興行", "廣興", "南興", "富興", "再興", "東興", "布興", "肇興", "合興", "興亞", "永興村", "長興村", "興仁", "興業", "興建", "興修", "興起", "興築", "復興", "新興", "興盛", "興辦", "興學"])) {
      return { zhuyin: "ㄒㄧㄥ", pinyin: "xīng" };
    }
  }

  if (character === "傳") {
    if (hasAnyPhrase(characters, index, ["傳記", "自傳", "列傳", "外傳"])) {
      return { zhuyin: "ㄓㄨㄢˋ", pinyin: "zhuàn" };
    }
    if (hasAnyPhrase(characters, index, ["四傑傳", "和平傳", "張騫傳", "終軍傳"])) {
      return { zhuyin: "ㄓㄨㄢˋ", pinyin: "zhuàn" };
    }
    if (hasAnyPhrase(characters, index, ["李傳燦", "傳開", "教傳到", "傳遍", "楊傳廣", "李志傳", "一代傳", "傳述", "傳授", "上傳", "傳為", "傳來", "傳承", "流傳", "傳說", "傳統", "相傳", "傳入", "傳播", "傳遞", "傳唱", "傳達", "傳給", "留傳"])) {
      return { zhuyin: "ㄔㄨㄢˊ", pinyin: "chuán" };
    }
  }

  if (character === "倒") {
    if (hasAnyPhrase(characters, index, ["倒入", "反倒", "倒三角", "倒鐘型"])) {
      return { zhuyin: "ㄉㄠˋ", pinyin: "dào" };
    }
    if (hasAnyPhrase(characters, index, ["病倒", "橫倒", "半倒", "倒下"])) {
      return { zhuyin: "ㄉㄠˇ", pinyin: "dǎo" };
    }
  }

  if (character === "難") {
    if (hasAnyPhrase(characters, index, ["蛤仔難", "船難", "漂難", "災難", "苦難", "罹難", "遇難", "逃難"])) {
      return { zhuyin: "ㄋㄢˋ", pinyin: "nàn" };
    }
    if (hasAnyPhrase(characters, index, ["難友", "難醫", "難掩", "難逃", "難敵", "難伸", "難捨", "最難", "本來就難", "易學難精", "難倖免", "更難", "較難", "難久", "難能", "難捱", "難以", "困難", "艱難", "很難", "難得", "難免", "難道", "難題", "難關"])) {
      return { zhuyin: "ㄋㄢˊ", pinyin: "nán" };
    }
  }

  if (character === "行") {
    if (hasAnyPhrase(characters, index, ["興行協會", "行船人", "杉木行", "船頭行", "銀行", "行業", "行列", "各行", "洋行", "商行"])) {
      return { zhuyin: "ㄏㄤˊ", pinyin: "háng" };
    }
    if (hasAnyPhrase(characters, index, ["二層行溪", "行草", "洋兵行", "醉飽而行", "役夫行", "無人行", "詩行", "送行", "風行", "南行", "東行", "苦行", "轉行", "行前", "當行", "前行", "千里之行", "西行", "才行", "進行", "行走", "行為", "行醫", "步行", "舉行", "旅行", "遊行", "行動", "行腳", "自行", "執行", "施行", "扶壁而行"])) {
      return { zhuyin: "ㄒㄧㄥˊ", pinyin: "xíng" };
    }
  }

  if (character === "切") {
    if (hasAnyPhrase(characters, index, ["切過", "下切", "切成", "切開", "一切"])) {
      return { zhuyin: "ㄑㄧㄝ", pinyin: "qiē" };
    }
    if (hasAnyPhrase(characters, index, ["迫切", "密切", "貼切", "親切"])) {
      return { zhuyin: "ㄑㄧㄝˋ", pinyin: "qiè" };
    }
  }

  if (character === "樂") {
    if (hasAnyPhrase(characters, index, ["樂段", "歌樂", "古樂", "製樂", "樂風", "樂句", "民歌樂手", "習樂", "愛樂", "管絃樂", "音樂", "樂曲", "樂章", "國樂", "民樂"])) {
      return { zhuyin: "ㄩㄝˋ", pinyin: "yuè" };
    }
    if (hasAnyPhrase(characters, index, ["歐樂思", "樂花園", "樂山", "樂生", "樂見", "快樂", "歡樂", "樂於", "樂觀", "其樂"])) {
      return { zhuyin: "ㄌㄜˋ", pinyin: "lè" };
    }
  }

  if (character === "曲") {
    if (hasAnyPhrase(characters, index, ["表演曲目", "金曲獎", "小提琴曲", "流離曲", "鋼琴曲", "作曲家", "該曲", "追想曲", "日曲", "全曲", "許常惠", "迎靈曲", "曲館", "曲中", "此曲", "牽曲", "歌曲", "樂曲", "曲調", "曲子", "戲曲", "小曲"])) {
      return { zhuyin: "ㄑㄩˇ", pinyin: "qǔ" };
    }
    if (hasAnyPhrase(characters, index, ["九曲堂", "曲流", "曲折", "彎曲", "扭曲", "清澈曲流"])) {
      return { zhuyin: "ㄑㄩ", pinyin: "qū" };
    }
  }

  if (character === "轉") {
    if (hasAnyPhrase(characters, index, ["轉圈", "旋轉"])) {
      return { zhuyin: "ㄓㄨㄢˋ", pinyin: "zhuàn" };
    }
    if (hasAnyPhrase(characters, index, ["轉好", "轉往", "轉行", "轉過來", "轉授自", "轉授權", "轉向", "轉為", "轉身", "轉而", "轉變", "轉換", "轉型", "轉移", "轉入", "輾轉", "水轉"])) {
      return { zhuyin: "ㄓㄨㄢˇ", pinyin: "zhuǎn" };
    }
  }

  if (character === "應") {
    if (hasAnyPhrase(characters, index, ["應先", "就應", "應集", "應隨", "更應", "還應", "都應", "應問", "應寅", "應麟", "應是", "應該", "應有", "應予", "應當"])) {
      return { zhuyin: "ㄧㄥ", pinyin: "yīng" };
    }
    if (hasAnyPhrase(characters, index, ["應波昂", "應病人", "應和", "呼應", "反應", "適應", "應用", "應其"])) {
      return { zhuyin: "ㄧㄥˋ", pinyin: "yìng" };
    }
  }

  if (character === "相") {
    if (hasAnyPhrase(characters, index, ["世相", "相符合", "相愛", "相戀", "相見", "相差", "相中", "相安", "相結合", "相褒歌", "長相", "爭相", "相談", "相抗衡", "相襲", "火相", "競相", "相互", "相當", "相同", "相關", "相傳", "相信", "相對", "相較", "相連", "相容", "相像", "相似"])) {
      return { zhuyin: "ㄒㄧㄤ", pinyin: "xiāng" };
    }
  }

  if (character === "率") {
    if (hasAnyPhrase(characters, index, ["曝光率", "盛行率", "帶原率", "效率", "機率", "比率", "速率"])) {
      return { zhuyin: "ㄌㄩˋ", pinyin: "lǜ" };
    }
    if (hasAnyPhrase(characters, index, ["率村民", "亦率", "湯興率", "妹率", "所率", "年率眾", "正率", "率兵", "率領", "率先", "率隊"])) {
      return { zhuyin: "ㄕㄨㄞˋ", pinyin: "shuài" };
    }
  }

  if (character === "調") {
    if (hasAnyPhrase(characters, index, ["歌調", "乞丐調", "卜卦調", "哭調", "客人調", "潮州調", "定調", "怪調", "留傘調", "降調", "被調", "東調", "平埔調", "曲調", "調集", "調查", "調整", "調派", "調度"])) {
      return { zhuyin: "ㄉㄧㄠˋ", pinyin: "diào" };
    }
    if (hasAnyPhrase(characters, index, ["調和", "調解", "調適"])) {
      return { zhuyin: "ㄊㄧㄠˊ", pinyin: "tiáo" };
    }
  }

  if (character === "差") {
    if (hasAnyPhrase(characters, index, ["氣壓差", "相差"])) {
      return { zhuyin: "ㄔㄚ", pinyin: "chā" };
    }
    if (hasAnyPhrase(characters, index, ["很差", "差點", "仍差", "甚差"])) {
      return { zhuyin: "ㄔㄚˋ", pinyin: "chà" };
    }
  }

  if (character === "少") {
    if (hasAnyPhrase(characters, index, ["較少", "少部分", "愈少", "少有人", "少講話", "量少", "很少", "多少", "減少", "少見", "少數", "少量", "不少", "變少"])) {
      return { zhuyin: "ㄕㄠˇ", pinyin: "shǎo" };
    }
    if (hasAnyPhrase(characters, index, ["老少", "少將", "少男", "林少貓", "少年", "少女", "少爺"])) {
      return { zhuyin: "ㄕㄠˋ", pinyin: "shào" };
    }
  }

  if (character === "重") {
    if (hasAnyPhrase(characters, index, ["很重", "重稅", "重斂", "重度", "八重山", "四重溪", "頗重", "極重", "重逾", "重要", "重大", "重責", "重建", "重視", "沉重", "慎重"])) {
      return { zhuyin: "ㄓㄨㄥˋ", pinyin: "zhòng" };
    }
    if (hasAnyPhrase(characters, index, ["重回", "重填", "重繪", "重見", "重新", "重複", "重來", "重修", "重現"])) {
      return { zhuyin: "ㄔㄨㄥˊ", pinyin: "chóng" };
    }
  }

  if (character === "強") {
    if (hasAnyPhrase(characters, index, ["強剪", "強索", "強加", "被強加", "強徵", "強迫", "強制", "勉強", "強行"])) {
      return { zhuyin: "ㄑㄧㄤˇ", pinyin: "qiǎng" };
    }
    if (hasAnyPhrase(characters, index, ["強徒", "蔡永強", "特強", "強忍", "越強", "身強", "生命力強", "強大", "強烈", "強健", "增強"])) {
      return { zhuyin: "ㄑㄧㄤˊ", pinyin: "qiáng" };
    }
  }

  if (character === "蓋") {
    if (hasAnyPhrase(characters, index, ["晚清蓋", "蓋一所", "另蓋", "蓋上", "蓋厚", "蓋孤兒院", "蓋一間", "蓋好了", "蓋鐵路", "蓋了", "蓋起", "興蓋", "建蓋"])) {
      return { zhuyin: "ㄍㄞˋ", pinyin: "gài" };
    }
  }

  if (character === "量") {
    if (hasAnyPhrase(characters, index, ["產銷量", "工作量", "水量", "生產量", "用量", "作品量", "魚貨量", "營運量", "業務量", "有量", "沒量", "洄游量", "捕獲量", "數量", "大量", "少量", "流量", "重量", "分量"])) {
      return { zhuyin: "ㄌㄧㄤˋ", pinyin: "liàng" };
    }
  }

  if (character === "教") {
    if (hasAnyPhrase(characters, index, ["教老師", "教良家", "教給", "教督", "教其", "教乞丐", "教過", "教我們", "教導", "教人", "教他", "教她"])) {
      return { zhuyin: "ㄐㄧㄠ", pinyin: "jiāo" };
    }
    if (hasAnyPhrase(characters, index, ["分教場", "言教", "身教", "受教", "教職", "信教", "若教", "教育", "宗教", "教會", "教堂", "教室", "教學"])) {
      return { zhuyin: "ㄐㄧㄠˋ", pinyin: "jiào" };
    }
  }

  if (character === "朝") {
    if (hasAnyPhrase(characters, index, ["朝海面", "朝玉山", "朝向", "朝著", "朝前", "朝東", "朝西", "朝南", "朝北"])) {
      return { zhuyin: "ㄔㄠˊ", pinyin: "cháo" };
    }
    if (hasAnyPhrase(characters, index, ["林朝棟", "朝代", "唐朝", "清朝", "日治朝"])) {
      return { zhuyin: "ㄔㄠˊ", pinyin: "cháo" };
    }
    if (hasAnyPhrase(characters, index, ["朝陽", "朝氣", "朝露"])) {
      return { zhuyin: "ㄓㄠ", pinyin: "zhāo" };
    }
  }

  if (character === "藏") {
    if (hasAnyPhrase(characters, index, ["藏品", "館藏", "藏損失", "英藏", "躲藏", "收藏", "珍藏", "隱藏", "埋藏", "藏身", "藏在"])) {
      return { zhuyin: "ㄘㄤˊ", pinyin: "cáng" };
    }
    if (hasAnyPhrase(characters, index, ["西藏", "藏族", "藏文", "藏語"])) {
      return { zhuyin: "ㄗㄤˋ", pinyin: "zàng" };
    }
  }

  if (character === "彈") {
    if (hasAnyPhrase(characters, index, ["彈曲子", "邊彈", "彈起", "彈鋼琴", "彈琴", "彈奏", "彈唱"])) {
      return { zhuyin: "ㄊㄢˊ", pinyin: "tán" };
    }
    if (hasAnyPhrase(characters, index, ["中彈", "子彈", "砲彈", "炮彈", "炸彈", "彈藥"])) {
      return { zhuyin: "ㄉㄢˋ", pinyin: "dàn" };
    }
  }

  if (character === "乾") {
    if (hasAnyPhrase(characters, index, ["鹽過曬乾", "曬乾", "乾雨季", "乾濕", "乾硬", "未乾", "南晴乾", "乾燥", "乾淨", "晒乾"])) {
      return { zhuyin: "ㄍㄢ", pinyin: "gān" };
    }
    if (hasAnyPhrase(characters, index, ["施乾", "乾隆"])) {
      return { zhuyin: "ㄑㄧㄢˊ", pinyin: "qián" };
    }
  }

  if (character === "圳") {
    if (hasAnyPhrase(characters, index, ["圳水", "頂圳", "圳路", "八堡圳", "築圳", "水圳", "公圳", "大圳", "埤圳"])) {
      return { zhuyin: "ㄓㄣˋ", pinyin: "zhèn" };
    }
  }

  if (character === "解") {
    if (hasAnyPhrase(characters, index, ["消解", "解蛇毒", "無解", "了解", "註解"])) {
      return { zhuyin: "ㄐㄧㄝˇ", pinyin: "jiě" };
    }
  }

  if (character === "扇") {
    if (hasAnyPhrase(characters, index, ["扇起風"])) {
      return { zhuyin: "ㄕㄢ", pinyin: "shān" };
    }
    if (hasAnyPhrase(characters, index, ["一扇認識", "一扇窗", "一扇視窗", "一扇門"])) {
      return { zhuyin: "ㄕㄢˋ", pinyin: "shàn" };
    }
  }

  if (character === "散") {
    if (hasAnyPhrase(characters, index, ["散佈", "散去", "散葉", "散子"])) {
      return { zhuyin: "ㄙㄢˋ", pinyin: "sàn" };
    }
  }

  if (character === "朝") {
    if (hasAnyPhrase(characters, index, ["朝正向", "朝更高", "朝夢想", "朝鮮", "隆朝"])) {
      return { zhuyin: "ㄔㄠˊ", pinyin: "cháo" };
    }
  }

  if (character === "載") {
    if (hasAnyPhrase(characters, index, ["運載", "載客", "載滿", "載運"])) {
      return { zhuyin: "ㄗㄞˋ", pinyin: "zài" };
    }
  }

  if (character === "拾") {
    if (hasAnyPhrase(characters, index, ["拾起", "遍拾"])) {
      return { zhuyin: "ㄕˊ", pinyin: "shí" };
    }
    if (hasAnyPhrase(characters, index, ["陸拾", "貳拾"])) {
      return { zhuyin: "ㄕˊ", pinyin: "shí" };
    }
  }

  if (character === "陸") {
    if (hasAnyPhrase(characters, index, ["陸上", "陸森寶", "陸安成"])) {
      return { zhuyin: "ㄌㄨˋ", pinyin: "lù" };
    }
    if (hasAnyPhrase(characters, index, ["壹佰陸拾"])) {
      return { zhuyin: "ㄌㄧㄡˋ", pinyin: "liù" };
    }
  }

  if (character === "縫") {
    if (hasAnyPhrase(characters, index, ["暗縫", "石縫", "船縫"])) {
      return { zhuyin: "ㄈㄥˋ", pinyin: "fèng" };
    }
    if (hasAnyPhrase(characters, index, ["車縫"])) {
      return { zhuyin: "ㄈㄥˊ", pinyin: "féng" };
    }
  }

  if (character === "鮮") {
    if (hasAnyPhrase(characters, index, ["光鮮", "鮮乳", "農鮮乳"])) {
      return { zhuyin: "ㄒㄧㄢ", pinyin: "xiān" };
    }
    if (hasAnyPhrase(characters, index, ["朝鮮", "鮮為人知"])) {
      return { zhuyin: "ㄒㄧㄢˇ", pinyin: "xiǎn" };
    }
  }

  if (character === "覺") {
    if (hasAnyPhrase(characters, index, ["警覺", "深覺", "盡覺", "倍覺"])) {
      return { zhuyin: "ㄐㄩㄝˊ", pinyin: "jué" };
    }
  }

  if (character === "佛") {
    if (hasAnyPhrase(characters, index, ["高士佛", "禮佛"])) {
      return { zhuyin: "ㄈㄛˊ", pinyin: "fó" };
    }
  }

  if (character === "舍") {
    if (hasAnyPhrase(characters, index, ["莊舍", "雞舍", "屋舍"])) {
      return { zhuyin: "ㄕㄜˋ", pinyin: "shè" };
    }
    if (hasAnyPhrase(characters, index, ["阿龍舍"])) {
      return { zhuyin: "ㄕㄜˇ", pinyin: "shě" };
    }
  }

  if (character === "柏") {
    if (hasAnyPhrase(characters, index, ["林柏維", "劉柏園", "曾柏村", "柏野"])) {
      return { zhuyin: "ㄅㄛˊ", pinyin: "bó" };
    }
  }

  if (character === "乘") {
    if (hasAnyPhrase(characters, index, ["乘勝", "乘著"])) {
      return { zhuyin: "ㄔㄥˊ", pinyin: "chéng" };
    }
  }

  if (character === "臭") {
    if (hasAnyPhrase(characters, index, ["臭香", "臭跤", "髒臭"])) {
      return { zhuyin: "ㄔㄡˋ", pinyin: "chòu" };
    }
  }

  if (character === "參") {
    if (hasAnyPhrase(characters, index, ["參訪", "參議"])) {
      return { zhuyin: "ㄘㄢ", pinyin: "cān" };
    }
  }

  if (character === "崗") {
    if (hasAnyPhrase(characters, index, ["花崗", "木崗"])) {
      return { zhuyin: "ㄍㄤ", pinyin: "gāng" };
    }
  }

  if (character === "旋") {
    if (hasAnyPhrase(characters, index, ["自旋", "飛旋", "往上旋", "旋後"])) {
      return { zhuyin: "ㄒㄩㄢˊ", pinyin: "xuán" };
    }
  }

  if (character === "喝") {
    if (hasAnyPhrase(characters, index, ["喝酒", "喝的酒", "愈喝"])) {
      return { zhuyin: "ㄏㄜ", pinyin: "hē" };
    }
  }

  if (character === "喪") {
    if (hasAnyPhrase(characters, index, ["喪夫", "斷喪", "命喪", "父喪"])) {
      return { zhuyin: "ㄙㄤˋ", pinyin: "sàng" };
    }
  }

  if (character === "尋") {
    if (hasAnyPhrase(characters, index, ["尋（", "尋鯨", "協尋", "尋回"])) {
      return { zhuyin: "ㄒㄩㄣˊ", pinyin: "xún" };
    }
  }

  if (character === "棲") {
    if (hasAnyPhrase(characters, index, ["底棲", "棲留", "暫棲", "棲地"])) {
      return { zhuyin: "ㄑㄧ", pinyin: "qī" };
    }
  }

  if (character === "鋪") {
    if (hasAnyPhrase(characters, index, ["鋪橋", "鋪滿"])) {
      return { zhuyin: "ㄆㄨ", pinyin: "pū" };
    }
    if (hasAnyPhrase(characters, index, ["鋪戶"])) {
      return { zhuyin: "ㄆㄨˋ", pinyin: "pù" };
    }
  }

  if (character === "繳") {
    if (hasAnyPhrase(characters, index, ["繳不起", "上繳", "繳租", "繳學費"])) {
      return { zhuyin: "ㄐㄧㄠˇ", pinyin: "jiǎo" };
    }
  }

  if (character === "露") {
    if (hasAnyPhrase(characters, index, ["出露", "露宿", "漸露", "嶄露"])) {
      return { zhuyin: "ㄌㄨˋ", pinyin: "lù" };
    }
  }

  if (character === "亡") {
    if (hasAnyPhrase(characters, index, ["亡了", "而亡", "血而亡"])) {
      return { zhuyin: "ㄨㄤˊ", pinyin: "wáng" };
    }
  }

  if (character === "吾") {
    if (hasAnyPhrase(characters, index, ["源吾", "若吾境", "吾往矣"])) {
      return { zhuyin: "ㄨˊ", pinyin: "wú" };
    }
  }

  if (character === "呀") {
    if (hasAnyPhrase(characters, index, ["他呀", "望呀", "等呀"])) {
      return { zhuyin: "˙ㄧㄚ", pinyin: "ya" };
    }
  }

  if (character === "卷") {
    if (hasAnyPhrase(characters, index, ["卷丹", "卷頭語"])) {
      return { zhuyin: "ㄐㄩㄢˇ", pinyin: "juǎn" };
    }
  }

  if (character === "委") {
    if (hasAnyPhrase(characters, index, ["農委會"])) {
      return { zhuyin: "ㄨㄟˇ", pinyin: "wěi" };
    }
  }

  if (character === "削") {
    if (hasAnyPhrase(characters, index, ["削製", "刀削"])) {
      return { zhuyin: "ㄒㄧㄠ", pinyin: "xiāo" };
    }
  }

  if (character === "哩") {
    if (hasAnyPhrase(characters, index, ["哩！", "哩！」"])) {
      return { zhuyin: "˙ㄌㄧ", pinyin: "li" };
    }
  }

  if (character === "哮") {
    if (hasAnyPhrase(characters, index, ["哮啾啾"])) {
      return { zhuyin: "ㄒㄧㄠ", pinyin: "xiāo" };
    }
  }

  if (character === "術") {
    if (hasAnyPhrase(characters, index, ["生產術", "化裝術", "箭術"])) {
      return { zhuyin: "ㄕㄨˋ", pinyin: "shù" };
    }
  }

  if (character === "陶") {
    if (hasAnyPhrase(characters, index, ["陶甕", "葉陶", "陶曼"])) {
      return { zhuyin: "ㄊㄠˊ", pinyin: "táo" };
    }
  }

  if (character === "單") {
    if (hasAnyPhrase(characters, index, ["單親", "單趟", "單靠"])) {
      return { zhuyin: "ㄉㄢ", pinyin: "dān" };
    }
  }

  if (character === "模") {
    if (hasAnyPhrase(characters, index, ["模特兒", "石膏模"])) {
      return { zhuyin: "ㄇㄛˊ", pinyin: "mó" };
    }
  }

  if (character === "擔") {
    if (hasAnyPhrase(characters, index, ["一擔", "點心擔"])) {
      return { zhuyin: "ㄉㄢˋ", pinyin: "dàn" };
    }
    if (hasAnyPhrase(characters, index, ["擔回去"])) {
      return { zhuyin: "ㄉㄢ", pinyin: "dān" };
    }
  }

  if (character === "藏") {
    if (hasAnyPhrase(characters, index, ["藏寮", "藏鏡人", "武藏野"])) {
      return { zhuyin: "ㄘㄤˊ", pinyin: "cáng" };
    }
  }

  if (character === "轉") {
    if (hasAnyPhrase(characters, index, ["轉至", "轉用"])) {
      return { zhuyin: "ㄓㄨㄢˇ", pinyin: "zhuǎn" };
    }
  }

  if (character === "町") {
    if (hasAnyPhrase(characters, index, ["今町", "太平町", "榮町"])) {
      return { zhuyin: "ㄊㄧㄥˇ", pinyin: "tǐng" };
    }
  }

  if (character === "予") {
    if (hasAnyPhrase(characters, index, ["將予"])) return { zhuyin: "ㄩˇ", pinyin: "yǔ" };
    if (hasAnyPhrase(characters, index, ["鄭愁予"])) return { zhuyin: "ㄩˊ", pinyin: "yú" };
  }

  if (character === "什") {
    if (hasAnyPhrase(characters, index, ["什一稅", "什費"])) return { zhuyin: "ㄕˊ", pinyin: "shí" };
  }

  if (character === "仇") {
    if (hasAnyPhrase(characters, index, ["情仇", "恩怨情仇"])) return { zhuyin: "ㄔㄡˊ", pinyin: "chóu" };
  }

  if (character === "爪") {
    if (hasAnyPhrase(characters, index, ["雞爪", "爪子"])) return { zhuyin: "ㄓㄨㄚˇ", pinyin: "zhuǎ" };
  }

  if (character === "台") {
    if (hasAnyPhrase(characters, index, ["舞台", "上台"])) return { zhuyin: "ㄊㄞˊ", pinyin: "tái" };
  }

  if (character === "瓦") {
    if (hasAnyPhrase(characters, index, ["烏瓦"])) return { zhuyin: "ㄨㄚˇ", pinyin: "wǎ" };
  }

  if (character === "吐") {
    if (hasAnyPhrase(characters, index, ["吐出"])) return { zhuyin: "ㄊㄨˇ", pinyin: "tǔ" };
  }

  if (character === "伽") {
    if (hasAnyPhrase(characters, index, ["僧伽羅"])) return { zhuyin: "ㄑㄧㄝˊ", pinyin: "qié" };
  }

  if (character === "余") {
    if (hasAnyPhrase(characters, index, ["余即", "余光中"])) return { zhuyin: "ㄩˊ", pinyin: "yú" };
  }

  if (character === "坊") {
    if (hasAnyPhrase(characters, index, ["孝子坊", "工作坊"])) return { zhuyin: "ㄈㄤ", pinyin: "fāng" };
  }

  if (character === "夾") {
    if (hasAnyPhrase(characters, index, ["夾在", "夾菜"])) return { zhuyin: "ㄐㄧㄚˊ", pinyin: "jiá" };
  }

  if (character === "彷") {
    if (hasAnyPhrase(characters, index, ["彷若"])) return { zhuyin: "ㄈㄤˇ", pinyin: "fǎng" };
  }

  if (character === "杉") {
    if (hasAnyPhrase(characters, index, ["福杉", "杉原"])) return { zhuyin: "ㄕㄢ", pinyin: "shān" };
  }

  if (character === "究") {
    if (hasAnyPhrase(characters, index, ["究其", "究源"])) return { zhuyin: "ㄐㄧㄡˋ", pinyin: "jiù" };
  }

  if (character === "肚") {
    if (hasAnyPhrase(characters, index, ["肚裡", "肚哩"])) return { zhuyin: "ㄉㄨˋ", pinyin: "dù" };
  }

  if (character === "卓") {
    if (hasAnyPhrase(characters, index, ["卓蘭", "卓別林"])) return { zhuyin: "ㄓㄨㄛˊ", pinyin: "zhuó" };
  }

  if (character === "拆") {
    if (hasAnyPhrase(characters, index, ["拆建", "拆下"])) return { zhuyin: "ㄔㄞ", pinyin: "chāi" };
  }

  if (character === "采") {
    if (hasAnyPhrase(characters, index, ["好采頭", "多采"])) return { zhuyin: "ㄘㄞˇ", pinyin: "cǎi" };
  }

  if (character === "咱") {
    if (hasAnyPhrase(characters, index, ["咱愛咱"])) return { zhuyin: "ㄗㄢˊ", pinyin: "zán" };
  }

  if (character === "哄") {
    if (hasAnyPhrase(characters, index, ["哄他"])) return { zhuyin: "ㄏㄨㄥˇ", pinyin: "hǒng" };
  }

  if (character === "查") {
    if (hasAnyPhrase(characters, index, ["查瑪克", "查理"])) return { zhuyin: "ㄔㄚˊ", pinyin: "chá" };
  }

  if (character === "炸") {
    if (hasAnyPhrase(characters, index, ["炸山", "炸成"])) return { zhuyin: "ㄓㄚˋ", pinyin: "zhà" };
  }

  if (character === "胖") {
    if (hasAnyPhrase(characters, index, ["胖胖"])) return { zhuyin: "ㄆㄤˋ", pinyin: "pàng" };
  }

  if (character === "俱") {
    if (hasAnyPhrase(characters, index, ["俱有", "俱疲"])) return { zhuyin: "ㄐㄩˋ", pinyin: "jù" };
  }

  if (character === "柴") {
    if (hasAnyPhrase(characters, index, ["挑柴"])) return { zhuyin: "ㄔㄞˊ", pinyin: "chái" };
  }

  if (character === "浮") {
    if (hasAnyPhrase(characters, index, ["浮100", "浮在"])) return { zhuyin: "ㄈㄨˊ", pinyin: "fú" };
  }

  if (character === "窄") {
    if (hasAnyPhrase(characters, index, ["很窄", "扁窄"])) return { zhuyin: "ㄓㄞˇ", pinyin: "zhǎi" };
  }

  if (character === "辱") {
    if (hasAnyPhrase(characters, index, ["被辱", "污辱"])) return { zhuyin: "ㄖㄨˇ", pinyin: "rǔ" };
  }

  if (character === "骨") {
    if (hasAnyPhrase(characters, index, ["骨骸", "萬骨"])) return { zhuyin: "ㄍㄨˇ", pinyin: "gǔ" };
  }

  if (character === "培") {
    if (hasAnyPhrase(characters, index, ["蔡培火"])) return { zhuyin: "ㄆㄟˊ", pinyin: "péi" };
  }

  if (character === "探") {
    if (hasAnyPhrase(characters, index, ["探伊", "探個"])) return { zhuyin: "ㄊㄢˋ", pinyin: "tàn" };
  }

  if (character === "涼") {
    if (hasAnyPhrase(characters, index, ["冷涼", "涼傘"])) return { zhuyin: "ㄌㄧㄤˊ", pinyin: "liáng" };
  }

  if (character === "累") {
    if (hasAnyPhrase(characters, index, ["賠累"])) return { zhuyin: "ㄌㄟˇ", pinyin: "lěi" };
    if (hasAnyPhrase(characters, index, ["真累"])) return { zhuyin: "ㄌㄟˋ", pinyin: "lèi" };
  }

  if (character === "逢") {
    if (hasAnyPhrase(characters, index, ["戴逢祈", "正逢"])) return { zhuyin: "ㄈㄥˊ", pinyin: "féng" };
  }

  if (character === "勝") {
    if (hasAnyPhrase(characters, index, ["不勝", "乘勝"])) return { zhuyin: "ㄕㄥˋ", pinyin: "shèng" };
  }

  if (character === "堤") {
    if (hasAnyPhrase(characters, index, ["土堰堤", "堤長"])) return { zhuyin: "ㄉㄧ", pinyin: "dī" };
  }

  if (character === "敦") {
    if (hasAnyPhrase(characters, index, ["敦化", "雷敦"])) return { zhuyin: "ㄉㄨㄣ", pinyin: "dūn" };
  }

  if (character === "渴") {
    if (hasAnyPhrase(characters, index, ["愈渴", "若渴"])) return { zhuyin: "ㄎㄜˇ", pinyin: "kě" };
  }

  if (character === "答") {
    if (hasAnyPhrase(characters, index, ["回答", "一答"])) return { zhuyin: "ㄉㄚˊ", pinyin: "dá" };
  }

  if (character === "蛤") {
    if (hasAnyPhrase(characters, index, ["蛤仔"])) return { zhuyin: "ㄍㄜˊ", pinyin: "gé" };
  }

  if (character === "飲") {
    if (hasAnyPhrase(characters, index, ["飲記", "生飲"])) return { zhuyin: "ㄧㄣˇ", pinyin: "yǐn" };
  }

  if (character === "馮") {
    if (hasAnyPhrase(characters, index, ["馮凱", "馮秉正"])) return { zhuyin: "ㄈㄥˊ", pinyin: "féng" };
  }

  if (character === "傾") {
    if (hasAnyPhrase(characters, index, ["傾洩", "傾全力"])) return { zhuyin: "ㄑㄧㄥ", pinyin: "qīng" };
  }

  if (character === "滑") {
    if (hasAnyPhrase(characters, index, ["濕滑", "滑入"])) return { zhuyin: "ㄏㄨㄚˊ", pinyin: "huá" };
  }

  if (character === "聘") {
    if (hasAnyPhrase(characters, index, ["聘為", "之聘"])) return { zhuyin: "ㄆㄧㄣˋ", pinyin: "pìn" };
  }

  if (character === "虜") {
    if (hasAnyPhrase(characters, index, ["虜來", "虜掠"])) return { zhuyin: "ㄌㄨˇ", pinyin: "lǔ" };
  }

  if (character === "逼") {
    if (hasAnyPhrase(characters, index, ["逼入", "逼稅"])) return { zhuyin: "ㄅㄧ", pinyin: "bī" };
  }

  if (character === "頓") {
    if (hasAnyPhrase(characters, index, ["普林斯頓"])) return { zhuyin: "ㄉㄨㄣˋ", pinyin: "dùn" };
    if (hasAnyPhrase(characters, index, ["頓失"])) return { zhuyin: "ㄉㄨㄣˋ", pinyin: "dùn" };
  }

  if (character === "寧") {
    if (hasAnyPhrase(characters, index, ["寧波"])) return { zhuyin: "ㄋㄧㄥˊ", pinyin: "níng" };
    if (hasAnyPhrase(characters, index, ["卻寧"])) return { zhuyin: "ㄋㄧㄥˋ", pinyin: "nìng" };
  }

  if (character === "暝") {
    if (hasAnyPhrase(characters, index, ["一暝"])) return { zhuyin: "ㄇㄧㄥˊ", pinyin: "míng" };
  }

  if (character === "漂") {
    if (hasAnyPhrase(characters, index, ["漂難"])) return { zhuyin: "ㄆㄧㄠ", pinyin: "piāo" };
  }

  if (character === "雌") {
    if (hasAnyPhrase(characters, index, ["雌鳥"])) return { zhuyin: "ㄘ", pinyin: "cī" };
  }

  if (character === "儉") {
    if (hasAnyPhrase(characters, index, ["儉用"])) return { zhuyin: "ㄐㄧㄢˇ", pinyin: "jiǎn" };
  }

  if (character === "噴") {
    if (hasAnyPhrase(characters, index, ["噴藥"])) return { zhuyin: "ㄆㄣ", pinyin: "pēn" };
  }

  if (character === "墳") {
    if (hasAnyPhrase(characters, index, ["墳塋", "荒墳"])) return { zhuyin: "ㄈㄣˊ", pinyin: "fén" };
  }

  if (character === "撈") {
    if (hasAnyPhrase(characters, index, ["撈捕", "魚撈"])) return { zhuyin: "ㄌㄠ", pinyin: "lāo" };
  }

  if (character === "衝") {
    if (hasAnyPhrase(characters, index, ["衝至", "裡面衝"])) return { zhuyin: "ㄔㄨㄥ", pinyin: "chōng" };
  }

  if (character === "操") {
    if (hasAnyPhrase(characters, index, ["操控"])) return { zhuyin: "ㄘㄠ", pinyin: "cāo" };
  }

  if (character === "磨") {
    if (hasAnyPhrase(characters, index, ["磨製", "磨亮"])) return { zhuyin: "ㄇㄛˊ", pinyin: "mó" };
  }

  if (character === "錯") {
    if (hasAnyPhrase(characters, index, ["做錯", "冤錯"])) return { zhuyin: "ㄘㄨㄛˋ", pinyin: "cuò" };
  }

  if (character === "避") {
    if (hasAnyPhrase(characters, index, ["宜避", "避災"])) return { zhuyin: "ㄅㄧˋ", pinyin: "bì" };
  }

  if (character === "瀑") {
    if (hasAnyPhrase(characters, index, ["水瀑", "瀑布"])) return { zhuyin: "ㄆㄨˋ", pinyin: "pù" };
  }

  if (character === "闖") {
    if (hasAnyPhrase(characters, index, ["誤闖"])) return { zhuyin: "ㄔㄨㄤˇ", pinyin: "chuǎng" };
  }

  if (character === "額") {
    if (hasAnyPhrase(characters, index, ["增額"])) return { zhuyin: "ㄜˊ", pinyin: "é" };
  }

  if (character === "魏") {
    if (hasAnyPhrase(characters, index, ["魏如惠", "魏子雲"])) return { zhuyin: "ㄨㄟˋ", pinyin: "wèi" };
  }

  if (character === "瀧") {
    if (hasAnyPhrase(characters, index, ["瀧乃湯", "川上瀧彌"])) return { zhuyin: "ㄌㄨㄥˊ", pinyin: "lóng" };
  }

  if (character === "識") {
    if (hasAnyPhrase(characters, index, ["意識", "識英才"])) return { zhuyin: "ㄕˋ", pinyin: "shì" };
  }

  if (character === "礦") {
    if (hasAnyPhrase(characters, index, ["礦泥"])) return { zhuyin: "ㄎㄨㄤˋ", pinyin: "kuàng" };
  }

  if (character === "繻") {
    if (hasAnyPhrase(characters, index, ["繻，", "棄繻"])) return { zhuyin: "ㄖㄨˊ", pinyin: "rú" };
  }

  if (character === "攜") {
    if (hasAnyPhrase(characters, index, ["攜子", "攜帶"])) return { zhuyin: "ㄒㄧㄝˊ", pinyin: "xié" };
  }

  if (character === "髒") {
    if (hasAnyPhrase(characters, index, ["髒污", "髒臭"])) return { zhuyin: "ㄗㄤ", pinyin: "zāng" };
  }

  if (character === "鑿") {
    if (hasAnyPhrase(characters, index, ["鑿出", "鑿去"])) return { zhuyin: "ㄗㄠˊ", pinyin: "záo" };
  }

  if (character === "空") {
    if (hasAnyPhrase(characters, index, ["石空", "色空", "空梳", "空悲哀", "海空", "成空"])) {
      return { zhuyin: "ㄎㄨㄥ", pinyin: "kōng" };
    }
  }

  if (character === "噶") {
    if (hasAnyPhrase(characters, index, ["噶瑪蘭"])) {
      return { zhuyin: "ㄍㄚˊ", pinyin: "gá" };
    }
  }

  if (character === "塞") {
    if (hasAnyPhrase(characters, index, ["塞彈丸"])) {
      return { zhuyin: "ㄙㄞ", pinyin: "sāi" };
    }
  }

  if (character === "薄") {
    if (hasAnyPhrase(characters, index, ["滂薄"])) {
      return { zhuyin: "ㄅㄛˊ", pinyin: "bó" };
    }
  }

  return null;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(annotationsPath, "utf8"));
  
  const entries = Array.isArray(data) ? data.map(entry => ({
    term: entry.char,
    zhuyin: [entry.zhuyin],
    pinyin: [entry.pinyin],
    readingsCount: 1,
    override: entry.override
  })) : data.entries.map(entry => {
    const readings = Array.isArray(entry.readings) ? entry.readings : [];
    const usableReadings = readings.filter(reading => reading.zhuyin?.length && reading.pinyin?.length);
    const reading = usableReadings[0];
    if (!reading) return null;
    return {
      term: entry.term,
      zhuyin: reading.zhuyin,
      pinyin: reading.pinyin,
      readingsCount: usableReadings.length,
      override: entry.override
    };
  }).filter(Boolean);

  const annotationTerms = entries
    .filter(entry => entry.term && entry.zhuyin?.length && entry.pinyin?.length)
    .sort((a, b) => [...b.term].length - [...a.term].length || a.term.localeCompare(b.term, "zh-Hant"));
  
  const polyphonicCharacters = new Set(
    annotationTerms
      .filter(entry => [...entry.term].length === 1 && entry.readingsCount > 1)
      .map(entry => entry.term)
  );
  
  const annotationTermsByFirstCharacter = annotationTerms.reduce((groups, entry) => {
    const first = [...entry.term][0];
    groups[first] ||= [];
    groups[first].push(entry);
    return groups;
  }, {});

  const report = {
    unknown: [],
    polyphoneResolved: []
  };

  const isAmbiguousCharacter = (value) => {
    return manualAmbiguousCharacters.has(value) || polyphonicCharacters.has(value);
  };

  const files = fs.readdirSync(storyDirectory).filter(f => f.endsWith(".md"));
  for (const file of files) {
    const text = extractStoryText(`${storyDirectory}/${file}`);
    const characters = [...text];
    let index = 0;

    while (index < characters.length) {
      const current = characters[index];
      if (!isHanCharacter(current)) {
        index += 1;
        continue;
      }

      // Find term
      let match = null;
      const candidates = annotationTermsByFirstCharacter[current] || [];
      for (const entry of candidates) {
        const termCharacters = [...entry.term];
        if (termCharacters.length <= 1) continue;
        let matched = true;
        for (let offset = 0; offset < termCharacters.length; offset += 1) {
          if (characters[index + offset] !== termCharacters[offset]) {
            matched = false;
            break;
          }
        }
        if (matched) {
          match = { term: entry.term, entry };
          break;
        }
      }

      if (match) {
        // If the term contains polyphonic characters, it's resolved by term
        const termChars = [...match.term];
        let hasPolyphone = false;
        for (const char of termChars) {
          if (isAmbiguousCharacter(char)) {
            hasPolyphone = true;
            break;
          }
        }
        
        if (hasPolyphone) {
          report.polyphoneResolved.push({
            term: match.term,
            zhuyin: match.entry.zhuyin,
            pinyin: match.entry.pinyin,
            method: match.entry.override ? "manual" : "complete-term",
            story: file.replace(".md", "")
          });
        }
        
        index += termChars.length;
        continue;
      }

      if (isAmbiguousCharacter(current)) {
        const contextualReading = contextualCharacterReading(characters, index);
        const resolvedReading = contextualReading || defaultSingleCharacterReadings[current];
        if (resolvedReading) {
           report.polyphoneResolved.push({
            term: current,
            zhuyin: [resolvedReading.zhuyin],
            pinyin: [resolvedReading.pinyin],
            method: contextualReading ? "context-rule" : "default-single-character",
            story: file.replace(".md", "")
          });
        } else {
          // Unknown context
          const contextStart = Math.max(0, index - 4);
          const contextEnd = Math.min(characters.length, index + 5);
          report.unknown.push({
            char: current,
            context: characters.slice(contextStart, contextEnd).join(""),
            story: file.replace(".md", ""),
            reason: "多音字未能確認"
          });
        }
      }
      
      index += 1;
    }
  }

  // Deduplicate reports to keep file size reasonable
  const uniqueUnknown = new Map();
  for (const item of report.unknown) {
    const key = `${item.char}|${item.context}`;
    if (!uniqueUnknown.has(key)) {
        uniqueUnknown.set(key, item);
    }
  }
  report.unknown = [...uniqueUnknown.values()];

  const uniqueResolved = new Map();
  for (const item of report.polyphoneResolved) {
    if (!uniqueResolved.has(item.term)) {
        uniqueResolved.set(item.term, item);
    }
  }
  report.polyphoneResolved = [...uniqueResolved.values()];

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Generated V2 report: ${reportPath}`);
  console.log(`- Unknown cases: ${report.unknown.length}`);
  console.log(`- Polyphones resolved: ${report.polyphoneResolved.length}`);
}

main().catch(console.error);
