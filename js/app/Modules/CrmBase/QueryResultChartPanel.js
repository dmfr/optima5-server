Ext.define('QueryResultChartModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'chart_name',  type: 'string'},
		{name: 'chart_type',   type: 'string'}, // areastacked, bar, line, pie
	]
});

Ext.define('Optima5.Modules.CrmBase.QueryResultChartPanel' ,{
	extend: 'Ext.panel.Panel',
	alias: 'widget.op5crmbasequeryresultchart',
	
	chartCfgRecord: null,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			header: false,
			title: '' ,
			iconCls:''
		}) ;
		
		if( me.chartCfgRecord == null ) {
			me.chartCfgRecord = Ext.create('QueryResultChartModel',{
				chart_name: 'New Chart' ,
				chart_type: null 
			}) ;
		}
		
		this.callParent() ;
		me.applyTitle() ;
	},
	applyTitle: function() {
		var me = this,
			title, chartType, iconCls ;
		
		title = me.chartCfgRecord.get('chart_name') ;
		
		switch( chartType = me.chartCfgRecord.get('chart_type') ) {
			case 'areastacked' :
			case 'bar' :
			case 'line' :
			case 'pie':
				iconCls = 'op5-crmbase-qresult-chart-'+chartType ;
				break ;
				
			default :
				iconCls = 'op5-crmbase-qresult-warning' ;
				break ;
		}
		
		me.setTitle(title) ;
		me.setIconCls(iconCls) ;
	},
	
	setChartName: function( chartName ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord ;
		chartCfgRecord.set('chart_name',chartName) ;
		me.applyTitle() ;
	},
	setChartType: function( chartType ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord ;
		chartCfgRecord.set('chart_type',chartType) ;
		me.applyTitle() ;
	}
	
});