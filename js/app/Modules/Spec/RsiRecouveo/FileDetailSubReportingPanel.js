Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailSubReportingPanel',{
	extend:'Ext.panel.Panel',
	
	_parentCmp: null,
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				title: 'Stats'
			},{
				flex: 2,
				itemId: 'cntChartHistory',
				title: 'History',
				layout: 'fit',
				items: {
					xtype: 'box',
					cls:'op5-waiting'
				}
			}]
		}) ;
		
		this.callParent() ;
		if( this._parentCmp ) {
			this.optimaModule = this._parentCmp.optimaModule ;
			this.mon(this._parentCmp,'doreload',this.onDoReload,this) ;
		}
	},
	onDoReload: function(parentCmp,accId) {
		console.dir(this);
		console.dir(arguments) ;
		
		this.doLoadElements() ;
	},
	
	doLoadElements: function() {
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getGrid',
				filters:       Ext.JSON.encode({
					filter_date: {
						date_period: 'month',
						date_start:  '2019-06-01',
						date_end:    '2019-11-31'
					}
				}),
				axes:          Ext.JSON.encode({
					timebreak_is_on: true,
					timebreak_group: "MONTH",
					groupby_is_on: true,
					groupby_key: "status"
				}),
				reportval_ids: Ext.JSON.encode(["wallet?wvalue=amount"])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				this.onLoadChartHistory(ajaxResponse) ;
			},
			scope: this
		}) ;
	},
	
	onLoadChartHistory: function(tableData) {
		//console.dir(ajaxData) ;
		// return ;
		
		
		
		
		
		
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
		Ext.Array.sort( tableData.data, function(a,b) {
			return !!(a.group_id<b.group_id) ? -1 : 1 ;
		});
		Ext.Array.each( tableData.data, function(row) {
			var mkey = 'g_'+row.group_id ;
			fields.push({
				name: mkey,
				type: 'number'
			}) ;
			yFields.push( mkey ) ;
			yTitles.push( row.group_txt ) ;
			if( !Ext.isEmpty(row.group_color) ) {
				yColors.push( row.group_color ) ;
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
				timebreak_txt: Ext.Date.format(Ext.Date.parse(col.date_end,'Y-m-d'),"d/m/Y")
			};
			Ext.Array.each( tableData.data, function(row) {
				var mkey = 'g_'+row.group_id ;
				chartRow[mkey] = (row[col.dataIndex] > 0 ? row[col.dataIndex] : 0);
			});
			chartData.push(chartRow) ;
		}) ;
		
		
		var barchart = {
			xtype: 'cartesian',
			legend: {
				docked: 'bottom'
			},
			store: {
				proxy: {type:'memory'},
				fields: fields,
				data: chartData,
			},
			insetPadding: {
					top: 20,
					left: 10,
					right: 20,
					bottom: 10
			},
			axes: [{
					type: 'numeric',
					position: 'left',
					adjustByMajorUnit: true,
					grid: true,
					fields: [yFields[1]],
					renderer: function (v) {
						var s ;
						if( Ext.isNumber(v) ) {
							var logV = Math.log10(v) ;
							if( logV > 6 ) {
								v = v / 1000 / 1000 ;
								s = 'M' ;
							} else if( logV > 3 ) {
								v = v / 1000 ;
								s = 'K' ;
							}
						}
						var str = '' ;
						str+= Ext.util.Format.number(v,'0,000') ;
						if( s ) {
							str+= ' ' + s ;
						}
						return str ;
					},
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
					title: yTitles,
					xField: xField,
					yField: yFields,
					stacked: true,
					style: {
						opacity: 0.80,
						minGapWidth: 10
					},
					highlight: {
						fillStyle: 'yellow'
					},
					tooltip: {
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							var groupTitle = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
							var str = '' ;
							str+= groupTitle ;
							str+= ' au ' ;
							str+= storeItem.get('timebreak_txt') ;
							str+= ' : ' ;
							str+= Ext.util.Format.number(storeItem.get(item.field),'0,000') + ' €' ;
							this.setHtml(str);
						}
					}
			}]
		} ;
		if( yColors.length>0 ) {
			Ext.apply(barchart,{colors:yColors}) ;
		}
		
		
		
		var cntChartHistory = this.down('#cntChartHistory') ;
		cntChartHistory.removeAll() ;
		cntChartHistory.add(barchart) ;
	},
	
}) ;
