const gameSeed = [
  ["マンカラ", "ボードゲーム", "mankara"], ["ドット&ボックス", "ボードゲーム", "dotbox"], ["ヨット", "ボードゲーム", "yot"],
  ["コネクトフォー", "ボードゲーム", "connectfour"], ["ヒット&ブロー", "ボードゲーム", "hit"], ["ナインメンズモリス", "ボードゲーム", "ninemens"],
  ["ヘックス", "ボードゲーム", "hex"], ["チェッカー", "ボードゲーム", "checker"], ["ウサギと猟犬", "ボードゲーム", "rabbit"],
  ["五目ならべ", "ボードゲーム", "gomoku"], ["ドミノ", "ボードゲーム", "domino"], ["チャイニーズチェッカー", "ボードゲーム", "chchecker"],
  ["ルドー", "ボードゲーム", "ludo"], ["バックギャモン", "ボードゲーム", "backgammon"], ["リバーシ", "ボードゲーム", "reverce"],
  ["チェス", "ボードゲーム", "ches"], ["将棋", "ボードゲーム", "shougi"], ["5五将棋", "ボードゲーム", "goshougi"],
  ["花札", "カードゲーム", "hanafuda"], ["麻雀", "ボードゲーム", "majang"], ["ラストカード", "カードゲーム", "lastcard"],
  ["ブラックジャック", "カードゲーム", "blackjack"], ["テキサスポーカー", "カードゲーム", "poker"], ["大富豪", "カードゲーム", "daifugo"],
  ["7ならべ", "カードゲーム", "seven"], ["スピード", "カードゲーム", "speed"], ["神経衰弱", "カードゲーム", "suijaku"],
  ["戦争", "カードゲーム", "war"], ["たこやき", "カードゲーム", "takoyaki"], ["ぶたのしっぽ", "カードゲーム", "pigtale"],
  ["ゴルフ", "スポーツ", "golf"], ["ビリヤード", "スポーツ", "biliyard"], ["ボウリング", "スポーツ", "bowling"],
  ["ダーツ", "スポーツ", "darts"], ["キャロム", "バラエティ", "carom"], ["トイテニス", "スポーツ", "tennis"],
  ["トイサッカー", "スポーツ", "soccer"], ["トイカーリング", "スポーツ", "curling"], ["トイボクシング", "スポーツ", "boxing"],
  ["トイベースボール", "スポーツ", "baseball"], ["エアホッケー", "スポーツ", "airhockey"], ["スロットカー", "バラエティ", "slotcar"],
  ["フィッシング", "バラエティ", "fishing"], ["VSタンク", "バラエティ", "vstunk"], ["協力タンク", "バラエティ", "kyouryokutunk"],
  ["的あて", "バラエティ", "shot"], ["6ボールパズル", "バラエティ", "sixball"], ["スライドパズル", "バラエティ", "slide"],
  ["麻雀ソリティア", "ボードゲーム", "solitaire"], ["クロンダイク", "カードゲーム", "klondike"], ["スパイダー", "カードゲーム", "spider"]
];

const games = gameSeed.map(([name, category, filename], index) => ({
  name,
  category,
  imageUrl: `https://www.nintendo.com/jp/switch/as7ta/games/img/games/${filename}.jpg`,
  sourceUrl: "https://www.nintendo.com/jp/switch/as7ta/games/index.html",
  officialIndex: index + 1
}));

const state = {
  rounds: [],
  members: [],
  resultSequence: 0,
  rouletteTimer: null,
  selectedGame: null
};

const memberInput = document.querySelector("#memberInput");
const foodBudget = document.querySelector("#foodBudget");
const averageShare = document.querySelector("#averageShare");
const maxShare = document.querySelector("#maxShare");
const minShare = document.querySelector("#minShare");
const bracket = document.querySelector("#bracket");
const matchTemplate = document.querySelector("#matchTemplate");
const rouletteImage = document.querySelector("#rouletteImage");
const rouletteName = document.querySelector("#rouletteName");
const rouletteCategory = document.querySelector("#rouletteCategory");
const gameList = document.querySelector("#gameList");
const startRouletteButton = document.querySelector("#startRouletteButton");
const stopRouletteButton = document.querySelector("#stopRouletteButton");

const rankModeInputs = [...document.querySelectorAll('input[name="rankMode"]')];
const moneyInputs = [foodBudget, maxShare, minShare];

document.querySelector("#sampleButton").addEventListener("click", () => {
  memberInput.value = ["渡会", "山田", "佐藤", "鈴木", "田中", "高橋", "伊藤", "中村"].join("\n");
});

document.querySelector("#createButton").addEventListener("click", createTournament);
document.querySelector("#resetWinnersButton").addEventListener("click", () => {
  if (state.members.length > 1) buildInitialRounds(state.members);
});
moneyInputs.forEach((input) => input.addEventListener("input", renderBracket));
rankModeInputs.forEach((input) => input.addEventListener("change", renderBracket));
startRouletteButton.addEventListener("click", startRoulette);
stopRouletteButton.addEventListener("click", stopRoulette);

