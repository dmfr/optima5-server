Ext.define("Sch.crud.encoder.Xml", {
    requires: ["Ext.XTemplate"],
    format: "xml",
    stringReplaces: [
        [/&/g, "&amp;"],
        [/</g, "&lt;"],
        [/>/g, "&gt;"],
        [/"/g, "&quot;"]
    ],
    encodeString: function(e) {
        if (!e) {
            return e
        }
        var a = e.toString(),
            c = this.stringReplaces;
        for (var d = 0, b = c.length; d < b; d++) {
            a = a.replace(c[d][0], c[d][1])
        }
        return a
    },
    encodeRecords: function(c) {
        var a = "";
        for (var d = 0, b = c.length; d < b; d++) {
            a += this.encodeRecord(c[d])
        }
        return a
    },
    encodeRecord: function(b) {
        var a = "<record>";
        for (var c in b) {
            var d = b[c];
            a += '<field id="' + this.encodeString(c) + '">' + (d && d.$store ? this.encodeStoreChanges({
                storeId: c
            }, d) : this.encodeString(d)) + "</field>"
        }
        a += "</record>";
        return a
    },
    encodeStoreChanges: function(b, c) {
        var a = '<store id="' + this.encodeString(b.storeId) + '">';
        if (c.added) {
            a += "<added>" + this.encodeRecords(c.added) + "</added>"
        }
        if (c.updated) {
            a += "<updated>" + this.encodeRecords(c.updated) + "</updated>"
        }
        if (c.removed) {
            a += "<removed>" + this.encodeRecords(c.removed) + "</removed>"
        }
        a += "</store>";
        return a
    },
    encode: function(e) {
        var a, d, b, c;
        switch (e.type) {
            case "load":
                a = '<load requestId="' + this.encodeString(e.requestId) + '">';
                for (d = 0, b = e.stores.length; d < b; d++) {
                    c = e.stores[d];
                    if (typeof c === "string") {
                        a += '<store id="' + this.encodeString(c) + '"/>'
                    } else {
                        a += '<store id="' + this.encodeString(c.storeId) + '" page="' + this.encodeString(c.page) + '" pageSize="' + this.encodeString(c.pageSize) + '"/>'
                    }
                }
                a += "</load>";
                return a;
            case "sync":
                a = '<sync requestId="' + this.encodeString(e.requestId) + '" revision="' + this.encodeString(e.revision) + '">';
                for (d in e) {
                    if (e.hasOwnProperty(d)) {
                        c = this.getStore(d);
                        if (c) {
                            a += this.encodeStoreChanges(c, e[d])
                        }
                    }
                }
                a += "</sync>";
                break
        }
        return a
    },
    stringToXML: function(b) {
        if (!b) {
            return
        }
        var a;
        if (window.DOMParser) {
            a = (new DOMParser()).parseFromString(b, "text/xml")
        } else {
            if (window.ActiveXObject) {
                a = new ActiveXObject("Microsoft.XMLDOM");
                a.async = false;
                a.loadXML(b)
            }
        }
        return a
    },
    decodeRecords: function(d) {
        var b = [];
        for (var c = 0, a = d.length; c < a; c++) {
            b.push(this.decodeRecord(d[c]))
        }
        return b
    },
    decodeRecord: function(f) {
        var b = f.childNodes,
            a = {},
            g;
        for (var e = 0, c = b.length; e < c; e++) {
            var h = b[e];
            if (h.nodeName == "field") {
                g = "";
                if (h.firstChild) {
                    var d = this.getElementByTagName(h, "store");
                    g = d ? this.decodeStore(d) : h.firstChild.nodeValue
                }
                a[h.getAttribute("id")] = g
            }
        }
        return a
    },
    getElementsByTagName: function(f, c) {
        var e = f.childNodes,
            b = [];
        for (var d = 0, a = e.length; d < a; d++) {
            if (e[d].nodeName == c) {
                b.push(e[d])
            }
        }
        return b
    },
    getElementByTagName: function(e, b) {
        var d = e.childNodes;
        for (var c = 0, a = d.length; c < a; c++) {
            if (d[c].nodeName == b) {
                return d[c]
            }
        }
    },
    decodeStore: function(a) {
        var d = {},
            c = this.getElementsByTagName(a, "rows");
        if (c.length) {
            d.rows = this.decodeRecords(this.getElementsByTagName(c[0], "record"));
            var b = parseInt(c[0].getAttribute("total"), 10);
            if (isNaN(b) || b < d.rows.length) {
                b = d.rows.length
            }
            d.total = b
        }
        var e = this.getElementByTagName(a, "removed");
        if (e) {
            d.removed = this.decodeRecords(this.getElementsByTagName(e, "record"))
        }
        return d
    },
    decode: function(a) {
        var d = typeof a == "string" ? this.stringToXML(a) : a;
        if (!d) {
            return
        }
        var k = {},
            e = d.documentElement,
            g = e.getElementsByTagName("store"),
            f, h;
        k.requestId = e.getAttribute("requestId");
        k.revision = e.getAttribute("revision");
        k.success = e.getAttribute("success") || "false";
        k.success = k.success.toLowerCase() == "true";
        if (!k.success) {
            k.code = e.getAttribute("code");
            var j = e.getElementsByTagName("message")[0];
            k.message = j && j.firstChild && j.firstChild.nodeValue
        }
        for (var c = 0, b = g.length; c < b; c++) {
            f = g[c];
            h = f.getAttribute("id");
            if (this.getStore(h)) {
                k[h] = this.decodeStore(f)
            }
        }
        return k
    }
});
