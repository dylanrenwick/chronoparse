const timeStrings = [
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "year",
    "decade"
];
const timeSpans = [
    1,
    60,
    60 * 60,
    60 * 60 * 24,
    60 * 60 * 24 * 7,
    60 * 60 * 24 * 30,
    60 * 60 * 24 * 365,
    60 * 60 * 24 * 365 * 10
];
const regex = new RegExp("^(\\d+) ?([a-zA-Z]+)");

function matchToTimespan(match) {
    let quantity = parseInt(match[1]);
    if (Number.isNaN(quantity)) return -1;
    let type = match[2].toLowerCase();
    let typeIndex = timeStrings.indexOf(type);
    if (typeIndex === -1 && type.length === 1) typeIndex = timeStrings.map(x => x[0]).indexOf(type);
    if (typeIndex === -1) typeIndex = timeStrings.map(x => x + "s").indexOf(type);
    if (typeIndex === -1) return -1;
    let timespan = timeTypeToTimespan(typeIndex);
    return timespan === -1 ? timespan : timespan * quantity;
}

function timeTypeToTimespan(type) {
    return timeSpans[type] || -1;
}

function trimString(str, delimiter) {
    while (str.substring(0, delimiter.length) === delimiter) {
        str = str.substring(delimiter.length).trimStart();
    }
    return str;
}

function getTimezone() {
    let offset = new Date().getTimezoneOffset() * -1 / 60;
    return `UTC${offset >= 0 ? "+": ""}${offset}`;
}

module.exports = function parse(text, options = {}) {
    let delimiter = options["delimiter"] || " ";
    let maxCount = options["max"] || -1;
    let allResults = [];
    let result;

    while ((result = regex.exec(text)) !== null && (maxCount === -1 || allResults.length < maxCount)) {
        allResults.push(result);
        text = text.substring(result[0].length);
        text = trimString(text, delimiter);
    }

    if (allResults.length === 0 || ((maxCount < 0 || allResults.length < maxCount) && text.length)) return null;

    let outputData = {
        totalSeconds: 0,
        parts: []
    };
    
    for (let res of allResults) {
        let timespan = matchToTimespan(res);
        if (timespan === -1) return null;
        outputData.totalSeconds += timespan;
        outputData.parts += res[0];
    }

    let date = new Date();
    date.setSeconds(date.getSeconds() + outputData.totalSeconds);
    outputData.startDate = new Date();
    outputData.endDate = date;
    outputData.timezone = getTimezone();

    return outputData;
};