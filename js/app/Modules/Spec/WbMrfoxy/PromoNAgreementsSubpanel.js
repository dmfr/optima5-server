Ext.define('WbMrfoxyNAgreementModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'country_code', type: 'string'},
		{name: 'cropYear_code', type: 'string'},
		{name: 'currency', type: 'string'},
		{name: 'currency_symbol', type: 'string'},
		{name: 'store_code', type: 'string'},
		{name: 'store_text', type: 'string'},
		{name: 'nagreement_txt', type: 'string'},
		{name: 'amount_forecast', type: 'number'},
		{name: 'amount_real', type: 'number'},
		{name: 'status_isReal', type: 'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoNAgreementsSubpanel',{
	extend:'Ext.panel.Panel',
	
	requires : [
		'Ext.ux.grid.FiltersFeature'
	],
	
	initComponent: function() {
		var me = this ;
		
		if( (me.parentBrowserPanel) instanceof Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoNAgreementsSubpanel','No parent reference ?') ;
		}
		me.optimaModule = me.parentBrowserPanel.optimaModule ;
		
		var monthrenderer = Ext.util.Format.dateRenderer('Y-m');
		Ext.apply(me,{
			layout:'border',
			items:[{
				region:'center',
				itemId: 'pCenter',
				layout:'fit',
				border:false,
				xtype:'gridpanel',
				store: {
					model: 'WbMrfoxyNAgreementModel',
					autoLoad: false,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_wb_mrfoxy',
							_action: 'finance_getNationalAgreements'
						},
						reader: {
							type: 'json',
							root: 'data'
						}
					}),
					sorters: [{
						property: 'cropYear_code',
						direction: 'DESC'
					}],
					listeners: {
						beforeload: function(store,options) {
							options.params = options.params || {};
							var params = {
								filter_country: me.parentBrowserPanel.filterCountry
							} ;
							Ext.apply(options.params, params);
						},
						load: function(store) {
						},
						scope: me
					}
				},
				plugins: [{
					ptype: 'bufferedrenderer',
					pluginId: 'bufferedRender'
				}],
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
						text: '<b>CropY</b>',
						dataIndex: 'cropYear_code',
						width: 90,
						renderer: function(v) {
							return '<b>'+v+'</b>' ;
						},
						menuDisabled:false,
						filter: {
							type: 'op5crmbasebible',
							optimaModule: me.optimaModule,
							bibleId: '_CROP'
						}
					},{
						text: 'Stores',
						dataIndex: 'store_text',
						width: 200,
						menuDisabled:false,
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: 'IRI_STORE'
						}
					},{
						text: 'Agreement Desc',
						dataIndex: 'nagreement_txt',
						width: 300
					},{
						text: '<b>Acr:</b> Forecast',
						width: 100,
						menuDisabled:true,
						dataIndex: 'amount_forecast',
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
						dataIndex: 'amount_real',
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
							if( record.get('status_isReal') ) {
								m.tdCls += ' ' + 'op5-spec-dbspeople-realcolor-open' ;
								return 0 ;
							}
							var calcValue = record.get('amount_forecast') - record.get('amount_real') ;
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
				}]
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
			dataIndex: 'cropYear_code',
			text: 'Crop year'
		},{
			dataIndex: 'date_month',
			text: 'Month'
		},{
			dataIndex: 'store_text',
			text: 'Stores'
		},{
			dataIndex: 'nagreement_txt',
			text: 'Agreement Desc'
		},{
			dataIndex: 'amount_forecast',
			text: 'Forecasted cost'
		},{
			dataIndex: 'amount_real',
			text: 'Real cost'
		},{
			dataIndex: 'amount_accruals',
			text: 'F - R'
		},{
			dataIndex: 'currency',
			text: 'Currency'
		}) ;
		
		xlsData = Ext.pluck( store.getRange(), 'data' ) ;
		Ext.Array.each(xlsData,function(dataRow) {
			dataRow['amount_accruals'] = 0 ;
			if( !dataRow.status_isReal ) {
				dataRow['amount_accruals'] = dataRow['amount_forecast'] ;
			}
		});
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'xls_getTableExport',
			data: Ext.JSON.encode({
				xlsFilename: 'WB_MRFOXY_promoNAgreements.xlsx',
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