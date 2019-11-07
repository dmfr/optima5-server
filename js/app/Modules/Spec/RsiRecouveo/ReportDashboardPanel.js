Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPanel',{
	extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	
	dashboardPages: [{
		page_id: 'wallet_group',
		page_title: 'Décomposition<br>de l\'encours',
		page_iconcls: 'op5-spec-rsiveo-dashboard-pageicon-wallet'
	},{
		page_id: 'wallet_history',
		page_title: 'Décompossqd<br>fqsdqdsdsdqs',
		page_iconcls: 'op5-spec-rsiveo-dashboard-pageicon-wallet'
	}],
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'border',
			items: [{
				itemId: 'pWest',
				region: 'west',
				xtype: 'panel',
				layout: 'fit',
				collapsible: true,
				collapsed: false,
				width: 160,
				items: {
					xtype: 'dataview',
					cls: 'op5-spec-rsiveo-dashboard-pages',
					store: {
						fields: [
							{ name: 'page_id', type: 'string' },
							{ name: 'page_title', type: 'string' },
							{ name: 'page_iconcls', type: 'string' },
							{ name: 'page_selected', type: 'boolean' },
						],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						},
						data: this.dashboardPages
					},
					scrollable: 'vertical',
					style: {
						//whiteSpace: 'nowrap'
					},
					tpl:[
						'<tpl for=".">',
							'<div class="op5-spec-rsiveo-dashboard-pages-thumb {page_iconcls} ',
							'<tpl if="page_selected">',
								'op5-spec-rsiveo-dashboard-pages-thumb-selected',
							'</tpl>',
							'">',
								'<div class="op5-spec-rsiveo-dashboard-pages-thumbtext">{page_title}</div>',
							'</div>',
						'</tpl>'
					],
					trackOver: true,
					overItemCls: 'x-item-over',
					itemSelector: 'div.op5-spec-rsiveo-dashboard-pages-thumb',
					prepareData: function(data) {
						return data ;
					},
				}
			},{
				itemId: 'pCenter',
				flex: 1,
				region: 'center',
				layout: 'fit',
				items: [{
					xtype: 'box',
					cls:'op5-waiting'
				}]
			}]
		}) ;
		this.callParent() ;
		this.onDateSet('month') ;
		this.ready=true ;
		//this.doLoad() ;
	},
	
	onTbarChanged: function( filterValues ) {
		//this.doLoad() ;
	},
	
	onDestroy: function () {
		console.log('onDestroy') ;
		this.callParent();
	}
}) ;
