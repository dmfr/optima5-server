Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportFilesPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
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
			layout: 'fit',
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
			}),'->',{
				//iconCls: 'op5-spec-dbsembramach-report-clock',
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this.onViewSet( menuitem._queryLimit ) ;
						},
						scope:this
					},
					items: [{
						_queryLimit: 10,
						text: 'Top 10',
						iconCls: 'op5-spec-rsiveo-grid-view-order'
					},{
						_queryLimit: 20,
						text: 'Top 20',
						iconCls: 'op5-spec-rsiveo-grid-view-ordergroup'
					},{
						_queryLimit: 30,
						text: 'Top 30',
						iconCls: 'op5-spec-rsiveo-grid-view-ordergroup'
					}]
				}
			},{
				iconCls: 'op5-spec-rsiveo-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad(true) ;
				},
				scope: this
			}],
			items: [{
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
		
		this.buildViews() ;
		this.configureViews() ;
		
		this.onViewSet(10) ;
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
	
	onViewSet: function(queryLimit) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.down('[_queryLimit='+queryLimit+']'),
			iconCls, text ;
		if( tbViewmodeItem ) {
			this.queryLimit = queryLimit ;
		}
		// View mode
		var tbViewmodeItem = tbViewmode.menu.down('[_queryLimit='+queryLimit+']') ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( 'Vue '+'&#160;'+'<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		this.doLoad(true) ;
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
			return record.data.inv_balage[balageSegmtId] ; // BUG
		};
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			balageColumns.push({
				text: balageSegmt.segmt_txt,
				dataIndex: balageField,
				width:90,
				align: 'center',
				renderer: balageRenderer
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
				renderer: function(v,m,r) {
					return r.get('soc_txt') ;
				}
			},{
				text: 'No Compte',
				dataIndex: 'acc_id',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:100,
				align: 'center',
			},{
				text: 'Nom',
				dataIndex: 'acc_txt',
				width:150,
				align: 'center',
			}]
		},{
			itemId: 'colStatus',
			text: 'Statut',
			align: 'center',
			dataIndex: 'status_txt',
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
				renderer: function(v,metaData,r) {
					return v ;
				}
			},{
				text: 'Date',
				width: 100,
				dataIndex: 'next_date',
				align: 'center',
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
				summaryType: 'sum'
			},{
				text: 'Solde',
				dataIndex: 'inv_amount_due',
				tdCls: 'op5-spec-dbstracy-boldcolumn',
				width:90,
				align: 'center',
				renderer: function(value) {
					return Ext.util.Format.number(value,'0,000.00') ;
				},
				summaryType: 'sum'
			},{
				text: 'Montant<br>factures',
				dataIndex: 'inv_amount_total',
				width:90,
				align: 'center',
				renderer: function(value) {
					return Ext.util.Format.number(value,'0,000.00') ;
				},
				summaryType: 'sum'
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
			store: {
				remoteSort: true,
				remoteFilter: true,
				groupField: 'acc_id',
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
					this.handleOpenAccount(record.get('acc_id'),record.getId()) ;
				},
				scope :this
			},
			features: [{
				ftype: 'groupingsummary',
				hideGroupedHeader: false,
				enableGroupingMenu: false,
				enableNoGroups: false,
				groupHeaderTpl:Ext.create('Ext.XTemplate',
					'<div>{[this.renderer(values)]}</div>',
					{
						renderer: function(values) {
							if( values.rows.length == 0 ) {
								return '' ;
							}
							switch( values.groupField ) {
								case 'acc_id' :
									return values.rows[0].data.acc_id + ' / ' + values.rows[0].data.acc_txt ;
								default :
									return '' ;
							}
						}
					}
				)
			}],
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
	
	onSocSet: function() {
		this.configureViews() ;
		this.doLoad(true) ;
	},
	
	doLoad: function(doClearFilters) {
		var objAtrFilter = {}, arrSocFilter=null, arrUserFilter=null ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( Ext.isEmpty(cfgParamBtn.getValue()) ) {
				return ;
			}
			if( cfgParam_id=='SOC' ) {
				arrSocFilter = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getFileTopRecords',
				filter_soc: (arrSocFilter ? Ext.JSON.encode(arrSocFilter):''),
				filter_limit: this.queryLimit
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
		// grid 
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').getStore().sort('next_date','ASC') ;
		}
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
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
			msg:RsiRecouveoLoadMsg.loadMsg
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
	
	handleOpenAccount: function(accId,fileFilerecordId) {
		this.optimaModule.postCrmEvent('openaccount',{
			accId:accId,
			focusFileFilerecordId:fileFilerecordId,
			showClosed: this.showClosed
		}) ;
	}
	
});
