Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageActions',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPage',
	
	_timebreakGroup: 'MONTH',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			}
		}) ;
		this.callParent() ;
	},
	
	getTitleString: function() {
		var filterData = this.getFilterValues() ;
		//console.dir(filterData) ;
		if( Ext.isEmpty(filterData['filter_date']['date_start']) || Ext.isEmpty(filterData['filter_date']['date_end']) ) {
			return '???' ;
		}
		if( filterData['filter_date']['date_end'] < filterData['filter_date']['date_start'] ) {
			return '???' ;
		}
		
		var dateStartStr = Ext.Date.format(Ext.Date.parse(filterData['filter_date']['date_start'],'Y-m-d'),"d/m/Y") ;
		var dateEndStr = Ext.Date.format(Ext.Date.parse(filterData['filter_date']['date_end'],'Y-m-d'),"d/m/Y") ;
		
		return 'Actions réalisées & Encaissements du ' + dateStartStr + ' au ' + dateEndStr ;
	},
	
	doLoad: function() {
		this.callParent() ;
		
		var filterValuesBefore = this.getFilterValues(),
			dateStart = Ext.Date.parse(filterValuesBefore['filter_date']['date_start'],'Y-m-d'),
			dateEnd = Ext.Date.parse(filterValuesBefore['filter_date']['date_end'],'Y-m-d') ;
			
		var dateInterval = Ext.Date.diff(dateStart,dateEnd,Ext.Date.DAY) ;
		dateEnd = Ext.Date.subtract(dateStart,Ext.Date.DAY,1) ;
		dateStart = Ext.Date.subtract(dateEnd,Ext.Date.DAY,dateInterval) ;
		
		filterValuesBefore['filter_date']['date_start'] = Ext.Date.format(dateStart,'Y-m-d') ;
		filterValuesBefore['filter_date']['date_end'] = Ext.Date.format(dateEnd,'Y-m-d') ;
		
		this.loadResultSets({
			cashin: {
				reportval_ids: ['cash_in']
			},
			cashin_before: {
				filters: filterValuesBefore,
				reportval_ids: ['cash_in']
			},
			actionsauto: {
				reportval_ids: ['actions?aclass=auto']
			},
			actionsman: {
				reportval_ids: ['actions?aclass=manual']
			},
			timebreak: {
				reportval_ids: ['actions?aclass=auto','actions?aclass=manual','cash_in'],
				axes: {
					timebreak_is_on: true,
					timebreak_group: this._timebreakGroup
				}
			},
		}) ;
	},
	
	buildPage: function() {
		var tilePanel = {
			xtype: 'panel',
			width: 300,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'form',
				itemId: 'cfgForm',
				layout: 'anchor',
				bodyPadding: '4px 12px',
				fieldDefaults: {
					anchor: '100%',
					labelAlign: 'top'
				},
				items: [{
					xtype: 'combobox',
					name: 'timebreak_group',
					fieldLabel: 'Périodicité',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'DAY', lib:'Quotidienne'},
							{mode:'WEEK', lib:'Hebdomadaire'},
							{mode:'MONTH', lib:'Mensuelle'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				}]
			},{
				xtype: 'panel',
				title: 'Encaissements',
				margin: 10,
				frame: true,
				//width: 350,
				height: 200,
				layout: {
					type: 'fit',
					align: 'stretch'
				},
				items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
					itemId: 'cashIn'
				})
			},{
				xtype: 'panel',
				title: 'Actions',
				margin: 10,
				frame: true,
				//width: 350,
				//height: 230,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
					itemId: 'actionsAuto',
					padding: 4
				}),Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
					itemId: 'actionsMan',
					padding: 4
				})]
			}]
		} ;
		
		
		this.removeAll() ;
		this.add(tilePanel,{
			xtype: 'panel',
			flex: 1,
			itemId: 'pMain',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: []
		}) ;
		
		this.down('#cfgForm').getForm().setValues({
			timebreak_group: this._timebreakGroup
		}) ;
		this.down('#cfgForm').getForm().getFields().each(function(field) {
			field.on('change',function(ifield){
				this.onCfgChange() ;
			},this) ;
		},this) ;
		
		this._viewInstalled = true ;
	},
	
	onCfgChange: function() {
		var form = this.down('#cfgForm').getForm(),
			formValues = form.getFieldValues() ;
		if( formValues['timebreak_group'] ) {
			this._timebreakGroup = formValues['timebreak_group'] ;
		}
		this.doLoad() ;
	},
	
	onResultSets: function() {
		if( !this._viewInstalled ) {
			this.buildPage() ;
		}
		
		var filterValuesBefore = this.getFilterValues(),
			dateStart = Ext.Date.parse(filterValuesBefore['filter_date']['date_start'],'Y-m-d'),
			dateEnd = Ext.Date.parse(filterValuesBefore['filter_date']['date_end'],'Y-m-d') ;
			
		var dateInterval = Ext.Date.diff(dateStart,dateEnd,Ext.Date.DAY) ;
		//console.dir(dateInterval) ;
		dateEnd = Ext.Date.subtract(dateStart,Ext.Date.DAY,1) ;
		dateStart = Ext.Date.subtract(dateEnd,Ext.Date.DAY,dateInterval) ;
		
		var dateBeforeStartStr = Ext.Date.format(dateStart,'d/m/Y') ;
		var dateBeforeEndStr = Ext.Date.format(dateEnd,'d/m/Y') ;
		
		
		var tileValue = this.getResultSet('cashin')[0]['values'][0],
			tileBeforeValue = this.getResultSet('cashin_before')[0]['values'][0] ;
		var eval_direction = '' ;
		if( tileValue > tileBeforeValue ) {
			eval_direction = 'more-good' ;
		}
		if( tileValue < tileBeforeValue ) {
			eval_direction = 'less-bad' ;
		}
		var componentData = {
			caption: 'Montant',
			main_value: Ext.util.Format.number(tileValue, '0,000'),
			main_suffix: '€',
			main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
			eval_caption: 'Du ' + dateBeforeStartStr + ' au ' + dateBeforeEndStr,
			eval_value: Ext.util.Format.number(tileBeforeValue, '0,000'),
			eval_suffix: '€',
			eval_direction: eval_direction
		} ;
		this.down('#cashIn').update(componentData) ;
		
		
		var tileValue = this.getResultSet('actionsauto')[0]['values'][0] ;
		var componentData = {
			caption: 'Actions automatiques',
			main_value: Ext.util.Format.number(tileValue, '0,000'),
			main_suffix: '',
			main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
		} ;
		this.down('#actionsAuto').update(componentData) ;
		
		
		var tileValue = this.getResultSet('actionsman')[0]['values'][0] ;
		var componentData = {
			caption: 'Actions manuelles',
			main_value: Ext.util.Format.number(tileValue, '0,000'),
			main_suffix: '',
			main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
		} ;
		this.down('#actionsMan').update(componentData) ;
		
		
		
		//build Grid
		var tableData = this.getResultSetRaw('timebreak') ;
		//console.dir(tableData) ;
		
		var fields = [] ;
		fields.push({
			name: 'reportval_color',
			type: 'string'
		},{
			name: 'reportval_code',
			type: 'string'
		}) ;
		Ext.Array.each( tableData.columns, function(col) {
			fields.push({
				name: col.dataIndex,
				type: Ext.isEmpty(col.reportval_id) ? 'string' : 'number'
			}) ;
		}) ;
		Ext.Array.each( tableData.data, function(row) {
			var reportval_txt = '',
				reportval_code = '' ;
			switch( row.reportval_id ) {
				case 'cash_in' :
					reportval_txt = 'Encaissements' ;
					reportval_code = 'CASH' ;
					break ;
				case 'actions?aclass=auto' :
					reportval_txt = 'Actions automatiques' ;
					reportval_code = 'ACTIONS_AUTO' ;
					break ;
				case 'actions?aclass=manual' :
					reportval_txt = 'Actions manuelles' ;
					reportval_code = 'ACTIONS_MAN' ;
					break ;
			}
			row.reportval_txt = reportval_txt ;
			row.reportval_code = reportval_code ;
		}) ;
		
		var columns = Ext.Array.merge([{
			width: 24,
			renderer: function(v,m,r) {
				if( !Ext.isEmpty(r.get('reportval_color')) ) {
					m.style="background-color:"+r.get('reportval_color');
				}
				return '&#160;' ;
			}
		}],tableData.columns) ;
		Ext.Array.each(columns,function(col) {
			if( col.dataIndex=='reportval_txt' ) {
				Ext.apply(col,{width:175}) ;
				return ;
			}
			if( !col.dataIndex || !(col.dataIndex.indexOf('v_')===0) ) {
				return ;
			}
			Ext.apply(col,{
				align: 'right',
				renderer: function(v,m,r,rowIdx, colIdx, store, view) {
					var column = view.getHeaderAtIndex(colIdx);
					var dataIndex = column.dataIndex;
					
					var str = Ext.util.Format.number(v, '0,000') ;
					if( r.get('reportval_id')=='cash_in' ) {
						str+= ' €' ;
					}
					return str ;
				}
			}) ;
		}) ;
		
		var grid = {
			xtype: 'grid',
			store: {
				proxy: {type:'memory'},
				fields: fields,
				data: Ext.clone(tableData.data),
				sorters: [{
					property: 'group_id',
					direction: 'ASC'
				}]
			},
			columns: columns,
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('reportval_id')=='cash_in' ) {
						return 'op5-spec-rsiveo-dashboard-grid-bluerow' ;
					}
				}
			}
		};
		
		
		
		
		
		
		var fields = [{
			name: 'timebreak_id',
			string: 'string'
		},{
			name: 'timebreak_txt',
			string: 'string'
		}] ;
		var xField = 'timebreak_txt' ;
		var yFieldsBar = [], yTitlesBar = []  ;
		var yFieldsLine = [], yTitlesLine = []  ;
		
		var groupIds = [],
			groupTitles = [] ;
		Ext.Array.each( tableData.data, function(row) {
			var mkey = 'g_'+row.reportval_code ;
			fields.push({
				name: mkey,
				type: 'number'
			}) ;
			switch( row.reportval_code ) {
				case 'ACTIONS_AUTO' :
				case 'ACTIONS_MAN' :
					yFieldsBar.push( mkey ) ;
					yTitlesBar.push( row.reportval_txt ) ;
					break ;
				
				case 'CASH' :
					yFieldsLine.push( mkey ) ;
					yTitlesLine.push( row.reportval_txt ) ;
					break ;
				
			}
		}) ;
		
		var chartData = [],
			chartRow ;
		Ext.Array.each( tableData.columns, function(col) {
			if( Ext.isEmpty(col.date_end) ) {
				return ;
			}
			chartRow = {
				timebreak_id: col.dataIndex,
				timebreak_txt: col.text
			};
			Ext.Array.each( tableData.data, function(row) {
				var mkey = 'g_'+row.reportval_code ;
				chartRow[mkey] = (row[col.dataIndex] > 0 ? row[col.dataIndex] : 0);
			});
			chartData.push(chartRow) ;
		}) ;
		
		//console.dir(yColors);
		//console.dir(yTitles);
		//console.dir(yFields);
		//console.dir( chartData ) ;
		
		
		var barchart = {
			xtype: 'cartesian',
			width: '100%',
			height: '100%',
			legend: {
				docked: 'left'
			},
			store: {
				proxy: {type:'memory'},
				fields: fields,
				data: chartData,
			},
			insetPadding: {
					top: 40,
					left: 40,
					right: 40,
					bottom: 40
			},
			axes: [{
					type: 'numeric',
					position: 'left',
					adjustByMajorUnit: true,
					grid: true,
					fields: [yFieldsBar[0]],
					renderer: function (v) { return Ext.util.Format.number(v,'0,000'); },
					minimum: 0,
			  
					title: 'Nombre d\'actions',
					label: {
						fontFamily: 'Play, sans-serif',
						fontSize: 12
					}
			}, {
					type: 'numeric',
					position: 'right',
					adjustByMajorUnit: true,
					grid: false,
					fields: [yFieldsLine[0]],
					renderer: function (v) { return Ext.util.Format.number(v,'0,000'); },
					minimum: 0,
			  
					title: 'Euros',
					label: {
						fontFamily: 'Play, sans-serif',
						fontSize: 12
					}
			}, {
					type: 'category',
					position: 'bottom',
					grid: true,
					fields: [xField],
					renderer: function (v) { 
						return v ;
					},
					label: {
						fontFamily: 'Play, sans-serif',
						fontSize: 12,
						rotate: {
							degrees: -45
						}
					}
			}],
			series: [{
					type: 'bar',
					axis: 'left',
					title: yTitlesBar,
					xField: xField,
					yField: yFieldsBar,
					stacked: true,
					style: {
						opacity: 0.80,
						minGapWidth: 30
					},
					highlight: {
						fillStyle: 'yellow'
					},
					tooltip: {
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							var groupTitle = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
							var str = '' ;
							str+= Ext.util.Format.number(storeItem.get(item.field),'0,000') ;
							str+= ' ' ;
							str+= groupTitle.toLowerCase() ;
							//str+= ' au cours de la période ' ;
							//str+= storeItem.get('timebreak_txt') ;
							this.setHtml(str);
						}
					}
			},{
					type: 'line',
					axis: 'right',
					title: yTitlesLine,
					xField: xField,
					yField: yFieldsLine,
					//stacked: true,
					
					smooth: true,
					style: {
						//fill: '#A52A2A',
						stroke: '#A52A2A',
						'stroke-width': 2 
					},
					marker: {
						type: 'circle',
						radius: 4,
						lineWidth: 2,
						fill: 'white'
					},
					highlight: {
						fillStyle: 'yellow'
					},
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							var groupTitle = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
							var str = '' ;
							str+= Ext.util.Format.number(storeItem.get(item.field),'0,000') ;
							str+= ' €' ;
							this.setHtml(str);
						}
					}
				
			}]
		} ;
		/*
		if( yColors.length>0 ) {
			//Ext.apply(barchart,{colors:yColors}) ;
		}
		*/
		
		var chartPanel = {
			flex: 1,
			xtype: 'panel',
			layout: 'fit',
			items: barchart
		} ;
		
		
		
		
		var pMain = this.down('#pMain') ;
		pMain.removeAll() ;
		pMain.add(grid,chartPanel) ;
	},
	
	dummyFn: function() {
		
	}
});
