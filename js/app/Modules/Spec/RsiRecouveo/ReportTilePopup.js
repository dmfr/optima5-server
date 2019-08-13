Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportTilePopup', {
	extend: 'Ext.panel.Panel',
	_preBuiltMode: null,
	_tileFilter: null,
	_filterStatus: null,
	_height: null,
	_width: null,
	_filterValues: null,


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

	initComponent: function () {
		Ext.apply(this, {
			layout: 'vbox',
			width: this._width,
			height: this._height,
			items: [{
				xtype: 'container',
				width: this._width,
				flex: 1,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
					xtype: 'container',
					flex: 0.5,
				},{
					xtype: 'container',
					flex: 1,
					layout: 'fit',
					itemId: 'cntGrid'
				},{
					xtype: 'container',
					flex: 0.5,
				}],
			}]
		}) ;
		this.callParent() ;
		this.showLoadmask() ;
		this.doLoad() ;
	},

	doLoad: function() {
		var cntGrid = this.down('#cntGrid') ;

		var filters = this._filterValues ;
		if (this._filterStatus != null){
			filters["filter_status"] = this._filterStatus
		} else{
			filters["filter_status"] = null ;
		}

		switch (this._preBuiltMode) {
			case "milestone":
				var fields = [
					"wallet_count",
					"wallet_amount"
				] ;
				break ;
			case "interval":
				var fields = [
					'cash',
					'mails_out',
					'mails_in',
					'calls_out',
					'calls_in',
					'emails_out',
					'emails_in'
				] ;
		}
		var grp = new Ext.util.HashMap() ;
		grp.add('groupby_atr', '') ;
		grp.add('groupby_is_on', 'on') ;
		grp.add('groupby_key', this._tileFilter) ;

		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getGrid',
				filters: Ext.JSON.encode(filters),
				axes: Ext.JSON.encode(grp.map),
				reportval_ids: Ext.JSON.encode(fields)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadData(ajaxResponse) ;
				this.createChartsFromGrid(ajaxResponse) ;

				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},

	onLoadData: function(queryData) {
		this.ajaxResponse = queryData ;
		var cntGrid = this.down('#cntGrid') ;
		var fields = [],
			columns = [],
			data = queryData.data ;
		Ext.Array.each( queryData.columns, function(col) {
			if( Ext.isEmpty(col.reportval_id) ) {
				Ext.apply(col,{
					tdCls: 'op5-spec-rsiveo-taupe',
					width: 150,
					summaryType: 'count',
					summaryRenderer: function(value, summaryData, dataIndex) {
						return '<b>'+'Total'+'</b>' ;
					}
				}) ;
				fields.push({name: col.dataIndex, type:'string'}) ;
			} else {
				Ext.apply(col,{
					align: 'center',
					summaryType: 'sum',
					summaryRenderer: function(value) {
						newValue = Ext.util.Format.number(value, '0,000') ;
						return '<b>'+newValue+'</b>' ;
					},
					renderer: function (value) {
						return Ext.util.Format.number(value, '0,000') ;
					}
				}) ;

				fields.push({name: col.dataIndex, type:'number', allowNull:true}) ;
			}
			columns.push(col) ;
		});

		console.log(columns) ;
		console.log(fields) ;
		console.log(data) ;
		var gridPanel = Ext.create('Ext.grid.Panel',{
			width: '100%',
			height: '100%',
			columns: columns,
			store: {
				fields: fields,
				data: data
			},
			features: [{
				ftype: 'summary',
				dock: 'bottom',
			}],
			tbar: [{
				xtype      : 'fieldcontainer',
				fieldLabel : 'Rupture sur attribut',
				defaultType: 'radiofield',
				defaults: {
					flex: 1
				},
				layout: 'hbox',
				items: [
					{ boxLabel: 'Affectation', name: 'groupby_key', inputValue: 'user' },
					{ boxLabel: 'Entité', name: 'groupby_key', inputValue: 'soc'},
					{ boxLabel: 'Attribut', name: 'groupby_key', inputValue: 'atr' },
					{ boxLabel: 'Statut', name: 'groupby_key', inputValue: 'status' }
				]
			},
			]
		});
		//cntGrid.removeAll() ;
		cntGrid.add(gridPanel);
	},

	createChartsFromGrid: function (ajaxResponse) {

		if (this._preBuiltMode == 'milestone'){
			console.log("milestone") ;
			this.buildPieCharts(ajaxResponse) ;
			this.hideLoadmask() ;
		}
		else{
			var fields = [
				'cash',
				'mails_out',
				'mails_in',
				'calls_out',
				'calls_in',
				'emails_out',
				'emails_in'
			];
			var group = new Ext.util.HashMap();
			group.add('groupby_atr', '') ;
			group.add('groupby_is_on', '') ;
			group.add('groupby_key', '') ;
			group.add('timebreak_is_on', 'on') ;
			group.add('timebreak_group', 'WEEK') ;

			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_rsi_recouveo',
					_action: 'report_getGrid',
					filters: Ext.JSON.encode(this._filterValues),
					axes: Ext.JSON.encode(group.map),
					reportval_ids: Ext.JSON.encode(fields)
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						Ext.MessageBox.alert('Error','Error') ;
						return ;
					}
					this.buildLineChart(ajaxResponse) ;
				},
				callback: function() {
				},
				scope: this
			}) ;
		}
	},

	buildPieCharts: function (ajaxResponse) {
		var data = ajaxResponse['data'];
		var columns = ajaxResponse['columns'] ;

		var fieldsAmount = ['group_id', 'group_txt', 'v_wallet_amount'] ;
		var fieldsCount = ['group_id', 'group_txt', 'v_wallet_count'] ;

		var dataCount = [] ;
		var dataAmount = [] ;

		Ext.Array.each(ajaxResponse['data'], function (row) {
			dataCount.push({
				'group_id' : row['group_id'],
				'group_txt': row['group_txt'],
				'v_wallet_count' : row['v_wallet_count']
			}) ;
			dataAmount.push({
				'group_id' : row['group_id'],
				'group_txt': row['group_txt'],
				'v_wallet_amount' : row['v_wallet_amount']
			}) ;
		}) ;
		var array = [] ;

		if (this._hasCharts){
			this.down('#pieAmount').getStore().loadData(dataAmount) ;
			this.down('#pieCount').getStore().loadData(dataCount) ;
			return ;
		}
		Ext.Array.each(['Count', 'Amount'], function (type) {
			switch (type) {
				case 'Count':
					var currFields = fieldsCount ;
					var currData = dataCount ;
					var valueType = 'v_wallet_count' ;
					var legend =  {
						docked: 'left',
						border: false,
						toggleable: false,
						style: {
							border: {
								color: 'white'
							}
						}
					} ;
					break ;
				case 'Amount':
					var currFields = fieldsAmount ;
					var currData = dataAmount ;
					var valueType = 'v_wallet_amount' ;
					var legend = null ;
					break ;
				default:
					return ;
			}

			var test = Ext.create({
				xtype: 'polar',
				height: this.getEl().getHeight() / 2 -20,
				width: this.getEl().getWidth() /2,
				renderTo: document.body,
				animation: false,
				itemId: 'pie' + type,
				border: false,
				store: {
					fields: currFields,
					data: currData
				},
				legend: legend,
				interactions: ['itemhighlight'],
				plugins: {
					ptype: 'chartitemevents',
					moveEvents: false
				},
				series: [{
					type: 'pie',
					xField: valueType,
					donut: 50,
					label: {
						field: 'group_txt',
						calloutLine: {
							color: 'rgba(0,0,0,0)' // Transparent to hide callout line
						},
						renderer: function(val) {
							return ''; // Empty label to hide text
						}
					},
					//highlight: true,
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							if (valueType == 'v_wallet_amount'){
								this.setHtml(storeItem.get('group_txt') + ': ' + storeItem.get(valueType) + '€');
							} else{
								this.setHtml(storeItem.get('group_txt') + ': ' + storeItem.get(valueType));
							}
						}
					}
				}]


			}) ;
			array.push(test) ;
		}, this) ;
		if (this._hasCharts == true){
			this.down('#chartsPanel').destroy() ;
			this._hasCharts = false ;
		}
		this.add({
			xtype: 'panel',
			flex: 1,
			layout: 'hbox',
			itemId: 'chartsPanel',
			border: false,
			items: [{
				xtype: 'panel',
				layout: 'fit',
				items: array[0]
			},{
				xtype: 'panel',
				layout: 'fit',
				items: array[1]
			}],
		}) ;
		console.log(this) ;
		this.updateLayout() ;
		this._hasCharts = true ;
		this.hideLoadmask() ;
	},

	buildLineChart: function (ajaxResponse) {
		console.log(ajaxResponse) ;

		var data = ajaxResponse['data'];
		var columns = ajaxResponse['columns'] ;

		var fieldsAmount = ['group_id', 'group_txt', 'v_wallet_amount'] ;
		var fieldsCount = ['group_id', 'group_txt', 'v_wallet_count'] ;

		var dataCount = [] ;
		var dataAmount = [] ;
		var fieldsChart = [
			{name: 'date_group', type: 'string', axis: 'bottom'},
			{name: 'v_cash', type: 'number', srcReportvalIds:['cash'], axis: 'right', srcReportvalTxt: 'Encaissements'},
			{name: 'v_mails_in', type: 'number', srcReportvalIds:['mails_in'], axis: 'left', srcReportvalTxt: 'Courriers entrants'},
			{name: 'v_mails_out', type: 'number', srcReportvalIds:['mails_out'], axis: 'left', srcReportvalTxt: 'Courriers sortants'},
			{name: 'v_emails_in', type: 'number', srcReportvalIds:['emails_in'], axis: 'left', srcReportvalTxt: 'Emails entrants'},
			{name: 'v_emails_out', type: 'number', srcReportvalIds:['emails_out'], axis: 'left', srcReportvalTxt: 'Emails sortants'},
			
			{name: 'v_calls_in', type: 'number', srcReportvalIds:['calls_in'], axis: 'left', srcReportvalTxt: 'Appels entrants'},
			{name: 'v_calls_out', type: 'number', srcReportvalIds:['calls_out'], axis: 'left', srcReportvalTxt: 'Appels sortants'}

		] ;

		var fields = [
			'cash',
			'mails_out',
			'mails_in',
			'calls_out',
			'calls_in',
			'emails_out',
			'emails_in'
		];

		var chartData = [] ;
		Ext.Array.each(ajaxResponse.columns, function(col) {
			if( !(col.date_start && col.date_end) ) {
				return ;
			}
			var chartRow = {
				date_group: col.text
			} ;
			Ext.Array.each( fieldsChart, function(targetField) {
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
		if (this._hasCharts){
			this.down('#lineChart').getStore().loadData(chartData) ;
			return ;
		}

		Ext.Array.each(chartData, function (val) {
			if (val.v_cash == null || isNaN(val.v_cash)){
				val.v_cash = 0;
			}
		}) ;

		var fieldAxisLeft = [];
		var fieldAxisRight = [];
		var fieldAxisBottom = [];
		Ext.Array.each(fieldsChart, function (field) {
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
		var series = [] ;
		Ext.Array.each( fieldsChart, function(field,idx) {
			if( idx==0 ) {
				return ;
			}
			var suffix = '' ;
			var highlight = false ;
			if( idx==1 ) { // v_cash
				suffix = '€' ;
				highlight = true ;
			}
			series.push({
				type: 'line',
				xField: 'date_group',
				yField: field.name,
				title: field.srcReportvalTxt,
				highlight: highlight,
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
						this.setHtml(title + ' ' + storeItem.get('date_group') + ': ' + Ext.util.Format.number(storeItem.get(item.series.getYField()), '0,000') + suffix);
					}
				}
			}) ;

		}) ;

		var lineChart = Ext.create({
			xtype: 'cartesian',
			itemId: "lineChart",
			height: this.getEl().getHeight() / 2 -20,
			width: this.getEl().getWidth(),
			legend: {
				docked: 'left',
				border: false,
				toggleable: true,
				style: {
					border: {
						color: 'white'
					}
				}
			},

			store: {
				fields: fieldsChart,
				data: chartData
			},
			interactions: ['itemhighlight'],
			axes: [{
				type: 'numeric',
				fields: fieldAxisLeft,
				position: 'left',
				grid: true,
				minimum: 0,
				renderer: function (v) {
					return Ext.util.Format.number(v, '0,000') ;
				}
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
					var newValue = Ext.util.Format.number(v, '0,000') ;
					return newValue + '€';
				},
				minimum: 0
			}],
			series: series
		}) ;
		if (this._hasCharts == true){
			console.log("destroy") ;
			this.down('#linePanel').destroy() ;
			this._hasCharts = false ;
		}
		this.add({
			xtype: 'panel',
			layout: 'fit',
			itemId: 'linePanel',
			border: false,
			flex: 1,
			items: lineChart,
		}) ;
		this.updateLayout() ;
		this._hasCharts = true ;
		this.hideLoadmask() ;
	}


})
