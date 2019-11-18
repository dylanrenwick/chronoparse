const tzMock = require("timezone-mock");
const chai = require("chai");
const expect = chai.expect;

const parse = require("../src/index.js");

describe("parse", function() {
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

    it("should correctly parse simple strings", function() {
        let quantities = [1, 17, 100];
        for(let i in timeStrings) {
            if (!typeof(i) === "number" || i < 0 || i > timeStrings.length) continue;
            for (let j of quantities) {
                let result = timeSpans[i] * j;
                let parseStr = `${j} ${timeStrings[i]}`;
                expect(parse(parseStr).totalSeconds).to.equal(result);
            }
        }
    });

    it("should correctly parse plural names", function() {
        let quantities = [1, 17, 100];
        for(let i in timeStrings) {
            if (!typeof(i) === "number" || i < 0 || i > timeStrings.length) continue;
            for (let j of quantities) {
                let result = timeSpans[i] * j;
                let parseStr = `${j} ${timeStrings[i]}s`;
                expect(parse(parseStr).totalSeconds).to.equal(result);
            }
        }
    });

    it("should correctly parse shortened names", function() {
        let quantities = [1, 17, 100];
        for(let i in timeStrings) {
            if (!typeof(i) === "number" || i < 0 || i > timeStrings.length) continue;
            if (timeStrings[i] === "month" || timeStrings[i] === "decade") continue;
            for (let j of quantities) {
                let result = timeSpans[i] * j;
                let parseStr = `${j}${timeStrings[i][0]}`;
                expect(parse(parseStr).totalSeconds).to.equal(result);
            }
        }
    });

    it("should correctly parse 0 length timespans", function() {
        for(let i in timeStrings) {
            if (!typeof(i) === "number" || i < 0 || i > timeStrings.length) continue;
            let parseStr = `0 ${timeStrings[i]}`;
            expect(parse(parseStr).totalSeconds).to.equal(0);
        }
    });

    it ("should return null for invalid strings", function() {
        expect(parse("no days")).to.be.null;
        expect(parse("0 nones")).to.be.null;
    });

    it ("should correctly parse compound timespans", function() {
        let result = timeSpans[timeStrings.indexOf("week")] * 3 + timeSpans[timeStrings.indexOf("hour")] * 2 + 13;
        expect(parse("3 weeks 2 hours 13 seconds").totalSeconds).to.equal(result);
    });

    it ("should correctly parse compound timespans with custom delimiters", function() {
        let result = timeSpans[timeStrings.indexOf("week")] * 3 + timeSpans[timeStrings.indexOf("hour")] * 2 + 13;
        expect(parse("3 weeks,2 hours,13 seconds", {delimiter: ","}).totalSeconds).to.equal(result);
    });

    it ("should correctly parse compound timespans with custom delimiters and additional whitespace", function() {
        let result = timeSpans[timeStrings.indexOf("week")] * 3 + timeSpans[timeStrings.indexOf("hour")] * 2 + 13;
        expect(parse("3 weeks, 2 hours, 13 seconds", {delimiter: ","}).totalSeconds).to.equal(result);
    });

    it ("should fail to parse compound timespans with unspecified delimiters", function() {
        expect(parse("3 weeks, 2 hours, 13 seconds")).to.be.null;
    });

    it ("should correctly parse compound timespans up to a specified limit", function() {
        let result = timeSpans[timeStrings.indexOf("week")] * 3 + timeSpans[timeStrings.indexOf("hour")] * 2;
        expect(parse("3 weeks 2 hours 13 seconds", {max: 2}).totalSeconds).to.equal(result);
    });

    it ("should correctly parse case insensitively", function() {
        let result = 29
        expect(parse("29 sEconDS", {max: 2}).totalSeconds).to.equal(result);
    });

    it ("should correctly provide the current timezone", function() {
        tzMock.register("US/Eastern");
        expect(parse("1 second").timezone).to.equal("UTC-5");
        tzMock.register("US/Pacific");
        expect(parse("1 second").timezone).to.equal("UTC-8");
        tzMock.register("UTC");
        expect(parse("1 second").timezone).to.equal("UTC+0");
    });

    it ("should return the date of completion as the startDate", function() {
        let now = new Date();
        let result = parse("29 seconds").startDate;
        // Will fail if parsing takes more than 60 seconds
        expect(result - now).to.be.lessThan(60000);
    });

    it ("should return an endDate that matches the given timespan", function() {
        let result = parse("29 seconds");
        expect(result.endDate - result.startDate).to.equal(29000);
    });

    it ("should support specifying a different startDate", function() {
        let date = new Date();
        date.setSeconds(date.getSeconds() + 120);
        let endDate = new Date();
        endDate.setSeconds(endDate.getSeconds() + 149);
        let result = parse("29 seconds", {startDate: date});
        expect(result.startDate.toString()).to.equal(date.toString());
        expect(result.endDate.toString()).to.equal(endDate.toString());
    });
});