Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportChartsPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	alias: 'widget.op5specrsiveoreportchartspanel',

	requires: [
		'Ext.ux.grid.filters.filter.StringList',
		'Optima5.Modules.Spec.RsiRecouveo.UxGridFilters'
	],
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	
	initComponent: function(){
		Ext.apply(this, {
			xtype: 'panel',
			_viewsCreated: false,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			//scrollable: true,
			//autoHeight: true,
			width: '100%',
			height: '100%',
			items:[{
				xtype: 'box',
				cls:'op5-waiting'
			}]
		});
		this.callParent() ;
		this.onDateSet('month') ;
		this.ready=true ;
		this.loadGridData() ;
		this.loadChartsData() ;
		
		this.setScrollable('vertical') ;
	},

	onTbarChanged: function( filterValues ) {
		if( !this.ready ) {
			return ;
		}
		this.loadGridData() ;
		this.loadChartsData() ;
	},

	buildViewsFirst: function() {
		if( this._viewsCreated ) {
			return ;
		}
		
		
		// Appel au démarrage : création GRID + CHARTS
		this.removeAll() ;
		this.add({
			xtype: 'container',
			itemId: 'cntGrid',
			layout: 'fit',
			items: []
		}) ;
		Ext.Array.each(['chartIn','chartOut','chartBoth'],function(itemId) {
			this.buildViewsFirstAddChart(itemId) ;
		},this) ;
	},

	buildViewsFirstAddChart( itemId ) {
		var fieldsChartIn = [
			{name: 'date_group', type: 'string', axis: 'bottom'},
			
			{name: 'v_cash', type: 'number', srcReportvalIds:['cash'], axis: 'right', srcReportvalTxt: 'Encaissements'},
			{name: 'v_mails_in', type: 'number', srcReportvalIds:['mails_in'], axis: 'left', srcReportvalTxt: 'Courriers entrants'},
			{name: 'v_emails_in', type: 'number', srcReportvalIds:['emails_in'], axis: 'left', srcReportvalTxt: 'Emails entrants'},
			{name: 'v_calls_in', type: 'number', srcReportvalIds:['calls_in'], axis: 'left', srcReportvalTxt: 'Appels entrants'}
		] ;
		
		var fieldsChartOut = [
			{name: 'date_group', type: 'string', axis: 'bottom'},
			
			{name: 'v_cash', type: 'number', srcReportvalIds:['cash'], axis: 'right', srcReportvalTxt: 'Encaissements'},
			{name: 'v_mails_out', type: 'number', srcReportvalIds:['mails_out'], axis: 'left', srcReportvalTxt: 'Courriers sortants'},
			{name: 'v_emails_out', type: 'number', srcReportvalIds:['emails_out'], axis: 'left', srcReportvalTxt: 'Emails sortants'},
			{name: 'v_calls_out', type: 'number', srcReportvalIds:['calls_out'], axis: 'left', srcReportvalTxt: 'Appels sortants'}
		] ;
		
		var fieldsChartBoth = [
			{name: 'date_group', type: 'string', axis: 'bottom'},
			
			{name: 'v_cash', type: 'number', srcReportvalIds:['cash'], axis: 'right', srcReportvalTxt: 'Encaissements'},
			{name: 'v_mails', type: 'number', srcReportvalIds:['mails_out','mails_in'], axis: 'left', srcReportvalTxt: 'Courriers'},
			{name: 'v_emails', type: 'number', srcReportvalIds:['emails_out','emails_in'], axis: 'left', srcReportvalTxt: 'Emails'},
			{name: 'v_calls', type: 'number', srcReportvalIds:['calls_out','calls_in'], axis: 'left', srcReportvalTxt: 'Appels'}
		] ;
		
		var fields, title ;
		switch( itemId ) {
			case 'chartIn' :
				fields = fieldsChartIn ;
				title = 'Actions entrantes / Encaissements' ;
				break ;
			case 'chartOut' :
				fields = fieldsChartOut ;
				title = 'Actions sortantes / Encaissements' ;
				break ;
			case 'chartBoth' :
				fields = fieldsChartBoth ;
				title = 'Toutes actions / Encaissements' ;
				break ;
			default :
				return ;
		}
		var fieldAxisLeft = [];
		var fieldAxisRight = [];
		var fieldAxisBottom = [];
		Ext.Array.each(fields, function (field) {
			if (field.axis == 'left'){
				fieldAxisLeft.push(field.name);
			}
			if (field.axis == 'right'){
				fieldAxisRight.push(field.name);
			}
			if (field.axis == 'bottom'){
				fieldAxisBottom.push(field.name);
			}
		}) ;
		this.add({
			xtype: 'panel',
			itemId: 'cnt'+itemId,
			layout: 'fit',
			cls: 'chart-no-border',
			height: 400,
			title: title,
			items: [],
			listeners: {
				afterrender: function(p) {
					p.add({
						xtype: 'cartesian',
						itemId: itemId,
						width: '100%',
						height: '100%',
						//scrollable: true,
						legend: {
							docked: 'right'
						},
						store: {
							fields: fields,
							data: []
						},
						axes: [{
							type: 'numeric',
							fields: fieldAxisLeft,
							position: 'left',
							grid: true,
						},{
							type: 'category',
							fields: fieldAxisBottom,
							position: 'bottom',
							grid: true
						},{
							type: 'numeric',
							fields: fieldAxisRight,
							position: 'right',
						}],
						series: [{
							type: 'line',
							xField: 'date_group',
							yField: fields[1].name,
							title: fields[1].srcReportvalTxt,
							style: {
								lineWidth: 4,
							},
							marker: {
								type: 'cross'
							},
							tooltip: {
								trackMouse: true,
								style: 'background: #fff',
								renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' ' + storeItem.get('date_group') + ': ' + storeItem.get(item.series.getYField()) + '€');
								}
							}
						},{
							type: 'line',
							xField: 'date_group',
							yField: fields[2].name,
							title: fields[2].srcReportvalTxt,
							colors: ['#FF8432'],
							style: {
								lineWidth: 4,
								stroke: '#FF8432',
								//fill: '#FF8432'
								},
							marker: {
								radius: 4
							},
							tooltip: {
								trackMouse: true,
								style: 'background: #fff',
								renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' ' + storeItem.get('date_group') + ': ' + storeItem.get(item.series.getYField()));
								}
							}
						},{
							type: 'line',
							xField: 'date_group',
							yField: fields[3].name,
							title: fields[3].srcReportvalTxt,
							colors: ['#EDBD39'],
							style: {
								lineWidth: 4,
								//stroke: '#EDBD39',
								//fill: '#EDBD39'
							},
							marker: {
								radius: 4
							},
							tooltip: {
								trackMouse: true,
								style: 'background: #fff',
								renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' ' + storeItem.get('date_group') + ': ' + storeItem.get(item.series.getYField()));
								}
							}
						},{
							type: 'line',
							xField: 'date_group',
							yField: fields[4].name,
							title: fields[4].srcReportvalTxt,
							colors: ['#FFA500'],
							style: {
								lineWidth: 4,
								//stroke: '#FFA500',
								//fill: '#FFA500'
							},
							marker: {
								radius: 4
							},
							tooltip: {
								trackMouse: true,
								style: 'background: #fff',
								renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' ' + storeItem.get('date_group') + ': ' + storeItem.get(item.series.getYField()));
								}
							}
						}]
					})
				},
				scope: this
			}
		}) ;
	},


	loadGridData: function() {
		var group = new Ext.util.HashMap();
		group.add('groupby_atr', '') ;
		group.add('groupby_is_on', 'on') ;
		group.add('groupby_key', 'user') ;
		group.add('timebreak_group', '') ;

		var fields = [] ;
		fields[0] = 'calls_out';
		fields[1] = 'calls_in' ;
		fields[2] = 'emails_out';
		fields[3] = 'emails_in' ;
		fields[4] = 'mails_out' ;
		fields[5] = 'mails_in' ;
		fields[6] = 'cash' ;
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getGrid',
				filters: Ext.JSON.encode(this.getFilterValues()),
				axes: Ext.JSON.encode(group.map),
				reportval_ids: Ext.JSON.encode(fields)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.buildGrid(ajaxResponse) ;
				//this.onLoadData(ajaxResponse) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	buildGrid: function (queryData) {
		this.buildViewsFirst() ;
		
		var fields = [],
			columns = [],
			data = queryData.data ;
		Ext.Array.each( queryData.columns, function(col) {
			if( Ext.isEmpty(col.reportval_id) ) {
				Ext.apply(col,{
					tdCls: 'op5-spec-rsiveo-taupe',
					width: 150
				}) ;
				fields.push({name: col.dataIndex, type:'string'}) ;
			} else {
				Ext.apply(col,{
					align: 'center'
				}) ;
				fields.push({name: col.dataIndex, type:'number', allowNull:true}) ;
			}
			columns.push(col) ;
		});
		var gridPanel = Ext.create('Ext.grid.Panel',{
			columns: columns,
			scrollable: true,
			store: {
				fields: fields,
				data: data
			}
		});
		this.down('#cntGrid').removeAll() ;
		this.down('#cntGrid').add(gridPanel) ;
		//this.down('#p1').setVisible(true) ;
	},

	loadChartsData: function () {

		var group = new Ext.util.HashMap();
		group.add('groupby_atr', '') ;
		group.add('timebreak_is_on', 'on') ;
		group.add('timebreak_group', 'MONTH') ;

		var fields = [] ;
		fields[0] = 'calls_out';
		fields[1] = 'calls_in' ;
		fields[2] = 'emails_out';
		fields[3] = 'emails_in' ;
		fields[4] = 'mails_out' ;
		fields[5] = 'mails_in' ;
		fields[6] = 'cash' ;
		this.showLoadmask() ;

		
		// TODO : variables d'examen par mois
		var d = new Date();
		m = d.getMonth(); //current month
		y = d.getFullYear(); //current year
		var chartsDateStart = new Date(y,m-6,1), //this is first day of current month - 6
			chartsDateEnd = new Date(y,m,0) ; //this is last day of last month   
		
		var filtersValue = this.getFilterValues() ;
		filtersValue.filter_date.date_start = Ext.Date.format( chartsDateStart, 'Y-m-d' ) ;
		filtersValue.filter_date.date_end = Ext.Date.format( chartsDateEnd, 'Y-m-d' ) ;

		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getGrid',
				filters: Ext.JSON.encode(filtersValue),
				axes: Ext.JSON.encode(group.map),
				reportval_ids: Ext.JSON.encode(fields)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.buildCharts(ajaxResponse) ;
				//this.onLoadData(ajaxResponse) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	buildCharts: function (ajaxResponse) {
		Ext.Array.each(['chartIn','chartOut','chartBoth'],function(itemId) {
			var chart = this.down('#'+itemId),
				chartStore = chart.getStore(),
				chartStoreFields = chartStore.getModel().getFields() ;

			
			var chartData = [] ;
			Ext.Array.each(ajaxResponse.columns, function(col) {
				if( !(col.date_start && col.date_end) ) {
					return ;
				}
				var chartRow = {
					date_group: col.text
				} ;
				Ext.Array.each( chartStoreFields, function(targetField) {
					if( Ext.isEmpty(targetField.srcReportvalIds) ) {
						return ;
					}
					var targetFieldName = targetField.name ;
					var targetFieldValue = 0 ;
					Ext.Array.each( ajaxResponse.data, function(srcRow) {
						if( Ext.Array.contains(targetField.srcReportvalIds,srcRow.reportval_id) ) {
							targetFieldValue += parseFloat(srcRow[col.dataIndex]) ;
						}
					}) ;
					chartRow[targetFieldName] = targetFieldValue ;
				}) ;
				chartData.push(chartRow) ;
			}) ;
			chartStore.loadData(chartData) ;
		},this) ;
		
	}

});
