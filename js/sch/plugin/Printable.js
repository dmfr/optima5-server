Ext.define("Sch.plugin.Printable", {
    extend: "Ext.AbstractPlugin",
    alias: "plugin.scheduler_printable",
    requires: ["Ext.XTemplate"],
    lockableScope: "top",
    docType: "<!DOCTYPE HTML>",
    beforePrint: Ext.emptyFn,
    afterPrint: Ext.emptyFn,
    autoPrintAndClose: true,
    fakeBackgroundColor: true,
    scheduler: null,
    constructor: function (a) {
        Ext.apply(this, a)
    },
    init: function (a) {
        this.scheduler = a;
        a.print = Ext.Function.bind(this.print, this)
    },
    mainTpl: new Ext.XTemplate('{docType}<html class="' + Ext.baseCSSPrefix + 'border-box {htmlClasses}"><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /><title>{title}</title>{styles}</head><body class="sch-print-body {bodyClasses}"><div class="sch-print-ct {componentClasses}" style="width:{totalWidth}px"><div class="sch-print-headerbg" style="border-left-width:{totalWidth}px;height:{headerHeight}px;"></div><div class="sch-print-header-wrap">{[this.printLockedHeader(values)]}{[this.printNormalHeader(values)]}</div>{[this.printLockedGrid(values)]}{[this.printNormalGrid(values)]}</div><script type="text/javascript">{setupScript}<\/script></body></html>', {
        printLockedHeader: function (a) {
            var b = "";
            if (a.lockedGrid) {
                b += '<div style="left:-' + a.lockedScroll + "px;margin-right:-" + a.lockedScroll + "px;width:" + (a.lockedWidth + a.lockedScroll) + 'px"';
                b += 'class="sch-print-lockedheader ' + a.lockedGrid.headerCt.el.dom.className + '">';
                b += a.lockedHeader;
                b += "</div>"
            }
            return b
        },
        printNormalHeader: function (a) {
            var b = "";
            if (a.normalGrid) {
                b += '<div style="left:' + (a.lockedGrid ? a.lockedWidth : "0") + "px;width:" + a.normalWidth + 'px;" class="sch-print-normalheader ' + a.normalGrid.headerCt.el.dom.className + '">';
                b += '<div style="margin-left:-' + a.normalScroll + 'px">' + a.normalHeader + "</div>";
                b += "</div>"
            }
            return b
        },
        printLockedGrid: function (a) {
            var b = "";
            if (a.lockedGrid) {
                b += '<div id="lockedRowsCt" style="left:-' + a.lockedScroll + "px;margin-right:-" + a.lockedScroll + "px;width:" + (a.lockedWidth + a.lockedScroll) + "px;top:" + a.headerHeight + 'px;" class="sch-print-locked-rows-ct ' + a.innerLockedClasses + " " + Ext.baseCSSPrefix + 'grid-inner-locked">';
                b += a.lockedRows;
                b += "</div>"
            }
            return b
        },
        printNormalGrid: function (a) {
            var b = "";
            if (a.normalGrid) {
                b += '<div id="normalRowsCt" style="left:' + (a.lockedGrid ? a.lockedWidth : "0") + "px;top:" + a.headerHeight + "px;width:" + a.normalWidth + 'px" class="sch-print-normal-rows-ct ' + a.innerNormalClasses + '">';
                b += '<div style="position:relative;overflow:visible;margin-left:-' + a.normalScroll + 'px">' + a.normalRows + "</div>";
                b += "</div>"
            }
            return b
        }
    }),
    getGridContent: function (n) {
        var m = n.normalGrid,
            e = n.lockedGrid,
            o = e.getView(),
            g = m.getView(),
            j, d, l, i, k, b, h;
        this.beforePrint(n);
        if (e.collapsed && !m.collapsed) {
            b = e.getWidth() + m.getWidth()
        } else {
            b = m.getWidth();
            h = e.getWidth()
        }
        var c = o.store.getRange();
        d = o.tpl.apply(o.collectData(c, 0));
        l = g.tpl.apply(g.collectData(c, 0));
        i = o.el.getScroll().left;
        k = g.el.getScroll().left;
        var a = document.createElement("div");
        a.innerHTML = d;
        a.firstChild.style.width = o.el.dom.style.width;
        if (Ext.versions.extjs.isLessThan("4.2.1")) {
            e.headerCt.items.each(function (q, p) {
                if (q.isHidden()) {
                    Ext.fly(a).down("colgroup:nth-child(" + (p + 1) + ") col").setWidth(0)
                }
            })
        }
        d = a.innerHTML;
        if (Sch.feature && Sch.feature.AbstractTimeSpan) {
            var f = (n.plugins || []).concat(n.normalGrid.plugins || []).concat(n.columnLinesFeature || []);
            Ext.each(f, function (p) {
                if (p instanceof Sch.feature.AbstractTimeSpan && p.generateMarkup) {
                    l = p.generateMarkup(true) + l
                }
            })
        }
        this.afterPrint(n);
        return {
            normalHeader: m.headerCt.el.dom.innerHTML,
            lockedHeader: e.headerCt.el.dom.innerHTML,
            lockedGrid: e.collapsed ? false : e,
            normalGrid: m.collapsed ? false : m,
            lockedRows: d,
            normalRows: l,
            lockedScroll: i,
            normalScroll: k,
            lockedWidth: h - (Ext.isWebKit ? 1 : 0),
            normalWidth: b,
            headerHeight: m.headerCt.getHeight(),
            innerLockedClasses: e.view.el.dom.className,
            innerNormalClasses: m.view.el.dom.className + (this.fakeBackgroundColor ? " sch-print-fake-background" : ""),
            width: n.getWidth()
        }
    },
    getStylesheets: function () {
        return Ext.getDoc().select('link[rel="stylesheet"]')
    },
    print: function () {
        var g = this.scheduler;
        if (!(this.mainTpl instanceof Ext.Template)) {
            var a = 22;
            this.mainTpl = new Ext.XTemplate(this.mainTpl, {
                compiled: true,
                disableFormats: true
            })
        }
        var h = g.getView(),
            i = this.getStylesheets(),
            e = Ext.get(Ext.core.DomHelper.createDom({
                tag: "div"
            })),
            b;
        i.each(function (j) {
            e.appendChild(j.dom.cloneNode(true))
        });
        b = e.dom.innerHTML + "";
        var f = this.getGridContent(g),
            c = this.mainTpl.apply(Ext.apply({
                waitText: this.waitText,
                docType: this.docType,
                htmlClasses: Ext.getBody().parent().dom.className,
                bodyClasses: Ext.getBody().dom.className,
                componentClasses: g.el.dom.className,
                title: (g.title || ""),
                styles: b,
                totalWidth: g.getWidth(),
                setupScript: ("window.onload = function(){ (" + this.setupScript.toString() + ")(" + g.syncRowHeight + ", " + this.autoPrintAndClose + ", " + Ext.isChrome + ", " + Ext.isIE + "); };")
            }, f));
        var d = window.open("", "printgrid");
        if (!d || !d.document) {
            return false
        }
        this.printWindow = d;
        d.document.write(c);
        d.document.close()
    },
    setupScript: function (e, a, d, b) {
        var c = function () {
            if (e) {
                var f = document.getElementById("lockedRowsCt"),
                    o = document.getElementById("normalRowsCt"),
                    g = f && f.getElementsByTagName("tr"),
                    m = o && o.getElementsByTagName("tr"),
                    k = m && g ? m.length : 0;
                for (var j = 0; j < k; j++) {
                    var h = m[j].clientHeight;
                    var l = g[j].clientHeight;
                    var n = Math.max(h, l) + "px";
                    g[j].style.height = m[j].style.height = n
                }
            }
            document._loaded = true;
            if (a) {
                window.print();
                if (!d) {
                    window.close()
                }
            }
        };
        if (b) {
            setTimeout(c, 0)
        } else {
            c()
        }
    }
});
