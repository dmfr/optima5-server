Ext.define("Sch.tooltip.Tooltip", {
    extend: "Ext.tip.ToolTip",
    requires: ["Sch.tooltip.ClockTemplate"],
    autoHide: false,
    anchor: "b",
    padding: "0 3 0 0",
    showDelay: 0,
    hideDelay: 0,
    quickShowInterval: 0,
    dismissDelay: 0,
    trackMouse: false,
    anchorOffset: 5,
    shadow: false,
    frame: false,
    schedulerView: null,
    message: null,
    valid: true,
    offsetAdjust: [18, 5],
    constructor: function(b) {
        var a = new Sch.tooltip.ClockTemplate();
        this.startDate = this.endDate = new Date();
        if (!this.template) {
            this.template = Ext.create("Ext.XTemplate", '<div class="sch-tip-{[values.valid ? "ok" : "notok"]}">{[this.renderClock(values.startDate, values.startText, "sch-tooltip-startdate")]}{[this.renderClock(values.endDate, values.endText, "sch-tooltip-enddate")]}<div class="sch-tip-message">{message}</div></div>', {
                disableFormats: true,
                renderClock: function(d, e, c) {
                    return a.apply({
                        date: d,
                        text: e,
                        cls: c
                    })
                }
            })
        }
        this.callParent(arguments)
    },
    update: function(a, g, f, e) {
        if (this.startDate - a !== 0 || this.endDate - g !== 0 || this.valid !== f || this.message !== e) {
            var d = (this.message && !e) || (!this.message && e);
            this.startDate = a;
            this.endDate = g;
            this.valid = f;
            this.message = e;
            var c = this.schedulerView.getFormattedDate(a),
                b = this.schedulerView.getFormattedEndDate(g, a);
            if (this.mode === "calendar" && g.getHours() === 0 && g.getMinutes() === 0 && !(g.getYear() === a.getYear() && g.getMonth() === a.getMonth() && g.getDate() === a.getDate())) {
                g = Sch.util.Date.add(g, Sch.util.Date.DAY, -1)
            }
            this.callParent([this.template.apply({
                valid: f,
                startDate: a,
                endDate: g,
                startText: c,
                endText: b,
                message: e
            })]);
            if (d) {
                this.realign()
            }
        }
    },
    show: function(b, a) {
        if (!b || Ext.isArray(b)) {
            return
        }
        if (Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0) {
            this.mode = "calendar";
            this.addCls("sch-day-resolution");
            this.removeCls("sch-hour-resolution")
        } else {
            this.mode = "clock";
            this.removeCls("sch-day-resolution");
            this.addCls("sch-hour-resolution")
        }
        a = arguments.length > 1 ? a : this.offsetAdjust[0];
        this.mouseOffsets = [a - this.offsetAdjust[0], -this.offsetAdjust[1]];
        this.setTarget(b);
        this.callParent();
        this.realign()
    },
    realign: function() {
        this.el.alignTo(this.target, "bl-tl", this.mouseOffsets)
    },
    afterRender: function() {
        this.callParent(arguments);
        this.el.on("mouseenter", this.realign, this)
    }
});
