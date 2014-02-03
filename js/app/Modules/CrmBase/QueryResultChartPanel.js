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
	}]
});

Ext.define('QueryResultChartModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'chart_name',  type: 'string'},
		{name: 'chart_type',   type: 'string'}, // areastacked, bar, line, pie
		{name: 'tomixed_is_on',   type: 'boolean'},
		{name: 'tomixed_axis', type:'string'}
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
	drawChartLegend: true,
	
	ajaxBaseParams:null,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryResultChartPanel','No module reference ?') ;
		}
		if( me.ajaxBaseParams != null ) {} else {
			Optima5.Helper.logError('CrmBase:QueryResultChartPanel','No ajaxBaseParams ?') ;
		}
		
		/* Base layout for QueryResultChartPanel */
		Ext.apply(this,{
			autoScroll: true,
			layout: {
				type: 'hbox',
				align: 'stretch'
			}
		}) ;
		
		this.callParent() ;
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
	buildViewCharts: function(RESchart) {
		var me = this,
			cmpCfg ;
			
		var types = Ext.Array.unique( RESchart.seriesType ) ;
		if( Ext.Array.intersect( types, ['pie','pieswap'] ).length > 0 ) {
			if( types.length == 1 ) {
				cmpCfg = me.getCmpcfgPieCharts( RESchart, (types[0]=='pieswap') ) ;
			} else {
				me.buildViewAlert('Incompatible types','Incompatible chart types in mixed series.') ;
				return true ;
			}
		} else {
			cmpCfg = me.getCmpcfgGridChart( RESchart ) ;
		}
		
		me.removeAll() ;
		me.add(cmpCfg) ;
		return true ;
	},
	getCmpcfgGridChart: function( RESchart ) {
		var me = this,
			data = [],
			fields = [],
			fieldsSeries = [],
			colorSet = [],
			titles = [],
			i=0, j=0,
			seriesCount=RESchart.seriesTitle.length ;
			stepsSerieValue = RESchart.stepsSerieValue,
			stepsLabel = RESchart.stepsLabel,
			seriesLn=stepsSerieValue.length ;
		
		var fieldsSeriesLeft = [],
			fieldsSeriesRight = [],
			
			areaHasLeft = false,
			areaLeftFieldsSeries = [],
			areaLeftColorset = [],
			areaLeftTitles = [],
			areaHasRight = false,
			areaRightFieldsSeries = [],
			areaRightColorset = [],
			areaRightTitles = [],
			
			barHasLeft = false,
			barLeftFieldsSeries = [],
			barLeftFieldsActive = [],
			barLeftColorset = [],
			barLeftTitles = [],
			barHasRight = false,
			barRightFieldsSeries = [],
			barRightFieldsActive = [],
			barRightColorset = [],
			barRightTitles = [],
			
			lineLeftFieldsSeries = [],
			lineLeftColorset = [],
			lineLeftTitles = [],
			lineRightFieldsSeries = [],
			lineRightColorset = [],
			lineRightTitles = [] ;
		
		fields.push({name:'name',type:'string'});
		fields.push({name:'dummy',type:''}) ;
		for( ; i<seriesCount ; i++ ) {
			fields.push({name:'serie'+i,type:'number'}) ;
			
			var fieldSerie = 'serie'+i ;
			var color = RESchart.seriesColor[i] ;
			
			var strArr = [] ;
			Ext.Object.each( RESchart.seriesTitle[i],function(k,v){
				strArr.push(v) ;
			});
			var title = strArr.join(' ') ;
			
			switch( RESchart.seriesAxis[i] ) {
				case 'left' :
					fieldsSeriesLeft.push( fieldSerie );
					break ;
					
				case 'right' :
					fieldsSeriesRight.push( fieldSerie );
					break ;
			}
			
			switch( RESchart.seriesType[i] ) {
				case 'areastacked' :
					switch( RESchart.seriesAxis[i] ) {
						case 'left' :
							areaHasLeft = true ;
							areaLeftFieldsSeries.push( fieldSerie );
							areaLeftColorset.push( color );
							areaLeftTitles.push( title );
							break ;
							
						case 'right' :
							areaHasRight = true ;
							areaRightFieldsSeries.push( fieldSerie );
							areaRightColorset.push( color );
							areaRightTitles.push( title );
							break ;
					}
					break ;
				
				case 'bar' :
					switch( RESchart.seriesAxis[i] ) {
						case 'left' :
							barHasLeft = true ;
							barLeftFieldsActive.push( fieldSerie );
							barLeftFieldsSeries.push( fieldSerie );
							barLeftColorset.push( color );
							barLeftTitles.push( title );
							barRightFieldsSeries.push( 'dummy' );
							barRightColorset.push( color );
							barRightTitles.push( title );
							break ;
							
						case 'right' :
							barHasRight = true ;
							barLeftFieldsSeries.push( 'dummy' );
							barLeftColorset.push( color );
							barLeftTitles.push( title );
							barRightFieldsActive.push( fieldSerie );
							barRightFieldsSeries.push( fieldSerie );
							barRightColorset.push( color );
							barRightTitles.push( title );
							break ;
					}
					break ;
				
				case 'line' :
					switch( RESchart.seriesAxis[i] ) {
						case 'left' :
							lineLeftFieldsSeries.push( fieldSerie );
							lineLeftColorset.push( color );
							lineLeftTitles.push( title );
							break ;
							
						case 'right' :
							lineRightFieldsSeries.push( fieldSerie );
							lineRightColorset.push( color );
							lineRightTitles.push( title );
							break ;
					}
					break ;
				
			}
		}
		
		for( ; j<seriesLn ; j++ ) {
			var strArr = [] ;
			Ext.Object.each( stepsLabel[j],function(k,v){
				strArr.push(v) ;
			});
			var obj = {
				name:strArr.join("\n"),
				dummy: 0
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
		
		var serieRenderer = function( sprite, record, attributes, index, store ) {
			index = index % this.colorSet.length ;
			Ext.apply(attributes,{
				fill: this.colorSet[index],
				stroke: this.colorSet[index]
			}) ;
			return attributes ;
		} ;
		
		
		var series = [] ;
		if( areaHasLeft ) {
			series.push({
				type: 'area',
				highlight: false,
				axis: 'left',
				fill: true,
				xField: 'name',
				yField: areaLeftFieldsSeries,
				title: areaLeftTitles,
				style: {
					opacity: 1
				},
				getLegendColor: function(index) {
					return this.colorSet[index] ;
				},
				colorSet: areaLeftColorset,
				renderer: serieRenderer
			}) ;
		}
		if( areaHasRight ) {
			series.push({
				type: 'area',
				highlight: false,
				axis: 'right',
				fill: true,
				xField: 'name',
				yField: areaRightFieldsSeries,
				title: areaRightTitles,
				style: {
					opacity: 1
				},
				getLegendColor: function(index) {
					return this.colorSet[index] ;
				},
				colorSet: areaRightColorset,
				renderer: serieRenderer
			}) ;
		}
		if( barHasLeft ) {
			series.push({
				type: 'column',
				highlight: false,
				axis: 'left',
				fill: true,
				xField: 'name',
				yField: barLeftFieldsSeries,
				title: barLeftTitles,
				showInLegend: barHasLeft,
				getLegendColor: function(index) {
					return this.colorSet[index] ;
				},
				colorSet: barLeftColorset,
				renderer: serieRenderer
			}) ;
		}
		if( barHasRight ) {
			series.push({
				type: 'column',
				highlight: false,
				axis: 'right',
				fill: true,
				xField: 'name',
				yField: barRightFieldsSeries,
				title: barRightTitles,
				showInLegend: !barHasLeft,
				getLegendColor: function(index) {
					return this.colorSet[index] ;
				},
				colorSet: barRightColorset,
				renderer: serieRenderer
			}) ;
		}
		for( var i=0 ; i<lineLeftFieldsSeries.length ; i++ ) {
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
					fill: lineLeftColorset[i],
					stroke: lineLeftColorset[i],
					'stroke-width': 3,
					opacity: 1
				},
				xField: 'name',
				yField: lineLeftFieldsSeries[i],
				title: lineLeftTitles[i],
				legendColor: lineLeftColorset[i],
				getLegendColor: function(index) {
					return this.legendColor ;
				}
			}) ;
		}
		for( var i=0 ; i<lineRightFieldsSeries.length ; i++ ) {
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
					fill: lineRightColorset[i],
					stroke: lineRightColorset[i],
					'stroke-width': 3,
					opacity: 1
				},
				xField: 'name',
				yField: lineRightFieldsSeries[i],
				title: lineRightTitles[i],
				legendColor: lineLeftColorset[i],
				getLegendColor: function(index) {
					return this.legendColor ;
				}
			}) ;
		}
		
		var axes = [],
			gridStdCfg = {
				odd: {
					opacity: 1,
					fill: '#ddd',
					stroke: '#bbb',
					'stroke-width': 1
				}
			} ;
		if( fieldsSeriesLeft.length > 0 ) {
			axes.push({
				type: 'Numeric',
				grid: true,
				position: 'left',
				fields: fieldsSeriesLeft,
				//title: '#selectId',
				grid: ( fieldsSeriesLeft.length > 0 ? gridStdCfg : null ),
				minimum: 0,
				adjustMinimumByMajorUnit: 0
			}) ;
		}
		if( fieldsSeriesRight.length > 0 ) {
			axes.push({
				type: 'Numeric',
				grid: true,
				position: 'right',
				fields: fieldsSeriesRight,
				//title: '#selectId',
				grid: ( fieldsSeriesLeft.length > 0 ? null : gridStdCfg ),
				minimum: 0,
				adjustMinimumByMajorUnit: 0
			}) ;
		}
		axes.push({
			type: 'Category',
			position: 'bottom',
			fields: ['name'],
			//title: 'Month of the Year',
			grid: true
		}); 
		
		return {
			xtype: 'chart',
			flex: 1,
			minWidth:me.minChartWidth,
			style: 'background:#fff',
			animate: false,
			store: store,
			legend: ( me.drawChartLegend ? {position: 'right'} : false ),
			axes: axes,
			series: series
		};
	},
	getCmpcfgPieCharts: function( RESchart, doSwap ) {
		var me = this ;
		
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
		
		var chartComponents = [] ;
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
		return chartComponents ;
	}
});