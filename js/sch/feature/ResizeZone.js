Ext.define("Sch.feature.ResizeZone", {
    extend: "Ext.util.Observable",
    requires: ["Ext.resizer.Resizer", "Sch.tooltip.Tooltip", "Sch.util.ScrollManager"],
    showTooltip: true,
    showExactResizePosition: false,
    validatorFn: Ext.emptyFn,
    validatorFnScope: null,
    schedulerView: null,
    origEl: null,
    handlePos: null,
    eventRec: null,
    tip: null,
    startScroll: null,
    constructor: function (a) {
        Ext.apply(this, a);
        var b = this.schedulerView;
        b.on({
            destroy: this.cleanUp,
            scope: this
        });
        b.mon(b.el, {
            mousedown: this.onMouseDown,
            mouseup: this.onMouseUp,
            scope: this,
            delegate: ".sch-resizable-handle"
        });
        this.callParent(arguments)
    },
    onMouseDown: function (f, a) {
        var b = this.schedulerView;
        var d = this.eventRec = b.resolveEventRecord(a);
        var c = d.isResizable();
        if (f.button !== 0 || (c === false || typeof c === "string" && !a.className.match(c))) {
            return
        }
        this.eventRec = d;
        this.handlePos = this.getHandlePosition(a);
        this.origEl = Ext.get(f.getTarget(".sch-event"));
        b.el.on({
            mousemove: this.onMouseMove,
            scope: this,
            single: true
        })
    },
    onMouseUp: function (c, a) {
        var b = this.schedulerView;
        b.el.un({
            mousemove: this.onMouseMove,
            scope: this,
            single: true
        })
    },
    onMouseMove: function (g, a) {
        var b = this.schedulerView;
        var f = this.eventRec;
        var d = this.handlePos;
        if (!f || b.fireEvent("beforeeventresize", b, f, g) === false) {
            return
        }
        delete this.eventRec;
        g.stopEvent();
        this.resizer = this.createResizer(this.origEl, f, d, g, a);
        var c = this.resizer.resizeTracker;
        if (this.showTooltip) {
            if (!this.tip) {
                this.tip = Ext.create("Sch.tooltip.Tooltip", {
                    schedulerView: b,
                    renderTo: b.getSecondaryCanvasEl(),
                    cls: "sch-resize-tip"
                })
            }
            this.tip.update(f.getStartDate(), f.getEndDate(), true);
            this.tip.show(this.origEl)
        }
        c.onMouseDown(g, this.resizer[d].dom);
        c.onMouseMove(g, this.resizer[d].dom);
        b.fireEvent("eventresizestart", b, f);
        b.el.on("scroll", this.onViewElScroll, this)
    },
    getHandlePosition: function (b) {
        var a = b.className.match("start");
        if (this.schedulerView.getOrientation() === "horizontal") {
            if (this.schedulerView.rtl) {
                return a ? "east" : "west"
            }
            return a ? "west" : "east"
        } else {
            return a ? "north" : "south"
        }
    },
    createResizer: function (c, f, p) {
        var m = this.schedulerView,
            t = this,
            b = m.getElementFromEventRecord(f),
            g = m.resolveResource(c),
            r = m.getSnapPixelAmount(),
            o = m.getScheduleRegion(g, f),
            q = m.getDateConstraints(g, f),
            n = c.getHeight,
            h = (m.rtl && p[0] === "e") || (!m.rtl && p[0] === "w") || p[0] === "n",
            i = m.getOrientation() === "vertical",
            e = {
                otherEdgeX: h ? b.getRight() : b.getLeft(),
                target: b,
                isStart: h,
                dateConstraints: q,
                resourceRecord: g,
                eventRecord: f,
                handles: p[0],
                minHeight: n,
                constrainTo: o,
                listeners: {
                    resizedrag: this.partialResize,
                    resize: this.afterResize,
                    scope: this
                }
            };
        var d = c.id;
        var k = "_" + d;
        c.id = c.dom.id = k;
        Ext.cache[k] = Ext.cache[d];
        if (i) {
            if (r > 0) {
                var j = c.getWidth();
                Ext.apply(e, {
                    minHeight: r,
                    minWidth: j,
                    maxWidth: j,
                    heightIncrement: r
                })
            }
        } else {
            if (r > 0) {
                Ext.apply(e, {
                    minWidth: r,
                    maxHeight: n,
                    widthIncrement: r
                })
            }
        }
        var l = new Ext.resizer.Resizer(e);
        if (l.resizeTracker) {
            l.resizeTracker.tolerance = -1;
            var a = l.resizeTracker.updateDimensions;
            l.resizeTracker.updateDimensions = function (u) {
                if (!Ext.isWebKit || u.getTarget(".sch-timelineview")) {
                    var s;
                    if (i) {
                        s = m.el.getScroll().top - t.startScroll.top;
                        l.resizeTracker.minHeight = e.minHeight - Math.abs(s)
                    } else {
                        s = m.el.getScroll().left - t.startScroll.left;
                        l.resizeTracker.minWidth = e.minWidth - Math.abs(s)
                    }
                    a.apply(this, arguments)
                }
            };
            l.resizeTracker.resize = function (s) {
                var u;
                if (i) {
                    u = m.el.getScroll().top - t.startScroll.top;
                    if (p[0] === "s") {
                        s.y -= u
                    }
                    s.height += Math.abs(u)
                } else {
                    u = m.el.getScroll().left - t.startScroll.left;
                    if (p[0] === "e") {
                        s.x -= u
                    }
                    s.width += Math.abs(u)
                }
                Ext.resizer.ResizeTracker.prototype.resize.apply(this, arguments)
            }
        }
        c.setStyle("z-index", parseInt(c.getStyle("z-index"), 10) + 1);
        Sch.util.ScrollManager.register(m.el);
        this.startScroll = m.el.getScroll();
        return l
    },
    getStartEndDates: function (f) {
        var e = this.resizer,
            c = e.el,
            d = this.schedulerView,
            b = e.isStart,
            g, a;
        if (b) {
            a = e.eventRecord.getEndDate();
            if (d.snapRelativeToEventStartDate) {
                g = d.getDateFromXY([d.rtl ? c.getRight() : c.getLeft() + 1, c.getTop()]);
                g = d.timeAxis.roundDate(g, e.eventRecord.getStartDate())
            } else {
                g = d.getDateFromXY([d.rtl ? c.getRight() : c.getLeft() + 1, c.getTop()], "round")
            }
        } else {
            g = e.eventRecord.getStartDate();
            if (d.snapRelativeToEventStartDate) {
                a = d.getDateFromXY([d.rtl ? c.getLeft() : c.getRight(), c.getBottom()]);
                a = d.timeAxis.roundDate(a, e.eventRecord.getEndDate())
            } else {
                a = d.getDateFromXY([d.rtl ? c.getLeft() : c.getRight(), c.getBottom()], "round")
            }
        } if (e.dateConstraints) {
            g = Sch.util.Date.constrain(g, e.dateConstraints.start, e.dateConstraints.end);
            a = Sch.util.Date.constrain(a, e.dateConstraints.start, e.dateConstraints.end)
        }
        return {
            start: g,
            end: a
        }
    },
    partialResize: function (b, g, m, l) {
        var p = this.schedulerView,
            o = l.type === "scroll" ? this.resizer.resizeTracker.lastXY : l.getXY(),
            n = this.getStartEndDates(o),
            f = n.start,
            h = n.end,
            j = b.eventRecord;
        if (p.isHorizontal()) {
            b.target.el.setY(this.resizer.constrainTo.top - p.getScroll().top + this.startScroll.top)
        }
        if (this.showTooltip) {
            var a = this.validatorFn.call(this.validatorFnScope || this, b.resourceRecord, j, f, h) !== false;
            this.tip.update(f, h, a)
        }
        if (this.showExactResizePosition) {
            var k = b.target.el,
                d;
            if (b.isStart) {
                d = p.timeAxisViewModel.getDistanceBetweenDates(f, j.getEndDate());
                k.setWidth(d);
                var c = p.getDateFromCoordinate(b.otherEdgeX - Math.min(g, b.maxWidth)) || f;
                var i = p.timeAxisViewModel.getDistanceBetweenDates(c, f);
                k.setX(k.getX() + i)
            } else {
                d = p.timeAxisViewModel.getDistanceBetweenDates(j.getStartDate(), h);
                k.setWidth(d)
            }
        } else {
            if (!f || !h || ((b.start - f === 0) && (b.end - h === 0))) {
                return
            }
        }
        b.end = h;
        b.start = f;
        p.fireEvent("eventpartialresize", p, j, f, h, b.el)
    },
    onViewElScroll: function (b, a) {
        this.resizer.resizeTracker.onDrag.apply(this.resizer.resizeTracker, arguments);
        this.partialResize(this.resizer, 0, 0, b)
    },
    afterResize: function (a, m, f, g) {
        var j = this,
            i = a.resourceRecord,
            k = a.eventRecord,
            d = k.getStartDate(),
            p = k.getEndDate(),
            b = a.start || d,
            c = a.end || p,
            o = j.schedulerView,
            n = false,
            l = true;
        Sch.util.ScrollManager.unregister(o.el);
        o.el.un("scroll", this.onViewElScroll, this);
        if (this.showTooltip) {
            this.tip.hide()
        }
        delete Ext.cache[a.el.id];
        a.el.id = a.el.dom.id = a.el.id.substr(1);
        j.resizeContext = {
            resourceRecord: a.resourceRecord,
            eventRecord: k,
            start: b,
            end: c,
            finalize: function () {
                j.finalize.apply(j, arguments)
            }
        };
        if (b && c && (c - b > 0) && ((b - d !== 0) || (c - p !== 0)) && j.validatorFn.call(j.validatorFnScope || j, i, k, b, c, g) !== false) {
            l = o.fireEvent("beforeeventresizefinalize", j, j.resizeContext, g) !== false;
            n = true
        } else {
            o.repaintEventsForResource(i)
        } if (l) {
            j.finalize(n)
        }
    },
    finalize: function (a) {
        var b = this.schedulerView;
        var d = this.resizeContext;
        var c = false;
        d.eventRecord.store.on("update", function () {
            c = true
        }, null, {
            single: true
        });
        if (a) {
            if (this.resizer.isStart) {
                d.eventRecord.setStartDate(d.start, false, b.eventStore.skipWeekendsDuringDragDrop)
            } else {
                d.eventRecord.setEndDate(d.end, false, b.eventStore.skipWeekendsDuringDragDrop)
            } if (!c) {
                b.repaintEventsForResource(d.resourceRecord)
            }
        } else {
            b.repaintEventsForResource(d.resourceRecord)
        }
        this.resizer.destroy();
        b.fireEvent("eventresizeend", b, d.eventRecord);
        this.resizeContext = null
    },
    cleanUp: function () {
        if (this.tip) {
            this.tip.destroy()
        }
    }
});
