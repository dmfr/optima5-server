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
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetList'
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
						text: 'Afficher contacts ?',
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
				itemId: 'btnSelection',
				hidden: this._reportMode,
				iconCls: 'op5-spec-rsiveo-datatoolbar-new',
				text: 'Select.multiple',
				handler: function(){
					this.getGrid().toggleMultiSelect() ;
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
			},{
				hidden: true,
				itemId: 'tbNotifications',
				icon: 'images/op5img/ico_warning_16.gif',
				cls: 'op5-spec-rsiveo-button-red',
				text: 'Notifications',
				menu: [],
				handler: function(){
					this.openNotifications() ;
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

	getGrid: function(){
		return this.down('#pCenter').down('#pGrid') ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			case 'notificationchange' :
				this.onNotificationChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		this.doLoad() ;
	},
	onNotificationChange: function() {
		this.doLoadNotifications() ;
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
		var pCenter = this.down('#pCenter') ;
		
		this.down('#pCenter').removeAll() ;
		this.down('#pCenter') ;
		this.down('#pCenter').add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetList', {
			itemId: 'pGrid',
			listeners: {
				openaccount: this.handleOpenAccount,
				multiselect: this.onGridMultiSelect,
				scope: this
			},
			optimaModule: this.optimaModule
			//itemId: 'pCenter',
		}));

		// ******** Charts *****************
		var pNorth = this.down('#pNorth') ;
		pNorth.removeAll() ;
		pNorth.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',{
			itemId: 'northWidgetCharts',
			width: 550,
			listeners: {
				polaritemclick: this.onPolarItemClick,
				scope: this
			},
			optimaModule: this.optimaModule
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
			},
			optimaModule: this.optimaModule
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
		
		// Disable XE ?
		var hasXe = false ;
		Optima5.Modules.Spec.RsiRecouveo.HelperCache.getSocRootNode().cascadeBy( function(socNode) {
			var socRow = socNode.getData() ;
			if( !Ext.isEmpty(tbSocsSelected) && Ext.Array.contains(tbSocsSelected,socRow['soc_id']) ) {
				return ;
			}
			if( socRow['soc_xe_currency'] ) {
				hasXe = true ;
			}
		}) ;
		this.down('#pCenter').down('#pGrid').configureGrid(cfgParamIds, this.showAddress, this.viewMode, !hasXe) ;
	},


	
	applyAuth: function() {
		var helperCache = Optima5.Modules.Spec.RsiRecouveo.HelperCache,
			authId = helperCache.authHelperGetId(),
			authProfile = helperCache.authHelperGetProfile(),
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
				if( authProfile=='CR_AFF' ) {
					//TODO 2019-12-05 : auth
					cfgParamBtn.setValue(authId,silent) ;
				}
				if( authIsExt != null ) {
					cfgParamBtn.setValue(authIsExt,silent) ;
					//HACK ?
					var newValues = [cfgParamBtn.treepanel.getCheckedNode().getData()] ;
					cfgParamBtn.fillValues(newValues) ;
					cfgParamBtn.setValue(authIsExt,silent) ;
				}
			}
		}) ;
		if( authProfile=='CR_AFF' ) {
			//TODO 2019-12-05 : auth
			//this.down('toolbar > #btnSelection').setVisible(false) ;
		}
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
			userProfile = Optima5.Modules.Spec.RsiRecouveo.HelperCache.authHelperGetProfile(),
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
		if( this.notificationsPanel ) {
			this.notificationsPanel.destroy() ;
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
			timeout: (this.showAddress ? (10*60*1000) : null),
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_atr: Ext.JSON.encode(objAtrFilter),
				filter_soc: (arrSocFilter ? Ext.JSON.encode(arrSocFilter):''),
				filter_user: (arrUserFilter ? Ext.JSON.encode(arrUserFilter):''),
				filter_archiveIsOn: (this.showClosed ? 1 : 0),
				filter_fastMode: (this.viewMode=='record' ? 0 : 1),
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
		var pNorth = this.down('#pNorth');
		pNorth.down('#northWidgetCharts').loadFilesData(ajaxData) ;
		pNorth.down('#northWidgetAgenda').loadFilesData(ajaxData) ;
		pNorth.down('#northWidgetBalage').loadFilesData(ajaxData) ;

		this.down('#pCenter').down('#pGrid').loadFilesData(ajaxData, doClearFilters) ;
		
		this.doLoadNotifications() ;
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
		if( this.notificationsPanel ) {
			this.notificationsPanel.destroy() ;
		}
		if( this.multiActionForm ) {
			this.multiActionForm.destroy() ;
		}
		this.callParent();
	},
	
	onGridMultiSelect: function( widgetList, ids ) {
		this.handleMultiSelect(ids) ;
	},
	handleMultiSelect: function(ids) {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.MultiActionForm',{
			_arr_fileFilerecordIds: ids,
			
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
		var ids = p._arr_fileFilerecordIds ;
		if( Ext.isEmpty(ids) ) {
			return ;
		}
		
		var gridPanel = this.down('#pCenter').down('#pGrid'),
			gridPanelStore = gridPanel.getStore() ;
		gridPanelStore.each( function(r) {
			if( r.get('_is_selection') && !Ext.Array.contains(ids,r.get('file_filerecord_id')) ) {
				ids.push( r.get('file_filerecord_id') ) ;
			}
		}) ;
		if (formValues["multi_action"] == "export_grp"){
			if( this.multiActionForm ) {
				this.multiActionForm.destroy() ;
			}
			return this.handleMultiExport(ids) ;
		}
		
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

	handleMultiExport: function(arr_fileFilerecordIds){
		var ids = arr_fileFilerecordIds ;
		if( Ext.isEmpty(ids) ) {
			return ;
		}
		
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_rsi_recouveo',
			_action: 'xls_createGroupExport',
			select_fileFilerecordIds: Ext.JSON.encode(ids)
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
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
		Ext.Array.each( this.down('#pGrid').getColumns(), function(column) {
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
		var columnsKeys = [] ;
		Ext.Array.each( this.down('#pCenter').down('#pGrid').headerCt.getGridColumns(), function(column) {
			if( !column.isVisible(true) ) {
				return ;
			}
			var dataIndex = column.dataIndexExport || column.dataIndex
			columns.push({
				dataIndex: dataIndex,
				dataIndexString: mapFieldString[dataIndex],
				text: column.text
			});
			columnsKeys.push( dataIndex ) ;
		});
		
		var data = [] ;
		this.down('#pCenter').down('#pGrid').getStore().each( function(record) {
			var recData = record.getData(true) ;
			
			var exportData = {} ;
			Ext.Array.each( columnsKeys, function(k){
				exportData[k] = recData[k] ;
			}) ;
			data.push( exportData ) ;
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
	},
	
	
	
	
	_notificationsData: null,
	doLoadNotifications: function() {
		var arrSocFilter=null ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( Ext.isEmpty(cfgParamBtn.getValue()) ) {
				return ;
			}
			if( cfgParam_id=='SOC' ) {
				arrSocFilter = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_getNotifications',
				filter_soc: (arrSocFilter ? Ext.JSON.encode(arrSocFilter):'')
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				
				this.onLoadNotifications(ajaxResponse.data) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onLoadNotifications: function(ajaxDataNotifications) {
		var map_accId_enable = {} ;
		var ajaxDataMain = this.getLoadData() ;
		Ext.Array.each( ajaxDataMain, function(row) {
			var accId = row.acc_id ;
			map_accId_enable[accId] = true ;
		}) ;
		
		var notificationsData = [] ;
		Ext.Array.each( ajaxDataNotifications, function(row) {
			var accId = row.acc_id ;
			if( map_accId_enable[accId] ) {
				notificationsData.push(row) ;
			}
		}) ;
		this._notificationsData = notificationsData ;
		
		var hasNotifications = (notificationsData.length>0) ;
		this.down('toolbar').down('#tbNotifications').setVisible( hasNotifications ) ;
		if( hasNotifications && !(this.notificationsPanel===false) ) {
			if( !this.isVisible() ) {
				this.on('activate',function() {
					this.openNotifications() ;
				},this,{single: true, delay:10}) ;
			}
			this.openNotifications() ;
		}
	},
	openNotifications: function() {
		
		var notificationsData = this._notificationsData ;
		if( !notificationsData ) {
			return ;
		}
		/*
		this._accountRecord.notifications().each( function(rec) {
			notificationsData.push(rec.getData()) ;
		}) ;
		*/
		if( this.notificationsPanel ) {
			this.notificationsPanel.getStore().loadData( notificationsData ) ;
			this.notificationsPanel.doResize() ;
			return ;
		}
		
		var notificationsPanel = Ext.create('Ext.grid.Panel',{
			optimaModule: this.optimaModule,
			
			title: 'Notifications',
			
			store: {
				model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getNotificationModel(),
				data: [],
				sorters: [{
					property: 'date_notification',
					direction: 'ASC'
				}],
				proxy: {
					type: 'memory'
				}
			},
			plugins: [{
				ptype: 'rsiveouxgridfilters'
			}],
			columns: {
				defaults: {
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: true,
					groupable: false,
					lockable: false
				},
				items: [{
					width: 36,
					renderer: function(v,m,r) {
						m.tdCls += ' op5-spec-rsiveo-notification' ;
					}
				},{
					flex: 1,
					//xtype: 'datecolumn',
					text: 'Compte',
					format: 'd/m/Y',
					dataIndex: 'acc_id',
					renderer: function(v,m,r) {
						var txt = '<div>'+v+'</div>' ;
						txt += '<div style="font-size: 10px; padding-left:6px">'+r.get('acc_txt')+'</div>' ;
						return txt ;
					}
				},{
					width: 110,
					text: 'Date',
					dataIndex: 'date_notification',
					sortable: true,
					renderer: function(v,m,r) {
						var txt = '' ;
						txt += '<div style="font-size: 10px; padding-left:6px">'+Ext.util.Format.date(r.get('date_notification'),'d/m H:i')+'</div>' ;
						return txt ;
					}
				},{
					width: 110,
					text: 'Action',
					dataIndex: 'txt_notification',
					sortable: true,
					menuDisabled: false,
					renderer: function(v,m,r) {
						var txt = '<div>'+r.get('txt_notification')+'</div>' ;
						return txt ;
					},
					filter: {
						type: 'stringlist'
					}
				},{
					width: 100,
					text: 'Encours',
					dataIndex: 'acc_amount_due',
					sortable: true,
					align: 'right',
					renderer: function(v,m,r) {
						var txt = '' ;
						txt += '<div>'+Ext.util.Format.number(v,'0,000')+'&nbsp;€'+'</div>' ;
						return txt ;
					}
				}]
			},
			//hideHeaders: true,
			listeners: {
				itemdblclick: function( view, record, itemNode, index, e ) {
					this.handleOpenAccount(record.get('acc_id')) ;
				},
				scope: this
			},
			
			frame: true,
			
			width:510,
			height:100,
			floating: true,
			draggable: false,
			resizable: false,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy() ;
				},
				scope: this
			}],
			_parentCmp: this,
			doResize: function() {
				var parentCmp = this._parentCmp ;
				if( !parentCmp.getEl() ) {
					return ;
				}
				var targetHeight = (parentCmp.getEl().getHeight() * 1) ;
				this.setHeight( targetHeight ) ;
				this.getEl().alignTo(parentCmp.getEl(), 'tl-br?')
			}
		});
		
		notificationsPanel.on('destroy',function(p) {
			this.notificationsPanel = false ;
		},this,{single:true}) ;
		
		notificationsPanel.show();
		notificationsPanel.doResize() ;
		this.notificationsPanel = notificationsPanel ;
		this.notificationsPanel.mon(this,'resize', function(p){
			p.notificationsPanel.doResize() ;
		},this);
		
		notificationsPanel.getStore().loadData(notificationsData) ;
	}
});
