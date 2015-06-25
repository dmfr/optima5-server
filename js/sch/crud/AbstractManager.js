Ext.define("Sch.crud.AbstractManager", {
    require: ["Ext.data.StoreManager"],
    mixins: {
        observable: "Ext.util.Observable"
    },
    revision: null,
    stores: null,
    storeIdProperty: "storeId",
    storesIndex: null,
    activeRequests: null,
    delayedSyncs: null,
    transport: null,
    trackResponseType: false,
    phantomIdField: "$PhantomId",
    autoLoad: false,
    autoSyncTimeout: 100,
    autoSync: false,
    resetIdsBeforeSync: true,
    syncApplySequence: null,
    writeAllFields: false,
    ignoreUpdates: 0,
    createMissingRecords: false,
    autoSyncTimerId: null,
    constructor: function(b) {
        b = b || {};
        this.mixins.observable.constructor.call(this, b);
        this.activeRequests = {};
        this.delayedSyncs = [];
        this.transport = b.transport || this.transport || {};
        var a = b.stores || this.stores;
        this.stores = [];
        this.addStore(a);
        var c = b.syncApplySequence || this.syncApplySequence;
        if (c) {
            this.syncApplySequence = null;
            this.addStoreToApplySequence(c)
        }
        if (this.autoLoad) {
            this.load()
        }
    },
    updateStoreIndex: function() {
        var b = {};
        for (var d = 0, a = this.stores.length; d < a; d++) {
            var c = this.stores[d];
            if (c.storeId) {
                b[c.storeId] = this.stores[d]
            }
        }
        this.storesIndex = b
    },
    getStoreDescriptor: function(b) {
        if (!b) {
            return
        }
        if (b instanceof Ext.data.AbstractStore) {
            for (var c = 0, a = this.stores.length; c < a; c++) {
                if (this.stores[c].store === b) {
                    return this.stores[c]
                }
            }
        } else {
            if (typeof b == "object") {
                return this.storesIndex[b.storeId]
            } else {
                return this.storesIndex[b] || this.getStoreDescriptor(Ext.data.StoreManager.get(b))
            }
        }
    },
    getStore: function(a) {
        var b = this.getStoreDescriptor(a);
        return b && b.store
    },
    forEachStore: function(e, d) {
        if (!e) {
            return
        }
        var b = this.stores;
        for (var c = 0, a = b.length; c < a; c++) {
            if (e.call(d || this, b[c].store, b[c].storeId, b[c]) === false) {
                break
            }
        }
    },
    addStore: function(p, h, a) {
        if (!p) {
            return
        }
        if (!Ext.isArray(p)) {
            p = [p]
        }
        var f = [];
        for (var g = 0, c = p.length; g < c; g++) {
            var o = p[g];
            if (o instanceof Ext.data.AbstractStore) {
                o = {
                    store: o
                }
            } else {
                if (typeof o == "object") {
                    if (o.stores) {
                        if (!Ext.isArray(o.stores)) {
                            o.stores = [o.stores]
                        }
                        for (var d = 0, b = o.stores.length; d < b; d++) {
                            var k = o.stores[d],
                                e = k;
                            if ("string" === typeof k) {
                                e = {
                                    storeId: k
                                }
                            }
                            e.masterStoreInfo = o;
                            o.stores[d] = e
                        }
                    }
                } else {
                    o = {
                        store: Ext.data.StoreManager.get(o)
                    }
                }
            }
            f.push(this.fillStoreDescriptor(o));
            o.store.crudManager = this;
            this.mon(o.store, {
                add: this.onStoreChange,
                append: this.onStoreChange,
                insert: this.onStoreChange,
                update: this.onStoreChange,
                remove: this.onStoreChange,
                clear: this.onStoreChange,
                scope: this
            })
        }
        if (typeof h === "undefined") {
            this.stores.push.apply(this.stores, f)
        } else {
            var m = h;
            if (a) {
                if (a instanceof Ext.data.AbstractStore || typeof a !== "object") {
                    a = this.getStoreDescriptor(a)
                }
                m += Ext.Array.indexOf(this.stores, a)
            }
            this.stores.splice.apply(this.stores, [].concat([m, 0], f))
        }
        this.updateStoreIndex()
    },
    fillStoreDescriptor: function(d) {
        var a = d.store,
            c = a.storeIdProperty || this.storeIdProperty,
            b = a.getModel && a.getModel() || a.model;
        b = b && b.prototype;
        Ext.applyIf(d, {
            storeId: a[c],
            phantomIdField: b && b.phantomIdField,
            idProperty: b && b.idProperty,
            writeAllFields: a.writeAllFields
        });
        return d
    },
    removeStore: function(b) {
        for (var c = 0, a = this.stores.length; c < a; c++) {
            var d = this.stores[c];
            if (d === b || d.store === b || d.storeId === b) {
                this.mun(d.store, {
                    add: this.onStoreChange,
                    append: this.onStoreChange,
                    insert: this.onStoreChange,
                    update: this.onStoreChange,
                    remove: this.onStoreChange,
                    clear: this.onStoreChange,
                    scope: this
                });
                delete this.storesIndex[d.storeId];
                this.stores.splice(c, 1);
                if (this.syncApplySequence) {
                    this.removeStoreFromApplySequence(b)
                }
                break
            }
        }
    },
    addStoreToApplySequence: function(c, a, e) {
        if (!c) {
            return
        }
        if (!Ext.isArray(c)) {
            c = [c]
        }
        var g = [];
        for (var d = 0, b = c.length; d < b; d++) {
            var f = this.getStoreDescriptor(c[d]);
            if (f) {
                g.push(f)
            }
        }
        if (!this.syncApplySequence) {
            this.syncApplySequence = []
        }
        if (typeof a === "undefined") {
            this.syncApplySequence.push.apply(this.syncApplySequence, g)
        } else {
            var h = a;
            if (e) {
                if (e instanceof Ext.data.AbstractStore || typeof e !== "object") {
                    e = this.getStoreDescriptor(e)
                }
                h += Ext.Array.indexOf(this.syncApplySequence, e)
            }
            this.syncApplySequence.splice.apply(this.syncApplySequence, [].concat([h, 0], g))
        }
    },
    removeStoreFromApplySequence: function(b) {
        for (var c = 0, a = this.syncApplySequence.length; c < a; c++) {
            var d = this.syncApplySequence[c];
            if (d === b || d.store === b || d.storeId === b) {
                this.syncApplySequence.splice(c, 1);
                break
            }
        }
    },
    onStoreChange: function() {
        if (this.ignoreUpdates) {
            return
        }
        var a = this;
        this.fireEvent("haschanges", this);
        if (this.autoSync) {
            if (!this.autoSyncTimerId) {
                this.autoSyncTimerId = setTimeout(function() {
                    a.autoSyncTimerId = null;
                    a.sync()
                }, this.autoSyncTimeout)
            }
        }
    },
    hasChanges: function(b) {
        var c;
        if (b) {
            c = this.getStore(b);
            if (!c) {
                return
            }
            return Boolean(c.getModifiedRecords().length || c.getRemovedRecords().length)
        }
        for (var d = 0, a = this.stores.length; d < a; d++) {
            c = this.stores[d].store;
            if (c.getModifiedRecords().length || c.getRemovedRecords().length) {
                return true
            }
        }
        return false
    },
    getLoadPackage: function(k) {
        var g = {
            type: "load",
            requestId: this.getRequestId(),
            stores: []
        };
        var j = this.stores,
            b = g.stores;
        for (var e = 0, c = j.length; e < c; e++) {
            var h = j[e],
                a = k && k[h.storeId],
                f = h.pageSize || h.store.pageSize;
            if (a || f) {
                var d = Ext.apply({
                    storeId: h.storeId,
                    page: 1,
                    pageSize: f
                }, a);
                j[e].currentPage = d.page;
                b.push(d)
            } else {
                b.push(h.storeId)
            }
        }
        return g
    },
    prepareAdded: function(h, m, k) {
        var o = [];
        for (var c = 0, a = h.length; c < a; c++) {
            var d = h[c],
                b = {},
                e = d.getFields();
            if (!b.hasOwnProperty(m)) {
                b[m] = d.getId()
            }
            for (var g = 0, n = e.length; g < n; g++) {
                var j = e[g];
                if (j) {
                    if (j.persist && (d.data.hasOwnProperty(j.name) || j.critical)) {
                        if (j.serialize) {
                            b[j.name] = j.serialize(d.data[j.name], d)
                        } else {
                            b[j.name] = d.data[j.name]
                        }
                    }
                }
            }
            if (this.resetIdsBeforeSync) {
                delete b[d.idProperty]
            }
            if (k) {
                this.processSubStores(d, b, k)
            }
            o.push(b)
        }
        return o
    },
    prepareUpdated: function(m, p, o) {
        var q = [],
            b = o.writeAllFields || (o.writeAllFields !== false && this.writeAllFields),
            e, n;
        for (var g = 0, c = m.length; g < c; g++) {
            var h = m[g],
                k;
            if (b) {
                e = h.getData();
                e[h.idProperty] = h.getId();
                for (k in e) {
                    n = h.getField(k);
                    if (!n || !n.persist && !n.critical) {
                        delete e[k]
                    } else {
                        if (n.serialize) {
                            e[k] = n.serialize(e[k], h)
                        } else {
                            e[k] = h.get(k)
                        }
                    }
                }
            } else {
                e = h.getChanges();
                e[h.idProperty] = h.getId();
                for (k in e) {
                    n = h.getField(k);
                    if (!n || !n.persist) {
                        delete e[k]
                    } else {
                        if (n.serialize) {
                            e[k] = n.serialize(e[k], h)
                        } else {
                            e[k] = h.get(k)
                        }
                    }
                }
                var a = h.getCriticalFields();
                for (var d = 0; d < a.length; d++) {
                    n = a[d];
                    if (n.serialize) {
                        e[n.getName()] = n.serialize(h.get(n.getName()), h)
                    } else {
                        e[n.getName()] = h.get(n.getName())
                    }
                }
            }
            if (p) {
                this.processSubStores(h, e, p)
            }
            q.push(e)
        }
        return q
    },
    prepareRemoved: function(e) {
        var a = [],
            d;
        for (var c = 0, b = e.length; c < b; c++) {
            d = {};
            d[e[c].idProperty] = e[c].getId();
            a.push(d)
        }
        return a
    },
    processSubStores: function(b, f, a) {
        for (var d = 0, h = a.length; d < h; d++) {
            var g = a[d].storeId,
                c = b.get(g);
            if (c) {
                var e = this.getStoreChanges(Ext.apply({
                    store: c
                }, a[d]));
                if (e) {
                    f[g] = Ext.apply(e, {
                        $store: true
                    })
                } else {
                    delete f[g]
                }
            } else {
                delete f[g]
            }
        }
    },
    getStoreChanges: function(d, g) {
        g = g || d.phantomIdField || this.phantomIdField;
        var f = d.store,
            e = f.getNewRecords(),
            c = f.getUpdatedRecords(),
            h = f.getRemovedRecords(),
            b = d.stores;
        var a;
        if (e.length) {
            e = this.prepareAdded(e, g, b)
        }
        if (c.length) {
            c = this.prepareUpdated(c, b, d)
        }
        if (h.length) {
            h = this.prepareRemoved(h)
        }
        if (e.length || c.length || h.length) {
            a = {};
            if (e.length) {
                a.added = e
            }
            if (c.length) {
                a.updated = c
            }
            if (h.length) {
                a.removed = h
            }
        }
        return a
    },
    getChangeSetPackage: function() {
        var d = {
            type: "sync",
            requestId: this.getRequestId(),
            revision: this.revision
        };
        var f = this.stores,
            j = 0;
        for (var b = 0, a = f.length; b < a; b++) {
            var e = f[b],
                g = e.phantomIdField || this.phantomIdField,
                h = e.storeId;
            var c = this.getStoreChanges(e, g);
            if (c) {
                j++;
                d[h] = c
            }
        }
        return j ? d : null
    },
    getSubStoresData: function(h, f, g, e) {
        if (!h) {
            return
        }
        var j = [];
        var a = function(n, o) {
            for (var l = 0, i = o.length; l < i; l++) {
                var k = o[l].storeId;
                if (n[k]) {
                    j.push({
                        id: n[g],
                        storeDesc: o[l],
                        data: n[k]
                    });
                    delete n[k]
                }
            }
        };
        var d = 0,
            c = h.length;
        if (e) {
            for (; d < c; d++) {
                a(h[d], f);
                var b = this.getSubStoresData(h[d].children, f, g, true);
                if (b) {
                    j = j.concat(b)
                }
            }
        } else {
            for (; d < c; d++) {
                a(h[d], f)
            }
        }
        return j
    },
    loadDataToStore: function(a, d) {
        var h = a.store,
            j = a.stores,
            k = a.idProperty || "id",
            f = h instanceof Ext.data.TreeStore,
            g;
        var m = d && d.rows;
        h.metaData = d && d.metaData;
        if (m) {
            if (j) {
                g = this.getSubStoresData(m, j, k, f)
            }
            h.__loading = true;
            if (f) {
                h.proxy.data = m;
                h.load()
            } else {
                h.totalCount = d.total;
                h.currentPage = a.currentPage;
                h.loadData(m);
                h.fireEvent("load", h, h.getRange(), true)
            }
            if (g) {
                for (var c = 0, b = g.length; c < b; c++) {
                    var e = g[c];
                    this.loadDataToStore(Ext.apply({
                        store: h[f ? "getNodeById" : "getById"](e.id).get(e.storeDesc.storeId)
                    }, e.storeDesc), e.data)
                }
            }
            h.__loading = false
        }
    },
    loadData: function(b) {
        for (var c = 0, a = this.stores.length; c < a; c++) {
            var e = this.stores[c],
                d = b[e.storeId];
            if (d) {
                this.loadDataToStore(e, d)
            }
        }
    },
    applyChangesToRecord: function(g, i, m) {
        var h = g.fields,
            f = g.data,
            e = {},
            c = false,
            a;
        if (m) {
            for (var d = 0, b = m.length; d < b; d++) {
                a = m[d].storeId;
                if (i.hasOwnProperty(a)) {
                    e[a] = true;
                    var l = g.get(a);
                    if (l) {
                        this.applyChangesToStore(Ext.apply({
                            store: l
                        }, m[d]), i[a])
                    } else {
                        Ext.log("Can't find store for the response sub-package")
                    }
                }
            }
        }
        for (a in i) {
            if (i.hasOwnProperty(a) && !e[a]) {
                var k = i[a];
                if (!g.isEqual(f[a], k)) {
                    if (!c) {
                        c = true;
                        g.beginEdit()
                    }
                    if (a === g.idProperty) {
                        g.setId(k)
                    } else {
                        g.set(a, k)
                    }
                }
            }
        }
        this.ignoreUpdates++;
        if (c) {
            g.endEdit()
        }
        this.ignoreUpdates--;
        g.commit()
    },
    applyRemovals: function(o, m, d) {
        var p = d.idProperty,
            n = o.getRemovedRecords(),
            q = d.findByIdFn,
            a = d.removeRecordFn,
            h = 0;
        for (var g = 0, e = m.length; g < e; g++) {
            var f = false;
            var c = m[g][p];
            for (var l = 0, b = n.length; l < b; l++) {
                if (n[l].getId() == c) {
                    n.splice(l, 1);
                    f = true;
                    h++;
                    break
                }
            }
            if (!f) {
                var i = q(c);
                if (i) {
                    this.ignoreUpdates++;
                    a(i);
                    Ext.Array.remove(n, i);
                    h++;
                    this.ignoreUpdates--
                } else {
                    Ext.log("Can't find record to remove from the response package")
                }
            }
        }
        return h
    },
    applyChangesToStore: function(h, x) {
        var t, r, p;
        var b = h.phantomIdField || this.phantomIdField,
            i = h.idProperty,
            o = h.store;
        if (!i) {
            var e = o.getModel && o.getModel() || o.model;
            e = e && e.prototype;
            i = e && e.idProperty || "id"
        }
        var q = function(j) {
                return o.data.getByKey(j)
            },
            w = function(j) {
                return o.getById(j)
            },
            g = function(j) {
                return o.getNodeById(j)
            },
            a, v;
        var n, m;
        if (o instanceof Ext.data.TreeStore) {
            n = m = g;
            a = function(k) {
                var j = (k.parentId && o.getNodeById(k.parentId)) || o.getRootNode();
                return j.appendChild(k)
            };
            v = function(j) {
                return j.parentNode.removeChild(j)
            }
        } else {
            n = q;
            m = w;
            a = function(j) {
                return o.add(j)[0]
            };
            v = function(j) {
                return o.remove(j)
            }
        }
        var l = x.rows,
            u = x.removed,
            c;
        if (l) {
            var y, d, f = h.stores;
            for (t = 0, r = l.length; t < r; t++) {
                y = l[t];
                d = y[b];
                p = y[i];
                c = null;
                if (d != null) {
                    c = n(d)
                } else {
                    if (i) {
                        c = m(p)
                    }
                }
                if (c) {
                    this.applyChangesToRecord(c, y, f)
                } else {
                    this.ignoreUpdates++;
                    c = a(y);
                    this.ignoreUpdates--;
                    c.commit()
                }
            }
        }
        if (u && this.applyRemovals(o, u, {
                idProperty: i,
                findByIdFn: m,
                removeRecordFn: v
            })) {
            o.fireEvent("datachanged", o)
        }
    },
    applySyncResponse: function(c) {
        var b = this.syncApplySequence || this.stores;
        for (var d = 0, a = b.length; d < a; d++) {
            var e = c[b[d].storeId];
            if (e) {
                this.applyChangesToStore(b[d], e)
            }
        }
    },
    applyLoadResponse: function(a) {
        this.loadData(a)
    },
    applyResponse: function(a, b) {
        if (this.trackResponseType) {
            a = b.type || a
        }
        switch (a) {
            case "load":
                this.applyLoadResponse(b);
                break;
            case "sync":
                this.applySyncResponse(b);
                break
        }
    },
    getRequestId: function() {
        return Ext.Date.now()
    },
    onResponse: function(a, c, d) {
        this.activeRequests[a] = null;
        var b = this.decode(c);
        if (!b || !b.success) {
            this.fireEvent("requestfail", this, a, b, d);
            this.fireEvent(a + "fail", this, b, d);
            this.warn("CrudManager: " + a + " failed, please inspect the server response", c);
            return b
        }
        if ((this.fireEvent("beforeresponseapply", this, a, b) !== false) && (this.fireEvent("before" + a + "apply", this, b) !== false)) {
            this.revision = b.revision;
            this.applyResponse(a, b);
            this.fireEvent("requestdone", this, a, b, d);
            this.fireEvent(a, this, b, d);
            if (!this.hasChanges()) {
                this.fireEvent("nochanges", this)
            }
        }
        return b
    },
    onLoad: function(a, b) {
        return this.onResponse("load", a, b)
    },
    onSync: function(a, b) {
        return this.onResponse("sync", a, b)
    },
    load: function(e, a, d) {
        var b;
        if (typeof e === "object") {
            b = e;
            e = a;
            a = d;
            d = arguments[3]
        }
        var c = this.getLoadPackage(b);
        if (this.fireEvent("beforeload", this, c) !== false) {
            d = d || this;
            if (this.activeRequests.load) {
                this.cancelRequest(this.activeRequests.load.desc);
                this.fireEvent("loadcanceled", this, c)
            }
            this.activeRequests.load = {
                id: c.requestId
            };
            this.activeRequests.load.desc = this.sendRequest({
                data: this.encode(c),
                type: "load",
                success: function(g, h) {
                    var f = this.onLoad(g, h);
                    if (a && (!f || !f.success)) {
                        a.call(d, f, g)
                    } else {
                        if (e) {
                            e.call(d, f, g)
                        }
                    }
                },
                failure: function(f, g) {
                    this.onLoad(f, g);
                    if (a) {
                        a.apply(d, arguments)
                    }
                },
                scope: this
            })
        } else {
            this.fireEvent("loadcanceled", this, c)
        }
    },
    sync: function(d, a, c) {
        if (this.activeRequests.sync) {
            this.delayedSyncs.push(arguments);
            this.fireEvent("syncdelayed", this, arguments);
            return
        }
        var b = this.getChangeSetPackage();
        c = c || this;
        if (!b) {
            if (d) {
                d.call(c, null, null)
            }
            return
        }
        if (this.fireEvent("beforesync", this, b) === false) {
            this.fireEvent("synccanceled", this, b);
            return
        }
        this.activeRequests.sync = {
            id: b.requestId
        };
        this.activeRequests.sync.desc = this.sendRequest({
            data: this.encode(b),
            type: "sync",
            success: function(h, f) {
                var g = this.activeRequests.sync;
                var e = this.onSync(h, f);
                if (a && (!e || !e.success)) {
                    a.call(c, e, h, g)
                } else {
                    if (d) {
                        d.call(c, e, h, g)
                    }
                }
                this.runDelayedSync()
            },
            failure: function(f, e) {
                this.onSync(f, e);
                if (a) {
                    a.apply(c, arguments)
                }
                this.runDelayedSync()
            },
            scope: this
        })
    },
    runDelayedSync: function() {
        var a = this.delayedSyncs.shift();
        if (!a) {
            return
        }
        this.sync.apply(this, a)
    },
    commit: function() {
        for (var b = 0, a = this.stores.length; b < a; b++) {
            this.stores[b].store.commitChanges()
        }
    },
    reject: function() {
        for (var b = 0, a = this.stores.length; b < a; b++) {
            this.stores[b].store.rejectChanges()
        }
    },
    warn: function() {
        if ("console" in window) {
            var a = console;
            a.log && a.log.apply && a.log.apply(a, arguments)
        }
    },
    isLoading: function() {
        return !!this.activeRequests.load
    }
});
