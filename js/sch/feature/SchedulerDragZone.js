Ext.define("Sch.feature.SchedulerDragZone", {
    extend: "Ext.dd.DragZone",
    requires: ["Sch.tooltip.Tooltip", "Ext.dd.StatusProxy", "Ext.util.Point"],
    repairHighlight: false,
    repairHighlightColor: "transparent",
    containerScroll: false,
    dropAllowed: "sch-dragproxy",
    dropNotAllowed: "sch-dragproxy",
    showTooltip: true,
    tip: null,
    schedulerView: null,
    showExactDropPosition: false,
    enableCopy: false,
    enableCopyKey: "SHIFT",
    validatorFn: function (b, a, c, f, d) {
        return true
    },
    validatorFnScope: null,
    copyKeyPressed: false,
    constructor: function (c, a) {
        if (Ext.isIE8m && window.top !== window) {
            Ext.dd.DragDropManager.notifyOccluded = true
        }
        var b = this.proxy = this.proxy || new Ext.dd.StatusProxy({
            shadow: false,
            dropAllowed: this.dropAllowed,
            dropNotAllowed: this.dropNotAllowed,
            ensureAttachedToBody: Ext.emptyFn
        });
        this.callParent(arguments);
        this.isTarget = true;
        this.scroll = false;
        this.ignoreSelf = false;
        var d = this.schedulerView;
        Ext.dd.ScrollManager.register(d.el);
        d.el.appendChild(b.el);
        if (d.rtl) {
            b.addCls("sch-rtl")
        }
    },
    destroy: function () {
        this.callParent(arguments);
        if (this.tip) {
            this.tip.destroy()
        }
        Ext.dd.ScrollManager.unregister(this.schedulerView.el)
    },
    autoOffset: function (a, b) {
        this.setDelta(0, 0)
    },
    setupConstraints: function (k, d, g, e, i, f, c) {
        this.clearTicks();
        var a = i && f > 1 ? f : 0;
        var h = !i && f > 1 ? f : 0;
        this.resetConstraints();
        this.initPageX = k.left + g;
        this.initPageY = k.top + e;
        var b = d.right - d.left;
        var j = d.bottom - d.top;
        if (i) {
            if (c) {
                this.setXConstraint(k.left + g, k.right - b + g, a)
            } else {
                this.setXConstraint(k.left, k.right, a)
            }
            this.setYConstraint(k.top + e, k.bottom - j + e, h)
        } else {
            this.setXConstraint(k.left + g, k.right - b + g, a);
            if (c) {
                this.setYConstraint(k.top + e, k.bottom - j + e, h)
            } else {
                this.setYConstraint(k.top, k.bottom, h)
            }
        }
    },
    setXConstraint: function (c, b, a) {
        this.leftConstraint = c;
        this.rightConstraint = b;
        this.minX = c;
        this.maxX = b;
        if (a) {
            this.setXTicks(this.initPageX, a)
        }
        this.constrainX = true
    },
    setYConstraint: function (a, c, b) {
        this.topConstraint = a;
        this.bottomConstraint = c;
        this.minY = a;
        this.maxY = c;
        if (b) {
            this.setYTicks(this.initPageY, b)
        }
        this.constrainY = true
    },
    onDragEnter: Ext.emptyFn,
    onDragOut: Ext.emptyFn,
    setVisibilityForSourceEvents: function (a) {
        Ext.each(this.dragData.eventEls, function (b) {
            b[a ? "show" : "hide"]()
        })
    },
    onDragOver: function (h, b) {
        this.checkShiftChange();
        var k = this.dragData;
        if (!k.originalHidden) {
            this.setVisibilityForSourceEvents(false);
            k.originalHidden = true
        }
        var c = k.startDate;
        var f = k.newResource;
        var i = this.schedulerView;
        this.updateDragContext(h);
        if (this.showExactDropPosition) {
            var a = i.getDateFromCoordinate(h.getXY()[0]) - k.sourceDate;
            var j = new Date(k.origStart - 0 + a);
            var g = i.timeAxisViewModel.getDistanceBetweenDates(j, k.startDate);
            if (k.startDate > i.timeAxis.getStart()) {
                var d = this.proxy.el;
                if (g) {
                    d.setX(d.getX() + g)
                }
            }
        }
        if (k.startDate - c !== 0 || f !== k.newResource) {
            this.schedulerView.fireEvent("eventdrag", this.schedulerView, k.eventRecords, k.startDate, k.newResource, k)
        }
        if (this.showTooltip) {
            this.tip.update(k.startDate, k.endDate, k.valid)
        }
    },
    getDragData: function (q) {
        var o = this.schedulerView,
            n = q.getTarget(o.eventSelector);
        if (!n) {
            return
        }
        var j = o.resolveEventRecord(n);
        if (!j || j.isDraggable() === false || o.fireEvent("beforeeventdrag", o, j, q) === false) {
            return null
        }
        var h = q.getXY(),
            a = Ext.get(n),
            u = a.getXY(),
            i = [h[0] - u[0], h[1] - u[1]],
            l = a.getRegion();
        var k = o.getOrientation() == "horizontal";
        var b = o.resolveResource(n);
        if (o.constrainDragToResource && !b) {
            throw "Resource could not be resolved for event: " + j.getId()
        }
        var r = o.getDateConstraints(o.constrainDragToResource ? b : null, j);
        this.setupConstraints(o.getScheduleRegion(o.constrainDragToResource ? b : null, j), l, i[0], i[1], k, o.getSnapPixelAmount(), Boolean(r));
        var c = j.getStartDate(),
            m = j.getEndDate(),
            d = o.timeAxis,
            g = this.getRelatedRecords(j),
            p = [a];
        Ext.Array.each(g, function (s) {
            var e = o.getElementFromEventRecord(s);
            if (e) {
                p.push(e)
            }
        });
        var f = {
            offsets: i,
            repairXY: u,
            prevScroll: o.getScroll(),
            dateConstraints: r,
            eventEls: p,
            eventRecords: [j].concat(g),
            relatedEventRecords: g,
            resourceRecord: b,
            sourceDate: o.getDateFromCoordinate(h[k ? 0 : 1]),
            origStart: c,
            origEnd: m,
            startDate: c,
            endDate: m,
            timeDiff: 0,
            startsOutsideView: c < d.getStart(),
            endsOutsideView: m > d.getEnd(),
            duration: m - c,
            bodyScroll: Ext.getBody().getScroll(),
            eventObj: q
        };
        f.ddel = this.getDragElement(a, f);
        return f
    },
    onStartDrag: function (b, d) {
        var c = this.schedulerView,
            a = this.dragData;
        a.eventEls[0].removeCls("sch-event-hover");
        c.fireEvent("eventdragstart", c, a.eventRecords);
        c.el.on("scroll", this.onViewElScroll, this)
    },
    alignElWithMouse: function (b, e, d) {
        this.callParent(arguments);
        var c = this.getTargetCoord(e, d),
            a = b.dom ? b : Ext.fly(b, "_dd");
        this.setLocalXY(a, c.x + this.deltaSetXY[0], c.y + this.deltaSetXY[1])
    },
    onViewElScroll: function (a, d) {
        var e = this.proxy,
            i = this.schedulerView,
            g = this.dragData;
        this.setVisibilityForSourceEvents(false);
        var h = e.getXY();
        var f = i.getScroll();
        var c = [h[0] + f.left - g.prevScroll.left, h[1] + f.top - g.prevScroll.top];
        var b = this.deltaSetXY;
        this.deltaSetXY = [b[0] + f.left - g.prevScroll.left, b[1] + f.top - g.prevScroll.top];
        g.prevScroll = f;
        e.setXY(c)
    },
    getCopyKeyPressed: function () {
        return Boolean(this.enableCopy && this.dragData.eventObj[this.enableCopyKey.toLowerCase() + "Key"])
    },
    checkShiftChange: function () {
        var b = this.getCopyKeyPressed(),
            a = this.dragData;
        if (b !== this.copyKeyPressed) {
            this.copyKeyPressed = b;
            if (b) {
                a.refElements.addCls("sch-event-copy");
                this.setVisibilityForSourceEvents(true)
            } else {
                a.refElements.removeCls("sch-event-copy");
                this.setVisibilityForSourceEvents(false)
            }
        }
    },
    onKey: function (a) {
        if (a.getKey() === a[this.enableCopyKey]) {
            this.checkShiftChange()
        }
    },
    startDrag: function () {
        if (this.enableCopy) {
            Ext.EventManager.on(document, "keydown", this.onKey, this);
            Ext.EventManager.on(document, "keyup", this.onKey, this)
        }
        var c = this.callParent(arguments);
        var b = this.dragData;
        b.refElement = this.proxy.el.down("#sch-id-dd-ref");
        b.refElements = this.proxy.el.select(".sch-event");
        b.refElement.removeCls("sch-event-hover");
        if (this.showTooltip) {
            var a = this.schedulerView;
            if (!this.tip) {
                this.tip = new Sch.tooltip.Tooltip({
                    schedulerView: a,
                    cls: "sch-dragdrop-tip",
                    renderTo: document.body
                })
            }
            this.tip.update(b.origStart, b.origEnd, true);
            this.tip.el.setStyle("visibility");
            this.tip.show(b.refElement, b.offsets[0])
        }
        this.copyKeyPressed = this.getCopyKeyPressed();
        if (this.copyKeyPressed) {
            b.refElements.addCls("sch-event-copy");
            b.originalHidden = true
        }
        return c
    },
    endDrag: function () {
        if (this.enableCopy) {
            Ext.EventManager.un(document, "keydown", this.onKey, this);
            Ext.EventManager.un(document, "keyup", this.onKey, this)
        }
        this.callParent(arguments)
    },
    updateRecords: function (b) {
        var g = this,
            i = g.schedulerView,
            k = i.resourceStore,
            d = b.newResource,
            l = b.eventRecords[0],
            m = [],
            j = this.getCopyKeyPressed(),
            c = i.eventStore;
        if (j) {
            l = l.copy();
            m.push(l)
        }
        var f = b.resourceRecord;
        l.beginEdit();
        if (d !== f) {
            l.unassign(f);
            l.assign(d)
        }
        l.setStartDate(b.startDate, true, c.skipWeekendsDuringDragDrop);
        l.endEdit();
        var a = b.timeDiff,
            n = Ext.data.TreeStore && k instanceof Ext.data.TreeStore;
        var h = n ? i.store : k;
        var e = h.indexOf(f) - h.indexOf(d);
        Ext.each(b.relatedEventRecords, function (p) {
            var q = p.getResource(null, c);
            if (j) {
                p = p.copy();
                m.push(p)
            }
            p.beginEdit();
            p.shift(Ext.Date.MILLI, a);
            var o = h.indexOf(q) - e;
            if (o < 0) {
                o = 0
            }
            if (o >= h.getCount()) {
                o = h.getCount() - 1
            }
            p.setResource(h.getAt(o));
            p.endEdit()
        });
        if (m.length) {
            c.add(m)
        }
        i.fireEvent("eventdrop", i, b.eventRecords, j)
    },
    isValidDrop: function (a, b, c) {
        if (a !== b && c.isAssignedTo(b)) {
            return false
        }
        return true
    },
    resolveResource: function (g, f) {
        var c = this.proxy.el.dom;
        var h = this.dragData.bodyScroll;
        c.style.display = "none";
        var d = document.elementFromPoint(g[0] - h.left, g[1] - h.top);
        if (Ext.isIE8 && f && f.browserEvent.synthetic) {
            d = document.elementFromPoint(g[0] - h.left, g[1] - h.top)
        }
        c.style.display = "block";
        if (!d) {
            return null
        }
        var a = this.schedulerView;
        if (!d.className.match(a.timeCellCls)) {
            var b = Ext.fly(d).up("." + a.timeCellCls);
            if (b) {
                d = b.dom
            } else {
                return null
            }
        }
        return a.resolveResource(d)
    },
    updateDragContext: function (g) {
        var a = this.dragData,
            f = g.getXY();
        if (!a.refElement) {
            return
        }
        var d = this.schedulerView,
            h = a.refElement.getRegion();
        if (d.timeAxis.isContinuous()) {
            if ((d.isHorizontal() && this.minX < f[0] && f[0] < this.maxX) || (d.isVertical() && this.minY < f[1] && f[1] < this.maxY)) {
                var b = d.getDateFromCoordinate(g.getXY()[d.getOrientation() == "horizontal" ? 0 : 1]);
                a.timeDiff = b - a.sourceDate;
                a.startDate = d.timeAxis.roundDate(new Date(a.origStart - 0 + a.timeDiff), d.snapRelativeToEventStartDate ? a.origStart : false);
                a.endDate = new Date(a.startDate - 0 + a.duration)
            }
        } else {
            var c = this.resolveStartEndDates(h);
            a.startDate = c.startDate;
            a.endDate = c.endDate;
            a.timeDiff = a.startDate - a.origStart
        }
        a.newResource = d.constrainDragToResource ? a.resourceRecord : this.resolveResource([h.left + a.offsets[0], h.top + a.offsets[1]], g);
        if (a.newResource) {
            a.valid = this.validatorFn.call(this.validatorFnScope || this, a.eventRecords, a.newResource, a.startDate, a.duration, g)
        } else {
            a.valid = false
        }
    },
    getRelatedRecords: function (c) {
        var b = this.schedulerView;
        var d = b.selModel;
        var a = [];
        if (d.selected.getCount() > 1) {
            d.selected.each(function (e) {
                if (e !== c && e.isDraggable() !== false) {
                    a.push(e)
                }
            })
        }
        return a
    },
    getDragElement: function (b, e) {
        var c = e.eventEls;
        var g;
        var a = e.offsets[0];
        var f = e.offsets[1];
        if (c.length > 1) {
            var d = Ext.core.DomHelper.createDom({
                tag: "div",
                cls: "sch-dd-wrap",
                style: {
                    overflow: "visible"
                }
            });
            Ext.Array.each(c, function (i) {
                g = i.dom.cloneNode(true);
                g.id = i.dom === b.dom ? "sch-id-dd-ref" : Ext.id();
                d.appendChild(g);
                var h = i.getOffsetsTo(b);
                Ext.fly(g).setStyle({
                    left: h[0] - a + "px",
                    top: h[1] - f + "px"
                })
            });
            return d
        } else {
            g = b.dom.cloneNode(true);
            g.id = "sch-id-dd-ref";
            g.style.left = -a + "px";
            g.style.top = -f + "px";
            return g
        }
    },
    onDragDrop: function (h, i) {
        this.updateDragContext(h);
        var d = this,
            b = d.schedulerView,
            g = d.cachedTarget || Ext.dd.DragDropMgr.getDDById(i),
            f = d.dragData,
            a = false,
            c = true;
        f.ddCallbackArgs = [g, h, i];
        if (f.valid && f.startDate && f.endDate) {
            f.finalize = function () {
                d.finalize.apply(d, arguments)
            };
            c = b.fireEvent("beforeeventdropfinalize", d, f, h) !== false;
            if (c && d.isValidDrop(f.resourceRecord, f.newResource, f.eventRecords[0])) {
                a = (f.startDate - f.origStart) !== 0 || f.newResource !== f.resourceRecord
            }
        }
        if (c) {
            d.finalize(f.valid && a)
        }
        b.el.un("scroll", d.onViewElScroll, d)
    },
    finalize: function (c) {
        var e = this,
            b = e.schedulerView,
            f = e.dragData;
        if (e.tip) {
            e.tip.hide()
        }
        if (c) {
            var a, d = function () {
                    a = true
                };
            b.on("itemupdate", d, null, {
                single: true
            });
            e.updateRecords(f);
            b.un("itemupdate", d, null, {
                single: true
            });
            if (!a) {
                e.onInvalidDrop.apply(e, f.ddCallbackArgs)
            } else {
                if (Ext.isIE9) {
                    e.proxy.el.setStyle("visibility", "hidden");
                    Ext.Function.defer(e.onValidDrop, 10, e, f.ddCallbackArgs)
                } else {
                    e.onValidDrop.apply(e, f.ddCallbackArgs)
                }
                b.fireEvent("aftereventdrop", b, f.eventRecords)
            }
        } else {
            e.onInvalidDrop.apply(e, f.ddCallbackArgs)
        }
    },
    onInvalidDrop: function (d, c, f) {
        if (Ext.isIE && !c) {
            c = d;
            d = d.getTarget() || document.body
        }
        if (this.tip) {
            this.tip.hide()
        }
        this.setVisibilityForSourceEvents(true);
        var a = this.schedulerView,
            b = this.callParent([d, c, f]);
        a.fireEvent("aftereventdrop", a, this.dragData.eventRecords);
        return b
    },
    resolveStartEndDates: function (f) {
        var a = this.dragData,
            c, e = a.origStart,
            b = a.origEnd;
        var d = Sch.util.Date;
        if (!a.startsOutsideView) {
            c = this.schedulerView.getStartEndDatesFromRegion(f, "round");
            if (c) {
                e = c.start || a.startDate;
                b = d.add(e, d.MILLI, a.duration)
            }
        } else {
            if (!a.endsOutsideView) {
                c = this.schedulerView.getStartEndDatesFromRegion(f, "round");
                if (c) {
                    b = c.end || a.endDate;
                    e = d.add(b, d.MILLI, -a.duration)
                }
            }
        }
        return {
            startDate: e,
            endDate: b
        }
    }
});
