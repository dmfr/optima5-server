Ext.define("Sch.mixin.Zoomable", {
    zoomLevels: [{
        width: 80,
        increment: 5,
        resolution: 1,
        preset: "manyYears",
        resolutionUnit: "YEAR"
    }, {
        width: 40,
        increment: 1,
        resolution: 1,
        preset: "manyYears",
        resolutionUnit: "YEAR"
    }, {
        width: 80,
        increment: 1,
        resolution: 1,
        preset: "manyYears",
        resolutionUnit: "YEAR"
    }, {
        width: 30,
        increment: 1,
        resolution: 1,
        preset: "year",
        resolutionUnit: "MONTH"
    }, {
        width: 50,
        increment: 1,
        resolution: 1,
        preset: "year",
        resolutionUnit: "MONTH"
    }, {
        width: 100,
        increment: 1,
        resolution: 1,
        preset: "year",
        resolutionUnit: "MONTH"
    }, {
        width: 200,
        increment: 1,
        resolution: 1,
        preset: "year",
        resolutionUnit: "MONTH"
    }, {
        width: 100,
        increment: 1,
        resolution: 7,
        preset: "monthAndYear",
        resolutionUnit: "DAY"
    }, {
        width: 30,
        increment: 1,
        resolution: 1,
        preset: "weekDateAndMonth",
        resolutionUnit: "DAY"
    }, {
        width: 35,
        increment: 1,
        resolution: 1,
        preset: "weekAndMonth",
        resolutionUnit: "DAY"
    }, {
        width: 50,
        increment: 1,
        resolution: 1,
        preset: "weekAndMonth",
        resolutionUnit: "DAY"
    }, {
        width: 20,
        increment: 1,
        resolution: 1,
        preset: "weekAndDayLetter"
    }, {
        width: 50,
        increment: 1,
        resolution: 1,
        preset: "weekAndDay",
        resolutionUnit: "HOUR"
    }, {
        width: 100,
        increment: 1,
        resolution: 1,
        preset: "weekAndDay",
        resolutionUnit: "HOUR"
    }, {
        width: 50,
        increment: 6,
        resolution: 30,
        preset: "hourAndDay",
        resolutionUnit: "MINUTE"
    }, {
        width: 100,
        increment: 6,
        resolution: 30,
        preset: "hourAndDay",
        resolutionUnit: "MINUTE"
    }, {
        width: 60,
        increment: 2,
        resolution: 30,
        preset: "hourAndDay",
        resolutionUnit: "MINUTE"
    }, {
        width: 60,
        increment: 1,
        resolution: 30,
        preset: "hourAndDay",
        resolutionUnit: "MINUTE"
    }, {
        width: 30,
        increment: 15,
        resolution: 5,
        preset: "minuteAndHour"
    }, {
        width: 60,
        increment: 15,
        resolution: 5,
        preset: "minuteAndHour"
    }, {
        width: 130,
        increment: 15,
        resolution: 5,
        preset: "minuteAndHour"
    }, {
        width: 60,
        increment: 5,
        resolution: 5,
        preset: "minuteAndHour"
    }, {
        width: 100,
        increment: 5,
        resolution: 5,
        preset: "minuteAndHour"
    }, {
        width: 50,
        increment: 2,
        resolution: 1,
        preset: "minuteAndHour"
    }, {
        width: 30,
        increment: 10,
        resolution: 5,
        preset: "secondAndMinute"
    }, {
        width: 60,
        increment: 10,
        resolution: 5,
        preset: "secondAndMinute"
    }, {
        width: 130,
        increment: 5,
        resolution: 5,
        preset: "secondAndMinute"
    }],
    minZoomLevel: null,
    maxZoomLevel: null,
    visibleZoomFactor: 5,
    zoomKeepsOriginalTimespan: false,
    cachedCenterDate: null,
    isFirstZoom: true,
    isZooming: false,
    initializeZooming: function () {
        this.zoomLevels = this.zoomLevels.slice();
        this.setMinZoomLevel(this.minZoomLevel || 0);
        this.setMaxZoomLevel(this.maxZoomLevel !== null ? this.maxZoomLevel : this.zoomLevels.length - 1);
        this.on("viewchange", this.clearCenterDateCache, this)
    },
    getZoomLevelUnit: function (a) {
        return Sch.preset.Manager.getPreset(a.preset).getBottomHeader().unit
    },
    getMilliSecondsPerPixelForZoomLevel: function (c, a) {
        var b = Sch.util.Date;
        return Math.round((b.add(new Date(1, 0, 1), this.getZoomLevelUnit(c), c.increment) - new Date(1, 0, 1)) / (a ? c.width : c.actualWidth || c.width))
    },
    presetToZoomLevel: function (b) {
        var a = Sch.preset.Manager.getPreset(b);
        return {
            preset: b,
            increment: a.getBottomHeader().increment || 1,
            resolution: a.timeResolution.increment,
            resolutionUnit: a.timeResolution.unit,
            width: a.timeColumnWidth
        }
    },
    zoomLevelToPreset: function (c) {
        var b = Sch.preset.Manager.getPreset(c.preset).clone();
        var a = b.getBottomHeader();
        a.increment = c.increment;
        b.timeColumnWidth = c.width;
        if (c.resolutionUnit || c.resolution) {
            b.timeResolution = {
                unit: c.resolutionUnit || b.timeResolution.unit || a.unit,
                increment: c.resolution || b.timeResolution.increment || 1
            }
        }
        return b
    },
    calculateCurrentZoomLevel: function () {
        var a = this.presetToZoomLevel(this.viewPreset);
        a.width = this.timeAxisViewModel.timeColumnWidth;
        a.increment = this.timeAxisViewModel.getBottomHeader().increment || 1;
        return a
    },
    getCurrentZoomLevelIndex: function () {
        var f = this.calculateCurrentZoomLevel();
        var b = this.getMilliSecondsPerPixelForZoomLevel(f);
        var e = this.zoomLevels;
        for (var c = 0; c < e.length; c++) {
            var d = this.getMilliSecondsPerPixelForZoomLevel(e[c]);
            if (d == b) {
                return c
            }
            if (c === 0 && b > d) {
                return -0.5
            }
            if (c == e.length - 1 && b < d) {
                return e.length - 1 + 0.5
            }
            var a = this.getMilliSecondsPerPixelForZoomLevel(e[c + 1]);
            if (d > b && b > a) {
                return c + 0.5
            }
        }
        throw "Can't find current zoom level index"
    },
    setMaxZoomLevel: function (a) {
        if (a < 0 || a >= this.zoomLevels.length) {
            throw new Error("Invalid range for `setMinZoomLevel`")
        }
        this.maxZoomLevel = a
    },
    setMinZoomLevel: function (a) {
        if (a < 0 || a >= this.zoomLevels.length) {
            throw new Error("Invalid range for `setMinZoomLevel`")
        }
        this.minZoomLevel = a
    },
    getViewportCenterDateCached: function () {
        if (this.cachedCenterDate) {
            return this.cachedCenterDate
        }
        return this.cachedCenterDate = this.getViewportCenterDate()
    },
    clearCenterDateCache: function () {
        this.cachedCenterDate = null
    },
    zoomToLevel: function (b, r, e) {
        b = Ext.Number.constrain(b, this.minZoomLevel, this.maxZoomLevel);
        e = e || {};
        var q = this.calculateCurrentZoomLevel();
        var d = this.getMilliSecondsPerPixelForZoomLevel(q);
        var l = this.zoomLevels[b];
        var a = this.getMilliSecondsPerPixelForZoomLevel(l);
        if (d == a && !r) {
            return null
        }
        var t = this;
        var m = this.getSchedulingView();
        var h = m.getOuterEl();
        var s = m.getScrollEventSource();
        if (this.isFirstZoom) {
            this.isFirstZoom = false;
            s.on("scroll", this.clearCenterDateCache, this)
        }
        var i = this.orientation == "vertical";
        var g = r ? new Date((r.start.getTime() + r.end.getTime()) / 2) : this.getViewportCenterDateCached();
        var n = i ? h.getHeight() : h.getWidth();
        var o = Sch.preset.Manager.getPreset(l.preset).clone();
        var p = o.getBottomHeader();
        var f = Boolean(r);
        r = this.calculateOptimalDateRange(g, n, l, r);
        o[i ? "timeRowHeight" : "timeColumnWidth"] = e.customWidth || l.width;
        p.increment = l.increment;
        this.isZooming = true;
        this.viewPreset = l.preset;
        var c = this.timeAxis;
        o.increment = l.increment;
        o.resolutionUnit = Sch.util.Date.getUnitByName(l.resolutionUnit || p.unit);
        o.resolutionIncrement = l.resolution;
        this.switchViewPreset(o, r.start || this.getStart(), r.end || this.getEnd(), false, true);
        l.actualWidth = this.timeAxisViewModel.getTickWidth();
        if (f) {
            g = e.centerDate || new Date((c.getStart().getTime() + c.getEnd().getTime()) / 2)
        }
        s.on("scroll", function () {
            t.cachedCenterDate = g
        }, this, {
            single: true
        });
        if (i) {
            var j = m.getYFromDate(g, true);
            m.scrollVerticallyTo(j - n / 2)
        } else {
            var k = m.getXFromDate(g, true);
            m.scrollHorizontallyTo(k - n / 2)
        }
        t.isZooming = false;
        this.fireEvent("zoomchange", this, b);
        return b
    },
    zoomToSpan: function (r, u) {
        if (r.start && r.end && r.start < r.end) {
            var g = r.start,
                d = r.end,
                e = u && u.adjustStart >= 0 && u.adjustEnd >= 0;
            if (e) {
                g = Sch.util.Date.add(g, this.timeAxis.mainUnit, -u.adjustStart);
                d = Sch.util.Date.add(d, this.timeAxis.mainUnit, u.adjustEnd)
            }
            var a = this.getSchedulingView().getTimeAxisViewModel().getAvailableWidth();
            var m = Math.floor(this.getCurrentZoomLevelIndex());
            if (m == -1) {
                m = 0
            }
            var v = this.zoomLevels;
            var o, b = d - g,
                j = this.getMilliSecondsPerPixelForZoomLevel(v[m], true),
                l = b / j > a ? -1 : 1,
                f = m + l;
            var p, q, h = null;
            while (f >= 0 && f <= v.length - 1) {
                p = v[f];
                var s = b / this.getMilliSecondsPerPixelForZoomLevel(p, true);
                if (l == -1) {
                    if (s <= a) {
                        h = f;
                        break
                    }
                } else {
                    if (s <= a) {
                        if (m !== f - l) {
                            h = f
                        }
                    } else {
                        break
                    }
                }
                f += l
            }
            h = h !== null ? h : f - l;
            p = v[h];
            var c = Sch.preset.Manager.getPreset(p.preset).getBottomHeader().unit;
            var t = Sch.util.Date.getDurationInUnit(g, d, c) / p.increment;
            if (t === 0) {
                return
            }
            var i = Math.floor(a / t);
            var k = new Date((g.getTime() + d.getTime()) / 2);
            var n;
            if (e) {
                n = {
                    start: g,
                    end: d
                }
            } else {
                n = this.calculateOptimalDateRange(k, a, p)
            }
            return this.zoomToLevel(h, n, {
                customWidth: i,
                centerDate: k
            })
        }
        return null
    },
    zoomIn: function (a) {
        a = a || 1;
        var b = this.getCurrentZoomLevelIndex();
        if (b >= this.zoomLevels.length - 1) {
            return null
        }
        return this.zoomToLevel(Math.floor(b) + a)
    },
    zoomOut: function (a) {
        a = a || 1;
        var b = this.getCurrentZoomLevelIndex();
        if (b <= 0) {
            return null
        }
        return this.zoomToLevel(Math.ceil(b) - a)
    },
    zoomInFull: function () {
        return this.zoomToLevel(this.maxZoomLevel)
    },
    zoomOutFull: function () {
        return this.zoomToLevel(this.minZoomLevel)
    },
    calculateOptimalDateRange: function (c, i, e, l) {
        if (l) {
            return l
        }
        var h = this.timeAxis;
        if (this.zoomKeepsOriginalTimespan) {
            return {
                start: h.getStart(),
                end: h.getEnd()
            }
        }
        var b = Sch.util.Date;
        var j = Sch.preset.Manager.getPreset(e.preset).headerConfig;
        var f = j.top ? j.top.unit : j.middle.unit;
        var k = this.getZoomLevelUnit(e);
        var d = Math.ceil(i / e.width * e.increment * this.visibleZoomFactor / 2);
        var a = b.add(c, k, -d);
        var g = b.add(c, k, d);
        return {
            start: h.floorDate(a, false, k, e.increment),
            end: h.ceilDate(g, false, k, e.increment)
        }
    }
});
