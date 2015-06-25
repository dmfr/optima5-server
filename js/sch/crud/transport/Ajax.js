Ext.define("Sch.crud.transport.Ajax", {
    defaultMethod: {
        load: "GET",
        sync: "POST"
    },
    cancelRequest: function(a) {
        Ext.Ajax.abort(a)
    },
    sendRequest: function(b) {
        var c = b.data,
            d = this.transport[b.type],
            e = d.paramName,
            f = Ext.apply({}, d && d.params),
            g = d.method || this.defaultMethod[b.type];
        var a = Ext.apply({
            url: d.url,
            method: g,
            params: f,
            failure: b.failure,
            success: function(h, i) {
                if (b.success) {
                    b.success.call(b.scope || this, h.responseXml || h.responseText)
                }
            },
            scope: b.scope
        }, d.requestConfig);
        if (!e) {
            if (this.format === "xml") {
                Ext.apply(a, {
                    xmlData: c
                })
            } else {
                Ext.apply(a, {
                    jsonData: c
                })
            }
        } else {
            a.params = a.params || {};
            a.params[e] = c
        }
        this.fireEvent("beforesend", this, f, b.type, a);
        return Ext.Ajax.request(a)
    }
});
