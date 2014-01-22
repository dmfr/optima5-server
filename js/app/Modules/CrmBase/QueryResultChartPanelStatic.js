Ext.define('Optima5.Modules.CrmBase.QueryResultChartPanelStatic' ,{
	extend: 'Optima5.Modules.CrmBase.QueryResultChartPanel',
	alias: 'widget.op5crmbasequeryresultchartstatic',
	
	minChartWidth: 200,
	
	initComponent: function() {
		this.callParent() ;
		
		this.buildViewCharts(this.RESchart_static) ;
	}
});