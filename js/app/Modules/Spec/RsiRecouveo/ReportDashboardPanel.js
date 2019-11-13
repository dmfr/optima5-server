Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPanel',{
	extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletGroup',
		'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletHistory'
	],
	
	dashboardPages: [{
		page_id: 'wallet_group',
		page_title: 'Décomposition<br>de l\'encours',
		page_iconcls: 'op5-spec-rsiveo-dashboard-pageicon-wallet',
		page_class: 'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletGroup'
	},{
		page_id: 'wallet_history',
		page_title: 'Evolution de<br>l\'encours',
		page_iconcls: 'op5-spec-rsiveo-dashboard-pageicon-wallet-history',
		page_class: 'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletHistory'
	}],
	
	dashboardPagesStore: null,
	
	initComponent: function() {
		this.dashboardPagesStore = Ext.create('Ext.data.Store',{
			fields: [
				{ name: 'page_id', type: 'string' },
				{ name: 'page_title', type: 'string' },
				{ name: 'page_iconcls', type: 'string' },
				{ name: 'page_class', type: 'string' },
				{ name: 'page_selected', type: 'boolean' },
			],
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			},
			data: this.dashboardPages
		}) ;
		
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
				title: 'Pages',
				items: {
					xtype: 'dataview',
					cls: 'op5-spec-rsiveo-dashboard-pages',
					store: this.dashboardPagesStore,
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
					listeners: {
						itemclick: this.onItemClick,
						scope: this
					}
				}
			},{
				itemId: 'pCenter',
				flex: 1,
				region: 'center',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
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
	
	onItemClick: function( dataview, record, item, index ) {
		if( this.dashboardPagesStore.getAt(index).get('page_selected') ) {
			return ;
		}
		var idx=0 ;
		this.dashboardPagesStore.each( function(rec,idx) {
			rec.set('page_selected',idx==index) ;
			idx++ ;
		}) ;
		
		this.doInstallPage( record.get('page_class') ) ;
	},
	
	doInstallPage: function( pageClass ) {
		var pCenter = this.down('#pCenter') ;
		pCenter.removeAll() ;
		if( Ext.isEmpty(pageClass) ) {
			pCenter.add({
				xtype: 'box',
				cls:'op5-waiting'
			}) ;
			return ;
		}
		
		var pagePanel = Ext.create(pageClass,{
			_dashboardPanel: this,
			listeners: {
				pagetitle: this.onPageTitle,
				scope: this
			}
		}) ;
		pCenter.add([{
			itemId: 'pageTitle',
			height: 52,
			xtype: 'box',
			cls: 'op5-spec-rsiveo-dashboard-pagetitle-box',
			tpl: [
				'<div class="op5-spec-rsiveo-dashboard-pagetitle">',
				'{title_string}',
				'</div>'
			],
			data: {
				title_string: '&#160;'
			}
		},Ext.apply(pagePanel,{
			flex: 1,
			itemId: 'pagePanel'
		})]);
		pagePanel.doLoad() ;
	},
	onPageTitle: function( pagePanel, pageTitleString ) {
		this.down('#pCenter').down('#pageTitle').setData({
			title_string: pageTitleString
		});
	},
	doReloadPage: function() {
		var pagePanel = this.down('#pCenter').down('op5specrsiveoreportdashboardpage') ;
		if( !pagePanel ) {
			return ;
		}
		pagePanel.doLoad() ;
	},
	
	
	
	onTbarChanged: function( filterValues ) {
		this.doReloadPage() ;
	},
	
	onDestroy: function () {
		console.log('onDestroy') ;
		this.callParent();
	}
}) ;
