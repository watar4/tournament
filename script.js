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
  mainRounds: [],
  placementNodes: [],
  members: [],
  resultSequence: 0,
  rouletteTimer: null,
  rouletteDelay: 64,
  rouletteStopping: false,
  paymentIssue: "",
  selectedGame: null
};

const memberInput = document.querySelector("#memberInput");
const foodBudget = document.querySelector("#foodBudget");
const averageShare = document.querySelector("#averageShare");
const maxShare = document.querySelector("#maxShare");
const minShare = document.querySelector("#minShare");
const paymentStatus = document.querySelector("#paymentStatus");
const bracket = document.querySelector("#bracket");
const resultsPanel = document.querySelector("#resultsPanel");
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
  updateAverage();
});

document.querySelector("#createButton").addEventListener("click", createTournament);
document.querySelector("#resetWinnersButton").addEventListener("click", () => {
  if (state.members.length > 1) buildInitialRounds(state.members);
});
moneyInputs.forEach((input) => input.addEventListener("input", renderAll));
rankModeInputs.forEach((input) => input.addEventListener("change", () => {
  state.placementNodes = [];
  renderAll();
}));
memberInput.addEventListener("input", () => updateAverage());
startRouletteButton.addEventListener("click", startRoulette);
stopRouletteButton.addEventListener("click", stopRoulette);

function createTournament() {
  const members = memberInput.value.split(/\n|,/).map((name) => name.trim()).filter(Boolean);
  const uniqueMembers = [...new Set(members)];
  if (uniqueMembers.length < 2) {
    bracket.textContent = "2人以上の名前を入力してください。";
    bracket.className = "bracket empty-state";
    updateAverage(uniqueMembers.length);
    renderResults();
    return;
  }
  state.members = shuffle(uniqueMembers);
  buildInitialRounds(state.members);
}

function buildInitialRounds(members) {
  state.resultSequence = 0;
  state.placementNodes = [];
  const size = nextPowerOfTwo(members.length);
  const seeded = [...members, ...Array(size - members.length).fill("BYE")];
  const firstRound = [];

  for (let i = 0; i < seeded.length; i += 2) {
    const players = [seeded[i], seeded[i + 1]];
    firstRound.push({
      id: `m-0-${i / 2}`,
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
      id: `m-${roundIndex}-${index}`,
      players: [null, null],
      winner: null,
      loser: null,
      completedAt: null
    })));
    matchCount /= 2;
    roundIndex += 1;
  }

  state.mainRounds = rounds;
  propagateMainWinners();
  renderAll();
}

