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
				xtype: 'container' ,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				cls: 'ux-noframe-bg',
				items: [{
					xtype: 'box',
					cls: 'op5-spec-rsiveo-factureheader-icon',
					width: 72,
				},{
					xtype: 'form',
					itemId: 'formSummary',
					layout: 'anchor',
					cls: 'op5-spec-rsiveo-displayform',
					bodyCls: 'ux-noframe-bg',
					fieldDefaults: {
						anchor: '100%',
						labelWidth: 100
					},
					items: [{
						xtype: 'combobox',
						itemId: 'paramTimerangeMonths',
						fieldLabel: 'Intervalle',
						forceSelection: true,
						editable: false,
						store: {
							fields: ['timerange_intmonths','timerange_txt'],
							data : [
								{ timerange_intmonths: '6', timerange_txt: '6 mois' },
								{ timerange_intmonths: '24', timerange_txt: '2 ans' }
							]
						},
						queryMode: 'local',
						displayField: 'timerange_txt',
						valueField: 'timerange_intmonths',
						value: '6',
						listeners: {
							select: function() {
								this.doReload() ;
							},
							scope: this
						}
					},{
						xtype: 'displayfield',
						name: 'display_action_auto',
						fieldLabel: 'Actions Auto.'+'&#160;',
						value: 'Texte exemple'
					},{
						xtype: 'displayfield',
						name: 'display_action_man',
						fieldLabel: 'Actions Man.'+'&#160;',
						value: 'Texte exemple'
					},{
						xtype: 'displayfield',
						name: 'display_dsoavg',
						fieldLabel: 'DSO (à date)'+'&#160;',
						value: 'Texte exemple',
						style: {
							'margin-top' : '6px'  
						}
					}]
				}]
			},{
				flex: 2,
				itemId: 'cntChartHistory',
				title: 'Historique',
				layout: 'fit',
				items: []
			}]
		}) ;
		
		this.callParent() ;
		if( this._parentCmp ) {
			this.optimaModule = this._parentCmp.optimaModule ;
			//this._accId = this._parentCmp._accId ;
			this.mon(this._parentCmp,'doreload',this.onDoReload,this) ;
		}
	},
	onDoReload: function(parentCmp,accId) {
		this.doLoadElements(accId) ;
	},
	
	doReload: function() {
		this.doLoadElements(this._accId) ;
	},
	doLoadElements: function(accId) {
		this._accId = accId ;
		
		
		this.down('#formSummary').getForm().setValues({
			display_dsoavg: '-',
			display_action_man: '-',
			display_action_auto: '-',
		}) ;
		this.down('#cntChartHistory').removeAll();
		this.down('#cntChartHistory').add({
			xtype: 'box',
			cls:'op5-waiting'
		});
		
		
		var paramTimerangeMonths = parseInt(this.down('#formSummary').down('#paramTimerangeMonths').getValue()) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getFileElements',
				acc_id: accId,
				timerange_months: paramTimerangeMonths
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				this.onLoadElements(ajaxResponse.data) ;
			},
			scope: this
		}) ;
	},
	
	onLoadElements: function(ajaxData) {
		this.onLoadFormSummary( ajaxData.form_summary ) ;
		this.onLoadChartHistory( ajaxData.chart_history, ajaxData.chart_dso ) ;
	},
	onLoadFormSummary: function(formTable) {
		var dataRow = formTable.data[0] ;
		this.down('#formSummary').getForm().setValues({
			display_dsoavg: Ext.util.Format.number(dataRow['v_dso_avg'],'0,000.0')+'&#160;'+'j',
			display_action_man: Ext.util.Format.number(dataRow['v_actions?aclass=manual'],'0,000'),
			display_action_auto: Ext.util.Format.number(dataRow['v_actions?aclass=auto'],'0,000')
		}) ;
	},
	onLoadChartHistory: function(historyTable, dsoTable) {
		var fields = [{
			name: 'timebreak_id',
			string: 'string'
		},{
			name: 'timebreak_txt',
			string: 'string'
		}] ;
		var xField = 'timebreak_txt' ;
		var yFields = [], yTitles = [], yColors = [] ;
		var yFieldsLineDso = [], yTitlesLineDso = [] ;
		
		var groupIds = [],
			groupTitles = [] ;
		Ext.Array.sort( historyTable.data, function(a,b) {
			return !!(a.group_id<b.group_id) ? -1 : 1 ;
		});
		Ext.Array.each( historyTable.data, function(row) {
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
		Ext.Array.each( dsoTable.data, function(rowDso) {
			var mkey = 'val_dso' ;
			fields.push({
				name: mkey,
				type: 'number'
			}) ;
			yFieldsLineDso.push( mkey ) ;
			yTitlesLineDso.push( 'DSO' ) ;
			yColors.push( '#00aa80' ) ;
		}) ;
		
		var chartData = [],
			chartRow ;
		Ext.Array.each( historyTable.columns, function(col) {
			if( Ext.isEmpty(col.date_end) ) {
				return ;
			}
			chartRow = {
				timebreak_id: col.dataIndex,
				timebreak_txt: Ext.Date.format(Ext.Date.parse(col.date_end,'Y-m-d'),"d/m/Y")
			};
			Ext.Array.each( historyTable.data, function(row) {
				var mkey = 'g_'+row.group_id ;
				chartRow[mkey] = (row[col.dataIndex] > 0 ? row[col.dataIndex] : 0);
			});
			Ext.Array.each( dsoTable.data, function(rowDso) {
				var mkey = 'val_dso' ;
				chartRow[mkey] = (rowDso[col.dataIndex] > 0 ? rowDso[col.dataIndex] : 0);
			});
			chartData.push(chartRow) ;
		}) ;
		
		if( false ) {
			// 29/01/20 : debug
			console.dir( chartData ) ;
			console.log( 'x' ) ;
			console.dir( xField ) ;
			console.log( 'y' );
			console.dir( yFields ) ;
			console.dir( yTitles ) ;
			console.log( 'yDso' );
			console.dir( yFieldsLineDso ) ;
		}
		
		if( true ) {
			// 29/01/20 : hide DSO is null
			var isDsoNull = true ;
			Ext.Array.each( chartData, function(chartRow) {
				if( !Ext.isEmpty(chartRow['val_dso']) && (chartRow['val_dso'] > 0) ) {
					isDsoNull = true ;
					return false ;
				}
			}) ;
		}
		
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
					fields: yFields,
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
					type: 'numeric',
					hidden: isDsoNull, // 29/01/20 : hide DSO is null
					position: 'right',
					adjustByMajorUnit: true,
					grid: false,
					fields: yFieldsLineDso,
					renderer: function (v) { return Ext.util.Format.number(v,'0,000'); },
					minimum: 0,
			  
					title: 'Jours',
					label: {
						fontFamily: 'Play, sans-serif',
						fontSize: 12
					}
			},{
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
						'stroke': '#00aa80',
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
		if( yColors.length>0 ) {
			Ext.apply(barchart,{colors:yColors}) ;
		}
		
		
		
		var cntChartHistory = this.down('#cntChartHistory') ;
		cntChartHistory.removeAll() ;
		cntChartHistory.add(barchart) ;
	},
	
}) ;
