// Generated from canonical Site source. Run node scripts/build-background.cjs after changes.
const modules={},cache={};
modules["lib/xau/engine"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFromBars = calculateFromBars;
const xauMarketCriteria_1 = require("./xauMarketCriteria");
const xauPoi_1 = require("./xauPoi");
const xauAuditTypes_1 = require("./xauAuditTypes");
const DXY_SYMBOLS = ["EUR/USD", "USD/JPY", "GBP/USD", "USD/CAD", "USD/SEK", "USD/CHF"];
function ema(values, period) {
    const k = 2 / (period + 1);
    let value = values[0];
    for (let i = 1; i < values.length; i++)
        value = values[i] * k + value * (1 - k);
    return value;
}
function atr(bars, period = 14) {
    const recent = bars.slice(-(period + 1));
    const ranges = [];
    for (let i = 1; i < recent.length; i++) {
        const b = recent[i];
        const prev = recent[i - 1];
        ranges.push(Math.max(b.high - b.low, Math.abs(b.high - prev.close), Math.abs(b.low - prev.close)));
    }
    return ranges.reduce((a, b) => a + b, 0) / Math.max(1, ranges.length);
}
function structure(bars) {
    const recent = bars.slice(-12);
    const first = recent.slice(0, 6);
    const second = recent.slice(6);
    const high1 = Math.max(...first.map((b) => b.high));
    const high2 = Math.max(...second.map((b) => b.high));
    const low1 = Math.min(...first.map((b) => b.low));
    const low2 = Math.min(...second.map((b) => b.low));
    if (high2 > high1 && low2 > low1)
        return "ALCISTA";
    if (high2 < high1 && low2 < low1)
        return "BAJISTA";
    return "MIXTA";
}
function computeDxy(prices) {
    const eur = prices["EUR/USD"];
    const jpy = prices["USD/JPY"];
    const gbp = prices["GBP/USD"];
    const cad = prices["USD/CAD"];
    const sek = prices["USD/SEK"];
    const chf = prices["USD/CHF"];
    if (![eur, jpy, gbp, cad, sek, chf].every((v) => Number.isFinite(v) && v > 0))
        return null;
    return 50.14348112 * Math.pow(eur, -0.576) * Math.pow(jpy, 0.136) * Math.pow(gbp, -0.119) * Math.pow(cad, 0.091) * Math.pow(sek, 0.042) * Math.pow(chf, 0.036);
}
function calculateFromBars(providerBars, dxy, observedAt) {
    const prepared = (0, xauMarketCriteria_1.prepareMarketBars)(providerBars, observedAt);
    const { bars5, bars15 } = prepared;
    const close5 = bars5.map((b) => b.close);
    const close15 = bars15.map((b) => b.close);
    const lastBar = bars5[bars5.length - 1];
    const lastBarTimestamp = (0, xauAuditTypes_1.barTime)(lastBar);
    const atr5 = atr(bars5);
    const rsi5 = (0, xauMarketCriteria_1.technicalRsi)(close5);
    const emaFast5 = ema(close5.slice(-80), 9);
    const emaSlow5 = ema(close5.slice(-80), 21);
    const emaFast15 = ema(close15.slice(-60), 9);
    const emaSlow15 = ema(close15.slice(-60), 21);
    const s = structure(bars5);
    const dxyUsed = (0, xauMarketCriteria_1.usableDxy)(dxy, observedAt);
    const factors = [];
    let score = 0;
    const add = (label, points, note) => {
        score += points;
        factors.push({ label, points, note });
    };
    add("Tendencia 5m", emaFast5 > emaSlow5 ? 12 : -12, emaFast5 > emaSlow5 ? "EMA 9 por encima de EMA 21" : "EMA 9 por debajo de EMA 21");
    add("Tendencia 15m", emaFast15 > emaSlow15 ? 18 : -18, emaFast15 > emaSlow15 ? "Marco 15m acompaña al alza" : "Marco 15m acompaña a la baja");
    if (rsi5 >= 55)
        add("Momentum RSI", 10, `RSI ${rsi5.toFixed(1)} con impulso comprador`);
    else if (rsi5 <= 45)
        add("Momentum RSI", -10, `RSI ${rsi5.toFixed(1)} con impulso vendedor`);
    else
        add("Momentum RSI", 0, `RSI ${rsi5.toFixed(1)} neutral`);
    add("Estructura", s === "ALCISTA" ? 15 : s === "BAJISTA" ? -15 : 0, s === "MIXTA" ? "Máximos y mínimos sin dirección limpia" : `Estructura ${s.toLowerCase()}`);
    const momentum = lastBar.close - bars5[Math.max(0, bars5.length - 4)].close;
    if (Math.abs(momentum) > atr5 * 0.35)
        add("Impulso 15m", momentum > 0 ? 8 : -8, momentum > 0 ? "Desplazamiento reciente comprador" : "Desplazamiento reciente vendedor");
    else
        add("Impulso 15m", 0, "Sin desplazamiento suficiente");
    const prior = bars5.slice(-10, -1);
    const priorLow = Math.min(...prior.map((b) => b.low));
    const priorHigh = Math.max(...prior.map((b) => b.high));
    if (lastBar.low < priorLow && lastBar.close > priorLow)
        add("Liquidez", 12, "Barrido de mínimos y recuperación");
    else if (lastBar.high > priorHigh && lastBar.close < priorHigh)
        add("Liquidez", -12, "Barrido de máximos y rechazo");
    else
        add("Liquidez", 0, "Sin barrido confirmado en la última barra");
    if (dxyUsed && dxy?.previousDxy) {
        const change = (dxy.dxy - dxy.previousDxy) / dxy.previousDxy;
        if (change <= -0.0005)
            add("DXY sintético", 8, `Dólar debilitándose (${(change * 100).toFixed(2)}%)`);
        else if (change >= 0.0005)
            add("DXY sintético", -8, `Dólar fortaleciéndose (+${(change * 100).toFixed(2)}%)`);
        else
            add("DXY sintético", 0, "Dólar sin cambio material en la última lectura");
    }
    else {
        add("DXY sintético", 0, "DXY excluido: faltan lecturas recientes con intervalo conocido");
    }
    const side = prepared.reasons.length > 0 ? "NO TRADE" : score >= 52 ? "BUY" : score <= -52 ? "SELL" : "NO TRADE";
    const absScore = Math.min(100, Math.abs(score));
    const confidence = Math.round(Math.min(92, 50 + absScore * 0.5));
    let entryLow = null;
    let entryHigh = null;
    let stop = null;
    let tp = null;
    let rr = null;
    if (side !== "NO TRADE") {
        const anchor = emaFast5;
        entryLow = side === "BUY" ? anchor - atr5 * 0.18 : anchor - atr5 * 0.05;
        entryHigh = side === "BUY" ? anchor + atr5 * 0.05 : anchor + atr5 * 0.18;
        const entryMid = (entryLow + entryHigh) / 2;
        const swingLow = Math.min(...bars5.slice(-12).map((b) => b.low));
        const swingHigh = Math.max(...bars5.slice(-12).map((b) => b.high));
        stop = side === "BUY" ? Math.min(swingLow - atr5 * 0.15, entryMid - atr5 * 1.05) : Math.max(swingHigh + atr5 * 0.15, entryMid + atr5 * 1.05);
        const risk = Math.abs(entryMid - stop);
        tp = side === "BUY" ? entryMid + risk * 2 : entryMid - risk * 2;
        rr = 2;
    }
    const quality = side === "NO TRADE" ? "—" : absScore >= 65 ? "A" : absScore >= 52 ? "B" : "C";
    const signal = {
        timestamp: observedAt,
        modelVersion: xauAuditTypes_1.MODEL_VERSION,
        dataQuality: { ok: prepared.reasons.length === 0, reasons: prepared.reasons, closedAt: prepared.closedAt, dxyUsed },
        side,
        horizon: "INTRADÍA",
        score,
        confidence,
        entryLow,
        entryHigh,
        stop,
        tp,
        rr,
        quality,
        atr: atr5,
        rsi: rsi5,
        emaFast5,
        emaSlow5,
        emaFast15,
        emaSlow15,
        structure: s,
        factors,
        source: "Twelve Data · XAU/USD 5m + 15m agregado + DXY sintético",
        probabilityCalibrated: false,
    };
    signal.poi = (0, xauPoi_1.assessPoi)(signal, bars15, observedAt);
    return {
        signal,
        xau: prepared.providerBars5[prepared.providerBars5.length - 1].close,
        dxy: dxy?.dxy ?? null,
        prices: dxy?.prices ?? {},
        lastBar,
        lastBarTimestamp,
        audit: { bars5, bars15, providerBars5: prepared.providerBars5, dxySnapshot: dxy },
    };
}

};
modules["lib/xau/xauMarketCriteria"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_POLICY = void 0;
exports.aggregateClosed15 = aggregateClosed15;
exports.prepareMarketBars = prepareMarketBars;
exports.usableDxy = usableDxy;
exports.technicalRsi = technicalRsi;
const xauAuditTypes_1 = require("./xauAuditTypes");
exports.DATA_POLICY = { maxClosedAgeMs: 10 * 60_000, recentBars: 12, maxDxyAgeMs: 35 * 60_000, minDxyComparisonMs: 15 * 60_000, maxDxyComparisonMs: 90 * 60_000 };
// Clock-aligned UTC buckets. Missing components never become a synthetic full candle.
function aggregateClosed15(bars) {
    const buckets = new Map();
    for (const b of bars) {
        const start = Math.floor((0, xauAuditTypes_1.barTime)(b) / (3 * xauAuditTypes_1.BAR_MS)) * 3 * xauAuditTypes_1.BAR_MS;
        const group = buckets.get(start) ?? [];
        group.push(b);
        buckets.set(start, group);
    }
    return [...buckets.entries()].sort((a, b) => a[0] - b[0]).flatMap(([start, group]) => {
        group.sort((a, b) => (0, xauAuditTypes_1.barTime)(a) - (0, xauAuditTypes_1.barTime)(b));
        if (group.length !== 3 || group.some((b, i) => (0, xauAuditTypes_1.barTime)(b) !== start + i * xauAuditTypes_1.BAR_MS))
            return [];
        return [{ datetime: new Date(start).toISOString(), open: group[0].open, close: group[2].close,
                high: Math.max(...group.map(b => b.high)), low: Math.min(...group.map(b => b.low)) }];
    });
}
function prepareMarketBars(input, observedAt) {
    const unique = new Map();
    for (const b of input) {
        const at = (0, xauAuditTypes_1.barTime)(b);
        if (!Number.isFinite(at) || at % xauAuditTypes_1.BAR_MS !== 0 || ![b.open, b.high, b.low, b.close].every(v => Number.isFinite(v) && v > 0)
            || b.high < Math.max(b.open, b.close, b.low) || b.low > Math.min(b.open, b.close, b.high)) {
            throw new Error("Vela de mercado inválida: no se genera una señal.");
        }
        const previous = unique.get(at);
        if (previous && ["open", "high", "low", "close"].some(k => previous[k] !== b[k])) {
            throw new Error("Velas duplicadas con valores distintos: no se genera una señal.");
        }
        unique.set(at, b);
    }
    const providerBars5 = [...unique.values()].sort((a, b) => (0, xauAuditTypes_1.barTime)(a) - (0, xauAuditTypes_1.barTime)(b));
    const bars5 = providerBars5.filter(b => (0, xauAuditTypes_1.barTime)(b) + xauAuditTypes_1.BAR_MS <= observedAt);
    const bars15 = aggregateClosed15(bars5);
    if (bars5.length < 90 || bars15.length < 26)
        throw new Error("No hay suficientes velas cerradas para calcular el modelo.");
    const lastBar = bars5[bars5.length - 1];
    const closedAt = (0, xauAuditTypes_1.barTime)(lastBar) + xauAuditTypes_1.BAR_MS;
    const reasons = [];
    if (observedAt - closedAt > exports.DATA_POLICY.maxClosedAgeMs)
        reasons.push("El último cierre de 5m tiene más de 10 minutos de antigüedad.");
    const recent = bars5.slice(-exports.DATA_POLICY.recentBars);
    if (recent.some((b, i) => i > 0 && (0, xauAuditTypes_1.barTime)(b) - (0, xauAuditTypes_1.barTime)(recent[i - 1]) !== xauAuditTypes_1.BAR_MS))
        reasons.push("Hay huecos en la última hora de velas de 5m.");
    if (providerBars5.some(b => (0, xauAuditTypes_1.barTime)(b) > observedAt))
        reasons.push("El proveedor incluye velas con fecha futura.");
    return { providerBars5, bars5, bars15, lastBar, closedAt, reasons };
}
function usableDxy(dxy, observedAt) {
    if (!dxy || ![dxy.dxy, dxy.previousDxy, dxy.timestamp, dxy.previousTimestamp].every(v => typeof v === "number" && Number.isFinite(v))
        || dxy.dxy <= 0 || dxy.previousDxy <= 0)
        return false;
    const age = observedAt - dxy.timestamp;
    const interval = dxy.timestamp - dxy.previousTimestamp;
    return age >= 0 && age <= exports.DATA_POLICY.maxDxyAgeMs && interval >= exports.DATA_POLICY.minDxyComparisonMs && interval <= exports.DATA_POLICY.maxDxyComparisonMs;
}
function technicalRsi(values, period = 14) {
    const recent = values.slice(-(period + 1));
    let gains = 0, losses = 0;
    for (let i = 1; i < recent.length; i++) {
        const delta = recent[i] - recent[i - 1];
        if (delta >= 0)
            gains += delta;
        else
            losses -= delta;
    }
    if (gains === 0 && losses === 0)
        return 50;
    if (losses === 0)
        return 100;
    return 100 - 100 / (1 + gains / losses);
}

};
modules["lib/xau/xauPoi"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POI_POLICY = void 0;
exports.detectPoiZones = detectPoiZones;
exports.assessPoi = assessPoi;
const xauAuditTypes_1 = require("./xauAuditTypes");
exports.POI_POLICY = { version: "xau-poi-0.1.0", mode: "shadow", pivotLeft: 2, pivotRight: 2, maxAgeMs: 8 * 60 * 60_000, halfWidthAtr: 0.2, targetBufferAtr: 0.2 };
// A pivot becomes available only after both confirming candles have closed.
function detectPoiZones(bars15, atr, observedAt) {
    if (!Number.isFinite(atr) || atr <= 0)
        return [];
    const bars = bars15.filter(b => (0, xauAuditTypes_1.barTime)(b) + 900_000 <= observedAt).slice().sort((a, b) => (0, xauAuditTypes_1.barTime)(a) - (0, xauAuditTypes_1.barTime)(b));
    const zones = [];
    for (let i = 2; i < bars.length - 2; i++) {
        const window = bars.slice(i - 2, i + 3);
        if (window.some((b, j) => j > 0 && (0, xauAuditTypes_1.barTime)(b) - (0, xauAuditTypes_1.barTime)(window[j - 1]) !== 900_000))
            continue;
        const pivot = bars[i], confirmedAt = (0, xauAuditTypes_1.barTime)(bars[i + 2]) + 900_000;
        if (observedAt - confirmedAt > exports.POI_POLICY.maxAgeMs)
            continue;
        for (const kind of ["support", "resistance"]) {
            const value = kind === "support" ? pivot.low : pivot.high;
            const confirmed = window.every((b, j) => j === 2 || (kind === "support" ? value < b.low : value > b.high));
            if (!confirmed)
                continue;
            const low = value - atr * exports.POI_POLICY.halfWidthAtr, high = value + atr * exports.POI_POLICY.halfWidthAtr;
            const broken = bars.slice(i + 3).some(b => kind === "support" ? b.close < low : b.close > high);
            if (!broken)
                zones.push({ kind, low, high, formedAt: (0, xauAuditTypes_1.barTime)(pivot), confirmedAt, timeframe: "15m" });
        }
    }
    return zones;
}
function assessPoi(signal, bars15, observedAt) {
    const zones = detectPoiZones(bars15, signal.atr, observedAt);
    const out = { version: exports.POI_POLICY.version, mode: "shadow", baseSide: signal.side, side: "NO TRADE", reasons: [], zones, entryZone: null, obstacle: null, freeR: null };
    if (signal.side === "NO TRADE" || signal.entryLow == null || signal.entryHigh == null || signal.stop == null || signal.tp == null) {
        out.reasons.push("El motor principal no propone una entrada.");
        return out;
    }
    const buy = signal.side === "BUY", mid = (signal.entryLow + signal.entryHigh) / 2, risk = Math.abs(mid - signal.stop);
    if (risk <= 0 || !Number.isFinite(risk)) {
        out.reasons.push("El riesgo del plan no es válido.");
        return out;
    }
    const aligned = buy ? signal.emaFast5 > signal.emaSlow5 && signal.emaFast15 > signal.emaSlow15 && signal.structure === "ALCISTA"
        : signal.emaFast5 < signal.emaSlow5 && signal.emaFast15 < signal.emaSlow15 && signal.structure === "BAJISTA";
    if (!aligned)
        out.reasons.push("Tendencia de 5m, 15m y estructura sin alineación completa.");
    const entries = zones.filter(z => z.kind === (buy ? "support" : "resistance") && z.low <= signal.entryHigh && z.high >= signal.entryLow)
        .sort((a, b) => Math.abs((a.low + a.high) / 2 - mid) - Math.abs((b.low + b.high) / 2 - mid));
    out.entryZone = entries[0] ?? null;
    if (!out.entryZone)
        out.reasons.push("La entrada no coincide con una zona confirmada de 15m.");
    const obstacles = zones.filter(z => z.kind === (buy ? "resistance" : "support") && (buy ? z.high >= mid : z.low <= mid))
        .sort((a, b) => buy ? a.low - b.low : b.high - a.high);
    out.obstacle = obstacles[0] ?? null;
    if (out.obstacle) {
        const distance = buy ? out.obstacle.low - mid : mid - out.obstacle.high;
        out.freeR = Math.max(0, distance - signal.atr * exports.POI_POLICY.targetBufferAtr) / risk;
        if (out.freeR < (signal.rr ?? 2))
            out.reasons.push("Hay una zona contraria antes del TP previsto.");
    }
    if (out.reasons.length === 0) {
        out.side = signal.side;
        out.reasons.push(out.obstacle ? "Entrada en POI confirmado y recorrido hasta el TP sin obstáculo detectado." : "Entrada en POI confirmado; no se detecta zona contraria en la ventana analizada.");
    }
    return out;
}

};
modules["lib/xau/xauAuditTypes"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_POLICY = exports.BAR_MS = exports.AUDIT_VERSION = exports.LIFECYCLE_VERSION = exports.MODEL_VERSION = void 0;
exports.barTime = barTime;
exports.MODEL_VERSION = "xau-rules-1.1.0";
exports.LIFECYCLE_VERSION = "xau-lifecycle-2.0.1";
exports.AUDIT_VERSION = 2;
exports.BAR_MS = 300_000;
function barTime(bar) {
    const raw = bar.datetime.replace(" ", "T");
    return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(raw) ? raw : raw + "Z");
}
exports.MODEL_POLICY = {
    emaPeriods: [9, 21], rsiPeriod: 14, atrPeriod: 14,
    sideThreshold: 52, qualityAThreshold: 65, confidenceCap: 92,
    weights: { trend5: 12, trend15: 18, rsi: 10, structure: 15, momentum: 8, liquidity: 12, dxy: 8 },
    entryAtr: { buyLow: -0.18, buyHigh: 0.05, sellLow: -0.05, sellHigh: 0.18 },
    stopAtr: { swingBuffer: 0.15, minimum: 1.05 }, targetR: 2,
    bars5: 240, aggregation15: "UTC quarter-hour buckets; three closed consecutive 5m components",
    indicatorBarPolicy: "closed 5m and complete UTC-aligned 15m bars only",
    dataGate: { maxClosedAgeMinutes: 10, recentConsecutiveBars: 12, invalidOrConflictingBars: "reject" },
    dxyGate: { maxAgeMinutes: 35, comparisonIntervalMinutes: [15, 90], unknownPreviousTimestamp: "exclude" },
    confidenceField: "legacy display index, retained for compatibility; UI uses absolute score points",
    poiPolicy: "xau-poi-0.1.0 shadow only; never authorizes or blocks production signals",
    lifecycleBarPolicy: "closed 5m bars starting after publication; same-bar entry/exit is ambiguous",
    entryReference: "midpoint of frozen entry zone; hypothetical, no broker fill",
    costs: "spread, slippage, commission and broker P/L are unknown",
    excursions: "complete bars after entry and before exit; exclude entry/exit bars",
    learning: "archive only; no automatic production retraining",
};

};
modules["lib/xau/xauLifecycle"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reachedOutcome = reachedOutcome;
exports.evaluateLifecycle = evaluateLifecycle;
const xauAuditTypes_1 = require("./xauAuditTypes");
function reachedOutcome(s, b) {
    if (s.stop == null || s.tp == null)
        return null;
    const sl = s.side === "BUY" ? b.low <= s.stop : b.high >= s.stop;
    const tp = s.side === "BUY" ? b.high >= s.tp : b.low <= s.tp;
    return sl && tp ? "AMBIGUOUS" : sl ? "SL" : tp ? "TP" : null;
}
function evaluateLifecycle(original, status, bars, model, observedAt, scanId) {
    const p = { ...original, flags: [...(original.flags ?? [])] };
    const events = [];
    const flag = (value) => { if (!p.flags.includes(value))
        p.flags.push(value); };
    const emit = (eventType, key, extra) => events.push({
        eventType, eventKey: key, payload: {
            auditVersion: xauAuditTypes_1.AUDIT_VERSION, lifecycleVersion: xauAuditTypes_1.LIFECYCLE_VERSION,
            frozenSignal: p.signal, scanId, observedAt,
            flags: [...p.flags], evolution: { observations: p.observations ?? 0, favorableLowerBound: p.favorable ?? null, adverseLowerBound: p.adverse ?? null }, entryReference: "zone-midpoint", brokerExecution: false, ...extra,
        },
    });
    if (p.lastScanAt != null && observedAt <= p.lastScanAt)
        return { payload: p, status, events };
    if (p.auditVersion !== xauAuditTypes_1.AUDIT_VERSION)
        flag("legacy-partial-history");
    const start = p.lastBarAt ?? Math.ceil(p.createdAt / xauAuditTypes_1.BAR_MS) * xauAuditTypes_1.BAR_MS - xauAuditTypes_1.BAR_MS;
    const fresh = bars.filter(b => (0, xauAuditTypes_1.barTime)(b) > start && (0, xauAuditTypes_1.barTime)(b) >= p.createdAt && (0, xauAuditTypes_1.barTime)(b) + xauAuditTypes_1.BAR_MS <= observedAt)
        .sort((a, b) => (0, xauAuditTypes_1.barTime)(a) - (0, xauAuditTypes_1.barTime)(b));
    for (const b of fresh) {
        if (status !== "pending-entry" && status !== "triggered")
            break;
        const at = (0, xauAuditTypes_1.barTime)(b);
        if (p.lastBarAt != null && at <= p.lastBarAt)
            continue;
        if (at > (p.lastBarAt ?? start) + xauAuditTypes_1.BAR_MS)
            flag("data-gap");
        const overlap = p.signal.entryLow != null && p.signal.entryHigh != null && b.high >= p.signal.entryLow && b.low <= p.signal.entryHigh;
        const before = status;
        const outcome = reachedOutcome(p.signal, b);
        if (status === "pending-entry" && overlap) {
            p.activatedAt = at;
            status = "triggered";
            emit("ENTRY_REACHED", "ENTRY_REACHED", { bar: b, barAt: at, effectiveAt: at, timePrecision: "5m interval", model });
            if (outcome) {
                flag("entry-exit-order-unknown");
                status = "resolved";
                emit("AMBIGUOUS", "TERMINAL", { bar: b, barAt: at, effectiveAt: at, reason: "Entry and a boundary occur in the same bar; intrabar order is unknown.", resultR: null });
            }
        }
        else if (status === "triggered" && outcome) {
            if (outcome === "AMBIGUOUS")
                flag("tp-sl-order-unknown");
            status = "resolved";
            const mid = p.signal.entryLow != null && p.signal.entryHigh != null ? (p.signal.entryLow + p.signal.entryHigh) / 2 : null;
            const risk = mid != null && p.signal.stop != null ? Math.abs(mid - p.signal.stop) : 0;
            const exit = outcome === "TP" ? p.signal.tp : outcome === "SL" ? p.signal.stop : null;
            const resultR = p.flags.length === 0 && risk > 0 && exit != null && mid != null
                ? (p.signal.side === "BUY" ? exit - mid : mid - exit) / risk : null;
            emit(outcome, "TERMINAL", { bar: b, barAt: at, effectiveAt: at, model, resultR, exitReference: exit, durationMinutesApprox: p.activatedAt == null ? null : (at - p.activatedAt) / 60_000 });
        }
        else if (status === "triggered" && before === "triggered") {
            const mid = p.signal.entryLow != null && p.signal.entryHigh != null ? (p.signal.entryLow + p.signal.entryHigh) / 2 : null;
            if (mid != null) {
                const favorable = p.signal.side === "BUY" ? b.high - mid : mid - b.low;
                const adverse = p.signal.side === "BUY" ? mid - b.low : b.high - mid;
                p.favorable = Math.max(p.favorable ?? 0, favorable, 0);
                p.adverse = Math.max(p.adverse ?? 0, adverse, 0);
            }
        }
        p.observations = (p.observations ?? 0) + 1;
        emit("OBSERVATION", "BAR:" + at, { bar: b, barAt: at, stateBefore: before, stateAfter: status, price: b.close, favorableLowerBound: p.favorable ?? null, adverseLowerBound: p.adverse ?? null });
        p.lastBarAt = at;
    }
    if (status === "pending-entry" && model.dataQuality?.ok !== false && (model.side === "NO TRADE" || model.side !== p.signal.side)) {
        status = "invalidated";
        emit("INVALIDATED", "TERMINAL", { model, effectiveAt: observedAt, reason: model.side === "NO TRADE" ? "Model no longer supports an entry." : "Model direction changed before activation." });
    }
    p.lastScanAt = observedAt;
    return { payload: p, status, events };
}

};
modules["lib/xau/macroContext"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MACRO_SNAPSHOT = exports.NEWS_RISK_POLICY = void 0;
exports.evaluateMacroRisk = evaluateMacroRisk;
exports.NEWS_RISK_POLICY = {
    version: "xau-news-risk-0.1.0", mode: "diagnostic-shadow", frozenAt: 1791268258511,
    windowsMinutes: { release: { before: 15, after: 30 }, fomc: { before: 30, after: 60 }, speech: { before: 15, after: 30 }, other: { before: 10, after: 15 } },
    productionBlocks: false, automaticInvalidation: false, directionalPoints: false,
    scope: "Provisional risk windows, not a validated strategy; independent lifecycle trial pending"
};
exports.MACRO_SNAPSHOT = {
    "version": "xau-macro-snapshot-0.1.2",
    "instrument": "XAU/USD",
    "firstObservedAt": 1791268258511,
    "updatedAt": 1791443373000,
    "feedActive": false,
    "coverage": "partial",
    "maxAgeMs": 21600000,
    "sourceTimezone": "America/New_York",
    "displayTimezone": "Europe/Madrid",
    "sources": [
        {
            "name": "BLS",
            "url": "https://www.bls.gov/schedule/2026/10_sched.htm",
            "sourceUpdatedAt": "2026-02-18",
            "observedAt": 1791443373000,
            "coverage": "Calendario nacional de octubre; selección de publicaciones materiales"
        },
        {
            "name": "BEA",
            "url": "https://www.bea.gov/news/schedule",
            "sourceUpdatedAt": "2026-10-08",
            "observedAt": 1791443373000,
            "coverage": "Calendario de comercio, PIB e ingresos/gastos; no consenso"
        },
        {
            "name": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceUpdatedAt": "2025-06-24",
            "observedAt": 1791443373000,
            "coverage": "Calendario del Board: actas, FOMC y comparecencias; no todos los bancos regionales"
        },
        {
            "name": "DOL",
            "url": "https://www.dol.gov/ui/data.pdf",
            "sourceUpdatedAt": "2026-10-01",
            "observedAt": 1791443373000,
            "coverage": "PDF del 1 de octubre sigue disponible el 8; no confirma la hora de la próxima publicación de solicitudes."
        },
        {
            "name": "Federal Reserve · actas publicadas",
            "url": "https://www.federalreserve.gov/monetarypolicy/fomcminutes20260916.htm",
            "sourceUpdatedAt": "2026-10-07",
            "observedAt": 1791443373000,
            "coverage": "Actas publicadas de septiembre. Hora real de disponibilidad inicial no reconstruida con esta consulta."
        }
    ],
    "missing": [
        "Calendario integral de otros emisores y bancos regionales de la Fed",
        "Ingesta automática de cambios de calendario y resultados",
        "Feed continuo de noticias económicas/geopolíticas",
        "Consenso fechado, sorpresas, bid/ask y costes del broker",
        "Archivo histórico de noticias punto-en-tiempo",
        "DOL: próxima hora exacta de solicitudes semanales no confirmada; el PDF consultado corresponde al 1 de octubre."
    ],
    "events": [
        {
            "id": "employment-20261002",
            "title": "Empleo de EE. UU. · septiembre",
            "kind": "release",
            "source": "BLS",
            "url": "https://www.bls.gov/schedule/2026/10_sched.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-02T08:30:00",
            "scheduledAt": 1790944200000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791268258511,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "us-trade-20261006",
            "title": "Balanza comercial de EE. UU.",
            "kind": "other",
            "source": "BEA",
            "url": "https://www.bea.gov/news/schedule",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-06T08:30:00",
            "scheduledAt": 1791289800000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791268258511,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "fed-bowman-20261006",
            "title": "Bowman · regulación y supervisión",
            "kind": "speech",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-06T10:45:00",
            "scheduledAt": 1791297900000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791268258511,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "fomc-minutes-20261007",
            "title": "Actas FOMC · reunión de septiembre",
            "kind": "fomc",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-07T14:00:00",
            "scheduledAt": 1791396000000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791354326609,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "fed-waller-20261008",
            "title": "Waller · perspectivas económicas",
            "kind": "speech",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-08T04:30:00",
            "scheduledAt": 1791448200000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "cpi-20261014",
            "title": "IPC de EE. UU. · septiembre",
            "kind": "release",
            "source": "BLS",
            "url": "https://www.bls.gov/schedule/2026/10_sched.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-14T08:30:00",
            "scheduledAt": 1791981000000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "beige-book-20261014",
            "title": "Beige Book de la Fed",
            "kind": "other",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-14T14:00:00",
            "scheduledAt": 1792000800000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "ppi-20261015",
            "title": "IPP de EE. UU. · septiembre",
            "kind": "release",
            "source": "BLS",
            "url": "https://www.bls.gov/schedule/2026/10_sched.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-15T08:30:00",
            "scheduledAt": 1792067400000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "fomc-decision-20261028",
            "title": "Decisión FOMC",
            "kind": "fomc",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-28T14:00:00",
            "scheduledAt": 1793210400000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "fomc-press-20261028",
            "title": "Rueda de prensa FOMC",
            "kind": "fomc",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-28T14:30:00",
            "scheduledAt": 1793212200000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "gdp-20261029",
            "title": "PIB EE. UU. · avance tercer trimestre",
            "kind": "release",
            "source": "BEA",
            "url": "https://www.bea.gov/news/schedule",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-29T08:30:00",
            "scheduledAt": 1793277000000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "pce-20261029",
            "title": "PCE e ingresos/gastos · septiembre",
            "kind": "release",
            "source": "BEA",
            "url": "https://www.bea.gov/news/schedule",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-29T08:30:00",
            "scheduledAt": 1793277000000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "eci-20261030",
            "title": "Coste del empleo de EE. UU.",
            "kind": "release",
            "source": "BLS",
            "url": "https://www.bls.gov/schedule/2026/10_sched.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-30T08:30:00",
            "scheduledAt": 1793363400000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791268258511,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "consumer-credit-20261007",
            "title": "Crédito al consumo de EE. UU.",
            "kind": "other",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-07T15:00:00",
            "scheduledAt": 1791399600000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791354326609,
            "updatedAt": 1791354326609,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        },
        {
            "id": "fed-reserves-20261008",
            "title": "Fed · balance y reservas H.4.1",
            "kind": "other",
            "source": "Federal Reserve",
            "url": "https://www.federalreserve.gov/newsevents/2026-october.htm",
            "sourceTimezone": "America/New_York",
            "sourceLocalTime": "2026-10-08T16:30:00",
            "scheduledAt": 1791491400000,
            "actualPublishedAt": null,
            "firstObservedAt": 1791443373000,
            "updatedAt": 1791443373000,
            "consensus": null,
            "surprise": null,
            "instrument": "XAU/USD"
        }
    ],
    "reports": [
        {
            "id": "reuters-gold-20261008",
            "title": "Reuters: el oro se estabiliza tras caer; el mercado valora el debate de la Fed sobre inflación y tipos.",
            "source": "Reuters",
            "url": "https://www.reuters.com/world/india/gold-edges-higher-after-hitting-two-month-low-2026-10-08/",
            "publishedAt": 1791422460000,
            "eventAt": null,
            "sourceUpdatedAt": null,
            "firstObservedAt": 1791443373000,
            "updatedAt": 1791443373000,
            "ingestionLagMs": 20913000,
            "category": "economic",
            "instrument": "XAU/USD",
            "coverage": "Consulta fechada; precisión de publicación de un minuto. Hora de revisión y de shock desconocidas; contenido observado por la app en esta revisión, no conocido retrospectivamente."
        },
        {
            "id": "reuters-markets-20261008",
            "title": "Reuters informa de nuevos ataques a buques en el Golfo y presión del petróleo sobre los bonos. No implica una dirección automática para el oro.",
            "source": "Reuters",
            "url": "https://www.reuters.com/world/china/global-markets-global-markets-2026-10-08/",
            "publishedAt": 1791421020000,
            "eventAt": null,
            "sourceUpdatedAt": null,
            "firstObservedAt": 1791443373000,
            "updatedAt": 1791443373000,
            "ingestionLagMs": 22353000,
            "category": "geopolitical",
            "instrument": "XAU/USD",
            "coverage": "Consulta fechada; precisión de publicación de un minuto. Hora de revisión y de shock desconocidas; contenido observado por la app en esta revisión, no conocido retrospectivamente."
        }
    ]
};
/** Only information first observed by now is eligible. Expiry never means no risk. */
function evaluateMacroRisk(now = Date.now(), snapshot = exports.MACRO_SNAPSHOT) {
    const known = now >= snapshot.firstObservedAt;
    const fresh = known && now >= snapshot.updatedAt && now - snapshot.updatedAt <= snapshot.maxAgeMs;
    const events = known ? snapshot.events.filter(e => e.firstObservedAt <= now).map(e => ({ ...e })) : [];
    const windows = events.filter(e => {
        const w = exports.NEWS_RISK_POLICY.windowsMinutes[e.kind];
        return now >= e.scheduledAt - w.before * 60000 && now <= e.scheduledAt + w.after * 60000;
    });
    const next = events.filter(e => e.scheduledAt >= now).sort((a, b) => a.scheduledAt - b.scheduledAt)[0] ?? null;
    return {
        version: exports.NEWS_RISK_POLICY.version, instrument: "XAU/USD", observedAt: now,
        sourceObservedAt: known ? snapshot.updatedAt : null, ageMs: known ? now - snapshot.updatedAt : null,
        feedActive: false, coverage: "partial", fresh, coverageUnknown: true,
        status: !fresh ? "coverage-unknown" : windows.length ? "event-window" : next ? "upcoming" : "coverage-unknown",
        next, windows, reports: known ? snapshot.reports.filter(r => r.firstObservedAt <= now) : [],
        parameters: exports.NEWS_RISK_POLICY, missing: snapshot.missing,
    };
}

};
modules["lib/xau/variants"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARALLEL_POLICY = exports.VARIANT_IDS = void 0;
exports.alignedPlan = alignedPlan;
exports.variantDecisions = variantDecisions;
exports.emptyComparison = emptyComparison;
exports.advanceComparison = advanceComparison;
const xauAuditTypes_1 = require("./xauAuditTypes");
const xauLifecycle_1 = require("./xauLifecycle");
const xauPoi_1 = require("./xauPoi");
const macroContext_1 = require("./macroContext");
exports.VARIANT_IDS = ["V0", "V1", "V2", "N0"];
exports.PARALLEL_POLICY = {
    trialId: "xau-parallel-0.1.0", mode: "prospective-shadow", publicSignalsChanged: false,
    lifecycleVersion: xauAuditTypes_1.LIFECYCLE_VERSION, referenceModelVersion: xauAuditTypes_1.MODEL_VERSION,
    commonPlan: xauAuditTypes_1.MODEL_POLICY, poi: xauPoi_1.POI_POLICY, news: macroContext_1.NEWS_RISK_POLICY,
    variants: {
        V0: { version: "xau-shadow-v0-0.1.0", rule: "Frozen public model; independent fresh lifecycle." },
        V1: { version: "xau-shadow-v1-0.1.0", rule: "Strict EMA 9/21 5m and 15m alignment plus same-direction structure. RSI/momentum/sweep/DXY recorded, never authorize." },
        V2: { version: "xau-shadow-v2-0.1.0", rule: "Reference plus existing frozen POI side veto; confirmed zone and target room." },
        N0: { version: "xau-shadow-news-0.1.0", rule: "Separate reference trial; veto new/pending entries in known calendar windows or stale/unknown snapshot. Continue activated plans unchanged. No directional news points or retrospective shock attribution." },
    },
    clock: "Actual observation times; not ideal 5m replay", initialization: "All candidates start empty at first observation; no copying historical public operations.",
};
function noEntry(base, version) {
    return { ...base, modelVersion: version, side: "NO TRADE", entryLow: null, entryHigh: null, stop: null, tp: null, rr: null, quality: "—" };
}
/** Uses the identical frozen level formulas; score is diagnostic only for V1. */
function alignedPlan(base, bars, side, version) {
    const atr = base.atr, anchor = base.emaFast5;
    if (!Number.isFinite(atr) || atr <= 0 || !Number.isFinite(anchor) || bars.length < 12)
        return noEntry(base, version);
    const entryLow = side === "BUY" ? anchor - atr * 0.18 : anchor - atr * 0.05;
    const entryHigh = side === "BUY" ? anchor + atr * 0.05 : anchor + atr * 0.18;
    const mid = (entryLow + entryHigh) / 2;
    const swingLow = Math.min(...bars.slice(-12).map(b => b.low)), swingHigh = Math.max(...bars.slice(-12).map(b => b.high));
    const stop = side === "BUY" ? Math.min(swingLow - atr * 0.15, mid - atr * 1.05) : Math.max(swingHigh + atr * 0.15, mid + atr * 1.05);
    const risk = Math.abs(mid - stop), tp = side === "BUY" ? mid + risk * 2 : mid - risk * 2;
    return { ...base, modelVersion: version, side, entryLow, entryHigh, stop, tp, rr: 2, quality: "—" };
}
function variantDecisions(base, bars5, bars15, context, observedAt) {
    return exports.VARIANT_IDS.map(variant => {
        const version = exports.PARALLEL_POLICY.variants[variant].version, reasons = [];
        let signal = { ...base, modelVersion: version };
        if (base.dataQuality?.ok === false) {
            signal = noEntry(base, version);
            reasons.push("Los datos no superan las comprobaciones comunes.");
        }
        else if (variant === "V1") {
            const buy = base.emaFast5 > base.emaSlow5 && base.emaFast15 > base.emaSlow15 && base.structure === "ALCISTA";
            const sell = base.emaFast5 < base.emaSlow5 && base.emaFast15 < base.emaSlow15 && base.structure === "BAJISTA";
            signal = buy || sell ? alignedPlan(base, bars5, buy ? "BUY" : "SELL", version) : noEntry(base, version);
            signal.poi = (0, xauPoi_1.assessPoi)(signal, bars15, observedAt);
            reasons.push(buy || sell ? "Tendencia 5m/15m y estructura alineadas. Los demás factores no autorizan la entrada." : "Falta alineación completa de tendencia 5m/15m y estructura.");
        }
        else if (variant === "V2") {
            const poi = (0, xauPoi_1.assessPoi)(base, bars15, observedAt);
            signal = { ...signal, poi };
            reasons.push(...poi.reasons);
            if (poi.side === "NO TRADE")
                signal = noEntry(signal, version);
        }
        else if (variant === "N0") {
            if (!context.fresh || context.sourceObservedAt == null || context.sourceObservedAt > observedAt) {
                signal = noEntry(base, version);
                reasons.push("Cobertura del calendario caducada o todavía desconocida.");
            }
            else if (context.windows.length) {
                signal = noEntry(base, version);
                reasons.push("Ventana provisional de evento conocido; se descarta una entrada nueva.");
            }
            else
                reasons.push("Referencia con calendario parcial vigente; sin protección de noticias instantáneas ni shocks no observados.");
        }
        else
            reasons.push("Referencia técnica congelada; estado independiente del plan público.");
        return { variant, version, signal, reasons, diagnostics: { referenceScore: base.score, referenceSide: base.side, macroObservedAt: context.sourceObservedAt, macroFresh: context.fresh, macroStatus: context.status, calendarEventIds: context.windows.map(e => e.id) } };
    });
}
function emptyComparison(observedAt, policyHash) {
    return { trialId: exports.PARALLEL_POLICY.trialId, policyHash, startedAt: observedAt, revision: 0, lastScanId: null, lastObservedAt: 0, states: Object.fromEntries(exports.VARIANT_IDS.map(variant => [variant, { variant, version: exports.PARALLEL_POLICY.variants[variant].version, status: "idle", signalHash: null, side: null, payload: null, updatedAt: 0 }])) };
}
function advanceComparison(previous, decisions, bars5, observedAt, scanId, policyHash, newId) {
    const state = previous ?? emptyComparison(observedAt, policyHash);
    if (state.trialId !== exports.PARALLEL_POLICY.trialId || state.policyHash !== policyHash)
        throw Error("Los parámetros del ensayo cambiaron. No se reinicia ni mezcla su historial.");
    if (state.lastScanId === scanId || observedAt <= state.lastObservedAt)
        return { state, decisions: [], events: [] };
    if (decisions.length !== exports.VARIANT_IDS.length || new Set(decisions.map(d => d.variant)).size !== exports.VARIANT_IDS.length)
        throw Error("Faltan decisiones independientes del ensayo.");
    const states = { ...state.states }, events = [];
    for (const decision of decisions) {
        const { variant, version, signal } = decision;
        let current = { ...states[variant] };
        if (!current || current.version !== version)
            throw Error("La versión del candidato no coincide con su estado.");
        const append = (type, key, payload) => events.push({ variant, eventKey: `${current.signalHash}:${key}`, signalHash: current.signalHash, eventType: type, side: current.side, createdAt: observedAt, payload: { ...payload, trialId: state.trialId, variant, variantVersion: version, policyHash, referenceModelVersion: xauAuditTypes_1.MODEL_VERSION, sourceScanId: scanId } });
        if ((current.status === "pending-entry" || current.status === "triggered") && current.payload) {
            const next = (0, xauLifecycle_1.evaluateLifecycle)(current.payload, current.status, bars5, signal, observedAt, scanId);
            current = { ...current, status: next.status, payload: next.payload, updatedAt: observedAt };
            for (const event of next.events)
                append(event.eventType, event.eventKey, event.payload);
        }
        else if (signal.side !== "NO TRADE" && signal.dataQuality?.ok !== false) {
            current = { ...current, status: "pending-entry", signalHash: `shadow:${state.trialId}:${variant}:${newId()}`, side: signal.side, updatedAt: observedAt, payload: { signal, createdAt: observedAt, auditVersion: xauAuditTypes_1.AUDIT_VERSION, modelVersion: version, lifecycleVersion: xauAuditTypes_1.LIFECYCLE_VERSION, scanId, lastScanAt: observedAt, flags: [], observations: 0 } };
            append("NEW_SIGNAL", "NEW_SIGNAL", { ...current.payload, decision, brokerExecution: false });
        }
        else
            current = { ...current, updatedAt: observedAt };
        states[variant] = current;
    }
    return { state: { ...state, states, revision: state.revision + 1, lastScanId: scanId, lastObservedAt: observedAt }, decisions, events };
}

};
modules["lib/biquote-feed"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FX_SYMBOLS = exports.BiquoteError = exports.BIQUOTE_POLICY = void 0;
exports.parseBiquoteBars = parseBiquoteBars;
exports.validateBiquoteInstrument = validateBiquoteInstrument;
exports.parseBiquoteTick = parseBiquoteTick;
exports.biquoteDxy = biquoteDxy;
exports.fetchBiquoteTicks = fetchBiquoteTicks;
exports.fetchBiquoteBars = fetchBiquoteBars;
const xauMarketCriteria_1 = require("./xau/xauMarketCriteria");
const xauAuditTypes_1 = require("./xau/xauAuditTypes");
exports.BIQUOTE_POLICY = { version: "xau-biquote-0.1.0", docs: "https://biquote.io/docs/", terms: "https://biquote.io/terms.html", instrument: "XAUUSD · referencia indicativa de broker MT5", classification: "Referencia de broker; clasificación spot/CFD inferida, contrato y broker no identificados. El campo COMEX no acredita datos de bolsa.", history: "El proveedor declara bootstrap Yahoo, agregación de ticks e histórico MT5; no identifica la procedencia de cada barra.", license: "Uso y almacenamiento dentro del producto permitidos por términos 2026-09-30; sin redistribución de feed bruto ni SLA.", brokerEquivalent: false };
class BiquoteError extends Error {
    httpStatus;
    retryAfter;
    constructor(message, httpStatus = null, retryAfter = null) {
        super(message);
        this.httpStatus = httpStatus;
        this.retryAfter = retryAfter;
    }
}
exports.BiquoteError = BiquoteError;
const record = (v) => { if (!v || typeof v !== "object" || Array.isArray(v))
    throw new BiquoteError("Respuesta de mercado inválida."); return v; };
function parseBiquoteBars(raw, now) {
    const d = record(raw);
    if (d.symbol !== "XAUUSD" || d.interval !== "5m" || !Array.isArray(d.bars) || d.bars.length > 1001)
        throw new BiquoteError("Instrumento o resolución incorrectos.");
    const unique = new Map();
    let openBars = 0;
    for (const value of d.bars) {
        const b = record(value), at = typeof b.openTime === "string" && b.openTime.endsWith("Z") ? Date.parse(b.openTime) : NaN;
        if (!Number.isFinite(at) || at % xauAuditTypes_1.BAR_MS !== 0 || at > now || typeof b.isOpen !== "boolean" || ![b.open, b.high, b.low, b.close].every(x => typeof x === "number" && Number.isFinite(x) && x > 0))
            throw new BiquoteError("Vela corrupta, futura o sin zona UTC explícita.");
        const bar = { datetime: new Date(at).toISOString(), open: b.open, high: b.high, low: b.low, close: b.close };
        if (bar.high < Math.max(bar.open, bar.close, bar.low) || bar.low > Math.min(bar.open, bar.close, bar.high))
            throw new BiquoteError("Rango OHLC incoherente.");
        if (b.isOpen || at + xauAuditTypes_1.BAR_MS > now) {
            openBars++;
            continue;
        }
        const prior = unique.get(at);
        if (prior && JSON.stringify(prior) !== JSON.stringify(bar))
            throw new BiquoteError("Duplicado OHLC contradictorio.");
        unique.set(at, bar);
    }
    const bars = [...unique.values()].sort((a, b) => (0, xauAuditTypes_1.barTime)(a) - (0, xauAuditTypes_1.barTime)(b)).slice(-240), prepared = (0, xauMarketCriteria_1.prepareMarketBars)(bars, now);
    const gaps = bars.flatMap((b, i) => i > 0 && (0, xauAuditTypes_1.barTime)(b) - (0, xauAuditTypes_1.barTime)(bars[i - 1]) !== xauAuditTypes_1.BAR_MS ? [{ from: bars[i - 1].datetime, to: b.datetime, missingBars: ((0, xauAuditTypes_1.barTime)(b) - (0, xauAuditTypes_1.barTime)(bars[i - 1])) / xauAuditTypes_1.BAR_MS - 1 }] : []);
    return { bars, prepared, gaps, openBars };
}
function validateBiquoteInstrument(raw) { const d = record(raw); if (d.name !== "XAUUSD" || d.currency !== "USD" || typeof d.description !== "string" || !/Gold/i.test(d.description) || typeof d.source !== "string" || !/^MetaTrader 5/.test(d.source))
    throw new BiquoteError("No se ha podido confirmar XAUUSD en USD y el feed de broker."); return d; }
function parseBiquoteTick(raw, symbol, now) { const d = record(raw), at = Date.parse(String(d.timestamp)); if (d.symbol !== symbol || ![d.bid, d.ask, d.mid].every(x => typeof x === "number" && Number.isFinite(x) && x > 0) || Number(d.ask) < Number(d.bid) || Math.abs(Number(d.mid) - (Number(d.bid) + Number(d.ask)) / 2) > Math.max(1e-7, Number(d.mid) * 1e-8) || !Number.isFinite(at) || at > now + 1000 || now - at > 60000 || d.stale !== false || d.marketState !== "open" || typeof d.source !== "string")
    throw new BiquoteError(`Cotización ${symbol} incompleta o no reciente.`); return d; }
exports.FX_SYMBOLS = ["EURUSD", "USDJPY", "GBPUSD", "USDCAD", "USDSEK", "USDCHF"];
function biquoteDxy(raw, now, previous) { try {
    const d = record(raw), ticks = exports.FX_SYMBOLS.map(s => parseBiquoteTick(d[s], s, now)), prices = {};
    exports.FX_SYMBOLS.forEach((s, i) => prices[s.slice(0, 3) + "/" + s.slice(3)] = ticks[i].mid);
    const [eur, jpy, gbp, cad, sek, chf] = ticks.map(t => t.mid), timestamp = Math.min(...ticks.map(t => Date.parse(t.timestamp)));
    return { dxy: 50.14348112 * Math.pow(eur, -.576) * Math.pow(jpy, .136) * Math.pow(gbp, -.119) * Math.pow(cad, .091) * Math.pow(sek, .042) * Math.pow(chf, .036), previousDxy: previous?.source === "biquote" ? previous.dxy : null, previousTimestamp: previous?.source === "biquote" ? previous.timestamp : null, timestamp, prices, source: "biquote", observedAt: now };
}
catch {
    return null;
} }
async function json(url) { let r; try {
    r = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: "manual" });
}
catch {
    throw new BiquoteError("No se pudo acceder a biquote. Cobertura desconocida.");
} if (!r.ok)
    throw new BiquoteError(`biquote respondió HTTP ${r.status}.`, r.status, r.headers.get("Retry-After")); return r.json(); }