function selectMainWinner(roundIndex, matchIndex, winner) {
  const match = state.mainRounds[roundIndex][matchIndex];
  const loser = match.players.find((player) => player && player !== "BYE" && player !== winner) || null;
  match.winner = winner;
  match.loser = loser;
  match.completedAt = loser ? ++state.resultSequence : null;
  clearFollowingMain(roundIndex, matchIndex);
  state.placementNodes = [];
  propagateMainWinners();
  renderAll();
  if (isMainRoundComplete(roundIndex)) scrollToMainRound(roundIndex + 1);
  if (isFinalMatch(roundIndex, matchIndex)) document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearFollowingMain(roundIndex, matchIndex) {
  let nextRoundIndex = roundIndex + 1;
  let nextMatchIndex = Math.floor(matchIndex / 2);
  while (state.mainRounds[nextRoundIndex]) {
    const match = state.mainRounds[nextRoundIndex][nextMatchIndex];
    match.winner = null;
    match.loser = null;
    match.completedAt = null;
    nextRoundIndex += 1;
    nextMatchIndex = Math.floor(nextMatchIndex / 2);
  }
}

function propagateMainWinners() {
  for (let roundIndex = 1; roundIndex < state.mainRounds.length; roundIndex += 1) {
    state.mainRounds[roundIndex].forEach((match, matchIndex) => {
      const left = state.mainRounds[roundIndex - 1][matchIndex * 2]?.winner || null;
      const right = state.mainRounds[roundIndex - 1][matchIndex * 2 + 1]?.winner || null;
      match.players = [left, right];
      if (match.winner && !match.players.includes(match.winner)) {
        match.winner = null;
        match.loser = null;
        match.completedAt = null;
      }
    });
  }
}

function ensurePlacementNodes() {
  if (getRankMode() !== "strict" || !getChampion() || state.placementNodes.length) return;
  let startRank = 2;
  for (let roundIndex = state.mainRounds.length - 1; roundIndex >= 0; roundIndex -= 1) {
    const losers = state.mainRounds[roundIndex].map((match) => match.loser).filter(Boolean);
    if (losers.length === 1) startRank += 1;
    if (losers.length > 1) {
      state.placementNodes.push(createPlacementNode(shuffle(losers), startRank));
      startRank += losers.length;
    }
  }
}

function createPlacementNode(players, startRank) {
  const id = `p-${startRank}-${Math.random().toString(36).slice(2, 9)}`;
  if (players.length <= 1) return { id, players, startRank, matches: [], children: [] };
  const size = nextPowerOfTwo(players.length);
  const seeded = [...players, ...Array(size - players.length).fill("BYE")];
  const matches = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const pair = [seeded[i], seeded[i + 1]];
    matches.push({
      id: `${id}-${i / 2}`,
      players: pair,
      winner: pair.includes("BYE") ? pair.find((player) => player !== "BYE") : null,
      loser: null,
      completedAt: null
    });
  }
  return { id, players: seeded, startRank, matches, children: [] };
}

function selectPlacementWinner(nodeId, matchIndex, winner) {
  const node = findPlacementNode(nodeId, state.placementNodes);
  if (!node) return;
  const match = node.matches[matchIndex];
  match.winner = winner;
  match.loser = match.players.find((player) => player && player !== "BYE" && player !== winner) || null;
  match.completedAt = match.loser ? ++state.resultSequence : null;
  node.children = [];
  splitPlacementNode(node);
  renderAll();
  if (allStrictRanksDecided()) document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function splitPlacementNode(node) {
  const realPlayers = node.players.filter((player) => player !== "BYE");
  if (realPlayers.length <= 2) return;
  if (!node.matches.every((match) => match.winner && (match.loser || match.players.includes("BYE")))) return;
  const winners = node.matches.map((match) => match.winner).filter(Boolean);
  const losers = node.matches.map((match) => match.loser).filter(Boolean);
  node.children = [createPlacementNode(winners, node.startRank), createPlacementNode(losers, node.startRank + winners.length)]
    .filter((child) => child.players.length);
}

function findPlacementNode(id, nodes) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findPlacementNode(id, node.children || []);
    if (found) return found;
  }
  return null;
}

function renderAll() {
  updateAverage();
  ensurePlacementNodes();
  renderBracket();
  renderResults();
  renderPaymentNotice();
}

function renderBracket() {
  bracket.className = "bracket";
  bracket.innerHTML = "";
  if (!state.mainRounds.length) {
    state.paymentIssue = "";
    bracket.className = "bracket empty-state";
    bracket.textContent = "メンバーを入力してトーナメントを作成してください。";
    return;
  }

  const shares = calculateShares();
  state.mainRounds.forEach((round, roundIndex) => {
    const roundEl = renderRound(roundName(roundIndex, state.mainRounds.length), round, (match, matchIndex, player) => {
      selectMainWinner(roundIndex, matchIndex, player);
    }, shares);
    roundEl.dataset.mainRound = String(roundIndex);
    bracket.append(roundEl);
  });

  if (getRankMode() === "strict") {
    const divider = document.createElement("div");
    divider.className = "round placement-intro";
    divider.innerHTML = `<div class="round-title">順位決定戦</div><div class="placement-note">決勝後、敗者同士で順位を確定</div>`;
    bracket.append(divider);
    state.placementNodes.forEach((node) => renderPlacementNode(node, shares));
  }
}

