Ext.define("Sch.feature.DragCreator", {
    requires: ["Ext.XTemplate", "Sch.util.Date", "Sch.util.ScrollManager", "Sch.util.DragTracker", "Sch.tooltip.Tooltip", "Sch.tooltip.ClockTemplate"],
    disabled: false,
    showHoverTip: true,
    showDragTip: true,
    dragTolerance: 2,
    validatorFn: Ext.emptyFn,
    validatorFnScope: null,
    hoverTipTemplate: null,
    constructor: function (a) {
        Ext.apply(this, a || {});
        this.lastTime = new Date();
        this.template = this.template || new Ext.Template('<div class="sch-dragcreator-proxy"><div class="sch-event-inner">&#160;</div></div>', {
            compiled: true,
            disableFormats: true
        });
        this.schedulerView.on("destroy", this.onSchedulerDestroy, this);
        this.schedulerView.el.on("mousemove", this.setupTooltips, this, {
            single: true
        });
        this.callParent([a])
    },
    setDisabled: function (a) {
        this.disabled = a;
        if (this.hoverTip) {
            this.hoverTip.setDisabled(a)
        }
        if (this.dragTip) {
            this.dragTip.setDisabled(a)
        }
    },
    getProxy: function () {
        if (!this.proxy) {
            this.proxy = this.template.append(this.schedulerView.getSecondaryCanvasEl(), {}, true);
            this.proxy.hide = function () {
                this.setTop(-10000)
            }
        }
        return this.proxy
    },
    onMouseMove: function (c) {
        var a = this.hoverTip;
        if (a.disabled || this.dragging) {
            return
        }
        if (c.getTarget("." + this.schedulerView.timeCellCls, 5) && !c.getTarget(this.schedulerView.eventSelector)) {
            var b = this.schedulerView.getDateFromDomEvent(c, "floor");
            if (b) {
                if (b - this.lastTime !== 0) {
                    this.updateHoverTip(b);
                    if (a.hidden) {
                        a[Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0 ? "addCls" : "removeCls"]("sch-day-resolution");
                        a.show()
                    }
                }
            } else {
                a.hide();
                this.lastTime = null
            }
        } else {
            a.hide();
            this.lastTime = null
        }
    },
    updateHoverTip: function (a) {
        if (a) {
            var b = this.schedulerView.getFormattedDate(a);
            this.hoverTip.update(this.hoverTipTemplate.apply({
                date: a,
                text: b
            }));
            this.lastTime = a
        }
    },
    onBeforeDragStart: function (d, g) {
        var b = this.schedulerView,
            a = g.getTarget("." + b.timeCellCls, 5);
        if (a && !g.getTarget(b.eventSelector)) {
            var c = b.resolveResource(a);
            var f = b.getDateFromDomEvent(g);
            if (!this.disabled && a && b.fireEvent("beforedragcreate", b, c, f, g) !== false) {
                this.resourceRecord = c;
                this.originalStart = f;
                this.resourceRegion = b.getScheduleRegion(this.resourceRecord, this.originalStart);
                this.dateConstraints = b.getDateConstraints(this.resourceRecord, this.originalStart);
                return true
            }
        }
        return false
    },
    onDragStart: function () {
        var c = this,
            a = c.schedulerView,
            b = c.getProxy();
        this.dragging = true;
        if (this.hoverTip) {
            this.hoverTip.disable()
        }
        c.start = c.originalStart;
        c.end = c.start;
        c.originalScroll = a.getScroll();
        if (a.getOrientation() === "horizontal") {
            c.rowBoundaries = {
                top: c.resourceRegion.top,
                bottom: c.resourceRegion.bottom
            };
            b.setRegion({
                top: c.rowBoundaries.top,
                right: c.tracker.startXY[0],
                bottom: c.rowBoundaries.bottom,
                left: c.tracker.startXY[0]
            })
        } else {
            c.rowBoundaries = {
                left: c.resourceRegion.left,
                right: c.resourceRegion.right
            };
            b.setRegion({
                top: c.tracker.startXY[1],
                right: c.resourceRegion.right,
                bottom: c.tracker.startXY[1],
                left: c.resourceRegion.left
            })
        }
        b.show();
        c.schedulerView.fireEvent("dragcreatestart", c.schedulerView);
        if (c.showDragTip) {
            c.dragTip.enable();
            c.dragTip.update(c.start, c.end, true);
            c.dragTip.show(b);
            c.dragTip.el.setStyle("visibility", "visible")
        }
        Sch.util.ScrollManager.register(c.schedulerView.el)
    },
    onDrag: function (h, b) {
        var d = this,
            f = d.schedulerView,
            i = d.tracker.getRegion(),
            a = f.getStartEndDatesFromRegion(i, "round");
        if (!a) {
            return
        }
        d.start = a.start || d.start;
        d.end = a.end || d.end;
        var j = d.dateConstraints;
        if (j) {
            d.end = Sch.util.Date.constrain(d.end, j.start, j.end);
            d.start = Sch.util.Date.constrain(d.start, j.start, j.end)
        }
        d.valid = this.validatorFn.call(d.validatorFnScope || d, d.resourceRecord, d.start, d.end) !== false;
        if (d.showDragTip) {
            d.dragTip.update(d.start, d.end, d.valid)
        }
        Ext.apply(i, d.rowBoundaries);
        var g = f.getScroll();
        var c = this.getProxy();
        c.setRegion(i);
        if (f.isHorizontal()) {
            c.setY(d.resourceRegion.top + d.originalScroll.top - g.top)
        }
    },
    eventSwallower: function (a) {
        a.stopPropagation();
        a.preventDefault()
    },
    onDragEnd: function (f, g) {
        var d = this,
            b = d.schedulerView,
            c = true,
            a = g.getTarget();
        Ext.fly(a).on("click", this.eventSwallower);
        setTimeout(function () {
            Ext.fly(a).un("click", this.eventSwallower)
        }, 100);
        d.dragging = false;
        if (d.showDragTip) {
            d.dragTip.disable()
        }
        if (!d.start || !d.end || (d.end - d.start <= 0)) {
            d.valid = false
        }
        d.createContext = {
            start: d.start,
            end: d.end,
            resourceRecord: d.resourceRecord,
            e: g,
            finalize: function () {
                d.finalize.apply(d, arguments)
            }
        };
        if (d.valid) {
            c = b.fireEvent("beforedragcreatefinalize", d, d.createContext, g) !== false
        }
        if (c) {
            d.finalize(d.valid)
        }
        Sch.util.ScrollManager.unregister(this.schedulerView.el)
    },
    finalize: function (a) {
        var b = this.createContext;
        var d = this.schedulerView;
        if (a) {
            var c = Ext.create(d.eventStore.model);
            if (Ext.data.TreeStore && d.eventStore instanceof Ext.data.TreeStore) {
                c.set("leaf", true);
                d.eventStore.append(c)
            }
            c.assign(b.resourceRecord);
            c.setStartEndDate(b.start, b.end);
            d.fireEvent("dragcreateend", d, c, b.resourceRecord, b.e)
        } else {
            this.proxy.hide()
        }
        this.schedulerView.fireEvent("afterdragcreate", d);
        if (this.hoverTip) {
            this.hoverTip.enable()
        }
    },
    tipCfg: {
        trackMouse: true,
        bodyCssClass: "sch-hovertip",
        autoHide: false,
        dismissDelay: 1000,
        showDelay: 300
    },
    dragging: false,
    setupTooltips: function () {
        var c = this,
            b = c.schedulerView,
            a = b.getSecondaryCanvasEl();
        c.tracker = new Sch.util.DragTracker({
            el: b.el,
            tolerance: c.dragTolerance,
            listeners: {
                mousedown: c.verifyLeftButtonPressed,
                beforedragstart: c.onBeforeDragStart,
                dragstart: c.onDragStart,
                drag: c.onDrag,
                dragend: c.onDragEnd,
                scope: c
            }
        });
        if (this.showDragTip) {
            this.dragTip = new Sch.tooltip.Tooltip({
                cls: "sch-dragcreate-tip",
                renderTo: a,
                schedulerView: b,
                listeners: {
                    beforeshow: function () {
                        return c.dragging
                    }
                }
            })
        }
        if (c.showHoverTip) {
            var d = b.el;
            c.hoverTipTemplate = c.hoverTipTemplate || new Sch.tooltip.ClockTemplate();
            c.hoverTip = new Ext.ToolTip(Ext.applyIf({
                renderTo: document.body,
                target: d,
                disabled: c.disabled
            }, c.tipCfg));
            c.hoverTip.on("beforeshow", c.tipOnBeforeShow, c);
            b.mon(d, {
                mouseleave: function () {
                    c.hoverTip.hide()
                },
                mousemove: c.onMouseMove,
                scope: c
            })
        }
    },
    verifyLeftButtonPressed: function (a, b) {
        return b.button === 0
    },
    onSchedulerDestroy: function () {
        if (this.hoverTip) {
            this.hoverTip.destroy()
        }
        if (this.dragTip) {
            this.dragTip.destroy()
        }
        if (this.tracker) {
            this.tracker.destroy()
        }
        if (this.proxy) {
            Ext.destroy(this.proxy);
            this.proxy = null
        }
    },
    tipOnBeforeShow: function (a) {
        return !this.disabled && !this.dragging && this.lastTime !== null
    }
});
