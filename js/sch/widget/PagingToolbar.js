Ext.define("Sch.widget.PagingToolbar", {
    extend: "Ext.toolbar.Paging",
    alias: "widget.sch_pagingtoolbar",
    getStoreId: function() {
        if (this.storeId) {
            return this.storeId
        }
        var a = this.store.storeId;
        if (!a) {
            var c = this.store.crudManager;
            var b = c && c.getStore(this.store);
            a = b && b.storeId
        }
        this.storeId = a;
        return a
    },
    loadPage: function(c) {
        var b = this;
        if (b.store.crudManager) {
            var a = b.getStoreId();
            if (a) {
                var d = {};
                d[a] = {
                    pageSize: b.store.pageSize,
                    page: c
                };
                b.store.crudManager.load(d)
            }
        } else {
            b.store.loadPage(c)
        }
    },
    onPagingKeyDown: function(h, g) {
        var d = this,
            b = g.getKey(),
            c = d.getPageData(),
            a = g.shiftKey ? 10 : 1,
            f;
        if (b == g.RETURN) {
            g.stopEvent();
            f = d.readPageFromInput(c);
            if (f !== false) {
                f = Math.min(Math.max(1, f), c.pageCount);
                if (d.fireEvent("beforechange", d, f) !== false) {
                    d.loadPage(f)
                }
            }
        } else {
            if (b == g.HOME || b == g.END) {
                g.stopEvent();
                f = b == g.HOME ? 1 : c.pageCount;
                h.setValue(f)
            } else {
                if (b == g.UP || b == g.PAGE_UP || b == g.DOWN || b == g.PAGE_DOWN) {
                    g.stopEvent();
                    f = d.readPageFromInput(c);
                    if (f) {
                        if (b == g.DOWN || b == g.PAGE_DOWN) {
                            a *= -1
                        }
                        f += a;
                        if (f >= 1 && f <= c.pageCount) {
                            h.setValue(f)
                        }
                    }
                }
            }
        }
    },
    moveFirst: function() {
        if (this.fireEvent("beforechange", this, 1) !== false) {
            this.loadPage(1)
        }
    },
    movePrevious: function() {
        var b = this,
            a = b.store.currentPage - 1;
        if (a > 0) {
            if (b.fireEvent("beforechange", b, a) !== false) {
                b.loadPage(a)
            }
        }
    },
    moveNext: function() {
        var c = this,
            b = c.getPageData().pageCount,
            a = c.store.currentPage + 1;
        if (a <= b) {
            if (c.fireEvent("beforechange", c, a) !== false) {
                c.loadPage(a)
            }
        }
    },
    moveLast: function() {
        var b = this,
            a = b.getPageData().pageCount;
        if (b.fireEvent("beforechange", b, a) !== false) {
            b.loadPage(a)
        }
    },
    doRefresh: function() {
        var a = this,
            b = a.store.currentPage;
        if (a.fireEvent("beforechange", a, b) !== false) {
            a.loadPage(b)
        }
    }
});

Ext.data.Connection.override({
    parseStatus: function(b) {
        var a = this.callOverridden(arguments);
        if (b === 0) {
            a.success = true
        }
        return a
    }
});
