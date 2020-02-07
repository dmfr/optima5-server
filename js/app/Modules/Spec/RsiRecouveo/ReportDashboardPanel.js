Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPanel',{
	extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletGroup',
		'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletHistory',
		'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageActions',
		
		'Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ReportUserActionsPanel'
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
	},{
		page_id: 'actions',
		page_title: 'Actions / Cash / DSO',
		page_iconcls: 'op5-spec-rsiveo-dashboard-pageicon-actions',
		page_class: 'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageActions'
	},{
		page_id: 'users',
		page_title: 'Collaborateurs',
		page_iconcls: 'op5-spec-rsiveo-dashboard-pageicon-users',
		page_class: 'Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel'
	},{
		page_id: 'user_actions',
		page_title: 'Actions<br>Collaborateurs',
		page_iconcls: 'op5-spec-rsiveo-dashboard-pageicon-users',
		page_class: 'Optima5.Modules.Spec.RsiRecouveo.ReportUserActionsPanel'
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
			data: Ext.clone(this.dashboardPages)
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
		this.onItemClick(null,null,null,0) ;
		
		
		this.down('toolbar').down('#btnDemoDownload').setVisible(true) ;
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
		var rec = this.dashboardPagesStore.getAt(index) ;
		
		this.doInstallPage( rec.get('page_class') ) ;
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
			optimaModule: this.optimaModule,
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
		
		switch( pageClass ) {
			case 'Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel' :
				pagePanel.fireEvent('pagetitle',pagePanel,'Collaborateurs') ;
				break ;
			case 'Optima5.Modules.Spec.RsiRecouveo.ReportUserActionsPanel' :
				pagePanel.fireEvent('pagetitle',pagePanel,'Détail Actions Collaborateurs') ;
				break ;
			default :
				break ;
		}
		pagePanel.doLoad() ;
	},
	onPageTitle: function( pagePanel, pageTitleString ) {
		this.down('#pCenter').down('#pageTitle').setData({
			title_string: pageTitleString
		});
	},
	doReloadPage: function() {
		var pagePanel = this.down('#pCenter').down('op5specrsiveoreportdashboardpage') ;
		if( pagePanel ) {
			pagePanel.doLoad() ;
			return ;
		}
		
		var legacyPanel = this.down('#pCenter').down('panel') ;
		switch( Ext.getClassName(legacyPanel) ) {
			case 'Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel' :
			case 'Optima5.Modules.Spec.RsiRecouveo.ReportUserActionsPanel' :
				legacyPanel.doLoad() ;
				break ;
			default :
				return ;
		}
	},
	
	
	
	onTbarChanged: function( filterValues ) {
		this.doReloadPage() ;
	},
	
	onDestroy: function () {
		this.callParent();
	},
	
	
	onTbarDownload: function() {
		var pagePanel = this.down('#pCenter').down('op5specrsiveoreportdashboardpage') ;
		if( pagePanel ) {
			return this.demoOpenDownload() ;
		}
		var legacyPanel = this.down('#pCenter').down('panel') ;
		switch( Ext.getClassName(legacyPanel) ) {
			case 'Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel' :
				break ;
			case 'Optima5.Modules.Spec.RsiRecouveo.ReportUserActionsPanel' :
				legacyPanel.handleDownload() ;
				break ;
			default :
				return ;
		}
	},
	
	demoOpenDownload: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Ext.panel.Panel',{
			optimaModule: this.optimaModule,
			width: 500,
			floating: true,
			draggable: false,
			resizable: false,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			layout: 'fit',
			title: 'Download',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: '10px 10px',
			frame: true,
			layout: 'fit',
			items:[{
				xtype:'form',
				border: false,
				bodyPadding: '5px 5px',
				bodyCls: 'ux-noframe-bg',
				flex: 1,
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 110,
					anchor: '100%'
				},
				items:[{
					xtype: 'fieldset',
					title: 'Téléchargement direct',
					items: [{
						xtype: 'button',
						margin: '6px 0px',
						text: 'Téléchargement...'
					}]
				},{
					xtype: 'fieldset',
					title: 'Envoi sur e-mail',
					items: [{
						xtype: 'checkboxfield',
						boxLabel: 'Activé ?'
					},{
						xtype: 'textfield',
						fieldLabel: '@ Destinataires'
					}]
				}]
			}],
			buttons: [{
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					//this.handleUpload() ;
				},
				scope: this
			}]
		});
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
	}
}) ;