async function fetchBiquoteTicks() { const url = "https://biquote.io/api/latest?" + ["XAUUSD", ...exports.FX_SYMBOLS].map(s => "symbols=" + s).join("&"); const raw = await json(url), observedAt = Date.now(); return { raw, observedAt, url, tick: parseBiquoteTick(record(raw).XAUUSD, "XAUUSD", observedAt) }; }
async function fetchBiquoteBars() { const url = "https://biquote.io/api/XAUUSD/ohlc?interval=5m&limit=240", instrumentUrl = "https://biquote.io/api/symbols/XAUUSD"; const [raw, metadata] = await Promise.all([json(url), json(instrumentUrl)]), observedAt = Date.now(), instrument = validateBiquoteInstrument(metadata), parsed = parseBiquoteBars(raw, observedAt); return { ...parsed, raw, instrument, observedAt, url, instrumentUrl, policy: exports.BIQUOTE_POLICY }; }

};
modules["lib/sealed-snapshot"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sealSnapshot = sealSnapshot;
exports.openSnapshot = openSnapshot;
const encoder = new TextEncoder();
const b64 = (v) => { const a = v instanceof Uint8Array ? v : new Uint8Array(v); let s = ""; for (const x of a)
    s += String.fromCharCode(x); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function sharedKey(privateKey, publicKey, salt) { const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256), material = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: Uint8Array.from(salt), info: encoder.encode("libi-xau-snapshot-v1") }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); }
