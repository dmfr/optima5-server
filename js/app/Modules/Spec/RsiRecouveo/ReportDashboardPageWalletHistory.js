Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletHistory',{
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
		if( Ext.isEmpty(filterData['filter_date']['date_start']) || Ext.isEmpty(filterData['filter_date']['date_end']) ) {
			return '???' ;
		}
		if( filterData['filter_date']['date_end'] < filterData['filter_date']['date_start'] ) {
			return '???' ;
		}
		
		var dateStartStr = Ext.Date.format(Ext.Date.parse(filterData['filter_date']['date_start'],'Y-m-d'),"d/m/Y") ;
		var dateEndStr = Ext.Date.format(Ext.Date.parse(filterData['filter_date']['date_end'],'Y-m-d'),"d/m/Y") ;
		
		return 'Evolution de l\'encours du ' + dateStartStr + ' au ' + dateEndStr ;
	},
	
	doLoad: function() {
		this.callParent() ;
		
		var filterValuesBefore = this.getFilterValues() ;
		filterValuesBefore['filter_date']['date_end'] = filterValuesBefore['filter_date']['date_start'] ;
		
		var groupbyKey = this._groupbyKey,
			groupbyKeyGrid = groupbyKey ;
		if( groupbyKey=='fstatus' ) {
			groupbyKey = 'status' ;
		}
		
		this.loadResultSets({
			tile: {
				reportval_ids: ['wallet?wvalue=amount']
			},
			tilebefore: {
				filters: filterValuesBefore,
				reportval_ids: ['wallet?wvalue=amount']
			},
			timebreak: {
				reportval_ids: ['wallet?wvalue=amount'],
				axes: {
					timebreak_is_on: true,
					timebreak_group: 'MONTH',
					groupby_is_on: true,
					groupby_key: groupbyKey
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
				//width: 350,
				height: 200,
				layout: {
					type: 'fit',
					align: 'stretch'
				},
				items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
					itemId: 'tileWallet'
				})
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
			groupby_key: this._groupbyKey
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
		if( formValues['groupby_key'] ) {
			this._groupbyKey = formValues['groupby_key'] ;
		}
		this.doLoad() ;
	},
	
	onResultSets: function() {
		if( !this._viewInstalled ) {
			this.buildPage() ;
		}
		
		console.dir(this._loadResultSets) ;
		
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
		
		
		
		//build Grid
		console.dir( this.getResultSetRaw('timebreak') ) ;
		var tableData = this.getResultSetRaw('timebreak') ;
		
		var fields = [] ;
		fields.push({
			name: 'group_color',
			type: 'string'
		}) ;
		Ext.Array.each( tableData.columns, function(col) {
			fields.push({
				name: col.dataIndex,
				type: Ext.isEmpty(col.reportval_id) ? 'string' : 'number'
			}) ;
		}) ;
		
		var columns = Ext.Array.merge([{
			width: 24,
			renderer: function(v,m,r) {
				if( !Ext.isEmpty(r.get('group_color')) ) {
					m.style="background-color:"+r.get('group_color');
				}
				return '&#160;' ;
			}
		}],tableData.columns) ;
		Ext.Array.each(columns,function(col) {
			if( Ext.isEmpty(col.reportval_id) ) {
				return ;
			}
			Ext.apply(col,{
				align: 'right',
				summaryType: 'sum',
				renderer: function(v,m,r) {
					return Ext.util.Format.number(v, '0,000') ;
				},
				summaryRenderer: function(value) {
					return '<b>'+Ext.util.Format.number(value,'0,000')+'</b>' ;
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
			features: [{
				ftype: 'summary'
			}]
		};
		
		
		
		
		
		
		var fields = [{
			name: 'timebreak_id',
			string: 'string'
		},{
			name: 'timebreak_txt',
			string: 'string'
		}] ;
		var xField = 'timebreak_txt' ;
		var yFields = [], yTitles = [], yColors = [] ;
		
		var groupIds = [],
			groupTitles = [] ;
		Ext.Array.each( tableData.data, function(row) {
			fields.push({
				name: 'g_'+row.group_id,
				type: 'number'
			}) ;
			yFields.push( row.group_id ) ;
			yTitles.push( row.group_txt ) ;
			if( !Ext.isEmpty(row.group_color) ) {
				yColors.push( row.group_color ) ;
			}
		}) ;
		
		var chartData = [] ;
		
		
		var barchart = {
			xtype: 'cartesian',
			width: '100%',
			height: 460,
			legend: {
				docked: 'left'
			},
			store: {
				proxy: {type:'memory'},
				fields: fields,
				data: Ext.clone(tableData.data),
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
					fields: ['data1'],
					//renderer: function (v) { return v.toFixed(v < 10 ? 1: 0) + '%'; },
					minimum: 0
			}, {
					type: 'category',
					position: 'bottom',
					grid: true,
					fields: ['month'],
					label: {
						rotate: {
							degrees: -45
						}
					}
			}],
			series: [{
					type: 'bar',
					axis: 'left',
					title: [ 'IE', 'Firefox', 'Chrome', 'Safari' ],
					xField: 'month',
					yField: [ 'data1', 'data2', 'data3', 'data4' ],
					stacked: true,
					style: {
						opacity: 0.80
					},
					highlight: {
						fillStyle: 'yellow'
					},
					tooltip: {
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							/*
							var browser = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
							this.setHtml(browser + ' for ' + storeItem.get('month') + ': ' + storeItem.get(item.field) + '%');
*/
						}
					}
			}]
		} ;
		
		
		
		
		
		
		var pMain = this.down('#pMain') ;
		pMain.removeAll() ;
		pMain.add(grid) ;
	},
	
	dummyFn: function() {
		
	}
});
