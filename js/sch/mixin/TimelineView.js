Ext.define("Sch.mixin.TimelineView", {
    extend: "Sch.mixin.AbstractTimelineView",
    requires: ["Ext.tip.ToolTip", "Sch.patches.TouchScroll", "Sch.patches.PartnerScroll", "Sch.patches.View", "Sch.patches.TableView", "Sch.patches.Collection", "Sch.patches.ToolTip"],
    tip: null,
    overScheduledEventClass: "sch-event-hover",
    ScheduleBarEvents: ["mousedown", "mouseup", "click", "dblclick", "contextmenu"],
    ResourceRowEvents: ["keydown", "keyup"],
    preventOverCls: false,
    _initializeTimelineView: function() {
        this.callParent(arguments);
        this.on("destroy", this._onDestroy, this);
        this.on("afterrender", this._onAfterRender, this);
        this.panel.on("viewready", this._onViewReady, this);
        this.setMode(this.mode);
        this.enableBubble("columnwidthchange");
        this.addCls("sch-timelineview");
        if (this.readOnly) {
            this.addCls(this._cmpCls + "-readonly")
        }
        this.addCls(this._cmpCls);
        if (this.eventAnimations) {
            this.addCls("sch-animations-enabled")
        }
    },
    handleScheduleBarEvent: function(b, a) {
        this.fireEvent(this.scheduledEventName + b.type, this, this.resolveEventRecord(a), b)
    },
    handleResourceRowEvent: function(a, b) {
        this.fireEvent(this.scheduledEventName + a.type, this, this.resolveEventRecordFromResourceRow(b), a)
    },
    _onDestroy: function() {
        if (this.tip) {
            this.tip.destroy()
        }
    },
    _onViewReady: function() {
        if (this.touchScroll) {
            this.getSecondaryCanvasEl().insertBefore(this.getNodeContainer())
        }
    },
    _onAfterRender: function() {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true)
        }
        if (this.tooltipTpl) {
            if (typeof this.tooltipTpl === "string") {
                this.tooltipTpl = new Ext.XTemplate(this.tooltipTpl)
            }
            this.el.on("mousemove", this.setupTooltip, this, {
                single: true
            })
        }
        var e = this.bufferedRenderer;
        if (e) {
            this.patchBufferedRenderingPlugin(e);
            this.patchBufferedRenderingPlugin(this.lockingPartner.bufferedRenderer)
        }
        this.on("bufferedrefresh", this.onBufferedRefresh, this, {
            buffer: 10
        });
        this.setupTimeCellEvents();
        var d = this.getSecondaryCanvasEl();
        if (d.getStyle("position").toLowerCase() !== "absolute") {
            var c = Ext.Msg || window;
            c.alert("ERROR: The CSS file for the Bryntum component has not been loaded.")
        }
        var b = {
            delegate: this.eventSelector,
            scope: this
        };
        var a = {
            delegate: this.rowSelector,
            scope: this
        };
        Ext.Array.forEach(this.ScheduleBarEvents, function(f) {
            b[f] = this.handleScheduleBarEvent
        }, this);
        Ext.Array.forEach(this.ResourceRowEvents, function(f) {
            a[f] = this.handleResourceRowEvent
        }, this);
        this.el.on(b);
        this.el.on(a)
    },
    patchBufferedRenderingPlugin: function(c) {
        var b = this;
        var a = c.setBodyTop;
        c.setBodyTop = function(d, e) {
            var f = a.apply(this, arguments);
            b.fireEvent("bufferedrefresh", this);
            return f
        }
    },
    onBufferedRefresh: function() {
        var d = this.body.dom;
        if (!d) {
            return
        }
        var c = d.style;
        if (Ext.isIE9m) {
            this.getSecondaryCanvasEl().dom.style.top = this.body.dom.style.top
        } else {
            var b = c.transform || c.msTransform || c.webkitTransform;
            var a;
            if (b) {
                a = /\(-?\d+px,\s*(-?\d+px),\s*(-?\d+)px\)/.exec(b)
            }
            if (a) {
                this.getSecondaryCanvasEl().dom.style.top = b ? a[1] : d.style.top
            }
        }
    },
    setMouseOverEnabled: function(a) {
        this[a ? "mon" : "mun"](this.el, {
            mouseover: this.onEventMouseOver,
            mouseout: this.onEventMouseOut,
            delegate: this.eventSelector,
            scope: this
        })
    },
    onEventMouseOver: function(c, a) {
        if (a !== this.lastItem && !this.preventOverCls) {
            this.lastItem = a;
            Ext.fly(a).addCls(this.overScheduledEventClass);
            var b = this.resolveEventRecord(a);
            if (b) {
                this.fireEvent("eventmouseenter", this, b, c)
            }
        }
    },
    onEventMouseOut: function(b, a) {
        if (this.lastItem) {
            if (!b.within(this.lastItem, true, true)) {
                Ext.fly(this.lastItem).removeCls(this.overScheduledEventClass);
                this.fireEvent("eventmouseleave", this, this.resolveEventRecord(this.lastItem), b);
                delete this.lastItem
            }
        }
    },
    highlightItem: function(b) {
        if (b) {
            var a = this;
            a.clearHighlight();
            a.highlightedItem = b;
            Ext.fly(b).addCls(a.overItemCls)
        }
    },
    setupTooltip: function() {
        var b = this,
            a = Ext.apply({
                delegate: b.eventSelector,
                target: b.el,
                anchor: "b",
                rtl: b.rtl,
                show: function() {
                    Ext.ToolTip.prototype.show.apply(this, arguments);
                    if (this.triggerElement && b.getMode() === "horizontal") {
                        this.setX(this.targetXY[0] - 10);
                        var c = Ext.fly(this.triggerElement).getBox();
                        var d = c.top - this.getHeight() - 10;
                        this.setY(d < 0 ? c.bottom + 10 : d)
                    }
                }
            }, b.tipCfg);
        b.tip = new Ext.ToolTip(a);
        b.tip.on({
            beforeshow: function(e) {
                if (!e.triggerElement || !e.triggerElement.id) {
                    return false
                }
                var c = this.resolveEventRecord(e.triggerElement);
                if (!c || this.fireEvent("beforetooltipshow", this, c) === false) {
                    return false
                }
                var f = this.getDataForTooltipTpl(c, e.triggerElement),
                    d;
                if (!f) {
                    return false
                }
                d = this.tooltipTpl.apply(f);
                if (!d) {
                    return false
                }
                e.update(d)
            },
            scope: this
        });
        if (Ext.supports.Touch) {
            b.el.un({
                touchmove: b.setupTooltip,
                mousemove: b.setupTooltip,
                scope: b
            })
        }
    },
    getHorizontalTimeAxisColumn: function() {
        if (!this.timeAxisColumn) {
            this.timeAxisColumn = this.headerCt.down("timeaxiscolumn");
            if (this.timeAxisColumn) {
                this.timeAxisColumn.on("destroy", function() {
                    this.timeAxisColumn = null
                }, this)
            }
        }
        return this.timeAxisColumn
    },
    getDataForTooltipTpl: function(a, b) {
        return Ext.apply({
            _record: a
        }, a.data)
    },
    refreshKeepingScroll: function() {
        Ext.suspendLayouts();
        this.saveScrollState();
        this.refresh();
        if (this.up("tablepanel[lockable=true]").lockedGridDependsOnSchedule) {
            this.lockingPartner.saveScrollState();
            this.lockingPartner.refresh();
            this.lockingPartner.restoreScrollState()
        }
        Ext.resumeLayouts(true);
        if (this.scrollState.left !== 0 || this.scrollState.top !== 0 || this.infiniteScroll) {
            this.restoreScrollState()
        }
    },
    setupTimeCellEvents: function() {
        this.mon(this.el, {
            click: this.handleScheduleEvent,
            dblclick: this.handleScheduleEvent,
            contextmenu: this.handleScheduleEvent,
            pinch: this.handleScheduleEvent,
            pinchstart: this.handleScheduleEvent,
            pinchend: this.handleScheduleEvent,
            scope: this
        })
    },
    getTableRegion: function() {
        var a = this.el.down("." + Ext.baseCSSPrefix + "grid-item-container");
        return (a || this.el).getRegion()
    },
    getRowNode: function(a) {
        return this.getNodeByRecord(a)
    },
    findRowByChild: function(a) {
        return this.findItemByChild(a)
    },
    getRecordForRowNode: function(a) {
        return this.getRecord(a)
    },
    refreshKeepingResourceScroll: function() {
        var a = this.getScroll();
        this.refresh();
        if (this.getMode() === "horizontal") {
            this.scrollVerticallyTo(a.top)
        } else {
            this.scrollHorizontallyTo(a.left)
        }
    },
    scrollHorizontallyTo: function(a, b) {
        var c = this.getEl();
        if (c && Ext.supports.Touch) {
            this.setScrollX(a)
        } else {
            if (c) {
                c.scrollTo("left", Math.max(0, a), b)
            }
        }
    },
    scrollVerticallyTo: function(c, a) {
        var b = this.getEl();
        if (b && Ext.supports.Touch) {
            this.setScrollY(c)
        } else {
            if (b) {
                b.scrollTo("top", Math.max(0, c), a)
            }
        }
    },
    getVerticalScroll: function() {
        var a = this.getEl();
        return a.getScroll().top
    },
    getHorizontalScroll: function() {
        var a = this.getEl();
        return a.getScroll().left
    },
    getScroll: function() {
        var a = this;
        return {
            top: a.getScrollY(),
            left: a.getScrollX()
        }
    },
    handleScheduleEvent: function() {},
    scrollElementIntoView: function(d, t, h, f, a, g, c) {
        var w = this,
            s = d.dom,
            m = Ext.getDom(w.getEl()),
            j = d.getOffsetsTo(m),
            b = w.getScroll(),
            e = j[0] + b.left,
            n = j[1] + b.top,
            k = n + s.offsetHeight,
            u = e + s.offsetWidth,
            o = m.clientHeight,
            i = parseInt(b.top, 10),
            v = parseInt(b.left, 10),
            p = i + o,
            l = v + m.clientWidth,
            r, q;
        a = a === null || a === undefined ? 20 : a;
        if (s.offsetHeight > o || n < i) {
            q = n - a
        } else {
            if (k > p) {
                q = k - o + a
            }
        }
        if (t !== false && s.offsetWidth > m.clientWidth || e < v) {
            r = e - a
        } else {
            if (t !== false && u > l) {
                r = u - m.clientWidth + a
            }
        }
        h = h === true && {} || h;
        f = f === true && {} || f;
        c = c || w;
        if (h && f) {
            h.listeners = Ext.apply(h.listeners || {}, {
                afteranimate: function() {
                    f.listeners = Ext.apply(f.listeners || {}, {
                        afteranimate: function() {
                            g && g.call(c);
                            g = null
                        }
                    });
                    Ext.fly(s).highlight(null, f)
                }
            })
        } else {
            if (h) {
                h.listeners = Ext.apply(h.listeners, {
                    afteranimate: function() {
                        g && g.call(c);
                        g = null
                    }
                })
            } else {
                if (f) {
                    f.listeners = Ext.apply(f.listeners || {}, {
                        afteranimate: function() {
                            g && g.call(c);
                            g = null
                        }
                    })
                }
            }
        }
        q !== undefined && w.setScrollY(q, h);
        r !== undefined && w.setScrollX(r, h);
        !h && f && Ext.fly(s).highlight(null, f);
        !h && !f && g && g.call(c)
    },
    disableViewScroller: function(b) {
        var a = this.getScrollable();
        if (a) {
            a.setDisabled(b)
        }
    }
});
