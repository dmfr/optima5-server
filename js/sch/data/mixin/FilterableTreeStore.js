Ext.define("Sch.data.mixin.FilterableTreeStore", {
    isFilteredFlag: false,
    isHiddenFlag: false,
    lastTreeFilter: null,
    lastTreeHiding: null,
    allowExpandCollapseWhileFiltered: true,
    reApplyFilterOnDataChange: true,
    suspendIncrementalFilterRefresh: 0,
    filterGeneration: 0,
    currentFilterGeneration: null,
    dataChangeListeners: null,
    monitoringDataChange: false,
    onClassMixedIn: function(a) {
        a.override(Sch.data.mixin.FilterableTreeStore.prototype.inheritables() || {})
    },
    initTreeFiltering: function() {
        this.treeFilter = new Ext.util.Filter({
            filterFn: this.isNodeFilteredIn,
            scope: this
        });
        this.dataChangeListeners = {
            nodeappend: this.onNeedToUpdateFilter,
            nodeinsert: this.onNeedToUpdateFilter,
            scope: this
        }
    },
    startDataChangeMonitoring: function() {
        if (this.monitoringDataChange) {
            return
        }
        this.monitoringDataChange = true;
        this.on(this.dataChangeListeners)
    },
    stopDataChangeMonitoring: function() {
        if (!this.monitoringDataChange) {
            return
        }
        this.monitoringDataChange = false;
        this.un(this.dataChangeListeners)
    },
    onNeedToUpdateFilter: function() {
        if (this.reApplyFilterOnDataChange && !this.suspendIncrementalFilterRefresh) {
            this.reApplyFilter()
        }
    },
    clearTreeFilter: function() {
        if (!this.isTreeFiltered()) {
            return
        }
        this.currentFilterGeneration = null;
        this.isFilteredFlag = false;
        this.lastTreeFilter = null;
        if (!this.isTreeFiltered(true)) {
            this.stopDataChangeMonitoring()
        }
        this.refreshNodeStoreContent();
        this.fireEvent("filter-clear", this)
    },
    reApplyFilter: function() {
        if (this.isHiddenFlag) {
            this.hideNodesBy.apply(this, this.lastTreeHiding.concat(this.isFilteredFlag))
        }
        if (this.isFilteredFlag) {
            this.filterTreeBy(this.lastTreeFilter)
        }
    },
    refreshNodeStoreContent: function() {
        var b = this,
            a = b.getFilters();
        if (a.indexOf(b.treeFilter) < 0) {
            b.addFilter(b.treeFilter)
        } else {
            this.getFilters().fireEvent("endupdate", this.getFilters())
        }
    },
    getIndexInTotalDataset: function(d) {
        var c = this.getRootNode(),
            f = -1;
        var g = this.rootVisible;
        if (!g && d == c) {
            return -1
        }
        var b = this.isTreeFiltered();
        var a = this.currentFilterGeneration;
        var e = function(j) {
            if (b && j.__filterGen != a || j.hidden) {
                if (j == d) {
                    return false
                }
            }
            if (g || j != c) {
                f++
            }
            if (j == d) {
                return false
            }
            if (!j.data.leaf && j.isExpanded()) {
                var l = j.childNodes,
                    i = l.length;
                for (var h = 0; h < i; h++) {
                    if (e(l[h]) === false) {
                        return false
                    }
                }
            }
        };
        e(c);
        return f
    },
    isTreeFiltered: function(a) {
        return this.isFilteredFlag || a && this.isHiddenFlag
    },
    markFilteredNodes: function(i, b) {
        var h = this;
        var d = this.currentFilterGeneration;
        var c = {};
        var j = this.getRootNode(),
            l = this.rootVisible;
        var o = function(q) {
            var p = q.parentNode;
            while (p && !c[p.internalId]) {
                c[p.internalId] = true;
                p = p.parentNode
            }
        };
        var a = b.filter;
        var n = b.scope || this;
        var k = b.shallow;
        var m = b.checkParents || k;
        var f = b.fullMatchingParents;
        var e = b.onlyParents || f;
        if (e && m) {
            throw new Error("Can't combine `onlyParents` and `checkParents` options")
        }
        if (l) {
            c[j.internalId] = true
        }
        var g = function(s) {
            if (s.hidden) {
                return
            }
            var q, t, r, p;
            if (s.data.leaf) {
                if (a.call(n, s, c)) {
                    c[s.internalId] = true;
                    o(s)
                }
            } else {
                if (e) {
                    q = a.call(n, s);
                    t = s.childNodes;
                    r = t.length;
                    if (q) {
                        c[s.internalId] = true;
                        o(s);
                        if (f) {
                            s.cascadeBy(function(u) {
                                c[u.internalId] = true
                            });
                            return
                        }
                    }
                    for (p = 0; p < r; p++) {
                        if (q && t[p].data.leaf) {
                            c[t[p].internalId] = true
                        } else {
                            if (!t[p].data.leaf) {
                                g(t[p])
                            }
                        }
                    }
                } else {
                    if (m) {
                        q = a.call(n, s, c);
                        if (q) {
                            c[s.internalId] = true;
                            o(s)
                        }
                    }
                    if (!m || !k || k && (q || s == j && !l)) {
                        t = s.childNodes;
                        r = t.length;
                        for (p = 0; p < r; p++) {
                            g(t[p])
                        }
                    }
                }
            }
        };
        g(i);
        j.cascadeBy(function(p) {
            if (c[p.internalId]) {
                p.__filterGen = d;
                if (h.allowExpandCollapseWhileFiltered && !p.data.leaf) {
                    p.expand()
                }
            }
        })
    },
    filterTreeBy: function(c, b) {
        this.currentFilterGeneration = this.filterGeneration++;
        var a;
        if (arguments.length == 1 && Ext.isObject(arguments[0])) {
            b = c.scope;
            a = c.filter
        } else {
            a = c;
            c = {
                filter: a,
                scope: b
            }
        }
        this.fireEvent("nodestore-datachange-start", this);
        c = c || {};
        this.markFilteredNodes(this.getRootNode(), c);
        this.startDataChangeMonitoring();
        this.isFilteredFlag = true;
        this.lastTreeFilter = c;
        this.fireEvent("nodestore-datachange-end", this);
        this.fireEvent("filter-set", this);
        this.refreshNodeStoreContent()
    },
    isNodeFilteredIn: function(c) {
        var b = this.isTreeFiltered();
        var a = this.currentFilterGeneration;
        return this.loading || !Boolean(b && c.__filterGen != a || c.hidden)
    },
    hasNativeFilters: function() {
        var c = this,
            b = c.getFilters(),
            a = b.getCount();
        return (a && a > 1) || b.indexOf(c.treeFilter) < 0
    },
    hideNodesBy: function(b, a, d) {
        var c = this;
        if (c.isFiltered() && c.hasNativeFilters()) {
            throw new Error("Can't hide nodes of the filtered tree store")
        }
        a = a || c;
        c.getRootNode().cascadeBy(function(e) {
            e.hidden = Boolean(b.call(a, e, c))
        });
        c.startDataChangeMonitoring();
        c.isHiddenFlag = true;
        c.lastTreeHiding = [b, a];
        if (!d) {
            c.refreshNodeStoreContent()
        }
    },
    showAllNodes: function(a) {
        this.getRootNode().cascadeBy(function(b) {
            b.hidden = false
        });
        this.isHiddenFlag = false;
        this.lastTreeHiding = null;
        if (!this.isTreeFiltered(true)) {
            this.stopDataChangeMonitoring()
        }
        if (!a) {
            this.refreshNodeStoreContent()
        }
    },
    inheritables: function() {
        return {
            onNodeExpand: function(c, b, a) {
                if (this.isTreeFiltered(true) && c == this.getRoot()) {
                    this.callParent(arguments);
                    this.reApplyFilter()
                } else {
                    return this.callParent(arguments)
                }
            },
            onNodeCollapse: function(f, a, h, g, i) {
                var e = this;
                var c = e.data;
                var j = c.contains;
                var b = e.isTreeFiltered();
                var d = e.currentFilterGeneration;
                c.contains = function() {
                    var n, m, p;
                    var l = e.indexOf(f) + 1;
                    var o = false;
                    for (var k = 0; k < a.length; k++) {
                        if (!(a[k].hidden || b && a[k].__filterGen != d) && j.call(this, a[k])) {
                            n = f;
                            while (n.parentNode) {
                                m = n;
                                do {
                                    m = m.nextSibling
                                } while (m && (m.hidden || b && m.__filterGen != d));
                                if (m) {
                                    o = true;
                                    p = e.indexOf(m);
                                    break
                                } else {
                                    n = n.parentNode
                                }
                            }
                            if (!o) {
                                p = e.getCount()
                            }
                            e.removeAt(l, p - l);
                            break
                        }
                    }
                    return false
                };
                this.callParent(arguments);
                c.contains = j
            },
            handleNodeExpand: function(h, a, j) {
                var e = this;
                var f = [];
                var b = e.isTreeFiltered();
                var g = e.currentFilterGeneration;
                for (var c = 0; c < a.length; c++) {
                    var d = a[c];
                    if (!(b && d.__filterGen != g || d.hidden)) {
                        f[f.length] = d
                    }
                }
                return this.callParent([h, f, j])
            },
            onNodeInsert: function(m, a, g) {
                var i = this,
                    h, n, j, b, k, f, c = a.raw || a.data,
                    l, e, d;
                if (i.filterFn) {
                    e = i.filterFn(a);
                    a.set("visible", e);
                    if (e) {
                        m.set("visible", i.filterFn(m))
                    }
                }
                i.registerNode(a, true);
                i.beginUpdate();
                if (i.isVisible(a)) {
                    if (g === 0 || !a.previousSibling) {
                        h = m
                    } else {
                        for (n = a.previousSibling; n && !n.get("visible"); n = n.previousSibling) {}
                        if (!n) {
                            h = m
                        } else {
                            while (n.isExpanded() && n.lastChild) {
                                n = n.lastChild
                            }
                            h = n
                        }
                    }
                    i.insert(i.indexOf(h) + 1, a);
                    if (!a.isLeaf() && a.isExpanded()) {
                        if (a.isLoaded()) {
                            i.onNodeExpand(a, a.childNodes)
                        } else {
                            if (!i.fillCount) {
                                a.set("expanded", false);
                                a.expand()
                            }
                        }
                    }
                } else {
                    i.needsSync = i.needsSync || a.phantom || a.dirty
                }
                if (!a.isLeaf() && !a.isLoaded() && !i.lazyFill) {
                    j = i.getProxy().getReader();
                    b = a.getProxy();
                    k = b ? b.getReader() : null;
                    f = k && k.initialConfig.rootProperty ? k : j;
                    l = f.getRoot(c);
                    if (l) {
                        d = a.childType;
                        i.fillNode(a, f.extractData(l, d ? {
                            model: d
                        } : undefined))
                    }
                }
                i.endUpdate()
            },
            isFiltered: function() {
                return this.callParent(arguments) || this.isTreeFiltered()
            }
        }
    }
});
