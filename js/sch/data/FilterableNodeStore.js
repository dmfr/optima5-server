Ext.define("Sch.data.FilterableNodeStore", {
    extend: "Ext.data.NodeStore",
    onNodeExpand: function (f, d, c) {
        var b = [];
        for (var e = 0; e < d.length; e++) {
            var a = d[e];
            if (!(a.isHidden && a.isHidden() || a.hidden || a.data.hidden)) {
                b[b.length] = a
            }
        }
        return this.callParent([f, b, c])
    },
    onNodeCollapse: function (e, c, b, h, d) {
        var f = this;
        var g = this.data;
        var a = g.contains;
        g.contains = function () {
            var m, l, o;
            var k = f.indexOf(e) + 1;
            var n = false;
            for (var j = 0; j < c.length; j++) {
                if (!c[j].hidden && a.call(this, c[j])) {
                    m = e;
                    while (m.parentNode) {
                        l = m;
                        do {
                            l = l.nextSibling
                        } while (l && l.hidden);
                        if (l) {
                            n = true;
                            o = f.indexOf(l);
                            break
                        } else {
                            m = m.parentNode
                        }
                    }
                    if (!n) {
                        o = f.getCount()
                    }
                    f.removeAt(k, o - k);
                    break
                }
            }
            return false
        };
        this.callParent(arguments);
        g.contains = a
    },
    onNodeAppend: function (d, f, b) {
        var e = this,
            a, c;
        if (e.isVisible(f)) {
            if (b === 0) {
                a = d
            } else {
                c = f;
                do {
                    c = c.previousSibling
                } while (c && c.hidden);
                if (!c) {
                    a = d
                } else {
                    while (c.isExpanded() && c.lastChild) {
                        c = c.lastChild
                    }
                    a = c
                }
            }
            e.insert(e.indexOf(a) + 1, f);
            if (!f.isLeaf() && f.isExpanded()) {
                if (f.isLoaded()) {
                    e.onNodeExpand(f, f.childNodes, true)
                } else {
                    if (!e.treeStore.fillCount) {
                        f.set("expanded", false);
                        f.expand()
                    }
                }
            }
        }
    }
});
