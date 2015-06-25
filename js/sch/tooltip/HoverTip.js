Ext.define("Sch.tooltip.HoverTip", {
    extend: "Ext.tip.ToolTip",
    alias: "widget.scheduler_hovertip",
    requires: ["Sch.tooltip.ClockTemplate"],
    trackMouse: true,
    bodyCls: "sch-hovertip",
    messageTpl: '<div class="sch-hovertip-msg">{message}</div>',
    autoHide: false,
    dismissDelay: 1000,
    showDelay: 300,
    schedulerView: null,
    initComponent: function() {
        var b = this;
        var a = b.schedulerView;
        b.clockTpl = new Sch.tooltip.ClockTemplate();
        b.messageTpl = new Ext.XTemplate(b.messageTpl);
        b.lastTime = null;
        b.lastResource = null;
        b.callParent(arguments);
        b.on("beforeshow", b.tipOnBeforeShow, b);
        a.mon(a.el, {
            mouseleave: function() {
                b.hide()
            },
            mousemove: b.handleMouseMove,
            scope: b
        })
    },
    handleMouseMove: function(f) {
        var c = this;
        var a = c.schedulerView;
        if (c.disabled) {
            return
        }
        if (f.getTarget("." + a.timeCellCls, 5) && !f.getTarget(a.eventSelector)) {
            var d = a.getDateFromDomEvent(f, "floor");
            if (d) {
                var b = a.resolveResource(f.getTarget());
                if (d - c.lastTime !== 0 || b !== c.lastResource) {
                    c.lastResource = b;
                    c.updateHoverTip(d, f);
                    if (c.hidden) {
                        if (Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0) {
                            c.addCls("sch-day-resolution");
                            c.removeCls("sch-hour-resolution")
                        } else {
                            c.removeCls("sch-day-resolution");
                            c.addCls("sch-hour-resolution")
                        }
                        c.show()
                    }
                }
            } else {
                c.hide();
                c.lastTime = null;
                c.lastResource = null
            }
        } else {
            c.hide();
            c.lastTime = null;
            c.lastResource = null
        }
    },
    getText: function() {},
    updateHoverTip: function(c, d) {
        if (c) {
            var b = this.clockTpl.apply({
                date: c,
                text: this.schedulerView.getFormattedDate(c)
            });
            var a = this.messageTpl.apply({
                message: this.getText(c, d)
            });
            this.update(b + a);
            this.lastTime = c
        }
    },
    tipOnBeforeShow: function(a) {
        return !this.disabled && this.lastTime !== null
    }
});
