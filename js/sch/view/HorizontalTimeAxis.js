Ext.define("Sch.view.HorizontalTimeAxis", {
    extend: "Ext.util.Observable",
    requires: ["Ext.XTemplate"],
    trackHeaderOver: true,
    compactCellWidthThreshold: 15,
    baseCls: "sch-column-header",
    tableCls: "sch-header-row",
    headerHtmlRowTpl: '<table border="0" cellspacing="0" cellpadding="0" style="width: {totalWidth}px; {tstyle}" class="{{tableCls}} sch-header-row-{position} {cls}"><thead><tr><tpl for="cells"><td class="{{baseCls}} {headerCls}" style="position : static; text-align: {align}; width: {width}px; {style}" tabIndex="0"headerPosition="{parent.position}" headerIndex="{[xindex-1]}"><div class="sch-simple-timeheader">{header}</div></td></tpl></tr></thead></table>',
    model: null,
    hoverCls: "",
    containerEl: null,
    height: null,
    constructor: function(d) {
        var e = this;
        var b = !!Ext.versions.touch;
        var a = b ? "tap" : "click";
        Ext.apply(this, d);
        e.callParent(arguments);
        e.model.on("update", e.onModelUpdate, this, {
            priority: 5
        });
        e.containerEl = Ext.get(e.containerEl);
        if (!(e.headerHtmlRowTpl instanceof Ext.Template)) {
            e.headerHtmlRowTpl = e.headerHtmlRowTpl.replace("{{baseCls}}", this.baseCls).replace("{{tableCls}}", this.tableCls);
            e.headerHtmlRowTpl = new Ext.XTemplate(e.headerHtmlRowTpl)
        }
        if (e.trackHeaderOver && e.hoverCls) {
            e.containerEl.on({
                mousemove: e.highlightCell,
                delegate: ".sch-column-header",
                scope: e
            });
            e.containerEl.on({
                mouseleave: e.clearHighlight,
                scope: e
            })
        }
        var c = {
            scope: this,
            delegate: ".sch-column-header"
        };
        if (b) {
            c.tap = this.onElClick("tap");
            c.doubletap = this.onElClick("doubletap")
        } else {
            c.click = this.onElClick("click");
            c.dblclick = this.onElClick("dblclick");
            c.contextmenu = this.onElClick("contextmenu")
        }
        e._listenerCfg = c;
        if (e.containerEl) {
            e.containerEl.on(c)
        }
    },
    destroy: function() {
        var a = this;
        if (a.containerEl) {
            a.containerEl.un(a._listenerCfg);
            a.containerEl.un({
                mousemove: a.highlightCell,
                delegate: ".sch-simple-timeheader",
                scope: a
            });
            a.containerEl.un({
                mouseleave: a.clearHighlight,
                scope: a
            })
        }
        a.model.un({
            update: a.onModelUpdate,
            scope: a
        })
    },
    onModelUpdate: function() {
        this.render()
    },
    getHTML: function(e, h, d) {
        var i = this.model.getColumnConfig();
        var g = this.model.getTotalWidth();
        var c = Ext.Object.getKeys(i).length;
        var b = this.height ? this.height / c : 0;
        var f = "";
        var a;
        if (i.top) {
            this.embedCellWidths(i.top);
            f += this.headerHtmlRowTpl.apply({
                totalWidth: g,
                cells: i.top,
                position: "top",
                tstyle: "border-top : 0;" + (b ? "height:" + b + "px" : "")
            })
        }
        if (i.middle) {
            this.embedCellWidths(i.middle);
            f += this.headerHtmlRowTpl.apply({
                totalWidth: g,
                cells: i.middle,
                position: "middle",
                tstyle: (i.top ? "" : "border-top : 0;") + (b ? "height:" + b + "px" : ""),
                cls: !i.bottom && this.model.getTickWidth() <= this.compactCellWidthThreshold ? "sch-header-row-compact" : ""
            })
        }
        if (i.bottom) {
            this.embedCellWidths(i.bottom);
            f += this.headerHtmlRowTpl.apply({
                totalWidth: g,
                cells: i.bottom,
                position: "bottom",
                tstyle: (b ? "height:" + b + "px" : ""),
                cls: this.model.getTickWidth() <= this.compactCellWidthThreshold ? "sch-header-row-compact" : ""
            })
        }
        return f + '<div class="sch-header-secondary-canvas"></div>'
    },
    render: function() {
        if (!this.containerEl) {
            return
        }
        var e = this.containerEl,
            f = e.dom,
            d = f.style.display,
            a = this.model.getColumnConfig(),
            b = f.parentNode;
        f.style.display = "none";
        b.removeChild(f);
        var c = this.getHTML();
        f.innerHTML = c;
        if (!a.top && !a.middle) {
            this.containerEl.addCls("sch-header-single-row")
        } else {
            this.containerEl.removeCls("sch-header-single-row")
        }
        b && b.appendChild(f);
        f.style.display = d;
        this.fireEvent("refresh", this)
    },
    embedCellWidths: function(b) {
        var e = (Ext.isIE7 || (Ext.isSafari && !Ext.supports.Touch)) ? 1 : 0;
        for (var c = 0; c < b.length; c++) {
            var a = b[c];
            var d = this.model.getDistanceBetweenDates(a.start, a.end);
            if (d) {
                a.width = d - (c ? e : 0)
            } else {
                a.width = 0;
                a.style = "display: none"
            }
        }
    },
    onElClick: function(a) {
        return function(e, f) {
            f = e.delegatedTarget || f;
            var b = Ext.fly(f).getAttribute("headerPosition"),
                c = Ext.fly(f).getAttribute("headerIndex"),
                d = this.model.getColumnConfig()[b][c];
            this.fireEvent("timeheader" + a, this, d.start, d.end, e)
        }
    },
    highlightCell: function(c, a) {
        var b = this;
        if (a !== b.highlightedCell) {
            b.clearHighlight();
            b.highlightedCell = a;
            Ext.fly(a).addCls(b.hoverCls)
        }
    },
    clearHighlight: function() {
        var b = this,
            a = b.highlightedCell;
        if (a) {
            Ext.fly(a).removeCls(b.hoverCls);
            delete b.highlightedCell
        }
    }
});