function createTournament() {
  const members = memberInput.value.split(/\n|,/).map((name) => name.trim()).filter(Boolean);
  const uniqueMembers = [...new Set(members)];

  if (uniqueMembers.length < 2) {
    bracket.textContent = "2人以上の名前を入力してください。";
    bracket.className = "bracket empty-state";
    updateAverage(uniqueMembers.length);
    return;
  }

  state.members = shuffle(uniqueMembers);
  buildInitialRounds(state.members);
}

function buildInitialRounds(members) {
  state.resultSequence = 0;
  const size = nextPowerOfTwo(members.length);
  const seeded = [...members, ...Array(size - members.length).fill("BYE")];
  const firstRound = [];

  for (let i = 0; i < seeded.length; i += 2) {
    const players = [seeded[i], seeded[i + 1]];
    firstRound.push({
      id: `r0m${i / 2}`,
      players,
      winner: players.includes("BYE") ? players.find((player) => player !== "BYE") : null,
      loser: null,
      completedAt: null
    });
  }

  const rounds = [firstRound];
  let matchCount = firstRound.length / 2;
  let roundIndex = 1;
  while (matchCount >= 1) {
    rounds.push(Array.from({ length: matchCount }, (_, index) => ({
      id: `r${roundIndex}m${index}`,
      players: [null, null],
      winner: null,
      loser: null,
      completedAt: null
    })));
    matchCount /= 2;
    roundIndex += 1;
  }

  state.rounds = rounds;
  propagateWinners();
  renderBracket();
}

function selectWinner(roundIndex, matchIndex, winner) {
  const match = state.rounds[roundIndex][matchIndex];
  const loser = match.players.find((player) => player && player !== "BYE" && player !== winner) || null;
  match.winner = winner;
  match.loser = loser;
  match.completedAt = loser ? ++state.resultSequence : null;
  clearFollowing(roundIndex, matchIndex);
  propagateWinners();
  renderBracket();
}

function clearFollowing(roundIndex, matchIndex) {
  let nextRoundIndex = roundIndex + 1;
  let nextMatchIndex = Math.floor(matchIndex / 2);

  while (state.rounds[nextRoundIndex]) {
    const match = state.rounds[nextRoundIndex][nextMatchIndex];
    match.winner = null;
    match.loser = null;
    match.completedAt = null;
    nextRoundIndex += 1;
    nextMatchIndex = Math.floor(nextMatchIndex / 2);
  }
}

function propagateWinners() {
  for (let roundIndex = 1; roundIndex < state.rounds.length; roundIndex += 1) {
    state.rounds[roundIndex].forEach((match, matchIndex) => {
      const left = state.rounds[roundIndex - 1][matchIndex * 2]?.winner || null;
      const right = state.rounds[roundIndex - 1][matchIndex * 2 + 1]?.winner || null;
      match.players = [left, right];
      if (match.winner && !match.players.includes(match.winner)) {
        match.winner = null;
        match.loser = null;
        match.completedAt = null;
      }
    });
  }
}

function renderBracket() {
  updateAverage(state.members.length);
  bracket.className = "bracket";
  bracket.innerHTML = "";

  if (!state.rounds.length) {
    bracket.className = "bracket empty-state";
    bracket.textContent = "メンバーを入力してトーナメントを作成してください。";
    return;
  }

  const shares = calculateShares();
  state.rounds.forEach((round, roundIndex) => {
    const roundEl = document.createElement("div");
    roundEl.className = "round";
    const title = document.createElement("div");
    title.className = "round-title";
    title.textContent = roundName(roundIndex, state.rounds.length);
    roundEl.append(title);

    round.forEach((match, matchIndex) => {
      const card = matchTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector(".match-title").textContent = `MATCH ${matchIndex + 1}`;
      const playersEl = card.querySelector(".players");

      match.players.forEach((player) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "player-button";
        if (!player) {
          button.textContent = "勝者待ち";
          button.disabled = true;
        } else if (player === "BYE") {
          button.textContent = "シード";
          button.disabled = true;
          button.classList.add("bye");
        } else {
          const share = shares.get(player) || { amount: 0, rankLabel: "-" };
          button.innerHTML = `<span>${escapeHtml(player)}</span><span class="share">${share.rankLabel} / ¥${share.amount.toLocaleString()}</span>`;
          button.addEventListener("click", () => selectWinner(roundIndex, matchIndex, player));
          if (match.winner === player) button.classList.add("winner");
        }
        playersEl.append(button);
      });

      roundEl.append(card);
    });

    bracket.append(roundEl);
  });
}

