Ext.define("Sch.tooltip.ClockTemplate", {
    extend: "Ext.XTemplate",
    constructor: function () {
        var i = Math.PI / 180,
            l = Math.cos,
            j = Math.sin,
            m = 7,
            c = 2,
            d = 10,
            k = 6,
            f = 3,
            a = 10,
            e = Ext.isIE && (Ext.isIE8m || Ext.isIEQuirks);

        function b(n) {
            var q = n * i,
                o = l(q),
                t = j(q),
                r = k * j((90 - n) * i),
                s = k * l((90 - n) * i),
                u = Math.min(k, k - r),
                p = n > 180 ? s : 0,
                v = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + o + ", M12 = " + (-t) + ", M21 = " + t + ", M22 = " + o + ")";
            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", v, u + f, p + a)
        }

        function h(n) {
            var q = n * i,
                o = l(q),
                t = j(q),
                r = m * j((90 - n) * i),
                s = m * l((90 - n) * i),
                u = Math.min(m, m - r),
                p = n > 180 ? s : 0,
                v = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + o + ", M12 = " + (-t) + ", M21 = " + t + ", M22 = " + o + ")";
            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", v, u + c, p + d)
        }

        function g(n) {
            return Ext.String.format("transform:rotate({0}deg);-ms-transform:rotate({0}deg);-moz-transform: rotate({0}deg);-webkit-transform: rotate({0}deg);-o-transform:rotate({0}deg);", n)
        }
        this.callParent(['<div class="sch-clockwrap {cls}"><div class="sch-clock"><div class="sch-hourIndicator" style="{[this.getHourStyle((values.date.getHours()%12) * 30)]}">{[Ext.Date.monthNames[values.date.getMonth()].substr(0,3)]}</div><div class="sch-minuteIndicator" style="{[this.getMinuteStyle(values.date.getMinutes() * 6)]}">{[values.date.getDate()]}</div></div><span class="sch-clock-text">{text}</span></div>', {
            compiled: true,
            disableFormats: true,
            getMinuteStyle: e ? h : g,
            getHourStyle: e ? b : g
        }])
    }
});
