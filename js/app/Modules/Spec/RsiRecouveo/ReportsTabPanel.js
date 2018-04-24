Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportsTabPanel',{
	extend: 'Ext.tab.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ReportGridPanel'
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
		
		/*
		var exemples = ['Directeur général','Directeur finance','Credit manager','Chargé recouvrement'] ;
		Ext.Array.each( exemples, function(titre) {
			var cntPanels = this.down('#cntPanels') ;
			cntPanels.add({
				xtype: 'op5specrsiveoreportcanvas',
				title: titre,
				closable: false
			});
		},this);
		*/
		var tilesPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',{
			optimaModule: this.optimaModule,
			title: 'Dashboard',
			listeners: {
				opengrid: this.onOpenGrid,
				scope: this
			}
		});
		this.add(tilesPanel) ;
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
