Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportsTabPanel',{
	extend: 'Ext.tab.Panel',

	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ReportGridPanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.ReportFilesPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ReportChartsPanel'
	],

	initComponent: function() {
		Ext.apply(this,{
			//layout: 'border',
			plugins:[{
				ptype: 'AddTabButton',
				iconCls: 'icon-add',
				toolTip: 'New empty chart',
				panelConfig: {
					xtype: 'op5specrsiveoreportgrid',
					title: 'Nouveau rapport',
					closable: true,
					optimaModule: this.optimaModule
				}
			}],
			defaults: {
				xtype: 'panel',
				layout: 'fit',
				listeners: {
					activate: {
						fn: function(p) {
							Ext.apply(p.op5itemConfig,{
								frame: false
							}) ;
							p.add(p.op5itemConfig) ;
						},
						scope: this,
						single: true
					}
				}
			},
			items: [{
				title: 'Dashboard',
				op5itemConfig: {
					xtype: 'op5specrsiveoreporttilespanel',
					optimaModule: this.optimaModule,
					listeners: {
						opengrid: this.onOpenGrid,
						scope: this
					}
				}
			},{
				title: 'Analyse dossiers',
				op5itemConfig: {
					xtype: 'op5specrsiveoreportfilespanel',
					optimaModule: this.optimaModule
				}
			},{
				title: 'Actions / Encaissement',
				op5itemConfig: {
					xtype: 'op5specrsiveoreportchartspanel',
					optimaModule: this.optimaModule
				}
			}],
			activeTab: 0
		});
		this.callParent() ;
	},
	onOpenGrid: function( tilesPanel, reportvalId ) {
		console.dir(arguments) ;
		var newPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportGridPanel',{
			title: 'Nouveau rapport',
			closable: true,
			optimaModule: this.optimaModule
		});
		newPanel.initFromTile( tilesPanel.getFilterValues(), reportvalId ) ;
		this.add(newPanel) ;
		this.setActiveTab(newPanel) ;
	}
});
