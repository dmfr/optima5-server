    Ext.define("Sch.feature.AbstractTimeSpan", {
        extend: "Ext.AbstractPlugin",
        mixins: {
            observable: "Ext.util.Observable"
        },
        lockableScope: "top",
        schedulerView: null,
        timeAxis: null,
        containerEl: null,
        expandToFitView: false,
        disabled: false,
        cls: null,
        clsField: "Cls",
        template: null,
        store: null,
        renderElementsBuffered: false,
        renderDelay: 15,
        refreshSizeOnItemUpdate: true,
        _resizeTimer: null,
        _renderTimer: null,
        showHeaderElements: false,
        headerTemplate: null,
        innerHeaderTpl: null,
        headerContainerCls: "sch-header-secondary-canvas",
        headerContainerEl: null,
        renderingDoneEvent: null,
        constructor: function(a) {
            this.uniqueCls = this.uniqueCls || ("sch-timespangroup-" + Ext.id());
            Ext.apply(this, a);
            this.mixins.observable.constructor.call(this);
            this.callParent(arguments)
        },
        setDisabled: function(a) {
            if (a) {
                this.removeElements()
            }
            this.disabled = a
        },
        removeElements: function() {
            this.removeBodyElements();
            if (this.showHeaderElements) {
                this.removeHeaderElements()
            }
        },
        getBodyElements: function() {
            if (this.containerEl) {
                return this.containerEl.select("." + this.uniqueCls)
            }
            return null
        },
        getHeaderContainerEl: function() {
            var c = this.headerContainerEl,
                b = Ext.baseCSSPrefix,
                a;
            if (!c || !c.dom) {
                if (this.schedulerView.isHorizontal()) {
                    a = this.panel.getHorizontalTimeAxisColumn().headerView.containerEl
                } else {
                    a = this.panel.el.down("." + b + "grid-inner-locked ." + b + "panel-body ." + b + "grid-view")
                }
                if (a) {
                    c = a.down("." + this.headerContainerCls);
                    if (!c) {
                        c = a.appendChild({
                            cls: this.headerContainerCls
                        })
                    }
                    this.headerContainerEl = c
                }
            }
            return c
        },
        getHeaderElements: function() {
            var a = this.getHeaderContainerEl();
            if (a) {
                return a.select("." + this.uniqueCls)
            }
            return null
        },
        removeBodyElements: function() {
            var a = this.getBodyElements();
            if (a) {
                a.each(function(b) {
                    b.destroy()
                })
            }
        },
        removeHeaderElements: function() {
            var a = this.getHeaderElements();
            if (a) {
                a.each(function(b) {
                    b.destroy()
                })
            }
        },
        getElementId: function(a) {
            return this.uniqueCls + "-" + a.internalId
        },
        getHeaderElementId: function(a) {
            return this.uniqueCls + "-header-" + a.internalId
        },
        getTemplateData: function(a) {
            return this.prepareTemplateData ? this.prepareTemplateData(a) : a.data
        },
        getElementCls: function(a, c) {
            var b = a.clsField || this.clsField;
            if (!c) {
                c = this.getTemplateData(a)
            }
            return this.cls + " " + this.uniqueCls + " " + (c[b] || "")
        },
        getHeaderElementCls: function(a, c) {
            var b = a.clsField || this.clsField;
            if (!c) {
                c = this.getTemplateData(a)
            }
            return "sch-header-indicator " + this.uniqueCls + " " + (c[b] || "")
        },
        init: function(a) {
            if (Ext.versions.touch && !a.isReady()) {
                a.on("viewready", function() {
                    this.init(a)
                }, this);
                return
            }
            if (Ext.isString(this.innerHeaderTpl)) {
                this.innerHeaderTpl = new Ext.XTemplate(this.innerHeaderTpl)
            }
            var b = this.innerHeaderTpl;
            if (!this.headerTemplate) {
                this.headerTemplate = new Ext.XTemplate('<tpl for=".">', '<div id="{id}" class="{cls}" style="{side}:{position}px;">' + (b ? "{[this.renderInner(values)]}" : "") + "</div>", "</tpl>", {
                    renderInner: function(c) {
                        return b.apply(c)
                    }
                })
            }
            this.schedulerView = a.getSchedulingView();
            this.panel = a;
            this.timeAxis = a.getTimeAxis();
            this.store = Ext.StoreManager.lookup(this.store);
            if (!this.store) {
                Ext.Error.raise("Error: You must define a store for this plugin")
            }
            if (!this.schedulerView.getEl()) {
                this.schedulerView.on({
                    afterrender: this.onAfterRender,
                    scope: this
                })
            } else {
                this.onAfterRender()
            }
        },
        onAfterRender: function(c) {
            var a = this.schedulerView;
            this.containerEl = a.getSecondaryCanvasEl();
            this.storeListeners = {
                load: this.renderElements,
                datachanged: this.renderElements,
                clear: this.renderElements,
                add: this.renderElements,
                remove: this.renderElements,
                update: this.refreshSingle,
                addrecords: this.renderElements,
                removerecords: this.renderElements,
                updaterecord: this.refreshSingle,
                expand: this.renderElements,
                collapse: this.renderElements,
                scope: this
            };
            this.store.on(this.storeListeners);
            a.on({
                bufferedrefresh: this.renderElements,
                refresh: this.renderElements,
                itemadd: this.refreshSizeOnItemUpdate ? this.refreshSizes : this.renderElements,
                itemremove: this.refreshSizeOnItemUpdate ? this.refreshSizes : this.renderElements,
                itemupdate: this.refreshSizeOnItemUpdate ? this.refreshSizes : this.renderElements,
                groupexpand: this.renderElements,
                groupcollapse: this.renderElements,
                columnwidthchange: this.renderElements,
                resize: this.renderElements,
                scope: this
            });
            if (a.headerCt) {
                a.headerCt.on({
                    add: this.renderElements,
                    remove: this.renderElements,
                    scope: this
                })
            }
            this.panel.on({
                viewchange: this.renderElements,
                show: this.refreshSizes,
                modechange: this.forceNewRenderingTimeout,
                scope: this
            });
            var b = a.getRowContainerEl();
            if (b && b.down(".sch-timetd")) {
                this.renderElements()
            }
        },
        forceNewRenderingTimeout: function() {
            this.renderElementsBuffered = false;
            clearTimeout(this._renderTimer);
            clearTimeout(this._resizeTimer);
            this.renderElements()
        },
        refreshSizesInternal: function() {
            if (!this.schedulerView.isDestroyed && this.schedulerView.isHorizontal()) {
                var a = this.schedulerView.getTimeSpanRegion(new Date(), null, this.expandToFitView);
                this.getBodyElements().setHeight(a.bottom - a.top)
            }
        },
        refreshSizes: function() {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = Ext.Function.defer(this.refreshSizesInternal, this.renderDelay, this)
        },
        renderElements: function() {
            if (this.renderElementsBuffered || this.disabled) {
                return
            }
            this.renderElementsBuffered = true;
            clearTimeout(this._renderTimer);
            this._renderTimer = Ext.Function.defer(this.renderElementsInternal, this.renderDelay, this)
        },
        setElementX: function(b, a) {
            if (this.panel.rtl) {
                b.setRight(a)
            } else {
                b.setLeft(a)
            }
        },
        getHeaderElementPosition: function(b) {
            var a = this.schedulerView.getTimeAxisViewModel();
            return Math.round(a.getPositionFromDate(b))
        },
        renderBodyElementsInternal: function(a) {
            Ext.DomHelper.append(this.containerEl, this.generateMarkup(false, a))
        },
        getHeaderElementData: function(a, b) {
            throw "Abstract method call"
        },
        renderHeaderElementsInternal: function(a) {
            var b = this.getHeaderContainerEl();
            if (b) {
                Ext.DomHelper.append(b, this.generateHeaderMarkup(false, a))
            }
        },
        renderElementsInternal: function() {
            this.renderElementsBuffered = false;
            if (this.disabled || this.schedulerView.isDestroyed) {
                return
            }
            if (Ext.versions.extjs && !this.schedulerView.el.down("." + Ext.baseCSSPrefix + "grid-item-container")) {
                return
            }
            this.removeElements();
            this.renderBodyElementsInternal();
            if (this.showHeaderElements) {
                this.headerContainerEl = null;
                this.renderHeaderElementsInternal()
            }
            if (this.renderingDoneEvent) {
                this.fireEvent(this.renderingDoneEvent, this)
            }
        },
        generateMarkup: function(c, b) {
            var e = this.timeAxis.getStart(),
                a = this.timeAxis.getEnd(),
                d = this.getElementData(e, a, b, c);
            return this.template.apply(d)
        },
        generateHeaderMarkup: function(b, a) {
            var c = this.getHeaderElementData(a, b);
            return this.headerTemplate.apply(c)
        },
        getElementData: function(d, c, a, b) {
            throw "Abstract method call"
        },
        updateBodyElement: function(b) {
            var c = Ext.get(this.getElementId(b));
            if (c) {
                var e = this.timeAxis.getStart(),
                    a = this.timeAxis.getEnd(),
                    d = this.getElementData(e, a, [b])[0];
                if (d) {
                    c.dom.className = d.$cls;
                    c.setTop(d.top);
                    this.setElementX(c, d.left);
                    c.setSize(d.width, d.height)
                } else {
                    Ext.destroy(c)
                }
            } else {
                this.renderBodyElementsInternal([b])
            }
        },
        updateHeaderElement: function(a) {
            var b = Ext.get(this.getHeaderElementId(a));
            if (b) {
                var c = this.getHeaderElementData([a])[0];
                if (c) {
                    b.dom.className = c.cls;
                    if (this.schedulerView.isHorizontal()) {
                        this.setElementX(b, c.position);
                        b.setWidth(c.size)
                    } else {
                        b.setTop(c.position);
                        b.setHeight(c.size)
                    }
                } else {
                    Ext.destroy(b)
                }
            } else {
                this.renderHeaderElementsInternal([a])
            }
        },
        destroy: function() {
            clearTimeout(this._renderTimer);
            clearTimeout(this._resizeTimer);
            if (this.store.autoDestroy) {
                this.store.destroy()
            }
            this.store.un(this.storeListeners)
        },
        refreshSingle: function(b, a) {
            a = a instanceof Array ? a : [a];
            Ext.Array.forEach(a, function(c) {
                this.updateBodyElement(c);
                if (this.showHeaderElements) {
                    this.updateHeaderElement(c)
                }
            }, this)
        }
    })
