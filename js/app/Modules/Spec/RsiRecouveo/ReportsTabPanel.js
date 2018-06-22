Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportsTabPanel',{
	extend: 'Ext.tab.Panel',

	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ReportGridPanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.ReportFilesPanel'
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
			items: []
		});
		this.callParent() ;
		
		var tilesPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',{
			optimaModule: this.optimaModule,
			title: 'Dashboard',
			listeners: {
				opengrid: this.onOpenGrid,
				scope: this
			}
		});
		this.add(tilesPanel) ;
		
		var filesPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportFilesPanel',{
			title: 'Analyse dossiers',
			optimaModule: this.optimaModule,
		}) ;
		this.add(fileReport) ;
		
		/*
		var chartReport = Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportChartsPanel',{
			title: 'Detail 2',
			optimaModule: this.optimaModule,
		});
		this.add(chartReport) ;
		*/
		
		this.setActiveTab(0) ;
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
