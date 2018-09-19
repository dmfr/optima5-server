Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda',{
	extend: 'Ext.panel.Panel',
	_defaultMode: 'count',
	_hideForm: false,
	initComponent: function() {
		var agendaGridFields = ['agenda_class','agenda_class_txt'],
			agendaGridColumnRenderer = function(v) {
				if( v == 0 ) {
					return '' ;
				}
				return v ;
			},
			agendaGridColumnAmountRenderer = function(v) {
				if( v == 0 ) {
					return '' ;
				}
				return Ext.util.Format.number(v,'0,000');
			},
			agendaGridColumns = [{
				locked: true,
				width: 100,
				text: 'Statut',
				dataIndex: 'agenda_class_txt',
				summaryType: 'count',
				summaryRenderer: function(value, summaryData, dataIndex) {
					return '<b>'+'Total'+'</b>' ;
				}
			}] ;
			
		var agendaChrtFields = ['agenda_class','agenda_class_txt'],
			agendaChrtYFields = [],
			agendaChrtTitles = [],
			agendaChrtColors = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(etaRange) {
			agendaGridFields.push(etaRange.eta_range+'_count', etaRange.eta_range+'_ratio1000') ;
			agendaGridColumns.push({
				hidden: true,
				_agendaMode: 'count',
				_etaRange: etaRange.eta_range,
				text: etaRange.eta_txt,
				dataIndex: etaRange.eta_range+'_count',
				width: 85,
				tdCls: 'bgcolor-'+etaRange.eta_color.substring(1),
				renderer: agendaGridColumnRenderer,
				summaryType:'sum',
				summaryRenderer: function(value) {
					return '<b>'+value+'</b>' ;
				}
			});
			agendaGridFields.push(etaRange.eta_range+'_amount') ;
			agendaGridColumns.push({
				hidden: true,
				_agendaMode: 'amount',
				_etaRange: etaRange.eta_range,
				text: etaRange.eta_txt,
				dataIndex: etaRange.eta_range+'_amount',
				width: 85,
				tdCls: 'bgcolor-'+etaRange.eta_color.substring(1),
				renderer: agendaGridColumnAmountRenderer,
				summaryType:'sum',
				summaryRenderer: function(value) {
					return '<b>'+Ext.util.Format.number(value,'0,000')+'</b>' ;
				}
			});

			agendaChrtFields.push(etaRange.eta_range+'_count', etaRange.eta_range+'_ratio1000') ;
			agendaChrtYFields.push(etaRange.eta_range+'_ratio1000') ;
			agendaChrtTitles.push(etaRange.eta_txt) ;
			agendaChrtColors.push(etaRange.eta_color) ;
		}) ;
		if( true ) { // footer sum
			agendaGridFields.push('sum'+'_count', 'sum'+'_ratio1000') ;
			agendaGridColumns.push({
				hidden: true,
				_agendaMode: 'count',
				text: '<b>'+'Total'+'</b>',
				dataIndex: 'sum'+'_count',
				width: 85,
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				renderer: agendaGridColumnRenderer,
				summaryType:'sum'
			});
			agendaGridFields.push('sum'+'_amount') ;
			agendaGridColumns.push({
				hidden: true,
				_agendaMode: 'amount',
				text: '<b>'+'Total'+'</b>',
				dataIndex: 'sum'+'_amount',
				width: 85,
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				renderer: agendaGridColumnAmountRenderer,
				summaryType:'sum',
				summaryRenderer: function(value) {
					return '<b>'+Ext.util.Format.number(value,'0,000')+'</b>' ;
				}
			});
		}
			
		
		Ext.apply(this,{
			border: false,
			cls: 'chart-no-border',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			//border: false,
			items: [{
				height: 24,
				xtype: 'form',
				itemId: 'formAgenda',
				hidden: this._hideForm,
				anchor: '',
				items: [{
					xtype      : 'fieldcontainer',
					defaultType: 'radiofield',
					fieldLabel: 'Vue Agenda',
					labelWidth: 100,
					labelAlign: 'right',
					anchor: '',
					width: 350,
					defaults: {
						margin: '0px 16px',
						listeners: {
							change: function( field, value ) {
								this.applyAgendaMode() ;
							},
							scope: this
						}
					},
					layout: 'hbox',
					items: [
						{
							boxLabel  : 'Nombre dossiers',
							name      : 'agenda_mode',
							inputValue: 'count',
							checked: (this._defaultMode=='count')
						}, {
							boxLabel  : 'Devise (€)',
							name      : 'agenda_mode',
							inputValue: 'amount',
							checked: (this._defaultMode=='amount')
						}
					]
				}]
			},{
				flex: 1,
				margin: '4px 10px',
				xtype: 'grid',
				itemId: 'gridAgenda',
				enableLocking: true,
				columns: {
					defaults: {
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false,

						align: 'right'
					},
					items: agendaGridColumns
				},
				store: {
					fields: agendaGridFields,
					data: []
				},
				selModel: {
					mode: 'SINGLE'
				},
				listeners: {
					selectionchange: function(selectionModel, records) {
						var selRecord = records[0],
							chrtAgenda = this.down('#chrtAgenda') ;
						if( !selRecord ) {
							chrtAgenda.setVisible(false) ;
							chrtAgenda.getStore().loadData([]) ;
							return ;
						}
						chrtAgenda.getStore().loadData([selRecord.getData()]) ;
						chrtAgenda.setVisible(true) ;
					},
					itemclick: this.onGridItemClick,
					scope: this
				},
				features: [{
					ftype: 'summary',
					dock: 'bottom'
				}]
			},{
				height: 60,
				hidden: true,
				xtype: 'cartesian',
				animation: false,
				itemId: 'chrtAgenda',
				colors: agendaChrtColors,
				border: false,
				width: '100%',
				/*legend: {
					docked: 'bottom',
					toggleable: false
				},*/
				store: {
					fields: agendaChrtFields,
					data: []
				},
				plugins: {
					ptype: 'chartitemevents',
					moveEvents: false
				},
				insetPadding: { top: 10, left: 10, right: 30, bottom: 10 },
				flipXY: true,
				/*sprites: [{
					type: 'text',
					text: 'Agenda / Actions imminentes',
					fontSize: 14,
					width: 100,
					height: 30,
					x: 150, // the sprite x position
					y: 20  // the sprite y position
				}],*/
				axes: [/*{
					type: 'numeric',
					position: 'bottom',
					adjustByMajorUnit: true,
					fields: agendaChrtYFields,
					grid: true,
					renderer: function (v) { return v + ''; },
					minimum: 0
				}, */{
					type: 'category',
					position: 'left',
					fields: 'agenda_class_txt',
					grid: true
				}],
				series: [{
					type: 'bar',
					axis: 'bottom',
					title: agendaChrtTitles,
					xField: 'agenda_class_txt',
					yField: agendaChrtYFields,
					stacked: true,
					style: {
						opacity: 0.80
					},
					//highlight: true,
					listeners: {
						itemclick: this.onBarItemClick,
						scope: this
					},
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
								var browser = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
								var countField = item.field.replace('_ratio1000','_count') ;
								this.setHtml(browser + ' for ' + storeItem.get('agenda_class_txt') + ': ' + storeItem.get(countField));
						}
					}
				}]
			}]
		}) ;
		this.callParent() ;
		this.applyAgendaMode() ;
	},
	loadFilesData: function( ajaxData ) {
		var map_actionAgendaClass_etaRange_nbActions = {},
			map_actionAgendaClass_etaRange_amount = {},
			map_actionId_action = {},
			actionRow, actionAgendaClass ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			map_actionId_action[action.action_id] = action ;
		}) ;
		Ext.Array.each( ajaxData, function(fileRow) {
			Ext.Array.each( fileRow.actions, function(fileActionRow) {
				actionRow = map_actionId_action[fileActionRow.link_action] ;
				if( !actionRow || fileActionRow.status_is_ok ) {
					return ;
				}
				actionAgendaClass = actionRow.agenda_class ;
				if( Ext.isEmpty(actionAgendaClass) || actionAgendaClass!=fileRow.next_agenda_class ) {
					return ;
				}
				
				if( !map_actionAgendaClass_etaRange_nbActions.hasOwnProperty(actionAgendaClass) ) {
					map_actionAgendaClass_etaRange_nbActions[actionAgendaClass] = {} ;
				}
				if( !map_actionAgendaClass_etaRange_nbActions[actionAgendaClass].hasOwnProperty(fileActionRow.calc_eta_range) ) {
					map_actionAgendaClass_etaRange_nbActions[actionAgendaClass][fileActionRow.calc_eta_range] = 0 ;
				}
				map_actionAgendaClass_etaRange_nbActions[actionAgendaClass][fileActionRow.calc_eta_range]++ ;
				
				if( !map_actionAgendaClass_etaRange_amount.hasOwnProperty(actionAgendaClass) ) {
					map_actionAgendaClass_etaRange_amount[actionAgendaClass] = {} ;
				}
				if( !map_actionAgendaClass_etaRange_amount[actionAgendaClass].hasOwnProperty(fileActionRow.calc_eta_range) ) {
					map_actionAgendaClass_etaRange_amount[actionAgendaClass][fileActionRow.calc_eta_range] = 0 ;
				}
				
				var actionAmount = fileRow.inv_amount_due ;
				if( !Ext.isEmpty(fileActionRow.link_agree) ) {
					var nbActionsTodo = 0 ;
					Ext.Array.each( fileRow.actions, function(fileActionRow) {
						actionRow = map_actionId_action[fileActionRow.link_action] ;
						if( fileActionRow.status_is_ok ) {
							return ;
						}
						nbActionsTodo++ ;
					}) ;
					actionAmount = fileRow.inv_amount_due / nbActionsTodo ;
					if( !Ext.isEmpty(fileActionRow.link_agree.milestone_amount) ) {
						actionAmount = fileActionRow.link_agree.milestone_amount ;
					}
				}
				map_actionAgendaClass_etaRange_amount[actionAgendaClass][fileActionRow.calc_eta_range] += actionAmount ;
			}) ;
		}) ;
		
		
		var agendaData = [], agendaRow,
			agendaSummary = {};
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(actionRow) {
			if( !Ext.isEmpty(actionRow.agenda_class) && !agendaSummary.hasOwnProperty(actionRow.agenda_class) ) {
				var statusRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusRowId(actionRow.agenda_class) ;
				if( !statusRow || statusRow.is_disabled ) {
					return ;
				}
				agendaSummary[actionRow.agenda_class] = statusRow.status_txt ;
			}
		}) ;
		Ext.Object.each( agendaSummary, function(agendaClass,agendaClassTxt) {
			var sum = 0 ;
			agendaRow = {} ;
			agendaRow['agenda_class'] = agendaClass ;
			agendaRow['agenda_class_txt'] = agendaClassTxt ;
			Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(etaRangeRow) {
				var etaRange = etaRangeRow.eta_range,
					etaRangeCount = etaRangeRow.eta_range+'_count',
					etaRangeAmount = etaRangeRow.eta_range+'_amount' ;
				agendaRow[etaRangeCount] = 0 ;
				agendaRow[etaRangeAmount] = 0 ;
				
				if( map_actionAgendaClass_etaRange_amount.hasOwnProperty(agendaClass)
					&& map_actionAgendaClass_etaRange_amount[agendaClass].hasOwnProperty(etaRange) ) {
					
					
					agendaRow[etaRangeAmount] = map_actionAgendaClass_etaRange_amount[agendaClass][etaRange] ;
				}
				
				if( map_actionAgendaClass_etaRange_nbActions.hasOwnProperty(agendaClass)
					&& map_actionAgendaClass_etaRange_nbActions[agendaClass].hasOwnProperty(etaRange) ) {
					
					
					agendaRow[etaRangeCount] = map_actionAgendaClass_etaRange_nbActions[agendaClass][etaRange] ;
				}
				sum += agendaRow[etaRangeCount] ;
			}) ;
			
			if( sum > 0 ) {
				var factor = 1000 / sum ;
				Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(etaRangeRow) {
					var etaRange = etaRangeRow.eta_range,
						etaRangeCount = etaRangeRow.eta_range+'_count',
						etaRangeRatio = etaRangeRow.eta_range+'_ratio1000' ;
					agendaRow[etaRangeRatio] = agendaRow[etaRangeCount] * factor ;
				}) ;
			} else {
				Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(etaRangeRow) {
					var etaRange = etaRangeRow.eta_range,
						etaRangeCount = etaRangeRow.eta_range+'_count',
						etaRangeRatio = etaRangeRow.eta_range+'_ratio1000' ;
					agendaRow[etaRangeRatio] = 0 ;
				}) ;
			}
			
			agendaRow['sum_amount'] = agendaRow['sum_count'] = agendaRow['sum_ratio1000'] = 0 ;
			Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(etaRangeRow) {
				var etaRange = etaRangeRow.eta_range,
					etaRangeAmount = etaRangeRow.eta_range+'_amount',
					etaRangeCount = etaRangeRow.eta_range+'_count',
					etaRangeRatio = etaRangeRow.eta_range+'_ratio1000' ;
				agendaRow['sum_amount'] += agendaRow[etaRangeAmount] ;
				agendaRow['sum_count'] += agendaRow[etaRangeCount] ;
				agendaRow['sum_ratio1000'] += agendaRow[etaRangeRatio] ;
			}) ;
			
			agendaData.push(agendaRow) ;
		}) ;
		
		
		this.down('#gridAgenda').getSelectionModel().deselectAll() ;
		this.down('#gridAgenda').getStore().loadRawData(agendaData) ;
	},
	
	
	
	onBarItemClick: function( series, item ) {
		var clickAgendaClass = item.record.data.agenda_class,
			clickEtaRange = item.field.replace('_ratio1000','') ;
			
		this.fireEvent('agendaitemclick',clickAgendaClass,clickEtaRange) ;
	},
	onGridItemClick: function ( view, record, item, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		var clickAgendaClass = record.get('agenda_class') ;
		var clickEtaRange = cellColumn._etaRange ;

		this.fireEvent('agendaitemclick',clickAgendaClass,clickEtaRange) ;
	},
	
	applyAgendaMode: function() {
		var gridAgenda = this.down('#gridAgenda'),
			formAgenda = this.down('#formAgenda'),
			agendaMode = formAgenda.getForm().getValues()['agenda_mode'] ;
		Ext.Array.each( gridAgenda.headerCt.query('[_agendaMode]'), function(column) {
			column.setVisible( (column._agendaMode==agendaMode) ) ;
		} ) ;
	}
}) ;
