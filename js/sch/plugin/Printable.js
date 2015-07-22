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
    mainTpl: null,
    constructor: function(a) {
        Ext.apply(this, a);
        if (!this.mainTpl) {
            this.mainTpl = new Ext.XTemplate('{docType}<html class="' + Ext.baseCSSPrefix + 'border-box {htmlClasses}"><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /><title>{title}</title>{styles}</head><body class="sch-print-body {bodyClasses}"><div class="sch-print-ct {componentClasses}" style="width:{totalWidth}px"><div class="sch-print-headerbg" style="border-left-width:{totalWidth}px;height:{headerHeight}px;"></div><div class="sch-print-header-wrap">{[this.printLockedHeader(values)]}{[this.printNormalHeader(values)]}</div>{[this.printLockedGrid(values)]}{[this.printNormalGrid(values)]}</div><script type="text/javascript">{setupScript}<\/script></body></html>', {
                printLockedHeader: function(b) {
                    var c = "";
                    if (b.lockedGrid) {
                        c += '<div style="left:-' + b.lockedScroll + "px;margin-right:-" + b.lockedScroll + "px;width:" + (b.lockedWidth + b.lockedScroll) + 'px"';
                        c += 'class="sch-print-lockedheader ' + b.lockedGrid.headerCt.el.dom.className + '">';
                        c += b.lockedHeader;
                        c += "</div>"
                    }
                    return c
                },
                printNormalHeader: function(b) {
                    var c = "";
                    if (b.normalGrid) {
                        c += '<div style="left:' + (b.lockedGrid ? b.lockedWidth : "0") + "px;width:" + b.normalWidth + 'px;" class="sch-print-normalheader ' + b.normalGrid.headerCt.el.dom.className + '">';
                        c += '<div style="margin-left:-' + b.normalScroll + 'px">' + b.normalHeader + "</div>";
                        c += "</div>"
                    }
                    return c
                },
                printLockedGrid: function(b) {
                    var c = "";
                    if (b.lockedGrid) {
                        c += '<div id="lockedRowsCt" style="left:-' + b.lockedScroll + "px;margin-right:-" + b.lockedScroll + "px;width:" + (b.lockedWidth + b.lockedScroll) + "px;top:" + b.headerHeight + 'px;" class="sch-print-locked-rows-ct ' + b.innerLockedClasses + " " + Ext.baseCSSPrefix + 'grid-inner-locked">';
                        c += b.lockedRows;
                        c += "</div>"
                    }
                    return c
                },
                printNormalGrid: function(b) {
                    var c = "";
                    if (b.normalGrid) {
                        c += '<div id="normalRowsCt" style="left:' + (b.lockedGrid ? b.lockedWidth : "0") + "px;top:" + b.headerHeight + "px;width:" + b.normalWidth + 'px" class="sch-print-normal-rows-ct ' + b.innerNormalClasses + '">';
                        c += '<div style="position:relative;overflow:visible;margin-left:-' + b.normalScroll + 'px">' + b.normalRows + "</div>";
                        c += "</div>"
                    }
                    return c
                }
            })
        }
    },
    init: function(a) {
        this.scheduler = a;
        a.print = Ext.Function.bind(this.print, this)
    },
    getGridContent: function(n) {
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
        d = a.innerHTML;
        if (Sch.feature && Sch.feature.AbstractTimeSpan) {
            var f = (n.plugins || []).concat(n.normalGrid.plugins || []).concat(n.columnLinesFeature || []);
            Ext.each(f, function(p) {
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
    getStylesheets: function() {
        return Ext.getDoc().select('link[rel="stylesheet"]')
    },
    print: function() {
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
        i.each(function(j) {
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
    setupScript: function(e, a, d, b) {
        var c = function() {
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