function renderPlacementNode(node, shares) {
  splitPlacementNode(node);
  const realPlayers = node.players.filter((player) => player !== "BYE");
  const title = realPlayers.length === 2 ? `${node.startRank}位 / ${node.startRank + 1}位 決定戦` : `${node.startRank}-${node.startRank + realPlayers.length - 1}位 決定ブロック`;

  if (realPlayers.length === 1) {
    const round = document.createElement("div");
    round.className = "round";
    round.innerHTML = `<div class="round-title">${title}</div>`;
    const card = matchTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".match-title").textContent = `${node.startRank}位 確定`;
    card.querySelector(".players").append(renderPlayerButton(realPlayers[0], shares, true));
    round.append(card);
    bracket.append(round);
    return;
  }

  bracket.append(renderRound(title, node.matches, (match, matchIndex, player) => {
    selectPlacementWinner(node.id, matchIndex, player);
  }, shares));
  node.children.forEach((child) => renderPlacementNode(child, shares));
}

function renderRound(titleText, matches, onPick, shares) {
  const roundEl = document.createElement("div");
  roundEl.className = "round";
  const title = document.createElement("div");
  title.className = "round-title";
  title.textContent = titleText;
  roundEl.append(title);
  matches.forEach((match, matchIndex) => {
    const card = matchTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".match-title").textContent = `MATCH ${matchIndex + 1}`;
    const playersEl = card.querySelector(".players");
    match.players.forEach((player) => playersEl.append(renderPlayerButton(player, shares, false, match, matchIndex, onPick)));
    roundEl.append(card);
  });
  return roundEl;
}

function renderPlayerButton(player, shares, locked = false, match = null, matchIndex = 0, onPick = null) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "player-button";
  if (!player) {
    button.textContent = "勝者待ち";
    button.disabled = true;
    return button;
  }
  if (player === "BYE") {
    button.textContent = "シード";
    button.disabled = true;
    button.classList.add("bye");
    return button;
  }
  const share = shares.get(player) || { amount: 0, rankLabel: "-" };
  button.innerHTML = `<span class="player-name">${escapeHtml(player)}</span><span class="share">${share.rankLabel} / ${formatYen(share.amount)}</span>`;
  if (locked) button.disabled = true;
  if (match?.winner === player) button.classList.add("winner");
  if (onPick && !locked) button.addEventListener("click", () => onPick(match, matchIndex, player));
  return button;
}

function renderResults() {
  const champion = getChampion();
  if (!champion) {
    resultsPanel.className = "results-panel empty-state";
    resultsPanel.textContent = "決勝まで進むと結果を表示します。";
    return;
  }
  const strict = getRankMode() === "strict";
  const complete = !strict || allStrictRanksDecided();
  const shares = calculateShares();
  const standings = buildStandings(getRankMode());
  resultsPanel.className = "results-panel";
  resultsPanel.innerHTML = `
    <div class="winner-strip">
      <span>WINNER</span>
      <strong>${escapeHtml(champion)}</strong>
      <em>${formatYen(shares.get(champion)?.amount || 0)}</em>
    </div>
    ${strict && !complete ? '<p class="result-note">順位決定戦をすべて終えると、同率なしの支払いが確定します。</p>' : ''}
    <div class="result-table">
      ${standings.map((item) => {
        const share = shares.get(item.member) || { amount: 0, rankLabel: `${item.rank}位` };
        return `<div class="result-row"><span>${share.rankLabel}</span><strong>${escapeHtml(item.member)}</strong><em>${formatYen(share.amount)}</em></div>`;
      }).join("")}
    </div>`;
}

function calculateShares() {
  const totalBudget = Math.max(0, Number(foodBudget.value || 0));
  const winnerPay = Math.max(0, Number(minShare.value || 0));
  const loserPay = Math.max(winnerPay, Number(maxShare.value || winnerPay));
  const standings = buildStandings(getRankMode());
  const allocated = allocatePayments(standings, totalBudget, winnerPay, loserPay);
  state.paymentIssue = allocated.note;
  return new Map(allocated.items.map((item) => [item.member, { amount: item.amount, rankLabel: `${item.rank}位` }]));
}

