Ext.define('Optima5.Modules.CrmBase.QueryResultChartPanelMixed' ,{
	extend: 'Optima5.Modules.CrmBase.QueryResultChartPanel',
	alias: 'widget.op5crmbasequeryresultchartmixed',
	
	initComponent: function() {
		this.callParent() ;
	},

	pushModels: function( arrQueryResultChartModel ) {
		var me = this,
			getAssociatedData ;
			
		me.removeAll() ;
		me.add({
			xtype:'box',
			cls:'op5-waiting',
			flex:1
		}) ;
		
		/*
		 * Merge models into one
		 *  - test all iterations are EQUAL
		 *  - merge series
		 *  - build psedo-record
		 */
		var iteration_groupTags,
			series = [] ;
		Ext.Array.each( arrQueryResultChartModel, function( queryResultChartModel ) {
			var queryResultChartCfg = queryResultChartModel.getData(getAssociatedData=true) ;
			
			if( !Ext.isArray(iteration_groupTags) ) {
				iteration_groupTags = queryResultChartCfg.iteration_groupTags ;
			} else if( Ext.JSON.encode(iteration_groupTags) != Ext.JSON.encode(queryResultChartCfg.iteration_groupTags) ) {
				iteration_groupTags = null ;
				return false ;
			}
			
			Ext.Array.each( queryResultChartCfg.series, function( serie ) {
				Ext.apply(serie, {
					serie_type: queryResultChartCfg['chart_type'],
					serie_axis: queryResultChartCfg['tomixed_axis']
				}) ;
				series.push(serie) ;
			}) ;
		},me) ;
		
		if( iteration_groupTags == null ) {
			return me.buildViewAlert( 'Incompatible series', 'Iterations for selected series cannot merge into same X-axis' ) ;
		}
		
		var queryResultChartCfg = {
			iteration_groupTags: iteration_groupTags,
			series: series
		} ;
		
		
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction: 'chart_tab_getSeries',
					  
			queryResultChartModel: Ext.JSON.encode(queryResultChartCfg)
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success != true ) {
					return me.buildViewAlert('Unknown error','Failed to build chart. Remove all series and start over.') ;
				}
				if( !me.buildViewCharts( ajaxResponse.RESchart ) ) {
					return me.buildViewAlert('Unknown error','Failed to build chart. Remove all series and start over.') ;
				}
			},
			scope: me
		});
		
	}
}) ;