async function sealSnapshot(data, publicJwk) { const ephemeral = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]), publicKey = await crypto.subtle.importKey("jwk", publicJwk, { name: "ECDH", namedCurve: "P-256" }, false, []), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), key = await sharedKey(ephemeral.privateKey, publicKey, salt); const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode("libi-xau-sealed-v1") }, key, encoder.encode(JSON.stringify(data))); return { format: "libi-xau-sealed-v1", ephemeralKey: await crypto.subtle.exportKey("jwk", ephemeral.publicKey), salt: b64(salt), iv: b64(iv), ciphertext: b64(ciphertext) }; }
async function openSnapshot(envelope, privateJwk) { const d = envelope; if (d?.format !== "libi-xau-sealed-v1" || typeof d.ciphertext !== "string" || d.ciphertext.length > 12000000 || typeof d.iv !== "string" || typeof d.salt !== "string" || d.ephemeralKey?.d)
    throw new Error("Sobre cifrado inválido."); const iv = unb64(d.iv), salt = unb64(d.salt); if (iv.length !== 12 || salt.length !== 16)
    throw new Error("Parámetros de cifrado inválidos."); const privateKey = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]), publicKey = await crypto.subtle.importKey("jwk", d.ephemeralKey, { name: "ECDH", namedCurve: "P-256" }, false, []), key = await sharedKey(privateKey, publicKey, salt); const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: encoder.encode("libi-xau-sealed-v1") }, key, unb64(d.ciphertext)); return JSON.parse(new TextDecoder().decode(plain)); }

};
modules["lib/web-push"]=(require,module,exports)=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode64 = void 0;
exports.decode64 = decode64;
exports.validateSubscription = validateSubscription;
exports.encryptPush = encryptPush;
exports.vapidAuthorization = vapidAuthorization;
exports.sendWebPush = sendWebPush;
// RFC 8291 / RFC 8292; one aes128gcm record, no third-party sender service.
const text = new TextEncoder();
const encode64 = (a) => { let s = ""; for (const x of a)
    s += String.fromCharCode(x); return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""); };
