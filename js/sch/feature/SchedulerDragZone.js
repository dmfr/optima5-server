Ext.define("Sch.feature.SchedulerDragZone", {
    extend: "Ext.dd.DragZone",
    requires: ["Sch.tooltip.Tooltip", "Ext.dd.StatusProxy"],
    repairHighlight: false,
    repairHighlightColor: "transparent",
    containerScroll: false,
    showTooltip: true,
    tip: null,
    tipIsProcessed: false,
    schedulerView: null,
    lastXY: null,
    showExactDropPosition: false,
    enableCopy: false,
    enableCopyKey: "SHIFT",
    validatorFn: function(b, a, c, f, d) {
        return true
    },
    validatorFnScope: null,
    copyKeyPressed: false,
    constructor: function(c, a) {
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
        if (d.touchScroll) {
            this.showTooltip = false
        }
        d.el.appendChild(b.el);
        if (d.rtl) {
            b.addCls("sch-rtl")
        }
        b.addCls("sch-dragproxy");
        d.on({
            eventdragstart: function() {
                Sch.util.ScrollManager.activate(d, d.constrainDragToResource && d.getMode())
            },
            aftereventdrop: function() {
                Sch.util.ScrollManager.deactivate()
            },
            scope: this
        })
    },
    destroy: function() {
        this.callParent(arguments);
        Ext.destroyMembers(this, "tip")
    },
    autoOffset: function(a, b) {
        this.setDelta(0, 0)
    },
    setupConstraints: function(k, d, g, e, i, f, c) {
        this.clearTicks();
        var a = i && !this.showExactDropPosition && f > 1 ? f : 0;
        var h = !i && !this.showExactDropPosition && f > 1 ? f : 0;
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
    setXConstraint: function(c, b, a) {
        this.leftConstraint = c;
        this.rightConstraint = b;
        this.minX = c;
        this.maxX = b;
        if (a) {
            this.setXTicks(this.initPageX, a)
        }
        this.constrainX = true
    },
    setYConstraint: function(a, c, b) {
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
    setVisibilityForSourceEvents: function(a) {
        Ext.each(this.dragData.getEventBarElements(), function(b) {
            b[a ? "show" : "hide"]()
        })
    },
    onDragOver: function(g) {
        if (g.event.touches && g.event.touches.length > 1) {
            Ext.dd.DragDropManager.handleMouseUp(g);
            return
        }
        var l = g.type === "scroll" ? this.lastXY : g.getXY();
        this.checkShiftChange();
        var k = this.dragData;
        if (!k.originalHidden) {
            this.setVisibilityForSourceEvents(false);
            k.originalHidden = true
        }
        var b = k.startDate;
        var d = k.newResource;
        var h = this.schedulerView;
        this.updateDragContext(g);
        if (this.showExactDropPosition) {
            var i = h.isHorizontal();
            var a = h.getDateFromCoordinate(i ? l[0] : l[1]) - k.sourceDate;
            var j = new Date(k.origStart - 0 + a);
            var f = h.timeAxisViewModel.getDistanceBetweenDates(j, k.startDate);
            if (k.startDate > h.timeAxis.getStart()) {
                var c = this.proxy.el;
                if (f) {
                    if (h.isHorizontal()) {
                        c.setX(l[0] + (this.schedulerView.rtl ? -f : f))
                    } else {
                        c.setY(l[1] + f)
                    }
                }
            }
        }
        if (k.startDate - b !== 0 || d !== k.newResource) {
            this.schedulerView.fireEvent("eventdrag", this.schedulerView, k.draggedRecords, k.startDate, k.newResource, k)
        }
        if (this.showTooltip) {
            this.tip.realign();
            this.tip.update(k.startDate, k.endDate, k.valid, k.message)
        }
        if (g.type !== "scroll") {
            this.lastXY = g.getXY()
        }
    },
    getCoordinate: function(a) {
        switch (this.schedulerView.getMode()) {
            case "horizontal":
                return a[0];
            case "vertical":
                return a[1];
            case "calendar":
                return a
        }
    },
    getDragData: function(q) {
        var p = this.schedulerView,
            o = q.getTarget(p.eventSelector);
        if (!o || q.event.touches && q.event.touches.length > 1) {
            return
        }
        var j = p.resolveEventRecord(o),
            m = p.resolveResource(o),
            f = p.resolveAssignmentRecord(o);
        if (!j || j.isDraggable() === false || p.fireEvent("beforeeventdrag", p, j, q) === false) {
            return null
        }
        var h = q.getXY(),
            a = Ext.get(o),
            u = a.getXY(),
            i = [h[0] - u[0], h[1] - u[1]],
            l = a.getRegion();
        var k = p.getMode() == "horizontal";
        p.constrainDragToResource && !m && Ext.Error.raise("Resource could not be resolved for event: " + j.getId());
        var r = p.getDateConstraints(p.constrainDragToResource ? m : null, j);
        this.setupConstraints(p.getScheduleRegion(p.constrainDragToResource ? m : null, j), l, i[0], i[1], k, p.getSnapPixelAmount(), Boolean(r));
        var b = j.getStartDate(),
            n = j.getEndDate(),
            c = p.timeAxis,
            g = this.getRelatedRecords(f || j) || [],
            v = p.getElementsFromEventRecord(j, m);
        Ext.Array.forEach(g, function(e) {
            if (e instanceof Sch.model.Assignment) {
                v = v.concat(p.getElementsFromEventRecord(e.getEvent(), e.getResource()))
            } else {
                v = v.concat(p.getElementsFromEventRecord(e))
            }
        });
        v = Ext.Array.unique(v);
        var d = {
            offsets: i,
            repairXY: u,
            prevScroll: p.getScroll(),
            dateConstraints: r,
            eventBarEls: v,
            getEventBarElements: function() {
                return d.eventBarEls = Ext.Array.map(d.eventBarEls, function(e) {
                    return e.dom && e || Ext.get(e.id)
                })
            },
            draggedRecords: [f || j].concat(g),
            resourceRecord: m,
            sourceDate: p.getDateFromCoordinate(this.getCoordinate(h)),
            origStart: b,
            origEnd: n,
            startDate: b,
            endDate: n,
            timeDiff: 0,
            startsOutsideView: b < c.getStart(),
            endsOutsideView: n > c.getEnd(),
            duration: n - b,
            bodyScroll: Ext.getBody().getScroll(),
            eventObj: q
        };
        d.ddel = this.getDragElement(a, d);
        return d
    },
    onStartDrag: function(b, d) {
        var c = this.schedulerView,
            a = this.dragData;
        Ext.Array.forEach(a.getEventBarElements(), function(e) {
            e.removeCls("sch-event-hover")
        });
        c.fireEvent("eventdragstart", c, a.draggedRecords);
        c.el.on("scroll", this.onViewElScroll, this)
    },
    alignElWithMouse: function(b, e, d) {
        this.callParent(arguments);
        var c = this.getTargetCoord(e, d),
            a = b.dom ? b : Ext.fly(b, "_dd");
        this.setLocalXY(a, c.x + this.deltaSetXY[0], c.y + this.deltaSetXY[1])
    },
    onViewElScroll: function(a, d) {
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
        e.setXY(c);
        this.onDragOver(a)
    },
    getCopyKeyPressed: function() {
        return Boolean(this.enableCopy && this.dragData.eventObj[this.enableCopyKey.toLowerCase() + "Key"])
    },
    checkShiftChange: function() {
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
    onKey: function(a) {
        if (a.getKey() === a[this.enableCopyKey]) {
            this.checkShiftChange()
        }
    },
    startDrag: function() {
        if (this.enableCopy) {
            Ext.getDoc().on({
                keydown: this.onKey,
                keyup: this.onKey,
                scope: this
            })
        }
        var e = this.callParent(arguments);
        var d = this.dragData;
        d.refElement = this.proxy.el.down(".sch-dd-ref");
        d.refElements = this.proxy.el.select(".sch-event");
        d.refElement.removeCls("sch-event-hover");
        if (this.showTooltip) {
            var a = this.schedulerView,
                c = a.up("[lockable=true]").el;
            if (!this.tipIsProcessed) {
                this.tipIsProcessed = true;
                var b = this.tip;
                if (b instanceof Ext.tip.ToolTip) {
                    Ext.applyIf(b, {
                        schedulerView: a
                    })
                } else {
                    this.tip = new Sch.tooltip.Tooltip(Ext.apply({
                        schedulerView: a,
                        cls: "sch-dragdrop-tip",
                        constrainTo: c
                    }, b))
                }
            }
            this.tip.update(d.origStart, d.origEnd, true);
            this.tip.setStyle("visibility");
            this.tip.show(d.refElement, d.offsets[0])
        }
        this.copyKeyPressed = this.getCopyKeyPressed();
        if (this.copyKeyPressed) {
            d.refElements.addCls("sch-event-copy");
            d.originalHidden = true
        }
        return e
    },
    endDrag: function() {
        this.schedulerView.el.un("scroll", this.onViewElScroll, this);
        if (this.enableCopy) {
            Ext.getDoc().un({
                keydown: this.onKey,
                keyup: this.onKey,
                scope: this
            })
        }
        this.callParent(arguments)
    },
    onMouseUp: function() {
        if (!this.dragging) {
            this.afterDragFinalized()
        }
    },
    afterDragFinalized: function() {
        this.proxy.el.setStyle({
            left: 0,
            top: 0
        })
    },
    updateRecords: function(c) {
        var k = this,
            l = k.schedulerView,
            f = l.eventStore,
            n = l.resourceStore,
            i = f.getAssignmentStore(),
            g = c.newResource,
            h = c.draggedRecords[0],
            b = c.draggedRecords.slice(1),
            j = c.resourceRecord,
            m = k.getCopyKeyPressed(),
            d = c.startDate,
            a = c.timeDiff,
            e = l.getMode();
        if (i && f instanceof Sch.data.EventStore) {
            k.updateRecordsMultipleAssignmentMode(d, a, h, b, j, g, f, n, i, m, e)
        } else {
            if (i) {
                k.updateRecordsSingleAssignmentMode(d, a, h.getEvent(), Ext.Array.map(b, function(o) {
                    return o.getEvent()
                }), j, g, f, n, m, e)
            } else {
                k.updateRecordsSingleAssignmentMode(d, a, h, b, j, g, f, n, m, e)
            }
        }
        l.fireEvent("eventdrop", l, c.draggedRecords, m)
    },
    updateRecordsSingleAssignmentMode: function(c, b, l, i, e, j, f, k, a, d) {
        var h = this,
            m = [];
        if (a) {
            l = l.fullCopy(null);
            m.push(l)
        }
        l.beginEdit();
        if (!a && j !== e && e instanceof Sch.model.Resource && j instanceof Sch.model.Resource) {
            l.reassign(e, j)
        } else {
            if (j !== e && e instanceof Sch.model.Resource && j instanceof Sch.model.Resource) {
                l.assign(j)
            }
        }
        l.setStartDate(c, true, f.skipWeekendsDuringDragDrop);
        l.endEdit();
        if (d !== "calendar") {
            var g = k.indexOf(e) - k.indexOf(j);
            Ext.Array.forEach(i, function(o) {
                var n = o.getResources();
                if (a) {
                    o = o.fullCopy(null);
                    m.push(o)
                }
                o.beginEdit();
                o.setStartDate(h.adjustStartDate(o.getStartDate(), b), true, f.skipWeekendsDuringDragDrop);
                g !== 0 && n.length && Ext.Array.forEach(n, function(s) {
                    var q = k.indexOf(s) - g,
                        p;
                    if (q < 0) {
                        q = 0
                    } else {
                        if (q >= k.getCount()) {
                            q = k.getCount() - 1
                        }
                    }
                    p = k.getAt(q);
                    o.reassign(s, p)
                });
                o.endEdit()
            })
        }
        if (m.length) {
            f.append(m)
        }
    },
    updateRecordsMultipleAssignmentMode: function(c, b, h, l, e, j, f, k, g, a, d) {
        var i = this;
        Ext.Array.forEach([].concat(h, l), function(n) {
            var m = n.getEvent();
            m.setStartDate(i.adjustStartDate(m.getStartDate(), b), true, f.skipWeekendsDuringDragDrop);
            if (d != "calendar" && e !== j && a) {
                m.assign(j)
            } else {
                if (d != "calendar" && e !== j && !m.isAssignedTo(j)) {
                    m.reassign(n.getResource(), j)
                } else {
                    if (d != "calendar" && e !== j) {
                        m.unassign(n.getResource())
                    }
                }
            }
        })
    },
    isValidDrop: function(a, b, c) {
        if (a !== b && !(c instanceof Sch.model.Assignment) && c.isAssignedTo(b)) {
            return false
        }
        return true
    },
    resolveResource: function(g, f) {
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
        if (d.className.match(Ext.baseCSSPrefix + "grid-item")) {
            return this.resolveResource([g[0], g[1] + 3], f)
        }
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
    adjustStartDate: function(a, c) {
        var b = this.schedulerView;
        return b.timeAxis.roundDate(new Date(a - 0 + c), b.snapRelativeToEventStartDate ? a : false)
    },
    updateDragContext: function(h) {
        var b = this.dragData,
            g = h.type === "scroll" ? this.lastXY : h.getXY();
        if (!b.refElement) {
            return
        }
        var f = this.schedulerView,
            i = b.refElement.getRegion();
        if (f.timeAxis.isContinuous()) {
            if ((f.isHorizontal() && this.minX < g[0] && g[0] < this.maxX) || (f.isVertical() && this.minY < g[1] && g[1] < this.maxY)) {
                var c = f.getDateFromCoordinate(this.getCoordinate(g));
                b.timeDiff = c - b.sourceDate;
                b.startDate = this.adjustStartDate(b.origStart, b.timeDiff);
                b.endDate = new Date(b.startDate - 0 + b.duration)
            }
        } else {
            var d = this.resolveStartEndDates(i);
            b.startDate = d.startDate;
            b.endDate = d.endDate;
            b.timeDiff = b.startDate - b.origStart
        }
        b.newResource = f.constrainDragToResource ? b.resourceRecord : this.resolveResource([i.left + b.offsets[0], i.top + b.offsets[1]], h);
        if (b.newResource) {
            var a = this.validatorFn.call(this.validatorFnScope || this, b.draggedRecords, b.newResource, b.startDate, b.duration, h);
            if (!a || typeof a === "boolean") {
                b.valid = a !== false;
                b.message = ""
            } else {
                b.valid = a.valid !== false;
                b.message = a.message
            }
        } else {
            b.valid = false
        }
    },
    getRelatedRecords: function(c) {
        var b = this.schedulerView,
            d = b.getEventSelectionModel(),
            a = d.getDraggableSelections();
        return Ext.Array.filter(a, function(e) {
            return c !== e
        })
    },
    getDragElement: function(b, e) {
        var h = e.getEventBarElements();
        var g;
        var d;
        var a = e.offsets[0];
        var f = e.offsets[1];
        if (h.length > 1) {
            var c = Ext.core.DomHelper.createDom({
                tag: "div",
                cls: "sch-dd-wrap",
                style: {
                    overflow: "visible"
                }
            });
            Ext.Array.forEach(h, function(j) {
                g = j.dom.cloneNode(true);
                g.id = Ext.id();
                if (j.dom === b.dom) {
                    g.className += " sch-dd-ref";
                    if (Ext.isIE8) {
                        Ext.fly(g).addCls("sch-dd-ref")
                    }
                }
                c.appendChild(g);
                var i = j.getOffsetsTo(b);
                Ext.fly(g).setStyle({
                    left: i[0] - a + "px",
                    top: i[1] - f + "px"
                })
            });
            d = c
        } else {
            g = b.dom.cloneNode(true);
            g.id = Ext.id();
            g.style.left = -a + "px";
            g.style.top = -f + "px";
            g.className += " sch-dd-ref";
            if (Ext.isIE8) {
                Ext.fly(g).addCls("sch-dd-ref")
            }
            d = g
        }
        if (!b.dom.style.height) {
            Ext.fly(d).setHeight(b.getHeight())
        }
        return d
    },
    onDragDrop: function(h, i) {
        this.updateDragContext(h);
        var d = this,
            b = d.schedulerView,
            g = d.cachedTarget || Ext.dd.DragDropMgr.getDDById(i),
            f = d.dragData,
            a = false,
            c = true;
        f.ddCallbackArgs = [g, h, i];
        if (f.valid && f.startDate && f.endDate) {
            f.finalize = function() {
                d.finalize.apply(d, arguments)
            };
            c = b.fireEvent("beforeeventdropfinalize", d, f, h) !== false;
            if (c && d.isValidDrop(f.resourceRecord, f.newResource, f.draggedRecords[0])) {
                a = (f.startDate - f.origStart) !== 0 || f.newResource !== f.resourceRecord
            }
        }
        if (c) {
            d.finalize(f.valid && a)
        } else {
            d.proxy.el.addCls("sch-before-drag-finalized")
        }
    },
    finalize: function(c) {
        var f = this,
            b = f.schedulerView,
            d = b.eventStore,
            g = f.dragData;
        f.proxy.el.removeCls("sch-before-drag-finalized");
        if (f.tip) {
            f.tip.hide()
        }
        if (c) {
            var a, e = function() {
                a = true
            };
            d.on("update", e, null, {
                single: true
            });
            f.updateRecords(g);
            d.un("update", e, null, {
                single: true
            });
            if (!a) {
                f.onInvalidDrop.apply(f, g.ddCallbackArgs)
            } else {
                if (Ext.isIE9) {
                    f.proxy.el.setStyle("visibility", "hidden");
                    Ext.Function.defer(f.onValidDrop, 10, f, g.ddCallbackArgs)
                } else {
                    f.onValidDrop.apply(f, g.ddCallbackArgs)
                }
                b.fireEvent("aftereventdrop", b, g.draggedRecords)
            }
            f.afterDragFinalized()
        } else {
            f.onInvalidDrop.apply(f, g.ddCallbackArgs)
        }
    },
    onInvalidDrop: function(d, c, f) {
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
        a.fireEvent("aftereventdrop", a, this.dragData.draggedRecords);
        this.afterDragFinalized();
        return b
    },
    resolveStartEndDates: function(f) {
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
