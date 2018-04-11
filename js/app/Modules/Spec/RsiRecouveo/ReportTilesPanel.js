Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'column',
			items: []
		}) ;
		this.callParent() ;
		for( var i=0 ; i<10 ; i++ ) {
			this.doAddPanel() ;
		}
		this.setScrollable('vertical') ;
	},
	doAddPanel: function() {
		this.add( Ext.create('Ext.panel.Panel',{
			title: 'Titre de la tuile',
			margin: 10,
			frame: true,
			width: 300,
			height: 200,
			layout: 'fit',
			items: [{
				xtype: 'polar',
				height: 240,
				width: 300,
				padding: '10 0 0 0',
				store: {
					fields: ['mph', 'fuel', 'temp', 'rpm' ],
					data: [
						{ mph: 65, fuel: 50, temp: 150, rpm: 6000 }
					]
				},
				insetPadding: 30,
				axes: {
					title: 'Temp',
					type: 'numeric',
					position: 'gauge',
					maximum: 250,
					majorTickSteps: 2,
					renderer: function (v) {
							if (v === 0) return 'Cold';
							if (v === 125) return 'Comfortable';
							if (v === 250) return 'Hot';
							return ' ';
					}
				},
				series: {
					type: 'gauge',
					field: 'temp',
					donut: 50
				}
			}]
		}) ) ;
	}
}) ;
