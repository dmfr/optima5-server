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
		{name: 'serie_color',type: 'string'},
		{name: 'data_selectid',type: 'int'}
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
	requires: ['Ext.ux.chart.TitleChart'],
	
	minChartWidth: 200,
	
	ajaxBaseParams:null,
	chartCfgRecord: null,
	
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
			autoScroll: true,
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
			case 'pieswap':
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
				if( !me.buildViewCharts( ajaxResponse ) ) {
					return me.buildViewAlert('Unknown error','Failed to build chart. Remove all series and start over.') ;
				}
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
			RESchart = ajaxResponse.RESchart,
			doSwap = false ;
		
		switch( me.getChartType() ) {
			case 'pieswap' :
				doSwap = true ;
				break ;
			default :
				break ;
		}
		
		var data = [],
			fields = [],
			fieldsSeries = [],
			colorSet = [],
			titles = [],
			i=0, j=0,
			seriesCount=RESchart.seriesTitle.length ;
			stepsSerieValue = RESchart.stepsSerieValue,
			stepsLabel = RESchart.stepsLabel,
			seriesLn=stepsSerieValue.length ;
		if( doSwap ) {
			fields.push({name:'name',type:'string'});
			for( ; i<seriesLn ; i++ ) {
				fields.push({name:'serie'+i,type:'number'}) ;
				fieldsSeries.push('serie'+i) ;
				
				var strArr = [] ;
				Ext.Object.each( stepsLabel[i],function(k,v){
					strArr.push(v) ;
				});
				titles.push(strArr.join(' ')) ;
			}
			for( ; j<seriesCount ; j++ ) {
				colorSet.push(RESchart.seriesColor[j]) ;
				
				var strArr = [] ;
				Ext.Object.each( RESchart.seriesTitle[j],function(k,v){
					strArr.push(v) ;
				});
				var obj = {
					name:strArr.join(' ')
				} ;
				for( i=0 ; i<seriesLn ; i++ ) {
					var serieField = 'serie'+i ;
					obj[serieField] = stepsSerieValue[i][j] ;
				}
				data.push(obj) ;
			}
		} else {
			fields.push({name:'name',type:'string'});
			for( ; i<seriesCount ; i++ ) {
				fields.push({name:'serie'+i,type:'number'}) ;
				fieldsSeries.push('serie'+i) ;
				colorSet.push(RESchart.seriesColor[i]) ;
				
				var strArr = [] ;
				Ext.Object.each( RESchart.seriesTitle[i],function(k,v){
					strArr.push(v) ;
				});
				titles.push(strArr.join(' ')) ;
			}
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
		}
		
		var store = Ext.create('Ext.data.JsonStore',{
			fields: fields,
			data: data
		}) ;
		
		var serieRenderer = function( sprite, record, attributes, index, store ) {
			index = index % this.colorSet.length ;
			Ext.apply(attributes,{
				fill: this.colorSet[index],
				stroke: this.colorSet[index]
			}) ;
			return attributes ;
		} ;
		
		var chartComponents = [] ;
		switch( me.getChartType() ) {
			case 'areastacked' :
			case 'bar' :
			case 'line':
				var series, serieType, markerConfig ;
				switch( me.getChartType() ) {
					case 'areastacked' :
						series = [{
							type: 'area',
							highlight: false,
							axis: 'left',
							fill: true,
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
							renderer: serieRenderer
						}] ;
						break ;
					case 'bar' :
						series = [{
							type: 'column',
							highlight: false,
							axis: 'left',
							fill: true,
							xField: 'name',
							yField: fieldsSeries,
							title: titles,
							getLegendColor: function(index) {
								return this.colorSet[index] ;
							},
							colorSet: colorSet,
							renderer: serieRenderer
						}] ;
						break ;
					case 'line':
						serieType = 'line' ;
						markerConfig = {
							type: 'cross',
							size: 4,
							radius: 4,
							'stroke-width': 0
						} ;
						var i=0,
							series = [] ;
						for( ; i<fieldsSeries.length ; i++ ) {
							series.push({
								type: 'line',
								highlight: false,
								markerConfig: {
									type: 'cross',
									size: 4,
									radius: 4,
									'stroke-width': 0
								},
								axis: 'left',
								style: {
									fill: colorSet[i],
									stroke: colorSet[i],
									'stroke-width': 3,
									opacity: 1
								},
								xField: 'name',
								yField: fieldsSeries[i],
								title: titles[i],
								getLegendColor: function(index) {
									return colorSet[i] ;
								}
							}) ;
						}
						break ;
					default :
						return false ;
						break ;
				}
				chartComponents.push({
					xtype: 'chart',
					flex: 1,
					minWidth:me.minChartWidth,
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
					series: series
				});
				break ;
				
			case 'pie' :
			case 'pieswap' :
				var i=0 ;
				for( ; i<fieldsSeries.length ; i++ ) {
					chartComponents.push({
						xtype: 'titlechart',
						flex: 1,
						minWidth:me.minChartWidth,
						style: 'background:#fff',
						shadow: false,
						animate: false,
						store: store,
						titleFont: 'bold 14px Arial',
						titleLocation:'bottom',
						title:titles[i],
						series: [{
							type: 'pie',
							angleField: fieldsSeries[i],
							highlight: false,
							label: {
								field: 'name',
								display: 'over',
								contrast: true
							},
							highlight: {
								segment: {
									margin: 20
								}
							},
							tips: {
								trackMouse: true,
								width: 140,
								height: 52,
								dataField: fieldsSeries[i],
								renderer: function(storeItem, item) {
									// calculate and display percentage on hover
									var total = 0,
										dataField = this.dataField,
										title = [] ;
									
									store.each(function(rec) {
										total += rec.get(dataField);
									});
									
									title.push( storeItem.get('name') + ':' ) ;
									title.push( '&#160;' + 'Qty : ' + storeItem.get(dataField) ) ;
									title.push( '&#160;' + 'Ratio : ' + Math.round(storeItem.get(dataField) / total * 100) + '%' ) ;
									this.setTitle(title.join('<br>'));
								}
							},
							colorSet: (doSwap ? colorSet : null)
						}]
					});
				}
				break ;
			
			default :
				return false ;
				break ;
		}
		
		me.removeAll() ;
		me.add(chartComponents) ;
		return true ;
	},
});