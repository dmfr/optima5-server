Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.SearchCombo'
	],
	
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	defaultViewMode: 'file',
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',{
				itemId: 'tbAtr',
				border: false,
				xtype: 'toolbar',
				items: []
			},'->',{
				icon: 'images/op5img/ico_search_16.gif',
				itemId: 'btnSearchIcon',
				handler: function(btn) {
					btn.up().down('#btnSearch').reset() ;
					//this.doLoad(true) ;
				},
				scope: this
			},Ext.create('Optima5.Modules.Spec.RsiRecouveo.SearchCombo',{
				optimaModule: this.optimaModule,
				
				itemId: 'btnSearch',
				width: 150,
				listeners: {
					beforequeryload: this.onBeforeQueryLoad,
					select: this.onSearchSelect,
					scope: this
				}
			}),{
				xtype: 'tbseparator'
			},{
				//iconCls: 'op5-spec-dbsembramach-report-clock',
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this.onViewSet( menuitem.itemId ) ;
						},
						scope:this
					},
					items: [{
						itemId: 'file',
						text: 'Vue par dossier',
						iconCls: 'op5-spec-dbstracy-grid-view-order'
					},{
						itemId: 'account',
						text: 'Vue par compte',
						iconCls: 'op5-spec-dbstracy-grid-view-ordergroup'
					}]
				}
			},{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad(true) ;
				},
				scope: this
			},{
				hidden: this._readonlyMode,
				iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
				text: 'Export',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}],
			items: [{
				title: 'Statistiques sur sélection',
				region: 'north',
				//hidden: true,
				collapsible: true,
				height: 240,
				border: true,
				xtype: 'panel',
				itemId: 'pNorth',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: []
			},{
				region: 'center',
				flex: 1,
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'fit'
				},
				items: []
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			return ;
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.tmpModelCnt = 0 ;
		
		this.configureToolbar() ;
		this.configureViews() ;
		this.onViewSet(this.defaultViewMode) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		this.doLoad() ;
	},
	
	onViewSet: function(viewId) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text ;
		if( tbViewmodeItem ) {
			this.viewMode = viewId ;
		}
		// View mode
		var tbViewmodeItem = tbViewmode.menu.getComponent(this.viewMode) ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( 'Mode :'+'&#160;'+'<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		this.doLoad(true) ;
	},
	configureToolbar: function() {
		var tbAtr = this.down('#tbAtr') ;
		tbAtr.removeAll() ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			tbAtr.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: atrRecord.bible_code,
				icon: 'images/op5img/ico_blocs_small.gif',
				selectMode: 'MULTI',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onAtrSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}) );
		},this) ;
	},
	configureViews: function() {
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
		}) ;
		
		var actionEtaMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(actionEta) {
			actionEtaMap[actionEta.eta_range] = actionEta ;
		}) ;
		
		var atrRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
			var column = view.ownerCt.columns[colIndex],
				value = record.get(column.rendererDataindex) ;
			return value ;
		}
		var atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			atrColumns.push({
				text: atrRecord.atr_txt,
				dataIndex: atrRecord.bible_code,
				rendererDataindex: atrRecord.bible_code + '_text',
				width:90,
				align: 'center',
				renderer: atrRenderer
			}) ;
		}) ;
		
		var balageFields = [], balageColumns = [] ;
		var balageRenderer = function(value,metaData,record) {
			if( value == 0 ) {
				return '&#160;' ;
			}
			return Ext.util.Format.number(value,'0,000.00') ;
		};
		var balageConvert = function(value,record) {
			var thisField = this,
				balageSegmtId = thisField.balageSegmtId ;
			return record.data.inv_balage[balageSegmtId] ;
		};
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			balageColumns.push({
				text: balageSegmt.segmt_txt,
				dataIndex: balageField,
				width:70,
				align: 'center',
				renderer: balageRenderer,
				filter: {
					type: 'number'
				}
			}) ;
			
			balageFields.push({
				name: balageField,
				balageSegmtId: balageSegmt.segmt_id,
				type: 'number',
				convert: balageConvert
			});
		}) ;
		
		var pCenter = this.down('#pCenter') ;
		var columns = [{
			itemId: 'colAtr',
			text: 'Attributs',
			columns: atrColumns
		},{
			text: 'Acheteurs',
			columns: [{
				text: 'ID',
				dataIndex: 'acc_id',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:100,
				align: 'center',
				filter: {
					type: 'op5crmbasebible',
					optimaModule: this.optimaModule,
					bibleId: 'LIB_ACCOUNT'
				}
			},{
				text: 'Acheteur',
				dataIndex: 'acc_txt',
				width:150,
				align: 'center',
				filter: {
					type: 'string'
				}
			}]
		},{
			itemId: 'colStatus',
			text: 'Statut',
			align: 'center',
			dataIndex: 'status',
			filter: {
				type: 'op5crmbasebibletree',
				optimaModule: this.optimaModule,
				bibleId: 'CFG_STATUS'
			},
			renderer: function(v,metaData,r) {
				var statusMap = this._statusMap ;
				if( statusMap.hasOwnProperty(v) ) {
					var statusData = statusMap[v] ;
					metaData.style += 'color: white ; background: '+statusData.status_color ;
					return statusData.status_txt ;
				}
				return '?' ;
			}
		},{
			text: 'Next action',
			columns: [{
				text: 'RDV/Action',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				align: 'center',
				dataIndex: 'next_action',
				/*filter: {
					type: 'op5crmbasebible',
					optimaModule: this.optimaModule,
					bibleId: 'CFG_ACTION'
				},*/
				renderer: function(v,metaData,r) {
					if( Ext.isEmpty(v) ) {
						return '' ;
					}
					var actionMap = this._actionMap ;
					if( actionMap.hasOwnProperty(v) ) {
						var actionData = actionMap[v] ;
						return actionData.action_txt ;
					}
					return '?' ;
				}
			},{
				text: 'Date/Echeance',
				dataIndex: 'next_date',
				align: 'center',
				filter: {
					type: 'date'
				},
				renderer: function(v,metaData,r) {
					if( Ext.isEmpty(v) ) {
						return '' ;
					}
					var etaValue = r.get('next_eta_range') ;
					if( etaValue ) {
						var actionEtaMap = this._actionEtaMap ;
						if( actionEtaMap.hasOwnProperty(etaValue) ) {
							var actionEtaData = actionEtaMap[etaValue] ;
							metaData.style += 'color: white ; background: '+actionEtaData.eta_color ;
						}
					}
					var dateSql ;
					dateSql = Ext.Date.format(v,'d/m/Y') ;
					if( v.getHours() != 0 || v.getMinutes() != 0 ) {
						dateSql += '&#160;' + '<font color="red"><b>' + Ext.Date.format(v,'H:i') + '</b></font>' ;
					}
					return dateSql;
				}
			}]
		},{
			text: 'Finance',
			columns: [{
				text: 'Nb Fact',
				dataIndex: 'inv_nb',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:90,
				align: 'center'
			},{
				text: 'Solde',
				dataIndex: 'inv_amount_due',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				}
			},{
				hidden: true,
				text: 'Montant<br>factures',
				dataIndex: 'inv_amount_total',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				}
			}]
		},{
			text: 'Balance âgée',
			columns: balageColumns
		}] ;
		
		columns = {
			defaults: {
				menuDisabled: false,
				draggable: false,
				sortable: true,
				hideable: false,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: columns
		}
		
		this.tmpModelName = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel()+'-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel(),
			idProperty: 'file_filerecord_id',
			fields: balageFields
		});
		
		pCenter.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			store: {
				model: this.tmpModelName,
				data: []
			},
			listeners: {
				itemdblclick: function( view, record, itemNode, index, e ) {
					this.handleOpenAccount(record.get('acc_id'),record.getId()) ;
					//this.handleOpenFile(record.get('file_filerecord_id')) ;
				},
				scope :this
			},
			_statusMap: statusMap,
			_actionMap: actionMap,
			_actionEtaMap: actionEtaMap
		});
	},
	
	onAtrSet: function() {
		this.doLoad(true) ;
	},
	
	onBeforeQueryLoad: function(store,options) {
		var objAtrFilter = {} ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			objAtrFilter[cfgParamBtn.cfgParam_id] = cfgParamBtn.getValue()
		}) ;
		
		var params = options.getParams() ;
		Ext.apply(params,{
			filter_atr: Ext.JSON.encode(objAtrFilter)
		}) ;
		options.setParams(params) ;
	},
	onSearchSelect: function(searchcombo) {
		var fileFilerecordId = searchcombo.getValue() ;
		this.optimaModule.postCrmEvent('openfile',{fileFilerecordId:fileFilerecordId}) ;
	},
	
	doLoad: function(doClearFilters) {
		var objAtrFilter = {} ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			objAtrFilter[cfgParamBtn.cfgParam_id] = cfgParamBtn.getValue()
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_atr: Ext.JSON.encode(objAtrFilter)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data, doClearFilters) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData, doClearFilters) {
		// Calcul des stats
		// - chaque statut => nb de dossiers / montant
		// - chaque action non réalisée
		var map_status_nbFiles = {},
			map_status_amount = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			map_status_nbFiles[status.status_id]=0 ;
			map_status_amount[status.status_id]=0 ;
		}) ;
		Ext.Array.each( ajaxData, function(fileRow) {
			var status = fileRow.status ;
			if( !map_status_nbFiles.hasOwnProperty(status) ) {
				return ;
			}
			map_status_nbFiles[status]++ ;
			map_status_amount[status] += fileRow.inv_amount_due ;
		}) ;
		
		var map_actionAgendaClass_etaRange_nbActions = {},
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
				if( Ext.isEmpty(actionAgendaClass) ) {
					return ;
				}
				if( !map_actionAgendaClass_etaRange_nbActions.hasOwnProperty(actionAgendaClass) ) {
					map_actionAgendaClass_etaRange_nbActions[actionAgendaClass] = {} ;
				}
				if( !map_actionAgendaClass_etaRange_nbActions[actionAgendaClass].hasOwnProperty(fileActionRow.calc_eta_range) ) {
					map_actionAgendaClass_etaRange_nbActions[actionAgendaClass][fileActionRow.calc_eta_range] = 0 ;
				}
				map_actionAgendaClass_etaRange_nbActions[actionAgendaClass][fileActionRow.calc_eta_range]++ ;
			}) ;
		}) ;
		
		this.down('#pCenter').down('#pGrid').headerCt.down('#colStatus').setVisible( !(this.viewMode=='account') ) ;
		this.down('#pCenter').down('#pGrid').headerCt.down('#colAtr').setVisible( !(this.viewMode=='account') ) ;
		
		if( this.viewMode == 'account' ) {
			newAjaxData = {} ;
			var c = 0 ;
			Ext.Array.each( ajaxData, function(fileRow) {
				var accId = fileRow['acc_id'] ;
				if( !newAjaxData.hasOwnProperty(accId) ) {
					c++ ;
					newAjaxData[accId] = {
						file_filerecord_id: fileRow['file_filerecord_id'],
						acc_id: fileRow['acc_id'],
						acc_txt: fileRow['acc_txt'],
						inv_nb: 0,
						inv_amount_due: 0,
						inv_amount_total: 0,
						inv_balage: {},
						next_actions: []
					} ;
				}
				newAjaxData[accId]['inv_amount_due'] += fileRow['inv_amount_due'] ;
				newAjaxData[accId]['inv_amount_total'] += fileRow['inv_amount_total'] ;
				newAjaxData[accId]['inv_nb'] += fileRow['inv_nb'] ;
				Ext.Object.each( fileRow.inv_balage, function(k,v) {
					if( !newAjaxData[accId].inv_balage.hasOwnProperty(k) ) {
						newAjaxData[accId].inv_balage[k] = 0 ;
					}
					newAjaxData[accId].inv_balage[k] += v ;
				}) ;
				newAjaxData[accId]['next_actions'].push({
					next_fileaction_filerecord_id: fileRow['next_fileaction_filerecord_id'],
					next_action: fileRow['next_action'],
					next_date: fileRow['next_date'],
					next_eta_range: fileRow['next_eta_range']
				});
			}) ;
			
			var findNextFn = function(nextActions) {
				var nextDate = null,
					nextIdx = -1 ;
					
				Ext.Array.each( nextActions, function(nextAction,idx) {
					if( !nextAction.next_date ) {
						return ;
					}
					if( nextDate == null || nextDate > nextAction.next_date ) {
						nextDate = nextAction.next_date ;
						nextIdx = idx ;
					}
				}) ;
				if( nextIdx >= 0 ) {
					return nextActions[nextIdx] ;
				}
			};
			Ext.Object.each( newAjaxData, function(accId, accountRow) {
				var nextAction ;
				if( nextAction = findNextFn(accountRow.next_actions) ) {
					Ext.apply( accountRow, nextAction ) ;
				}
			}) ;
			
			ajaxData = Ext.Object.getValues(newAjaxData) ;
		}
		
		
		
		
		// grid 
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').filters.clearFilters() ;
			
			this.down('#pCenter').down('#pGrid').getStore().sort('next_date','ASC') ;
		}
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
		
		
		
		// charts
		var statusColors = [], statusTitles = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusColors.push(status.status_color) ;
			statusTitles.push(status.status_txt) ;
		}) ;
		
		var agendaFields = ['agenda_class','agenda_class_txt'],
			agendaYFields = [],
			agendaTitles = [],
			agendaColors = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(etaRange) {
			agendaFields.push(etaRange.eta_range) ;
			agendaYFields.push(etaRange.eta_range) ;
			agendaTitles.push(etaRange.eta_txt) ;
			agendaColors.push(etaRange.eta_color) ;
		}) ;
		
		var agendaData = [], agendaRow,
			agendaSummary = {
				'ACTION' : 'Actions',
				'RDV' : 'Rendez-vous',
				'FOLLOW' : 'Promesses'
			};
		Ext.Object.each( agendaSummary, function(agendaClass,agendaClassTxt) {
			agendaRow = {} ;
			agendaRow['agenda_class'] = agendaClass ;
			agendaRow['agenda_class_txt'] = agendaClassTxt ;
			Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(etaRangeRow) {
				var etaRange = etaRangeRow.eta_range ;
				agendaRow[etaRange] = 0 ;
				
				if( map_actionAgendaClass_etaRange_nbActions.hasOwnProperty(agendaClass)
					&& map_actionAgendaClass_etaRange_nbActions[agendaClass].hasOwnProperty(etaRange) ) {
					
					
					agendaRow[etaRange] = map_actionAgendaClass_etaRange_nbActions[agendaClass][etaRange] ;
				}
			}) ;
			
			agendaData.push(agendaRow) ;
		}) ;
		
		var chartStatusAmountData = [],
			chartStatusCountData = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			chartStatusAmountData.push({
				'status_id' : status.status_id,
				'status_txt' : status.status_txt,
				'amount' : Math.round(map_status_amount[status.status_id])
			}) ;
			chartStatusCountData.push({
				'status_id' : status.status_id,
				'status_txt' : status.status_txt,
				'count' : Math.round(map_status_nbFiles[status.status_id])
			}) ;
		}) ;
		var chartStatusAmountTotal = Math.round( Ext.Array.sum( Ext.Object.getValues(map_status_amount)) ),
			chartStatusCountTotal = Ext.Array.sum( Ext.Object.getValues(map_status_nbFiles)) ;
		
		var pNorth = this.down('#pNorth') ;
		pNorth.removeAll() ;
		pNorth.add({
			xtype: 'panel',
			cls: 'chart-no-border',
			width: 350,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				itemId: 'chrtStatusAmount',
				border: false,
				colors: statusColors,
				store: { 
					fields: ['status_id','status_txt', 'amount' ],
					data: chartStatusAmountData
				},
				insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
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
				interactions: ['itemhighlight'],
            sprites: [{
					type: 'text',
					text: 'Répartition ('+Ext.util.Format.number(chartStatusAmountTotal,'0,000')+' k€)',
					fontSize: 12,
					width: 100,
					height: 30,
					x: 30, // the sprite x position
					y: 205  // the sprite y position
				}],
				series: [{
					type: 'pie',
					angleField: 'amount',
					donut: 50,
					label: {
						field: 'status_txt',
						calloutLine: {
							color: 'rgba(0,0,0,0)' // Transparent to hide callout line
						},
						renderer: function(val) {
							return ''; // Empty label to hide text
						}
					},
					listeners: {
						itemclick: this.onPolarItemClick,
						scope: this
					},
					//highlight: true,
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							this.setHtml(storeItem.get('status_txt') + ': ' + storeItem.get('amount') + '€');
						}
					}
				}]
			}
		}) ;
		pNorth.add({
			xtype: 'panel',
			width: 215,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				itemId: 'chrtStatusCount',
				border: false,
				colors: statusColors,
				store: { 
					fields: ['status_id','status_txt', 'count' ],
					data: chartStatusCountData
				},
				insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
				//innerPadding: 20,
				interactions: ['itemhighlight'],
            sprites: [{
					type: 'text',
					text: 'Nb Dossiers ('+chartStatusCountTotal+')',
					fontSize: 12,
					width: 100,
					height: 30,
					x: 55, // the sprite x position
					y: 205  // the sprite y position
				}],
				plugins: {
					ptype: 'chartitemevents',
					moveEvents: false
				},
				series: [{
					type: 'pie',
					angleField: 'count',
					donut: 50,
					label: {
						field: 'status_txt',
						calloutLine: {
							color: 'rgba(0,0,0,0)' // Transparent to hide callout line
						},
						renderer: function(val) {
							return ''; // Empty label to hide text
						}
					},
					listeners: {
						itemclick: this.onPolarItemClick,
						scope: this
					},
					//highlight: true,
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							this.setHtml(storeItem.get('status_txt') + ': ' + storeItem.get('count') + '');
						}
					}
				}]
			}
		}) ;
		pNorth.add({
			xtype: 'panel',
			border: false,
			cls: 'chart-no-border',
			flex: 1,
			layout: 'fit',
			//border: false,
			items: {
            xtype: 'cartesian',
				 itemId: 'chrtAgenda',
				 colors: agendaColors,
				border: false,
            width: '100%',
            height: '100%',
            legend: {
                docked: 'bottom',
					toggleable: false
            },
            store: {
					fields: agendaFields,
					data: agendaData
				},
				plugins: {
					ptype: 'chartitemevents',
					moveEvents: false
				},
            insetPadding: { top: 30, left: 10, right: 30, bottom: 10 },
            flipXY: true,
            sprites: [{
                type: 'text',
                text: 'Agenda / Actions imminentes',
                fontSize: 14,
                width: 100,
                height: 30,
                x: 150, // the sprite x position
                y: 20  // the sprite y position
            }],
            axes: [{
                type: 'numeric',
                position: 'bottom',
                adjustByMajorUnit: true,
                fields: agendaYFields,
                grid: true,
                renderer: function (v) { return v + ''; },
                minimum: 0
            }, {
                type: 'category',
                position: 'left',
                fields: 'agenda_class_txt',
                grid: true
            }],
            series: [{
                type: 'bar',
                axis: 'bottom',
                title: agendaTitles,
                xField: 'agenda_class_txt',
                yField: agendaYFields,
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
                        this.setHtml(browser + ' for ' + storeItem.get('agenda_class_txt') + ': ' + storeItem.get(item.field));
                    }
                }
            }]
			}
		}) ;
	},
	
	
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
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	doQuit: function() {
		this.destroy() ;
	},
	onDestroy: function() {
		if( this.autoRefreshTask ) {
			this.autoRefreshTask.cancel() ;
		}
	},
	
	handleOpenFile: function(fileFilerecordId) {
		this.optimaModule.postCrmEvent('openfile',{fileFilerecordId:fileFilerecordId}) ;
	},
	
	handleOpenAccount: function(accId,fileFilerecordId) {
		var objAtrFilter = {} ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			objAtrFilter[cfgParamBtn.cfgParam_id] = cfgParamBtn.getValue()
		}) ;
		
		this.optimaModule.postCrmEvent('openaccount',{accId:accId, filterAtr:objAtrFilter, focusFileFilerecordId:fileFilerecordId}) ;
	},
	
	onPolarItemClick: function( series , item ) {
		var clickStatus = item.record.data.status_id ;
		
		var gridPanel = this.down('#pCenter').down('#pGrid'),
			gridPanelStore = gridPanel.getStore(),
			gridPanelFilters = gridPanelStore.getFilters() ;
		
		var curStatus ;
		gridPanelFilters.each(function(filter) {
			switch( filter.getProperty() ) {
				case 'status' :
					curStatus = filter.getValue() ;
					break ;
			}
		}) ;
		gridPanelStore.clearFilter() ;
		gridPanel.filters.clearFilters() ;
		if( curStatus == clickStatus ) {
			return ;
		}
		gridPanelStore.filter([{
			exactMatch : true,
			property : 'status',
			value    : clickStatus
		}]);
	},
	onBarItemClick: function( series, item ) {
		var clickAgendaClass = item.record.data.agenda_class,
			clickEtaRange = item.field ;
		
		var gridPanel = this.down('#pCenter').down('#pGrid'),
			gridPanelStore = gridPanel.getStore(),
			gridPanelFilters = gridPanelStore.getFilters() ;
		
		var curAgendaClass, curEtaRange ;
		gridPanelFilters.each(function(filter) {
			switch( filter.getProperty() ) {
				case 'next_eta_range' :
					curEtaRange = filter.getValue() ;
					break ;
				case 'next_agenda_class' :
					curAgendaClass = filter.getValue() ;
					break ;
			}
		}) ;
		
		gridPanelStore.clearFilter() ;
		gridPanel.filters.clearFilters() ;
		if( curAgendaClass == clickAgendaClass && curEtaRange == clickEtaRange ) {
			return ;
		}
		gridPanelStore.filter([{
			exactMatch : true,
			property : 'next_eta_range',
			value    : clickEtaRange
		},{
			exactMatch : true,
			property : 'next_agenda_class',
			value    :  clickAgendaClass
		}]);
	}
});
