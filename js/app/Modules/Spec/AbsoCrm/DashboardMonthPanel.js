Ext.define('Optima5.Modules.Spec.AbsoCrm.DashboardMonthPanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			border: false,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:[]
		});
		this.callParent() ;
		this.doLoad() ;
	},
	doLoad: function() {
		this.removeAll() ;
		this.add({
			xtype:'box',
			cls:'op5-waiting',
			flex:1
		});
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_abso_crm',
				_action: 'dashboard_getMonth'
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.onLoad( jsonResponse ) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onLoad: function( ajaxData ) {
		// model
		var fields = [],
			columns = [],
			idx = 0 ;
		fields.push({name: 'row_title', type:'string'}) ;
		columns.push({text: 'N / N-1', dataIndex: 'row_title'}) ;
		Ext.Array.each( ajaxData.columns.current, function(v) {
			idx++ ;
			fields.push({name: 'month_'+idx+'_'+v.text_short, type: 'number'}) ;
			columns.push({text: v.text_short, dataIndex: 'month_'+idx+'_'+v.text_short, align:'center', width:75}) ;
		}) ;
		
		Ext.define('AbsoCrmDashboardMonthModel', {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		var dataCurrentCA = {row_title: ajaxData.rows.current},
			dataPreviousCA = {row_title: ajaxData.rows.previous},
			dataCurrentNB = {row_title: ajaxData.rows.current},
			dataPreviousNB = {row_title: ajaxData.rows.previous} ;
		var idx = 0 ;
		Ext.Array.each( ajaxData.columns.current, function(v) {
			idx++ ;
			var dataIndex = 'month_'+idx+'_'+v.text_short ;
			
			dataCurrentCA[dataIndex] = ajaxData.data[v.key]['CA'] ;
			dataCurrentNB[dataIndex] = ajaxData.data[v.key]['Nb cdes'] ;
		}) ;
		var idx = 0 ;
		Ext.Array.each( ajaxData.columns.previous, function(v) {
			idx++ ;
			var dataIndex = 'month_'+idx+'_'+v.text_short ;
			
			dataPreviousCA[dataIndex] = ajaxData.data[v.key]['CA'] ;
			dataPreviousNB[dataIndex] = ajaxData.data[v.key]['Nb cdes'] ;
		}) ;
		
		var columnsCA = Ext.clone(columns) ;
		Ext.apply(columnsCA, {renderer: Ext.util.Format.numberRenderer('0.000')}) ;
		var columnsNB = Ext.clone(columns) ;
		Ext.apply(columnsNB, {}) ;

		Ext.define('AbsoCrmDashboardMonthChartModel', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'month', type:'string'},
				{name: 'currentCA', type:'number'},
				{name: 'previousCA', type:'number'},
				{name: 'currentNB', type:'number'},
				{name: 'previousNB', type:'number'}
			]
		});
		var chartsData = [] ;
		Ext.Array.each( ajaxData.columns.current, function(v,idx) {
			var dataIndex = 'month_'+idx+'_'+v.text_short ;
			
			chartsData.push({
				month: v.text_short,
				currentCA: ajaxData.data[ajaxData.columns.current[idx].key]['CA'],
				previousCA: ajaxData.data[ajaxData.columns.previous[idx].key]['CA'],
				currentNB: ajaxData.data[ajaxData.columns.current[idx].key]['Nb cdes'],
				previousNB: ajaxData.data[ajaxData.columns.previous[idx].key]['Nb cdes']
			});
		}) ;
		var chartStore = Ext.create('Ext.data.Store',{
			model: 'AbsoCrmDashboardMonthChartModel',
			data: chartsData
		});
		
		var colorset = ['#0D7AFF','#FF9114'] ;
		
		var serieRenderer = function( sprite, record, attributes, index, store ) {
			index = index % this.colorSet.length ;
			Ext.apply(attributes,{
				fill: this.colorSet[index],
				stroke: this.colorSet[index]
			}) ;
			return attributes ;
		} ;
		
		this.removeAll() ;
		this.add([{
			xtype:'chart',
			flex:2,
        style: 'background:#fff',
        animate: true,
        shadow: true,
        store: chartStore,
        legend: {
            position: 'right'
        },
        axes: [{
            type: 'Numeric',
            position: 'left',
            fields: ['previousCA', 'currentCA'],
            minimum: 0,
            label: {
                renderer: Ext.util.Format.numberRenderer('0,0')
            },
            grid: true,
            title: 'CA'
        }, {
            type: 'Numeric',
            position: 'right',
            fields: ['previousNB', 'currentNB'],
            minimum: 0,
            grid: true,
            title: 'Cdes'
        }, {
            type: 'Category',
            position: 'bottom',
            fields: ['month']
        }],
        series: [{
            type: 'column',
            axis: 'left',
            xField: 'month',
            yField: ['previousCA', 'currentCA'],
            title: [ajaxData.rows.previous, ajaxData.rows.current],
			  showInLegend: true,
			  getLegendColor: function(index) {
					return this.colorSet[index] ;
				},
				colorSet: colorset,
			  renderer: serieRenderer
		  },{
            type: 'line',
            axis: 'right',
            xField: 'month',
            yField: 'previousNB',
            title: ajaxData.rows.previous,
			  showInLegend: false,
			  style: {
					fill: colorset[0],
					stroke: colorset[0],
					'stroke-width': 3,
					opacity: 1
				},
			  legendColor: colorset[1],
				getLegendColor: function(index) {
					return this.legendColor ;
				}
		  },{
            type: 'line',
            axis: 'right',
            xField: 'month',
            yField: 'currentNB',
            title: ajaxData.rows.current,
			  showInLegend: false,
			  style: {
					fill: colorset[1],
					stroke: colorset[1],
					'stroke-width': 3,
					opacity: 1
				},
			  legendColor: colorset[1],
				getLegendColor: function(index) {
					return this.legendColor ;
				}
        }]
		},{
			xtype:'grid',
			title: 'CA',
			flex:1,
			columns: columnsCA,
			store: {
				model: 'AbsoCrmDashboardMonthModel',
				data: [dataCurrentCA,dataPreviousCA]
			}
		},{
			xtype:'grid',
			title: 'Nb commandes',
			flex:1,
			columns: columnsNB,
			store: {
				model: 'AbsoCrmDashboardMonthModel',
				data: [dataCurrentNB,dataPreviousNB]
			}
		}]) ;
		
		Ext.defer( function() {
			this.down('chart').redraw();
		},100,this );
	}
}) ;