function allocatePayments(standings, totalBudget, winnerPay, loserPay) {
  if (!standings.length) return { items: [], note: "" };
  if (standings.length === 1) return { items: [{ ...standings[0], amount: totalBudget }], note: "" };

  const maxRank = Math.max(...standings.map((item) => paymentRank(item)), 1);
  const items = standings.map((item) => {
    const rank = paymentRank(item);
    const ratio = maxRank === 1 ? 0 : (rank - 1) / (maxRank - 1);
    return { ...item, amount: Math.round(winnerPay + (loserPay - winnerPay) * ratio) };
  });

  const minPossible = winnerPay * items.length;
  const maxPossible = loserPay * items.length;
  let note = "";

  if (totalBudget < minPossible || totalBudget > maxPossible) {
    scalePaymentCurve(items, totalBudget);
    return { items, note };
  }

  const topCount = items.filter((item) => paymentRank(item) === 1).length;
  const bottomCount = items.filter((item) => paymentRank(item) === maxRank).length;
  const fixedMinTotal = winnerPay * (items.length - bottomCount) + loserPay * bottomCount;
  const fixedMaxTotal = winnerPay * topCount + loserPay * (items.length - topCount);
  const canKeepWinnerAndLoser = maxRank > 1 && totalBudget >= fixedMinTotal && totalBudget <= fixedMaxTotal;
  if (!canKeepWinnerAndLoser) {
    scalePaymentCurve(items, totalBudget);
    return { items, note };
  }

  normalizeIndividualAmounts(items, totalBudget, winnerPay, loserPay, canKeepWinnerAndLoser, maxRank);
  return { items, note };
}

function normalizeIndividualAmounts(items, totalBudget, winnerPay, loserPay, keepEndpoints, maxRank) {
  const candidates = items.filter((item) => !keepEndpoints || (paymentRank(item) !== 1 && paymentRank(item) !== maxRank));
  let diff = totalBudget - sumAmounts(items);
  distributeIndividualDiff(candidates, diff, winnerPay, loserPay);
  diff = totalBudget - sumAmounts(items);
  if (diff !== 0) distributeIndividualDiff(items, diff, winnerPay, loserPay);
}

function scalePaymentCurve(items, totalBudget) {
  const currentTotal = sumAmounts(items);
  if (currentTotal <= 0) {
    splitEvenly(items, totalBudget);
    return;
  }

  const scaled = items.map((item) => {
    const rawAmount = item.amount * totalBudget / currentTotal;
    return { item, amount: Math.floor(rawAmount), fraction: rawAmount % 1 };
  });
  let rest = totalBudget - scaled.reduce((sum, entry) => sum + entry.amount, 0);
  scaled.sort((a, b) => b.fraction - a.fraction || b.item.rank - a.item.rank).forEach((entry) => {
    if (rest <= 0) return;
    entry.amount += 1;
    rest -= 1;
  });
  scaled.forEach(({ item, amount }) => {
    item.amount = amount;
  });
}

function distributeIndividualDiff(items, diff, winnerPay, loserPay) {
  if (!items.length) return;
  const order = diff > 0 ? [...items].sort((a, b) => paymentRank(b) - paymentRank(a)) : [...items].sort((a, b) => paymentRank(a) - paymentRank(b));
  let cursor = 0;
  let guard = 0;
  while (diff !== 0 && guard < 100000) {
    const item = order[cursor % order.length];
    if (diff > 0 && item.amount < loserPay) {
      item.amount += 1;
      diff -= 1;
    } else if (diff < 0 && item.amount > winnerPay) {
      item.amount -= 1;
      diff += 1;
    }
    cursor += 1;
    guard += 1;
    if (cursor % order.length === 0 && !order.some((candidate) => diff > 0 ? candidate.amount < loserPay : candidate.amount > winnerPay)) break;
  }
}

