Ext.define("Sch.widget.ResizePicker", {
    extend: "Ext.Panel",
    alias: "widget.dualrangepicker",
    width: 200,
    height: 200,
    border: true,
    collapsible: false,
    bodyStyle: "position:absolute; margin:5px",
    verticalCfg: {
        height: 120,
        value: 24,
        increment: 2,
        minValue: 20,
        maxValue: 80,
        reverse: true,
        disabled: true
    },
    horizontalCfg: {
        width: 120,
        value: 100,
        minValue: 25,
        increment: 5,
        maxValue: 200,
        disable: true
    },
    initComponent: function () {
        var a = this;
        a.addEvents("change", "changecomplete", "select");
        a.horizontalCfg.value = a.dialogConfig.columnWidth;
        a.verticalCfg.value = a.dialogConfig.rowHeight;
        a.verticalCfg.disabled = a.dialogConfig.scrollerDisabled || false;
        a.dockedItems = [a.vertical = new Ext.slider.Single(Ext.apply({
            dock: "left",
            style: "margin-top:10px",
            vertical: true,
            listeners: {
                change: a.onSliderChange,
                changecomplete: a.onSliderChangeComplete,
                scope: a
            }
        }, a.verticalCfg)), a.horizontal = new Ext.slider.Single(Ext.apply({
            dock: "top",
            style: "margin-left:28px",
            listeners: {
                change: a.onSliderChange,
                changecomplete: a.onSliderChangeComplete,
                scope: a
            }
        }, a.horizontalCfg))];
        a.callParent(arguments)
    },
    afterRender: function () {
        var b = this;
        b.addCls("sch-ux-range-picker");
        b.valueHandle = this.body.createChild({
            cls: "sch-ux-range-value",
            cn: {
                tag: "span"
            }
        });
        b.valueSpan = this.valueHandle.down("span");
        var a = new Ext.dd.DD(this.valueHandle);
        Ext.apply(a, {
            startDrag: function () {
                b.dragging = true;
                this.constrainTo(b.body)
            },
            onDrag: function () {
                b.onHandleDrag.apply(b, arguments)
            },
            endDrag: function () {
                b.onHandleEndDrag.apply(b, arguments);
                b.dragging = false
            },
            scope: this
        });
        this.setValues(this.getValues());
        this.callParent(arguments);
        this.body.on("click", this.onBodyClick, this)
    },
    onBodyClick: function (c, a) {
        var b = [c.getXY()[0] - 8 - this.body.getX(), c.getXY()[1] - 8 - this.body.getY()];
        this.valueHandle.setLeft(Ext.Number.constrain(b[0], 0, this.getAvailableWidth()));
        this.valueHandle.setTop(Ext.Number.constrain(b[1], 0, this.getAvailableHeight()));
        this.setValues(this.getValuesFromXY([this.valueHandle.getLeft(true), this.valueHandle.getTop(true)]));
        this.onSliderChangeComplete()
    },
    getAvailableWidth: function () {
        return this.body.getWidth() - 18
    },
    getAvailableHeight: function () {
        return this.body.getHeight() - 18
    },
    onHandleDrag: function () {
        this.setValues(this.getValuesFromXY([this.valueHandle.getLeft(true), this.valueHandle.getTop(true)]))
    },
    onHandleEndDrag: function () {
        this.setValues(this.getValuesFromXY([this.valueHandle.getLeft(true), this.valueHandle.getTop(true)]))
    },
    getValuesFromXY: function (d) {
        var c = d[0] / this.getAvailableWidth();
        var a = d[1] / this.getAvailableHeight();
        var e = Math.round((this.horizontalCfg.maxValue - this.horizontalCfg.minValue) * c);
        var b = Math.round((this.verticalCfg.maxValue - this.verticalCfg.minValue) * a) + this.verticalCfg.minValue;
        return [e + this.horizontalCfg.minValue, b]
    },
    getXYFromValues: function (d) {
        var b = this.horizontalCfg.maxValue - this.horizontalCfg.minValue;
        var f = this.verticalCfg.maxValue - this.verticalCfg.minValue;
        var a = Math.round((d[0] - this.horizontalCfg.minValue) * this.getAvailableWidth() / b);
        var c = d[1] - this.verticalCfg.minValue;
        var e = Math.round(c * this.getAvailableHeight() / f);
        return [a, e]
    },
    updatePosition: function () {
        var a = this.getValues();
        var b = this.getXYFromValues(a);
        this.valueHandle.setLeft(Ext.Number.constrain(b[0], 0, this.getAvailableWidth()));
        if (this.verticalCfg.disabled) {
            this.valueHandle.setTop(this.dialogConfig.rowHeight)
        } else {
            this.valueHandle.setTop(Ext.Number.constrain(b[1], 0, this.getAvailableHeight()))
        }
        this.positionValueText();
        this.setValueText(a)
    },
    positionValueText: function () {
        var a = this.valueHandle.getTop(true);
        var b = this.valueHandle.getLeft(true);
        this.valueSpan.setLeft(b > 30 ? -30 : 10);
        this.valueSpan.setTop(a > 10 ? -20 : 20)
    },
    setValueText: function (a) {
        if (this.verticalCfg.disabled) {
            a[1] = this.dialogConfig.rowHeight
        }
        this.valueSpan.update("[" + a.toString() + "]")
    },
    setValues: function (a) {
        this.horizontal.setValue(a[0]);
        if (this.verticalCfg.reverse) {
            if (!this.verticalCfg.disabled) {
                this.vertical.setValue(this.verticalCfg.maxValue + this.verticalCfg.minValue - a[1])
            }
        } else {
            if (!this.verticalCfg.disabled) {
                this.vertical.setValue(a[1])
            }
        } if (!this.dragging) {
            this.updatePosition()
        }
        this.positionValueText();
        this.setValueText(a)
    },
    getValues: function () {
        if (!this.verticalCfg.disabled) {
            var a = this.vertical.getValue();
            if (this.verticalCfg.reverse) {
                a = this.verticalCfg.maxValue - a + this.verticalCfg.minValue
            }
            return [this.horizontal.getValue(), a]
        }
        return [this.horizontal.getValue()]
    },
    onSliderChange: function () {
        this.fireEvent("change", this, this.getValues());
        if (!this.dragging) {
            this.updatePosition()
        }
    },
    onSliderChangeComplete: function () {
        this.fireEvent("changecomplete", this, this.getValues())
    },
    afterLayout: function () {
        this.callParent(arguments);
        this.updatePosition()
    }
});
