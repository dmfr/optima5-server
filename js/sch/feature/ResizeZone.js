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
    tipInstance: null,
    startScroll: null,
    constructor: function(a) {
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
    onMouseDown: function(f, a) {
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
    onMouseUp: function(c, a) {
        var b = this.schedulerView;
        b.el.un({
            mousemove: this.onMouseMove,
            scope: this,
            single: true
        })
    },
    getTipInstance: function() {
        if (this.tipInstance) {
            return this.tipInstance
        }
        var a = this.schedulerView;
        var c = this.tip;
        var b = a.up("[lockable=true]").el;
        if (c instanceof Ext.tip.ToolTip) {
            Ext.applyIf(c, {
                schedulerView: a
            })
        } else {
            c = new Sch.tooltip.Tooltip(Ext.apply({
                rtl: this.rtl,
                schedulerView: a,
                constrainTo: b,
                cls: "sch-resize-tip",
                onMyMouseMove: function(d) {
                    this.el.alignTo(this.target, "bl-tl", [d.getX() - this.target.getX(), -5])
                }
            }, c))
        }
        return this.tipInstance = c
    },
    onMouseMove: function(h, a) {
        var b = this.schedulerView,
            g = this.eventRec,
            d = this.handlePos;
        if (!g || b.fireEvent("beforeeventresize", b, g, h) === false) {
            return
        }
        delete this.eventRec;
        h.stopEvent();
        this.origEl.addCls("sch-event-resizing");
        this.resizer = this.createResizer(this.origEl, g, d);
        var c = this.resizer.resizeTracker;
        if (this.showTooltip) {
            var f = this.getTipInstance();
            f.setTarget(this.origEl);
            f.update(g.getStartDate(), g.getEndDate(), true);
            f.show(this.origEl)
        }
        c.onMouseDown(h, this.resizer[d].dom);
        c.onMouseMove(h, this.resizer[d].dom);
        b.fireEvent("eventresizestart", b, g);
        b.el.on("scroll", this.onViewElScroll, this)
    },
    getHandlePosition: function(b) {
        var a = b.className.match("start");
        if (this.schedulerView.getMode() === "horizontal") {
            if (this.schedulerView.rtl) {
                return a ? "east" : "west"
            }
            return a ? "west" : "east"
        } else {
            return a ? "north" : "south"
        }
    },
    createResizer: function(b, e, o) {
        var l = this.schedulerView,
            r = this,
            f = l.resolveResource(b),
            q = l.getSnapPixelAmount(),
            n = l.getScheduleRegion(f, e),
            p = l.getDateConstraints(f, e),
            m = b.getHeight(),
            g = (l.rtl && o[0] === "e") || (!l.rtl && o[0] === "w") || o[0] === "n",
            h = l.getMode() !== "horizontal",
            d = {
                otherEdgeX: g ? b.getRight() : b.getLeft(),
                otherEdgeY: g ? b.getBottom() : b.getTop(),
                target: b,
                isStart: g,
                startYOffset: b.getY() - b.parent().getY(),
                startXOffset: b.getX() - b.parent().getX(),
                dateConstraints: p,
                resourceRecord: f,
                eventRecord: e,
                handles: o[0],
                minHeight: m,
                constrainTo: n,
                listeners: {
                    resizedrag: this.partialResize,
                    resize: this.afterResize,
                    scope: this
                }
            };
        var c = b.id;
        var j = "_" + c;
        b.id = b.dom.id = j;
        Ext.cache[j] = Ext.cache[c];
        if (h) {
            if (q > 0) {
                var i = b.getWidth();
                Ext.apply(d, {
                    minHeight: q,
                    minWidth: i,
                    maxWidth: i,
                    heightIncrement: q
                })
            }
        } else {
            if (q > 0) {
                Ext.apply(d, {
                    minWidth: q,
                    maxHeight: m,
                    widthIncrement: q
                })
            }
        }
        var k = new Ext.resizer.Resizer(d);
        k.prevId = c;
        if (k.resizeTracker) {
            k.resizeTracker.tolerance = -1;
            var a = k.resizeTracker.updateDimensions;
            k.resizeTracker.updateDimensions = function(t) {
                if (!Ext.isWebKit || t.getTarget(".sch-timelineview")) {
                    var s;
                    if (h) {
                        s = l.el.getScroll().top - r.startScroll.top;
                        k.resizeTracker.minHeight = d.minHeight - Math.abs(s)
                    } else {
                        s = l.el.getScroll().left - r.startScroll.left;
                        k.resizeTracker.minWidth = d.minWidth - Math.abs(s)
                    }
                    a.apply(this, arguments)
                }
            };
            k.resizeTracker.resize = function(s) {
                var t;
                if (h) {
                    t = l.el.getScroll().top - r.startScroll.top;
                    if (o[0] === "s") {
                        s.y -= t
                    }
                    s.height += Math.abs(t)
                } else {
                    t = l.el.getScroll().left - r.startScroll.left;
                    if (o[0] === "e") {
                        s.x -= t
                    }
                    s.width += Math.abs(t)
                }
                Ext.resizer.ResizeTracker.prototype.resize.apply(this, arguments)
            }
        }
        b.setStyle("z-index", parseInt(b.getStyle("z-index"), 10) + 1);
        Sch.util.ScrollManager.activate(l, l.getMode() === "horizontal" ? "horizontal" : "vertical");
        this.startScroll = l.el.getScroll();
        return k
    },
    getStartEndDates: function() {
        var e = this.resizer,
            c = e.el,
            d = this.schedulerView,
            b = e.isStart,
            g, a, f;
        if (b) {
            if (d.getMode() === "horizontal") {
                f = [d.rtl ? c.getRight() : c.getLeft() + 1, c.getTop()]
            } else {
                f = [(c.getRight() + c.getLeft()) / 2, c.getTop()]
            }
            a = e.eventRecord.getEndDate();
            if (d.snapRelativeToEventStartDate) {
                g = d.getDateFromXY(f);
                g = d.timeAxis.roundDate(g, e.eventRecord.getStartDate())
            } else {
                g = d.getDateFromXY(f, "round")
            }
        } else {
            if (d.getMode() === "horizontal") {
                f = [d.rtl ? c.getLeft() : c.getRight(), c.getBottom()]
            } else {
                f = [(c.getRight() + c.getLeft()) / 2, c.getBottom()]
            }
            g = e.eventRecord.getStartDate();
            if (d.snapRelativeToEventStartDate) {
                a = d.getDateFromXY(f);
                a = d.timeAxis.roundDate(a, e.eventRecord.getEndDate())
            } else {
                a = d.getDateFromXY(f, "round")
            }
        }
        g = g || e.start;
        a = a || e.end;
        if (e.dateConstraints) {
            g = Sch.util.Date.constrain(g, e.dateConstraints.start, e.dateConstraints.end);
            a = Sch.util.Date.constrain(a, e.dateConstraints.start, e.dateConstraints.end)
        }
        return {
            start: g,
            end: a
        }
    },
    partialResize: function(o, t, p, u) {
        var m = this.schedulerView,
            g = u.type === "scroll" ? this.resizer.resizeTracker.lastXY : u.getXY(),
            n = this.getStartEndDates(g),
            d = n.start,
            c = n.end,
            b = o.eventRecord,
            l = m.getMode(),
            i = m.isHorizontal();
        if (i) {
            o.target.el.setY(o.target.parent().getY() + o.startYOffset)
        } else {
            o.target.el.setX(o.target.parent().getX() + o.startXOffset)
        }
        if (this.showTooltip) {
            var q = this.validatorFn.call(this.validatorFnScope || this, o.resourceRecord, b, d, c);
            var k = "";
            if (q && typeof q !== "boolean") {
                k = q.message;
                q = q.valid
            }
            this.getTipInstance().update(d, c, q !== false, k)
        }
        if (this.showExactResizePosition) {
            var v = o.target.el,
                h, j, f;
            if (o.isStart) {
                if (m.getMode() === "calendar") {
                    var a = m.calendar.getEventColumns(b)[0];
                    h = m.timeAxisViewModel.getDistanceBetweenDates(d, a.end)
                } else {
                    h = m.timeAxisViewModel.getDistanceBetweenDates(d, b.getEndDate())
                }
                if (i) {
                    j = m.getDateFromCoordinate(o.otherEdgeX - Math.min(t, o.maxWidth)) || d;
                    f = m.timeAxisViewModel.getDistanceBetweenDates(j, d);
                    v.setWidth(h);
                    v.setX(v.getX() + f)
                } else {
                    j = m.getDateFromCoordinate(o.otherEdgeY - Math.min(t, o.maxHeight)) || d;
                    f = m.timeAxisViewModel.getDistanceBetweenDates(j, d);
                    v.setHeight(h);
                    v.setY(v.getY() + f)
                }
            } else {
                h = m.timeAxisViewModel.getDistanceBetweenDates(b.getStartDate(), c);
                if (i) {
                    v.setWidth(h)
                } else {
                    v.setHeight(h)
                }
            }
        } else {
            if (!d || !c || ((o.start - d === 0) && (o.end - c === 0))) {
                return
            }
        }
        o.end = c;
        o.start = d;
        m.fireEvent("eventpartialresize", m, b, d, c, o.el)
    },
    onViewElScroll: function(b, a) {
        this.resizer.resizeTracker.onDrag.apply(this.resizer.resizeTracker, arguments);
        this.partialResize(this.resizer, 0, 0, b)
    },
    afterResize: function(b, n, g, i) {
        var k = this,
            j = b.resourceRecord,
            l = b.eventRecord,
            f = l.getStartDate(),
            q = l.getEndDate(),
            c = b.start || f,
            d = b.end || q,
            p = k.schedulerView,
            o = false,
            m = true,
            a = k.validatorFn.call(k.validatorFnScope || k, j, l, c, d, i);
        Sch.util.ScrollManager.deactivate();
        p.el.un("scroll", this.onViewElScroll, this);
        if (this.showTooltip) {
            this.getTipInstance().hide()
        }
        p.el.select("[id^=calendar-resizer-placeholder]").remove();
        delete Ext.cache[b.el.id];
        b.el.id = b.el.dom.id = b.el.id.substr(1);
        k.resizeContext = {
            resourceRecord: b.resourceRecord,
            eventRecord: l,
            start: c,
            end: d,
            finalize: function() {
                k.finalize.apply(k, arguments)
            }
        };
        if (a && typeof a !== "boolean") {
            a = a.valid
        }
        if (c && d && (d - c > 0) && ((c - f !== 0) || (d - q !== 0)) && a !== false) {
            m = p.fireEvent("beforeeventresizefinalize", k, k.resizeContext, i) !== false;
            o = true
        } else {
            p.repaintEventsForResource(j)
        }
        if (m) {
            k.finalize(o)
        }
    },
    finalize: function(a) {
        var b = this.schedulerView;
        var e = this.resizeContext;
        var d = false;
        var c = function() {
            d = true
        };
        b.eventStore.on("update", c);
        this.resizer.target.destroy();
        if (a) {
            if (this.resizer.isStart) {
                e.eventRecord.setStartDate(e.start, false, b.eventStore.skipWeekendsDuringDragDrop)
            } else {
                e.eventRecord.setEndDate(e.end, false, b.eventStore.skipWeekendsDuringDragDrop)
            }
            if (!d) {
                b.repaintEventsForResource(e.resourceRecord)
            }
        } else {
            b.repaintEventsForResource(e.resourceRecord)
        }
        this.resizer.destroy();
        b.eventStore.un("update", c);
        b.fireEvent("eventresizeend", b, e.eventRecord);
        this.resizeContext = null
    },
    cleanUp: function() {
        if (this.tipInstance) {
            this.tipInstance.destroy()
        }
    }
});
