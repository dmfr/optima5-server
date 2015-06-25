Ext.define("Sch.tooltip.ClockTemplate", {
    extend: "Ext.XTemplate",
    minuteHeight: 8,
    minuteTop: 2,
    hourHeight: 8,
    hourTop: 2,
    handLeft: 10,
    getRotateStyle: function(a) {
        return "transform:rotate(Ddeg);-ms-transform:rotate(Ddeg);-moz-transform: rotate(Ddeg);-webkit-transform: rotate(Ddeg);-o-transform:rotate(Ddeg);".replace(/D/g, a)
    },
    getRotateStyleIE: (function() {
        var c = Math.PI / 180,
            b = Math.cos,
            a = Math.sin;
        return function(d, j, n) {
            var g = this,
                h = d * c,
                f = b(h),
                l = a(h),
                i = n * a((90 - d) * c),
                k = n * b((90 - d) * c),
                m = Math.min(n, n - i),
                e = d > 180 ? k : 0,
                o = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + f + ", M12 = " + (-l) + ", M21 = " + l + ", M22 = " + f + ")";
            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", o, m + j, e + g.handLeft)
        }
    })(),
    constructor: function() {
        var a = Ext.isIE && Ext.isIE8m;
        this.callParent(['<div class="sch-clockwrap ' + (a ? "" : "sch-supports-border-radius") + ' {cls}"><div class="sch-clock"><div class="sch-hourIndicator" style="{[this.getHourStyle((values.date.getHours() % 12) * 30,' + this.hourTop + ", + " + this.hourHeight + ')]}">{[Ext.Date.monthNames[values.date.getMonth()].substr(0,3)]}</div><div class="sch-minuteIndicator" style="{[this.getMinuteStyle(values.date.getMinutes() * 6,' + this.minuteTop + ", + " + this.minuteHeight + ')]}">{[values.date.getDate()]}</div>' + (a ? "" : '<div class="sch-clock-dot"></div>') + '</div><span class="sch-clock-text">{text}</span></div>', {
            disableFormats: true,
            getMinuteStyle: a ? this.getRotateStyleIE : this.getRotateStyle,
            getHourStyle: a ? this.getRotateStyleIE : this.getRotateStyle
        }])
    }
});
