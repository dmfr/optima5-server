Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportChartsPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	alias: 'widget.op5specrsiveoreportchartspanel',

	requires: [
		'Ext.ux.grid.filters.filter.StringList',
		'Optima5.Modules.Spec.RsiRecouveo.UxGridFilters'
	],
	_filterDate: null,
	_chartItemId: null,
	_compteurMask: 0,
	showLoadmask: function() {
		this._compteurMask ++;
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
		this._compteurMask --;
		if (this._compteurMask == 0){
			this.un('afterrender',this.doShowLoadmask,this) ;
			if( this.loadMask ) {
				this.loadMask.destroy() ;
				this.loadMask = null ;
			}
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
		this._filterDate = this.getFilterValues().filter_date ;

	},

	onPeriodChange: function(combo, record, eOpts){
		var date_start, date_end, timebreak_group, temp;
		date_end = new Date() ;
		switch(record.data.timeId){
			case 'ann':
				date_start = Ext.Date.subtract(date_end, Ext.Date.YEAR, 8) ;
				timebreak_group = 'YEAR' ;
				break ;
			case 'mois':
				date_start = Ext.Date.subtract(date_end, Ext.Date.MONTH, 26);
				timebreak_group = 'MONTH' ;
				break ;
			case 'hebdo':
				date_start = Ext.Date.subtract(date_end, Ext.Date.DAY, 200) ;
				timebreak_group = 'WEEK' ;
				break ;
			case 'quot':
				date_start = Ext.Date.subtract(date_end, Ext.Date.DAY, 90) ;
				timebreak_group = 'DAY' ;
				break ;
			case 'sem':
				temp = Ext.Date.subtract(date_end, Ext.Date.YEAR, 8) ;
				temp = Ext.Date.format(temp, Ext.Date.YEAR) ;
				date_start = new Date('1/01/'+temp) ;
				//date_end = temp;
				timebreak_group = 'SEM' ;
				break ;
			case 'trim' :
				temp = Ext.Date.subtract(date_end, Ext.Date.YEAR, 8) ;
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
		if (this._filterDate.date_end != this.getFilterValues().filter_date.date_end || this._filterDate.date_start != this.getFilterValues().filter_date.date_start ){
			this._filterDate = this.getFilterValues().filter_date ;
			return ;
		}
		this.loadChartsData(null, null, null) ;

	},
	disableSerie: function(record, cnt){
		var containers;
		switch (cnt){
			case 'first' :
				containers = ['chartAuto', 'chartMan'] ;
				break ;
			case 'second' :
				containers = ['chartBoth'] ;
				break ;
		}
		Ext.Array.each(containers, function (cnt_id) {
			var text;
			switch(cnt_id){
				case 'chartAuto':
					text = ' auto' ;
					break ;
				case 'chartMan':
					text = ' man' ;
					break ;
				case 'chartBoth':
					text = '' ;
					break ;
			}
			var chart = this.down('#'+cnt_id).series ;
			Ext.Array.each(chart, function (rec) {
				//console.dir(rec) ;
				//console.dir(record.arr_targets) ;
				
				if( Ext.Array.contains(record.arr_targets,rec.getYField()) ) {
					rec.setHidden(record.is_disabled) ;
				}
			}) ;
			this.down('#'+cnt_id).redraw() ;
		}, this) ;
	},
	buildLegend: function(location){
		var cnt, tmp;
		switch (location){
			case 'first' :
				this._tmp_id = 1;
				this._cnt = 'hCntChart' ;
				tmp = 'first';
				break ;
			case 'second' :
				this._tmp_id = 2;
				this._cnt = 'vCntChart' ;
				tmp = 'second' ;
				var _doHide = true;
				break ;
		}
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
		var ViewLegendStore = Ext.create('Ext.data.Store', {
			fields: [{name: 'iconCls', type: 'string'}, {name: 'legendTxt', type: 'string'}, {name: 'is_disabled', type:'boolean'},{name:'arr_targets', type:'auto'}],
			data: []
		})
		var legend = {
			xtype: 'panel',
			title: '&#160;',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			width: 150,
			items: [{
				xtype: 'dataview',
				store: ViewLegendStore,
				padding: '100 0 0 0',
				tpl: [
					'<tpl for=".">',
						'<div class="op5-spec-rsiveo-circle-item">',
							'<tpl if="is_disabled">',
							'<div class="op5-spec-rsiveo-circle-item-icon"></div>',
							'</tpl>',
							'<tpl if="!is_disabled">',
							'<div class="op5-spec-rsiveo-circle-item-icon {iconCls}"></div>',
							'</tpl>',
							'<div class="op5-spec-rsiveo-legend-view-text">',
								'{legendTxt}',
							'</div>',
						'</div>',
					'</tpl>'
				],
				itemId: 'myViewLegend'+this._tmp_id,
				itemSelector: 'div.op5-spec-rsiveo-circle-item',
				width: '20%',
				listeners: {
					itemclick: function( dataview, record, item, index) {
						record.set('is_disabled',!record.get('is_disabled')) ;
						this.syncChartsWithLegendStatus(dataview, tmp) ;
						//console.log(this._cnt) ;
						//this.onViewClick(record, this._tmp_id, cnt) ;
						//this.disableSerie(record, tmp) ;
					},
					scope: this
				}
			},{
				xtype: 'combobox',
				displayField: 'timeTxt',
				fieldLabel: 'Périodicité',
				labelAlign: 'top',
				store: comboStore,
				hidden: _doHide,
				width: '20%',
				padding: '40 0 0 0',
				minChars: 0,
				queryMode: 'local',
				typeAhead: true,
				itemId: 'periodCombo'+this._tmp_id,
				listeners: {
					select: this.onPeriodChange,
					scope: this,
				},
			}]
		}
		this.down('#'+this._cnt).add(legend) ;
		
		var viewLegendData = [
			{iconCls: 'op5-spec-rsiveo-circle-red', legendTxt: 'Encaissements', arr_targets:['v_cash']},
			{iconCls: 'op5-spec-rsiveo-circle-green', legendTxt: 'Courriers', arr_targets:['v_mails_auto','v_mails_man','v_mails']},
			{iconCls: 'op5-spec-rsiveo-circle-yellow', legendTxt: 'Appels', arr_targets:['v_calls_auto','v_calls_man','v_calls']},
			{iconCls: 'op5-spec-rsiveo-circle-blue', legendTxt: 'Emails', arr_targets:['v_emails_auto','v_emails_man','v_emails']}
		];
		this.down('#myViewLegend'+this._tmp_id).getStore().loadData(viewLegendData) ;
		this.down('#periodCombo'+this._tmp_id).setValue('Quotidien') ;
	},
	buildViewsFirst: function() {
		if( this._viewsCreated ) {
			return ;
		}
		this._viewsCreated = true;
		// Appel au démarrage : création GRID + CHARTS
		this.removeAll() ;
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
				type: 'hbox',
				align: 'stretch'
			}
		}) ;
		this.buildViewsFirstAddChart('chartAuto') ;
		this.buildLegend('first') ;
		this.buildViewsFirstAddChart('chartMan') ;
		this.buildViewsFirstAddChart('chartBoth') ;
		this.buildLegend('second') ;
	},

	buildViewsFirstAddChart: function( itemId ) {
		this._chartItemId = itemId;
		var fieldsChartAuto = [
			{name: 'date_group', type: 'string', axis: 'bottom'},
			{name: 'v_cash', type: 'number', srcReportvalIds:['cash'], axis: 'right', srcReportvalTxt: 'Encaissements'},
			{name: 'v_mails_auto', type: 'number', srcReportvalIds:['mails_out%auto'], axis: 'left', srcReportvalTxt: 'Courriers sortants'},
			{name: 'v_emails_auto', type: 'number', srcReportvalIds:['emails_out%auto'], axis: 'left', srcReportvalTxt: 'Emails sortants'},
			{name: 'v_calls_auto', type: 'number', srcReportvalIds:['calls_out%auto'], axis: 'left', srcReportvalTxt: 'Appels sortants'}
		] ;

		var fieldsChartMan = [
			{name: 'date_group', type: 'string', axis: 'bottom'},
			{name: 'v_cash', type: 'number', srcReportvalIds:['cash'], axis: 'right', srcReportvalTxt: 'Encaissements'},
			{name: 'v_mails_man', type: 'number', srcReportvalIds:['mails_in','mails_out%manual'	], axis: 'left', srcReportvalTxt: 'Courriers sortants'},
			{name: 'v_emails_man', type: 'number', srcReportvalIds:['emails_in','emails_out%manual'], axis: 'left', srcReportvalTxt: 'Emails sortants'},
			{name: 'v_calls_man', type: 'number', srcReportvalIds:['calls_in','calls_out%manual'], axis: 'left', srcReportvalTxt: 'Appels sortants'}
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
			case 'chartAuto' :
				fields = fieldsChartAuto ;
				title = 'Actions automatiques' ;
				cntChart = this.down('#hCntChart') ;
				break ;
			case 'chartMan' :
				fields = fieldsChartMan ;
				title = 'Actions manuelles' ;
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
		
		var seriesColors = ['#000000','#D20606','#26E118','#1890E1','#FFFF00'] ;
		var series = [] ;
		Ext.Array.each( fields, function(field,idx) {
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
				colors: [seriesColors[idx]],
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
		
		cntChart.add({
			xtype: 'panel',
			itemId: 'cnt'+itemId,
			layout: 'fit',
			flex: 1,
			cls: 'chart-no-border',
			height: 400,
			title: title,
			tbar: [{
					text: 'Échelle par défaut',
					handler: function () {
						var chart = this.up('panel').down('cartesian'),
							axes = chart.getAxes();
						axes[1].setVisibleRange([0.5, 1]);
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
							}, 'itemhighlight'],
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
							visibleRange: [0.5, 1]
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
 
					var chart = this.down('#'+itemId),
						panzoom = chart.getInteractions()[0];
					this.down('#cnt'+itemId).down('toolbar').add(panzoom.getModeToggleButton());
					var segmentedButton = this.down('#cnt'+itemId).down('toolbar').items.items[1].items ;
					segmentedButton.items[0].setText('Défiler') ;
					segmentedButton.items[1].setText('Zoom') ;
					segmentedButton.items[0].setTooltip('Pour faire défiler le graphique, ' +
						'cliquer sur le graphique et glisser la souris dans la direction que vous voulez atteindre. Attention, cela ne marchez qu\'avec un graphique zoomer.') ;
					segmentedButton.items[1].setTooltip('Pour zoomer, cliquez sur le graphique et glisser la souris:' +
						'De gauche à droite pour dézoomer/zoomer sur l\'abscisse & de haut en bas pour l\'axe des actions');

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

		var fields = [
			'cash',
			'mails_out',
			'mails_in',
			'calls_out',
			'calls_in',
			'emails_out',
			'emails_in'
		];
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
				fields.push({name: col.dataIndex, type:'number', allowNull:false}) ;
			}
			columns.push(col) ;

		});
		columns.push({width: 150, dataIndex: "v_total", reportval_id: "total", text: "Total actions", date_start: columns[2].date_start, date_end: columns[2].date_end, align: 'right'}) ;

		fields.push({name: 'v_total', type: 'number', allowNull: false }) ;
		var col = [] ;
		Ext.Array.each(columns, function (col) {
			if (col.dataIndex == 'v_cash'){
				col['renderer'] = function (value) {
					if (!Ext.isEmpty(value)) {
						if (value < 0){
							return Ext.util.Format.number(0, '0,000') + ' €';
						}
						return Ext.util.Format.number(value, '0,000') + ' €';
					}
				}
				col['summaryType'] = 'sum';
				col['summaryRenderer'] = function(value) {
					if (value < 0){
						return '<b>'+ Ext.util.Format.number(0,'0,000') +' €</b>' ;
					}
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
					newValue = Ext.util.Format.number(value, '0,000') ;
					return '<b>'+newValue+'</b>' ;
				}
				col['renderer'] = function (value) {
					return Ext.util.Format.number(value, '0,000') ;
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
			if (val.v_autosent == null){
				val.v_autosent = 0;
			}
			var mails_in = parseInt(val.v_mails_in, 10) ;
			var mails_out = parseInt(val.v_mails_out, 10) ;
			var emails_out = parseInt(val.v_emails_out, 10) ;
			var emails_in = parseInt(val.v_emails_in, 10) ;
			var calls_out = parseInt(val.v_calls_out, 10) ;
			var calls_in = parseInt(val.v_calls_in, 10) ;
			var autosent = parseInt(val.v_autosent, 10) ;

			val.v_total = autosent + mails_in + mails_out + emails_in + emails_out + calls_in + calls_out;


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

		var fields = [
			'calls_out%auto',
			'calls_out%manual',
			'calls_in',
			'emails_out%auto',
			'emails_out%manual',
			'emails_in',
			'mails_out%auto',
			'mails_out%manual',
			'mails_in',
			'cash'
		];
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
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	buildCharts: function (ajaxResponse) {
		this.showLoadmask();
		Ext.Array.each(['chartAuto','chartMan','chartBoth'],function(itemId) {
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
					console.log(ajaxResponse) ;
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

	},
	
	
	syncChartsWithLegendStatus: function(legendDataview, cnt) {
		var legendDataviewStore = legendDataview.getStore() ;
		legendDataviewStore.each(function(storeRecord) {
			this.disableSerie(storeRecord.getData(), cnt) ;
		}, this);
	}

});
