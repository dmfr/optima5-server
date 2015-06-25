Ext.define("Sch.plugin.exporter.MultiPage", {
    extend: "Sch.plugin.exporter.AbstractExporter",
    config: {
        exporterId: "multipage"
    },
    rowPageIndex: 0,
    columnPageIndex: 0,
    pagesPerColumn: 0,
    extractPages: function() {
        this.enableGarbageCollector = Ext.enableGarbageCollector;
        Ext.enableGarbageCollector = false;
        Ext.dom.GarbageCollector.pause();
        return this.callParent(arguments)
    },
    onRowsCollected: function(b, a) {
        var c = this;
        c.rowPageIndex = 0;
        c.columnPageIndex = 0;
        c.pagesPerColumn = 0;
        c.buildPageFrames(function() {
            c.buildPages(function() {
                c.onPagesExtracted.apply(c, arguments);
                Ext.enableGarbageCollector = c.enableGarbageCollector;
                Ext.dom.GarbageCollector.resume()
            }, c, b, a)
        })
    },
    buildPages: function(f, c, b, a) {
        var d = this,
            e = d.pageFrames[0];
        d.startPage(e, true);
        this.iterateAsync(d.rowIteratorStep, d, {
            rowIndex: 0,
            pageFrame: e,
            rowsHeight: 0,
            leftHeight: this.printHeight,
            lockeds: [],
            normals: [],
            lockedRows: b,
            normalRows: a,
            callback: f,
            scope: c || d
        })
    },
    rowIteratorStep: function(g, a) {
        var j = this,
            k = a.rowIndex,
            b = a.lockedRows,
            h = a.normalRows,
            i = a.leftHeight,
            d = a.lockeds,
            l = a.normals,
            c = true;
        if (k < b.length) {
            var f = b[k],
                e = h[k];
            if (f.height <= i) {
                d.push(f);
                l.push(e);
                a.leftHeight -= f.height;
                a.rowsHeight += f.height;
                c = false
            } else {
                j.fillGrids(d, l, a.pageFrame);
                j.commitPage({
                    rowsHeight: a.rowsHeight
                });
                j.startPage(a.pageFrame);
                a.lockeds = [f];
                a.normals = [e];
                a.leftHeight = j.printHeight - f.height;
                a.rowsHeight = f.height
            }
            a.rowIndex++
        } else {
            if (j.columnPageIndex < j.pageFrames.length) {
                j.fillGrids(d, l, a.pageFrame);
                j.commitPage({
                    rowsHeight: a.rowsHeight
                });
                a.pageFrame = j.pageFrames[j.columnPageIndex];
                j.startPage(a.pageFrame, true);
                a.leftHeight = j.printHeight;
                a.rowsHeight = 0;
                a.lockeds = [];
                a.normals = [];
                a.rowIndex = 0
            } else {
                j.fillGrids(d, l, a.pageFrame);
                j.commitPage({
                    rowsHeight: a.rowsHeight
                });
                a.callback.call(a.scope);
                return
            }
        }
        if (c) {
            g(a)
        } else {
            j.rowIteratorStep(g, a)
        }
    },
    fillGrids: function(e, d, f) {
        var c = this,
            b = c.lockedColumnPages[c.columnPageIndex - 1],
            a = !b || (b && b.leftWidth);
        if (b) {
            c.fillLockedGrid(e, true);
            c.removeHiddenLockedColumns(b)
        }
        if (a) {
            c.fillNormalGrid(d, true);
            c.removeInvisibleEvents(-f.normalGridOffset, -f.normalGridOffset + f.normalGridWidth)
        }
    },
    buildPageFrame: function(h, b) {
        var f = this,
            j = f.lockedColumnPages[h];
        if (j) {
            f.lockedGrid.setWidth(f.showLockedColumns(j.start, j.end) + (j.startOffset || 0));
            if (j.leftWidth) {
                f.normalGrid.show()
            } else {
                f.normalGrid.hide()
            }
        } else {
            f.lockedGrid.setWidth(0);
            f.lockedGrid.hide();
            f.normalGrid.show()
        }
        var a = f.cloneElement(f.getComponent().body);
        a.normalGridOffset = b;
        a.lockedGridOffset = j && j.startOffset || 0;
        a.normalGridWidth = f.normalGrid.getWidth();
        a.lockedGridWidth = f.lockedGrid.getWidth();
        a.select(f.lockedBodySelector).first().dom.style.position = "";
        a.select("#" + f.lockedView.id).first().dom.style.overflow = "visible";
        if (!f.normalGrid.hidden) {
            var i = a.select(f.normalBodySelector).first();
            i.dom.style.position = "";
            i.dom.style.top = "0px";
            var d = f.getNormalGridBody(a);
            var c = a.select("#" + f.normalView.headerCt.id).first();
            var e = a.select(".sch-secondary-canvas").first();
            var g = a.select("#" + f.normalView.id).first();
            d.dom.style.left = b + "px";
            c.dom.style.left = b + "px";
            c.dom.style.overflow = "visible";
            e.dom.style.left = b + "px";
            g.dom.style.overflow = "visible"
        }
        return a
    },
    buildPageFrames: function(e, c) {
        var d = this;
        c = c || d;
        d.lockedColumnPages = d.calculateLockedColumnPages();
        var a = Math.ceil(d.getTotalWidth() / d.paperWidth),
            b = d.pageFrames = [];
        d.iterateAsync(function(h, g, i) {
            if (g >= a) {
                e.call(c, b);
                return
            }
            b.push(d.buildPageFrame(g, i));
            var f = d.lockedColumnPages[g];
            if (f) {
                i -= f.leftWidth || 0
            } else {
                i -= d.paperWidth
            }
            h(g + 1, i)
        }, d, 0, 0)
    },
    startPage: function(c, a) {
        var b = this;
        if (a) {
            if (b.columnPageIndex == 1) {
                b.pagesPerColumn = b.extractedPages.length
            }
            b.rowPageIndex = 0;
            b.columnPageIndex++
        }
        b.rowPageIndex++;
        b.callParent(arguments);
        b.emptyNormalGrid();
        b.emptyLockedGrid()
    },
    commitPage: function(a) {
        var b = this;
        b.callParent([Ext.apply({
            row: b.rowPageIndex,
            column: b.columnPageIndex
        }, a)])
    },
    getExpectedPagesPerColumn: function() {
        return this.pagesPerColumn || Math.ceil((this.lockedRowsHeight || this.component.store.count() * this.component.getRowHeight()) / this.printHeight)
    },
    getExpectedColumnsNumber: function() {
        return this.pageFrames ? this.pageFrames.length : Math.ceil((this.lockedGrid.getWidth() + this.ticks.length * this.view.timeAxisViewModel.getTickWidth()) / this.paperWidth)
    },
    getExpectedNumberOfPages: function() {
        return this.getExpectedColumnsNumber() * this.getExpectedPagesPerColumn()
    },
    calculateLockedColumnPages: function() {
        var h = this,
            j = [],
            c = h.lockedColumns,
            e = h.paperWidth,
            g;
        for (var f = 0, d = c.length; f < d; f++) {
            var b = c[f],
                a = b.width;
            g = g || {
                start: f,
                end: f
            };
            e -= a;
            if (e < 0) {
                j.push(g);
                if (e) {
                    g = {
                        start: f,
                        end: f
                    }
                }
                e = h.paperWidth - a + e
            } else {
                g.end = f
            }
        }
        if (g) {
            g.leftWidth = e;
            j.push(g)
        }
        return j
    },
    getPageTplData: function(a) {
        return Ext.apply(this.callParent(arguments), {
            title: a.number + " of " + this.numberOfPages + " (column: " + a.column + ", row: " + a.row + ")"
        })
    },
    showLockedColumns: function(e, g) {
        var f = this,
            b = f.lockedColumns,
            d = 0;
        e = e || 0;
        g = g || b.length - 1;
        for (var a = 0; a < b.length; a++) {
            var c = b[a];
            if (a >= e && a <= g) {
                c.column.show();
                d += c.width
            } else {
                c.column.hide()
            }
        }
        return d
    },
    removeInvisibleEvents: function(b, h) {
        var j = this,
            d = j.getNormalGridBody(),
            e = j.normalView.eventCls;
        var a = d.select("." + e).elements;
        for (var g = 0; g < a.length; g++) {
            var c = parseInt(a[g].style.left, 10),
                f = c + parseInt(a[g].style.width, 10);
            if (f < b || c > h) {
                j.removeNode(a[g])
            }
        }
    },
    removeHiddenLockedColumns: function(b) {
        var j = this,
            h = j.getCurrentPage(),
            a = j.getLockedGridBody();
        for (var f = 0; f < j.lockedColumns.length; f++) {
            var c = j.lockedColumns[f].column;
            if (f < b.start || f > b.end) {
                var d = "#" + c.getId();
                var g = h.select(d);
                j.removeNode(g);
                var e = c.getCellSelector();
                var k = a.select(e);
                j.removeNode(k)
            }
        }
    },
    fitComponentIntoPage: function() {
        var a = this;
        a.getComponent().setWidth(a.paperWidth)
    },
    restoreComponentState: function() {
        this.callParent(arguments);
        this.showLockedColumns()
    },
    setComponent: function() {
        var b = this,
            a = b.lockedColumns = [];
        b.callParent(arguments);
        b.lockedGrid.headerCt.items.each(function(c) {
            if (!c.hidden) {
                a.push({
                    column: c,
                    width: c.getWidth()
                })
            }
        })
    }
});
