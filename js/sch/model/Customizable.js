    Ext.define("Sch.model.Customizable", {
        extend: "Ext.data.Model",
        customizableFields: null,
        previous: null,
        __editing: null,
        __editCounter: 0,
        constructor: function() {
            var a = this.callParent(arguments);
            return a
        },
        onClassExtended: function(b, d, a) {
            var c = a.onBeforeCreated;
            a.onBeforeCreated = function(n, i) {
                c.apply(this, arguments);
                var j = n.prototype;
                if (!j.customizableFields) {
                    return
                }
                j.customizableFields = (n.superclass.customizableFields || []).concat(j.customizableFields);
                var g = j.customizableFields;
                var h = {};
                var l = this;
                var f = Ext.Array.findBy(n.fields, function(o) {
                    return o.name === j.idProperty
                });
                l.idField = j.idField = f;
                if (!n.fieldsMap[j.idProperty]) {
                    n.fieldsMap[j.idProperty] = f
                }
                Ext.Array.forEach(g, function(o) {
                    if (typeof o == "string") {
                        o = {
                            name: o
                        }
                    }
                    h[o.name] = o
                });
                var k = j.fields;
                var m = [];
                var e = [];
                Ext.Array.forEach(k, function(o) {
                    if (o.isCustomizableField) {
                        e.push(o.getName())
                    }
                });
                if (j.idProperty !== "id" && j.getField("id")) {
                    if (!j.getField("id").hasOwnProperty("name")) {
                        e.push("id")
                    }
                }
                if (j.idProperty !== "Id" && j.getField("Id")) {
                    if (!j.getField("Id").hasOwnProperty("name")) {
                        e.push("Id")
                    }
                }
                n.removeFields(e);
                Ext.Object.each(h, function(o, r) {
                    r.isCustomizableField = true;
                    var s = r.name || r.getName();
                    var x = s === "Id" ? "idProperty" : s.charAt(0).toLowerCase() + s.substr(1) + "Field";
                    var t = j[x];
                    var w = t || s;
                    var v;
                    if (j.getField(w)) {
                        v = Ext.applyIf({
                            name: s,
                            isCustomizableField: true
                        }, j.getField(w));
                        j.getField(w).isCustomizableField = true;
                        v = Ext.create("data.field." + (v.type || "auto"), v);
                        g.push(v)
                    } else {
                        v = Ext.applyIf({
                            name: w,
                            isCustomizableField: true
                        }, r);
                        v = Ext.create("data.field." + (v.type || "auto"), v);
                        m.push(v)
                    }
                    var q = Ext.String.capitalize(s);
                    if (q != "Id") {
                        var u = "get" + q;
                        var p = "set" + q;
                        if (!j[u] || j[u].__getterFor__ && j[u].__getterFor__ != w) {
                            j[u] = function() {
                                return this.get(w)
                            };
                            j[u].__getterFor__ = w
                        }
                        if (!j[p] || j[p].__setterFor__ && j[p].__setterFor__ != w) {
                            j[p] = function(y) {
                                return this.set(w, y)
                            };
                            j[p].__setterFor__ = w
                        }
                    }
                });
                n.addFields(m)
            }
        },
        set: function(f, b) {
            var a;
            var d;
            this.previous = this.previous || {};
            if (typeof f === "string") {
                a = this.get(f);
                if (a instanceof Date && !(b instanceof Date)) {
                    b = this.getField(f).convert(b, this)
                }
                if ((a instanceof Date && (a - b)) || !(a instanceof Date) && a !== b) {
                    this.previous[f] = a
                } else {
                    return []
                }
            } else {
                for (var e in f) {
                    a = this.get(e);
                    var c = f[e];
                    if (a instanceof Date && !(c instanceof Date)) {
                        c = this.getField(e).convert(c, this)
                    }
                    if ((a instanceof Date && (a - c)) || !(a instanceof Date) && a !== c) {
                        this.previous[e] = a
                    }
                }
            }
            d = this.callParent(arguments);
            if (!this.__editing) {
                delete this.previous
            }
            return d
        },
        reject: function() {
            var b = this,
                a = b.modified || {},
                c;
            b.__editing = true;
            b.previous = b.previous || {};
            for (c in a) {
                if (a.hasOwnProperty(c)) {
                    if (typeof a[c] != "function") {
                        b.previous[c] = b.get(c)
                    }
                }
            }
            b.callParent(arguments);
            delete b.previous;
            b.__editing = false
        },
        beginEdit: function() {
            this.__editCounter++;
            this.__editing = true;
            this.callParent(arguments)
        },
        cancelEdit: function() {
            this.__editCounter = 0;
            this.__editing = false;
            this.callParent(arguments);
            delete this.previous
        },
        endEdit: function(b, c) {
            if (--this.__editCounter === 0) {
                if (!b && this.getModifiedFieldNames) {
                    var a = this.editMemento;
                    if (!c) {
                        c = this.getModifiedFieldNames(a.data)
                    }
                    if (c && c.length === 0) {
                        b = true
                    }
                }
                this.callParent([b].concat(Array.prototype.slice.call(arguments, 1)));
                this.__editing = false;
                delete this.previous
            }
        }
    })
