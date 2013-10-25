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
	
	ajaxBaseParams:null,
	chartCfgRecord: null,
	
	chartDataStoreModel: null,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryResultChartPanel','No module reference ?') ;
		}
		if( me.ajaxBaseParams != null ) {} else {
			Optima5.Helper.logError('CrmBase:QueryResultChartPanel','No ajaxBaseParams ?') ;
		}
		
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
		
		/* Base layout for QueryResultChartPanel */
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			}
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
		me.doViews() ;
	},
	getChartType: function() {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			chartType = chartCfgRecord.get('chart_type') ;
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
	removePivot: function( arr_groupIdTag_groupKey ) {
		var me = this,
			chartCfgRecord = me.chartCfgRecord,
			seriesStore = chartCfgRecord.series(),
			searchResult = me.searchPivot( arr_groupIdTag_groupKey ) ;
		
		if( searchResult != null ) {
			seriesStore.remove(searchResult) ;
		}
		if( me.isEmpty() ) {
			chartCfgRecord.iteration_groupTags().removeAll() ;
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
				me.buildViewCharts( ajaxResponse ) ;
			},
			scope: me
		});
		
	},
	buildViewAlert: function( title, caption ) {
		var me = this ;
		me.removeAll() ;
		me.add({
			xtype:'panel',
			bodyCls: 'ux-noframe-bg',
			layout:'fit',
			flex:1,
			border: false,
			items:[{
				xtype:'component',
				tpl:[
					'<div class="op5-admin-cardheader-wrap">',
					'<span class="op5-admin-cardheader-title">{title}</span>',
					'<br>',
					'<span class="op5-admin-cardheader-caption">{caption}</span>',
					'<div class="op5-admin-cardheader-icon {iconCls}"></div>',
					'</div>'
				],
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-delete',
					title: title,
					caption: caption
				}
			}]
		}) ;
	},
	buildViewCharts: function(ajaxResponse) {
		var me = this,
			RESchart = ajaxResponse.RESchart ;
		
		if( !me.chartDataStoreModel ) {
			me.chartDataStoreModel = 'QueryResultChartModel-' + me.getId() ;
			me.on('destroy',function(thisP) {
				console.log('unregistering model') ;
				Ext.data.ModelManager.unregister(thisP.chartDataStoreModel) ;
			},me) ;
		}
		
		var fields = [],
			fieldsSeries = [],
			colorSet = [],
			titles = [],
			i=0,
			seriesCount=RESchart.seriesTitle.length ;
		fields.push('name');
		for( ; i<seriesCount ; i++ ) {
			fields.push('serie'+i) ;
			fieldsSeries.push('serie'+i) ;
			colorSet.push(RESchart.seriesColor[i]) ;
			
			var strArr = [] ;
			Ext.Object.each( RESchart.seriesTitle[i],function(k,v){
				strArr.push(v) ;
			});
			titles.push(strArr.join(' ')) ;
		}
		Ext.define(me.chartDataStoreModel, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		var data = [],
			j=0,
			stepsSerieValue = RESchart.stepsSerieValue,
			stepsLabel = RESchart.stepsLabel,
			seriesLn=stepsSerieValue.length ;
		for( ; j<seriesLn ; j++ ) {
			var strArr = [] ;
			Ext.Object.each( stepsLabel[j],function(k,v){
				strArr.push(v) ;
			});
			var obj = {
				name:strArr.join(' ')
			} ;
			for( i=0 ; i<seriesCount ; i++ ) {
				var serieField = 'serie'+i ;
				obj[serieField] = stepsSerieValue[j][i] ;
			}
			data.push(obj) ;
		}
		
		var store = Ext.create('Ext.data.JsonStore',{
			fields: fields,
			data: data
		}) ;
		
		console.dir(store.getRange() ) ;
		
		
    var chart = Ext.create('Ext.chart.Chart', {
			xtype: 'chart',
			flex: 1,
			style: 'background:#fff',
			animate: false,
			store: store,
			legend: {
				position: 'right'
			},
			axes: [{
				type: 'Numeric',
				grid: true,
				position: 'left',
				fields: fieldsSeries,
				//title: '#selectId',
				grid: {
					odd: {
						opacity: 1,
						fill: '#ddd',
						stroke: '#bbb',
						'stroke-width': 1
					}
				},
				minimum: 0,
				adjustMinimumByMajorUnit: 0
			}, {
				type: 'Category',
				position: 'bottom',
				fields: ['name'],
				//title: 'Month of the Year',
				grid: true,
			}],
			series: [{
				type: 'area',
				highlight: false,
				axis: 'left',
				xField: 'name',
				yField: fieldsSeries,
				title: titles,
				style: {
					opacity: 1
				},
				getLegendColor: function(index) {
					return this.colorSet[index] ;
				},
				colorSet: colorSet,
				renderer: function( sprite, record, attributes, index, store ) {
					Ext.apply(attributes,{
						fill: this.colorSet[index],
						stroke: this.colorSet[index]
					}) ;
					return attributes ;
				}
			}]
		});
		
		me.removeAll() ;
		me.add(chart) ;
	},
});