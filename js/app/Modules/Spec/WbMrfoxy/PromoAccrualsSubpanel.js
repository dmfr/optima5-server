Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoAccrualsSubpanel',{
	extend:'Ext.panel.Panel',
	
	requires : [
		'Ext.ux.ComponentRowExpander',
		'Ext.ux.grid.FiltersFeature'
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
						hidden: true,
						menuDisabled:false,
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: 'PROMO_MECH'
						}
					},{
						text: '<b>Acr:</b> Forecast',
						width: 100,
						menuDisabled:true,
						dataIndex: 'cost_forecast',
						tdCls: 'op5-spec-mrfoxy-financebudget-celltotal',
						align: 'right',
						xtype: 'numbercolumn',
						format: '0,0'
					},{
						text: '<b>Acc:</b> Received',
						width: 100,
						menuDisabled:true,
						dataIndex: 'cost_real',
						tdCls: 'op5-spec-mrfoxy-financebudget-celltotal',
						align: 'right',
						xtype: 'numbercolumn',
						format: '0,0'
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
							return Ext.util.Format.number( calcValue, '0,0' ) ;
						}
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
		
	}
});