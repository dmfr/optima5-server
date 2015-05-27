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
    valid: true,
    anchorOffset: 5,
    shadow: false,
    frame: false,
    constructor: function (b) {
        var a = new Sch.tooltip.ClockTemplate();
        this.renderTo = document.body;
        this.startDate = this.endDate = new Date();
        if (!this.template) {
            this.template = Ext.create("Ext.XTemplate", '<div class="{[values.valid ? "sch-tip-ok" : "sch-tip-notok"]}">', '{[this.renderClock(values.startDate, values.startText, "sch-tooltip-startdate")]}', '{[this.renderClock(values.endDate, values.endText, "sch-tooltip-enddate")]}', "</div>", {
                compiled: true,
                disableFormats: true,
                renderClock: function (d, e, c) {
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
    update: function (a, e, d, f) {
        if (this.startDate - a !== 0 || this.endDate - e !== 0 || this.valid !== d || f) {
            this.startDate = a;
            this.endDate = e;
            this.valid = d;
            var c = this.schedulerView.getFormattedDate(a),
                b = this.schedulerView.getFormattedEndDate(e, a);
            if (this.mode === "calendar" && e.getHours() === 0 && e.getMinutes() === 0 && !(e.getYear() === a.getYear() && e.getMonth() === a.getMonth() && e.getDate() === a.getDate())) {
                e = Sch.util.Date.add(e, Sch.util.Date.DAY, -1)
            }
            this.callParent([this.template.apply({
                valid: d,
                startDate: a,
                endDate: e,
                startText: c,
                endText: b
            })])
        }
    },
    show: function (b, a) {
        if (!b) {
            return
        }
        a = a || 18;
        if (Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0) {
            this.mode = "calendar";
            this.addCls("sch-day-resolution")
        } else {
            this.mode = "clock";
            this.removeCls("sch-day-resolution")
        }
        this.mouseOffsets = [a - 18, -7];
        this.setTarget(b);
        this.callParent();
        this.alignTo(b, "bl-tl", this.mouseOffsets);
        this.mon(Ext.getDoc(), "mousemove", this.onMyMouseMove, this);
        this.mon(Ext.getDoc(), "mouseup", this.onMyMouseUp, this, {
            single: true
        })
    },
    onMyMouseMove: function () {
        this.el.alignTo(this.target, "bl-tl", this.mouseOffsets)
    },
    onMyMouseUp: function () {
        this.mun(Ext.getDoc(), "mousemove", this.onMyMouseMove, this)
    },
    afterRender: function () {
        this.callParent(arguments);
        this.el.on("mouseenter", this.onElMouseEnter, this)
    },
    onElMouseEnter: function () {
        this.alignTo(this.target, "bl-tl", this.mouseOffsets)
    }
});
