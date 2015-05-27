    Ext.define("Sch.model.Customizable", {
        extend: "Ext.data.Model",
        idProperty: null,
        customizableFields: null,
        previous: null,
        onClassExtended: function (b, d, a) {
            var c = a.onBeforeCreated;
            a.onBeforeCreated = function (f, k) {
                c.apply(this, arguments);
                var j = f.prototype;
                if (!j.customizableFields) {
                    return
                }
                j.customizableFields = (f.superclass.customizableFields || []).concat(j.customizableFields);
                var g = j.customizableFields;
                var i = {};
                Ext.Array.each(g, function (l) {
                    if (typeof l == "string") {
                        l = {
                            name: l
                        }
                    }
                    i[l.name] = l
                });
                var e = j.fields;
                var h = [];
                e.each(function (l) {
                    if (l.isCustomizableField) {
                        h.push(l)
                    }
                });
                e.removeAll(h);
                Ext.Object.each(i, function (l, o) {
                    o.isCustomizableField = true;
                    var p = o.name || o.getName();
                    var t = p === "Id" ? "idProperty" : p.charAt(0).toLowerCase() + p.substr(1) + "Field";
                    var q = j[t];
                    var s = q || p;
                    if (e.containsKey(s)) {
                        e.getByKey(s).isCustomizableField = true;
                        g.push(new Ext.data.Field(Ext.applyIf({
                            name: p,
                            isCustomizableField: true
                        }, e.getByKey(s))))
                    } else {
                        e.add(new Ext.data.Field(Ext.applyIf({
                            name: s,
                            isCustomizableField: true
                        }, o)))
                    }
                    var n = Ext.String.capitalize(p);
                    if (n != "Id") {
                        var r = "get" + n;
                        var m = "set" + n;
                        if (!j[r] || j[r].__getterFor__ && j[r].__getterFor__ != s) {
                            j[r] = function () {
                                return this.data[s]
                            };
                            j[r].__getterFor__ = s
                        }
                        if (!j[m] || j[m].__setterFor__ && j[m].__setterFor__ != s) {
                            j[m] = function (u) {
                                return this.set(s, u)
                            };
                            j[m].__setterFor__ = s
                        }
                    }
                })
            }
        },
        set: function (d, b) {
            var a;
            this.previous = this.previous || {};
            if (arguments.length > 1) {
                a = this.get(d);
                if (a !== b) {
                    this.previous[d] = a
                }
            } else {
                for (var c in d) {
                    a = this.get(c);
                    if (a !== d[c]) {
                        this.previous[c] = a
                    }
                }
            }
            this.callParent(arguments)
        },
        afterEdit: function () {
            this.callParent(arguments);
            delete this.previous
        },
        reject: function () {
            var b = this,
                a = b.modified,
                c;
            b.previous = b.previous || {};
            for (c in a) {
                if (a.hasOwnProperty(c)) {
                    if (typeof a[c] != "function") {
                        b.previous[c] = b.get(c)
                    }
                }
            }
            b.callParent(arguments);
            delete b.previous
        }
    }) ;

