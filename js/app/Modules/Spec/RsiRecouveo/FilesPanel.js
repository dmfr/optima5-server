Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Ext.ux.grid.filters.filter.StringList',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.SearchCombo',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter',
		'Optima5.Modules.Spec.RsiRecouveo.MultiActionForm',
		'Optima5.Modules.Spec.RsiRecouveo.FilesTopPanel',
		'Optima5.Modules.Spec.RsiRecouveo.UxGridFilters',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage'
	],
	
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	defaultViewMode: 'file',
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			tbar:[{
				hidden: this._reportMode,
				icon: 'images/modules/rsiveo-back-16.gif',
				text: '<u>Menu</u>',
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
				hidden: this._reportMode,
				itemId: 'btnSearchIcon',
				handler: function(btn) {
					btn.up().down('#btnSearch').reset() ;
					//this.doLoad(true) ;
				},
				scope: this
			},Ext.create('Optima5.Modules.Spec.RsiRecouveo.SearchCombo',{
				optimaModule: this.optimaModule,
				
				hidden: this._reportMode,
				itemId: 'btnSearch',
				width: 150,
				listeners: {
					beforequeryload: this.onBeforeQueryLoad,
					select: this.onSearchSelect,
					scope: this
				}
			}),'->',{
				hidden: this._reportMode,
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
						itemId: 'account',
						text: 'Vue par compte',
						iconCls: 'op5-spec-rsiveo-grid-view-ordergroup'
					},{
						itemId: 'file',
						text: 'Vue par dossier',
						iconCls: 'op5-spec-rsiveo-grid-view-order'
					},{
						itemId: 'record',
						text: 'Vue par facture',
						iconCls: 'op5-spec-rsiveo-grid-view-facture'
					},{
						xtype: 'menuseparator'
					},{
						text: 'Top X / par encours',
						iconCls: 'op5-spec-rsiveo-grid-view-ordergroup',
						handler: function() {
							this.openFilesTopPanel() ;
						},
						scope: this
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
						},{
						xtype: 'menuseparator'
					},{
						xtype: 'menucheckitem',
						text: 'Afficher addresses ?',
						handler: null,
						listeners: {
							checkchange: function(mi,checked) {
								this.doShowAddress(checked) ;
							},
							scope: this
						}
					}]
				}
			},{
				iconCls: 'op5-spec-rsiveo-datatoolbar-refresh',
				text: 'Rafraichir',
				handler: function() {
					this.doLoad(true) ;
				},
				scope: this
			},{
				hidden: this._reportMode,
				iconCls: 'op5-spec-rsiveo-datatoolbar-new',
				text: 'Select.multiple',
				handler: function() {
					this.toggleMultiSelect() ;
				},
				scope: this
			},{
				hidden: this._reportMode,
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
				height: 320,
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
	doShowAddress: function(showAddress) {
		this.showAddress = showAddress ;
		this.configureViews() ;
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
			if( !atrRecord.is_filter ) {
				return ;
			}
			if( atrRecord.atr_type != 'account' ) {
				return ;
			}
			//console.dir(atrRecord) ;
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
		
		
		
		var factureColumns = [] ;
		factureColumns.push({
			hidden: true,
			dataIndex: 'record_id',
			align: 'center',
			text: 'ID',
			tdCls: 'op5-spec-dbstracy-boldcolumn',
			filter: {
				type: 'string'
			}
		},{
			dataIndex: 'record_ref',
			align: 'center',
			text: 'Facture',
			tdCls: 'op5-spec-dbstracy-boldcolumn',
			filter: {
				type: 'string'
			}
		},{
			dataIndex: 'record_date',
			text: 'Date',
			align: 'center',
			width: 90,
			renderer: Ext.util.Format.dateRenderer('d/m/Y'),
			filter: {
				type: 'date'
			}
		},{
			dataIndex: 'record_dateload',
			text: 'Intégration',
			align: 'center',
			width: 90,
			renderer: Ext.util.Format.dateRenderer('d/m/Y'),
			filter: {
				type: 'date'
			}
		},{
			dataIndex: 'record_amount_raw',
			text: 'Montant',
			align: 'center',
			renderer: Ext.util.Format.numberRenderer('0,000.00'),
			filter: {
				type: 'number'
			},
			summaryType: 'sum',
			summaryRenderer: function(value,summaryData,field,metaData) {
				return Ext.util.Format.number(value,'0,000.00') ;
			}
		},{
			dataIndex: 'record_amount_calcpaid',
			text: 'Payé',
			align: 'center',
			renderer: Ext.util.Format.numberRenderer('0,000.00'),
			filter: {
				type: 'number'
			},
			summaryType: 'sum',
			summaryRenderer: function(value,summaryData,field,metaData) {
				return Ext.util.Format.number(value,'0,000.00') ;
			}
		}) ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( atrRecord.atr_type != 'record' ) {
				return ;
			}
			factureColumns.push({
				cfgParam_id: 'ATR:'+atrRecord.atr_id,
				cfgParam_atrType: atrRecord.atr_type,
				text: atrRecord.atr_desc,
				dataIndex: atrRecord.atr_field,
				//rendererDataindex: atrRecord.bible_code + '_text',
				width:120,
				align: 'center',
				filter: {
					type: 'string'
				}
			}) ;
		}) ;
		var factureFields = [
			{name: 'record_filerecord_id', type: 'string'},
			{name: 'record_id', type: 'string'},
			{name: 'record_ref', type: 'string'},
			{name: 'record_date', type: 'date', dateFormat:'Y-m-d H:i:s'},
			{name: 'record_dateload', type: 'date', dateFormat:'Y-m-d H:i:s'},
			{name: 'record_amount_raw', type: 'number'},
			{name: 'record_amount_calcpaid', type: 'number'}
		] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( atrRecord.atr_type != 'record' ) {
				return ;
			}
			factureFields.push({
				name: atrRecord.atr_field,
				type: 'string'
			}) ;
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
			dataIndex: 'link_user_txt',
			renderer: function(v,m,r) {
				if( valt = r.get('ext_user_txt') ) {
					return valt ;
				}
				return v ;
			},
			filter: {
				type: 'stringlist',
				useFilters: true
			},
		},{
			itemId: 'colAtr',
			text: 'Attributs',
			columns: atrColumns
		},{
			text: 'Débiteur',
			columns: [{
				text: 'Entité',
				dataIndex: 'soc_txt',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:100,
				align: 'center',
				filter: {
					type: 'stringlist',
					useFilters: true
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
			},{
				hidden: true,
				hideable: false,
				text: 'Nom',
				dataIndex: 'adr_postal',
				width:150,
				align: 'left',
				renderer: function(v) {
					return Ext.util.Format.nl2br(v) ;
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
					if( r.get('status_closed_end') ) {
						return '' ;
					}
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
					if( r.get('status_closed_end') ) {
						return 'Fermé' ;
					}
					if( Ext.isEmpty(v) ) {
						return '' ;
					}
					var etaValue = r.get('next_eta_range') ;
					if( etaValue ) {
						var actionEtaMap = this._actionEtaMap ;
						if( actionEtaMap.hasOwnProperty(etaValue) ) {
							var actionEtaData = actionEtaMap[etaValue] ;
							metaData.style += 'background: '+actionEtaData.eta_color ;
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
			itemId: 'colFinance',
			text: 'Finance',
			columns: [{
				text: 'Nb Fact',
				dataIndex: 'inv_nb',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:80,
				align: 'center',
				summaryType: 'sum',
				summaryRenderer: function(value,summaryData,field,metaData) {
					return value ;
				},
				filter: {
					type: 'number'
				}
			},{
				text: 'Montant',
				dataIndex: 'inv_amount_total',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:100,
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
				text: 'Solde',
				dataIndex: 'inv_amount_due',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:100,
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
			hideable: true,
			itemId: 'colFact',
			text: 'Factures',
			columns: factureColumns
		},{
			itemId: 'colBalage',
			text: 'Balance âgée',
			columns: balageColumns,
			align: 'right'
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
			idProperty: 'id',
			fields: Ext.Array.merge(factureFields,balageFields,[
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
				ptype: 'rsiveouxgridfilters'
			}],
			store: {
				model: this.tmpModelName,
				data: [],
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			listeners: {
				itemdblclick: function( view, record, itemNode, index, e ) {
					this.handleOpenAccount(record.get('acc_id'),record.get('file_filerecord_id')) ;
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
		var pNorth = this.down('#pNorth') ;
		pNorth.removeAll() ;
		pNorth.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',{
			itemId: 'northWidgetCharts',
			width: 550,
			listeners: {
				polaritemclick: this.onPolarItemClick,
				scope: this
			}
		})) ;
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
		pNorthTab.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda', {
			title: 'Agenda',
			itemId: 'northWidgetAgenda',
			listeners: {
				agendaitemclick: this.onAgendaItemClick,
				scope: this
			}
		})) ;
		pNorthTab.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage', {
			title: 'Balance agée par statut',
            itemId: 'northWidgetBalage'
		}));
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
		this.down('#pCenter').down('#pGrid').headerCt.down('#colFact').items.each( function(col) {
			var doHide = false ;
			
			var atrColId = col.cfgParam_id ;
			if( Ext.isEmpty(atrColId) ) {
				return ;
			}
			if( !Ext.Array.contains(cfgParamIds,atrColId) ) {
				doHide = true ;
			}
			
			col.setVisible(!doHide) ;
		},this) ;
		
		
		var isFactView = (this.viewMode=='record') ;
		this.down('#pCenter').down('#pGrid').headerCt.down('#colFinance').setVisible(!isFactView) ;
		this.down('#pCenter').down('#pGrid').headerCt.down('#colFact').setVisible(isFactView) ;
		this.down('#pCenter').down('#pGrid').headerCt.down('#colBalage').setVisible(!isFactView) ;
		
		var showAddress = (this.showAddress) ;
		this.down('#pCenter').down('#pGrid').headerCt.down('[dataIndex="adr_postal"]').setVisible(showAddress) ;
	},

	toggleMultiSelect: function( torf ) {
		var column = this.down('#pCenter').down('#pGrid').headerCt.down('#colMultiSelect') ;
		if( torf === undefined ) {
			var torf = !column.isVisible()
		}
		if( this.viewMode != 'file' ) {
			torf = false ;
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
					if( authIsExt ) {
						cfgParamBtn.setReadOnly(true) ;
					}
				}
			}
			if( cfgParam_id=='USER' ) {
				if( authIsExt != null ) {
					cfgParamBtn.setValue(authIsExt,silent) ;
					//HACK ?
					var newValues = [cfgParamBtn.treepanel.getCheckedNode().getData()] ;
					cfgParamBtn.fillValues(newValues) ;
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
		if( this.filesTopPanel ) {
			this.filesTopPanel.destroy() ;
		}
			
			
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
				filter_archiveIsOn: (this.showClosed ? 1 : 0),
				load_address: (this.showAddress ? 1 : 0)
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
				this.ajaxLoadData = ajaxResponse.data ;
				if( this._reportMode ) {
					this.openFilesTopPanel() ;
				}
				this.onLoad(null, doClearFilters) ;
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
	getLoadData: function() {
		return this.ajaxLoadData ;
	},
	onLoad: function(ajaxData, doClearFilters) {
		if( !ajaxData ) {
			ajaxData = this.getLoadData() ;
		}
		if( !ajaxData ) {
			return ;
		}

		// Calcul des stats
		// - chaque statut => nb de dossiers / montant
		// - chaque action non réalisée


		if( this.viewMode == 'record' ) {
			//var indexedFiles = [] ;
			var newAjaxData = [] ;
			Ext.Array.each( ajaxData, function(fileRow) {
				var coef = ( (fileRow['inv_amount_total']!=0) ? (1-(fileRow['inv_amount_due']/fileRow['inv_amount_total'])) : 0 ) ;
				if( coef > 1 ) {
					//coef = 1 ;
				}
				Ext.Array.each(fileRow.records, function(fileRecordRow) {
					if( !Ext.isEmpty(fileRecordRow['type']) ) {
						return ;
					}
					var newRow = {} ;
					Ext.apply(newRow,fileRow) ;
					Ext.apply(newRow,fileRecordRow) ;
					newRow['record_amount_raw'] =  fileRecordRow['amount'] ;
					newRow['record_amount_calcpaid'] = fileRecordRow['amount'] * coef ;
					newRow['record_dateload'] = fileRecordRow['date_load'] ;
					newRow['record_date'] = fileRecordRow['date_record'] ;
					newAjaxData.push(newRow) ;
				});
			});
			ajaxData = newAjaxData ;
		}
		
		if( this.viewMode == 'account' ) {
			var newAjaxData = {} ;
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
		this.down('#pCenter').down('#pGrid').getStore().loadRawData([]) ;
		Ext.Array.each( this.down('#pCenter').down('#pGrid').getColumns(), function(column) {
			if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
				column.filter.resetList() ; // HACK!
			}
		}) ;
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;




		// charts
		var pNorth = this.down('#pNorth');
		pNorth.down('#northWidgetCharts').loadFilesData(ajaxData) ;
		pNorth.down('#northWidgetAgenda').loadFilesData(ajaxData) ;
		pNorth.down('#northWidgetBalage').loadFilesData(ajaxData) ;
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
			msg: RsiRecouveoLoadMsg.loadMsg
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
		if( this.filesTopPanel ) {
			this.filesTopPanel.destroy() ;
		}
		if( this.multiActionForm ) {
			this.multiActionForm.destroy() ;
		}
		this.callParent();
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
			}],
			
			listeners: {
				btnsubmit: this.onMultiSelectSubmit,
				scope: this
			}
		});
		createPanel.on('saved', function(p) {
			this.doTreeLoad() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.multiActionForm = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.multiActionForm = createPanel ;
	},
	onMultiSelectSubmit: function(p,formValues) {
		var ids = [] ;
		
		var gridPanel = this.down('#pCenter').down('#pGrid'),
			gridPanelStore = gridPanel.getStore() ;
		gridPanelStore.each( function(r) {
			if( r.get('_is_selection') && !Ext.Array.contains(ids,r.get('file_filerecord_id')) ) {
				ids.push( r.get('file_filerecord_id') ) ;
			}
		}) ;
		
		
		if( this.multiActionForm ) {
			this.multiActionForm.mask('Modifications en cours...') ;
		}
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_multiAction',
				
				select_fileFilerecordIds: Ext.JSON.encode(ids),
				target_form: Ext.JSON.encode(formValues)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.doLoad(false) ;
			},
			callback: function() {
				if( this.multiActionForm ) {
					this.multiActionForm.destroy() ;
				}
			},
			scope: this
		}) ;
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
	onAgendaItemClick: function( clickAgendaClass, clickEtaRange ) {
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

		var filters = [] ;
		if( !Ext.isEmpty(clickAgendaClass) ) {
			filters.push({
				exactMatch : true,
				property : 'next_agenda_class',
				value    :  clickAgendaClass
			}) ;
		}
		if( !Ext.isEmpty(clickEtaRange) ) {
			filters.push({
				exactMatch : true,
				property : 'next_eta_range',
				value    : clickEtaRange
			}) ;
		}
		if( filters.length>0 ) {
			gridPanelStore.filter(filters) ;
		}
	},
	
	
	handleDownload: function() {
		var mapFieldString = {} ;
		Ext.Array.each( this.down('#pCenter').down('#pGrid').getStore().getModel().getFields(), function(field) {
			mapFieldString[field.getName()] = Ext.Array.contains(['string'],field.getType()) ;
		}) ;
		
		var columns = [] ;
		Ext.Array.each( this.down('#pCenter').down('#pGrid').headerCt.getGridColumns(), function(column) {
			if( !column.isVisible(true) ) {
				return ;
			}
			columns.push({
				dataIndex: column.dataIndex,
				dataIndexString: mapFieldString[column.dataIndex],
				text: column.text
			});
		});
		
		var data = [] ;
		this.down('#pCenter').down('#pGrid').getStore().each( function(record) {
			var recData = record.getData(true) ;
			delete recData['actions'] ;
			delete recData['inv_balage'] ;
			delete recData['records'] ;
			data.push( recData ) ;
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
	},
	
	
	openFilesTopPanel: function() {
		if( this.filesTopPanel ) {
			this.filesTopPanel.destroy() ;
		}
		var filesTopPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesTopPanel',{
			optimaModule: this.optimaModule,
			loadData: this.getLoadData(),
			
			title: 'Top X / par encours',
			
			width:400, // dummy initial size, for border layout to work
			height:320, // ...
			floating: true,
			draggable: true,
			resizable: false,
			constrain: true,
			renderTo: this.getEl(),
			tools: [{
				hidden: this._reportMode,
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.close();
				},
				scope: this
			}]
		});
		filesTopPanel.on('saved', function(p,data) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').filters.clearFilters() ;
			
			this.down('#pCenter').down('#pGrid').getStore().sort('inv_amount_due','DESC') ;

			this.onLoad(data) ;
		},this) ;
		filesTopPanel.on('close',function(p) {
			this.filesTopPanel = null ;
			this.doLoad(true) ;
		},this,{single:true}) ;
		
		filesTopPanel.doApplyParams() ;
		filesTopPanel.show();
		filesTopPanel.getEl().alignTo(this.getEl(), 'tr-tr?');
		
		this.filesTopPanel = filesTopPanel ;
	}
});
