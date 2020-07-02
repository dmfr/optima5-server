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
		
		return 'Actions / Encaissements / DSO du ' + dateStartStr + ' au ' + dateEndStr ;
	},
	
	doLoad: function() {
		this.callParent() ;
		
		var filterValuesMain = this.getFilterValues(),
			filterValuesPrev = this.getFilterValues() ;
				
		var dateEnd = Ext.Date.parse(filterValuesMain['filter_date']['date_end'],'Y-m-d') ;
			
		var dateValueMainEnd = new Date(dateEnd),
			dateValueMainStart,
			dateValuePrevEnd,
			dateValuePrevStart ;
		switch( this._timebreakGroup ) {
			case 'MONTH' :
				dateValuePrevEnd = Ext.Date.subtract(dateValueMainEnd, Ext.Date.MONTH, 1) ;
				dateValueMainStart = Ext.Date.add(dateValuePrevEnd, Ext.Date.DAY, 1) ;
				dateValuePrevStart = Ext.Date.subtract(dateValueMainStart, Ext.Date.MONTH, 1) ;
				break ;
				
			case 'WEEK' :
				dateValuePrevEnd = Ext.Date.subtract(dateValueMainEnd, Ext.Date.DAY, 7) ;
				dateValueMainStart = Ext.Date.add(dateValuePrevEnd, Ext.Date.DAY, 1) ;
				dateValuePrevStart = Ext.Date.subtract(dateValueMainStart, Ext.Date.DAY, 7) ;
				break ;
				
			case 'DAY' :
				dateValueMainStart = dateValueMainEnd ;
				dateValuePrevEnd = Ext.Date.subtract(dateValueMainEnd, Ext.Date.DAY, 1) ;
				dateValuePrevStart = dateValuePrevEnd ;
				break ;
		}
		
		filterValuesMain['filter_date']['date_start'] = Ext.Date.format(dateValueMainStart,'Y-m-d') ;
		filterValuesMain['filter_date']['date_end'] = Ext.Date.format(dateValueMainEnd,'Y-m-d') ;
		
		filterValuesPrev['filter_date']['date_start'] = Ext.Date.format(dateValuePrevStart,'Y-m-d') ;
		filterValuesPrev['filter_date']['date_end'] = Ext.Date.format(dateValuePrevEnd,'Y-m-d') ;
		
		this.loadResultSets({
			cashin: {
				filters: filterValuesMain,
				reportval_ids: ['cash_in']
			},
			cashin_before: {
				filters: filterValuesPrev,
				reportval_ids: ['cash_in']
			},
			dso: {
				filters: filterValuesMain,
				reportval_ids: ['dso_avg']
			},
			dso_before: {
				filters: filterValuesPrev,
				reportval_ids: ['dso_avg']
			},
			actionsauto: {
				reportval_ids: ['actions?aclass=auto']
			},
			actionsman: {
				reportval_ids: ['actions?aclass=manual']
			},
			timebreak: {
				reportval_ids: ['actions?aclass=auto','actions?aclass=manual','cash_in','dso_avg'],
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
			width: 350,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			scrollable: 'vertical',
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
				margin: 16,
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
				title: 'DSO (moyenne)',
				margin: 16,
				frame: true,
				//width: 350,
				height: 200,
				layout: {
					type: 'fit',
					align: 'stretch'
				},
				items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
					itemId: 'dsoAvg'
				})
			},{
				xtype: 'panel',
				title: 'Actions sur période complète',
				margin: 16,
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
	
	forceCfgChange: function( values ) {
		this._cfgChangeSilent = true ;
		this.down('#cfgForm').getForm().setValues({
			timebreak_group: values.timebreak_group
		}) ;
		this._cfgChangeSilent = false ;
	},
	onCfgChange: function() {
		var form = this.down('#cfgForm').getForm(),
			formValues = form.getFieldValues() ;
		if( formValues['timebreak_group'] ) {
			this._timebreakGroup = formValues['timebreak_group'] ;
		}
		if( this._cfgChangeSilent ) {
			return ;
		}
		this.doLoad() ;
	},
	
	onResultSets: function() {
		this.callParent() ;
		if( !this._viewInstalled ) {
			this.buildPage() ;
		}
		
		var dateValueMainEnd = this.getResultSetRaw('cashin')['columns'][0]['date_end'],
			dateValueMainEndStr = Ext.Date.format(Ext.Date.parse(dateValueMainEnd,'Y-m-d'),"d/m/Y") ;
		var dateValueMainStart = this.getResultSetRaw('cashin')['columns'][0]['date_start'],
			dateValueMainStartStr = Ext.Date.format(Ext.Date.parse(dateValueMainStart,'Y-m-d'),"d/m/Y") ;
		
		var dateValuePrevEnd = this.getResultSetRaw('cashin_before')['columns'][0]['date_end'],
			dateValuePrevEndStr = Ext.Date.format(Ext.Date.parse(dateValuePrevEnd,'Y-m-d'),"d/m/Y") ;
		var dateValuePrevStart = this.getResultSetRaw('cashin_before')['columns'][0]['date_start'],
			dateValuePrevStartStr = Ext.Date.format(Ext.Date.parse(dateValuePrevStart,'Y-m-d'),"d/m/Y") ;
			
		
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
			caption: 'Total du ' + dateValueMainStartStr + (dateValueMainEndStr==dateValueMainStartStr ? '' : ' au ' + dateValueMainEndStr),
			main_value: Ext.util.Format.number(tileValue, '0,000'),
			main_suffix: '€',
			//main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
			eval_caption: 'Du ' + dateValuePrevStartStr + (dateValuePrevEndStr==dateValuePrevStartStr ? '' : ' au ' + dateValuePrevEndStr),
			eval_value: Ext.util.Format.number(tileBeforeValue, '0,000'),
			eval_suffix: '€',
			eval_direction: eval_direction
		} ;
		this.down('#cashIn').update(componentData) ;
		
		
		var tileValue = this.getResultSet('dso')[0]['values'][0],
			tileBeforeValue = this.getResultSet('dso_before')[0]['values'][0] ;
		var eval_direction = '' ;
		if( tileValue > tileBeforeValue ) {
			eval_direction = 'more-bad' ;
		}
		if( tileValue < tileBeforeValue ) {
			eval_direction = 'less-good' ;
		}
		var componentData = {
			caption: 'Moyenne du ' + dateValueMainStartStr + (dateValueMainEndStr==dateValueMainStartStr ? '' : ' au ' + dateValueMainEndStr),
			main_value: Ext.util.Format.number(tileValue, '0.0'),
			main_suffix: 'j',
			//main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
			eval_caption: 'Moyenne du ' + dateValuePrevStartStr + (dateValuePrevEndStr==dateValuePrevStartStr ? '' : ' au ' + dateValuePrevEndStr),
			eval_value: Ext.util.Format.number(tileBeforeValue, '0.0'),
			eval_suffix: 'j',
			eval_direction: eval_direction
		} ;
		this.down('#dsoAvg').update(componentData) ;
		
		
		var tileValue = this.getResultSet('actionsauto')[0]['values'][0] ;
		var componentData = {
			caption: 'Actions automatiques',
			main_value: Ext.util.Format.number(tileValue, '0,000'),
			main_suffix: '',
			//main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
		} ;
		this.down('#actionsAuto').update(componentData) ;
		
		
		var tileValue = this.getResultSet('actionsman')[0]['values'][0] ;
		var componentData = {
			caption: 'Actions manuelles',
			main_value: Ext.util.Format.number(tileValue, '0,000'),
			main_suffix: '',
			//main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
		} ;
		this.down('#actionsMan').update(componentData) ;
		
		
		
		//build Grid
		var tableData = this.getResultSetRaw('timebreak') ;
		//console.dir(tableData) ;
		if( tableData.data.length==0 ) {
			this.down('#pMain').removeAll() ;
			return ;
		}
		
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
				case 'dso_avg' :
					reportval_txt = 'DSO (moyenne)' ;
					reportval_code = 'DSO_AVG' ;
					break ;
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
					if( r.get('reportval_id')=='dso_avg' ) {
						str = Ext.util.Format.number(v, '0.0') ;
						str+= ' j' ;
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
					if( record.get('reportval_id')=='dso_avg' ) {
						return 'op5-spec-rsiveo-dashboard-grid-orangerow' ;
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
		var yFieldsLineDso = [], yTitlesLineDso = []  ;
		
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
				
				case 'DSO_AVG' :
					yFieldsLineDso.push( mkey ) ;
					yTitlesLineDso.push( row.reportval_txt ) ;
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
					type: 'numeric',
					hidden: true,
					position: 'right',
					adjustByMajorUnit: true,
					grid: false,
					fields: [yFieldsLineDso[0]],
					renderer: function (v) { return Ext.util.Format.number(v,'0,000'); },
					minimum: 0,
			  
					title: 'Jours',
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
					title: yTitlesLine[0],
					xField: xField,
					yField: yFieldsLine[0],
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
				
			},{
					type: 'line',
					//axis: 'right',
					title: yTitlesLineDso[0],
					xField: xField,
					yField: yFieldsLineDso[0],
					//stacked: true,
					
					smooth: true,
					style: {
						//fill: '#A52A2A',
						//stroke: '#A52A2A',
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
							var str = 'DSO : ' ;
							str+= Ext.util.Format.number(storeItem.get(item.field),'0.0') ;
							str+= ' j' ;
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
