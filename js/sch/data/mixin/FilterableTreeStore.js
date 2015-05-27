Ext.define("Sch.data.mixin.FilterableTreeStore", {
    requires: ["Sch.data.FilterableNodeStore"],
    nodeStoreClassName: "Sch.data.FilterableNodeStore",
    nodeStore: null,
    isFilteredFlag: false,
    lastTreeFilter: null,
    initTreeFiltering: function () {
        if (!this.nodeStore) {
            this.nodeStore = this.createNodeStore(this)
        }
        this.addEvents("filter-set", "filter-clear", "nodestore-datachange-start", "nodestore-datachange-end")
    },
    createNodeStore: function (a) {
        return Ext.create(this.nodeStoreClassName, {
            treeStore: a,
            recursive: true,
            rootVisible: this.rootVisible
        })
    },
    clearTreeFilter: function () {
        if (!this.isTreeFiltered()) {
            return
        }
        this.refreshNodeStoreContent();
        this.isFilteredFlag = false;
        this.lastTreeFilter = null;
        this.fireEvent("filter-clear", this)
    },
    refreshNodeStoreContent: function (f) {
        var a = this.getRootNode(),
            d = [];
        var c = this.rootVisible;
        var b = function (i) {
            if (i.isHidden && i.isHidden() || i.hidden || i.data.hidden) {
                return
            }
            if (c || i != a) {
                d[d.length] = i
            }
            if (!i.data.leaf && i.isExpanded()) {
                var j = i.childNodes,
                    h = j.length;
                for (var g = 0; g < h; g++) {
                    b(j[g])
                }
            }
        };
        b(a);
        this.fireEvent("nodestore-datachange-start", this);
        var e = this.nodeStore;
        if (!this.loadDataInNodeStore || !this.loadDataInNodeStore(d)) {
            e.loadRecords(d)
        }
        if (!f) {
            e.fireEvent("clear", e)
        }
        this.fireEvent("nodestore-datachange-end", this)
    },
    getIndexInTotalDataset: function (b) {
        var a = this.getRootNode(),
            d = -1;
        var e = this.rootVisible;
        if (!e && b == a) {
            return -1
        }
        var c = function (h) {
            if (h.isHidden && h.isHidden() || h.hidden || h.data.hidden) {
                if (h == b) {
                    return false
                }
            }
            if (e || h != a) {
                d++
            }
            if (h == b) {
                return false
            }
            if (!h.data.leaf && h.isExpanded()) {
                var i = h.childNodes,
                    g = i.length;
                for (var f = 0; f < g; f++) {
                    if (c(i[f]) === false) {
                        return false
                    }
                }
            }
        };
        c(a);
        return d
    },
    isTreeFiltered: function () {
        return this.isFilteredFlag
    },
    filterTreeBy: function (s, b) {
        var g;
        if (arguments.length == 1 && Ext.isObject(arguments[0])) {
            b = s.scope;
            g = s.filter
        } else {
            g = s;
            s = {
                filter: g
            }
        }
        this.fireEvent("nodestore-datachange-start", this);
        s = s || {};
        var j = s.shallow;
        var r = s.checkParents || j;
        var h = s.fullMathchingParents;
        var c = s.onlyParents || h;
        var e = this.rootVisible;
        if (c && r) {
            throw new Error("Can't combine `onlyParents` and `checkParents` options")
        }
        var o = {};
        var m = this.getRootNode(),
            d = [];
        var a = function (t) {
            var i = t.parentNode;
            while (i && !o[i.internalId]) {
                o[i.internalId] = true;
                i = i.parentNode
            }
        };
        var k = function (v) {
            if (v.isHidden && v.isHidden() || v.hidden || v.data.hidden) {
                return
            }
            var t, w, u, i;
            if (v.data.leaf) {
                if (g.call(b, v, o)) {
                    d[d.length] = v;
                    a(v)
                }
            } else {
                if (e || v != m) {
                    d[d.length] = v
                }
                if (c) {
                    t = g.call(b, v);
                    w = v.childNodes;
                    u = w.length;
                    if (t) {
                        o[v.internalId] = true;
                        a(v);
                        if (h) {
                            v.cascadeBy(function (x) {
                                if (x != v) {
                                    d[d.length] = x;
                                    if (!x.data.leaf) {
                                        o[x.internalId] = true
                                    }
                                }
                            });
                            return
                        }
                    }
                    for (i = 0; i < u; i++) {
                        if (t && w[i].data.leaf) {
                            d[d.length] = w[i]
                        } else {
                            if (!w[i].data.leaf) {
                                k(w[i])
                            }
                        }
                    }
                } else {
                    if (r) {
                        t = g.call(b, v, o);
                        if (t) {
                            o[v.internalId] = true;
                            a(v)
                        }
                    }
                    if (!r || !j || j && (t || v == m && !e)) {
                        w = v.childNodes;
                        u = w.length;
                        for (i = 0; i < u; i++) {
                            k(w[i])
                        }
                    }
                }
            }
        };
        k(m);
        var f = [];
        for (var p = 0, q = d.length; p < q; p++) {
            var l = d[p];
            if (l.data.leaf || o[l.internalId]) {
                f[f.length] = l
            }
        }
        var n = this.nodeStore;
        if (!this.loadDataInNodeStore || !this.loadDataInNodeStore(f)) {
            n.loadRecords(f, false);
            n.fireEvent("clear", n)
        }
        this.isFilteredFlag = true;
        this.lastTreeFilter = s;
        this.fireEvent("nodestore-datachange-end", this);
        this.fireEvent("filter-set", this)
    },
    hideNodesBy: function (b, a) {
        if (this.isFiltered()) {
            throw new Error("Can't hide nodes of the filtered tree store")
        }
        var c = this;
        a = a || this;
        this.getRootNode().cascadeBy(function (d) {
            d.hidden = b.call(a, d, c)
        });
        this.refreshNodeStoreContent()
    },
    showAllNodes: function () {
        this.getRootNode().cascadeBy(function (a) {
            a.hidden = a.data.hidden = false
        });
        this.refreshNodeStoreContent()
    },
    inheritables: function () {
        return {
            load: function () {
                var a = this.getRootNode();
                if (a) {
                    var b = this.nodeStore;
                    var c = a.removeAll;
                    a.removeAll = function () {
                        c.apply(this, arguments);
                        b && b.fireEvent("clear", b);
                        delete a.removeAll
                    }
                }
                this.callParent(arguments);
                if (a) {
                    delete a.removeAll
                }
            }
        }
    }
});
