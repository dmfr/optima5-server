Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoListSubpanel',{
	extend:'Ext.panel.Panel',
	
	requires : [
		'Ext.ux.ComponentRowExpander',
		'Ext.ux.grid.FiltersFeature',
		'Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel'
	],
	
	initComponent: function() {
		var me = this ;
		
		if( (me.parentBrowserPanel) instanceof Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoListSubpanel','No parent reference ?') ;
		}
		me.optimaModule = me.parentBrowserPanel.optimaModule ;
		
		Ext.apply(me,{
			layout:'border',
			items:[{
				region:'center',
				itemId: 'pCenter',
				flex:3,
				layout:'fit',
				border:false,
				xtype:'gridpanel',
				store: {
					model: 'WbMrfoxyPromoListModel',
					autoLoad: true,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_wb_mrfoxy',
							_action: 'promo_getGrid'
						},
						reader: {
							type: 'json',
							root: 'data'
						}
					}),
					listeners: {
						beforeload: function(store,options) {
							options.params = options.params || {};
							var params = {
								filter_country: me.parentBrowserPanel.filterCountry
							} ;
							Ext.apply(options.params, params);
						},
						load: function(store) {
							//store.sort('people_name') ;
						}
					}
				},
				progressRenderer: (function () {
					return function(progress,text) {
					};
				})(),
				columns: {
					defaults:{
						menuDisabled: true,
						draggable: false,
						sortable: true,
						hideable: false,
						resizable: false
					},
					items:[{
						text: '',
						width: 24,
						renderer: function( value, metaData, record ) {
							var iconurl = Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetById(record.get('country_code')).get('country_iconurl') ;
							metaData.style = 'background: url(\''+iconurl+'\') no-repeat center center';
							return '' ;
						}
					},{
						text: '<b>Promo#</b>',
						dataIndex: 'promo_id',
						width: 150,
						renderer: function(v) {
							return '<b>'+v+'</b>' ;
						}
					},{
						text: 'Status',
						width: 100,
						renderer: function(v,m,record) {
							var tmpProgress = record.get('status_percent') / 100 ;
							var tmpText = record.get('status_text') ;
								var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
								b.updateProgress(tmpProgress,tmpText);
								v = Ext.DomHelper.markup(b.getRenderTree());
								b.destroy() ;
							return v;
						}
					},{
						text: 'Date start',
						dataIndex: 'date_start',
						width: 80,
						renderer: function(v) {
							return '<b>'+v+'</b>' ;
						},
						menuDisabled:false,
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						}
					},{
						text: 'weeks',
						dataIndex: 'date_length_weeks',
						width: 45,
						renderer: function(v) {
							return '<b>'+v+'</b>' ;
						}
					},{
						text: 'Stores',
						dataIndex: 'store_text',
						width: 100,
						menuDisabled:false,
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: 'IRI_STORE'
						}
					},{
						text: 'Products',
						dataIndex: 'prod_text',
						width: 100,
						menuDisabled:false,
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: 'IRI_PROD'
						}
					},{
						text: 'Mechanics',
						dataIndex: 'mechanics_text',
						width: 250,
						menuDisabled:false,
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: 'PROMO_MECH'
						}
					}]
				},
				features: [{
					ftype: 'filters',
					encode: true
				}],
				plugins: [{
					ptype:'cmprowexpander',
					pluginId: 'rowexpander',
					expandOnDblClick: true,
					createComponent: function(view, record, rowNode, rowIndex) {
						return Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel', {
							forceFit: true,
							height: 190,
							rowRecord: record,
							optimaModule: me.optimaModule,
							listeners:{
								datachanged: function() {
									me.reload() ;
								},
								scope:me
							}
						})
					}
				}],
				viewConfig:{
					plugins: [{
						ptype: 'gridviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'PromoToBenchmark'+me.getId()
					}],
					listeners: {
						render: function(gridview) {
							Ext.create('Ext.dd.DropZone',gridview.getEl(),{
								ddGroup: 'BenchmarkToPromo'+me.getId(),
								view: gridview,
								
								getTargetFromEvent : function(e) {
									var node = e.getTarget(this.view.getItemSelector()) ;
									return node ;
								},
								getTargetNode: function( node ) {
									var view = this.view,
										targetNode = view.getRecord(node) ;
										
									if( targetNode==null ) {
										return null ;
									}
									return targetNode ;
								},
								
								onNodeOver: function(node,dragZone,e,data) {
									var targetNode = this.getTargetNode(node) ;
										
									if( targetNode==null ) {
										return this.dropNotAllowed ;
									}
									return this.dropAllowed ;
								},
								onNodeDrop: function(node,dragZone,e,data) {
									var targetNode = this.getTargetNode(node) ;
										
									if( targetNode==null ) {
										return false ;
									}
									
									me.handleSaveBenchmark( targetNode ) ;
									return true ;
								}
							}) ;
						}
					}
				},
				listeners: {
					itemcontextmenu : function(view, record, item, index, event) {
						Ext.create('Ext.menu.Menu',{
							listeners: {
								hide: function(m) {
									m.destroy() ;
								}
							},
							items : [{
								iconCls: 'icon-bible-new',
								text: 'Load/edit benchmark',
								handler : function() {
									this.populateBenchmark( Ext.JSON.decode( record.get('benchmark_arr_ids'), true ) ) ;
								},
								scope: this
							}]
						}).showAt(event.getXY()) ;
					},
					scope: this
				}
			},{
				region:'east',
				itemId: 'pEast',
				flex:1,
				layout:'fit',
				collapsible: true,
				collapsed: true,
				title: 'Benckmarking',
				headerPosition: 'left',
				//border:false,
				xtype:'gridpanel',
				store: {
					model: 'WbMrfoxyPromoListModel',
					data:[],
					sorters:[{
						property : 'promo_id',
						direction: 'ASC'
					}]
				},
				columns:[{
					flex:1,
					menuDisabled: true,
					text: '<b>Promo#</b>',
					dataIndex: 'promo_id',
					width: 150,
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				}],
				emptyText: 'Drag & drop records from left view to define a benchmark',
				deferEmptyText: false,
				viewConfig: {
					deferEmptyText: false,
					listeners: {
						render: function(gridview) {
							var view = this,
								gridPanelDropTargetEl = view.getEl();
							Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
								view: view,
								ddGroup: 'PromoToBenchmark'+me.getId(),
								notifyEnter: function(ddSource, e, data) {
									//Add some flare to invite drop.
									this.view.getEl().stopAnimation();
									this.view.getEl().highlight();
								},
								notifyDrop: function(ddSource, e, data){
									view.getStore().add( ddSource.dragData.records ) ;
									return true;
								}
							});
						}
					}
				},
				tbar:[{
					iconCls: 'op5-spec-mrfoxy-promolist-benchmark-goicon',
					text: 'Benchmark',
					handler: function() {
						this.fetchBenchmark() ;
					},
					scope:me
				},'->',{
					iconCls: 'op5-spec-mrfoxy-promolist-benchmark-saveicon',
					text: 'Assign',
					handler: function() {
						var grid = this.up('gridpanel'),
							gridviewEl = grid.getView().getEl() ;
						if( grid.savedragPanel != null ){
							grid.savedragPanel.destroy() ;
						}
						grid.savedragPanel = Ext.create('Ext.panel.Panel',{
							frame: true,
							items: [{
								xtype: 'component',
								padding: '0px 0px 0px 0px',
								overCls: 'op5-spec-mrfoxy-benchmarkassign-go-over',
								renderTpl: Ext.create('Ext.XTemplate',
									'<div class="op5-spec-mrfoxy-benchmarkassign-go">',
									'<div class="op5-spec-mrfoxy-benchmarkassign-go-btn">',
									'</div>',
									'</div>',
									{
										compiled:true,
										disableFormats: true
									}
								),
								renderData: {
									text: 'Drag icon to assign benchmark'
								},
								listeners: {
									afterrender: function(c) {
										//c.getEl().on('click',this.handleSubmit,this) ;
										var iconEl = Ext.DomQuery.selectNode('div.op5-spec-mrfoxy-benchmarkassign-go-btn', c.getEl().dom);
										Ext.create('Ext.dd.DragSource', iconEl, {
											view: iconEl,
											ddGroup: 'BenchmarkToPromo'+me.getId(),
										}) ;
									},
									destroy: function() {
										grid.savedragPanel = null ;
									},
									scope: this
								}
							},{
								xtype: 'component',
								renderTpl: Ext.create('Ext.XTemplate',
									'<div class="op5-spec-mrfoxy-benchmarkassign-lgd">',
									'{text}',
									'</div>',
									{
										compiled:true,
										disableFormats: true
									}
								),
								renderData: {
									text: 'Drag icon to assign benchmark'
								},
							}],
							
							floating: true,
							renderTo: gridviewEl,
							tools: [{
								type: 'close',
								handler: function(e, t, p) {
									p.ownerCt.destroy();
								}
							}]
						});
						// Size + position
						grid.savedragPanel.setSize({
							width: 150,
							height: 120
						}) ;
						grid.savedragPanel.show();
						grid.savedragPanel.getEl().alignTo(gridviewEl, 'c-c?');
					}
				}],
				listeners: {
					itemcontextmenu : function(view, record, item, index, event) {
						Ext.create('Ext.menu.Menu',{
							listeners: {
								hide: function(m) {
									m.destroy() ;
								}
							},
							items : [{
								iconCls: 'icon-bible-delete',
								text: 'Discard selected',
								handler : function() {
									view.getStore().remove( record ) ;
								}
							},{
								iconCls: 'icon-bible-delete',
								text: 'Discard all',
								handler : function() {
									view.getStore().removeAll() ;
								}
							}]
						}).showAt(event.getXY()) ;
					},
					destroy: function(grid) {
						if( grid.savedragPanel != null ) {
							grid.savedragPanel.destroy() ;
						}
					}
				}
			}]
		}); 
		
		this.callParent() ;
		
		me.mon(me.parentBrowserPanel,'tbarselect',function(){
			me.reload() ;
		},me) ;
	},
	reload: function() {
		this.getComponent('pCenter').getStore().load() ;
	},
	populateBenchmark: function( arrFilerecordId ) {
		if( arrFilerecordId == null ) {
			this.getComponent('pEast').getStore().removeAll() ;
			this.getComponent('pEast').collapse() ;
			return ;
		}
		
		var loadmask = new Ext.LoadMask(this, {msg:"Please wait..."});
		loadmask.show() ;
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'promo_getGrid',
			filter_id: Ext.JSON.encode(arrFilerecordId)
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				loadmask.destroy() ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					return ;
				}
				if( Ext.isArray(ajaxData.data) ) {
					this.getComponent('pEast').getStore().loadRawData(ajaxData.data) ;
					this.getComponent('pEast').expand() ;
				}
			},
			scope: this
		}) ;
	},
	handleSaveBenchmark: function( targetRecord ) {
		var msg ;
		if( this.getComponent('pEast').getStore().getCount() > 0 ) {
			msg = 'Assign benchmark on promo '+targetRecord.get('promo_id')+' ?' ;
		} else {
			msg = 'Clear benchmark definition for promo '+targetRecord.get('promo_id')+' ?' ;
		}
		Ext.MessageBox.confirm('Assign benchmark',msg, function(buttonStr) {
			if( buttonStr=='yes' ) {
				this.doSaveBenchmark(targetRecord) ;
			}
		},this) ;
	},
	doSaveBenchmark: function( targetRecord ) {
		var benchmark_arr_ids,
			benchmarkStore = this.getComponent('pEast').getStore() ;
		if( benchmarkStore.getCount() == 0 ) {
			benchmark_arr_ids = null ;
		} else {
			benchmark_arr_ids = [] ;
			benchmarkStore.each( function(rec) {
				benchmark_arr_ids.push( rec.get('_filerecord_id') ) ;
			}) ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'promo_assignBenchmark',
			_filerecord_id: targetRecord.get('_filerecord_id'),
			benchmark_arr_ids: ( benchmark_arr_ids != null ? Ext.JSON.encode(benchmark_arr_ids) : '' )
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function() {
				targetRecord.set('benchmark_arr_ids',ajaxParams['benchmark_arr_ids']) ;
			},
			scope: this
		}) ;
	},
	fetchBenchmark: function() {
		var me = this ;
		
		var benchmark_arr_ids = [],
			benchmarkStore = this.getComponent('pEast').getStore() ;
		benchmarkStore.each( function(rec) {
			benchmark_arr_ids.push( rec.get('_filerecord_id') ) ;
		}) ;
		
		if( benchmark_arr_ids.length == 0 ) {
			Ext.MessageBox.alert('Empty list','Benchmark list is empty !') ;
			return ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_fetchBenchmark',
				benchmark_arr_ids: Ext.JSON.encode(benchmark_arr_ids)
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText),
					cntChart = me.query('#cntChart')[0] ;
				
				if( ajaxData.success != true ) {
					Ext.MessageBox.alert('Failed','Failed to build benchmark') ;
					return ;
				}
				me.optimaModule.createWindow({
					layout:'fit',
					title: 'Direct benchmark',
					width: 800,
					height: 400,
					items: [{
						xtype:'op5crmbasequeryresultchartstatic',
						optimaModule: me.optimaModule,
						ajaxBaseParams: {},
						RESchart_static: ajaxData.RESchart_static,
						drawChartLegend: true
					}]
				}) ;
			},
			scope: me
		}) ;
	}
});