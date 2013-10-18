Ext.define('QueryResultChartGrouptagModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'group_tagid',type: 'string'}
	]
});
Ext.define('QueryResultChartGrouptagValueModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'group_tagid',type: 'string'},
		{name: 'group_key',type: 'string'}
	]
});

Ext.define('QueryResultChartSerieModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'serie_color',type: 'string'}
	],
	hasMany: [{ 
		model: 'QueryResultChartGrouptagValueModel',
		name: 'serie_pivot', // group tag(s) on which the single iteration will occur to build a serie
		associationKey: 'serie_pivot'
	}],
});

Ext.define('QueryResultChartModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'chart_name',  type: 'string'},
		{name: 'chart_type',   type: 'string'} // areastacked, bar, line, pie
	],
	hasMany: [{ 
		model: 'QueryResultChartGrouptagModel',
		name: 'iteration_groupTags', // group tag(s) on which the single iteration will occur to build a serie
		associationKey: 'iteration_groupTags'
	},{ 
		model: 'QueryResultChartSerieModel',
		name: 'series',
		associationKey: 'series'
	}]
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
		me.chartCfgRecord.series().on('datachanged',function() {
			me.fireEvent('serieschanged') ;
			me.buildViews() ;
		},me) ;
		
		this.callParent() ;
		me.applyTitle() ;
		me.buildViews() ;
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
		if( !Ext.isArray(arr_groupIdTag) || arr_groupIdTag.length == 0 ) {
			return false ;
		}
		
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			iterationStore = chartCfgRecord.iteration_groupTags() ;
		if( iterationStore.getCount() == 0 ) {
			Ext.Array.each(arr_groupIdTag,function(groupIdTag) {
				iterationStore.add( Ext.create('QueryResultChartGrouptagModel',{
					group_tagid: groupIdTag
				}) ) ;
			},me) ;
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
	
	searchPivot: function( arr_groupIdTag_groupKey ) {
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
			var seriePivot = Ext.pluck(serie.serie_pivot().data.items,'data') ;
			if( Ext.JSON.encode(seriePivot) == Ext.JSON.encode(seriePivotTest) ) {
				searchResult = serie ;
				return false 
			}
		},me) ;
		return searchResult ;
	},
	
	getPivotColor: function(arr_groupIdTag_groupKey) {
		var me = this,
			searchResult = me.searchPivot( arr_groupIdTag_groupKey ) ;
		if( searchResult != null ) {
			return searchResult.get('serie_color') ;
		}
		return null ;
	},
	addPivot: function( serieColor, arr_groupIdTag_groupKey ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			searchResult = me.searchPivot( arr_groupIdTag_groupKey ) ;
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
			serie_pivot: seriePivot
		}) ) ;
	},
	
	buildViews: function() {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			searchResult = null ;
	
		chartCfgRecord.series().each( function(serie) {
			var seriePivot = Ext.pluck(serie.serie_pivot().data.items,'data') ;
			//console.dir(seriePivot) ;
		},me) ;
	}
});