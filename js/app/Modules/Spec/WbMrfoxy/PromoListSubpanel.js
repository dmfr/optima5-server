Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoListSubpanel',{
	extend:'Ext.grid.Panel',
	
	requires : [
		'Ext.ux.RowExpander',
		'Ext.ux.grid.FiltersFeature',
		'Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel'
	],
	features: [{
		ftype: 'filters',
		encode: true
	}],
	plugins: [{
		ptype:'rowexpander',
		expandOnDblClick: true,
		rowBodyTpl : ['<div id="RowBody-{id}" ></div>']
	}],
	
	initComponent: function() {
		var me = this ;
		
		if( (me.parentBrowserPanel) instanceof Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoListSubpanel','No parent reference ?') ;
		}
		me.optimaModule = me.parentBrowserPanel.optimaModule ;
		
		Ext.apply(me,{
			layout:'fit',
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
					sortable: false,
					hideable: true
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
			viewConfig: {
				listeners: {
					expandbody: function(rowNode, record, expandbody) {
						var targetId = 'RowBody-' + record.get('id');
							
							console.dir(Ext.get(targetId)) ;
						
                        if (Ext.getCmp(targetId + "-panel") == null) {
                            var notesGrid = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel', {
                                forceFit: true,
                                renderTo: targetId,
                                id: targetId + "-panel",
										  height: 190,
										  rowRecord: record,
										  optimaModule: me.optimaModule,
										  listeners:{
												datachanged: function() {
													me.getStore().load() ;
												},
												scope:me
										  }
                            });
									 /*
                            rowNode.grid = notesGrid;
                            notesGrid.getEl().swallowEvent(['mouseover', 'mousedown', 'click', 'dblclick', 'onRowFocus']);
                            notesGrid.fireEvent("bind", notesGrid, { id: record.get('id') });
									*/
                        }
					},
					scope: me
				}
			}
		});
		
		this.callParent() ;
		
		me.mon(me.parentBrowserPanel,'tbarselect',function(){
			me.getStore().load() ;
		},me) ;
	}
});