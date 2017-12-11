Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Ext.ux.grid.filters.filter.StringList',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.SearchCombo',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter',
		'Optima5.Modules.Spec.RsiRecouveo.MultiActionForm'
	],
	
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	defaultViewMode: 'file',
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/modules/rsiveo-back-16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				itemId: 'tbSoc',
				cfgParam_id: 'SOC',
				icon: 'images/modules/rsiveo-blocs-16.gif',
				selectMode: 'MULTI',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onSocSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),{
				itemId: 'tbAtr',
				border: false,
				xtype: 'toolbar',
				items: []
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				itemId: 'tbUser',
				cfgParam_id: 'USER',
				icon: 'images/modules/rsiveo-users-16.png',
				selectMode: 'SINGLE',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onUserSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),{
				icon: 'images/modules/rsiveo-search-16.gif',
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
			}),'->',{
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
						iconCls: 'op5-spec-rsiveo-grid-view-order'
					},{
						itemId: 'account',
						text: 'Vue par compte',
						iconCls: 'op5-spec-rsiveo-grid-view-ordergroup'
					},{
						xtype: 'menuseparator'
					},{
						xtype: 'menucheckitem',
						text: 'Afficher dossiers fermés ?',
						handler: null,
						listeners: {
							checkchange: function(mi,checked) {
								this.doShowClosed(checked) ;
							},
							scope: this
						}
					}]
				}
			},{
				iconCls: 'op5-spec-rsiveo-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad(true) ;
				},
				scope: this
			},{
				hidden: this._readonlyMode,
				iconCls: 'op5-spec-rsiveo-datatoolbar-new',
				text: 'Select.multiple',
				handler: function() {
					this.toggleMultiSelect() ;
				},
				scope: this
			},{
				hidden: this._readonlyMode,
				iconCls: 'op5-spec-rsiveo-datatoolbar-file-export-excel',
				text: 'Export',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}],
			items: [{
				//title: 'Statistiques sur sélection',
				region: 'north',
				//hidden: true,
				collapsible: true,
				height: 290,
				border: true,
				xtype: 'panel',
				itemId: 'pNorth',
				layout: {
					type: 'hbox',
					align: 'top'
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
		
		this.buildToolbar() ;
		this.buildViews() ;
		this.applyAgendaMode() ;
		this.applyAuth() ;
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
		
		this.configureToolbar() ;
		this.configureViews() ;
		
		this.doLoad(true) ;
	},
	doShowClosed: function(showClosed) {
		this.showClosed = showClosed ;
		this.doLoad(true) ;
	},
	buildToolbar: function() {
		var tbAtr = this.down('#tbAtr') ;
		tbAtr.removeAll() ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( !atrRecord.is_filter ) {
				return ;
			}
			tbAtr.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR:'+atrRecord.atr_id,
				cfgParam_atrType: atrRecord.atr_type,
				icon: 'images/modules/rsiveo-blocs-16.gif',
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
		this.configureToolbar() ;
	},
	configureToolbar: function() {
		var tbSoc = this.down('#tbSoc'),
			tbSocsSelected = tbSoc.getLeafNodesKey() ;
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(tbSocsSelected), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		
		var tbAtr = this.down('#tbAtr') ;
		tbAtr.items.each( function(atrBtn) {
			var doHide = false ;
			
			var atrBtnId = atrBtn.cfgParam_id ;
			if( !Ext.Array.contains(cfgParamIds,atrBtnId) ) {
				doHide = true ;
			}
			
			if( atrBtn.cfgParam_atrType=='record' && this.viewMode=='account' ) {
				doHide = true ;
			}
			
			atrBtn.setVisible( !doHide ) ;
		},this) ;
	},
	buildViews: function() {
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
		}) ;
		var actionnextMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionnextData(), function(actionnext) {
			actionnextMap[actionnext.id] = actionnext ;
		}) ;
		
		var actionEtaMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(actionEta) {
			actionEtaMap[actionEta.eta_range] = actionEta ;
		}) ;
		
		var atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			if( !atrRecord.is_filter ) {
				return ;
			}
			atrColumns.push({
				cfgParam_id: 'ATR:'+atrRecord.atr_id,
				cfgParam_atrType: atrRecord.atr_type,
				text: atrRecord.atr_desc,
				dataIndex: atrRecord.atr_field,
				//rendererDataindex: atrRecord.bible_code + '_text',
				width:120,
				align: 'center'
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
				width:90,
				align: 'center',
				renderer: balageRenderer,
				filter: {
					type: 'number'
				},
				summaryType: 'sum',
				summaryRenderer: balageRenderer
			}) ;
			
			balageFields.push({
				name: balageField,
				balageSegmtId: balageSegmt.segmt_id,
				type: 'number',
				convert: balageConvert
			});
		}) ;
		
		
		var pCenter = this.down('#pCenter') ;
		
		var validBtn = Ext.create('Ext.button.Button',{
			cls: 'op5-spec-rsiveo-checkcolumn-btn op5-spec-rsiveo-checkcolumn-submit',
			iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
		});
		validBtnMarkup = Ext.DomHelper.markup(validBtn.getRenderTree());
		validBtn.destroy() ;
		
		var checkAllBtn = Ext.create('Ext.button.Button',{
			cls: 'op5-spec-rsiveo-checkcolumn-btn op5-spec-rsiveo-checkcolumn-checkall x-grid-checkcolumn x-grid-checkcolumn-checked'
			//iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
		});
		var checkAllBtnMarkup = Ext.DomHelper.markup(checkAllBtn.getRenderTree());
		checkAllBtn.destroy() ;
		
		var checkNoneBtn = Ext.create('Ext.button.Button',{
			cls: 'op5-spec-rsiveo-checkcolumn-btn op5-spec-rsiveo-checkcolumn-checknone x-grid-checkcolumn'
			//iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
		});
		var checkNoneBtnMarkup = Ext.DomHelper.markup(checkNoneBtn.getRenderTree());
		checkNoneBtn.destroy() ;
		
		var columns = [{
			width: 70,
			hidden: true,
			xtype: 'uxnullcheckcolumn',
			itemId: 'colMultiSelect',
			sortable: false,
			dataIndex: '_is_selection',
			text: '<b><font color="red">Create</font></b>' + '<div align="center">' + validBtnMarkup + '</div>' + '<div align="center">' + checkAllBtnMarkup + '&#160;' + checkNoneBtnMarkup + '</div>',
			isColumnCreate: true,
			listeners: {
				// attach event listener to buttonMarkup
				afterrender: function(editingColumn) {
					editingColumn.getEl().on( 'click', function(e,t) {
						e.stopEvent() ;
						this.handleMultiSelect() ;
					},this,{delegate:'.op5-spec-rsiveo-checkcolumn-submit'}) ;
					editingColumn.getEl().on( 'click', function(e,t) {
						e.stopEvent() ;
						this.toggleMultiSelectAll(true);
					},this,{delegate:'.op5-spec-rsiveo-checkcolumn-checkall'}) ;
					editingColumn.getEl().on( 'click', function(e,t) {
						e.stopEvent() ;
						this.toggleMultiSelectAll(false);
					},this,{delegate:'.op5-spec-rsiveo-checkcolumn-checknone'}) ;
				},
				scope: this
			}
		},{
			text: 'Affectation',
			width:100,
			dataIndex: 'link_user_txt'
		},{
			itemId: 'colAtr',
			text: 'Attributs',
			columns: atrColumns
		},{
			text: 'Débiteur',
			columns: [{
				text: 'Entité',
				dataIndex: 'soc_id',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:100,
				align: 'center',
				filter: {
					type: 'stringlist',
					useFilters: true
				},
				renderer: function(v,m,r) {
					return r.get('soc_txt') ;
				}
			},{
				text: 'No Compte',
				dataIndex: 'acc_id',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:100,
				align: 'center',
				filter: {
					type: 'string'
				}
			},{
				text: 'Nom',
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
			dataIndex: 'status_txt',
			filter: {
				type: 'stringlist',
				useFilters: true
			},
			renderer: function(v,metaData,r) {
				metaData.style += 'color: white ; background: '+r.get('status_color') ;
				return v ;
			}
		},{
			text: 'Prochaine action',
			columns: [{
				text: 'Action',
				width: 140,
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				align: 'center',
				dataIndex: 'next_action_suffix_txt',
				filter: {
					type: 'stringlist',
					useFilters: true
				},
				renderer: function(v,metaData,r) {
					return v ;
				}
			},{
				text: 'Date',
				width: 100,
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
				align: 'center',
				summaryType: 'sum',
				summaryRenderer: function(value,summaryData,field,metaData) {
					return value ;
				}
			},{
				text: 'Solde',
				dataIndex: 'inv_amount_due',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				},
				renderer: function(value) {
					return Ext.util.Format.number(value,'0,000.00') ;
				},
				summaryType: 'sum',
				summaryRenderer: function(value,summaryData,field,metaData) {
					return Ext.util.Format.number(value,'0,000.00') ;
				}
			},{
				hidden: true,
				text: 'Montant<br>factures',
				dataIndex: 'inv_amount_total',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				},
				renderer: function(value) {
					return Ext.util.Format.number(value,'0,000.00') ;
				},
				summaryType: 'sum',
				summaryRenderer: function(value,summaryData,field,metaData) {
					return Ext.util.Format.number(value,'0,000.00') ;
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
			fields: Ext.Array.merge(balageFields,[
				{name: '_is_selection', type:'boolean'}
			])
		});
		
		pCenter.removeAll() ;
		pCenter.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			features: [{
				ftype: 'summary',
				dock: 'top'
			}],
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
				},
				scope :this
			},
			viewConfig: {
				getRowClass: function(r) {
					if( r.get('ext_user') ) {
						return 'op5-spec-rsiveo-pom' ;
					}
				}
			},
			_statusMap: statusMap,
			_actionMap: actionMap,
			_actionnextMap: actionnextMap,
			_actionEtaMap: actionEtaMap
		});
		
		
		
		// ******** Charts *****************
		
		var balageGridFields = ['status_id','status_txt','status_color'],
			balageGridColumns = [{
				locked: true,
				width: 100,
				text: 'Statut',
				dataIndex: 'status_txt',
				renderer: function(value,metaData,record) {
					metaData.style += 'color: white ; background: '+record.get('status_color') ;
					return value ;
				},
				summaryType: 'sum',
				summaryRenderer: function(value) {
					return '<b>'+'Total'+'</b>' ;
				}
			}],
			balageRenderer = function(v) {
				if( v == 0 ) {
					return '' ;
				}
				return Ext.util.Format.number(v,'0,000')+' €' ;
			} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			
			balageGridColumns.push({
				text: balageSegmt.segmt_txt,
				dataIndex: balageField,
				width:95,
				align: 'center',
				renderer: balageRenderer,
				summaryType: 'sum',
				summaryRenderer: function(value) {
					return '<b>'+Ext.util.Format.number(value,'0,000')+' €'+'</b>' ;
				}
			}) ;
			
			balageGridFields.push(balageField);
		}) ;
		if( true ) {
			var balageField = 'inv_balage_sum' ;
			balageGridFields.push(balageField);
			balageGridColumns.push({
				text: '<b>'+'Total'+'</b>',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				dataIndex: balageField,
				width:95,
				align: 'center',
				renderer: balageRenderer,
				summaryType: 'sum',
				summaryRenderer: function(value) {
					return '<b>'+Ext.util.Format.number(value,'0,000')+' €'+'</b>' ;
				}
			}) ;
		}
		
		
		
		var statusColors = [], statusTitles = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusColors.push(status.status_color) ;
			statusTitles.push(status.status_txt) ;
		}) ;
		
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
				return Ext.util.Format.number(v,'0,000')+' €' ;
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
				text: etaRange.eta_txt,
				dataIndex: etaRange.eta_range+'_amount',
				width: 85,
				tdCls: 'bgcolor-'+etaRange.eta_color.substring(1),
				renderer: agendaGridColumnAmountRenderer,
				summaryType:'sum',
				summaryRenderer: function(value) {
					return '<b>'+Ext.util.Format.number(value,'0,000')+' €'+'</b>' ;
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
					return '<b>'+Ext.util.Format.number(value,'0,000')+' €'+'</b>' ;
				}
			});
		}
		
		
		var chartStatusAmountTotal = 0,
			chartStatusCountTotal = 0 ;
		
		var pNorth = this.down('#pNorth') ;
		pNorth.removeAll() ;
		var chrtStatusAmountText = Ext.create('Ext.draw.sprite.Text', {
			type: 'text',
			text: '',
			fontSize: 12,
			fontFamily: 'Play, sans-serif',
			width: 100,
			height: 30,
			x: 30, // the sprite x position
			y: 235  // the sprite y position
		});
		pNorth.add({
			xtype: 'panel',
			cls: 'chart-no-border',
			width: 315,
			height: 240,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				 animation: false,
				itemId: 'chrtStatusAmount',
				border: false,
				colors: statusColors,
				store: { 
					fields: ['status_id','status_txt', 'amount' ],
					data: []
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
				_textSprite: chrtStatusAmountText,
            sprites: [chrtStatusAmountText],
				plugins: {
					ptype: 'chartitemevents',
					moveEvents: false
				},
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
		var chrtStatusCountText = Ext.create('Ext.draw.sprite.Text', {
			type: 'text',
			text: '',
			fontSize: 12,
			fontFamily: 'Play, sans-serif',
			width: 100,
			height: 30,
			x: 55, // the sprite x position
			y: 235  // the sprite y position
		});
		pNorth.add({
			xtype: 'panel',
			height: 240,
			width: 215,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				 animation: false,
				itemId: 'chrtStatusCount',
				border: false,
				colors: statusColors,
				store: { 
					fields: ['status_id','status_txt', 'count' ],
					data: []
				},
				insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
				//innerPadding: 20,
				interactions: ['itemhighlight'],
				_textSprite: chrtStatusCountText,
            sprites: [chrtStatusCountText],
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
			xtype:'box',
			width: 2,
			height: '100%',
			style: 'background-color: gray'
		}) ;
		pNorthTab = pNorth.add({
			flex: 1,
			xtype: 'tabpanel',
			items: []
		});
		pNorthTab.add({
			title: 'Agenda',
			xtype: 'panel',
			itemId: 'pNorthAgenda',
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
							checked: true
						}, {
							boxLabel  : 'Devise (€)',
							name      : 'agenda_mode',
							inputValue: 'amount'
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
						
						align: 'center'
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
							chrtAgenda = this.down('#pNorth').down('#chrtAgenda') ;
						if( !selRecord ) {
							chrtAgenda.setVisible(false) ;
							chrtAgenda.getStore().loadData([]) ;
							return ;
						}
						chrtAgenda.getStore().loadData([selRecord.getData()]) ;
						chrtAgenda.setVisible(true) ;
					},
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
		pNorthTab.add({
			title: 'Balance âgée par statut',
			xtype: 'panel',
			itemId: 'pNorthBalage',
			border: false,
			cls: 'chart-no-border',
			layout: 'fit',
			items: [{
				margin: '4px 10px',
				xtype: 'grid',
				itemId: 'gridStatusBalage',
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
						
						align: 'center'
					},
					items: balageGridColumns
				},
				store: {
					fields: balageGridFields,
					data: []
				},
				features: [{
					ftype: 'summary',
					dock: 'bottom'
				}]
			}]
		});
		pNorthTab.setActiveTab(0);
		this.configureViews() ;
	},
	configureViews: function() {
		var tbSoc = this.down('#tbSoc'),
			tbSocsSelected = tbSoc.getLeafNodesKey() ;
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(tbSocsSelected), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		
		this.down('#pCenter').down('#pGrid').headerCt.down('#colStatus').setVisible( !(this.viewMode=='account') ) ;
		//this.down('#pCenter').down('#pGrid').headerCt.down('#colAtr').setVisible( !(this.viewMode=='account') ) ;
		this.down('#pCenter').down('#pGrid').headerCt.down('#colAtr').items.each( function(col) {
			var doHide = false ;
			
			var atrColId = col.cfgParam_id ;
			if( !Ext.Array.contains(cfgParamIds,atrColId) ) {
				doHide = true ;
			}
			
			if( col.cfgParam_atrType=='record' && this.viewMode=='account' ) {
				doHide = true ;
			}
			
			col.setVisible(!doHide) ;
		},this) ;
	},
	applyAgendaMode: function() {
		var gridAgenda = this.down('#pNorth').down('#gridAgenda'),
			formAgenda = this.down('#pNorth').down('#formAgenda'),
			agendaMode = formAgenda.getForm().getValues()['agenda_mode'] ;
		Ext.Array.each( gridAgenda.headerCt.query('[_agendaMode]'), function(column) {
			column.setVisible( (column._agendaMode==agendaMode) ) ;
		} ) ;
	},
	toggleMultiSelect: function( torf ) {
		var column = this.down('#pCenter').down('#pGrid').headerCt.down('#colMultiSelect') ;
		if( torf === undefined ) {
			var torf = !column.isVisible()
		}
		column.setVisible( torf ) ;
	},
	
	applyAuth: function() {
		var helperCache = Optima5.Modules.Spec.RsiRecouveo.HelperCache,
			authSoc = [],
			authMapAtr = {},
			authIsExt = null ;
		authSoc = helperCache.authHelperListSoc() ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			authMapAtr[atrId] = helperCache.authHelperListAtr(atrId) ;
		}) ;
		authIsExt = helperCache.authHelperIsExt() ;
		
		var silent = true ;
		
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( cfgParam_id.indexOf('ATR_')===0 ) {
				if( authMapAtr.hasOwnProperty(cfgParam_id) ) {
					cfgParamBtn.setValue(authMapAtr[cfgParam_id],silent) ;
				}
			}
			if( cfgParam_id=='SOC' ) {
				if( authSoc ) {
					cfgParamBtn.setValue(authSoc,silent) ;
				}
			}
			if( cfgParam_id=='USER' ) {
				if( authIsExt != null ) {
					cfgParamBtn.setValue(authIsExt,silent) ;
				}
			}
		}) ;
	},
	
	onSocSet: function() {
		this.configureToolbar() ;
		
		var tbAtr = this.down('#tbAtr') ;
		tbAtr.items.each( function(atrBtn) {
			// Reset atr specific values
			this.setValue(null,true) ;
		}) ;
		this.configureViews() ;
		this.doLoad(true) ;
	},
	onAtrSet: function() {
		this.doLoad() ;
	},
	onUserSet: function() {
		var tbUser = this.down('toolbar').down('#tbUser'),
			userExtSet = ( !Ext.isEmpty( tbUser.getLeafNodesKey() ) && Optima5.Modules.Spec.RsiRecouveo.HelperCache.authHelperIsExt() ) ;
		this.down('toolbar').down('#btnSearchIcon').setVisible( !userExtSet );
		this.down('toolbar').down('#btnSearch').setVisible( !userExtSet );
		
		this.doLoad(true) ;
	},
	
	onBeforeQueryLoad: function(store,options) {
		var objAtrFilter = {}, arrSocFilter=[] ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( Ext.isEmpty(cfgParamBtn.getValue()) ) {
				return ;
			}
			if( cfgParam_id.indexOf('ATR:')===0 ) {
				var atrId = cfgParam_id.substr(4) ;
				objAtrFilter[atrId] = cfgParamBtn.getValue()
			}
			if( cfgParam_id=='SOC' ) {
				arrSocFilter = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		
		var params = options.getParams() ;
		Ext.apply(params,{
			filter_atr: Ext.JSON.encode(objAtrFilter),
			filter_soc: (arrSocFilter ? Ext.JSON.encode(arrSocFilter):''),
			filter_archiveIsOn: (this.showClosed ? 1 : 0)
		}) ;
		options.setParams(params) ;
	},
	onSearchSelect: function(searchcombo,selrec) {
		this.handleOpenAccount(selrec.get('acc_id'),selrec.get('file_filerecord_id')) ;
	},
	
	doLoad: function(doClearFilters) {
		var objAtrFilter = {}, arrSocFilter=null, arrUserFilter=null ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( Ext.isEmpty(cfgParamBtn.getValue()) ) {
				return ;
			}
			if( cfgParam_id.indexOf('ATR:')===0 ) {
				var atrId = cfgParam_id.substr(4) ;
				objAtrFilter[atrId] = cfgParamBtn.getValue()
			}
			if( cfgParam_id=='SOC' ) {
				arrSocFilter = cfgParamBtn.getLeafNodesKey() ;
			}
			if( cfgParam_id=='USER' ) {
				arrUserFilter = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_atr: Ext.JSON.encode(objAtrFilter),
				filter_soc: (arrSocFilter ? Ext.JSON.encode(arrSocFilter):''),
				filter_user: (arrUserFilter ? Ext.JSON.encode(arrUserFilter):''),
				filter_archiveIsOn: (this.showClosed ? 1 : 0)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				if( doClearFilters ) {
					this.onLoadAtrValues(ajaxResponse.map_atrId_values) ;
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
	onLoadAtrValues: function( map_atrId_values ) {
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( cfgParam_id.indexOf('ATR:')===0 ) {
				var atrId = cfgParam_id.substr(4) ;
				cfgParamBtn.fillValues(map_atrId_values[atrId]) ;
			}
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
		
		var map_status_arrBalage = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			map_status_arrBalage[status.status_id]=[] ;
		}) ;
		Ext.Array.each( ajaxData, function(fileRow) {
			var status = fileRow.status ;
			if( !map_status_arrBalage.hasOwnProperty(status) ) {
				return ;
			}
			map_status_arrBalage[status].push(fileRow.inv_balage) ;
		}) ;
		
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
				
				if( !map_actionAgendaClass_etaRange_amount.hasOwnProperty(actionAgendaClass) ) {
					map_actionAgendaClass_etaRange_amount[actionAgendaClass] = {} ;
				}
				if( !map_actionAgendaClass_etaRange_amount[actionAgendaClass].hasOwnProperty(fileActionRow.calc_eta_range) ) {
					map_actionAgendaClass_etaRange_amount[actionAgendaClass][fileActionRow.calc_eta_range] = 0 ;
				}
				map_actionAgendaClass_etaRange_amount[actionAgendaClass][fileActionRow.calc_eta_range] += fileRow.inv_amount_due ;
			}) ;
		}) ;
		
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
					
					
					var additionalData = {
						soc_id: fileRow['soc_id'],
						soc_txt: fileRow['soc_txt']
					};
					Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
						var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId),
							atrField = atrRecord.atr_field,
							atrType = atrRecord.atr_type ;
						if( atrType=='account' ) {
							additionalData[atrField] = fileRow[atrField] ;
						}
					});
					Ext.apply( newAjaxData[accId], additionalData) ;
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
					next_action_suffix_txt: fileRow['next_action_suffix_txt'],
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
			this.toggleMultiSelect(false) ;
			
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').filters.clearFilters() ;
			
			this.down('#pCenter').down('#pGrid').getStore().sort('next_date','ASC') ;
		}
		Ext.Array.each( this.down('#pCenter').down('#pGrid').getColumns(), function(column) {
			if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
				column.filter.resetList() ; // HACK!
			}
		}) ;
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
		
		
		
		// charts
		var agendaData = [], agendaRow,
			agendaSummary = {};
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(actionRow) {
			if( !Ext.isEmpty(actionRow.agenda_class) && !agendaSummary.hasOwnProperty(actionRow.agenda_class) ) {
				var statusRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusRowId(actionRow.agenda_class) ;
				if( !statusRow ) {
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
		
		var chartStatusAmountData = [],
			chartStatusCountData = [],
			gridStatusBalageData = [] ;
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
			
			var gridStatusBalageRow = {
				'status_id' : status.status_id,
				'status_txt' : status.status_txt,
				'status_color' : status.status_color
			};
			Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
				var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
				gridStatusBalageRow[balageField] = 0 ;
			}) ;
			gridStatusBalageRow['inv_balage_sum'] = 0 ;
			Ext.Array.each( map_status_arrBalage[status.status_id], function(invBalage) {
				Ext.Object.each( invBalage, function(balageSegmtId,amount) {
					var balageField = 'inv_balage_'+balageSegmtId ;
					if( !gridStatusBalageRow.hasOwnProperty(balageField) ) {
						return ;
					}
					gridStatusBalageRow[balageField] += amount ;
					gridStatusBalageRow['inv_balage_sum'] += amount ;
				});
			}) ;
			gridStatusBalageData.push(gridStatusBalageRow) ;
		}) ;
		
		var chartStatusAmountTotal = Math.round( Ext.Array.sum( Ext.Object.getValues(map_status_amount)) ),
			chartStatusCountTotal = Ext.Array.sum( Ext.Object.getValues(map_status_nbFiles)) ;
		
		this.down('#pNorth').down('#chrtStatusAmount').getStore().loadRawData(chartStatusAmountData) ;
		this.down('#pNorth').down('#chrtStatusCount').getStore().loadRawData(chartStatusCountData) ;
		
		this.down('#pNorth').down('#gridAgenda').getSelectionModel().deselectAll() ;
		this.down('#pNorth').down('#gridAgenda').getStore().loadRawData(agendaData) ;
		
		this.down('#pNorth').down('#gridStatusBalage').getStore().loadRawData(gridStatusBalageData) ;
		
		this.down('#pNorth').down('#chrtStatusAmount')._textSprite.setAttributes({
			text: 'Répartition ( '+Ext.util.Format.number(chartStatusAmountTotal,'0,000')+' € )'
		},true) ;
		this.down('#pNorth').down('#chrtStatusCount')._textSprite.setAttributes({
			text: 'Nb Dossiers ( '+chartStatusCountTotal+' )'
		},true) ;
	},
	
	toggleMultiSelectAll: function(torf) {
		this.down('#pCenter').down('#pGrid').getStore().each( function(rec) {
			rec.set('_is_selection',torf) ;
			//rec.commit() ;
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
	
	handleMultiSelect: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.MultiActionForm',{
			optimaModule: this.optimaModule,
			width:400, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}]
		});
		createPanel.on('saved', function(p) {
			this.doTreeLoad() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
	},
	
	handleOpenAccount: function(accId,fileFilerecordId) {
		var objAtrFilter = {} ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			objAtrFilter[cfgParamBtn.cfgParam_id] = cfgParamBtn.getValue()
		}) ;
		
		this.optimaModule.postCrmEvent('openaccount',{
			accId:accId,
			filterAtr:objAtrFilter,
			focusFileFilerecordId:fileFilerecordId,
			showClosed: this.showClosed
		}) ;
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
			Ext.Array.each( this.down('#pCenter').down('#pGrid').getColumns(), function(column) {
				if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
					column.filter.rebuildList() ; // HACK!
				}
			}) ;
			return ;
		}
		gridPanelStore.filter([{
			exactMatch : true,
			property : 'status',
			value    : clickStatus
		}]);
		Ext.Array.each( this.down('#pCenter').down('#pGrid').getColumns(), function(column) {
			if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
				column.filter.rebuildList() ; // HACK!
			}
		}) ;
	},
	onBarItemClick: function( series, item ) {
		var clickAgendaClass = item.record.data.agenda_class,
			clickEtaRange = item.field.replace('_ratio1000','') ;
		
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
			Ext.Array.each( this.down('#pCenter').down('#pGrid').getColumns(), function(column) {
				if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
					column.filter.rebuildList() ; // HACK!
				}
			}) ;
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
		Ext.Array.each( this.down('#pCenter').down('#pGrid').getColumns(), function(column) {
			if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
				column.filter.rebuildList() ; // HACK!
			}
		}) ;
	},
	
	
	handleDownload: function() {
		var mapFieldString = {} ;
		Ext.Array.each( this.down('#pCenter').down('#pGrid').getStore().getModel().getFields(), function(field) {
			mapFieldString[field.getName()] = Ext.Array.contains(['string'],field.getType()) ;
		}) ;
		
		var columns = [] ;
		Ext.Array.each( this.down('#pCenter').down('#pGrid').headerCt.getGridColumns(), function(column) {
			columns.push({
				dataIndex: column.dataIndex,
				dataIndexString: mapFieldString[column.dataIndex],
				text: column.text
			});
		});
		
		var data = [] ;
		this.down('#pCenter').down('#pGrid').getStore().each( function(record) {
			data.push( record.getData(true) ) ;
		}) ;
		
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_rsi_recouveo',
			_action: 'xls_create',
			columns: Ext.JSON.encode(columns),
			data: Ext.JSON.encode(data),
			exportXls: true
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
});
