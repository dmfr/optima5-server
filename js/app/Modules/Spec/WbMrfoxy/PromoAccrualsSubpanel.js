Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoAccrualsSubpanel',{
	extend:'Ext.panel.Panel',
	
	requires : [
		'Ext.ux.ComponentRowExpander',
		'Ext.ux.grid.FiltersFeature',
		'Optima5.Modules.Spec.WbMrfoxy.PromoBillbackGrid'
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
								filter_isProd: 1
							} ;
							Ext.apply(options.params, params);
						},
						load: function(store) {
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
						hidden: true,
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
						text: 'Month',
						dataIndex: 'date_month',
						width: 60,
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
						text: 'SSL',
						dataIndex: 'obs_shortshelflife',
						width: 50,
						renderer: function(v,metaData) {
							if( v ) {
								metaData.style += ';font-weight:bold;'
								return 'X' ;
							}
						}
					},{
						text: 'Billing',
						dataIndex: 'cost_billing_text',
						width: 75,
						menuDisabled:false
					},{
						text: '<b>Acr:</b> Forecast',
						width: 100,
						menuDisabled:true,
						dataIndex: 'cost_forecast',
						tdCls: 'op5-spec-mrfoxy-financebudget-celltotal',
						align: 'right',
						xtype: 'numbercolumn',
						renderer: function(v,m,record) {
							return Ext.util.Format.number( v, '0,0' ) + ' ' + record.get('currency_symbol') ;
						}
					},{
						text: '<b>Acc:</b> Received',
						width: 100,
						menuDisabled:true,
						dataIndex: 'cost_real',
						tdCls: 'op5-spec-mrfoxy-financebudget-celltotal',
						align: 'right',
						xtype: 'numbercolumn',
						renderer: function(v,m,record) {
							return Ext.util.Format.number( v, '0,0' ) + ' ' + record.get('currency_symbol') ;
						}
					},{
						text: '<b>Acr:</b> <b>A-B</b>',
						width: 100,
						menuDisabled:false,
						tdCls: 'op5-spec-mrfoxy-financebudget-celltotal',
						align: 'right',
						xtype: 'numbercolumn',
						renderer: function(v,m,record) {
							if( record.get('cost_real_is_calc') ) {
								m.tdCls += ' ' + 'op5-spec-dbspeople-realcolor-open' ;
								return 0 ;
							}
							var calcValue = record.get('cost_forecast') - record.get('cost_real') ;
							return Ext.util.Format.number( calcValue, '0,0' ) + ' ' + record.get('currency_symbol') ;
						}
					},{
						text: 'Currency',
						dataIndex: 'currency',
						width: 75,
						align: 'right',
						menuDisabled:false
					}]
				},
				features: [{
					ftype: 'filters',
					encode: true
				}],
				listeners: {
					itemclick: function(view, record, item, index, event) {
						var contextMenuItems = new Array() ;
						if( !record.get('cost_billing__autoclose') ) {
							contextMenuItems.push({
								iconCls: 'op5-spec-mrfoxy-promorow-action-icon-billback',
								text: 'Billback Invcs',
								handler : function() {
									this.openBillback( record, event ) ;
								},
								scope : this
							});
						}
						if( contextMenuItems.length == 0 ) {
							return ;
						}
						var treeContextMenu = Ext.create('Ext.menu.Menu',{
							items : contextMenuItems,
							listeners: {
								hide: function(menu) {
									menu.destroy() ;
								}
							}
						}) ;
						treeContextMenu.showAt(event.getXY());
					},
					scope:me
				}
			}]
		}); 
		
		this.callParent() ;
		
		me.mon(me.parentBrowserPanel,'tbarselect',function(){
			if( me.rendered ) {
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
	setIsProd: function(isProd) {
		
	},
	
	openBillback: function(record) {
		this.openPopup(record,'Optima5.Modules.Spec.WbMrfoxy.PromoBillbackGrid',[600,250]) ;
	},
	openPopup: function(record,className,dimensions) {
		var me = this ;
		var promoApprovalPanel = Ext.create(className,{
			optimaModule: me.optimaModule,
			rowRecord: record,
			
			width:dimensions[0],
			height:dimensions[1],
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		promoApprovalPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		promoApprovalPanel.show();
		promoApprovalPanel.getEl().alignTo(me.getEl(), 'c-c?');
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
			dataIndex: 'date_month',
			text: 'Month'
		},{
			dataIndex: 'store_text',
			text: 'Stores'
		},{
			dataIndex: 'prod_text',
			text: 'Products'
		},{
			dataIndex: 'obs_shortshelflife',
			text: 'Short Shelf Life'
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
			dataIndex: 'cost_accruals',
			text: 'F - R'
		},{
			dataIndex: 'currency',
			text: 'Currency'
		}) ;
		
		xlsData = Ext.pluck( store.getRange(), 'data' ) ;
		Ext.Array.each(xlsData,function(dataRow) {
			dataRow['cost_accruals'] = 0 ;
			if( !dataRow.cost_real_is_calc ) {
				dataRow['cost_accruals'] = dataRow['cost_forecast']-dataRow['cost_real'] ;
			}
		});
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'xls_getTableExport',
			data: Ext.JSON.encode({
				xlsFilename: 'WB_MRFOXY_promoAccruals.xlsx',
				xlsSheets: [{
					xlsTitle: 'Accruals',
					xlsColumns: xlsColumns,
					xlsData: xlsData
				}]
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