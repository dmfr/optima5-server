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
    presetName: null,
    mode: "plain",
    startTime: 0,
    endTime: 24,
    constructor: function(a) {
        var c = this;
        a = a || {};
        if (c.setModel) {
            c.setModel(c.model)
        }
        c.setMode(a.mode || c.mode);
        c.originalContinuous = c.continuous;
        c.callParent(arguments);
        c.on(Ext.versions.touch ? "refresh" : "datachanged", function(d) {
            c.fireEvent("reconfigure", c, false)
        });
        c.on("endreconfigure", function(d, e) {
            d.fireEvent("reconfigure", d, e)
        });
        if (a.viewPreset) {
            var b = Sch.preset.Manager.getPreset(a.viewPreset);
            b && c.consumeViewPreset(b)
        }
        if (a.start || c.start) {
            c.reconfigure(a)
        }
    },
    reconfigure: function(d, a) {
        this.isConfigured = true;
        Ext.apply(this, d);
        var k = this.getAdjustedDates(d.start, d.end, true);
        var j = this.getAdjustedDates(d.start, d.end);
        var b = j.start;
        var e = j.end;
        if (this.fireEvent("beforereconfigure", this, b, e) !== false) {
            this.fireEvent("beginreconfigure", this);
            var h = this.unit;
            var i = this.increment || 1;
            var g = this.generateTicks(b, e, h, i, this.mainUnit);
            this.removeAll(true);
            this.suspendEvents();
            this.add(g);
            if (this.getCount() === 0) {
                Ext.Error.raise("Invalid time axis configuration or filter, please check your input data.")
            }
            this.resumeEvents();
            var c = Sch.util.Date;
            var f = g.length;
            if (this.isContinuous()) {
                this.adjustedStart = k.start;
                this.adjustedEnd = this.getNext(f > 1 ? g[f - 1].start : k.start, h, i)
            } else {
                this.adjustedStart = this.getStart();
                this.adjustedEnd = this.getEnd()
            }
            do {
                this.visibleTickStart = (this.getStart() - this.adjustedStart) / (c.getUnitDurationInMs(h) * i);
                if (this.visibleTickStart >= 1) {
                    this.adjustedStart = c.getNext(this.adjustedStart, h, i)
                }
            } while (this.visibleTickStart >= 1);
            do {
                this.visibleTickEnd = f - (this.adjustedEnd - this.getEnd()) / (c.getUnitDurationInMs(h) * i);
                if (f - this.visibleTickEnd >= 1) {
                    this.adjustedEnd = c.getNext(this.adjustedEnd, h, -1)
                }
            } while (f - this.visibleTickEnd >= 1);
            this.fireEvent("endreconfigure", this, a)
        }
    },
    setMode: function(a) {
        this.mode = a;
        if (a === "calendar") {
            this.generateTicksValidatorFn = function(b) {
                if (this.startTime > 0 || this.endTime < 24) {
                    return (b.getHours() >= this.startTime && b.getHours() < this.endTime)
                } else {
                    return true
                }
            }
        } else {
            this.generateTicksValidatorFn = function() {
                return true
            }
        }
    },
    setTimeSpan: function(c, a) {
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
    filterBy: function(b, a) {
        this.continuous = false;
        a = a || this;
        this.clearFilter(true);
        this.suspendEvents(true);
        this.filter([{
            filterFn: function(d, c) {
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
    isContinuous: function() {
        return this.continuous && !this.isFiltered()
    },
    clearFilter: function() {
        this.continuous = this.originalContinuous;
        this.callParent(arguments)
    },
    generateTicks: function(a, d, g, i) {
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
            this.generateTicksValidatorFn(a) && h.push({
                start: a,
                end: f
            });
            a = f
        }
        return h
    },
    getVisibleTickTimeSpan: function() {
        return this.isContinuous() ? this.visibleTickEnd - this.visibleTickStart : this.getCount()
    },
    getAdjustedDates: function(b, e, d) {
        var c = Sch.util.Date;
        b = b || this.getStart();
        e = e || c.add(b, this.mainUnit, this.defaultSpan);
        if (this.mode === "calendar") {
            if (this.shiftUnit === c.MONTH) {
                var g = c.add(b, c.WEEK, 1);
                var f = c.add(e, c.WEEK, -1);
                if (!e) {
                    e = this.getNext(b, this.shiftUnit, 1);
                    e = this.ceilDate(e, false, this.shiftUnit, 1);
                    e = this.ceilDate(e, false, this.mainUnit, 1)
                }
                if (g.getMonth() !== b.getMonth() && f.getMonth() !== e.getMonth()) {
                    return {
                        start: b,
                        end: e
                    }
                }
            }
            var i = this.floorDate(b, false, this.shiftUnit, 1);
            i = this.floorDate(i, false, this.mainUnit, 1);
            var h = this.getNext(b, this.shiftUnit, 1);
            var a = this.ceilDate(h, false, this.shiftUnit, 1);
            a = this.ceilDate(a, false, this.mainUnit, 1);
            return {
                start: i,
                end: a
            }
        } else {
            return this.autoAdjust || d ? {
                start: this.floorDate(b, false, this.autoAdjust ? this.mainUnit : this.unit, 1),
                end: this.ceilDate(e, false, this.autoAdjust ? this.mainUnit : this.unit, 1)
            } : {
                start: b,
                end: e
            }
        }
    },
    getTickFromDate: function(d) {
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
    getDateFromTick: function(e, i) {
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
    getTicks: function() {
        var a = [];
        this.each(function(b) {
            a.push(b.data)
        });
        return a
    },
    getStart: function() {
        var a = this.first();
        if (a) {
            return new Date(a.data.start)
        }
        return null
    },
    getEnd: function() {
        var a = this.last();
        if (a) {
            return new Date(a.data.end)
        }
        return null
    },
    floorDate: function(e, g, h, a) {
        g = g !== false;
        var c = Ext.Date.clone(e),
            d = g ? this.getStart() : null,
            l = a || this.resolutionIncrement,
            k;
        if (h) {
            k = h
        } else {
            k = g ? this.resolutionUnit : this.mainUnit
        }
        var b = Sch.util.Date;
        var f = function(n, m) {
            return Math.floor(n / m) * m
        };
        switch (k) {
            case b.MILLI:
                if (g) {
                    c = b.add(d, b.MILLI, f(b.getDurationInMilliseconds(d, c), l))
                }
                break;
            case b.SECOND:
                if (g) {
                    c = b.add(d, b.MILLI, f(b.getDurationInSeconds(d, c), l) * 1000)
                } else {
                    c.setMilliseconds(0);
                    c.setSeconds(f(c.getSeconds(), l))
                }
                break;
            case b.MINUTE:
                if (g) {
                    c = b.add(d, b.SECOND, f(b.getDurationInMinutes(d, c), l) * 60)
                } else {
                    c.setMinutes(f(c.getMinutes(), l));
                    c.setSeconds(0);
                    c.setMilliseconds(0)
                }
                break;
            case b.HOUR:
                if (g) {
                    c = b.add(d, b.MINUTE, f(b.getDurationInHours(this.getStart(), c), l) * 60)
                } else {
                    c.setMinutes(0);
                    c.setSeconds(0);
                    c.setMilliseconds(0);
                    c.setHours(f(c.getHours(), l))
                }
                break;
            case b.DAY:
                if (g) {
                    c = b.add(d, b.DAY, f(b.getDurationInDays(d, c), l))
                } else {
                    Sch.util.Date.clearTime(c);
                    c.setDate(f(c.getDate() - 1, l) + 1)
                }
                break;
            case b.WEEK:
                var j = c.getDay() || 7;
                var i = this.weekStartDay || 7;
                Sch.util.Date.clearTime(c);
                c = b.add(c, b.DAY, j >= i ? i - j : -(7 - i + j));
                if (c.getDay() !== i && c.getHours() === 23) {
                    c = b.add(c, b.HOUR, 1)
                }
                break;
            case b.MONTH:
                if (g) {
                    c = b.add(d, b.MONTH, f(b.getDurationInMonths(d, c), l))
                } else {
                    Sch.util.Date.clearTime(c);
                    c.setDate(1);
                    c.setMonth(f(c.getMonth(), l))
                }
                break;
            case b.QUARTER:
                Sch.util.Date.clearTime(c);
                c.setDate(1);
                c = b.add(c, b.MONTH, -(c.getMonth() % 3));
                break;
            case b.YEAR:
                if (g) {
                    c = b.add(d, b.YEAR, f(b.getDurationInYears(d, c), l))
                } else {
                    c = new Date(f(e.getFullYear() - 1, l) + 1, 0, 1)
                }
                break
        }
        return c
    },
    roundDate: function(r, b) {
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
                Sch.util.Date.clearTime(l);
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
                Sch.util.Date.clearTime(l);
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
    ceilDate: function(c, b, f) {
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
                Sch.util.Date.clearTime(e);
                if (e.getDay() !== this.weekStartDay || c.getTime() - e.getTime() > 0) {
                    g = true
                }
                break;
            case Sch.util.Date.MONTH:
                Sch.util.Date.clearTime(e);
                if (e.getDate() !== 1 || c.getTime() - e.getTime() > 0) {
                    g = true
                }
                break;
            case Sch.util.Date.QUARTER:
                Sch.util.Date.clearTime(e);
                if (e.getMonth() % 3 !== 0 || e.getDate() !== 1 || c.getTime() - e.getTime() > 0) {
                    g = true
                }
                break;
            case Sch.util.Date.YEAR:
                Sch.util.Date.clearTime(e);
                if (e.getMonth() !== 0 || e.getDate() !== 1 || c.getTime() - e.getTime() > 0) {
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
    getNext: function(b, c, a) {
        return Sch.util.Date.getNext(b, c, a, this.weekStartDay)
    },
    getResolution: function() {
        return {
            unit: this.resolutionUnit,
            increment: this.resolutionIncrement
        }
    },
    setResolution: function(b, a) {
        this.resolutionUnit = b;
        this.resolutionIncrement = a || 1
    },
    shift: function(a, b) {
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), b, a), Sch.util.Date.add(this.getEnd(), b, a))
    },
    shiftNext: function(a) {
        a = a || this.getShiftIncrement();
        var b = this.getShiftUnit();
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), b, a), Sch.util.Date.add(this.getEnd(), b, a))
    },
    shiftPrevious: function(a) {
        a = -(a || this.getShiftIncrement());
        var b = this.getShiftUnit();
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), b, a), Sch.util.Date.add(this.getEnd(), b, a))
    },
    getShiftUnit: function() {
        return this.shiftUnit || this.mainUnit
    },
    getShiftIncrement: function() {
        return this.shiftIncrement || 1
    },
    getUnit: function() {
        return this.unit
    },
    getIncrement: function() {
        return this.increment
    },
    getRowTicks: function() {
        if (this.mode === "plain") {
            return
        } else {
            var c = this.getStart();
            var a = Sch.util.Date.add(c, this.headerConfig.middle.splitUnit, 1);
            var b = this.findBy(function(d) {
                return d.getStartDate().getTime() >= a.getTime()
            });
            if (b === -1) {
                return this.getRange()
            }
            return this.getRange(0, b - 1)
        }
    },
    dateInAxis: function(a) {
        return Sch.util.Date.betweenLesser(a, this.getStart(), this.getEnd())
    },
    timeSpanInAxis: function(b, a) {
        if (this.isContinuous()) {
            return Sch.util.Date.intersectSpans(b, a, this.getStart(), this.getEnd())
        } else {
            return (b < this.getStart() && a > this.getEnd()) || this.getTickFromDate(b) !== this.getTickFromDate(a)
        }
    },
    isRangeInAxis: function(b) {
        var c = b.getStartDate(),
            a = b.getEndDate();
        if (!c || !a) {
            return false
        }
        return this.timeSpanInAxis(c, a)
    },
    forEachAuxInterval: function(h, b, a, f) {
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
    consumeViewPreset: function(a) {
        Ext.apply(this, {
            unit: a.getBottomHeader().unit,
            increment: a.getBottomHeader().increment || 1,
            resolutionUnit: a.timeResolution.unit,
            resolutionIncrement: a.timeResolution.increment,
            mainUnit: a.getMainHeader().unit,
            shiftUnit: a.shiftUnit,
            shiftIncrement: a.shiftIncrement || 1,
            defaultSpan: a.defaultSpan || 1,
            presetName: a.name,
            headerConfig: a.headerConfig
        })
    }
});
