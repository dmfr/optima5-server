Ext.define("Sch.locale.Locale", {
    l10n: null,
    legacyMode: true,
    localeName: null,
    namespaceId: null,
    constructor: function() {
        if (!Sch.locale.Active) {
            Sch.locale.Active = {};
            this.bindRequire()
        }
        var b = this.self.getName().split(".");
        var a = this.localeName = b.pop();
        this.namespaceId = b.join(".");
        var c = Sch.locale.Active[this.namespaceId];
        if (!(a == "En" && c && c.localeName != "En")) {
            this.apply()
        }
    },
    bindRequire: function() {
        var a = Ext.ClassManager.triggerCreated;
        Ext.ClassManager.triggerCreated = function(d) {
            a.apply(this, arguments);
            var c = Ext.ClassManager.get(d);
            for (var b in Sch.locale.Active) {
                Sch.locale.Active[b].apply(c)
            }
        }
    },
    apply: function(a) {
        if (this.l10n) {
            var h = this,
                f, e;
            var g = this.self.getName();
            var d = function(l, k) {
                k = k || Ext.ClassManager.get(l);
                if (k && (k.activeLocaleId !== g)) {
                    var i = h.l10n[l];
                    if (typeof i === "function") {
                        i(l)
                    } else {
                        if (k.singleton) {
                            k.l10n = Ext.apply({}, i, k.prototype && k.prototype.l10n)
                        } else {
                            Ext.override(k, {
                                l10n: i
                            })
                        }
                    }
                    if (h.legacyMode) {
                        var n;
                        if (k.prototype) {
                            n = k.prototype
                        } else {
                            if (k.singleton) {
                                n = k
                            }
                        }
                        if (n && n.legacyMode) {
                            if (n.legacyHolderProp) {
                                if (!n[n.legacyHolderProp]) {
                                    n[n.legacyHolderProp] = {}
                                }
                                n = n[n.legacyHolderProp]
                            }
                            for (var m in i) {
                                if (typeof n[m] !== "function") {
                                    n[m] = i[m]
                                }
                            }
                        }
                    }
                    k.activeLocaleId = g;
                    if (k.onLocalized) {
                        k.onLocalized()
                    }
                }
            };
            if (a) {
                if (!Ext.isArray(a)) {
                    a = [a]
                }
                var b, j;
                for (f = 0, e = a.length; f < e; f++) {
                    if (Ext.isObject(a[f])) {
                        if (a[f].singleton) {
                            j = a[f];
                            b = Ext.getClassName(Ext.getClass(j))
                        } else {
                            j = Ext.getClass(a[f]);
                            b = Ext.getClassName(j)
                        }
                    } else {
                        j = null;
                        b = "string" === typeof a[f] ? a[f] : Ext.getClassName(a[f])
                    }
                    if (b && b in this.l10n) {
                        d(b, j)
                    }
                }
            } else {
                Sch.locale.Active[this.namespaceId] = this;
                for (var c in this.l10n) {
                    d(c)
                }
            }
        }
    }
});
