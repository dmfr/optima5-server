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
				layout:'fit',
				border:false,
				xtype:'gridpanel',
				store: {
					model: 'WbMrfoxyPromoModel',
					autoLoad: false,
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
								filter_country: me.parentBrowserPanel.filterCountry,
								filter_isProd: (me.parentBrowserPanel.filterIsProd ? 1:0)
							} ;
							Ext.apply(options.params, params);
						},
						load: function(store) {
							// why previous H4CK on PromoBrowserPanel ? : we need to make sure grid filters have been set -before- this call
							// ... because show/hide column headers triggers headerCt getMenu() and this should not happen before FilterFeature::addEvents
							var headerCt = me.getComponent('pCenter').headerCt,
								isProd = me.parentBrowserPanel.filterIsProd ;
							headerCt.down('[isColumnStatus]')[isProd ? 'show' : 'hide']();
							headerCt.down('[isColumnBrand]')[!isProd ? 'show' : 'hide']();
						},
						scope: me
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
						resizable: true
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
						width: 175,
						renderer: function(v) {
							return '<b>'+v+'</b>' ;
						}
					},{
						text: 'Status',
						isColumnStatus: true,
						width: 100,
						renderer: function(v,m,record) {
							var tmpProgress = record.get('status_percent') / 100 ;
							var tmpText = record.get('status_text') ;
								var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
								if( record.get('status_color') ) {
									//b.setStyle(
								}
								b.updateProgress(tmpProgress,tmpText);
								v = Ext.DomHelper.markup(b.getRenderTree());
								b.destroy() ;
							return v;
						}
					},{
						text: 'Brand',
						//itemId: 'columnBrand',
						isColumnBrand: true,
						dataIndex: 'brand_text',
						width: 100,
						menuDisabled:false,
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: '_BRAND'
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
						width: 50,
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
					expandOnDblClick: false,
					expandOnEnter: false,
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
								editpromo: function(promoRecord) {
									me.parentBrowserPanel.fireEvent('editpromo',promoRecord) ;
								},
								scope:me
							}
						})
					}
				}],
				viewConfig:{
					plugins: [{
						ptype: 'gridviewdragdrop',
						enableDrag: false,
						enableDrop: false,
						ddGroup: 'PromoToBenchmark'+me.getId()
					}],
					listeners: {
						destroy: function(gridview) {
							if( gridview.ddel ) {
								gridview.ddel.destroy() ;
							}
						},
						render: function(gridview) {
							gridview.ddel = Ext.get(document.createElement('div'));
							gridview.ddel.addCls(Ext.baseCSSPrefix + 'grid-dd-wrap');
							
							Ext.create('Ext.dd.DragZone',gridview.getEl(),{
								ddGroup: 'PromoToBenchmark'+me.getId(),
								view: gridview,
								getDragData: function(e) {
									if( e.getTarget('div.x-grid-rowbody') ) {
										// on expanded row => quit
										return ;
									}
									var sourceEl = e.getTarget(this.view.getItemSelector());
									if (sourceEl) {
										var record = this.view.getRecord(sourceEl) ;
										this.view.ddel.update(record.get('promo_id')) ;
										return {
											ddel: this.view.ddel.dom,
											sourceEl: sourceEl,
											repairXY: Ext.fly(sourceEl).getXY(),
											sourceStore: this.view.store,
											record: record
										}
									}
								},
								getRepairXY: function() {
									return this.dragData.repairXY;
								}
							}) ;
							
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
				width: 200,
				layout:'fit',
				collapsible: true,
				collapsed: true,
				title: 'Benckmarking',
				headerPosition: 'left',
				//border:false,
				xtype:'gridpanel',
				store: {
					model: 'WbMrfoxyPromoModel',
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
									if( view.getStore().indexOf( ddSource.dragData.record ) == -1 ) {
										view.getStore().add( ddSource.dragData.record ) ;
									}
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
											ddGroup: 'BenchmarkToPromo'+me.getId()
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
								}
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
		
		me.mon(this.getComponent('pCenter').getStore(),'load',function(store){
			me.applyHeadlines() ;
		},me,{single:true});
		
		me.mon(me.parentBrowserPanel,'tbarselect',function(){
			if( me.rendered ) {
				me.getComponent('pCenter').filters.clearFilters() ;
				me.reload() ;
			} else {
				// Wait for render to trigger reload & columns reconfigure
				me.on('afterrender', function() { me.reload(); }, me) ;
			}
		},me) ;
	},
	reload: function() {
		this.getComponent('pCenter').getStore().load() ;
	},
	applyHeadlines: function() {
		Ext.defer(function() {
			var grid = this.getComponent('pCenter'),
				view = grid.getView(),
				rowExpander = grid.getPlugin('rowexpander'),
				store = grid.getStore(),
				count = Math.min(store.getCount(),this.nbHeadlines),
				idx = 0,
				node, record ;
			while( count > 0 ) {
				node = view.getNode(idx) ;
				if( node == null ) {
					break ;
				}
				record = view.getRecord(node) ;
				rowExpander.toggleRow(idx,record) ;
				idx++ ;
				count-- ;
			}
		},100,this) ;
	},
	setIsProd: function(isProd) {
		
	},
	
	populateBenchmark: function( arrFilerecordId ) {
		if( arrFilerecordId == null ) {
			this.getComponent('pEast').getStore().removeAll() ;
			this.getComponent('pEast').collapse() ;
			return ;
		}
		
		var loadmask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		});
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
	},
	
	handleDownload: function() {
		var me = this,
			grid = me.down('grid'),
			store = grid.getStore(),
			xlsColumns, xlsData ;
		
		xlsColumns = [] ;
		
		xlsColumns.push({
			dataIndex: 'country_code',
			text: 'Country'
		},{
			dataIndex: 'promo_id',
			text: 'Promo Key'
		}) ;
		
		if( me.parentBrowserPanel.filterIsProd ) {
			xlsColumns.push({
				dataIndex: 'status_percent',
				text: 'Completion(%)'
			},{
				dataIndex: 'status_text',
				text: 'Status'
			}) ;
		} else {
			xlsColumns.push({
				dataIndex: 'brand_text',
				text: 'Brand'
			}) ;
		}
		
		xlsColumns.push({
			dataIndex: 'date_supply_start',
			text: 'Supply starts'
		},{
			dataIndex: 'date_supply_end',
			text: 'Supply ends'
		},{
			dataIndex: 'date_start',
			text: 'In store starts'
		},{
			dataIndex: 'date_end',
			text: 'In store ends'
		},{
			dataIndex: 'store_text',
			text: 'Stores'
		},{
			dataIndex: 'prod_text',
			text: 'Products'
		},{
			dataIndex: 'mechanics_text',
			text: 'Promo mechanics'
		},{
			dataIndex: 'cost_billing_text',
			text: 'Billing mode'
		},{
			dataIndex: 'cost_forecast',
			text: 'Forecasted cost'
		},{
			dataIndex: 'cost_real',
			text: 'Real cost'
		},{
			dataIndex: 'calc_uplift_vol',
			text: 'Uplift (kg)'
		},{
			dataIndex: 'calc_uplift_per',
			text: 'Uplift (%)'
		},{
			dataIndex: 'calc_roi',
			text: 'ROI (%)'
		},{
			dataIndex: 'calc_nb_displays',
			text: 'Nb displays in store'
		},{
			dataIndex: 'obs_atl',
			text: 'ATL'
		},{
			dataIndex: 'obs_btl',
			text: 'BTL'
		},{
			dataIndex: 'obs_comment',
			text: 'Comments'
		}) ;
		
		xlsData = Ext.pluck( store.getRange(), 'data' ) ;
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'xls_getTableExport',
			data: Ext.JSON.encode({
				xlsColumns: xlsColumns,
				xlsData: xlsData,
				xlsFilename: 'WB_MRFOXY_promoGrid.xlsx'
			})
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
});