exports.encode64 = encode64;
function decode64(s) { if (!/^[A-Za-z0-9_-]+$/.test(s))
    throw Error("Clave push inválida."); return Uint8Array.from(atob(s.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0)); }
const join = (...parts) => { const out = new Uint8Array(parts.reduce((n, x) => n + x.length, 0)); let at = 0; for (const p of parts) {
    out.set(p, at);
    at += p.length;
} return out; };
const bytes = (a) => Uint8Array.from(a);
function validateSubscription(raw) { const d = raw, u = new URL(d?.endpoint); if (u.protocol !== "https:" || u.username || u.password || u.hash || u.port && u.port !== "443" || !(u.hostname === "fcm.googleapis.com" || u.hostname === "updates.push.services.mozilla.com" || u.hostname.endsWith(".push.services.mozilla.com") || u.hostname === "web.push.apple.com") || u.href.length > 2048)
    throw Error("Servicio push no compatible."); if (decode64(d.keys?.p256dh).length !== 65 || decode64(d.keys?.p256dh)[0] !== 4 || decode64(d.keys?.auth).length !== 16 || d.expirationTime != null && !Number.isFinite(d.expirationTime))
    throw Error("Suscripción push incompleta."); return { endpoint: u.href, expirationTime: d.expirationTime ?? null, keys: { p256dh: d.keys.p256dh, auth: d.keys.auth } }; }
