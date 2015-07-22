Ext.define("Sch.mixin.Localizable", {
    requires: ["Sch.locale.En"],
    legacyMode: false,
    activeLocaleId: "",
    l10n: null,
    isLocaleApplied: function() {
        var b = (this.singleton && this.activeLocaleId) || this.self.activeLocaleId;
        if (!b) {
            return false
        }
        for (var a in Sch.locale.Active) {
            if (b === Sch.locale.Active[a].self.getName()) {
                return true
            }
        }
        return false
    },
    applyLocale: function() {
        for (var a in Sch.locale.Active) {
            Sch.locale.Active[a].apply(this.singleton ? this : this.self.getName())
        }
    },
    L: function() {
        return this.localize.apply(this, arguments)
    },
    localize: function(b, d, g) {
        if (!this.isLocaleApplied() && !g) {
            this.applyLocale()
        }
        if (this.hasOwnProperty("l10n") && this.l10n.hasOwnProperty(b) && "function" != typeof this.l10n[b]) {
            return this.l10n[b]
        }
        var c = this.self && this.self.prototype;
        if (this.legacyMode) {
            var a = d || this.legacyHolderProp;
            var h = a ? this[a] : this;
            if (h && h.hasOwnProperty(b) && "function" != typeof h[b]) {
                return h[b]
            }
            if (c) {
                var e = a ? c[a] : c;
                if (e && e.hasOwnProperty(b) && "function" != typeof e[b]) {
                    return e[b]
                }
            }
        }
        var i = c.l10n && c.l10n[b];
        if (i === null || i === undefined) {
            var f = c && c.superclass;
            if (f && f.localize) {
                i = f.localize(b, d, g)
            }
            if (i === null || i === undefined) {
                throw "Cannot find locale: " + b + " [" + this.self.getName() + "]"
            }
        }
        return i
    }
});
