Ext.define('Optima5.Modules.CrmBase.QueryResultChartPanelSingle' ,{
	extend: 'Optima5.Modules.CrmBase.QueryResultChartPanel',
	alias: 'widget.op5crmbasequeryresultchartsingle',
	
	chartCfgRecord: null,
	
	initComponent: function() {
		var me = this ;
		
		if( me.chartCfgRecord == null ) {
			me.chartCfgRecord = Ext.create('QueryResultChartModel',{
				chart_name: 'New Chart' ,
				chart_type: null 
			}) ;
		}
		var onDataChangeCallback = function() {
			me.fireEvent('serieschanged') ;
			me.doViews() ;
		}
		me.chartCfgRecord.series().on({
			clear: onDataChangeCallback,
			datachanged: onDataChangeCallback,
			update: onDataChangeCallback,
			scope: me
		},me) ;
		
		Ext.apply(me,{
			header: false,
			title: '' ,
			iconCls:''
		}) ;
		this.callParent() ;
		
		me.applyTitle() ;
		me.doViews() ;
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
			case 'pieswap':
				iconCls = 'op5-crmbase-qresult-chart-'+chartType ;
				break ;
				
			default :
				iconCls = 'op5-crmbase-qresult-warning' ;
				break ;
		}
		
		if( me.chartCfgRecord.get('tomixed_is_on') ) {
			var tomixedLetter ;
			switch( me.chartCfgRecord.get('tomixed_axis') ) {
				case 'left' :
					tomixedLetter='L' ;
					break ;
				case 'right' :
					tomixedLetter='R' ;
					break ;
			}
			title += '&nbsp' + '<font color="red">(' + tomixedLetter + ')</font>' ;
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
		me.doViews() ;
	},
	getChartType: function() {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			chartType = ( me.RESchart_static != null ? me.RESchart_static.chart_type : chartCfgRecord.get('chart_type') ) ;
		return ( ( chartType != null && chartType != '' ) ? chartType : null ) ;
	},
	
	testChartIteration: function( arr_groupIdTag ) {
		if( !Ext.isArray(arr_groupIdTag) || arr_groupIdTag.length == 0 ) {
			return false ;
		}
		
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			iterationStore = chartCfgRecord.iteration_groupTags() ;
		if( iterationStore.getCount() == 0 ) {
			return true ;
		} else {
			var iterationTest = [] ;
			Ext.Array.each(arr_groupIdTag,function(groupIdTag) {
				iterationTest.push({
					group_tagid: groupIdTag
				});
			},me) ;
			
			var iteration = Ext.pluck(iterationStore.data.items,'data') ;
			
			if( Ext.JSON.encode(iteration) != Ext.JSON.encode(iterationTest) ) {
				return false ;
			}
		}
		return true ;
	},
	defineChartIteration: function( arr_groupIdTag ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			iterationStore = chartCfgRecord.iteration_groupTags() ;
		if( !me.testChartIteration(arr_groupIdTag) ) {
			return false ;
		}
		if( iterationStore.getCount() == 0 ) {
			Ext.Array.each(arr_groupIdTag,function(groupIdTag) {
				iterationStore.add( Ext.create('QueryResultChartGrouptagModel',{
					group_tagid: groupIdTag
				}) ) ;
			},me) ;
		}
		return true ;
	},
	
	searchPivot: function( arr_groupIdTag_groupKey, arr_selectIds ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			searchResult = null ;
	
		var seriePivotTest = [] ;
		Ext.Object.each( arr_groupIdTag_groupKey, function(groupIdTag,groupKey) {
			seriePivotTest.push({
				group_tagid: groupIdTag,
				group_key: groupKey
			}) ;
		}) ;
		
		chartCfgRecord.series().each( function(serie) {
			if( !Ext.Array.contains(arr_selectIds,serie.get('data_selectid')) ) {
				return true ;
			}
			var seriePivot = Ext.pluck(serie.serie_pivot().data.items,'data') ;
			if( Ext.JSON.encode(seriePivot) == Ext.JSON.encode(seriePivotTest) ) {
				searchResult = serie ;
				return false 
			}
		},me) ;
		return searchResult ;
	},
	isEmpty: function() {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			seriesStore = chartCfgRecord.series() ;
		return ( seriesStore.getCount() == 0 ) ;
	},
	doEmpty: function() {
		var me = this,
			chartCfgRecord = me.chartCfgRecord ;
		
		chartCfgRecord.series().removeAll() ;
		chartCfgRecord.iteration_groupTags().removeAll() ;
		return ;
	},
	
	getPivotColor: function(arr_groupIdTag_groupKey, arr_selectIds) {
		var me = this,
			searchResult = me.searchPivot( arr_groupIdTag_groupKey, arr_selectIds ) ;
		if( searchResult != null ) {
			return searchResult.get('serie_color') ;
		}
		return null ;
	},
	addPivot: function( serieColor, arr_groupIdTag_groupKey, dataSelectId ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			searchResult = me.searchPivot( arr_groupIdTag_groupKey, [dataSelectId] ) ;
		if( searchResult != null ) {
			searchResult.set('serie_color',serieColor) ;
			return ;
		}
		var seriePivot = [] ;
		Ext.Object.each( arr_groupIdTag_groupKey, function(groupIdTag,groupKey) {
			seriePivot.push({
				group_tagid: groupIdTag,
				group_key: groupKey
			}) ;
		}) ;
		chartCfgRecord.series().add( Ext.ux.dams.ModelManager.create('QueryResultChartSerieModel',{
			serie_color: serieColor,
			serie_pivot: seriePivot,
			data_selectid: dataSelectId
		}) ) ;
	},
	removePivot: function( arr_groupIdTag_groupKey, dataSelectId ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			seriesStore = chartCfgRecord.series(),
			searchResult = me.searchPivot( arr_groupIdTag_groupKey, [dataSelectId] ) ;
		
		if( searchResult != null ) {
			seriesStore.remove(searchResult) ;
		}
		if( me.isEmpty() ) {
			chartCfgRecord.iteration_groupTags().removeAll() ;
		}
	},
	
	setTomixedCfg: function( enabled, axis ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord ;
		switch( axis ) {
			case 'left' :
			case 'right' :
				break ;
			default:
				enabled = false ;
				axis = '' ;
				break ;
		}
		chartCfgRecord.set('tomixed_is_on',enabled) ;
		chartCfgRecord.set('tomixed_axis', (enabled ? axis : '') );
		me.applyTitle() ;
	},
	getTomixedAxis: function() {
		var me = this,
			chartCfgRecord = me.chartCfgRecord ;
		if( !chartCfgRecord.get('tomixed_is_on') ) {
			return null ;
		} else {
			return chartCfgRecord.get('tomixed_axis') ;
		}
	},
	
	doViews: function() {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			getAssociatedData ;
			
		if( me.isEmpty() ) {
			return me.buildViewAlert( 'Empty chart', 'No series have been defined' ) ;
		}
		if( me.getChartType() == null ) {
			return me.buildViewAlert( 'Chart type not specified', 'Select a chart type/model' ) ;
		}
			
		me.removeAll() ;
		me.add({
			xtype:'box',
			cls:'op5-waiting',
			flex:1
		}) ;
		/*
		 * Query chart series
		 */
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction: 'chart_tab_getSeries',
					  
			queryResultChartModel: Ext.JSON.encode(chartCfgRecord.getData(getAssociatedData=true))
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
});