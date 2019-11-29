Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletGroup',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPage',
	
	_groupbyKey: 'fstatus',
	
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
		if( Ext.isEmpty(filterData['filter_date']['date_end']) ) {
			return '???' ;
		}
		
		var dateEndStr = Ext.Date.format(Ext.Date.parse(filterData['filter_date']['date_end'],'Y-m-d'),"d/m/Y") ;
		
		return 'Décomposition de l\'encours au ' + dateEndStr ;
	},
	
	doLoad: function() {
		this.callParent() ;
		
		var filterValuesBefore = this.getFilterValues() ;
		filterValuesBefore['filter_date']['date_end'] = filterValuesBefore['filter_date']['date_start'] ;
		
		var groupbyKey = this._groupbyKey,
			groupbyKeyGrid = groupbyKey ;
		if( groupbyKey=='fstatus' ) {
			groupbyKey = 'status' ;
			groupbyKeyGrid = 'status_substatus' ;
		}
		
		this.loadResultSets({
			tile: {
				reportval_ids: ['wallet?wvalue=amount']
			},
			tilebefore: {
				filters: filterValuesBefore,
				reportval_ids: ['wallet?wvalue=amount']
			},
			tile_late: {
				reportval_ids: ['wallet?wvalue=amount&wlate=true']
			},
			tilebefore_late: {
				filters: filterValuesBefore,
				reportval_ids: ['wallet?wvalue=amount&wlate=true']
			},
			piechart_amount: {
				reportval_ids: ['wallet?wvalue=amount'],
				axes: {
					groupby_is_on: true,
					groupby_key: groupbyKey
				}
			},
			piechart_count: {
				reportval_ids: ['wallet?wvalue=count'],
				axes: {
					groupby_is_on: true,
					groupby_key: groupbyKey
				}
			},
			grid: {
				reportval_ids: ['wallet?wvalue=amount','wallet?wvalue=count'],
				axes: {
					groupby_is_on: true,
					groupby_key: groupbyKeyGrid
				}
			},
		}) ;
	},
	onResultSets: function() {
		if( !this._viewInstalled ) {
			this.buildPage() ;
		}
		
		var filterData = this.getFilterValues(),
			dateValue = filterData['filter_date']['date_end'],
			dateValuePrev = filterData['filter_date']['date_start'] ;
		var dateValuePrevStr = Ext.Date.format(Ext.Date.parse(dateValuePrev,'Y-m-d'),"d/m/Y") ;		
		
		
		var tileValue = this.getResultSet('tile')[0]['values'][0],
			tileBeforeValue = this.getResultSet('tilebefore')[0]['values'][0] ;
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
			eval_caption: 'Rappel au '+dateValuePrevStr,
			eval_value: Ext.util.Format.number(tileBeforeValue, '0,000'),
			eval_suffix: '€',
			eval_direction: eval_direction
		} ;
		this.down('#tileWallet').update(componentData) ;
		
		
		
		
		var tileValue = this.getResultSet('tile_late')[0]['values'][0],
			tileBeforeValue = this.getResultSet('tilebefore_late')[0]['values'][0] ;
		var eval_direction = '' ;
		if( tileValue > tileBeforeValue ) {
			eval_direction = 'more-bad' ;
		}
		if( tileValue < tileBeforeValue ) {
			eval_direction = 'less-good' ;
		}
		var componentData = {
			caption: 'Montant',
			main_value: Ext.util.Format.number(tileValue, '0,000'),
			main_suffix: '€',
			main_iconCls: 'op5-spec-rsiveo-reporttile-main-icon-value-count',
			eval_caption: 'Rappel au '+dateValuePrevStr,
			eval_value: Ext.util.Format.number(tileBeforeValue, '0,000'),
			eval_suffix: '€',
			eval_direction: eval_direction
		} ;
		this.down('#tileWalletLate').update(componentData) ;
		
		
		
		
		
		var chartAmountData = [], chartAmountColors = [] ;
		Ext.Array.each( this.getResultSet('piechart_amount'), function(row) {
			chartAmountData.push({
				group_id: row.group_id,
				group_txt: row.group_txt,
				amount: row.values[0]
			}) ;
			if( !Ext.isEmpty(row.group_color) ) {
				chartAmountColors.push(row.group_color) ;
			}
		}) ;
		if( chartAmountColors.length==0 ) {
			chartAmountColors = this.__defaultChartColors ;
		}
		this.down('#chrtAmount').setColors(chartAmountColors) ;
		this.down('#chrtAmount').getSeries()[0].setColors(chartAmountColors) ;
		this.down('#chrtAmount').getStore().loadData(chartAmountData) ;
		
		
		var chartCountData = [], chartCountColors = [] ;
		Ext.Array.each( this.getResultSet('piechart_count'), function(row) {
			chartCountData.push({
				group_id: row.group_id,
				group_txt: row.group_txt,
				count: row.values[0]
			}) ;
			if( !Ext.isEmpty(row.group_color) ) {
				chartCountColors.push(row.group_color) ;
			}
		}) ;
		if( chartCountColors.length==0 ) {
			chartCountColors = this.__defaultChartColors ;
		}
		this.down('#chrtCount').setColors(chartCountColors) ;
		this.down('#chrtCount').getSeries()[0].setColors(chartCountColors) ;
		this.down('#chrtCount').getStore().loadData(chartCountData) ;
		
		
		
		
		var gridData = [] ;
		Ext.Array.each( this.getResultSet('grid'), function(row) {
			gridData.push({
				parent_id: row.parent_id,
				parent_txt: row.parent_txt,
				group_id: row.group_id,
				group_txt: row.group_txt,
				group_color: row.group_color,
				amount: row.values[0],
				count: row.values[1]
			}) ;
		}) ;
		this.down('#gridDetails').getStore().loadData(gridData) ;
	},
	
	buildPage: function() {
		var tilePanel = {
			xtype: 'panel',
			flex: 1,
			layout: {
				type: 'vbox',
				align: 'center'
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
					name: 'groupby_key',
					fieldLabel: 'Critère de décomposition',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['groupby_key','groupby_key_txt'],
						data : [
							{ groupby_key_txt: 'Statut', groupby_key: 'fstatus' },
							{ groupby_key_txt: 'Affectation', groupby_key: 'user' },
							{ groupby_key_txt: 'Entité', groupby_key: 'soc'},
							{ groupby_key_txt: 'Attribut', groupby_key: 'atr' }
						]
					},
					queryMode: 'local',
					displayField: 'groupby_key_txt',
					valueField: 'groupby_key'
				}]
			},{
				xtype: 'panel',
				title: 'Encours total',
				margin: 10,
				frame: true,
				width: 320,
				height: 200,
				layout: {
					type: 'fit',
					align: 'stretch'
				},
				items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
					itemId: 'tileWallet'
				})
			},{
				xtype: 'panel',
				title: 'Encours en retard',
				margin: 10,
				frame: true,
				width: 320,
				height: 200,
				layout: {
					type: 'fit',
					align: 'stretch'
				},
				items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
					itemId: 'tileWalletLate'
				})
			}]
		} ;
		
		
		
		
		var statusColors = []  ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			if( status.is_disabled ) {
				return ;
			}
			statusColors.push(status.status_color) ;
		}) ;
		var chartsPanel = {
			flex: 1,
			xtype: 'panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				height: 16,
				xtype: 'box'
			},{
				height: 18,
				xtype: 'box',
				cls: 'op5-spec-rsiveo-dashboard-charttitle-box',
				tpl: [
					'<div class="op5-spec-rsiveo-dashboard-charttitle">',
					'{title_string}',
					'</div>'
				],
				data: {
					title_string: 'Montant (€)'
				}
			},{
				xtype: 'panel',
				cls: 'chart-no-border',
				//width: 315,
				height: 240,
				layout: 'fit',
				border: false,
				items: {
					xtype: 'polar',
					animation: false,
					itemId: 'chrtAmount',
					border: false,
					//colors: ['#ff0000','#00ff00','#0000ff'],
					store: {
						fields: ['group_id','group_txt', 'amount' ],
						data: []
					},
					insetPadding: { top: 10, left: 10, right: 10, bottom: 10 },
					//innerPadding: 20,
					legend: {
						docked: 'left',
						border: false,
						toggleable: false,
						style: {
							border: {
								color: 'white'
							}
						}
					},
					series: [{
						type: 'pie',
						angleField: 'amount',
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
								var value = storeItem.get('amount'),
									valueStr = Ext.util.Format.number(value,'0,000') ;
								this.setHtml(storeItem.get('group_txt') + ': <b>' + valueStr + '</b>&nbsp;€');
							}
						}
					}]
				}
			},{
				height:16,
				xtype: 'box'
			},{
				//itemId: 'pageTitle',
				height: 18,
				xtype: 'box',
				cls: 'op5-spec-rsiveo-dashboard-charttitle-box',
				tpl: [
					'<div class="op5-spec-rsiveo-dashboard-charttitle">',
					'{title_string}',
					'</div>'
				],
				data: {
					title_string: 'Nombre de dossiers'
				}
			},{
				xtype: 'panel',
				height: 240,
				//width: 215,
				layout: 'fit',
				border: false,
				items: {
					xtype: 'polar',
					animation: false,
					itemId: 'chrtCount',
					border: false,
					//colors: statusColors,
					store: {
						fields: ['group_id','group_txt', 'count' ],
						data: []
					},
					insetPadding: { top: 10, left: 10, right: 10, bottom: 10 },
					//innerPadding: 20,
					legend: {
						docked: 'left',
						border: false,
						toggleable: false,
						style: {
							border: {
								color: 'white'
							}
						}
					},
					series: [{
						type: 'pie',
						angleField: 'count',
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
								this.setHtml(storeItem.get('group_txt') + ': <b>' + storeItem.get('count') + '</b>');
							}
						}
					}]
				}
			}]
		} ;
		
		
		
		var gridPanel = {
			xtype: 'grid',
			//scrollable: 'vertical',
			itemId: 'gridDetails',
			flex: 1,
			store: {
				proxy: { type: 'memory' },
				fields: [
					{name:'parent_id', type:'string'},
					{name:'parent_txt', type:'string'},
					{name:'group_id', type:'string'},
					{name:'group_txt', type:'string'},
					{name:'group_color', type:'string'},
					{name:'amount', type:'number'},
					{name:'count', type:'number'}
				],
				data: [],
				groupField: 'parent_txt',
				sorters: [{
					property: 'group_id',
					direction: 'ASC'
				}]
			},
			features: [{
				groupHeaderTpl: '{name}',
				ftype: 'groupingsummary'
			}],
			columns: [{
				width: 24,
				renderer: function(v,m,r) {
					if( !Ext.isEmpty(r.get('group_color')) ) {
						m.style="background-color:"+r.get('group_color');
					}
					return '&#160;' ;
				}
			},{
				flex: 1,
				dataIndex: 'group_txt',
				text: 'Décomposition',
				renderer: function(v,m,r) {
					return v ;
				}
			},{
				text: 'Euros',
				width: 100,
				dataIndex: 'amount',
				align: 'right',
				summaryType: 'sum',
				renderer: function(v,m,r) {
					return Ext.util.Format.number(v, '0,000') ;
				},
				summaryRenderer: function(value) {
					return '<b>'+Ext.util.Format.number(value,'0,000')+'</b>' ;
				}
			},{
				text: 'Dossiers',
				width: 100,
				dataIndex: 'count',
				align: 'right',
				summaryType: 'sum',
				renderer: function(v,m,r) {
					return v ;
				},
				summaryRenderer: function(value) {
					return '<b>'+value+'</b>' ;
				}
			}]
		} ;
		
		this.removeAll() ;
		this.add(
			tilePanel
			,chartsPanel
			,gridPanel) ;
			
		this.down('#cfgForm').getForm().setValues({
			groupby_key: this._groupbyKey
		}) ;
		this.down('#cfgForm').getForm().getFields().each(function(field) {
			field.on('change',function(ifield){
				this.onCfgChange() ;
			},this) ;
		},this) ;
		
		//HACK !
		this.__defaultChartColors = this.down('#chrtAmount').getColors() ;
		
		this._viewInstalled = true ;
	},
	
	onCfgChange: function() {
		var form = this.down('#cfgForm').getForm(),
			formValues = form.getFieldValues() ;
		if( formValues['groupby_key'] ) {
			this._groupbyKey = formValues['groupby_key'] ;
		}
		this.doLoad() ;
	},
	
	dummyFn: function() {
		
	}
});
