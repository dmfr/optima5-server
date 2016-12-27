Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter'
	],
	
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	
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
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_BU',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnBu',
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
			}),'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_DIV',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnDiv',
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
			}),'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_SECT',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnSect',
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
			}),'->',{
				itemId: 'tbCreate',
				icon: 'images/op5img/ico_new_16.gif',
				text:'Actions...',
				menu: {
					defaults: {
						scope:this
					},
					items: [{
						text: 'Action groupée',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewOrder() ;
						},
						scope: this
					},{
						text: 'Mailing ponctuel',
						iconCls: 'op5-spec-dbstracy-grid-view-ordergroup',
						handler: function() {
							this.handleNewHat() ;
						},
						scope: this
					},{
						text: 'Transport',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewTrspt() ;
						},
						scope: this
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
		
		//this.onViewSet(this.defaultViewMode) ;
		this.configureViews() ;
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
	
	configureViews: function() {
		

		
		
		
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
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
		
		var pCenter = this.down('#pCenter') ;
		var columns = [{
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
					bibleId: 'BASE_CLI'
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
				renderer: function(v) {
					if( Ext.isEmpty(v) ) {
						return '' ;
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
				text: 'Montant<br>débiteur',
				dataIndex: 'inv_amount_due',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				}
			},{
				text: 'Montant<br>total',
				dataIndex: 'inv_amount_total',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				}
			}]
		}] ;
		pCenter.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			store: {
				model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel(),
				data: []
			},
			listeners: {
				itemdblclick: function( view, record, itemNode, index, e ) {
					this.handleOpenFile(record.get('file_filerecord_id')) ;
				},
				scope :this
			},
			_statusMap: statusMap,
			_actionMap: actionMap
		});
		
		this.doLoad(true) ;
	},
	
	onAtrSet: function() {
		this.doLoad(true) ;
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
		
		
		// grid 
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').filters.clearFilters() ;
			
			this.down('#pCenter').down('#pGrid').getStore().sort('next_date','DESC') ;
		}
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
		
		
		
		// charts
		var statusColors = [], statusTitles = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusColors.push(status.status_color) ;
			statusTitles.push(status.status_txt) ;
		}) ;
		
		var agendaFields = ['agenda_class'],
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
			agendaRow['agenda_class'] = agendaClassTxt ;
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
				'status_txt' : status.status_txt,
				'amount' : Math.round(map_status_amount[status.status_id])
			}) ;
			chartStatusCountData.push({
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
					fields: ['status_txt', 'amount' ],
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
					highlight: true,
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
					fields: ['status_txt', 'count' ],
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
					highlight: true,
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
                docked: 'bottom'
            },
            store: {
					fields: agendaFields,
					data: agendaData
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
                fields: 'agenda_class',
                grid: true
            }],
            series: [{
                type: 'bar',
                axis: 'bottom',
                title: agendaTitles,
                xField: 'agenda_class',
                yField: agendaYFields,
                stacked: true,
                style: {
                    opacity: 0.80
                },
                highlight: {
                    fillStyle: 'yellow'
                },
                tooltip: {
                    trackMouse: true,
                    style: 'background: #fff',
                    renderer: function(storeItem, item) {
                        var browser = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
                        this.setHtml(browser + ' for ' + storeItem.get('agenda_class') + ': ' + storeItem.get(item.field));
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
	
	getSampleData: function() {
		var data = [{
			filerecord_id: 1,
			atr_bu: 'PMI / PME',
			atr_div: 'Sols',
			atr_sect: 'Secteur 3',
			id_ref: '1234567890',
			id_txt: 'Plastibert',
			status_txt: 'Prise contact',
			status_color: '#A61120',
			next_action: '<font color="black">2ème appel</font>',
			next_date: '15/11/2016',
			inv_nb: '<b>1</b>',
			inv_amount_due: '<b>580.00</b>&nbsp;&euro;',
			inv_amount_total: '<b>580.00</b>&nbsp;&euro;'
		},{
			filerecord_id: 2,
			atr_bu: 'Large industries',
			atr_div: 'Peintures',
			atr_sect: 'Secteur 1',
			id_ref: '9876543210',
			id_txt: 'Solvay SA (SOLB.BE)',
			status_txt: 'Outils juridiques',
			status_color: '#FFD13E',
			next_action: '<font color="red">RDV Tel huissier</font>',
			next_date: '16/11/2016 <font color="red"><b>9h30</b></font>',
			inv_nb: '<b>3</b>',
			inv_amount_due: '<b>2890.49</b>&nbsp;&euro;',
			inv_amount_total: '<b>3600.59</b>&nbsp;&euro;'
		}] ;
		return data ;
	}
});
