Ext.define('Optima5.Modules.Spec.WbMrfoxy.FinanceBudgetBar',{
	extend: 'Ext.container.Container',
	
	alias: 'widget.op5specmrfoxybudgetbar',
	
	requires: [
		'Optima5.Modules.Spec.WbMrfoxy.GraphInfoView'
	],
	
	data_cropYear: null,
	data_countryCode: null,
	
	render_graphData: null,
	render_variableCost: 0,
	
	initComponent: function(){
		Ext.apply(this,{
			layout:{
				type:'vbox',
				align:'stretch'
			}
		}) ;
		this.callParent() ;
		this.queryGraph() ;
	},
	setData: function( dataObj ) {
		this.data_cropYear = dataObj.crop_year ;
		this.data_countryCode = dataObj.country_code ;
		this.queryGraph() ;
	},
	queryGraph: function() {
		this.removeAll() ;
		
		if( this.data_cropYear && this.data_countryCode ) {} else {
			return ;
		}
		
		this.add([{
			xtype: 'panel',
			flex: 1,
			layout: 'fit',
			itemId: 'cntFinanceGraph',
			items: [{
				xtype:'box',
				cls:'op5-waiting'
			}]
		},{
			xtype:'op5specmrfoxygraphinfobis',
			padding: '2px 4px 10px 4px'
		}]);
		
		// Ajax query
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'finance_getBudgetBar',
				data_cropYear: this.data_cropYear,
				data_countryCode: this.data_countryCode
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == true ) {
					this.render_graphData = ajaxData.data ;
					this.renderGraph() ;
				} else {
					this.removeAll() ;
				}
			},
			scope: this
		}) ;
	},
	renderGraph: function() {
		var cntFinanceGraph = this.query('#cntFinanceGraph')[0] ;
		
		var serieRenderer = function( sprite, record, attributes, index, store ) {
			index = index % this.colorSet.length ;
			Ext.apply(attributes,{
				fill: this.colorSet[index],
				stroke: this.colorSet[index]
			}) ;
			return attributes ;
		} ;
		
		var chartCfg = {
			xtype: 'chart',
			animate: true,
			shadow: false,
			store: {
				fields: ['year', 'Actual', 'Committed', 'ThisPromo', 'Free'],
				data: [
					this.getRecord()
				]
			},
			axes: [{
				type: 'Numeric',
				position: 'bottom',
				fields: ['Actual', 'Committed', 'ThisPromo', 'Free'],
				title: false,
				grid: true,
				label: {
					renderer: function(v) {
						return String(v).replace(/000$/, 'K');
					}
				},
				roundToDecimal: false
			}],
			series: [{
				type: 'bar',
				axis: 'bottom',
				gutter: 80,
				xField: 'year',
				yField: ['Actual', 'Committed', 'ThisPromo', 'Free'],
				colorSet: ['#A61120','#115FA6','#9314A6','#94AE0A'],
				renderer: serieRenderer,
				getLegendColor: function(index) {
					return this.colorSet[index] ;
				},
				stacked: true,
				tips: {
					trackMouse: true,
					width: 125,
					height: 28,
					renderer: function(storeItem, item) {
							this.setTitle(item.yField + ': ' + String(item.value[1] / 1) + '');
					}
				}
			}]
		};
		cntFinanceGraph.removeAll() ;
		cntFinanceGraph.add(chartCfg) ;
	},
	setVariableCost: function( variableCost ) {
		var chart = this.down('chart') ;
		this.render_variableCost = variableCost ;
		if( chart == null ) {
			return ;
		}
		chart.getStore().loadData([this.getRecord()]) ;
	},
	getRecord: function() {
		if( Ext.isEmpty(this.render_graphData) ){
			return {year: this.data_cropYear} ;
		}
		return {
			year: this.data_cropYear,
			Free: this.render_graphData.FREE - this.render_variableCost,
			ThisPromo: this.render_variableCost,
			Committed: this.render_graphData.COMMIT,
			Actual: this.render_graphData.ACTUAL
		} ;
	}
}) ;