function calculateShares() {
  const totalBudget = Math.max(0, Number(foodBudget.value || 0));
  const minValue = Math.max(0, Number(minShare.value || 0));
  const maxValue = Math.max(minValue, Number(maxShare.value || minValue));
  const rankMode = document.querySelector('input[name="rankMode"]:checked')?.value || "ties";
  const standings = buildStandings(rankMode);
  const maxRank = Math.max(...standings.map((item) => item.rank), 1);
  const raw = standings.map((item) => {
    const ratio = maxRank === 1 ? 0 : (item.rank - 1) / (maxRank - 1);
    return { ...item, amount: Math.round(minValue + (maxValue - minValue) * ratio) };
  });

  const normalized = normalizeTotal(raw, totalBudget, minValue, maxValue);
  return new Map(normalized.map((item) => [item.member, {
    amount: item.amount,
    rankLabel: `${item.rank}位`
  }]));
}

function buildStandings(rankMode) {
  const champion = state.rounds.at(-1)?.[0]?.winner || null;
  const completed = state.rounds.flat().filter((match) => match.loser && match.completedAt);
  const wins = new Map(state.members.map((member) => [member, 0]));

  state.rounds.flat().forEach((match) => {
    const realPlayers = match.players.filter((player) => player && player !== "BYE");
    if (match.winner && realPlayers.length === 2 && wins.has(match.winner)) wins.set(match.winner, wins.get(match.winner) + 1);
  });

  if (rankMode === "strict") {
    const ordered = [...state.members].sort((a, b) => {
      if (a === champion) return -1;
      if (b === champion) return 1;
      const lostA = completed.find((match) => match.loser === a);
      const lostB = completed.find((match) => match.loser === b);
      if (!lostA && !lostB) return wins.get(b) - wins.get(a);
      if (!lostA) return -1;
      if (!lostB) return 1;
      if (wins.get(b) !== wins.get(a)) return wins.get(b) - wins.get(a);
      return lostB.completedAt - lostA.completedAt;
    });
    return ordered.map((member, index) => ({ member, rank: index + 1 }));
  }

  const grouped = [...state.members].sort((a, b) => {
    if (a === champion) return -1;
    if (b === champion) return 1;
    return wins.get(b) - wins.get(a);
  });
  let previousWins = null;
  let rank = 0;
  return grouped.map((member, index) => {
    const currentWins = champion === member ? Number.POSITIVE_INFINITY : wins.get(member);
    if (currentWins !== previousWins) rank = index + 1;
    previousWins = currentWins;
    return { member, rank };
  });
}

function normalizeTotal(items, totalBudget, minValue, maxValue) {
  if (!items.length) return [];
  const minPossible = minValue * items.length;
  const maxPossible = maxValue * items.length;
  const target = Math.min(Math.max(totalBudget, minPossible), maxPossible);
  let diff = target - items.reduce((sum, item) => sum + item.amount, 0);
  const ordered = [...items].sort((a, b) => b.rank - a.rank);

  while (diff !== 0) {
    let changed = false;
    for (const item of ordered) {
      if (diff > 0 && item.amount < maxValue) {
        item.amount += 1;
        diff -= 1;
        changed = true;
      } else if (diff < 0 && item.amount > minValue) {
        item.amount -= 1;
        diff += 1;
        changed = true;
      }
      if (diff === 0) break;
    }
    if (!changed) break;
  }

  return items;
}

function updateAverage(memberCount) {
  const count = memberCount || memberInput.value.split(/\n|,/).map((name) => name.trim()).filter(Boolean).length;
  const totalBudget = Math.max(0, Number(foodBudget.value || 0));
  averageShare.value = count ? `¥${Math.round(totalBudget / count).toLocaleString()}` : "¥0";
}

function startRoulette() {
  startRouletteButton.disabled = true;
  stopRouletteButton.disabled = false;
  state.rouletteTimer = window.setInterval(() => {
    setSelectedGame(games[Math.floor(Math.random() * games.length)]);
  }, 70);
}

function stopRoulette() {
  window.clearInterval(state.rouletteTimer);
  state.rouletteTimer = null;
  startRouletteButton.disabled = false;
  stopRouletteButton.disabled = true;
  setSelectedGame(games[Math.floor(Math.random() * games.length)]);
}

function setSelectedGame(game) {
  state.selectedGame = game;
  rouletteName.textContent = game.name;
  rouletteCategory.textContent = `${game.category} / No.${String(game.officialIndex).padStart(2, "0")}`;
  rouletteImage.innerHTML = `<img src="${game.imageUrl}" alt="${escapeHtml(game.name)}"><a class="fallback-mark" href="${game.sourceUrl}" target="_blank" rel="noopener">${escapeHtml(game.name)}</a>`;

  document.querySelectorAll(".game-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.name === game.name);
  });
}

function renderGameList() {
  gameList.innerHTML = "";
  games.forEach((game) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "game-chip";
    chip.dataset.name = game.name;
    chip.textContent = game.name;
    chip.addEventListener("click", () => setSelectedGame(game));
    gameList.append(chip);
  });
}

function roundName(index, total) {
  if (index === total - 1) return "決勝";
  if (index === total - 2) return "準決勝";
  return `${index + 1}回戦`;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nextPowerOfTwo(value) {
  return 2 ** Math.ceil(Math.log2(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

memberInput.addEventListener("input", () => updateAverage());
renderGameList();
updateAverage();
setSelectedGame(games[Math.floor(Math.random() * games.length)]);
