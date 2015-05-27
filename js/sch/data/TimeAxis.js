Ext.define("Sch.data.TimeAxis", {
    extend: "Ext.data.JsonStore",
    requires: ["Sch.util.Date", "Sch.model.TimeAxisTick"],
    model: "Sch.model.TimeAxisTick",
    continuous: true,
    originalContinuous: null,
    autoAdjust: true,
    unit: null,
    increment: null,
    resolutionUnit: null,
    resolutionIncrement: null,
    weekStartDay: null,
    mainUnit: null,
    shiftUnit: null,
    shiftIncrement: 1,
    defaultSpan: 1,
    isConfigured: false,
    adjustedStart: null,
    adjustedEnd: null,
    visibleTickStart: null,
    visibleTickEnd: null,
    constructor: function (a) {
        var b = this;
        if (b.setModel) {
            b.setModel(b.model)
        }
        b.originalContinuous = b.continuous;
        b.callParent(arguments);
        b.addEvents("beforereconfigure", "reconfigure");
        b.on(Ext.versions.touch ? "refresh" : "datachanged", function (c, d, e) {
            b.fireEvent("reconfigure", b, d, e)
        });
        if (a && b.start) {
            b.reconfigure(a)
        }
    },
    reconfigure: function (e, a) {
        this.isConfigured = true;
        Ext.apply(this, e);
        var m = this.getAdjustedDates(e.start, e.end, true);
        var l = this.getAdjustedDates(e.start, e.end);
        var b = l.start;
        var f = l.end;
        if (this.fireEvent("beforereconfigure", this, b, f) !== false) {
            var j = this.unit;
            var k = this.increment || 1;
            var i = this.generateTicks(b, f, j, k, this.mainUnit);
            var d = Ext.Object.getKeys(e).length;
            var g = (d === 1 && "start" in e) || (d === 2 && "start" in e && "end" in e);
            this.removeAll(true);
            this.suspendEvents();
            this.add(i);
            if (this.getCount() === 0) {
                Ext.Error.raise("Invalid time axis configuration or filter, please check your input data.")
            }
            this.resumeEvents();
            var c = Sch.util.Date;
            var h = i.length;
            if (this.isContinuous()) {
                this.adjustedStart = m.start;
                this.adjustedEnd = c.getNext(h > 1 ? i[h - 1].start : m.start, j, k)
            } else {
                this.adjustedStart = this.getStart();
                this.adjustedEnd = this.getEnd()
            }
            do {
                this.visibleTickStart = (this.getStart() - this.adjustedStart) / (c.getUnitDurationInMs(j) * k);
                if (this.visibleTickStart >= 1) {
                    this.adjustedStart = c.getNext(this.adjustedStart, j, 1)
                }
            } while (this.visibleTickStart >= 1);
            do {
                this.visibleTickEnd = h - (this.adjustedEnd - this.getEnd()) / (c.getUnitDurationInMs(j) * k);
                if (h - this.visibleTickEnd >= 1) {
                    this.adjustedEnd = c.getNext(this.adjustedEnd, j, -1)
                }
            } while (h - this.visibleTickEnd >= 1);
            this.fireEvent("datachanged", this, !g, a);
            this.fireEvent("refresh", this, !g, a)
        }
    },
    setTimeSpan: function (c, a) {
        var b = this.getAdjustedDates(c, a);
        c = b.start;
        a = b.end;
        if (this.getStart() - c !== 0 || this.getEnd() - a !== 0) {
            this.reconfigure({
                start: c,
                end: a
            })
        }
    },
    filterBy: function (b, a) {
        this.continuous = false;
        a = a || this;
        this.clearFilter(true);
        this.suspendEvents(true);
        this.filter([{
            filterFn: function (d, c) {
                return b.call(a, d.data, c)
            }
        }]);
        if (this.getCount() === 0) {
            this.clearFilter();
            this.resumeEvents();
            Ext.Error.raise("Invalid time axis filter - no ticks passed through the filter. Please check your filter method.")
        }
        this.resumeEvents()
    },
    isContinuous: function () {
        return this.continuous && !this.isFiltered()
    },
    clearFilter: function () {
        this.continuous = this.originalContinuous;
        this.callParent(arguments)
    },
    generateTicks: function (a, d, g, i) {
        var h = [],
            f, b = Sch.util.Date,
            e = 0;
        g = g || this.unit;
        i = i || this.increment;
        var j = this.getAdjustedDates(a, d);
        a = j.start;
        d = j.end;
        while (a < d) {
            f = this.getNext(a, g, i);
            if (!this.autoAdjust && f > d) {
                f = d
            }
            if (g === b.HOUR && i > 1 && h.length > 0 && e === 0) {
                var c = h[h.length - 1];
                e = ((c.start.getHours() + i) % 24) - c.end.getHours();
                if (e !== 0) {
                    f = b.add(f, b.HOUR, e)
                }
            }
            h.push({
                start: a,
                end: f
            });
            a = f
        }
        return h
    },
    getVisibleTickTimeSpan: function () {
        return this.isContinuous() ? this.visibleTickEnd - this.visibleTickStart : this.getCount()
    },
    getAdjustedDates: function (c, b, a) {
        c = c || this.getStart();
        b = b || Sch.util.Date.add(c, this.mainUnit, this.defaultSpan);
        return this.autoAdjust || a ? {
            start: this.floorDate(c, false, this.mainUnit, 1),
            end: this.ceilDate(b, false, this.mainUnit, 1)
        } : {
            start: c,
            end: b
        }
    },
    getTickFromDate: function (d) {
        var j = this.data.items;
        var h = j.length - 1;
        if (d < j[0].data.start || d > j[h].data.end) {
            return -1
        }
        var f, g, b;
        if (this.isContinuous()) {
            if (d - j[0].data.start === 0) {
                return this.visibleTickStart
            }
            if (d - j[h].data.end === 0) {
                return this.visibleTickEnd
            }
            var k = this.adjustedStart;
            var a = this.adjustedEnd;
            var c = Math.floor(j.length * (d - k) / (a - k));
            if (c > h) {
                c = h
            }
            g = c === 0 ? k : j[c].data.start;
            b = c == h ? a : j[c].data.end;
            f = c + (d - g) / (b - g);
            if (f < this.visibleTickStart || f > this.visibleTickEnd) {
                return -1
            }
            return f
        } else {
            for (var e = 0; e <= h; e++) {
                b = j[e].data.end;
                if (d <= b) {
                    g = j[e].data.start;
                    f = e + (d > g ? (d - g) / (b - g) : 0);
                    return f
                }
            }
        }
        return -1
    },
    getDateFromTick: function (e, i) {
        if (e === this.visibleTickEnd) {
            return this.getEnd()
        }
        var b = Math.floor(e),
            g = e - b,
            h = this.getAt(b);
        if (!h) {
            return null
        }
        var f = h.data;
        var a = b === 0 ? this.adjustedStart : f.start;
        var d = (b == this.getCount() - 1) && this.isContinuous() ? this.adjustedEnd : f.end;
        var c = Sch.util.Date.add(a, Sch.util.Date.MILLI, g * (d - a));
        if (i) {
            c = this[i + "Date"](c)
        }
        return c
    },
    getTicks: function () {
        var a = [];
        this.each(function (b) {
            a.push(b.data)
        });
        return a
    },
    getStart: function () {
        var a = this.first();
        if (a) {
            return new Date(a.data.start)
        }
        return null
    },
    getEnd: function () {
        var a = this.last();
        if (a) {
            return new Date(a.data.end)
        }
        return null
    },
    floorDate: function (e, g, h, a) {
        g = g !== false;
        var c = Ext.Date.clone(e),
            d = g ? this.getStart() : null,
            k = a || this.resolutionIncrement,
            j;
        if (h) {
            j = h
        } else {
            j = g ? this.resolutionUnit : this.mainUnit
        }
        var b = Sch.util.Date;
        var f = function (m, l) {
            return Math.floor(m / l) * l
        };
        switch (j) {
        case b.MILLI:
            if (g) {
                c = b.add(d, b.MILLI, f(b.getDurationInMilliseconds(d, c), k))
            }
            break;
        case b.SECOND:
            if (g) {
                c = b.add(d, b.MILLI, f(b.getDurationInSeconds(d, c), k) * 1000)
            } else {
                c.setMilliseconds(0);
                c.setSeconds(f(c.getSeconds(), k))
            }
            break;
        case b.MINUTE:
            if (g) {
                c = b.add(d, b.SECOND, f(b.getDurationInMinutes(d, c), k) * 60)
            } else {
                c.setMinutes(f(c.getMinutes(), k));
                c.setSeconds(0);
                c.setMilliseconds(0)
            }
            break;
        case b.HOUR:
            if (g) {
                c = b.add(d, b.MINUTE, f(b.getDurationInHours(this.getStart(), c), k) * 60)
            } else {
                c.setMinutes(0);
                c.setSeconds(0);
                c.setMilliseconds(0);
                c.setHours(f(c.getHours(), k))
            }
            break;
        case b.DAY:
            if (g) {
                c = b.add(d, b.DAY, f(b.getDurationInDays(d, c), k))
            } else {
                Ext.Date.clearTime(c);
                c.setDate(f(c.getDate() - 1, k) + 1)
            }
            break;
        case b.WEEK:
            var i = c.getDay();
            Ext.Date.clearTime(c);
            if (i !== this.weekStartDay) {
                c = b.add(c, b.DAY, -(i > this.weekStartDay ? (i - this.weekStartDay) : (7 - i - this.weekStartDay)))
            }
            break;
        case b.MONTH:
            if (g) {
                c = b.add(d, b.MONTH, f(b.getDurationInMonths(d, c), k))
            } else {
                Ext.Date.clearTime(c);
                c.setDate(1);
                c.setMonth(f(c.getMonth(), k))
            }
            break;
        case b.QUARTER:
            Ext.Date.clearTime(c);
            c.setDate(1);
            c = b.add(c, b.MONTH, -(c.getMonth() % 3));
            break;
        case b.YEAR:
            if (g) {
                c = b.add(d, b.YEAR, f(b.getDurationInYears(d, c), k))
            } else {
                c = new Date(f(e.getFullYear() - 1, k) + 1, 0, 1)
            }
            break
        }
        return c
    },
    roundDate: function (r, b) {
        var l = Ext.Date.clone(r),
            s = this.resolutionIncrement;
        b = b || this.getStart();
        switch (this.resolutionUnit) {
        case Sch.util.Date.MILLI:
            var e = Sch.util.Date.getDurationInMilliseconds(b, l),
                d = Math.round(e / s) * s;
            l = Sch.util.Date.add(b, Sch.util.Date.MILLI, d);
            break;
        case Sch.util.Date.SECOND:
            var i = Sch.util.Date.getDurationInSeconds(b, l),
                q = Math.round(i / s) * s;
            l = Sch.util.Date.add(b, Sch.util.Date.MILLI, q * 1000);
            break;
        case Sch.util.Date.MINUTE:
            var n = Sch.util.Date.getDurationInMinutes(b, l),
                a = Math.round(n / s) * s;
            l = Sch.util.Date.add(b, Sch.util.Date.SECOND, a * 60);
            break;
        case Sch.util.Date.HOUR:
            var m = Sch.util.Date.getDurationInHours(b, l),
                j = Math.round(m / s) * s;
            l = Sch.util.Date.add(b, Sch.util.Date.MINUTE, j * 60);
            break;
        case Sch.util.Date.DAY:
            var c = Sch.util.Date.getDurationInDays(b, l),
                f = Math.round(c / s) * s;
            l = Sch.util.Date.add(b, Sch.util.Date.DAY, f);
            break;
        case Sch.util.Date.WEEK:
            Ext.Date.clearTime(l);
            var o = l.getDay() - this.weekStartDay,
                t;
            if (o < 0) {
                o = 7 + o
            }
            if (Math.round(o / 7) === 1) {
                t = 7 - o
            } else {
                t = -o
            }
            l = Sch.util.Date.add(l, Sch.util.Date.DAY, t);
            break;
        case Sch.util.Date.MONTH:
            var p = Sch.util.Date.getDurationInMonths(b, l) + (l.getDate() / Ext.Date.getDaysInMonth(l)),
                h = Math.round(p / s) * s;
            l = Sch.util.Date.add(b, Sch.util.Date.MONTH, h);
            break;
        case Sch.util.Date.QUARTER:
            Ext.Date.clearTime(l);
            l.setDate(1);
            l = Sch.util.Date.add(l, Sch.util.Date.MONTH, 3 - (l.getMonth() % 3));
            break;
        case Sch.util.Date.YEAR:
            var k = Sch.util.Date.getDurationInYears(b, l),
                g = Math.round(k / s) * s;
            l = Sch.util.Date.add(b, Sch.util.Date.YEAR, g);
            break
        }
        return l
    },
    ceilDate: function (c, b, f) {
        var e = Ext.Date.clone(c);
        b = b !== false;
        var a = b ? this.resolutionIncrement : 1,
            g = false,
            d;
        if (f) {
            d = f
        } else {
            d = b ? this.resolutionUnit : this.mainUnit
        }
        switch (d) {
        case Sch.util.Date.HOUR:
            if (e.getMinutes() > 0 || e.getSeconds() > 0 || e.getMilliseconds() > 0) {
                g = true
            }
            break;
        case Sch.util.Date.DAY:
            if (e.getHours() > 0 || e.getMinutes() > 0 || e.getSeconds() > 0 || e.getMilliseconds() > 0) {
                g = true
            }
            break;
        case Sch.util.Date.WEEK:
            Ext.Date.clearTime(e);
            if (e.getDay() !== this.weekStartDay) {
                g = true
            }
            break;
        case Sch.util.Date.MONTH:
            Ext.Date.clearTime(e);
            if (e.getDate() !== 1) {
                g = true
            }
            break;
        case Sch.util.Date.QUARTER:
            Ext.Date.clearTime(e);
            if (e.getMonth() % 3 !== 0 || (e.getMonth() % 3 === 0 && e.getDate() !== 1)) {
                g = true
            }
            break;
        case Sch.util.Date.YEAR:
            Ext.Date.clearTime(e);
            if (e.getMonth() !== 0 || e.getDate() !== 1) {
                g = true
            }
            break;
        default:
            break
        }
        if (g) {
            return this.getNext(e, d, a)
        } else {
            return e
        }
    },
    getNext: function (b, c, a) {
        return Sch.util.Date.getNext(b, c, a, this.weekStartDay)
    },
    getResolution: function () {
        return {
            unit: this.resolutionUnit,
            increment: this.resolutionIncrement
        }
    },
    setResolution: function (b, a) {
        this.resolutionUnit = b;
        this.resolutionIncrement = a || 1
    },
    shift: function (a, b) {
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), b, a), Sch.util.Date.add(this.getEnd(), b, a))
    },
    shiftNext: function (a) {
        a = a || this.getShiftIncrement();
        var b = this.getShiftUnit();
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), b, a), Sch.util.Date.add(this.getEnd(), b, a))
    },
    shiftPrevious: function (a) {
        a = -(a || this.getShiftIncrement());
        var b = this.getShiftUnit();
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), b, a), Sch.util.Date.add(this.getEnd(), b, a))
    },
    getShiftUnit: function () {
        return this.shiftUnit || this.mainUnit
    },
    getShiftIncrement: function () {
        return this.shiftIncrement || 1
    },
    getUnit: function () {
        return this.unit
    },
    getIncrement: function () {
        return this.increment
    },
    dateInAxis: function (a) {
        return Sch.util.Date.betweenLesser(a, this.getStart(), this.getEnd())
    },
    timeSpanInAxis: function (b, a) {
        if (this.isContinuous()) {
            return Sch.util.Date.intersectSpans(b, a, this.getStart(), this.getEnd())
        } else {
            return (b < this.getStart() && a > this.getEnd()) || this.getTickFromDate(b) !== this.getTickFromDate(a)
        }
    },
    forEachAuxInterval: function (h, b, a, f) {
        f = f || this;
        var c = this.getEnd(),
            g = this.getStart(),
            e = 0,
            d;
        if (g > c) {
            throw "Invalid time axis configuration"
        }
        while (g < c) {
            d = Sch.util.Date.min(this.getNext(g, h, b || 1), c);
            a.call(f, g, d, e);
            g = d;
            e++
        }
    },
    consumeViewPreset: function (a) {
        Ext.apply(this, {
            unit: a.getBottomHeader().unit,
            increment: a.getBottomHeader().increment || 1,
            resolutionUnit: a.timeResolution.unit,
            resolutionIncrement: a.timeResolution.increment,
            mainUnit: a.getMainHeader().unit,
            shiftUnit: a.shiftUnit,
            shiftIncrement: a.shiftIncrement || 1,
            defaultSpan: a.defaultSpan || 1
        })
    }
});