async function hmac(key, data) { return new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", bytes(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), bytes(data))); }
async function encryptPush(sub, payload, override) {
    if (payload.length > 3000)
        throw Error("Aviso demasiado grande.");
    const receiver = decode64(sub.keys.p256dh), auth = decode64(sub.keys.auth), salt = override?.salt ?? crypto.getRandomValues(new Uint8Array(16));
    if (salt.length !== 16)
        throw Error("Sal inválida.");
    let privateKey, publicBytes;
    if (override) {
        privateKey = await crypto.subtle.importKey("jwk", override.privateKey, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
        publicBytes = join(new Uint8Array([4]), decode64(override.privateKey.x), decode64(override.privateKey.y));
    }
    else {
        const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
        privateKey = pair.privateKey;
        publicBytes = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
    }
    const peer = await crypto.subtle.importKey("raw", bytes(receiver), { name: "ECDH", namedCurve: "P-256" }, false, []), shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: peer }, privateKey, 256)), prkKey = await hmac(auth, shared), ikm = await hmac(prkKey, join(text.encode("WebPush: info\0"), receiver, publicBytes, new Uint8Array([1]))), prk = await hmac(salt, ikm), cek = (await hmac(prk, join(text.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16), nonce = (await hmac(prk, join(text.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12), key = await crypto.subtle.importKey("raw", bytes(cek), "AES-GCM", false, ["encrypt"]), cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: bytes(nonce) }, key, join(payload, new Uint8Array([2]))));
    const size = new Uint8Array(4);
    new DataView(size.buffer).setUint32(0, 4096);
    return join(salt, size, new Uint8Array([65]), publicBytes, cipher);
}
async function vapidAuthorization(endpoint, key, subject, now = Date.now()) { const aud = new URL(endpoint).origin; if (!subject.startsWith("https://") && !subject.startsWith("mailto:"))
    throw Error("Contacto VAPID inválido."); const header = (0, exports.encode64)(text.encode(JSON.stringify({ typ: "JWT", alg: "ES256" }))), body = (0, exports.encode64)(text.encode(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 3600, sub: subject }))), input = header + "." + body, privateKey = await crypto.subtle.importKey("jwk", key, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]), signature = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, text.encode(input))); if (signature.length !== 64)
    throw Error("Firma VAPID incompatible."); const pub = (0, exports.encode64)(join(new Uint8Array([4]), decode64(key.x), decode64(key.y))); return `vapid t=${input}.${(0, exports.encode64)(signature)}, k=${pub}`; }
