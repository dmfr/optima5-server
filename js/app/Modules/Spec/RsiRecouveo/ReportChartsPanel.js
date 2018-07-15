Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportChartsPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	alias: 'widget.op5specrsiveoreportchartspanel',

	requires: [
		'Ext.ux.grid.filters.filter.StringList',
		'Optima5.Modules.Spec.RsiRecouveo.UxGridFilters'
	],
	_socFilter: null,
	_userFilter: null ,
	_chartItemId: null,
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
		this.loadChartsData(null, null, null) ;
		
		this.setScrollable('vertical') ;
		this._socFilter = this.getFilterValues().filter_soc ;
		this._userFilter = this.getFilterValues().filter_user ;
	},

	onPeriodChange: function(combo, record, eOpts){
		var date_start, date_end, timebreak_group, temp;
		date_end = new Date() ;
		switch(record.data.timeId){
			case 'ann':
				date_start = Ext.Date.subtract(date_end, Ext.Date.YEAR, 5) ;
				timebreak_group = 'YEAR' ;
				break ;
			case 'mois':
				date_start = Ext.Date.subtract(date_end, Ext.Date.MONTH, 18);
				timebreak_group = 'MONTH' ;
				break ;
			case 'hebdo':
				date_start = Ext.Date.subtract(date_end, Ext.Date.DAY, 140) ;
				timebreak_group = 'WEEK' ;
				break ;
			case 'quot':
				date_start = Ext.Date.subtract(date_end, Ext.Date.DAY, 45) ;
				timebreak_group = 'DAY' ;
				break ;
			case 'sem':
				temp = Ext.Date.subtract(date_end, Ext.Date.YEAR, 5) ;
				temp = Ext.Date.format(temp, Ext.Date.YEAR) ;
				date_start = new Date('1/01/'+temp) ;
				//date_end = temp;
				timebreak_group = 'SEM' ;
				break ;
			case 'trim' :
				temp = Ext.Date.subtract(date_end, Ext.Date.YEAR, 5) ;
				temp = Ext.Date.format(temp, Ext.Date.YEAR) ;
				date_start = new Date('1/01/'+temp) ;
				//dat	e_end = temp;
				timebreak_group = 'TRIM' ;
				break ;
		}
		date_end = Ext.Date.format(date_end, 'Y-m-d');
		date_start = Ext.Date.format(date_start, 'Y-m-d') ;
		this.loadChartsData(date_start, date_end, timebreak_group) ;
	},

	onTbarChanged: function( filterValues ) {
		if( !this.ready ) {
			return ;
		}
		this.loadGridData() ;
		if (this._socFilter != this.getFilterValues().filter_soc || this._userFilter != this.getFilterValues().filter_user){
			this.loadChartsData(null, null, null) ;
		}

	},

	buildViewsFirst: function() {
		if( this._viewsCreated ) {
			return ;
		}
		this._viewsCreated = true;
		// Appel au démarrage : création GRID + CHARTS
		this.removeAll() ;
		var legendFields = ['id', 'name', 'mark', 'disabled', 'series', 'index'] ;
		var comboStore = Ext.create('Ext.data.Store', {
			fields: [{name: 'timeTxt', type: 'string'}, {name: 'timeId', type: 'string'}],
			data: [
				{timeId: 'ann', timeTxt: 'Annuel'},
				{timeId: 'sem', timeTxt: 'Semestriel'},
				{timeId: 'trim', timeTxt: 'Trimestriel'},
				{timeId: 'mois', timeTxt: 'Mensuel'},
				{timeId: 'hebdo', timeTxt: 'Hebdomadaire'},
				{timeId: 'quot', timeTxt: 'Quotidien'}
			]
		}) ;
		var legend = {
			xtype: 'panel',
			title: '&#160;',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			width: 150,
			items: [{
				xtype: 'legend',
				width: '100%',
				itemId: 'myLegend',
				docked: 'left',
				padding: '100 0 0 0',
				store: {
					fields: legendFields,
					data: []
				},
				listeners: {
					onclick: function () {
						console.log('aled') ;
					}
				}
			},{
				xtype: 'combobox',
				displayField: 'timeTxt',
				//fieldLabel: 'Période',
				store: comboStore,
				width: '20%',
				minChars: 0,
				queryMode: 'local',
				typeAhead: true,
				itemId: 'periodCombo',
				listeners: {
					select: this.onPeriodChange,
					scope: this,
				},
			}]
		}

		this.add({
			xtype: 'container',
			itemId: 'cntGrid',
			layout: 'fit',
			items: []
		},{
			xtype: 'container',
			itemId: 'hCntChart',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: []
		},{
			xtype: 'container',
			itemId: 'vCntChart',
			layout: {
				type: 'vbox',
				align: 'stretch'
			}
		}) ;
		this.buildViewsFirstAddChart('chartIn') ;
		this.down('#hCntChart').add(legend) ;
		//this.down('#periodCombo').setValue('Hebdomadaire') ;
		var legendData = new Array();
		for (i = 0, ln = this.down('#chartIn').series.length; i < ln; i++) {
			seriesItem = this.down('#chartIn').series[i];
			if (seriesItem.getShowInLegend()) {
				seriesItem.provideLegendInfo(legendData);
			}
		}
		this.down('#myLegend').getStore().loadData(legendData) ;

		this.buildViewsFirstAddChart('chartOut') ;
		this.buildViewsFirstAddChart('chartBoth') ;
		this.down('#periodCombo').setValue('Quotidien') ;
		/*
		Ext.Array.each(['chartIn','chartOut','chartBoth'],function(itemId) {
			this.buildViewsFirstAddChart(itemId) ;
		},this) ;
		*/
	},

	buildViewsFirstAddChart: function( itemId ) {
		this._chartItemId = itemId;
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

		var fields, title, cntChart ;
		switch( itemId ) {
			case 'chartIn' :
				fields = fieldsChartIn ;
				title = 'Actions entrantes' ;
				cntChart = this.down('#hCntChart') ;
				break ;
			case 'chartOut' :
				fields = fieldsChartOut ;
				title = 'Actions sortantes' ;
				cntChart = this.down('#hCntChart') ;
				break ;
			case 'chartBoth' :
				fields = fieldsChartBoth ;
				title = 'Toutes actions' ;
				cntChart = this.down('#vCntChart') ;
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
		})
		var markerFx = {
			duration: 200,
			easing: 'backOut'
		};
		cntChart.add({
			xtype: 'panel',
			itemId: 'cnt'+itemId,
			layout: 'fit',
			flex: 1,
			cls: 'chart-no-border',
			height: 400,
			title: title,
			tbar: [{
				xtype: 'segmentedbutton',
					width: 200,
					items: [{
					text: 'Défiler',
					pressed: true
					},{
					text: 'Zoomer'
					}],
					listeners: {
						toggle: function (segmentedButton, button, pressed) {
							var chart = this.up('panel').down('cartesian') ;
							if (button.text == 'Défiler'){
								chart.getInteractions()[0].setZoomOnPanGesture(false) ;
							}
							if (button.text == 'Zoomer'){
								chart.getInteractions()[0].setZoomOnPanGesture(true);
							}
						}
					}
				},{
					text: 'Reset Graphique',
					handler: function () {
						var chart = this.up('panel').down('cartesian'),
							axes = chart.getAxes();
						axes[0].setVisibleRange([0, 1]);
						axes[1].setVisibleRange([0, 0.3]);
						chart.redraw();
					}
				}
			],
			items: [],
			listeners: {
				afterrender: function(p) {
					p.add({
						xtype: 'cartesian',
						itemId: itemId,
						width: '100%',
						height: '100%',
						store: {
							fields: fields,
							data: []
						},
						interactions: [{
							type: 'panzoom',
							enabled: true,
							zoomOnPanGesture: false,
							axes: {
								bottom: {
									allowPan: true,
									allowZoom: true
								},
								left: {
									allowPan: true,
									allowZoom: true
								},
								right: {
									allowPan: false,
									allowZoom: false,
									}
								}
							}],
						axes: [{
							type: 'numeric',
							fields: fieldAxisLeft,
							position: 'left',
							grid: true,
						},{
							type: 'category',
							fields: fieldAxisBottom,
							position: 'bottom',
							grid: true,
						},{
							type: 'numeric',
							fields: fieldAxisRight,
							position: 'right',
							renderer: function (v) {
								return v.toFixed(v < 10 ? 1: 0) + '€';
							},
							minimum: 0
						}],
						series: [{
							type: 'line',
							xField: 'date_group',
							yField: fields[1].name,
							title: fields[1].srcReportvalTxt,
							colors: ['#D20606'],
							highlight: true,
							style: {
								linewidth: 3,
								/*
								stroke: '#D20606',
								'stroke-width': 1,
								lineDash: [10,10]  // Draws dashed lines
								*/
							},
							marker: {
								radius: 3,
								fn: markerFx
							},
							highlightCfg: {
								scaling: 2
							},
							tooltip: {
								trackMouse: true,
								style: 'background: #fff',
								renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' ' + storeItem.get('date_group') + ': ' + Ext.util.Format.number(storeItem.get(item.series.getYField()), '0,000') + '€');
								}
							}
						},{
							type: 'line',
							xField: 'date_group',
							yField: fields[2].name,
							title: fields[2].srcReportvalTxt,
							colors: ['#26E118'],
							style: {
								linewidth: 2,
								//fill: '#FF8432'
								},
							marker: {
								radius: 2
							},
							highlightCfg: {
								scaling: 2
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
							colors: ['#1890E1'],
							style: {
								linewidth: 2,
								//stroke: '#EDBD39',
								//fill: '#EDBD39'
							},
							highlightCfg: {
								scaling: 2
							},
							marker: {
								radius: 2
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
							colors: ['#FFFF00'],
							style: {
								linewidth: 2,
								//stroke: '#FFA500',
								//fill: '#FFA500'
							},
							marker: {
								radius: 2
							},
							highlightCfg: {
								scaling: 2
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
		fields[0] = 'cash' ;
		fields[1] = 'calls_in' ;
		fields[2] = 'emails_out';
		fields[3] = 'emails_in' ;
		fields[4] = 'mails_out' ;
		fields[5] = 'mails_in' ;
		fields[6] = 'calls_out';
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
		//console.log(queryData.columns) ;
		Ext.Array.each( queryData.columns, function(col) {
			if( Ext.isEmpty(col.reportval_id) ) {
				Ext.apply(col,{
					tdCls: 'op5-spec-rsiveo-taupe',
					width: 150
				}) ;
				fields.push({name: col.dataIndex, type:'string'}) ;
			} else {
				Ext.apply(col,{
					align: 'right'
				}) ;
				fields.push({name: col.dataIndex, type:'number', allowNull:true}) ;
			}
			columns.push(col) ;

		});
		columns.push({width: 150, dataIndex: "v_total", reportval_id: "total", text: "Total actions", date_start: columns[2].date_start, date_end: columns[2].date_end, align: 'right'}) ;
		fields.push({name: 'v_total', type: 'number', allowNull: true }) ;
		var col = [] ;
		Ext.Array.each(columns, function (col) {
			if (col.dataIndex == 'v_cash'){
				col['renderer'] = function (value) {
					if (!Ext.isEmpty(value)) {
						return Ext.util.Format.number(value, '0,000') + ' €';
					}
				}
				col['summaryType'] = 'sum';
				col['summaryRenderer'] = function(value) {
					return '<b>'+ Ext.util.Format.number(value,'0,000') +' €</b>' ;
				}
			}
			else if (col.dataIndex == 'group_txt'){
				col['summaryType'] = 'count';
				col['summaryRenderer'] = function(value, summaryData, dataIndex) {
					return '<b>'+'Total'+'</b>' ;
				}
			}

			else{
				col['summaryType'] = 'sum';
				col['summaryRenderer'] = function(value) {
					return '<b>'+value+'</b>' ;
				}
			}

		}) ;
		//console.log(data) ;
		Ext.Array.each(data, function (val) {
			if (val.v_mails_in == null){
				val.v_mails_in = 0;
			}
			if (val.v_calls_in == null){
				val.v_calls_in = 0;
			}
			if (val.v_mails_out == null){
				val.v_mails_out = 0;
			}
			if (val.v_emails_out == null){
				val.v_emails_out = 0;
			}
			if (val.v_emails_in == null){
				val.v_emails_in = 0;
			}
			if (val.v_calls_out == null){
				val.v_calls_out = 0;
			}
			var mails_in = parseInt(val.v_mails_in, 10) ;
			var mails_out = parseInt(val.v_mails_out, 10) ;
			var emails_out = parseInt(val.v_emails_out, 10) ;
			var emails_in = parseInt(val.v_emails_in, 10) ;
			var calls_out = parseInt(val.v_calls_out, 10) ;
			var calls_in = parseInt(val.v_calls_in, 10) ;

			val.v_total = mails_in + mails_out + emails_in + emails_out + calls_in + calls_out;


		});

		var gridPanel = Ext.create('Ext.grid.Panel',{
			columns: columns,
			scrollable: true,
			store: {
				fields: fields,
				data: data
			},
			features: [{
				ftype: 'summary',
				dock: 'bottom'
			}]
		});
		this.down('#cntGrid').removeAll() ;
		this.down('#cntGrid').add(gridPanel) ;
		//this.down('#p1').setVisible(true) ;
	},

	loadChartsData: function (date_start, date_end, timebreak_group) {
		if (Ext.isEmpty(date_start) && Ext.isEmpty(date_end) && Ext.isEmpty(timebreak_group)){
			date_end = new Date() ;
			date_start = Ext.Date.subtract(date_end, Ext.Date.DAY, 45) ;
			timebreak_group = 'DAY'
			date_end = Ext.Date.format(date_end, 'Y-m-d') ;
			date_start = Ext.Date.format(date_start,'Y-m-d') ;
		}
		this.showLoadmask() ;
		var filtersValue = this.getFilterValues() ;
		filtersValue.filter_date.date_start = date_start
		filtersValue.filter_date.date_end = date_end;
		var group = new Ext.util.HashMap();
		group.add('groupby_atr', '') ;
		group.add('timebreak_is_on', 'on') ;
		group.add('timebreak_group', timebreak_group) ;

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
				//this.down('#periodCombo').setValue('Hebdomadaire') ;
				//this.onLoadData(ajaxResponse) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	buildCharts: function (ajaxResponse) {
		this.showLoadmask();
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

			Ext.Array.each(chartData, function (val) {
				if (val.v_cash == null || isNaN(val.v_cash)){
					val.v_cash = 0;
				}
			}) ;

			chartStore.loadData(chartData) ;
			this.hideLoadmask() ;

		},this) ;

	}

});
