Ext.define("Sch.feature.DragCreator", {
    requires: ["Ext.XTemplate", "Ext.ToolTip", "Sch.util.Date", "Sch.util.ScrollManager", "Sch.util.DragTracker", "Sch.tooltip.Tooltip", "Sch.tooltip.HoverTip"],
    disabled: false,
    showHoverTip: true,
    showDragTip: true,
    dragTip: null,
    dragTolerance: 2,
    hoverTip: null,
    validatorFn: Ext.emptyFn,
    validatorFnScope: null,
    trackerConfig: null,
    schedulerView: null,
    template: '<div class="sch-dragcreator-proxy"><div class="sch-event-inner">&#160;</div></div>',
    constructor: function(a) {
        Ext.apply(this, a || {});
        this.lastTime = new Date();
        if (!(this.template instanceof Ext.Template)) {
            this.template = new Ext.Template(this.template)
        }
        this.schedulerView.on("destroy", this.onSchedulerDestroy, this);
        if (Ext.supports.Touch) {
            this.schedulerView.on("boxready", this.initDragTracker, this)
        } else {
            this.schedulerView.el.on("mousemove", this.initDragTracker, this, {
                single: true
            })
        }
        this.callParent([a])
    },
    setDisabled: function(a) {
        this.disabled = a;
        if (this.hoverTip) {
            this.hoverTip.setDisabled(a)
        }
        if (this.dragTip) {
            this.dragTip.setDisabled(a)
        }
    },
    getProxy: function() {
        if (!this.proxy) {
            this.proxy = this.template.append(this.schedulerView.getSecondaryCanvasEl(), {}, true);
            this.proxy.hide = function() {
                this.setStyle({
                    left: "-10000px",
                    top: "-10000px"
                })
            }
        }
        return this.proxy
    },
    onBeforeDragStart: function(d, g) {
        var b = this.schedulerView,
            a = g.getTarget("." + b.timeCellCls, 5);
        if (a && this.isCreateAllowed(g) && (!g.event.touches || g.event.touches.length === 1)) {
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
    isCreateAllowed: function(a) {
        return !a.getTarget(this.schedulerView.eventSelector)
    },
    onDragStart: function() {
        var d = this,
            b = d.schedulerView,
            a = d.tracker.getRegion(),
            c = d.getProxy();
        this.dragging = true;
        if (this.hoverTip) {
            this.hoverTip.disable()
        }
        d.start = d.originalStart;
        d.end = d.start;
        d.originalScroll = b.getScroll();
        if (b.getMode() === "horizontal") {
            d.rowBoundaries = {
                top: d.resourceRegion.top,
                bottom: d.resourceRegion.bottom
            }
        } else {
            d.rowBoundaries = {
                left: d.resourceRegion.left,
                right: d.resourceRegion.right
            }
        }
        Ext.apply(a, d.rowBoundaries);
        c.setBox(a);
        c.show();
        b.fireEvent("dragcreatestart", b, c);
        if (d.showDragTip) {
            d.dragTip.enable();
            d.dragTip.update(d.start, d.end, true);
            d.dragTip.show(c);
            d.dragTip.setStyle("visibility", "visible")
        }
        Sch.util.ScrollManager.activate(b, b.getMode() === "horizontal" ? "horizontal" : "vertical")
    },
    onDrag: function(h, b) {
        var d = this,
            f = d.schedulerView,
            i = d.tracker.getRegion(),
            a = f.getStartEndDatesFromRegion(i, "round"),
            k = "";
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
        d.valid = this.validatorFn.call(d.validatorFnScope || d, d.resourceRecord, d.start, d.end);
        if (d.valid && typeof d.valid !== "boolean") {
            k = d.valid.message;
            d.valid = d.valid.valid
        }
        d.valid = (d.valid !== false);
        if (d.showDragTip) {
            d.dragTip.update(d.start, d.end, d.valid, k)
        }
        Ext.apply(i, d.rowBoundaries);
        var g = f.getScroll();
        var c = this.getProxy();
        c.setBox(i);
        if (f.isHorizontal()) {
            c.setY(d.resourceRegion.top + d.originalScroll.top - g.top)
        }
    },
    eventSwallower: function(a) {
        a.stopPropagation();
        a.preventDefault()
    },
    onDragEnd: function(g, h) {
        var f = this,
            c = f.schedulerView,
            d = true,
            a = h.getTarget(),
            b = Ext.get(a);
        b.on("click", this.eventSwallower);
        setTimeout(function() {
            b.un("click", f.eventSwallower)
        }, 100);
        f.dragging = false;
        if (f.showDragTip) {
            f.dragTip.disable()
        }
        if (!f.start || !f.end || (f.end - f.start <= 0)) {
            f.valid = false
        }
        f.createContext = {
            start: f.start,
            end: f.end,
            resourceRecord: f.resourceRecord,
            e: h,
            finalize: function() {
                f.finalize.apply(f, arguments)
            }
        };
        if (f.valid) {
            d = c.fireEvent("beforedragcreatefinalize", f, f.createContext, h, this.getProxy()) !== false
        }
        if (d) {
            f.finalize(f.valid)
        }
        Sch.util.ScrollManager.deactivate()
    },
    finalize: function(a) {
        var b = this.createContext;
        var d = this.schedulerView;
        if (a) {
            var c = Ext.create(d.eventStore.model);
            if (Ext.data.TreeStore && d.eventStore instanceof Ext.data.TreeStore) {
                c.set("leaf", true);
                d.eventStore.append(c)
            } else {
                if (!!d.eventStore.getAssignmentStore()) {
                    d.eventStore.append(c)
                }
            }
            c.assign(b.resourceRecord);
            c.setStartEndDate(b.start, b.end);
            d.fireEvent("dragcreateend", d, c, b.resourceRecord, b.e, this.getProxy())
        } else {
            this.proxy.hide()
        }
        this.schedulerView.fireEvent("afterdragcreate", d, this.getProxy());
        if (this.hoverTip) {
            this.hoverTip.enable()
        }
    },
    dragging: false,
    initDragTracker: function() {
        var d = this,
            b = Ext.supports.Touch,
            a = d.schedulerView;
        var c = Ext.apply({
            el: a.el,
            deferredActivation: b ? 1000 : false,
            tolerance: d.dragTolerance,
            listeners: {
                mousedown: d.verifyLeftButtonPressed,
                beforedragstart: d.onBeforeDragStart,
                dragstart: d.onDragStart,
                drag: d.onDrag,
                dragend: d.onDragEnd,
                scope: d
            }
        }, this.trackerConfig);
        if (b) {
            this.showDragTip = false;
            this.showHoverTip = false;
            this.dragTip = null;
            this.hoverTip = null
        } else {
            this.setupTooltips()
        }
        d.tracker = new Sch.util.DragTracker(c)
    },
    setupTooltips: function() {
        var c = this,
            a = c.schedulerView;
        if (this.showDragTip) {
            var b = this.dragTip;
            if (b instanceof Ext.tip.ToolTip) {
                Ext.applyIf(b, {
                    schedulerView: a
                });
                b.on("beforeshow", function() {
                    return c.dragging
                })
            } else {
                this.dragTip = new Sch.tooltip.Tooltip(Ext.apply({
                    cls: "sch-dragcreate-tip",
                    schedulerView: a,
                    listeners: {
                        beforeshow: function() {
                            return c.dragging
                        }
                    }
                }, b))
            }
        }
        if (c.showHoverTip) {
            var d = c.hoverTip;
            if (d instanceof Ext.tip.ToolTip) {
                Ext.applyIf(d, {
                    schedulerView: a
                })
            } else {
                c.hoverTip = Ext.ComponentManager.create(Ext.applyIf({
                    renderTo: Ext.getBody(),
                    target: a.el,
                    schedulerView: a
                }, d), "scheduler_hovertip")
            }
        }
    },
    verifyLeftButtonPressed: function(a, b) {
        return b.button === 0
    },
    onSchedulerDestroy: function() {
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
    }
});
