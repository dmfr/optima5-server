Ext.define("Sch.mixin.Zoomable", {
    zoomLevels: [{
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
    initializeZooming: function() {
        this.zoomLevels = this.zoomLevels.slice();
        this.setMinZoomLevel(this.minZoomLevel || 0);
        this.setMaxZoomLevel(this.maxZoomLevel !== null ? this.maxZoomLevel : this.zoomLevels.length - 1);
        this.on("viewchange", this.clearCenterDateCache, this)
    },
    getZoomLevelUnit: function(a) {
        return Sch.preset.Manager.getPreset(a.preset).getBottomHeader().unit
    },
    getMilliSecondsPerPixelForZoomLevel: function(c, a) {
        var b = Sch.util.Date;
        return Math.round((b.add(new Date(1, 0, 1), this.getZoomLevelUnit(c), c.increment) - new Date(1, 0, 1)) / (a ? c.width : c.actualWidth || c.width))
    },
    presetToZoomLevel: function(b) {
        var a = Sch.preset.Manager.getPreset(b);
        return {
            preset: b,
            increment: a.getBottomHeader().increment || 1,
            resolution: a.timeResolution.increment,
            resolutionUnit: a.timeResolution.unit,
            width: a.timeColumnWidth
        }
    },
    zoomLevelToPreset: function(c) {
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
    calculateCurrentZoomLevel: function() {
        var g = this.presetToZoomLevel(this.viewPreset),
            d = Number.MAX_VALUE,
            b = this.timeAxisViewModel,
            f = b.timeColumnWidth;
        g.width = f;
        g.increment = b.getBottomHeader().increment || 1;
        for (var c = 0, a = this.zoomLevels.length; c < a; c++) {
            var e = this.zoomLevels[c];
            if (e.preset !== g.preset) {
                continue
            }
            var h = Math.abs(e.width - f);
            if (h < d) {
                d = h;
                g.actualWidth = e.actualWidth;
                g.width = e.width
            }
        }
        return g
    },
    getCurrentZoomLevelIndex: function() {
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
    setMaxZoomLevel: function(a) {
        if (a < 0 || a >= this.zoomLevels.length) {
            throw new Error("Invalid range for `setMinZoomLevel`")
        }
        this.maxZoomLevel = a
    },
    setMinZoomLevel: function(a) {
        if (a < 0 || a >= this.zoomLevels.length) {
            throw new Error("Invalid range for `setMinZoomLevel`")
        }
        this.minZoomLevel = a
    },
    getViewportCenterDateCached: function() {
        if (this.cachedCenterDate) {
            return this.cachedCenterDate
        }
        return this.cachedCenterDate = this.getViewportCenterDate()
    },
    clearCenterDateCache: function() {
        this.cachedCenterDate = null
    },
    zoomToLevel: function(b, r, e) {
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
        var i = this.mode == "vertical";
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
        o.timeResolution.unit = Sch.util.Date.getUnitByName(l.resolutionUnit || o.timeResolution.unit || p.unit);
        o.timeResolution.increment = l.resolution;
        this.setViewPreset(o, r.start || this.getStart(), r.end || this.getEnd(), false, true);
        l.actualWidth = this.timeAxisViewModel.getTickWidth();
        if (f) {
            g = e.centerDate || new Date((c.getStart().getTime() + c.getEnd().getTime()) / 2)
        }
        var k = null,
            j = null;
        if (i) {
            j = m.getYFromDate(g, true) - n / 2;
            s.on("scroll", function() {
                t.cachedCenterDate = g;
                m.scrollVerticallyTo(j);
                this.fireEvent("zoomchange", this, b, k, j)
            }, this, {
                single: true
            });
            m.scrollVerticallyTo(j - 1);
            m.scrollVerticallyTo(j)
        } else {
            k = m.getXFromDate(g, true) - n / 2;
            s.on("scroll", function() {
                t.cachedCenterDate = g;
                m.scrollHorizontallyTo(k);
                this.fireEvent("zoomchange", this, b, k, j)
            }, this, {
                single: true
            });
            m.scrollHorizontallyTo(k - 1);
            m.scrollHorizontallyTo(k)
        }
        t.isZooming = false;
        return b
    },
    setZoomLevel: function() {
        this.zoomToLevel.apply(this, arguments)
    },
    zoomToSpan: function(p, s) {
        if (p.start && p.end && p.start < p.end) {
            s = s || {};
            if (s.leftMargin || s.rightMargin) {
                s.adjustStart = 0;
                s.adjustEnd = 0
            }
            Ext.applyIf(s, {
                leftMargin: 0,
                rightMargin: 0
            });
            var g = p.start,
                d = p.end,
                e = s.adjustStart >= 0 && s.adjustEnd >= 0;
            if (e) {
                g = Sch.util.Date.add(g, this.timeAxis.mainUnit, -s.adjustStart);
                d = Sch.util.Date.add(d, this.timeAxis.mainUnit, s.adjustEnd)
            }
            var a = this.getSchedulingView().getTimeAxisViewModel().getAvailableWidth();
            var m = Math.floor(this.getCurrentZoomLevelIndex());
            if (m == -1) {
                m = 0
            }
            var t = this.zoomLevels;
            var b = d - g,
                j = this.getMilliSecondsPerPixelForZoomLevel(t[m], true),
                l = b / j + s.leftMargin + s.rightMargin > a ? -1 : 1,
                f = m + l;
            var o, h = null;
            while (f >= 0 && f <= t.length - 1) {
                o = t[f];
                j = this.getMilliSecondsPerPixelForZoomLevel(o, true);
                var q = b / j + s.leftMargin + s.rightMargin;
                if (l == -1) {
                    if (q <= a) {
                        h = f;
                        break
                    }
                } else {
                    if (q <= a) {
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
            o = t[h];
            var c = Sch.preset.Manager.getPreset(o.preset).getBottomHeader().unit;
            if (s.leftMargin || s.rightMargin) {
                g = new Date(g.getTime() - j * s.leftMargin);
                d = new Date(d.getTime() + j * s.rightMargin)
            }
            var r = Sch.util.Date.getDurationInUnit(g, d, c, true) / o.increment;
            if (r === 0) {
                return
            }
            var i = Math.floor(a / r);
            var k = new Date((g.getTime() + d.getTime()) / 2);
            var n;
            if (e) {
                n = {
                    start: g,
                    end: d
                }
            } else {
                n = this.calculateOptimalDateRange(k, a, o)
            }
            return this.zoomToLevel(h, n, {
                customWidth: i,
                centerDate: k
            })
        }
        return null
    },
    zoomIn: function(a) {
        a = a || 1;
        var b = this.getCurrentZoomLevelIndex();
        if (b >= this.zoomLevels.length - 1) {
            return null
        }
        return this.zoomToLevel(Math.floor(b) + a)
    },
    zoomOut: function(a) {
        a = a || 1;
        var b = this.getCurrentZoomLevelIndex();
        if (b <= 0) {
            return null
        }
        return this.zoomToLevel(Math.ceil(b) - a)
    },
    zoomInFull: function() {
        return this.zoomToLevel(this.maxZoomLevel)
    },
    zoomOutFull: function() {
        return this.zoomToLevel(this.minZoomLevel)
    },
    calculateOptimalDateRange: function(c, h, e, j) {
        if (j) {
            return j
        }
        var g = this.timeAxis;
        if (this.zoomKeepsOriginalTimespan) {
            return {
                start: g.getStart(),
                end: g.getEnd()
            }
        }
        var b = Sch.util.Date;
        var i = this.getZoomLevelUnit(e);
        var d = Math.ceil(h / e.width * e.increment * this.visibleZoomFactor / 2);
        var a = b.add(c, i, -d);
        var f = b.add(c, i, d);
        return {
            start: g.floorDate(a, false, i, e.increment),
            end: g.ceilDate(f, false, i, e.increment)
        }
    }
});