function splitEvenly(items, totalBudget) {
  const base = Math.floor(totalBudget / items.length);
  let rest = totalBudget - base * items.length;
  items.sort((a, b) => b.rank - a.rank).forEach((item) => {
    item.amount = base + (rest > 0 ? 1 : 0);
    if (rest > 0) rest -= 1;
  });
}

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function buildStandings(rankMode) {
  const champion = getChampion();
  if (rankMode === "strict" && champion) return buildStrictStandings();
  return buildTieStandings();
}

function buildTieStandings() {
  const champion = getChampion();
  const wins = countMainWins();
  const eliminations = countEliminations();
  const grouped = [...state.members].sort((a, b) => {
    if (a === champion) return -1;
    if (b === champion) return 1;
    return wins.get(b) - wins.get(a)
      || (eliminations.get(b) || 0) - (eliminations.get(a) || 0)
      || a.localeCompare(b, "ja");
  });
  let previousWins = null;
  let rank = 0;
  return grouped.map((member, index) => {
    const currentWins = champion === member ? Number.POSITIVE_INFINITY : wins.get(member);
    if (currentWins !== previousWins) rank = index + 1;
    previousWins = currentWins;
    return { member, rank, paymentRank: index + 1 };
  });
}

function buildStrictStandings() {
  const finalMatch = state.mainRounds.at(-1)?.[0];
  const ranks = new Map();
  if (finalMatch?.winner) ranks.set(finalMatch.winner, 1);
  if (finalMatch?.loser) ranks.set(finalMatch.loser, 2);
  assignPlacementRanks(state.placementNodes, ranks);
  const wins = countMainWins();
  return [...state.members]
    .map((member) => ({ member, rank: ranks.get(member) || provisionalRank(member, wins) }))
    .sort((a, b) => a.rank - b.rank || a.member.localeCompare(b.member, "ja"))
    .map((item, index) => ({ ...item, paymentRank: index + 1 }));
}

function assignPlacementRanks(nodes, ranks) {
  nodes.forEach((node) => {
    splitPlacementNode(node);
    const realPlayers = node.players.filter((player) => player && player !== "BYE");
    if (realPlayers.length === 1) ranks.set(realPlayers[0], node.startRank);
    if (realPlayers.length === 2 && node.matches[0]?.winner && node.matches[0]?.loser) {
      ranks.set(node.matches[0].winner, node.startRank);
      ranks.set(node.matches[0].loser, node.startRank + 1);
    }
    assignPlacementRanks(node.children || [], ranks);
  });
}

function provisionalRank(member, wins) {
  const orderedWins = [...new Set([...wins.values()].sort((a, b) => b - a))];
  const index = orderedWins.indexOf(wins.get(member));
  return index < 0 ? state.members.length : index + 1;
}

function countMainWins() {
  const wins = new Map(state.members.map((member) => [member, 0]));
  state.mainRounds.flat().forEach((match) => {
    const realPlayers = match.players.filter((player) => player && player !== "BYE");
    if (match.winner && realPlayers.length === 2 && wins.has(match.winner)) wins.set(match.winner, wins.get(match.winner) + 1);
  });
  return wins;
}

function countEliminations() {
  const eliminations = new Map(state.members.map((member) => [member, 0]));
  state.mainRounds.flat().forEach((match) => {
    if (match.loser && eliminations.has(match.loser)) eliminations.set(match.loser, match.completedAt || 0);
  });
  return eliminations;
}

function allStrictRanksDecided() {
  if (getRankMode() !== "strict" || !getChampion()) return false;
  const ranks = new Map();
  const finalMatch = state.mainRounds.at(-1)?.[0];
  if (finalMatch?.winner) ranks.set(finalMatch.winner, 1);
  if (finalMatch?.loser) ranks.set(finalMatch.loser, 2);
  assignPlacementRanks(state.placementNodes, ranks);
  return ranks.size === state.members.length;
}

