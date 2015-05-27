Ext.define("Sch.mixin.TimelineView", {
    extend: "Sch.mixin.AbstractTimelineView",
    requires: ["Sch.patches.ElementScroll", "Ext.tip.ToolTip"],
    overScheduledEventClass: "sch-event-hover",
    ScheduleEventMap: {
        click: "Click",
        mousedown: "MouseDown",
        mouseup: "MouseUp",
        dblclick: "DblClick",
        contextmenu: "ContextMenu",
        keydown: "KeyDown",
        keyup: "KeyUp"
    },
    preventOverCls: false,
    _initializeTimelineView: function () {
        this.callParent(arguments);
        this.on("destroy", this._onDestroy, this);
        this.on("afterrender", this._onAfterRender, this);
        this.setOrientation(this.orientation);
        this.addEvents("beforetooltipshow", "columnwidthchange");
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
    inheritables: function () {
        return {
            processUIEvent: function (d) {
                var a = d.getTarget(this.eventSelector),
                    c = this.ScheduleEventMap,
                    b = d.type,
                    f = false;
                if (a && b in c) {
                    this.fireEvent(this.scheduledEventName + b, this, this.resolveEventRecord(a), d);
                    f = !(this.getSelectionModel() instanceof Ext.selection.RowModel)
                }
                if (!f) {
                    return this.callParent(arguments)
                }
            }
        }
    },
    _onDestroy: function () {
        if (this.tip) {
            this.tip.destroy()
        }
    },
    _onAfterRender: function () {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true)
        }
        if (this.tooltipTpl) {
            this.el.on("mousemove", this.setupTooltip, this, {
                single: true
            })
        }
        var c = this.bufferedRenderer;
        if (c) {
            this.patchBufferedRenderingPlugin(c);
            this.patchBufferedRenderingPlugin(this.lockingPartner.bufferedRenderer)
        }
        this.on("bufferedrefresh", this.onBufferedRefresh, this, {
            buffer: 10
        });
        this.setupTimeCellEvents();
        var b = this.getSecondaryCanvasEl();
        if (b.getStyle("position").toLowerCase() !== "absolute") {
            var a = Ext.Msg || window;
            a.alert("ERROR: The CSS file for the Bryntum component has not been loaded.")
        }
    },
    patchBufferedRenderingPlugin: function (c) {
        var b = this;
        var a = c.setBodyTop;
        c.setBodyTop = function (d, e) {
            if (d < 0) {
                d = 0
            }
            var f = a.apply(this, arguments);
            b.fireEvent("bufferedrefresh", this);
            return f
        }
    },
    onBufferedRefresh: function () {
        this.getSecondaryCanvasEl().dom.style.top = this.body.dom.style.top
    },
    setMouseOverEnabled: function (a) {
        this[a ? "mon" : "mun"](this.el, {
            mouseover: this.onEventMouseOver,
            mouseout: this.onEventMouseOut,
            delegate: this.eventSelector,
            scope: this
        })
    },
    onEventMouseOver: function (c, a) {
        if (a !== this.lastItem && !this.preventOverCls) {
            this.lastItem = a;
            Ext.fly(a).addCls(this.overScheduledEventClass);
            var b = this.resolveEventRecord(a);
            if (b) {
                this.fireEvent("eventmouseenter", this, b, c)
            }
        }
    },
    onEventMouseOut: function (b, a) {
        if (this.lastItem) {
            if (!b.within(this.lastItem, true, true)) {
                Ext.fly(this.lastItem).removeCls(this.overScheduledEventClass);
                this.fireEvent("eventmouseleave", this, this.resolveEventRecord(this.lastItem), b);
                delete this.lastItem
            }
        }
    },
    highlightItem: function (b) {
        if (b) {
            var a = this;
            a.clearHighlight();
            a.highlightedItem = b;
            Ext.fly(b).addCls(a.overItemCls)
        }
    },
    setupTooltip: function () {
        var b = this,
            a = Ext.apply({
                renderTo: Ext.getBody(),
                delegate: b.eventSelector,
                target: b.el,
                anchor: "b",
                rtl: b.rtl,
                show: function () {
                    Ext.ToolTip.prototype.show.apply(this, arguments);
                    if (this.triggerElement && b.getOrientation() === "horizontal") {
                        this.setX(this.targetXY[0] - 10);
                        this.setY(Ext.fly(this.triggerElement).getY() - this.getHeight() - 10)
                    }
                }
            }, b.tipCfg);
        b.tip = new Ext.ToolTip(a);
        b.tip.on({
            beforeshow: function (d) {
                if (!d.triggerElement || !d.triggerElement.id) {
                    return false
                }
                var c = this.resolveEventRecord(d.triggerElement);
                if (!c || this.fireEvent("beforetooltipshow", this, c) === false) {
                    return false
                }
                d.update(this.tooltipTpl.apply(this.getDataForTooltipTpl(c)))
            },
            scope: this
        })
    },
    getTimeAxisColumn: function () {
        if (!this.timeAxisColumn) {
            this.timeAxisColumn = this.headerCt.down("timeaxiscolumn")
        }
        return this.timeAxisColumn
    },
    getDataForTooltipTpl: function (a) {
        return Ext.apply({
            _record: a
        }, a.data)
    },
    refreshKeepingScroll: function () {
        Ext.suspendLayouts();
        this.saveScrollState();
        this.refresh();
        if (this.up("tablepanel[lockable=true]").lockedGridDependsOnSchedule) {
            this.lockingPartner.refresh()
        }
        if (this.scrollState.left !== 0 || this.scrollState.top !== 0 || this.infiniteScroll) {
            this.restoreScrollState()
        }
        Ext.resumeLayouts(true)
    },
    setupTimeCellEvents: function () {
        this.mon(this.el, {
            click: this.handleScheduleEvent,
            dblclick: this.handleScheduleEvent,
            contextmenu: this.handleScheduleEvent,
            scope: this
        })
    },
    getTableRegion: function () {
        var a = this.el.down("." + Ext.baseCSSPrefix + "grid-table");
        return (a || this.el).getRegion()
    },
    getRowNode: function (a) {
        return this.getNodeByRecord(a)
    },
    findRowByChild: function (a) {
        return this.findItemByChild(a)
    },
    getRecordForRowNode: function (a) {
        return this.getRecord(a)
    },
    refreshKeepingResourceScroll: function () {
        var a = this.getScroll();
        this.refresh();
        if (this.getOrientation() === "horizontal") {
            this.scrollVerticallyTo(a.top)
        } else {
            this.scrollHorizontallyTo(a.left)
        }
    },
    scrollHorizontallyTo: function (a, b) {
        var c = this.getEl();
        if (c) {
            c.scrollTo("left", Math.max(0, a), b)
        }
    },
    scrollVerticallyTo: function (c, a) {
        var b = this.getEl();
        if (b) {
            b.scrollTo("top", Math.max(0, c), a)
        }
    },
    getVerticalScroll: function () {
        var a = this.getEl();
        return a.getScroll().top
    },
    getHorizontalScroll: function () {
        var a = this.getEl();
        return a.getScroll().left
    },
    getScroll: function () {
        var a = this.getEl().getScroll();
        return {
            top: a.top,
            left: a.left
        }
    },
    getXYFromDate: function () {
        var a = this.getCoordinateFromDate.apply(this, arguments);
        return this.orientation === "horizontal" ? [a, 0] : [0, a]
    },
    handleScheduleEvent: function (a) {},
    scrollElementIntoView: function (b, k, p, f, e) {
        var a = 20,
            o = b.dom,
            h = b.getOffsetsTo(k = Ext.getDom(k) || Ext.getBody().dom),
            d = h[0] + k.scrollLeft,
            l = h[1] + k.scrollTop,
            i = l + o.offsetHeight,
            q = d + o.offsetWidth,
            m = k.clientHeight,
            g = parseInt(k.scrollTop, 10),
            r = parseInt(k.scrollLeft, 10),
            n = g + m,
            j = r + k.clientWidth,
            c;
        if (e) {
            if (f) {
                f = Ext.apply({
                    listeners: {
                        afteranimate: function () {
                            b.scrollChildFly.attach(o).highlight()
                        }
                    }
                }, f)
            } else {
                b.scrollChildFly.attach(o).highlight()
            }
        }
        if (o.offsetHeight > m || l < g) {
            c = l - a
        } else {
            if (i > n) {
                c = i - m + a
            }
        } if (c != null) {
            b.scrollChildFly.attach(k).scrollTo("top", c, f)
        }
        if (p !== false) {
            c = null;
            if (o.offsetWidth > k.clientWidth || d < r) {
                c = d - a
            } else {
                if (q > j) {
                    c = q - k.clientWidth + a
                }
            } if (c != null) {
                b.scrollChildFly.attach(k).scrollTo("left", c, f)
            }
        }
        return b
    }
});