async function sendWebPush(sub, payload, key, subject, options = {}) { validateSubscription(sub); const ttl = options.ttl ?? 60; if (!Number.isInteger(ttl) || ttl < 0 || ttl > 300)
    throw Error("Duración del aviso inválida."); const body = await encryptPush(sub, text.encode(JSON.stringify(payload))), authorization = await vapidAuthorization(sub.endpoint, key, subject); const r = await fetch(sub.endpoint, { method: "POST", redirect: "manual", signal: AbortSignal.timeout(12000), headers: { Authorization: authorization, "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(ttl), Urgency: options.urgency ?? "normal" }, body: bytes(body) }); return { accepted: r.status === 201 || r.status === 202 || r.status === 200, expired: r.status === 404 || r.status === 410, httpStatus: r.status, retryAfter: r.headers.get("Retry-After") }; }

};
function get(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error("Unknown module "+id);const m={exports:{}};cache[id]=m;modules[id](p=>get(require("node:path").posix.normalize(require("node:path").posix.join(require("node:path").posix.dirname(id),p))),m,m.exports);return m.exports;}
module.exports={engine:get("lib/xau/engine"),lifecycle:get("lib/xau/xauLifecycle"),audit:get("lib/xau/xauAuditTypes"),macro:get("lib/xau/macroContext"),variants:get("lib/xau/variants"),feed:get("lib/biquote-feed"),sealed:get("lib/sealed-snapshot"),push:get("lib/web-push")};
