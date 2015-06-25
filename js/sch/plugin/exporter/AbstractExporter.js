Ext.define("Sch.plugin.exporter.AbstractExporter", {
    extend: "Ext.util.Observable",
    requires: ["Ext.dom.Element", "Ext.core.DomHelper"],
    mixins: ["Sch.mixin.Localizable"],
    pageHeaderHeight: 41,
    pageFooterHeight: 0,
    bufferedHeightMargin: 25,
    paperWidth: 0,
    paperHeight: 0,
    printHeight: 0,
    lockedRowsHeight: 0,
    normalRowsHeight: 0,
    iterateTimeout: 10,
    tableSelector: undefined,
    currentPage: undefined,
    headerTplDataFn: null,
    footerTplDataFn: null,
    headerTplDataFnScope: null,
    footerTplDataFnScope: null,
    config: {
        exporterId: "abstractexporter",
        name: "",
        translateURLsToAbsolute: true,
        expandAllBeforeExport: false,
        headerTpl: '<div class="sch-export-header" style="height:{height}px; width:{width}px"><h2>{pageNo}/{totalPages}</h2></div>',
        tpl: '<!DOCTYPE html><html class="' + Ext.baseCSSPrefix + 'border-box {htmlClasses}"><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /><title>{title}</title>{styles}</head><body class="' + Ext.baseCSSPrefix + 'webkit sch-export {bodyClasses}">{header}<div class="{componentClasses}" style="height:{bodyHeight}px; width:{totalWidth}px; position: relative !important">{HTML}</div>{footer}</body></html>',
        footerTpl: ""
    },
    callbacks: undefined,
    error: undefined,
    extractedPages: undefined,
    numberOfPages: 0,
    constructor: function(a) {
        var b = this;
        a = a || {};
        b.callParent(arguments);
        delete a.getUserHeaderTplData;
        delete a.getUserFooterTplData;
        b.initConfig(a);
        if (!a.tableSelector) {
            b.tableSelector = "." + Ext.baseCSSPrefix + "grid-item-container"
        }
        if (!a.name) {
            b.setName(b.L("name"))
        }
    },
    setHeaderTpl: function(a) {
        this.headerTpl = this.getTplInstance(a)
    },
    getHeaderTpl: function() {
        return this.headerTpl
    },
    setTpl: function(a) {
        this.tpl = this.getTplInstance(a)
    },
    getTpl: function() {
        return this.tpl
    },
    setFooterTpl: function(a) {
        this.footerTpl = this.getTplInstance(a)
    },
    getFooterTpl: function() {
        return this.footerTpl
    },
    getTplInstance: function(a) {
        return (a && !a.isTemplate) ? new Ext.XTemplate(a, {
            disableFormats: true
        }) : a
    },
    getBodyClasses: function() {
        var b = new RegExp(Ext.baseCSSPrefix + "ie\\d?|" + Ext.baseCSSPrefix + "gecko", "g"),
            a = Ext.getBody().dom.className.replace(b, "");
        if (Ext.isIE) {
            a += " sch-ie-export"
        }
        return a
    },
    getComponentClasses: function() {
        return this.getComponent().el.dom.className
    },
    setComponent: function(a) {
        var b = this;
        b.component = a;
        b.view = a.getSchedulingView();
        b.normalGrid = a.normalGrid;
        b.lockedGrid = a.lockedGrid;
        b.normalView = a.normalGrid.view;
        b.lockedView = a.lockedGrid.view;
        b.lockedBodySelector = "#" + b.lockedView.getId();
        b.normalBodySelector = "#" + b.normalView.getId();
        b.lockedHeader = b.lockedGrid.headerCt;
        b.normalHeader = b.normalGrid.headerCt;
        b.headerHeight = b.normalHeader.getHeight();
        b.printHeight = Math.floor(b.paperHeight) - b.headerHeight - (b.exportConfig.showHeader ? b.pageHeaderHeight : 0) - (b.exportConfig.showFooter ? b.pageFooterHeight : 0);
        b.saveComponentState(a)
    },
    getComponent: function() {
        return this.component
    },
    setPaperSize: function(a, b) {
        var c = this;
        if (b === "landscape") {
            c.paperWidth = a.height;
            c.paperHeight = a.width
        } else {
            c.paperWidth = a.width;
            c.paperHeight = a.height
        }
    },
    getPaperFormat: function() {
        return this.exportConfig.format
    },
    isBuffered: function() {
        return !!this.getBufferedRenderer()
    },
    getBufferedRenderer: function() {
        return this.view.bufferedRenderer
    },
    setComponentRange: function(d) {
        var f = this,
            c = f.getComponent(),
            b = f.view,
            a, e;
        if (d.range !== "complete") {
            switch (d.range) {
                case "date":
                    a = new Date(d.dateFrom);
                    e = new Date(d.dateTo);
                    if (Sch.util.Date.getDurationInDays(a, e) < 1) {
                        e = Sch.util.Date.add(e, Sch.util.Date.DAY, 1)
                    }
                    a = Sch.util.Date.constrain(a, c.getStart(), c.getEnd());
                    e = Sch.util.Date.constrain(e, c.getStart(), c.getEnd());
                    break;
                case "current":
                    var g = b.getVisibleDateRange();
                    a = g.startDate;
                    e = g.endDate || b.timeAxis.getEnd();
                    if (d.cellSize) {
                        var h = d.cellSize;
                        f.timeColumnWidth = h[0];
                        if (f.timeColumnWidth) {
                            c.setTimeColumnWidth(f.timeColumnWidth)
                        }
                        if (h.length > 1) {
                            f.view.setRowHeight(h[1])
                        }
                    }
                    break
            }
            c.setTimeSpan(a, e)
        }
        f.ticks = c.timeAxis.getTicks()
    },
    getStylesheets: function() {
        var d = this.translateURLsToAbsolute,
            c = Ext.getDoc().select('link[rel="stylesheet"]'),
            a = Ext.get(Ext.core.DomHelper.createDom({
                tag: "div"
            })),
            b;
        c.each(function(e) {
            var f = e.dom.cloneNode(true);
            d && f.setAttribute("href", e.dom.href);
            a.appendChild(f)
        });
        b = a.dom.innerHTML + "";
        return b
    },
    forEachTimeSpanPlugin: function(c, f, e) {
        if (Sch.feature && Sch.feature.AbstractTimeSpan) {
            var h = this;
            var b = (c.plugins || []).concat(c.normalGrid.plugins || []).concat(c.columnLinesFeature || []);
            for (var d = 0, a = b.length; d < a; d++) {
                var g = b[d];
                if (g instanceof Sch.feature.AbstractTimeSpan) {
                    f.call(e || h, g)
                }
            }
        }
    },
    prepareComponent: function(b, a) {
        var c = this;
        b = b || c.getComponent();
        c.suspendInfiniteScroll(b);
        c.forEachTimeSpanPlugin(b, function(d) {
            d._renderDelay = d.renderDelay;
            d.renderDelay = 0
        });
        b.getSchedulingView().timeAxisViewModel.suppressFit = true;
        b.timeAxis.autoAdjust = false;
        b.normalGrid.expand();
        b.lockedGrid.expand();
        c.setComponentRange(a);
        if (c.expandAllBeforeExport && b.expandAll) {
            b.expandAll()
        }
        c.fitComponentIntoPage();
        if (c.isBuffered() && Ext.isIE8) {
            c.normalView.bufferedRenderer.variableRowHeight = false;
            c.lockedView.bufferedRenderer.variableRowHeight = false
        }
    },
    restoreComponent: function(a) {
        var b = this;
        a = a || b.getComponent();
        b.forEachTimeSpanPlugin(a, function(c) {
            c.renderDelay = c._renderDelay;
            delete c._renderDelay
        });
        b.restoreComponentState(a);
        b.restoreInfiniteScroll(a);
        b.exportConfig.afterExport && b.exportConfig.afterExport(a)
    },
    saveComponentState: function(b) {
        b = b || this.getComponent();
        var c = this,
            a = b.getSchedulingView(),
            d = b.normalGrid,
            e = b.lockedGrid;
        c.restoreSettings = {
            width: b.getWidth(),
            height: b.getHeight(),
            rowHeight: a.timeAxisViewModel.getViewRowHeight(),
            columnWidth: a.timeAxisViewModel.getTickWidth(),
            startDate: b.getStart(),
            endDate: b.getEnd(),
            normalWidth: d.getWidth(),
            normalLeft: d.getEl().getStyle("left"),
            lockedWidth: e.getWidth(),
            lockedCollapse: e.collapsed,
            normalCollapse: d.collapsed,
            autoAdjust: b.timeAxis.autoAdjust,
            suppressFit: a.timeAxisViewModel.suppressFit,
            restoreColumnWidth: false,
            startIndex: a.all ? a.all.startIndex : 0
        }
    },
    restoreComponentState: function(c) {
        var d = this;
        c = c || d.getComponent();
        var b = d.restoreSettings,
            a = c.getSchedulingView();
        c.timeAxis.autoAdjust = b.autoAdjust;
        c.normalGrid.show();
        c.setWidth(b.width);
        c.setHeight(b.height);
        c.setTimeSpan(b.startDate, b.endDate);
        c.setTimeColumnWidth(b.columnWidth, true);
        a.setRowHeight(b.rowHeight);
        c.lockedGrid.show();
        c.normalGrid.setWidth(b.normalWidth);
        c.normalGrid.getEl().setStyle("left", b.normalLeft);
        c.lockedGrid.setWidth(b.lockedWidth);
        a.timeAxisViewModel.suppressFit = b.suppressFit;
        a.timeAxisViewModel.setTickWidth(b.columnWidth);
        if (b.lockedCollapse) {
            c.lockedGrid.collapse()
        }
        if (b.normalCollapse) {
            c.normalGrid.collapse()
        }
        if (d.getBufferedRenderer()) {
            d.scrollTo(b.startIndex);
            if (Ext.isIE8) {
                d.normalView.bufferedRenderer.variableRowHeight = true;
                d.lockedView.bufferedRenderer.variableRowHeight = true
            }
        }
    },
    extractPages: function(b, a, e, c) {
        var d = this;
        d.exportConfig = a;
        d.normalRows = [];
        d.lockedRows = [];
        d.extractedPages = [];
        d.numberOfPages = 0;
        d.lockedRowsHeight = 0;
        d.normalRowsHeight = 0;
        d.setPaperSize(a.pageSize, a.orientation);
        d.setComponent(b, a);
        d.prepareComponent(b, a);
        a.beforeExport && a.beforeExport(b, d.ticks);
        d.callbacks = {
            success: e || Ext.emptyFn,
            scope: c || d
        };
        setTimeout(function() {
            d.collectRows(d.onRowsCollected, d)
        }, 1)
    },
    onPagesExtracted: function(a) {
        var b = this;
        b.restoreComponent();
        b.submitPages(a)
    },
    submitPages: function(a) {
        var c = this,
            b = c.callbacks;
        b.success.call(b.scope, c.renderPages(a))
    },
    getCurrentPage: function() {
        return this.currentPage
    },
    setCurrentPage: function(a) {
        this.currentPage = a
    },
    getExpectedNumberOfPages: Ext.emptyFn,
    commitPage: function(a) {
        var b = this;
        b.numberOfPages++;
        var d = b.preparePageToCommit(a);
        var c = Ext.apply({
            html: d.dom.innerHTML,
            number: b.numberOfPages
        }, a);
        b.extractedPages.push(c);
        b.fireEvent("commitpage", b, c, b.numberOfPages, b.getExpectedNumberOfPages())
    },
    collectLockedRow: function(d, c) {
        var b = Ext.fly(d).getHeight();
        this.lockedRowsHeight += b;
        var a = {
            height: b,
            row: d.cloneNode(true),
            record: this.lockedView.getRecord(c)
        };
        this.lockedRows.push(a);
        return a
    },
    collectNormalRow: function(d, c) {
        var b = Ext.fly(d).getHeight();
        this.normalRowsHeight += b;
        var a = {
            height: Ext.fly(d).getHeight(),
            row: d.cloneNode(true),
            record: this.normalView.getRecord(c)
        };
        this.normalRows.push(a);
        return a
    },
    onRowsCollected: function() {
        throw "Sch.plugin.exporter.AbstractExporter: [onRowsCollected] Abstract method called."
    },
    iterateAsync: function(c, b) {
        var d = this;
        b = b || d;
        var a = function() {
            var f = arguments;
            var e = setInterval(function() {
                clearInterval(e);
                c.apply(b, [].concat.apply([a], f))
            }, d.iterateTimeout)
        };
        a.apply(d, Ext.Array.slice(arguments, 2))
    },
    callAsync: function(c, b) {
        b = b || this;
        var a = setInterval(function() {
            clearInterval(a);
            c.apply(b, Ext.Array.slice(arguments, 2))
        }, this.iterateTimeout)
    },
    collectRows: function(c, a) {
        var b = this;
        if (b.isBuffered()) {
            setTimeout(function() {
                b.scrollTo(0, function() {
                    b.iterateAsync(b.collectRowsStep, b, 0, c, a)
                })
            }, 1)
        } else {
            setTimeout(function() {
                b.collectRowsStep(null, 0, c, a)
            }, 1)
        }
    },
    collectRowsStep: function(d, h, j, k) {
        var g = this,
            c = g.normalView.all.endIndex,
            e = g.component.store.getCount(),
            f = g.normalView.all.slice(h),
            a = g.lockedView.all.slice(h);
        for (var b = 0; b < a.length; b++) {
            g.collectLockedRow(a[b], h + b)
        }
        for (b = 0; b < f.length; b++) {
            g.collectNormalRow(f[b], h + b)
        }
        g.fireEvent("collectrows", g, h, c, e);
        if (g.isBuffered()) {
            if (c + 1 < e) {
                g.callAsync(function() {
                    g.scrollTo(c + 1, function() {
                        d(c + 1, j, k)
                    })
                })
            } else {
                g.callAsync(function() {
                    g.scrollTo(0, function() {
                        j.call(k || g, g.lockedRows, g.normalRows)
                    })
                })
            }
        } else {
            j.call(k || g, g.lockedRows, g.normalRows)
        }
    },
    renderPages: function(a) {
        var d = this;
        a = a || d.extractedPages;
        for (var c = 0, b = a.length; c < b; c++) {
            var e = a[c];
            e.html = d.applyPageTpl(e)
        }
        return a
    },
    applyPageTpl: function(a) {
        var b = this;
        return b.getTpl().apply(b.getPageTplData(a))
    },
    applyHeaderTpl: function(b) {
        var c = this,
            e = c.getHeaderTpl();
        if (c.exportConfig.showHeader && e) {
            var a = c.headerTplDataFn;
            var d = a && a.call(c.headerTplDataFnScope || c, b);
            return e.apply(Ext.apply(c.getHeaderTplData(b), d))
        }
        return ""
    },
    applyFooterTpl: function(b) {
        var c = this,
            e = c.getFooterTpl();
        if (c.exportConfig.showFooter && e) {
            var a = c.footerTplDataFn;
            var d = a && a.call(c.footerTplDataFnScope || c, b);
            return e.apply(Ext.apply(c.getFooterTplData(b), d))
        }
        return ""
    },
    getHeaderTplData: function(a) {
        var b = this;
        return {
            width: b.paperWidth,
            height: b.pageHeaderHeight,
            totalPages: b.numberOfPages,
            pageNo: a.number
        }
    },
    getFooterTplData: function(a) {
        var b = this;
        return {
            width: b.paperWidth,
            height: b.pageFooterHeight,
            totalPages: b.numberOfPages,
            pageNo: a.number
        }
    },
    getPageTplData: function(a) {
        var b = this;
        return {
            bodyClasses: b.getBodyClasses(),
            bodyHeight: b.printHeight + b.headerHeight,
            componentClasses: b.getComponentClasses(),
            styles: b.getStylesheets(),
            showHeader: b.exportConfig.showHeader,
            showFooter: b.exportConfig.showFooter,
            header: b.applyHeaderTpl(a),
            HTML: a.html,
            footer: b.applyFooterTpl(a),
            totalWidth: b.paperWidth,
            title: a.number + " of " + b.numberOfPages
        }
    },
    fitComponentIntoPage: Ext.emptyFn,
    getLockedGridBody: function(a) {
        a = a || this.getCurrentPage();
        return a.select(this.lockedBodySelector + " > " + this.tableSelector).first()
    },
    getNormalGridBody: function(a) {
        a = a || this.getCurrentPage();
        return a.select(this.normalBodySelector + " > " + this.tableSelector).first()
    },
    emptyLockedGrid: function(a) {
        this.getLockedGridBody(a).select(this.lockedView.getItemSelector()).remove()
    },
    fillGrids: function(c, b, e, a) {
        var d = this;
        d.fillLockedGrid(c, e, a);
        d.fillNormalGrid(b, e, a)
    },
    fillLockedGrid: function(c, d, a) {
        var b = this;
        if (!a) {
            b.emptyLockedGrid()
        }
        b.appendRows(b.getLockedGridBody(), c || b.lockedRows, d)
    },
    fillNormalGrid: function(c, d, a) {
        var b = this;
        if (!a) {
            b.emptyNormalGrid()
        }
        b.appendRows(b.getNormalGridBody(), c || b.normalRows, d)
    },
    appendRows: function(d, c, f) {
        var e = d.dom;
        for (var b = 0, a = c.length; b < a; b++) {
            e.appendChild(f ? c[b].row.cloneNode(true) : c[b].row)
        }
    },
    emptyNormalGrid: function(a) {
        this.getNormalGridBody(a).select(this.normalView.getItemSelector()).remove()
    },
    getRowHeight: function() {
        return this.view.timeAxisViewModel.getViewRowHeight()
    },
    getTotalSize: function() {
        return {
            width: this.getTotalWidth(),
            height: this.getTotalHeight()
        }
    },
    getTotalHeight: function() {
        var b = this,
            a;
        if (b.isBuffered()) {
            a = b.bufferedHeightMargin + b.normalRowsHeight
        } else {
            a = b.lockedView.getEl().down(b.tableSelector).getHeight()
        }
        return b.headerHeight + a
    },
    getTotalWidth: function() {
        return this.getLockedGridWidth() + this.normalGrid.body.down(this.tableSelector).getWidth()
    },
    getLockedGridWidth: function() {
        return this.lockedHeader.getEl().first().getWidth()
    },
    getNormalGridWidth: function() {
        return this.normalHeader.getEl().first().getWidth()
    },
    preparePageToCommit: function() {
        var i = this.getCurrentPage(),
            g = this.component,
            c = g.lockedGrid,
            f = g.normalGrid;
        i.el.select(".sch-remove").remove();
        var b = function(l) {
                var k = i.select("#" + l).first();
                return k && k.dom
            },
            j = function(k) {
                if (k) {
                    k.style.width = "100%"
                }
            },
            e = function(k) {
                if (k) {
                    k.style.height = "100%"
                }
            };
        var a = i.select(this.normalBodySelector).first();
        a.dom.style.top = "0px";
        var h = i.select(this.lockedBodySelector).first();
        h.dom.style.top = "0px";
        var d = [b(g.id + "-targetEl"), b(g.id + "-innerCt"), b(c.id), b(c.body.id), b(c.view.el.id)];
        Ext.Array.forEach(d, e);
        j(d[0]);
        j(d[1]);
        j(b(f.headerCt.id));
        Ext.Array.forEach([b(f.id), b(f.body.id), b(f.getView().id)], function(k) {
            if (k) {
                k.style.height = k.style.width = "100%"
            }
        });
        return i
    },
    cloneElement: function(a) {
        return new Ext.dom.Element(Ext.core.DomHelper.createDom({
            tag: "div",
            html: a.dom.innerHTML
        }))
    },
    startPage: function(b) {
        var a = this;
        var c = a.cloneElement(b || a.getComponent().body);
        a.setCurrentPage(c)
    },
    scrollTo: function(a, d) {
        var c = this;
        if (c.component.ensureVisible) {
            var b = c.component.store.getAt(a);
            c.component.ensureVisible(b, {
                callback: function() {
                    if (d && this.isLocked === false) {
                        d.apply(c)
                    }
                },
                select: false,
                focus: false,
                animate: false
            })
        } else {
            c.lockedView.bufferedRenderer.scrollTo(a, false, function() {
                c.normalView.bufferedRenderer.scrollTo(a, false, d)
            })
        }
    },
    removeNode: function(b) {
        if (b && b.parentNode) {
            b.parentNode.removeChild(b)
        } else {
            if (b.elements) {
                for (var a = 0; a < b.elements.length; a++) {
                    var c = b.elements[a];
                    c.parentNode.removeChild(c)
                }
            }
        }
    },
    restoreInfiniteScroll: function(b) {
        var a = b.getSchedulingView();
        if (b.infiniteScroll && a.rendered) {
            b.timeAxis.setTimeSpan(this._oldStart, this._oldEnd);
            a.setScrollX(this._oldScrollX);
            a.bindInfiniteScrollListeners()
        }
    },
    suspendInfiniteScroll: function(b) {
        var a = b.getSchedulingView();
        if (b.infiniteScroll && a.rendered) {
            a.unbindInfiniteScrollListeners();
            this._oldStart = b.timeAxis.getStart();
            this._oldEnd = b.timeAxis.getEnd();
            this._oldScrollX = a.getScrollX();
            var c = b.getEventStore().getTotalTimeSpan();
            b.setTimeSpan(c.start, c.end)
        }
    }
});