function getChampion() {
  return state.mainRounds.at(-1)?.[0]?.winner || null;
}

function getRankMode() {
  return document.querySelector('input[name="rankMode"]:checked')?.value || "ties";
}

function isFinalMatch(roundIndex, matchIndex) {
  return roundIndex === state.mainRounds.length - 1 && matchIndex === 0;
}

function paymentRank(item) {
  return item.paymentRank || item.rank;
}

function isMainRoundComplete(roundIndex) {
  const round = state.mainRounds[roundIndex];
  return Boolean(round?.length) && round.every((match) => match.winner);
}

function scrollToMainRound(roundIndex) {
  const target = bracket.querySelector(`[data-main-round="${roundIndex}"]`);
  if (!target) return;
  window.requestAnimationFrame(() => {
    const left = target.offsetLeft - bracket.offsetLeft;
    bracket.scrollTo({ left, behavior: "smooth" });
  });
}

function updateAverage() {
  const draftCount = new Set(memberInput.value.split(/\n|,/).map((name) => name.trim()).filter(Boolean)).size;
  const count = draftCount || state.members.length;
  const totalBudget = Math.max(0, Number(foodBudget.value || 0));
  averageShare.value = count ? formatYen(Math.round(totalBudget / count)) : "参加者未入力";
}

function renderPaymentNotice() {
  if (!paymentStatus) return;
  paymentStatus.textContent = state.paymentIssue;
  paymentStatus.classList.toggle("is-visible", Boolean(state.paymentIssue));
}

function startRoulette() {
  window.clearTimeout(state.rouletteTimer);
  state.rouletteStopping = false;
  state.rouletteDelay = 54;
  startRouletteButton.disabled = true;
  stopRouletteButton.disabled = false;
  spinRoulette();
}

function spinRoulette() {
  setSelectedGame(games[Math.floor(Math.random() * games.length)]);
  if (state.rouletteStopping) {
    state.rouletteDelay = Math.round(state.rouletteDelay * 1.2 + 22);
    if (state.rouletteDelay > 560) {
      finishRoulette();
      return;
    }
  }
  state.rouletteTimer = window.setTimeout(spinRoulette, state.rouletteDelay);
}

function stopRoulette() {
  if (state.rouletteStopping) return;
  state.rouletteStopping = true;
  stopRouletteButton.disabled = true;
  stopRouletteButton.textContent = "抽選中...";
}

function finishRoulette() {
  window.clearTimeout(state.rouletteTimer);
  state.rouletteTimer = null;
  state.rouletteStopping = false;
  startRouletteButton.disabled = false;
  stopRouletteButton.disabled = true;
  stopRouletteButton.textContent = "ストップ";
  rouletteImage.classList.add("is-hit");
  window.setTimeout(() => rouletteImage.classList.remove("is-hit"), 700);
}

function setSelectedGame(game) {
  state.selectedGame = game;
  rouletteName.textContent = game.name;
  rouletteCategory.textContent = `${game.category} / No.${String(game.officialIndex).padStart(2, "0")}`;

  let image = rouletteImage.querySelector("img");
  let label = rouletteImage.querySelector(".fallback-mark");
  if (!image || !label) {
    rouletteImage.innerHTML = '<img alt=""><a class="fallback-mark" target="_blank" rel="noopener"></a>';
    image = rouletteImage.querySelector("img");
    label = rouletteImage.querySelector(".fallback-mark");
  }
  if (image.getAttribute("src") !== game.imageUrl) image.src = game.imageUrl;
  image.alt = game.name;
  label.href = game.sourceUrl;
  label.textContent = game.name;
  document.querySelectorAll(".game-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.name === game.name));
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

function formatYen(value) {
  return `¥${Math.round(value).toLocaleString()}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

renderGameList();
updateAverage();
setSelectedGame(games[Math.floor(Math.random() * games.length)]);
renderResults();
