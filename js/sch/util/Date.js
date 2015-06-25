Ext.define("Sch.util.Date", {
    requires: "Ext.Date",
    mixins: ["Sch.mixin.Localizable"],
    singleton: true,
    stripEscapeRe: /(\\.)/g,
    hourInfoRe: /([gGhHisucUOPZ]|MS)/,
    unitHash: null,
    unitsByName: {},
    constructor: function() {
        var a = Ext.Date;
        var c = this.unitHash = {
            MILLI: a.MILLI,
            SECOND: a.SECOND,
            MINUTE: a.MINUTE,
            HOUR: a.HOUR,
            DAY: a.DAY,
            WEEK: "w",
            MONTH: a.MONTH,
            QUARTER: "q",
            YEAR: a.YEAR
        };
        Ext.apply(this, c);
        var b = this;
        this.units = [b.MILLI, b.SECOND, b.MINUTE, b.HOUR, b.DAY, b.WEEK, b.MONTH, b.QUARTER, b.YEAR]
    },
    onLocalized: function() {
        this.setUnitNames(this.L("unitNames"))
    },
    setUnitNames: function(f, b) {
        var e = this.unitsByName = {};
        this.l10n.unitNames = f;
        this._unitNames = Ext.apply({}, f);
        var c = this.unitHash;
        for (var a in c) {
            if (c.hasOwnProperty(a)) {
                var d = c[a];
                this._unitNames[d] = this._unitNames[a];
                e[a] = d;
                e[d] = d
            }
        }
    },
    betweenLesser: function(b, d, a) {
        var c = b.getTime();
        return d.getTime() <= c && c < a.getTime()
    },
    constrain: function(b, c, a) {
        return this.min(this.max(b, c), a)
    },
    compareUnits: function(c, b) {
        var a = Ext.Array.indexOf(this.units, c),
            d = Ext.Array.indexOf(this.units, b);
        return a > d ? 1 : (a < d ? -1 : 0)
    },
    isUnitGreater: function(b, a) {
        return this.compareUnits(b, a) > 0
    },
    copyTimeValues: function(b, a) {
        b.setHours(a.getHours());
        b.setMinutes(a.getMinutes());
        b.setSeconds(a.getSeconds());
        b.setMilliseconds(a.getMilliseconds())
    },
    add: function(b, c, e) {
        var f = Ext.Date.clone(b);
        if (!c || e === 0) {
            return f
        }
        switch (c.toLowerCase()) {
            case this.MILLI:
                f = new Date(b.getTime() + e);
                break;
            case this.SECOND:
                f = new Date(b.getTime() + (e * 1000));
                break;
            case this.MINUTE:
                f = new Date(b.getTime() + (e * 60000));
                break;
            case this.HOUR:
                f = new Date(b.getTime() + (e * 3600000));
                break;
            case this.DAY:
                f.setDate(b.getDate() + e);
                if (f.getHours() === 23 && b.getHours() === 0) {
                    f = Ext.Date.add(f, Ext.Date.HOUR, 1)
                }
                break;
            case this.WEEK:
                f.setDate(b.getDate() + e * 7);
                break;
            case this.MONTH:
                var a = b.getDate();
                if (a > 28) {
                    a = Math.min(a, Ext.Date.getLastDateOfMonth(this.add(Ext.Date.getFirstDateOfMonth(b), this.MONTH, e)).getDate())
                }
                f.setDate(a);
                f.setMonth(f.getMonth() + e);
                break;
            case this.QUARTER:
                f = this.add(b, this.MONTH, e * 3);
                break;
            case this.YEAR:
                f.setFullYear(b.getFullYear() + e);
                break
        }
        return f
    },
    getUnitDurationInMs: function(a) {
        return this.add(new Date(1, 0, 1), a, 1) - new Date(1, 0, 1)
    },
    getMeasuringUnit: function(a) {
        if (a === this.WEEK) {
            return this.DAY
        }
        return a
    },
    getDurationInUnit: function(e, a, c, d) {
        var b;
        switch (c) {
            case this.YEAR:
                b = this.getDurationInYears(e, a);
                break;
            case this.QUARTER:
                b = this.getDurationInMonths(e, a) / 3;
                break;
            case this.MONTH:
                b = this.getDurationInMonths(e, a);
                break;
            case this.WEEK:
                b = this.getDurationInDays(e, a) / 7;
                break;
            case this.DAY:
                b = this.getDurationInDays(e, a);
                break;
            case this.HOUR:
                b = this.getDurationInHours(e, a);
                break;
            case this.MINUTE:
                b = this.getDurationInMinutes(e, a);
                break;
            case this.SECOND:
                b = this.getDurationInSeconds(e, a);
                break;
            case this.MILLI:
                b = this.getDurationInMilliseconds(e, a);
                break
        }
        return d ? b : Math.round(b)
    },
    getUnitToBaseUnitRatio: function(b, a) {
        if (b === a) {
            return 1
        }
        switch (b) {
            case this.YEAR:
                switch (a) {
                    case this.QUARTER:
                        return 1 / 4;
                    case this.MONTH:
                        return 1 / 12
                }
                break;
            case this.QUARTER:
                switch (a) {
                    case this.YEAR:
                        return 4;
                    case this.MONTH:
                        return 1 / 3
                }
                break;
            case this.MONTH:
                switch (a) {
                    case this.YEAR:
                        return 12;
                    case this.QUARTER:
                        return 3
                }
                break;
            case this.WEEK:
                switch (a) {
                    case this.DAY:
                        return 1 / 7;
                    case this.HOUR:
                        return 1 / 168
                }
                break;
            case this.DAY:
                switch (a) {
                    case this.WEEK:
                        return 7;
                    case this.HOUR:
                        return 1 / 24;
                    case this.MINUTE:
                        return 1 / 1440
                }
                break;
            case this.HOUR:
                switch (a) {
                    case this.DAY:
                        return 24;
                    case this.MINUTE:
                        return 1 / 60
                }
                break;
            case this.MINUTE:
                switch (a) {
                    case this.HOUR:
                        return 60;
                    case this.SECOND:
                        return 1 / 60;
                    case this.MILLI:
                        return 1 / 60000
                }
                break;
            case this.SECOND:
                switch (a) {
                    case this.MILLI:
                        return 1 / 1000
                }
                break;
            case this.MILLI:
                switch (a) {
                    case this.SECOND:
                        return 1000
                }
                break
        }
        return -1
    },
    getDurationInMilliseconds: function(b, a) {
        return (a - b)
    },
    getDurationInSeconds: function(b, a) {
        return (a - b) / 1000
    },
    getDurationInMinutes: function(b, a) {
        return (a - b) / 60000
    },
    getDurationInHours: function(b, a) {
        return (a - b) / 3600000
    },
    getDurationInDays: function(c, b) {
        var a = c.getTimezoneOffset() - b.getTimezoneOffset();
        return (b - c + a * 60 * 1000) / 86400000
    },
    getDurationInMonths: function(b, a) {
        return ((a.getFullYear() - b.getFullYear()) * 12) + (a.getMonth() - b.getMonth())
    },
    getDurationInYears: function(b, a) {
        return this.getDurationInMonths(b, a) / 12
    },
    min: function(b, a) {
        return b < a ? b : a
    },
    max: function(b, a) {
        return b > a ? b : a
    },
    intersectSpans: function(c, d, b, a) {
        return this.betweenLesser(c, b, a) || this.betweenLesser(b, c, d)
    },
    getNameOfUnit: function(a) {
        a = this.getUnitByName(a);
        switch (a.toLowerCase()) {
            case this.YEAR:
                return "YEAR";
            case this.QUARTER:
                return "QUARTER";
            case this.MONTH:
                return "MONTH";
            case this.WEEK:
                return "WEEK";
            case this.DAY:
                return "DAY";
            case this.HOUR:
                return "HOUR";
            case this.MINUTE:
                return "MINUTE";
            case this.SECOND:
                return "SECOND";
            case this.MILLI:
                return "MILLI"
        }
        throw "Incorrect UnitName"
    },
    getReadableNameOfUnit: function(b, a) {
        if (!this.isLocaleApplied()) {
            this.applyLocale()
        }
        return this._unitNames[b][a ? "plural" : "single"]
    },
    getShortNameOfUnit: function(a) {
        if (!this.isLocaleApplied()) {
            this.applyLocale()
        }
        return this._unitNames[a].abbrev
    },
    getUnitByName: function(a) {
        if (!this.isLocaleApplied()) {
            this.applyLocale()
        }
        if (!this.unitsByName[a]) {
            Ext.Error.raise("Unknown unit name: " + a)
        }
        return this.unitsByName[a]
    },
    getNext: function(c, g, a, f) {
        var e = Ext.Date.clone(c);
        f = arguments.length < 4 ? 1 : f;
        a = a == null ? 1 : a;
        switch (g) {
            case this.MILLI:
                e = this.add(c, g, a);
                break;
            case this.SECOND:
                e = this.add(c, g, a);
                if (e.getMilliseconds() > 0) {
                    e.setMilliseconds(0)
                }
                break;
            case this.MINUTE:
                e = this.add(c, g, a);
                if (e.getSeconds() > 0) {
                    e.setSeconds(0)
                }
                if (e.getMilliseconds() > 0) {
                    e.setMilliseconds(0)
                }
                break;
            case this.HOUR:
                e = this.add(c, g, a);
                if (e.getMinutes() > 0) {
                    e.setMinutes(0)
                }
                if (e.getSeconds() > 0) {
                    e.setSeconds(0)
                }
                if (e.getMilliseconds() > 0) {
                    e.setMilliseconds(0)
                }
                break;
            case this.DAY:
                var d = c.getHours() === 23 && this.add(e, this.HOUR, 1).getHours() === 1;
                if (d) {
                    e = this.add(e, this.DAY, 2);
                    this.clearTime(e);
                    return e
                }
                this.clearTime(e);
                e = this.add(e, this.DAY, a);
                if (e.getHours() === 1) {
                    this.clearTime(e)
                }
                break;
            case this.WEEK:
                this.clearTime(e);
                var b = e.getDay();
                e = this.add(e, this.DAY, f - b + 7 * (a - (f <= b ? 0 : 1)));
                if (e.getDay() !== f) {
                    e = this.add(e, this.HOUR, 1)
                } else {
                    this.clearTime(e)
                }
                break;
            case this.MONTH:
                e = this.add(e, this.MONTH, a);
                e.setDate(1);
                this.clearTime(e);
                break;
            case this.QUARTER:
                e = this.add(e, this.MONTH, ((a - 1) * 3) + (3 - (e.getMonth() % 3)));
                this.clearTime(e);
                e.setDate(1);
                break;
            case this.YEAR:
                e = new Date(e.getFullYear() + a, 0, 1);
                break;
            default:
                throw "Invalid date unit"
        }
        return e
    },
    getNumberOfMsFromTheStartOfDay: function(a) {
        return a - this.clearTime(a, true) || 86400000
    },
    getNumberOfMsTillTheEndOfDay: function(a) {
        return this.getStartOfNextDay(a, true) - a
    },
    getStartOfNextDay: function(b, f, e) {
        var d = this.add(e ? b : this.clearTime(b, f), this.DAY, 1);
        if (d.getDate() == b.getDate()) {
            var c = this.add(this.clearTime(b, f), this.DAY, 2).getTimezoneOffset();
            var a = b.getTimezoneOffset();
            d = this.add(d, this.MINUTE, a - c)
        }
        return d
    },
    getEndOfPreviousDay: function(b, c) {
        var a = c ? b : this.clearTime(b, true);
        if (a - b) {
            return a
        } else {
            return this.add(a, this.DAY, -1)
        }
    },
    timeSpanContains: function(c, b, d, a) {
        return (d - c) >= 0 && (b - a) >= 0
    },
    compareWithPrecision: function(e, c, f) {
        var d = Sch.util.Date,
            b = Ext.Date,
            a;
        switch (f) {
            case d.DAY:
                e = Number(b.format(e, "Ymd"));
                c = Number(b.format(c, "Ymd"));
                break;
            case d.WEEK:
                e = Number(b.format(e, "YmW"));
                c = Number(b.format(c, "YmW"));
                break;
            case d.MONTH:
                e = Number(b.format(e, "Ym"));
                c = Number(b.format(c, "Ym"));
                break;
            case d.QUARTER:
                e = e.getFullYear() * 4 + Math.floor(e.getMonth() / 3);
                c = c.getFullYear() * 4 + Math.floor(c.getMonth() / 3);
                break;
            case d.YEAR:
                e = e.getFullYear();
                c = c.getFullYear();
                break;
            default:
            case d.MILLI:
            case d.SECOND:
            case d.MINUTE:
            case d.HOUR:
                f = f && this.getUnitDurationInMs(f) || 1;
                e = Math.floor(e.valueOf() / f);
                c = Math.floor(c.valueOf() / f);
                break
        }((e < c) && (a = -1)) || ((e > c) && (a = +1)) || (a = 0);
        return a
    },
    getValueInUnits: function(a, b) {
        switch (b) {
            case this.MONTH:
                return a.getMonth();
            case this.DAY:
                return a.getDate();
            case this.HOUR:
                return a.getHours();
            case this.MINUTE:
                return a.getMinutes();
            case this.SECOND:
                return a.getSeconds()
        }
    },
    setValueInUnits: function(b, c, e) {
        var a = Ext.Date.clone(b),
            d;
        switch (c) {
            case this.YEAR:
                d = "setFullYear";
                break;
            case this.MONTH:
                d = "setMonth";
                break;
            case this.DAY:
                d = "setDate";
                break;
            case this.HOUR:
                d = "setHours";
                break;
            case this.MINUTE:
                d = "setMinutes";
                break;
            case this.SECOND:
                d = "setSeconds";
                break;
            case this.MILLI:
                d = "setMilliseconds";
                break
        }
        a[d](e);
        return a
    },
    getSubUnit: function(a) {
        switch (a) {
            case this.YEAR:
                return this.MONTH;
            case this.MONTH:
                return this.DAY;
            case this.DAY:
                return this.HOUR;
            case this.HOUR:
                return this.MINUTE;
            case this.MINUTE:
                return this.SECOND;
            case this.SECOND:
                return this.MILLI
        }
    },
    setValueInSubUnits: function(a, b, c) {
        b = this.getSubUnit(b);
        return this.setValueInUnits(a, b, c)
    },
    mergeDates: function(c, b, a) {
        var d = Ext.Date.clone(c);
        switch (a) {
            case this.YEAR:
                d.setFullYear(b.getFullYear());
            case this.MONTH:
                d.setMonth(b.getMonth());
            case this.WEEK:
            case this.DAY:
                if (a === this.WEEK) {
                    d = this.add(d, this.DAY, b.getDay() - d.getDay())
                } else {
                    d.setDate(b.getDate())
                }
            case this.HOUR:
                d.setHours(b.getHours());
            case this.MINUTE:
                d.setMinutes(b.getMinutes());
            case this.SECOND:
                d.setSeconds(b.getSeconds());
            case this.MILLI:
                d.setMilliseconds(b.getMilliseconds())
        }
        return d
    },
    splitToSubUnits: function(d, c, a, b) {
        a = a || 1;
        b = arguments.length < 4 ? 1 : b;
        switch (c) {
            case this.MONTH:
                return this.splitMonth(d, a, b);
            case this.WEEK:
            case this.DAY:
                return this.splitDay(d, a);
            default:
                break
        }
    },
    splitYear: function(e, c) {
        var b = this.clearTime(e, true);
        b.setMonth(0);
        b.setDate(1);
        var a = [];
        for (var d = 0; d <= 12; d = d + c) {
            a.push(this.add(b, this.MONTH, d))
        }
        return a
    },
    splitMonth: function(h, c, g) {
        var b = this.clearTime(h, true);
        b.setDate(1);
        b = this.add(b, this.DAY, g - b.getDay());
        var d = Ext.Date.clone(b);
        var f = this.add(b, this.MONTH, 1);
        var a = [];
        for (var e = 0; d.getTime() < f.getTime(); e = e + c) {
            d = this.add(b, this.WEEK, e);
            a.push(d)
        }
        return a
    },
    splitWeek: function(f, c, e) {
        var b = this.add(f, this.DAY, e - f.getDay());
        b = this.clearTime(b);
        var a = [];
        for (var d = 0; d <= 7; d = d + c) {
            a.push(this.add(b, this.DAY, d))
        }
        return a
    },
    splitDay: function(e, b) {
        var d = this.clearTime(e, true);
        var a = [];
        for (var c = 0; c <= 24; c = c + b) {
            a.push(this.add(d, this.HOUR, c))
        }
        return a
    },
    splitHour: function(e, b) {
        var d = new Date(e.getTime());
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        var a = [];
        for (var c = 0; c <= 60; c = c + b) {
            a.push(this.add(d, this.MINUTE, c))
        }
        return a
    },
    splitMinute: function(e, b) {
        var d = Ext.Date.clone(e);
        d.setSeconds(0);
        d.setMilliseconds(0);
        var a = [];
        for (var c = 0; c <= 60; c = c + b) {
            a.push(this.add(d, this.SECOND, c))
        }
        return a
    },
    clearTime: function(a, b) {
        if (a.getHours() > 0 || a.getMinutes() > 0 || a.getSeconds() > 0) {
            return Ext.Date.clearTime(a, b)
        }
        return b ? Ext.Date.clone(a) : a
    }
});
