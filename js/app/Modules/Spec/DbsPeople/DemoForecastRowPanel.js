Ext.define('Optima5.Modules.Spec.DbsPeople.DemoForecastRowPanel',{
	extend: 'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.dams.FieldSet'
	],
	
	rowRecord: null,
	
	initComponent: function() {
		var me = this,
			rowRecord = me.rowRecord ;
			
		Ext.apply(me,{
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			defaults: {
				bodyPadding: '0px 10px',
				margin: '10px',
				defaults: {
					anchor: '100%'
				}
			},
			items: [{
				xtype:'fieldset',
				title: 'Capacité',
				flex:2,
				defaults: {
					margin: 2,
					anchor: '100%'
				},
				items:[{
					xtype: 'numberfield',
					fieldLabel: 'Colis',
					labelWidth: 70,
					value: 29415
				},{
					xtype: 'numberfield',
					fieldLabel: 'Palettes',
					labelWidth: 70,
					value: 5155
				},{
					xtype: 'numberfield',
					fieldLabel: 'Quai',
					labelWidth: 70,
					value: 4212
				},{
					xtype: 'numberfield',
					fieldLabel: 'Table',
					labelWidth: 70,
					value: 1300
				}]
			},{
				xtype:'fieldset',
				title: 'Forecast',
				flex:2,
				defaults: {
					margin: 2,
					anchor: '100%'
				},
				items:[{
					xtype: 'numberfield',
					fieldLabel: 'Colis',
					labelWidth: 70,
					value: 29000
				},{
					xtype: 'numberfield',
					fieldLabel: 'Pals I/O',
					labelWidth: 70,
					value: 5141
				},{
					xtype: 'numberfield',
					fieldLabel: 'Camions',
					labelWidth: 70,
					value: 125
				},{
					xtype: 'numberfield',
					fieldLabel: 'Table',
					labelWidth: 70,
					value: 712
				}]
			},{
				xtype:'container',
				itemId: 'cntChart' ,
				cls:'op5-waiting',
				layout:'fit',
				flex:3,
				margin: 10
			}],
			autoDestroy: true
		}); 
		
		this.callParent() ;
		this.fetchGraph() ;
	},
	fetchGraph: function() {
		var me = this ;
		
		var store1 = Ext.create('Ext.data.Store', {
			fields: ['name','data1','data2'],
			data:[
				{name:'Colis',data1:29415,data2:28000},
				{name:'Pals I/O',data1:27415,data2:32000},
				{name:'Quai',data1:30015,data2:24000},
				{name:'Table',data1:26000,data2:26100}
			]
		}) ;
		
		var serieRenderer = function( sprite, record, attributes, index, store ) {
			index = index % this.colorSet.length ;
			Ext.apply(attributes,{
				fill: this.colorSet[index],
				stroke: this.colorSet[index]
			}) ;
			return attributes ;
		} ;
		
    var chart = Ext.create('Ext.chart.Chart', {
            xtype: 'chart',
            style: 'background:#fff',
            animate: true,
            shadow: true,
            store: store1,
            axes: [{
                type: 'Numeric',
                position: 'left',
                fields: ['data1','data2'],
                title: 'Capacité',
                grid: true,
                minimum: 0
             }, {
                type: 'Category',
                position: 'bottom',
                fields: ['name']
                //title: 'Poste(s)'
            }],
            series: [{
                type: 'column',
                axis: 'left',
                highlight: true,
                xField: 'name',
                yField: 'data1',
					 colorSet: ['green','red','green','blue'],
					 renderer: serieRenderer
				},{
                type: 'line',
                axis: 'left',
                highlight: true,
                xField: 'name',
                yField: 'data2'
            }]
        });
		
	 var cntChart = me.query('#cntChart')[0] ;
				cntChart.removeCls('op5-waiting') ;
				cntChart.removeAll() ;
		cntChart.add(chart) ;
	}
}) ;