Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportFilesPanel', {
	extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	alias: 'widget.op5specrsiveoreportfilespanel',
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage'
	],
	_ajaxData: null,
	_filesWidgetList : null,
	_listCnt: null,
	initComponent: function () {
		Ext.apply(this,{
			_hideDates: true,
			//xtype: 'panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:[{
				xtype: 'panel',
				border: true,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',{
					itemId: 'northWidgetChart',
					title: 'Répartition statuts',
					optimaModule: this.optimaModule,
					width: 550
				}),{
					xtype:'box',
					width: 2,
					style: 'background-color: gray'
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage', {
					itemId: 'northWidgetBalage',
					title: 'Balance agée par statut',
					flex: 1
				})]
			},{
				xtype: 'panel',
				border: true,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda', {
					flex: 1,
					itemId: 'centerWidgetAgendaCount',
					_reportType: 'S2P_PAY',
					listeners: {
						agendaitemclick: this.onAgendaItemClick,
						scope: this
					},

					title: 'Agenda: Nombre de dossiers',
					_defaultMode: 'count',
					_dashboardMode: true,
					_hideForm: true,
					optimaModule: this.optimaModule
				}),,{
					xtype:'box',
					width: 2,
					style: 'background-color: gray'
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda', {
					flex: 1,
					itemId: 'centerWidgetAgendaAmount',
					title: 'Agenda: Devise en euro',
					_defaultMode: 'amount',
					_hideForm: true,
					listeners: {
						agendaitemclick: this.onAgendaItemClick,
						scope: this
					},
				})]
			}]
		}),
		this.callParent() ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
		this.doLoad();
	},
	onTbarChanged: function( filterValues ) {
		this.doLoad() ;
	},
	doLoad: function() {
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
				this._ajaxData = ajaxResponse.data;
				this.onLoad() ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function() {
		var ajaxData = this._ajaxData ;
		this.down('#northWidgetChart').loadFilesData( ajaxData ) ;
		this.down('#northWidgetBalage').loadFilesData( ajaxData ) ;
		this.down('#centerWidgetAgendaCount').loadFilesData( ajaxData ) ;
		this.down('#centerWidgetAgendaAmount').loadFilesData( ajaxData ) ;
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
	onAgendaItemClick: function( clickAgendaClass, clickEtaRange) {
		// Filtre par sociétés => params à affficher
		var tbSocsSelected ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( cfgParam_id=='SOC' ) {
				tbSocsSelected = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(tbSocsSelected), function(atrId) {
			
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		
		
		
		
		// Masque
		if( !this.getEl() ) {
			return ;
		}
		this.getEl().mask() ;
		
		
		// Création du popup
		var curWidth = this.getEl().getWidth(),
			curHeight = this.getEl().getHeight() ;
		var filesWidgetList = Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetList', {
			itemId: 'pList',
			listeners: {
				openaccount: this.handleOpenAccount,
				multiselect: this.onGridMultiSelect,
				scope: this,
			},
			scope: this,
			optimaModule: this.optimaModule
		}) ;
		var listCnt = Ext.create('Ext.panel.Panel', {
			height:(curHeight*0.8),
			width:(curWidth*0.8),
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			constrain: true,
			closable: true,
			frame: true,
			scrollable: true,
			title: 'Liste des dossiers',
			layout: 'fit',
			tbar: [{
				iconCls: 'op5-spec-rsiveo-datatoolbar-new',
				text: 'Select.multiple',
				handler: function(){
					this._filesWidgetList.toggleMultiSelect() ;
				},
				scope: this
			},{
				iconCls: 'op5-spec-rsiveo-datatoolbar-file-export-excel',
				text: 'Export',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}],
			items: [filesWidgetList]
		}) ;
		listCnt.down('#pList').on('destroy', function(p){
			this.getEl().unmask() ;
			this._filesWidgetList = null ;
		},this,{single:true}) ;
		listCnt.on('destroy', function(p){
			this.getEl().unmask() ;
			this.listCnt = null ;
		},this,{single:true}) ;
		listCnt.down('#pList').configureGrid(cfgParamIds, false, 'file') ;
		listCnt.down('#pList').loadFilesData(this._ajaxData, true) ;
		listCnt.down('#pList').getEl().alignTo(this.getEl(), 'c-c?');
		listCnt.show();
		this._filesWidgetList = filesWidgetList ;
		this._listCnt = listCnt;
		
		
		// Filtres : TODO: déplacer dans FilesWidgetList
		var gridPanel = filesWidgetList,
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
		Ext.Array.each( this._filesWidgetList.getStore().getModel().getFields(), function(field) {
			mapFieldString[field.getName()] = Ext.Array.contains(['string'],field.getType()) ;
		}) ;

		var columns = [] ;

		Ext.Array.each( this._filesWidgetList.headerCt.getGridColumns(), function(column) {
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
		this._filesWidgetList.getStore().each( function(record) {
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
	
	onBeforeDestroy: function() {
		if( this._filesWidgetList ) {
			this._filesWidgetList.destroy() ;
		}
		if (this._listCnt){
			this._listCnt.onDestroy() ;
		}
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

		var gridPanel = this._filesWidgetList,
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
				this._filesWidgetList.loadFilesData(this._ajaxData, false) ;
				//this.doLoad(false) ;
			},
			callback: function() {
				if( this.multiActionForm ) {
					this.multiActionForm.destroy() ;
				}
			},
			scope: this
		}) ;
	},
})
